import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from '@trpc/server';
import { notifyOwner } from './_core/notification';
import * as playermakerApi from './playermakerApi';
import * as db from "./db";
import { getDb } from "./db";
import * as dbPermissions from "./dbPermissions";
import { AIService } from "./aiService";
import { performanceRouter } from "./performanceRouter";
import { parentDashboardRouter } from "./parentDashboardRouter";
import { parentEducationRouter } from "./parentEducation";
import { progressReportRouter } from "./progressReportRouter";
import { messagingRouter } from "./messagingRouter";
import * as aiCache from "./aiCacheService";
import * as cacheWarmup from "./cacheWarmup";
import * as cacheInvalidation from "./cacheInvalidation";
import { sendWelcomeEmail, sendRejectionEmail } from "./emailNotifications";
import { sendBookingConfirmationToUser, sendBookingConfirmationToCoach, sendTestimonialApprovalEmail } from "./emailService";
import { sendBookingConfirmationWhatsApp, sendCoachBookingNotificationWhatsApp } from "./whatsappService";
import {
  qrCheckInRouter, socialMediaRouter, emailCampaignsRouter, referralRouter,
  scoutNetworkRouter, nutritionAIRouter, injuryPreventionRouter,
  educationAcademyRouter, vrTrainingRouter
} from "./routers_new_features";
import { populateComprehensiveData } from "./dataPopulation";
import { recommendPositions, getTopPositionRecommendations, getPositionTransitionSuggestions, PlayerSkills } from "./positionRecommendation";
import { 
  MatchEventSession, homePageContent, performanceMetrics, forumPosts, forumVotes, forumReplies, forumCategories,
  players, playerMatchStats, teams, matches, trainingSessions, injuries, notifications, users,
  playerSkillScores, matchEvents, testimonials, privateTrainingBookings, coachProfiles, contactSubmissions,
  userStreaks, streakRewards, blogPosts, enrollmentSubmissions, careerApplications
} from "../drizzle/schema";
import { desc, eq, sql, and, or, gte, lte, like, isNull, asc, inArray } from "drizzle-orm";
import { checkAndAwardBadges, initializeDefaultBadges } from "./badgeService";
import { checkAndUpdateChallengeProgress, claimChallengeReward, initializeWeeklyChallenges } from "./challengeService";

// Role-based procedure helpers
const coachProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'coach'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access required' });
  }
  return next({ ctx });
});

const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ==================== XG ANALYTICS ====================
const xgAnalyticsRouter = router({
    getMatchData: publicProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const summary = await db.getMatchXGSummary(input.matchId);
        if (!summary) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }
        
        // Get match details
        const match = await db.getMatchById(input.matchId);
        const team = match?.teamId ? await db.getTeamById(match.teamId) : null;
        
        return {
          matchId: input.matchId,
          homeTeam: team?.name || 'Home Team',
          awayTeam: match?.opponent || 'Away Team',
          date: match?.matchDate?.toISOString() || new Date().toISOString(),
          score: {
            home: match?.teamScore || 0,
            away: match?.opponentScore || 0,
          },
          shots: summary.shots.map(s => ({
            id: s.id,
            teamId: s.teamId,
            playerId: s.playerId || 0,
            playerName: s.playerName,
            x: s.positionX,
            y: s.positionY,
            xG: Number(s.xGValue),
            isGoal: s.isGoal,
            minute: s.minute,
          })),
          passes: summary.passes.map(p => ({
            id: p.id,
            teamId: p.teamId,
            from: p.fromPlayerId || 0,
            to: p.toPlayerId || 0,
            fromName: p.fromPlayerName,
            toName: p.toPlayerName,
            x1: p.fromX,
            y1: p.fromY,
            x2: p.toX,
            y2: p.toY,
            xA: Number(p.xAValue),
            success: p.isSuccessful,
          })),
          defensiveActions: summary.defensiveActions.map(d => ({
            id: d.id,
            teamId: d.teamId,
            playerId: d.playerId || 0,
            playerName: d.playerName,
            type: d.actionType,
            x: d.positionX,
            y: d.positionY,
            success: d.isSuccessful,
            minute: d.minute,
          })),
          teamStats: {
            home: summary.teamStats[0] || {
              xG: 0,
              actualGoals: 0,
              shots: 0,
              shotsOnTarget: 0,
              passAccuracy: 0,
              possession: 50,
            },
            away: summary.teamStats[1] || {
              xG: 0,
              actualGoals: 0,
              shots: 0,
              shotsOnTarget: 0,
              passAccuracy: 0,
              possession: 50,
            },
          },
          playerStats: [], // TODO: Calculate from shots/passes data
        };
      }),
    
    createShot: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        xGValue: z.number(),
        isGoal: z.boolean(),
        isOnTarget: z.boolean().optional(),
        shotType: z.enum(['right_foot', 'left_foot', 'header', 'other']).optional(),
        situation: z.enum(['open_play', 'corner', 'free_kick', 'penalty', 'counter_attack']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchShot(input);
        return { success: true, id };
      }),
    
    createPass: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        fromPlayerId: z.number().optional(),
        fromPlayerName: z.string(),
        toPlayerId: z.number().optional(),
        toPlayerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        fromX: z.number(),
        fromY: z.number(),
        toX: z.number(),
        toY: z.number(),
        xAValue: z.number(),
        isSuccessful: z.boolean(),
        isKeyPass: z.boolean().optional(),
        isAssist: z.boolean().optional(),
        passType: z.enum(['short', 'long', 'through_ball', 'cross', 'corner', 'free_kick']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchPass(input);
        return { success: true, id };
      }),
    
    createDefensiveAction: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        teamId: z.number(),
        minute: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        actionType: z.enum(['tackle', 'interception', 'block', 'clearance', 'aerial_duel']),
        isSuccessful: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMatchDefensiveAction(input);
        return { success: true, id };
      }),
});
// ==================== ENROLLMENT SUBMISSIONS ====================
const enrollmentRouter = router({
  submit: publicProcedure
    .input(z.object({
      studentFirstName: z.string().min(1),
      studentLastName: z.string().min(1),
      dateOfBirth: z.string(),
      gender: z.enum(["male", "female"]),
      parentFirstName: z.string().min(1),
      parentLastName: z.string().min(1),
      parentEmail: z.string().email(),
      parentPhone: z.string().min(1),
      program: z.enum(["beginner", "intermediate", "advanced", "elite"]),
      ageGroup: z.string().min(1),
      preferredPosition: z.enum(["goalkeeper", "defender", "midfielder", "forward", "any"]).default("any"),
      previousExperience: z.string().optional(),
      medicalConditions: z.string().optional(),
      emergencyContact: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      await database.insert(enrollmentSubmissions).values({
        ...input,
        dateOfBirth: new Date(input.dateOfBirth),
        status: 'pending',
      });
      
      // Notify admin about new enrollment
      await notifyOwner({
        title: '📝 New Enrollment Submission',
        content: `New enrollment submission from ${input.parentFirstName} ${input.parentLastName} for student ${input.studentFirstName} ${input.studentLastName}`,
      });
      
      return { success: true };
    }),
  
  getAll: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) return [];
    
    const result = await database
      .select()
      .from(enrollmentSubmissions)
      .orderBy(desc(enrollmentSubmissions.createdAt));
    
    return result;
  }),
  
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "contacted"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      // Get enrollment details before updating
      const [enrollment] = await database
        .select()
        .from(enrollmentSubmissions)
        .where(eq(enrollmentSubmissions.id, input.id));
      
      // Update status
      await database
        .update(enrollmentSubmissions)
        .set({ status: input.status, notes: input.notes })
        .where(eq(enrollmentSubmissions.id, input.id));
      
      // Send email if approved
      if (input.status === 'approved' && enrollment) {
        const emailSubject = 'Welcome to Future Stars FC - Free Evaluation Session & Team Placement';
        const emailBody = `
Dear ${enrollment.parentFirstName} ${enrollment.parentLastName},

Congratulations! We are pleased to inform you that ${enrollment.studentFirstName} ${enrollment.studentLastName}'s enrollment application has been approved.

=== FREE EVALUATION SESSION ===

As part of our onboarding process, we would like to invite ${enrollment.studentFirstName} for a FREE evaluation session. This comprehensive assessment will include:

1. SKILL ASSESSMENT
   - Technical abilities (ball control, passing, shooting, dribbling)
   - Physical attributes (speed, agility, stamina, strength)
   - Tactical understanding (positioning, decision-making)
   - Mental attributes (focus, teamwork, attitude)

2. TEAM PLACEMENT
   Based on the evaluation, ${enrollment.studentFirstName} will be placed in one of our two team structures:

   🏆 MAIN TEAM
   - Competitive leagues and tournaments
   - Class A competitions
   - Advanced training programs
   - Regular match play against top academies

   ⚽ ACADEMY TEAM
   - Focused skill development training
   - Friendly cups and internal competitions
   - Foundation building program
   - Pathway to Main Team promotion

3. PERSONALIZED DEVELOPMENT PLAN
   - Individual Development Plan (IDP) creation
   - Goal setting and milestone tracking
   - Regular progress reports for parents
   - Access to our Parent Portal for real-time updates

=== NEXT STEPS ===

Please contact us to schedule the evaluation session at your convenience:

📧 Email: info@futurestarsfc.com
📱 WhatsApp: +201004186970
📞 Phone: ${enrollment.parentPhone || 'Contact us for details'}

We look forward to welcoming ${enrollment.studentFirstName} to the Future Stars FC family!

Best regards,
Future Stars FC Team

---
Future Stars Football Academy
Developing Champions On and Off the Field
        `.trim();
        
        // Log email (in production, integrate with actual email service)
        console.log('=== ENROLLMENT APPROVAL EMAIL ===');
        console.log('To:', enrollment.parentEmail);
        console.log('Subject:', emailSubject);
        console.log('Body:', emailBody);
        console.log('================================');
        
        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        // await sendEmail(enrollment.parentEmail, emailSubject, emailBody);
      }
      
      return { success: true };
    }),
});

// ==================== BLOG POSTS ====================
const blogRouter = router({  getAll: publicProcedure
    .input(z.object({
      category: z.enum(["news", "training", "events", "achievements", "general"]).optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      
      let query = database
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          coverImage: blogPosts.coverImage,
          category: blogPosts.category,
          publishedAt: blogPosts.publishedAt,
          viewCount: blogPosts.viewCount,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(blogPosts)
        .innerJoin(users, eq(blogPosts.authorId, users.id))
        .where(eq(blogPosts.status, 'published'))
        .orderBy(desc(blogPosts.publishedAt));
      
      if (input.category) {
        query = query.where(and(
          eq(blogPosts.status, 'published'),
          eq(blogPosts.category, input.category)
        ));
      }
      
      const result = await query.limit(input.limit);
      return result;
    }),
  
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      
      const [post] = await database
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          content: blogPosts.content,
          coverImage: blogPosts.coverImage,
          category: blogPosts.category,
          publishedAt: blogPosts.publishedAt,
          viewCount: blogPosts.viewCount,
          authorName: users.name,
          authorAvatar: users.avatarUrl,
        })
        .from(blogPosts)
        .innerJoin(users, eq(blogPosts.authorId, users.id))
        .where(and(
          eq(blogPosts.slug, input.slug),
          eq(blogPosts.status, 'published')
        ));
      
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      
      // Increment view count
      await database
        .update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, post.id));
      
      return post;
    }),
  
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      excerpt: z.string().min(1),
      content: z.string().min(1),
      coverImage: z.string().optional(),
      category: z.enum(["news", "training", "events", "achievements", "general"]),
      status: z.enum(["draft", "published", "archived"]).default("draft"),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      await database.insert(blogPosts).values({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === 'published' ? new Date() : null,
      });
      
      return { success: true };
    }),
  
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      coverImage: z.string().optional(),
      category: z.enum(["news", "training", "events", "achievements", "general"]).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      const { id, ...updateData } = input;
      
      // If status is being changed to published and publishedAt is null, set it
      if (updateData.status === 'published') {
        const [post] = await database.select().from(blogPosts).where(eq(blogPosts.id, id));
        if (post && !post.publishedAt) {
          await database
            .update(blogPosts)
            .set({ ...updateData, publishedAt: new Date() })
            .where(eq(blogPosts.id, id));
          return { success: true };
        }
      }
      
      await database
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id));
      
      return { success: true };
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error('Database not available');
      
      await database
        .delete(blogPosts)
        .where(eq(blogPosts.id, input.id));
      
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  xgAnalytics: xgAnalyticsRouter,
  parentDashboard: parentDashboardRouter,
  parentEducation: parentEducationRouter,
  progressReport: progressReportRouter,
  messaging: messagingRouter,
  blog: blogRouter,
  enrollments: enrollmentRouter,
  
  // ==================== FILE UPLOAD ====================
  upload: router({
    uploadFile: protectedProcedure
      .input(z.object({
        fileData: z.string(),
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = input.fileName.split('.').pop();
        const fileKey = `uploads/${timestamp}-${randomStr}.${extension}`;
        
        // Upload to S3
        const result = await storagePut(fileKey, buffer, input.contentType);
        
        return {
          fileKey: result.key,
          url: result.url,
        };
      }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER REGISTRATION ====================
  userRegistration: router({
    register: publicProcedure
      .input(z.object({
        requestedRole: z.enum(['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'parent', 'player']),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if email already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email already registered' });
        }
        
        await db.createPendingUser({
          name: input.name,
          email: input.email,
          phone: input.phone,
          requestedRole: input.requestedRole,
        });
        
        return { success: true };
      }),
  }),

  // ==================== USER MANAGEMENT ====================
  users: router({
    getAll: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer', 'parent', 'player']) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    approveUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        await db.approveUser(input.userId);
        if (user && user.email && user.name) {
          await sendWelcomeEmail(user.email, user.name);
        }
        return { success: true };
      }),
    rejectUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        await db.rejectUser(input.userId);
        if (user && user.email && user.name) {
          await sendRejectionEmail(user.email, user.name);
        }
        return { success: true };
      }),
    updateStatus: adminProcedure
      .input(z.object({
        userId: z.number(),
        newStatus: z.enum(['pending', 'approved', 'rejected'])
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        await database
          .update(users)
          .set({ 
            accountStatus: input.newStatus,
            updatedAt: new Date()
          })
          .where(eq(users.id, input.userId));
        return { success: true };
      }),
    completeOnboarding: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markOnboardingComplete(ctx.user.id);
        return { success: true };
      }),
    updateWhatsAppSettings: protectedProcedure
      .input(z.object({
        whatsappPhone: z.string().nullable(),
        whatsappNotifications: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateWhatsAppSettings(ctx.user.id, input.whatsappPhone, input.whatsappNotifications);
        return { success: true };
      }),
  }),

  // ==================== PLAYERS ====================
  players: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllPlayers();
    }),
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerById(input.id);
      }),
    getByTeam: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayersByTeam(input.teamId);
      }),
    getByTeamType: staffProcedure
      .input(z.object({ teamType: z.enum(['main', 'academy']) }))
      .query(async ({ input }) => {
        return db.getPlayersByTeamType(input.teamType);
      }),
    getByAgeGroup: staffProcedure
      .input(z.object({ ageGroup: z.string() }))
      .query(async ({ input }) => {
        return db.getPlayersByAgeGroup(input.ageGroup);
      }),
    getForParent: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'parent') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access only' });
      }
      return db.getPlayersForParent(ctx.user.id);
    }),
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerByUserId(input.userId);
      }),
    create: coachProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string(),
        position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']),
        preferredFoot: z.enum(['left', 'right', 'both']).optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        jerseyNumber: z.number().optional(),
        ageGroup: z.string().optional(),
        teamId: z.number().optional(),
        status: z.enum(['active', 'injured', 'inactive', 'trial']).optional(),
        joinDate: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPlayer({
          ...input,
          dateOfBirth: new Date(input.dateOfBirth),
          joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
        });
        return { id };
      }),

    // Update player team assignment
    updateTeam: adminProcedure
      .input(z.object({
        playerId: z.number(),
        teamId: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePlayer(input.playerId, { teamId: input.teamId });
        await cacheInvalidation.smartInvalidate({ type: "player", playerId: input.playerId, comprehensive: true });
        return { success: true };
      }),

    // Update player
    updatePlayer: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        position: z.enum(["goalkeeper", "defender", "midfielder", "forward"]).optional(),
        preferredFoot: z.enum(["left", "right", "both"]).optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        jerseyNumber: z.number().optional(),
        ageGroup: z.string().optional(),
        status: z.enum(["active", "injured", "inactive", "trial"]).optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updated = await db.updatePlayer(input.id, input);
        // Invalidate player cache after update
        await cacheInvalidation.smartInvalidate({ type: "player", playerId: input.id, comprehensive: true });
        return updated;
      }),
    getOverallStats: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerOverallStats(input.playerId);
      }),

    // Performance history for comparison
    getPerformanceHistory: staffProcedure
      .input(z.object({ 
        playerId: z.number(),
        matchCount: z.number().default(5),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Get last N matches for the player
        const matchStats = await database
          .select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(input.matchCount);

        if (matchStats.length === 0) {
          return { matches: [], summary: null };
        }

        // Calculate metrics
        const matches = matchStats.reverse().map((stat, index) => ({
          matchNumber: index + 1,
          distance: (stat.distanceCovered || 0) / 1000, // Convert to km
          sprints: stat.sprints || 0,
          avgSpeed: stat.topSpeed ? (stat.topSpeed * 0.6) : 0, // Estimate avg as 60% of top
          maxSpeed: stat.topSpeed || 0,
          avgHeartRate: 0, // Not available in current schema
        }));

        // Calculate summary statistics
        const summary = {
          best: {
            distance: Math.max(...matches.map(m => m.distance)),
            sprints: Math.max(...matches.map(m => m.sprints)),
            avgSpeed: Math.max(...matches.map(m => m.avgSpeed)),
            maxSpeed: Math.max(...matches.map(m => m.maxSpeed)),
            avgHeartRate: 0,
          },
          average: {
            distance: matches.reduce((sum, m) => sum + m.distance, 0) / matches.length,
            sprints: matches.reduce((sum, m) => sum + m.sprints, 0) / matches.length,
            avgSpeed: matches.reduce((sum, m) => sum + m.avgSpeed, 0) / matches.length,
            maxSpeed: matches.reduce((sum, m) => sum + m.maxSpeed, 0) / matches.length,
            avgHeartRate: 0,
          },
          latest: {
            distance: matches[matches.length - 1].distance,
            sprints: matches[matches.length - 1].sprints,
            avgSpeed: matches[matches.length - 1].avgSpeed,
            maxSpeed: matches[matches.length - 1].maxSpeed,
            avgHeartRate: 0,
          },
        };

        return { matches, summary };
      }),

    // Generate AI insights for performance trends
    generatePerformanceInsights: staffProcedure
      .input(z.object({ 
        playerId: z.number(),
        matchCount: z.number().default(5),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Get player info
        const player = await database
          .select()
          .from(players)
          .where(eq(players.id, input.playerId))
          .limit(1);

        if (!player || player.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' });
        }

        // Get performance history
        const matchStats = await database
          .select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.id))
          .limit(input.matchCount);

        if (matchStats.length === 0) {
          return { insights: 'Not enough performance data available for analysis.' };
        }

        // Prepare data for AI
        const performanceData = matchStats.reverse().map((stat, index) => ({
          matchNumber: index + 1,
          distance: ((stat.distanceCovered || 0) / 1000).toFixed(2) + ' km',
          sprints: stat.sprints || 0,
          maxSpeed: (stat.topSpeed || 0).toFixed(1) + ' km/h',
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          minutesPlayed: stat.minutesPlayed || 0,
        }));

        const { invokeLLM } = await import('./_core/llm');
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert football performance analyst. Analyze player performance trends and provide actionable insights.'
            },
            {
              role: 'user',
              content: `Analyze the performance trend for ${player[0].firstName} ${player[0].lastName} (${player[0].position}) over the last ${input.matchCount} matches:\n\n${JSON.stringify(performanceData, null, 2)}\n\nProvide:\n1. **Performance Trend**: Is the player improving, declining, or stable?\n2. **Key Strengths**: What metrics show consistent excellence?\n3. **Areas for Improvement**: Which aspects need attention?\n4. **Training Recommendations**: Specific drills or focus areas\n5. **Match Readiness**: Current fitness and form assessment`
            }
          ]
        });

        const insights = response.choices[0]?.message?.content || 'Unable to generate insights at this time.';
        return { insights };
      }),
  }),

  // ==================== TEAMS ====================
  teams: router({
    getAll: protectedProcedure.query(async () => {
      return db.getAllTeams();
    }),
    getByType: protectedProcedure
      .input(z.object({ teamType: z.enum(['main', 'academy']) }))
      .query(async ({ input }) => {
        return db.getTeamsByType(input.teamType);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        ageGroup: z.string().min(1),
        teamType: z.enum(['main', 'academy']).optional(),
        headCoachId: z.number().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTeam(input);
        return { id };
      }),
    // Coach assignment procedures
    getCoaches: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamCoaches(input.teamId);
      }),
    assignCoach: adminProcedure
      .input(z.object({
        teamId: z.number(),
        coachUserId: z.number(),
        role: z.enum(['head_coach', 'assistant_coach', 'goalkeeper_coach', 'fitness_coach', 'analyst']).optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.assignCoachToTeam({
          teamId: input.teamId,
          coachUserId: input.coachUserId,
          role: input.role || 'assistant_coach',
          isPrimary: input.isPrimary || false,
          assignedBy: ctx.user.id,
        });
        return { id };
      }),
    removeCoach: adminProcedure
      .input(z.object({ teamId: z.number(), coachUserId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeCoachFromTeam(input.teamId, input.coachUserId);
        return { success: true };
      }),
    updateCoachRole: adminProcedure
      .input(z.object({
        assignmentId: z.number(),
        role: z.enum(['head_coach', 'assistant_coach', 'goalkeeper_coach', 'fitness_coach', 'analyst']),
        isPrimary: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCoachRole(input.assignmentId, input.role, input.isPrimary);
        return { success: true };
      }),
    getAllCoachAssignments: adminProcedure.query(async () => {
      return db.getAllTeamCoachAssignments();
    }),
    getAvailableCoaches: adminProcedure.query(async () => {
      return db.getAvailableCoaches();
    }),
    getMyTeams: protectedProcedure.query(async ({ ctx }) => {
      return db.getCoachTeams(ctx.user.id);
    }),
  }),

  // ==================== PERFORMANCE METRICS ====================
  performance: router({
    getPlayerSkills: performanceRouter.getPlayerSkills,
    getAll: staffProcedure
      .query(async () => {
        const database = await getDb();
        if (!database) return [];
        return database.select().from(performanceMetrics).orderBy(desc(performanceMetrics.sessionDate)).limit(1000);
      }),
    getPlayerMetrics: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerPerformanceMetrics(input.playerId, input.limit);
      }),
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestPerformanceMetric(input.playerId)) ?? null;
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionDate: z.string(),
        sessionType: z.enum(['training', 'match', 'assessment']),
        touches: z.number().optional(),
        passes: z.number().optional(),
        passAccuracy: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        dribbles: z.number().optional(),
        successfulDribbles: z.number().optional(),
        distanceCovered: z.number().optional(),
        topSpeed: z.number().optional(),
        sprints: z.number().optional(),
        accelerations: z.number().optional(),
        decelerations: z.number().optional(),
        possessionWon: z.number().optional(),
        possessionLost: z.number().optional(),
        interceptions: z.number().optional(),
        tackles: z.number().optional(),
        technicalScore: z.number().optional(),
        physicalScore: z.number().optional(),
        tacticalScore: z.number().optional(),
        overallScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createPerformanceMetric({
          ...input,
          sessionDate: new Date(input.sessionDate),
          recordedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== MENTAL ASSESSMENTS ====================
  mental: router({
    getPlayerAssessments: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerMentalAssessments(input.playerId, input.limit);
      }),
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestMentalAssessment(input.playerId)) ?? null;
      }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number(),
        assessmentDate: z.string(),
        confidenceLevel: z.number().min(1).max(10).optional(),
        anxietyLevel: z.number().min(1).max(10).optional(),
        motivationLevel: z.number().min(1).max(10).optional(),
        focusLevel: z.number().min(1).max(10).optional(),
        resilienceScore: z.number().min(1).max(10).optional(),
        teamworkScore: z.number().min(1).max(10).optional(),
        leadershipScore: z.number().min(1).max(10).optional(),
        stressLevel: z.number().min(1).max(10).optional(),
        overallMentalScore: z.number().min(0).max(100).optional(),
        notes: z.string().optional(),
        recommendations: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMentalAssessment({
          ...input,
          assessmentDate: new Date(input.assessmentDate),
          assessedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== WORKOUT PLANS ====================
  workouts: router({
    getPlayerPlans: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerWorkoutPlans(input.playerId);
      }),
    getTeamPlans: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamWorkoutPlans(input.teamId);
      }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number().optional(),
        teamId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['strength', 'endurance', 'agility', 'flexibility', 'recovery', 'match_prep']),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        durationMinutes: z.number().optional(),
        exercises: z.string().optional(),
        scheduledDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createWorkoutPlan({
          ...input,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    markComplete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateWorkoutPlan(input.id, { isCompleted: true, completedAt: new Date() });
        return { success: true };
      }),
  }),

  // ==================== INJURIES ====================
  injuries: router({
    getPlayerInjuries: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInjuries(input.playerId);
      }),
    getActive: staffProcedure.query(async () => {
      return db.getActiveInjuries();
    }),
    create: staffProcedure
      .input(z.object({
        playerId: z.number(),
        injuryType: z.string().min(1),
        bodyPart: z.string().min(1),
        severity: z.enum(['minor', 'moderate', 'severe']),
        injuryDate: z.string(),
        expectedRecoveryDate: z.string().optional(),
        treatment: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createInjury({
          ...input,
          injuryDate: new Date(input.injuryDate),
          expectedRecoveryDate: input.expectedRecoveryDate ? new Date(input.expectedRecoveryDate) : undefined,
          reportedBy: ctx.user.id,
        });
        return { id };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['active', 'recovering', 'recovered', 'chronic']).optional(),
        actualRecoveryDate: z.string().optional(),
        treatment: z.string().optional(),
        notes: z.string().optional(),
        returnToPlayCleared: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, actualRecoveryDate, returnToPlayCleared, ...rest } = input;
        await db.updateInjury(id, {
          ...rest,
          actualRecoveryDate: actualRecoveryDate ? new Date(actualRecoveryDate) : undefined,
          returnToPlayCleared,
          clearedBy: returnToPlayCleared ? ctx.user.id : undefined,
          clearedAt: returnToPlayCleared ? new Date() : undefined,
        });
        return { success: true };
      }),
  }),

  // ==================== NUTRITION ====================
  nutrition: router({
    getPlayerMealPlans: staffProcedure
      .input(z.object({ playerId: z.number(), date: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerMealPlans(input.playerId, input.date);
      }),
    getPlayerLogs: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerNutritionLogs(input.playerId, input.limit);
      }),
    createMealPlan: staffProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        planDate: z.string(),
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_training', 'post_training']),
        foods: z.string().optional(),
        calories: z.number().optional(),
        protein: z.number().optional(),
        carbs: z.number().optional(),
        fats: z.number().optional(),
        hydrationMl: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMealPlan({
          ...input,
          planDate: new Date(input.planDate),
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    logNutrition: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        logDate: z.string(),
        totalCalories: z.number().optional(),
        totalProtein: z.number().optional(),
        totalCarbs: z.number().optional(),
        totalFats: z.number().optional(),
        hydrationMl: z.number().optional(),
        mealsLogged: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNutritionLog({
          ...input,
          logDate: new Date(input.logDate),
        });
        return { id };
      }),
  }),

  // ==================== TRAINING SESSIONS ====================
  training: router({
    getTeamSessions: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamTrainingSessions(input.teamId);
      }),
    getUpcoming: protectedProcedure
      .input(z.object({ teamId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getUpcomingTrainingSessions(input.teamId);
      }),
    create: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        sessionDate: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        sessionType: z.enum(['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed']),
        objectives: z.string().optional(),
        drills: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTrainingSession({
          ...input,
          sessionDate: new Date(input.sessionDate),
          coachId: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
        attendanceCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrainingSession(id, data);
        return { success: true };
      }),
  }),

  // ==================== DEVELOPMENT PLANS ====================
  development: router({
    getPlayerPlans: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerDevelopmentPlans(input.playerId);
      }),
    getActivePlan: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getActiveDevelopmentPlan(input.playerId);
      }),
    createPlan: coachProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDevelopmentPlan({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    getPlanGoals: staffProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlanGoals(input.planId);
      }),
    createGoal: coachProcedure
      .input(z.object({
        planId: z.number(),
        category: z.enum(['technical', 'physical', 'mental', 'nutritional', 'tactical']),
        title: z.string().min(1),
        description: z.string().optional(),
        targetValue: z.number().optional(),
        unit: z.string().optional(),
        targetDate: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDevelopmentGoal({
          ...input,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        });
        return { id };
      }),
    updateGoal: coachProcedure
      .input(z.object({
        id: z.number(),
        currentValue: z.number().optional(),
        status: z.enum(['not_started', 'in_progress', 'completed', 'overdue']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDevelopmentGoal(id, data);
        return { success: true };
      }),
  }),

  // ==================== ACHIEVEMENTS ====================
  achievements: router({
    getPlayerAchievements: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAchievements(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['technical', 'physical', 'mental', 'nutritional', 'milestone', 'award']),
        achievedDate: z.string(),
        iconType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAchievement({
          ...input,
          achievedDate: new Date(input.achievedDate),
        });
        return { id };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input.limit);
      }),
    getNotifications: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input?.limit);
      }),
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotifications(ctx.user.id);
    }),
    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      const unread = await db.getUnreadNotifications(ctx.user.id);
      return { count: unread.length };
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
    create: staffProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).optional(),
        category: z.enum(['performance', 'training', 'nutrition', 'mental', 'injury', 'achievement', 'general']).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotification(input);
        return { id };
      }),
    notifyParent: staffProcedure
      .input(z.object({
        playerId: z.number(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(['info', 'success', 'warning', 'alert']).optional(),
        category: z.enum(['performance', 'training', 'nutrition', 'mental', 'injury', 'achievement', 'general']).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get parent(s) for this player and notify them
        const parents = await db.getParentsForPlayer(input.playerId);
        const notifications = [];
        for (const parent of parents) {
          const id = await db.createNotification({
            userId: parent.parentUserId,
            title: input.title,
            message: input.message,
            type: input.type,
            category: input.category,
          });
          notifications.push(id);
        }
        return { count: notifications.length, ids: notifications };
      }),
  }),

  // ==================== COACH FEEDBACK ====================
  feedback: router({
    getPlayerFeedback: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedback(input.playerId, input.limit);
      }),
    getForParent: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerFeedbackForParent(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        feedbackDate: z.string(),
        category: z.enum(['technical', 'physical', 'mental', 'tactical', 'general']),
        rating: z.number().min(1).max(5).optional(),
        strengths: z.string().optional(),
        areasToImprove: z.string().optional(),
        recommendations: z.string().optional(),
        isVisibleToParent: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createCoachFeedback({
          ...input,
          feedbackDate: new Date(input.feedbackDate),
          coachId: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== PARENT-PLAYER RELATIONS ====================
  parentRelations: router({
    link: protectedProcedure
      .input(z.object({
        parentUserId: z.number().optional(),
        playerId: z.number(),
        relationship: z.string().optional(),
        isPrimary: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Use current user ID if parentUserId not provided (for parent self-linking)
        const parentUserId = input.parentUserId || ctx.user.id;
        await db.linkParentToPlayer(parentUserId, input.playerId, input.relationship, input.isPrimary);
        return { success: true };
      }),
    getRelations: protectedProcedure.query(async ({ ctx }) => {
      return db.getParentPlayerRelations(ctx.user.id);
    }),
    getLinkedPlayers: protectedProcedure.query(async ({ ctx }) => {
      // Get players linked to this parent
      return db.getPlayersForParent(ctx.user.id);
    }),
  }),

  // ==================== INDIVIDUAL DEVELOPMENT PLANS ====================
  idp: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllIDPs();
    }),
    getPlayerIDP: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerIDP(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        seasonYear: z.number(),
        shortTermGoals: z.string().optional(),
        longTermGoals: z.string().optional(),
        technicalObjectives: z.string().optional(),
        physicalObjectives: z.string().optional(),
        mentalObjectives: z.string().optional(),
        nutritionObjectives: z.string().optional(),
        strengthsAnalysis: z.string().optional(),
        areasForImprovement: z.string().optional(),
        actionPlan: z.string().optional(),
        reviewDate: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createIDP({
          ...input,
          reviewDate: input.reviewDate ? new Date(input.reviewDate) : undefined,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        shortTermGoals: z.string().optional(),
        longTermGoals: z.string().optional(),
        technicalObjectives: z.string().optional(),
        physicalObjectives: z.string().optional(),
        mentalObjectives: z.string().optional(),
        nutritionObjectives: z.string().optional(),
        strengthsAnalysis: z.string().optional(),
        areasForImprovement: z.string().optional(),
        actionPlan: z.string().optional(),
        overallProgress: z.number().optional(),
        status: z.enum(['active', 'completed', 'archived']).optional(),
        reviewDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, reviewDate, ...data } = input;
        await db.updateIDP(id, {
          ...data,
          reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        });
        return { success: true };
      }),
    getMilestones: staffProcedure
      .input(z.object({ idpId: z.number() }))
      .query(async ({ input }) => {
        return db.getIDPMilestones(input.idpId);
      }),
    addMilestone: coachProcedure
      .input(z.object({
        idpId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['technical', 'physical', 'mental', 'nutrition']),
        targetDate: z.string().optional(),
        targetValue: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createIDPMilestone({
          ...input,
          targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
        });
        return { id };
      }),
    updateMilestone: coachProcedure
      .input(z.object({
        id: z.number(),
        isCompleted: z.boolean().optional(),
        currentValue: z.number().optional(),
        completedDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, completedDate, ...data } = input;
        await db.updateIDPMilestone(id, {
          ...data,
          completedDate: completedDate ? new Date(completedDate) : (data.isCompleted ? new Date() : undefined),
        });
        return { success: true };
      }),
  }),

  // ==================== ANALYTICS ====================
  analytics: router({
    getAcademyStats: staffProcedure.query(async () => {
      return db.getAcademyStats();
    }),
  }),

  // ==================== MATCHES ====================
  matches: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllMatches();
    }),
    getById: staffProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchById(input.id);
      }),
    getByTeam: staffProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchesByTeam(input.teamId);
      }),
    create: coachProcedure
      .input(z.object({
        teamId: z.number().optional(),
        matchDate: z.string(),
        matchType: z.enum(['friendly', 'league', 'cup', 'tournament', 'training_match']),
        opponent: z.string().optional(),
        venue: z.string().optional(),
        isHome: z.boolean().optional(),
        teamScore: z.number().optional(),
        opponentScore: z.number().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createMatch({
          ...input,
          matchDate: new Date(input.matchDate),
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        teamScore: z.number().optional(),
        opponentScore: z.number().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMatch(id, data);
        return { success: true };
      }),
  }),

  // ==================== PLAYER MATCH STATS ====================
  matchStats: router({
    getByPlayer: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerMatchStats(input.playerId);
      }),
    getByMatch: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchStats(input.matchId);
      }),
    getPlayerHistory: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerMatchHistory(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number(),
        minutesPlayed: z.number().optional(),
        started: z.boolean().optional(),
        position: z.string().optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        touches: z.number().optional(),
        passes: z.number().optional(),
        passAccuracy: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        dribbles: z.number().optional(),
        successfulDribbles: z.number().optional(),
        tackles: z.number().optional(),
        interceptions: z.number().optional(),
        distanceCovered: z.number().optional(),
        topSpeed: z.number().optional(),
        sprints: z.number().optional(),
        yellowCards: z.number().optional(),
        redCards: z.number().optional(),
        coachRating: z.number().min(1).max(10).optional(),
        performanceScore: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPlayerMatchStats(input);
        return { id };
      }),
  }),

  // ==================== PLAYER SKILL SCORES (SCORECARD) ====================
  skillScores: router({
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestSkillScore(input.playerId)) ?? null;
      }),
    getHistory: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getSkillScoreHistory(input.playerId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        assessmentDate: z.string(),
        ballControl: z.number().optional(),
        firstTouch: z.number().optional(),
        dribbling: z.number().optional(),
        passing: z.number().optional(),
        shooting: z.number().optional(),
        crossing: z.number().optional(),
        heading: z.number().optional(),
        leftFootScore: z.number().optional(),
        rightFootScore: z.number().optional(),
        twoFootedScore: z.number().optional(),
        weakFootUsage: z.number().optional(),
        speed: z.number().optional(),
        acceleration: z.number().optional(),
        agility: z.number().optional(),
        stamina: z.number().optional(),
        strength: z.number().optional(),
        jumping: z.number().optional(),
        positioning: z.number().optional(),
        vision: z.number().optional(),
        composure: z.number().optional(),
        decisionMaking: z.number().optional(),
        workRate: z.number().optional(),
        marking: z.number().optional(),
        tackling: z.number().optional(),
        interceptions: z.number().optional(),
        overallRating: z.number().optional(),
        potentialRating: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calculate overall scores
        const technicalOverall = Math.round(
          ((input.ballControl || 50) + (input.firstTouch || 50) + (input.dribbling || 50) + 
           (input.passing || 50) + (input.shooting || 50) + (input.crossing || 50)) / 6
        );
        const physicalOverall = Math.round(
          ((input.speed || 50) + (input.acceleration || 50) + (input.agility || 50) + 
           (input.stamina || 50) + (input.strength || 50)) / 5
        );
        const mentalOverall = Math.round(
          ((input.positioning || 50) + (input.vision || 50) + (input.composure || 50) + 
           (input.decisionMaking || 50) + (input.workRate || 50)) / 5
        );
        const defensiveOverall = Math.round(
          ((input.marking || 50) + (input.tackling || 50) + (input.interceptions || 50)) / 3
        );
        const overallRating = input.overallRating || Math.round(
          (technicalOverall * 0.35 + physicalOverall * 0.25 + mentalOverall * 0.25 + defensiveOverall * 0.15)
        );

        const id = await db.createSkillScore({
          ...input,
          assessmentDate: new Date(input.assessmentDate),
          technicalOverall,
          physicalOverall,
          mentalOverall,
          defensiveOverall,
          overallRating,
          assessedBy: ctx.user.id,
        });
        return { id };
      }),
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        ballControl: z.number().optional(),
        firstTouch: z.number().optional(),
        dribbling: z.number().optional(),
        passing: z.number().optional(),
        shooting: z.number().optional(),
        speed: z.number().optional(),
        agility: z.number().optional(),
        stamina: z.number().optional(),
        overallRating: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSkillScore(id, data);
        return { success: true };
      }),
  }),

  // ==================== AI TRAINING RECOMMENDATIONS ====================
  aiTraining: router({
    getLatest: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return (await db.getLatestAIRecommendation(input.playerId)) ?? null;
      }),
    getAll: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getAIRecommendations(input.playerId);
      }),
    generate: coachProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateAITrainingRecommendations } = await import('./aiTraining');
        const recommendation = await generateAITrainingRecommendations(input.playerId);
        if (!recommendation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found or insufficient data' });
        }
        const id = await db.createAIRecommendation(recommendation);
        return { id, recommendation };
      }),
    accept: coachProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAIRecommendation(input.id, { isAccepted: true, acceptedAt: new Date() });
        return { success: true };
      }),
    updateProgress: coachProcedure
      .input(z.object({ id: z.number(), progress: z.number().min(0).max(100) }))
      .mutation(async ({ input }) => {
        await db.updateAIRecommendation(input.id, { completionProgress: input.progress });
        return { success: true };
      }),
  }),

  // ==================== VIDEO ANALYSIS ====================
  videos: router({
    getAll: staffProcedure.query(async () => {
      return db.getAllVideos();
    }),
    getByPlayer: staffProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideosByPlayer(input.playerId);
      }),
    getByMatch: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideosByMatch(input.matchId);
      }),
    create: coachProcedure
      .input(z.object({
        playerId: z.number().optional(),
        matchId: z.number().optional(),
        sessionId: z.number().optional(),
        title: z.string().min(1),
        videoUrl: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']),
        tags: z.array(z.string()).optional(),
        annotations: z.array(z.object({
          timestamp: z.number(),
          text: z.string(),
          type: z.string().optional(),
        })).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createVideoAnalysis({
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          annotations: input.annotations ? JSON.stringify(input.annotations) : null,
          uploadedBy: ctx.user.id,
        });
        return { id };
      }),
  }),

  // ==================== LEAGUE STANDINGS ====================
  league: router({
    getStandings: protectedProcedure
      .input(z.object({ season: z.string(), leagueName: z.string() }))
      .query(async ({ input }) => {
        return db.getLeagueStandings(input.season, input.leagueName);
      }),
    updateStanding: coachProcedure
      .input(z.object({
        teamId: z.number(),
        season: z.string(),
        leagueName: z.string(),
        played: z.number().optional(),
        won: z.number().optional(),
        drawn: z.number().optional(),
        lost: z.number().optional(),
        goalsFor: z.number().optional(),
        goalsAgainst: z.number().optional(),
        goalDifference: z.number().optional(),
        points: z.number().optional(),
        position: z.number().optional(),
        form: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.upsertLeagueStanding(input);
      }),
  }),

  // ==================== MAN OF THE MATCH ====================
  motm: router({
    get: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getManOfTheMatch(input.matchId);
      }),
    set: coachProcedure
      .input(z.object({
        matchId: z.number(),
        playerId: z.number(),
        rating: z.number().min(1).max(10).optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.setManOfTheMatch({ ...input, selectedBy: ctx.user.id });
      }),
  }),

  // ==================== REGISTRATION ====================
  registration: router({
    submit: publicProcedure
      .input(z.object({
        parentName: z.string().min(2),
        parentEmail: z.string().email(),
        parentPhone: z.string().min(5),
        childName: z.string().min(2),
        childDateOfBirth: z.string(),
        childAge: z.number().optional(),
        preferredPosition: z.string().optional(),
        currentClub: z.string().optional(),
        experience: z.string().optional(),
        medicalConditions: z.string().optional(),
        howHeard: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createRegistrationRequest({
          ...input,
          childDateOfBirth: new Date(input.childDateOfBirth),
        });
        
        // Send notification to admin about new registration
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '🎉 New Academy Registration',
            content: `New registration received!\n\n**Parent:** ${input.parentName}\n**Email:** ${input.parentEmail}\n**Phone:** ${input.parentPhone}\n\n**Child:** ${input.childName}\n**Age:** ${input.childAge} years old\n**Position:** ${input.preferredPosition || 'Not specified'}\n\nPlease review and contact the family within 2-3 business days.`,
          });
        } catch (error) {
          console.error('Failed to send registration notification:', error);
        }
        
        return { success: true, id };
      }),
    getAll: adminProcedure.query(async () => {
      return db.getAllRegistrationRequests();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'contacted', 'trial_scheduled', 'accepted', 'rejected']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateRegistrationStatus(input.id, input.status, input.notes);
        return { success: true };
      }),
  }),

  // ==================== CONTACT ====================
  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().min(2),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createContactInquiry(input);
        return { success: true, id };
      }),
    getAll: adminProcedure.query(async () => {
      return db.getAllContactInquiries();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['new', 'read', 'replied', 'closed']),
      }))
      .mutation(async ({ input }) => {
        await db.updateContactInquiryStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ==================== CAREERS ====================
  careers: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(5),
        position: z.enum(['football_coach', 'fitness_coach', 'goalkeeper_coach', 'sports_psychologist', 'analyst', 'physiotherapist', 'other']),
        yearsExperience: z.number().min(0),
        qualifications: z.string().min(10),
        previousClubs: z.string().optional(),
        cvUrl: z.string().optional(),
        coverLetter: z.string().min(50),
        linkedinUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const [result] = await database.insert(careerApplications).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          position: input.position,
          yearsExperience: input.yearsExperience,
          qualifications: input.qualifications,
          previousClubs: input.previousClubs,
          cvUrl: input.cvUrl,
          coverLetter: input.coverLetter,
          linkedinUrl: input.linkedinUrl,
          status: 'pending',
        });
        
        // Notify admin about new application
        await notifyOwner({
          title: 'New Career Application',
          message: `${input.fullName} applied for ${input.position}`,
          type: 'info',
        });
        
        return { success: true, id: result.insertId };
      }),
    
    getAll: adminProcedure.query(async () => {
      const database = getDb();
      return database.select().from(careerApplications).orderBy(desc(careerApplications.createdAt));
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'under_review', 'approved', 'rejected']),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = getDb();
        
        // Get application details for email
        const [application] = await database.select()
          .from(careerApplications)
          .where(eq(careerApplications.id, input.id));
        
        if (!application) {
          throw new Error('Application not found');
        }
        
        // Update status
        await database.update(careerApplications)
          .set({
            status: input.status,
            adminNotes: input.adminNotes,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(careerApplications.id, input.id));
        
        // Send email notification
        try {
          const { sendCareerApplicationStatusEmail } = await import('./emailService');
          await sendCareerApplicationStatusEmail(application.email, {
            applicantName: application.fullName,
            position: application.position,
            status: input.status as 'approved' | 'rejected' | 'under_review',
            adminNotes: input.adminNotes,
          });
        } catch (emailError) {
          console.error('Failed to send career application status email:', emailError);
          // Don't fail the mutation if email fails
        }
        
        return { success: true };
      }),
  }),

  // ==================== ACADEMY EVENTS ====================
  events: router({
    getPublic: publicProcedure.query(async () => {
      return db.getPublicEvents();
    }),
    getUpcoming: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUpcomingEvents(input?.limit);
      }),
    getAll: staffProcedure.query(async () => {
      return db.getAllAcademyEvents();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEventById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(2),
        description: z.string().optional(),
        eventType: z.enum(['training', 'tournament', 'trial', 'camp', 'workshop', 'match', 'meeting', 'other']),
        location: z.string().optional(),
        startDate: z.string(),
        endDate: z.string().optional(),
        ageGroups: z.string().optional(),
        maxParticipants: z.number().optional(),
        registrationDeadline: z.string().optional(),
        fee: z.number().optional(),
        isPublic: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createAcademyEvent({
          ...input,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : undefined,
          createdBy: ctx.user.id,
        });
        return { success: true, id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(['training', 'tournament', 'trial', 'camp', 'workshop', 'match', 'meeting', 'other']).optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, startDate, endDate, ...rest } = input;
        await db.updateAcademyEvent(id, {
          ...rest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        });
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAcademyEvent(input.id);
        return { success: true };
      }),
  }),

  // ==================== COACH PROFILES ====================
  coachProfiles: router({
    getPublic: publicProcedure.query(async () => {
      return db.getPublicCoachProfiles();
    }),
    getAll: adminProcedure.query(async () => {
      return db.getAllCoachProfiles();
    }),
    getByUserId: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachProfileByUserId(input.userId);
      }),
    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        title: z.string().optional(),
        specialization: z.enum(['technical', 'tactical', 'fitness', 'goalkeeping', 'youth_development', 'mental', 'nutrition']).optional(),
        qualifications: z.string().optional(),
        experience: z.string().optional(),
        yearsExperience: z.number().optional(),
        bio: z.string().optional(),
        achievements: z.string().optional(),
        languages: z.string().optional(),
        photoUrl: z.string().optional(),
        linkedIn: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCoachProfile(input);
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        specialization: z.enum(['technical', 'tactical', 'fitness', 'goalkeeping', 'youth_development', 'mental', 'nutrition']).optional(),
        qualifications: z.string().optional(),
        experience: z.string().optional(),
        yearsExperience: z.number().optional(),
        bio: z.string().optional(),
        achievements: z.string().optional(),
        languages: z.string().optional(),
        photoUrl: z.string().optional(),
        linkedIn: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCoachProfile(id, data);
        return { success: true };
      }),
  }),

  // ==================== GPS TRACKER ====================
  gps: router({
    import: staffProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        matchId: z.number().optional(),
        deviceType: z.string(),
        deviceId: z.string().optional(),
        recordedAt: z.string(),
        totalDistance: z.number().optional(),
        highSpeedDistance: z.number().optional(),
        sprintDistance: z.number().optional(),
        maxSpeed: z.number().optional(),
        avgSpeed: z.number().optional(),
        accelerations: z.number().optional(),
        decelerations: z.number().optional(),
        avgHeartRate: z.number().optional(),
        maxHeartRate: z.number().optional(),
        heartRateZones: z.string().optional(),
        playerLoad: z.number().optional(),
        metabolicPower: z.number().optional(),
        rawData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createGpsTrackerData({
          ...input,
          recordedAt: new Date(input.recordedAt),
        });
        return { success: true, id };
      }),
    getPlayerData: staffProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerGpsData(input.playerId, input.limit);
      }),
    getSessionData: staffProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return db.getSessionGpsData(input.sessionId);
      }),
    getMatchData: staffProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchGpsData(input.matchId);
      }),
  }),

  // ==================== EVENT REGISTRATIONS ====================
  eventRegistrations: router({
    register: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        playerId: z.number().optional(),
        playerName: z.string(),
        playerAge: z.number(),
        parentName: z.string(),
        parentEmail: z.string().email(),
        parentPhone: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createEventRegistration({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true, id };
      }),
    getMyRegistrations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserEventRegistrations(ctx.user.id);
    }),
    getEventRegistrations: staffProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return db.getEventRegistrations(input.eventId);
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'waitlist']),
      }))
      .mutation(async ({ input }) => {
        await db.updateEventRegistration(input.id, { 
          status: input.status,
          confirmedAt: input.status === 'confirmed' ? new Date() : undefined,
        });
        return { success: true };
      }),
    cancel: protectedProcedure
      .input(z.object({ id: z.number(), eventId: z.number() }))
      .mutation(async ({ input }) => {
        await db.cancelEventRegistration(input.id, input.eventId);
        return { success: true };
      }),
  }),

  // ==================== COACH AVAILABILITY ====================
  coachAvailability: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllCoachAvailability();
    }),
    getByCoach: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachAvailability(input.coachId);
      }),
    set: protectedProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        isAvailable: z.boolean().optional(),
        sessionType: z.enum(['group', 'private', 'consultation', 'all']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.setCoachAvailability({
          ...input,
          coachId: ctx.user.id,
        });
        return { success: true, id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        isAvailable: z.boolean().optional(),
        sessionType: z.enum(['group', 'private', 'consultation', 'all']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCoachAvailability(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCoachAvailability(input.id);
        return { success: true };
      }),
  }),

  // ==================== MEMBERSHIP PLANS ====================
  membershipPlans: router({
    getAll: publicProcedure.query(async () => {
      return db.getMembershipPlans();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMembershipPlanById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        durationMonths: z.number().min(1),
        price: z.number().min(0),
        originalPrice: z.number().optional(),
        features: z.string().optional(),
        isPopular: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMembershipPlan(input);
        return { success: true, id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        durationMonths: z.number().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        features: z.string().optional(),
        isPopular: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMembershipPlan(id, data);
        return { success: true };
      }),
  }),

  // ==================== ATTENDANCE ====================
  attendance: router({
    record: coachProcedure
      .input(z.object({
        playerId: z.number(),
        sessionId: z.number().optional(),
        sessionType: z.enum(['training', 'match', 'trial', 'assessment']),
        sessionDate: z.string(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        durationMinutes: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.recordAttendance({ ...input, sessionDate: new Date(input.sessionDate), recordedBy: ctx.user.id });
        // Award points for attendance
        if (input.status === 'present') {
          await db.awardPoints(input.playerId, 10, 'attendance', 'Attended session', ctx.user.id);
        }
        return { success: true };
      }),
    getPlayerAttendance: protectedProcedure
      .input(z.object({ 
        playerId: z.number(), 
        dateRange: z.enum(['week', 'month', 'season', 'all']).optional(),
        limit: z.number().optional() 
      }))
      .query(async ({ input }) => {
        const allAttendance = await db.getPlayerAttendance(input.playerId, 1000);
        
        // Calculate date cutoff based on range
        let cutoffDate: Date | null = null;
        if (input.dateRange === 'week') {
          cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
        } else if (input.dateRange === 'month') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        } else if (input.dateRange === 'season') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        }
        
        // Filter by date if needed
        const filteredAttendance = cutoffDate 
          ? allAttendance.filter(a => a.sessionDate && new Date(a.sessionDate) >= cutoffDate!)
          : allAttendance;
        
        // Calculate attendance rate
        const totalSessions = filteredAttendance.length;
        const presentSessions = filteredAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
        
        // Get recent 10 sessions
        const recentSessions = filteredAttendance.slice(-10).reverse().map(a => ({
          date: a.sessionDate ? new Date(a.sessionDate).toLocaleDateString() : 'N/A',
          attended: a.status === 'present',
          status: a.status
        }));
        
        // Build attendance history for chart (weekly aggregation)
        const attendanceHistory: { date: string; rate: number }[] = [];
        const weeks = Math.min(12, Math.ceil(filteredAttendance.length / 7));
        for (let i = 0; i < weeks; i++) {
          const weekAttendance = filteredAttendance.slice(i * 7, (i + 1) * 7);
          const weekPresent = weekAttendance.filter(a => a.status === 'present').length;
          const weekRate = weekAttendance.length > 0 ? Math.round((weekPresent / weekAttendance.length) * 100) : 0;
          attendanceHistory.push({
            date: `Week ${i + 1}`,
            rate: weekRate
          });
        }
        
        return {
          attendanceRate,
          totalSessions,
          presentSessions,
          recentSessions,
          attendanceHistory: attendanceHistory.reverse()
        };
      }),
    getPlayerRate: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerAttendanceRate(input.playerId);
      }),
    getSessionAttendance: coachProcedure
      .input(z.object({ sessionId: z.number(), sessionType: z.string() }))
      .query(async ({ input }) => {
        return db.getSessionAttendance(input.sessionId, input.sessionType);
      }),
  }),

  // ==================== POINTS & REWARDS ====================
  points: router({
    getPlayerPoints: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerPoints(input.playerId);
      }),
    awardPoints: coachProcedure
      .input(z.object({
        playerId: z.number(),
        amount: z.number(),
        type: z.enum(['attendance', 'performance', 'improvement', 'bonus', 'achievement']),
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.awardPoints(input.playerId, input.amount, input.type, input.description, ctx.user.id);
        return { success: true };
      }),
    getTransactions: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPointsTransactions(input.playerId, input.limit);
      }),
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPointsLeaderboard(input.limit);
      }),
  }),

  rewards: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllRewards();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getRewardById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        pointsCost: z.number(),
        category: z.enum(['merchandise', 'training', 'experience', 'gift']),
        imageUrl: z.string().optional(),
        stock: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createReward(input);
        return { success: true };
      }),
    redeem: protectedProcedure
      .input(z.object({ playerId: z.number(), rewardId: z.number() }))
      .mutation(async ({ input }) => {
        return db.redeemReward(input.playerId, input.rewardId);
      }),
    getRedemptions: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerRedemptions(input.playerId);
      }),
  }),

  // ==================== PLAYER ACTIVITIES ====================
  activities: router({
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        activityType: z.enum(['training', 'match', 'assessment', 'trial']),
        activityDate: z.string(),
        durationMinutes: z.number(),
        opponent: z.string().optional(),
        score: z.string().optional(),
        result: z.enum(['win', 'draw', 'loss']).optional(),
        goals: z.number().optional(),
        assists: z.number().optional(),
        possessions: z.number().optional(),
        workRate: z.number().optional(),
        ballTouches: z.number().optional(),
        speedActions: z.number().optional(),
        position: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPlayerActivity({ ...input, activityDate: new Date(input.activityDate) });
        return { success: true };
      }),
    getPlayerActivities: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerActivities(input.playerId, input.limit);
      }),
  }),

  // ==================== WEEKLY TARGETS ====================
  weeklyTargets: router({
    getPlayerTargets: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerWeeklyTargets(input.playerId);
      }),
    setTarget: coachProcedure
      .input(z.object({
        playerId: z.number(),
        weekStartDate: z.string(),
        targetType: z.enum(['speed_actions', 'ball_touches', 'training_hours', 'goals', 'assists']),
        targetValue: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.setWeeklyTarget({ ...input, weekStartDate: new Date(input.weekStartDate) });
        return { success: true };
      }),
    updateProgress: coachProcedure
      .input(z.object({ id: z.number(), currentValue: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateWeeklyTargetProgress(input.id, input.currentValue);
        return { success: true };
      }),
  }),

  // ==================== AI VIDEO ANALYSIS (Legacy) ====================
  aiVideoAnalysisLegacy: router({
    create: coachProcedure
      .input(z.object({
        playerId: z.number(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        title: z.string().optional(),
        analysisType: z.enum(['match', 'training', 'skills', 'movement']),
      }))
      .mutation(async ({ input }) => {
        await db.createAIVideoAnalysis({ ...input, status: 'pending' });
        return { success: true };
      }),
    getPlayerAnalysis: protectedProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerAIVideoAnalysis(input.playerId, input.limit);
      }),
    updateAnalysis: coachProcedure
      .input(z.object({
        id: z.number(),
        aiSummary: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        technicalScore: z.number().optional(),
        tacticalScore: z.number().optional(),
        physicalScore: z.number().optional(),
        recommendations: z.string().optional(),
        status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateAIVideoAnalysis(id, { ...data, analyzedBy: ctx.user.id, analyzedAt: new Date() });
        return { success: true };
      }),
  }),

  // ==================== MASTERCLASS CONTENT ====================
  masterclass: router({
    getAll: publicProcedure.query(async () => {
      return db.getAllMasterclassContent();
    }),
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getMasterclassByCategory(input.category);
      }),
    getForPosition: publicProcedure
      .input(z.object({ position: z.string() }))
      .query(async ({ input }) => {
        return db.getMasterclassForPosition(input.position);
      }),
    incrementViews: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementMasterclassViews(input.id);
        return { success: true };
      }),
  }),

  // ==================== AI VIDEO ANALYSIS ====================
  aiVideoAnalysis: router({
    // Legacy analyze without vision (uses metadata only)
    analyze: publicProcedure
      .input(z.object({
        videoUrl: z.string().min(1),
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']).optional(),
        fileSizeMb: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVideoWithAI } = await import('./aiVideoAnalysis');
        const result = await analyzeVideoWithAI(input);
        return result;
      }),
    
    // Real video analysis with vision - analyzes actual video frames
    analyzeWithVision: publicProcedure
      .input(z.object({
        videoUrl: z.string().min(1),
        frames: z.array(z.string()).min(1).max(10), // Base64 encoded frame images
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']).optional(),
        metadata: z.object({
          duration: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          frameRate: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVideoWithVision } = await import('./realVideoAnalysis');
        const result = await analyzeVideoWithVision(input);
        return result;
      }),
    save: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        videoUrl: z.string().min(1),
        playerName: z.string().optional(),
        teamColor: z.string().optional(),
        videoType: z.enum(['match_highlight', 'training_clip', 'skill_demo', 'analysis', 'full_match']),
        fileSizeMb: z.number().optional(),
        duration: z.number().optional(),
        overallScore: z.number().optional(),
        movementAnalysis: z.string().optional(),
        technicalAnalysis: z.string().optional(),
        tacticalAnalysis: z.string().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        drillRecommendations: z.string().optional(),
        coachNotes: z.string().optional(),
        heatmapZones: z.string().optional(),
        playerId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.saveVideoAnalysis({
          ...input,
          uploadedBy: ctx.user.id,
          analysisStatus: 'completed',
        });
        return { id };
      }),
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getVideoAnalysisHistory(ctx.user.id, input.limit);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnalysisById(input.id);
      }),
    
    // AI-powered player tracking
    trackPlayers: publicProcedure
      .input(z.object({
        frames: z.array(z.string()).min(1).max(20), // Base64 encoded frames
        videoMetadata: z.object({
          duration: z.number(),
          fps: z.number().default(30),
          width: z.number(),
          height: z.number(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { trackPlayersInVideo } = await import('./ai-player-tracking');
        const result = await trackPlayersInVideo(input.frames, input.videoMetadata);
        return result;
      }),
  }),

  // ==================== DRILL ASSIGNMENTS ====================
  drillAssignments: router({
    // Coach assigns a drill to a player
    assign: coachProcedure
      .input(z.object({
        playerId: z.number(),
        drillId: z.string(),
        drillName: z.string(),
        drillNameAr: z.string().optional(),
        category: z.string().optional(),
        improvementArea: z.string().optional(),
        reason: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        videoAnalysisId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDrillAssignment({
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          assignedBy: ctx.user.id,
        });
        return { id, success: true };
      }),

    // Get assignments for a specific player
    getForPlayer: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerDrillAssignments(input.playerId);
      }),

    // Get assignments created by the current coach
    getMyAssignments: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachDrillAssignments(ctx.user.id);
      }),

    // Get all assignments (admin/coach view)
    getAll: staffProcedure
      .query(async () => {
        return db.getAllDrillAssignments();
      }),

    // Get pending assignments for a player
    getPending: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPendingAssignmentsForPlayer(input.playerId);
      }),

    // Update assignment status (player marks as complete)
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
        playerNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDrillAssignmentStatus(input.id, input.status, input.playerNotes);
        return { success: true };
      }),

    // Coach adds feedback to a completed assignment
    addFeedback: coachProcedure
      .input(z.object({
        id: z.number(),
        feedback: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addCoachFeedbackToAssignment(input.id, input.feedback);
        return { success: true };
      }),

    // Get a single assignment by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDrillAssignmentById(input.id);
      }),
  }),

  // ==================== TRAINING VIDEOS ====================
  trainingVideos: router({
    // Get published videos (public)
    getPublished: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getPublishedTrainingVideos(input?.category);
      }),

    // Get all videos (staff only)
    getAll: staffProcedure
      .query(async () => {
        return db.getAllTrainingVideos();
      }),

    // Get single video by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTrainingVideoById(input.id);
      }),

    // Create new video (coach/admin)
    create: coachProcedure
      .input(z.object({
        title: z.string(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        category: z.string(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        ageGroup: z.string().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createTrainingVideo({
          ...input,
          uploadedBy: ctx.user.id,
        });
        return { id, success: true };
      }),

    // Update video (coach/admin)
    update: coachProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        category: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        ageGroup: z.string().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrainingVideo(id, data);
        return { success: true };
      }),

    // Delete video (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTrainingVideo(input.id);
        return { success: true };
      }),

    // Increment view count
    incrementViews: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementVideoViewCount(input.id);
        return { success: true };
      }),

    // Get videos uploaded by current user
    getMyVideos: coachProcedure
      .query(async ({ ctx }) => {
        return db.getTrainingVideosByUploader(ctx.user.id);
      }),
  }),

  // ==================== PRIVATE TRAINING BOOKINGS ====================
  privateTraining: router({
    // Get all coaches with ratings and availability
    getCoaches: publicProcedure.query(async () => {
      return db.getCoachesWithRatings();
    }),

    // Get coach details with reviews
    getCoachDetails: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        const reviews = await db.getCoachReviews(input.coachId);
        const rating = await db.getCoachAverageRating(input.coachId);
        const slots = await db.getAvailableCoachSlots(input.coachId);
        return { reviews, rating, slots };
      }),

    // Get available slots for a coach
    getCoachSlots: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getAvailableCoachSlots(input.coachId);
      }),

    // Get all training locations
    getLocations: publicProcedure.query(async () => {
      return db.getActiveTrainingLocations();
    }),

    // Book a private training session (supports recurring)
    book: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        playerId: z.number(),
        locationId: z.number(),
        slotId: z.number().optional(),
        sessionDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        notes: z.string().optional(),
        price: z.number().optional(),
        isRecurring: z.boolean().optional(),
        recurringWeeks: z.number().min(2).max(12).optional(), // 2-12 weeks
      }))
      .mutation(async ({ ctx, input }) => {
        const bookingIds: number[] = [];
        const recurringGroupId = input.isRecurring ? crypto.randomUUID() : undefined;
        const weeksToBook = input.isRecurring && input.recurringWeeks ? input.recurringWeeks : 1;
        
        for (let week = 0; week < weeksToBook; week++) {
          // Calculate session date for this week
          const baseDate = new Date(input.sessionDate);
          baseDate.setDate(baseDate.getDate() + (week * 7));
          const sessionDateStr = baseDate.toISOString().split('T')[0];
          
          // Check for booking conflict
          const hasConflict = await db.checkBookingConflict(
            input.locationId,
            sessionDateStr,
            input.startTime,
            input.endTime
          );
          
          if (hasConflict) {
            if (week === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: 'This time slot is already booked at this location',
              });
            }
            // Skip conflicting weeks for recurring bookings
            continue;
          }
          
          const bookingId = await db.createPrivateTrainingBooking({
            coachId: input.coachId,
            playerId: input.playerId,
            bookedBy: ctx.user.id,
            locationId: input.locationId,
            slotId: input.slotId,
            sessionDate: baseDate,
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
            totalPrice: input.price,
            status: 'pending',
            isRecurring: input.isRecurring || false,
            recurringGroupId,
            recurringWeeks: input.recurringWeeks,
            recurringIndex: week + 1,
          });
          
          if (bookingId) bookingIds.push(bookingId);
        }
        
        return { 
          success: true, 
          bookingId: bookingIds[0], 
          bookingIds,
          totalBooked: bookingIds.length,
          isRecurring: input.isRecurring || false,
        };
      }),

    // Get my bookings (for parents)
    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      // Get all players linked to this parent
      const playerRelations = await db.getParentPlayerRelations(ctx.user.id);
      const playerIds = playerRelations.map(r => r.playerId);
      
      // Get bookings for all linked players
      const allBookings = [];
      for (const playerId of playerIds) {
        const bookings = await db.getPlayerPrivateTrainingBookings(playerId);
        allBookings.push(...bookings);
      }
      
      return allBookings.sort((a, b) => 
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
      );
    }),

    // Get bookings for a specific player
    getPlayerBookings: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerPrivateTrainingBookings(input.playerId);
      }),

    // Get coach's bookings (for coaches)
    getCoachBookings: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachPrivateTrainingBookings(ctx.user.id);
    }),

    // Confirm booking (coach/admin)
    confirmBooking: coachProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input }) => {
        await db.updatePrivateTrainingBooking(input.bookingId, { status: 'confirmed' });
        
        // Get booking details for notification
        const booking = await db.getPrivateTrainingBookingById(input.bookingId);
        let whatsappUrl = null;
        
        if (booking) {
          const { generateBookingConfirmationMessage, generateAcademyWhatsAppUrl } = await import('./whatsappNotification');
          const message = generateBookingConfirmationMessage({
            parentName: booking.parentName || 'Parent',
            playerName: booking.playerName || 'Player',
            coachName: booking.coachName || 'Coach',
            sessionDate: new Date(booking.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
            startTime: booking.startTime,
            endTime: booking.endTime,
            locationName: booking.locationName ?? undefined,
            price: booking.totalPrice ?? undefined,
          });
          whatsappUrl = generateAcademyWhatsAppUrl(message);
        }
        
        return { success: true, whatsappUrl };
      }),

    // Complete booking (coach/admin)
    completeBooking: coachProcedure
      .input(z.object({ 
        bookingId: z.number(),
        coachNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePrivateTrainingBooking(input.bookingId, { 
          status: 'completed',
          coachNotes: input.coachNotes,
        });
        return { success: true };
      }),

    // Cancel booking
    cancelBooking: protectedProcedure
      .input(z.object({ 
        bookingId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.cancelPrivateTrainingBooking(input.bookingId, input.reason);
        return { success: true };
      }),

    // Cancel all future sessions in a recurring series
    cancelRecurringSeries: protectedProcedure
      .input(z.object({
        recurringGroupId: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.cancelRecurringSeries(input.recurringGroupId, input.reason);
        return { success: true, cancelledCount: result.cancelled };
      }),

    // Get tomorrow's bookings for reminders (coach/admin)
    getTomorrowsBookings: coachProcedure.query(async () => {
      const bookings = await db.getTomorrowsBookings();
      
      // Generate WhatsApp reminder URLs for each booking
      const { generateSessionReminderMessage, generateAcademyWhatsAppUrl } = await import('./whatsappNotification');
      
      return bookings.map(booking => ({
        ...booking,
        whatsappReminderUrl: generateAcademyWhatsAppUrl(
          generateSessionReminderMessage({
            parentName: booking.parentName || 'Parent',
            playerName: booking.playerName || 'Player',
            coachName: booking.coachName || 'Coach',
            sessionDate: new Date(booking.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
            startTime: booking.startTime,
            endTime: booking.endTime,
            locationName: booking.locationName ?? undefined,
          })
        ),
      }));
    }),

    // Get bookings in a recurring series
    getRecurringSeries: protectedProcedure
      .input(z.object({ recurringGroupId: z.string() }))
      .query(async ({ input }) => {
        return db.getRecurringSeriesBookings(input.recurringGroupId);
      }),

    // Submit review after training
    submitReview: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        bookingId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCoachReview({
          coachId: input.coachId,
          reviewerId: ctx.user.id,
          bookingId: input.bookingId,
          rating: input.rating,
          comment: input.comment,
        });
        return { success: true };
      }),

    // Get all bookings (admin)
    getAllBookings: adminProcedure.query(async () => {
      return db.getAllPrivateTrainingBookings();
    }),

    // Coach schedule management
    addSlot: coachProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        locationId: z.number().optional(),
        pricePerSession: z.number().optional(),
        isRecurring: z.boolean().optional(),
        specificDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const slotId = await db.createCoachScheduleSlot({
          coachId: ctx.user.id,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          locationId: input.locationId,
          pricePerSession: input.pricePerSession,
          isRecurring: input.isRecurring ?? true,
          specificDate: input.specificDate ? new Date(input.specificDate) : undefined,
        });
        return { success: true, slotId };
      }),

    // Get my schedule slots (coach)
    getMySlots: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachScheduleSlots(ctx.user.id);
    }),

    // Update slot availability
    updateSlot: coachProcedure
      .input(z.object({
        slotId: z.number(),
        isAvailable: z.boolean().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        pricePerSession: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { slotId, ...data } = input;
        await db.updateCoachScheduleSlot(slotId, data);
        return { success: true };
      }),

    // Delete slot
    deleteSlot: coachProcedure
      .input(z.object({ slotId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCoachScheduleSlot(input.slotId);
        return { success: true };
      }),

    // Admin: Manage locations
    createLocation: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        address: z.string().optional(),
        capacity: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const locationId = await db.createTrainingLocation(input);
        return { success: true, locationId };
      }),

    // Get all locations (admin)
    getAllLocations: adminProcedure.query(async () => {
      return db.getAllTrainingLocations();
    }),

    // Update location
    updateLocation: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        address: z.string().optional(),
        capacity: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTrainingLocation(id, data);
        return { success: true };
      }),

    // Check availability for a specific date/time/location
    checkAvailability: publicProcedure
      .input(z.object({
        locationId: z.number(),
        sessionDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      }))
      .query(async ({ input }) => {
        const hasConflict = await db.checkBookingConflict(
          input.locationId,
          input.sessionDate,
          input.startTime,
          input.endTime
        );
        return { available: !hasConflict };
      }),

    // Get coach booking stats
    getCoachStats: coachProcedure.query(async ({ ctx }) => {
      return db.getCoachBookingStats(ctx.user.id);
    }),

    // Submit review for completed booking
    submitBookingReview: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        coachId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const review = await db.submitBookingReview(
          input.bookingId,
          ctx.user.id,
          input.coachId,
          input.rating,
          input.comment
        );
        return { success: true, review };
      }),

    // Get review for a booking
    getBookingReview: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return db.getBookingReview(input.bookingId);
      }),

    // Get coach reviews with details
    getCoachReviewsDetailed: publicProcedure
      .input(z.object({ coachId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachReviewsWithDetails(input.coachId);
      }),
  }),

  // ==================== COACH PROGRESS MONITORING ====================
  coachProgress: router({
    // Get overview of all players the coach has trained
    getPlayerOverview: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachPlayerOverview(ctx.user.openId);
      }),

    // Get detailed progress metrics for a specific player
    getPlayerProgress: coachProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerProgressMetrics(input.playerId);
      }),

    // Get coach's own training stats
    getMyStats: coachProcedure
      .query(async ({ ctx }) => {
        return db.getCoachTrainingStats(ctx.user.openId);
      }),

    // Get skill trend for a player
    getPlayerSkillTrend: coachProcedure
      .input(z.object({ playerId: z.number(), skillName: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPlayerSkillTrend(input.playerId, input.skillName);
      }),

    // Get team progress overview
    getTeamProgress: coachProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamProgressOverview(input.teamId);
      }),
  }),

  // ==================== VIDEO ANALYSIS ====================
  videoAnalysisAdvanced: router({
    // Create a video clip
    createClip: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        teamId: z.number().optional(),
        matchId: z.number().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoClip({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get clips by team
    getClipsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoClipsByTeam(input.teamId);
      }),

    // Get my clips
    getMyClips: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getVideoClipsByUser(ctx.user.id);
      }),

    // Get clip by ID
    getClip: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoClipById(input.id);
      }),

    // Delete clip
    deleteClip: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoClip(input.id);
        return { success: true };
      }),

    // Add tag to clip
    addTag: protectedProcedure
      .input(z.object({
        clipId: z.number(),
        playerId: z.number().optional(),
        tagType: z.enum(["goal", "assist", "shot", "pass", "dribble", "tackle", "interception", "save", "error", "foul", "set_piece", "highlight", "custom"]),
        timestamp: z.number(),
        endTimestamp: z.number().optional(),
        description: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoTag({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get tags for clip
    getTagsByClip: protectedProcedure
      .input(z.object({ clipId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoTagsByClip(input.clipId);
      }),

    // Get tags for player (for highlight reels)
    getPlayerTags: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoTagsByPlayer(input.playerId);
      }),

    // Delete tag
    deleteTag: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoTag(input.id);
        return { success: true };
      }),

    // Add annotation
    addAnnotation: protectedProcedure
      .input(z.object({
        clipId: z.number(),
        timestamp: z.number(),
        annotationType: z.enum(["arrow", "circle", "rectangle", "line", "text", "freehand"]),
        data: z.string(), // JSON data
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoAnnotation({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get annotations for clip
    getAnnotationsByClip: protectedProcedure
      .input(z.object({ clipId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnnotationsByClip(input.clipId);
      }),

    // Delete annotation
    deleteAnnotation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoAnnotation(input.id);
        return { success: true };
      }),

    // Get player heatmaps
    getPlayerHeatmaps: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerHeatmapsByPlayer(input.playerId);
      }),

    // Get player highlight reel data
    getPlayerHighlights: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerHighlightTags(input.playerId);
      }),
  }),

  // ==================== TACTICAL PLANNING ====================
  tactics: router({
    // Create formation
    createFormation: protectedProcedure
      .input(z.object({
        name: z.string(),
        templateName: z.string().optional(),
        description: z.string().optional(),
        positions: z.string(), // JSON
        teamId: z.number().optional(),
        isTemplate: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createFormation({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get formations by team
    getFormationsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getFormationsByTeam(input.teamId);
      }),

    // Get formation templates
    getFormationTemplates: publicProcedure
      .query(async () => {
        return db.getFormationTemplates();
      }),

    // Get formation by ID
    getFormation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getFormationById(input.id);
      }),

    // Update formation
    updateFormation: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        positions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateFormation(id, data);
      }),

    // Delete formation
    deleteFormation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFormation(input.id);
        return { success: true };
      }),

    // Create set piece
    createSetPiece: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["corner_kick", "free_kick", "throw_in", "penalty", "goal_kick", "kickoff"]),
        side: z.enum(["left", "right", "center"]).optional(),
        description: z.string().optional(),
        movements: z.string(), // JSON
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createSetPiece({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get set pieces by team
    getSetPiecesByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getSetPiecesByTeam(input.teamId);
      }),

    // Get set pieces by type
    getSetPiecesByType: protectedProcedure
      .input(z.object({ teamId: z.number(), type: z.string() }))
      .query(async ({ input }) => {
        return db.getSetPiecesByType(input.teamId, input.type);
      }),

    // Get set piece by ID
    getSetPiece: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSetPieceById(input.id);
      }),

    // Update set piece
    updateSetPiece: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        movements: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateSetPiece(id, data);
      }),

    // Delete set piece
    deleteSetPiece: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSetPiece(input.id);
        return { success: true };
      }),

    // Create opposition analysis
    createOppositionAnalysis: protectedProcedure
      .input(z.object({
        opponentName: z.string(),
        matchId: z.number().optional(),
        formation: z.string().optional(),
        playStyle: z.enum(["attacking", "defensive", "possession", "counter", "balanced"]).optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        patterns: z.string().optional(),
        setPlays: z.string().optional(),
        notes: z.string().optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createOppositionAnalysis({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get opposition analyses by team
    getOppositionAnalysesByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getOppositionAnalysisByTeam(input.teamId);
      }),

    // Get opposition analysis by ID
    getOppositionAnalysis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOppositionAnalysisById(input.id);
      }),

    // Update opposition analysis
    updateOppositionAnalysis: protectedProcedure
      .input(z.object({
        id: z.number(),
        opponentName: z.string().optional(),
        formation: z.string().optional(),
        playStyle: z.enum(["attacking", "defensive", "possession", "counter", "balanced"]).optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        patterns: z.string().optional(),
        setPlays: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateOppositionAnalysis(id, data);
      }),

    // Delete opposition analysis
    deleteOppositionAnalysis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOppositionAnalysis(input.id);
        return { success: true };
      }),

    // Create match briefing
    createMatchBriefing: protectedProcedure
      .input(z.object({
        matchId: z.number().optional(),
        title: z.string(),
        oppositionId: z.number().optional(),
        formationId: z.number().optional(),
        objectives: z.string().optional(),
        keyTactics: z.string().optional(),
        playerInstructions: z.string().optional(),
        setPieceIds: z.string().optional(),
        notes: z.string().optional(),
        teamId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMatchBriefing({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get match briefings by team
    getMatchBriefingsByTeam: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingsByTeam(input.teamId);
      }),

    // Get match briefing by ID
    getMatchBriefing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingById(input.id);
      }),

    // Get match briefing by match
    getMatchBriefingByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchBriefingByMatch(input.matchId);
      }),

    // Update match briefing
    updateMatchBriefing: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        objectives: z.string().optional(),
        keyTactics: z.string().optional(),
        playerInstructions: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateMatchBriefing(id, data);
      }),

    // Delete match briefing
    deleteMatchBriefing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchBriefing(input.id);
        return { success: true };
      }),

    // Add live match note
    addLiveNote: protectedProcedure
      .input(z.object({
        matchId: z.number(),
        minute: z.number(),
        noteType: z.enum(["tactical", "substitution", "injury", "goal", "card", "observation", "instruction"]),
        content: z.string(),
        playerId: z.number().optional(),
        importance: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createLiveMatchNote({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get live notes by match
    getLiveNotesByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getLiveMatchNotesByMatch(input.matchId);
      }),

    // Delete live note
    deleteLiveNote: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLiveMatchNote(input.id);
        return { success: true };
      }),

    // Add player instruction
    addPlayerInstruction: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        matchId: z.number().optional(),
        briefingId: z.number().optional(),
        role: z.string().optional(),
        position: z.string().optional(),
        instructions: z.string(),
        markingAssignment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPlayerInstruction({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Get player instructions by match
    getPlayerInstructionsByMatch: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInstructionsByMatch(input.matchId);
      }),

    // Get player instructions by briefing
    getPlayerInstructionsByBriefing: protectedProcedure
      .input(z.object({ briefingId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerInstructionsByBriefing(input.briefingId);
      }),

    // Update player instruction
    updatePlayerInstruction: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.string().optional(),
        position: z.string().optional(),
        instructions: z.string().optional(),
        markingAssignment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updatePlayerInstruction(id, data);
      }),

    // Delete player instruction
    deletePlayerInstruction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlayerInstruction(input.id);
        return { success: true };
      }),
  }),

  // ==================== ACADEMY VIDEOS ====================
  academyVideos: router({
    // Get all videos (admin)
    getAll: adminProcedure.query(async () => {
      return db.getAllAcademyVideos();
    }),

    // Get videos by category (public)
    getByCategory: publicProcedure
      .input(z.object({ category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']) }))
      .query(async ({ input }) => {
        return db.getAcademyVideosByCategory(input.category);
      }),

    // Get hero video (public)
    getHero: publicProcedure.query(async () => {
      return db.getHeroVideo();
    }),

    // Create video (admin only)
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        fileKey: z.string(),
        duration: z.number().optional(),
        fileSize: z.number().optional(),
        displayOrder: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createAcademyVideo({
          ...input,
          uploadedBy: ctx.user.id,
        });
      }),

    // Update video (admin only)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(['hero', 'gallery_drills', 'gallery_highlights', 'gallery_skills', 'training', 'other']).optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateAcademyVideo(id, data);
      }),

    // Delete video (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAcademyVideo(input.id);
        return { success: true };
      }),
  }),

  // ==================== VIDEO EVENT TAGGING ====================
  videoEvents: router({
    // Get events for a video
    getByVideo: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoEvents(input.videoId);
      }),

    // Create video event tag
    create: staffProcedure
      .input(z.object({
        videoId: z.number(),
        playerId: z.number().optional(),
        eventType: z.enum(['goal', 'assist', 'key_pass', 'tackle', 'interception', 'save', 'shot', 'dribble', 'pass', 'cross', 'foul', 'card_yellow', 'card_red', 'substitution', 'corner', 'freekick', 'other']),
        timestamp: z.number(),
        duration: z.number().default(5),
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createVideoEvent({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // Update video event
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(['goal', 'assist', 'key_pass', 'tackle', 'interception', 'save', 'shot', 'dribble', 'pass', 'cross', 'foul', 'card_yellow', 'card_red', 'substitution', 'corner', 'freekick', 'other']).optional(),
        timestamp: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateVideoEvent(id, data);
      }),

    // Delete video event
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoEvent(input.id);
        return { success: true };
      }),

    // Get highlight reel (events filtered by type)
    getHighlights: protectedProcedure
      .input(z.object({ 
        videoId: z.number(),
        eventTypes: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        return db.getVideoHighlights(input.videoId, input.eventTypes);
       }),
  }),

  // ==================== POSITION RECOMMENDATIONS ====================
  positionRecommendation: router({
    // Get position recommendations for a player
    getRecommendations: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return recommendPositions(input.skills as PlayerSkills);
      }),
    // Get top 3 position recommendations
    getTopRecommendations: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return getTopPositionRecommendations(input.skills as PlayerSkills, 3);
      }),
    // Get position transition suggestions
    getTransitionSuggestions: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        currentPosition: z.string(),
        skills: z.object({
          speed: z.number().min(0).max(100),
          agility: z.number().min(0).max(100),
          power: z.number().min(0).max(100),
          stamina: z.number().min(0).max(100),
          dribbling: z.number().min(0).max(100),
          firstTouch: z.number().min(0).max(100),
          passing: z.number().min(0).max(100),
          shooting: z.number().min(0).max(100),
          heading: z.number().min(0).max(100),
          tackling: z.number().min(0).max(100),
          positioning: z.number().min(0).max(100),
          vision: z.number().min(0).max(100),
          decisionMaking: z.number().min(0).max(100),
          composure: z.number().min(0).max(100),
          leadership: z.number().min(0).max(100),
          workRate: z.number().min(0).max(100),
          reflexes: z.number().min(0).max(100).optional(),
          handling: z.number().min(0).max(100).optional(),
          distribution: z.number().min(0).max(100).optional(),
        }),
      }))
      .query(async ({ input }) => {
        return getPositionTransitionSuggestions(input.currentPosition, input.skills as PlayerSkills);
      }),
  }),

  // ==================== OPPONENTS ====================
  opponents: router({
    getAll: protectedProcedure.query(async () => {
      return db.getAllOpponents();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getOpponentById(input.id);
      }),
    create: staffProcedure
      .input(z.object({
        name: z.string().min(1),
        league: z.string().optional(),
        ageGroup: z.string().optional(),
        coachName: z.string().optional(),
        typicalFormation: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createOpponent({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id };
      }),
    update: staffProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        league: z.string().optional(),
        ageGroup: z.string().optional(),
        coachName: z.string().optional(),
        typicalFormation: z.string().optional(),
        playingStyle: z.string().optional(),
        strengths: z.string().optional(),
        weaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateOpponent(id, data);
      }),
    delete: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOpponent(input.id);
        return { success: true };
      }),
    // Get opponent videos
    getVideos: protectedProcedure
      .input(z.object({ opponentId: z.number() }))
      .query(async ({ input }) => {
        return db.getOpponentVideos(input.opponentId);
      }),
    // Analyze opponent using AI
    analyzeOpponent: staffProcedure
      .input(z.object({
        opponentId: z.number(),
        videoUrls: z.array(z.string()).optional(),
        previousResults: z.array(z.string()).optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const opponent = await db.getOpponentById(input.opponentId);
        if (!opponent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Opponent not found' });
        }

        const { analyzeOpponent } = await import('./aiOppositionAnalysis');
        const analysis = await analyzeOpponent({
          opponentName: opponent.name,
          videoUrls: input.videoUrls,
          previousResults: input.previousResults,
          knownFormation: opponent.typicalFormation || undefined,
          additionalNotes: input.additionalNotes,
        });

        // Update opponent with AI analysis
        await db.updateOpponent(input.opponentId, {
          playingStyle: analysis.playingStyle,
          strengths: JSON.stringify(analysis.strengths),
          weaknesses: JSON.stringify(analysis.weaknesses),
          keyPlayers: JSON.stringify(analysis.keyPlayers),
        });

        // Create match strategy
        const strategyId = await db.createMatchStrategy({
          opponentId: input.opponentId,
          matchDate: new Date(),
          ourFormation: analysis.recommendedFormation,
          tacticalApproach: analysis.tacticalApproach,
          keyFocusAreas: JSON.stringify(analysis.keyFocusAreas),
          playerInstructions: JSON.stringify(analysis.playerInstructions),
          setPieceStrategy: analysis.setPieceStrategy,
          predictedOutcome: analysis.predictedOutcome,
          confidence: analysis.confidence,
          createdBy: ctx.user.id,
        });

        return { ...analysis, strategyId };
      }),
    // Get match strategies
    getStrategies: protectedProcedure
      .input(z.object({ opponentId: z.number() }))
      .query(async ({ input }) => {
        return db.getMatchStrategies(input.opponentId);
      }),
  }),

  // ==================== MATCH EVENT SESSIONS ====================
  matchEventSessions: router({
    // Save a match event recording session
    save: protectedProcedure
      .input(z.object({
        sessionName: z.string().min(1),
        matchId: z.number().optional(),
        homeTeam: z.string().optional(),
        awayTeam: z.string().optional(),
        matchDate: z.date().optional(),
        events: z.array(z.any()),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const sessionId = await db.createMatchEventSession({
          sessionName: input.sessionName,
          matchId: input.matchId,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          matchDate: input.matchDate,
          eventsData: JSON.stringify(input.events),
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          createdBy: ctx.user.id,
          lastAutoSave: new Date(),
        });
        return { sessionId, success: true };
      }),

    // Update an existing session
    update: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        sessionName: z.string().optional(),
        events: z.array(z.any()),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateMatchEventSession(input.sessionId, {
          sessionName: input.sessionName,
          eventsData: JSON.stringify(input.events),
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          lastAutoSave: new Date(),
        });
        return { success: true };
      }),

    // Get all sessions for current user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const sessions = await db.getMatchEventSessions(ctx.user.id);
        return sessions.map((session: MatchEventSession) => ({
          ...session,
          events: JSON.parse(session.eventsData),
          metadata: session.metadata ? JSON.parse(session.metadata) : null,
        }));
      }),

    // Get a specific session by ID
    get: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const session = await db.getMatchEventSession(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
        }
        return {
          ...session,
          events: JSON.parse(session.eventsData),
          metadata: session.metadata ? JSON.parse(session.metadata) : null,
        };
      }),

    // Delete a session
    delete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchEventSession(input.sessionId);
        return { success: true };
      }),

    // Rename a session
    rename: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        newName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updateMatchEventSession(input.sessionId, {
          sessionName: input.newName,
        });
        return { success: true };
      }),
  }),

  // ==================== SAVED VIDEO ANALYSES ====================
  savedVideoAnalyses: router({
    // Save a video analysis
    save: protectedProcedure
      .input(z.object({
        videoName: z.string(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        teamColor: z.string().optional(),
        playerName: z.string().optional(),
        analysisData: z.string(), // JSON string
        isRealAnalysis: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const analysisId = await db.createSavedVideoAnalysis({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: analysisId };
      }),

    // Get all saved analyses for current user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getSavedVideoAnalyses(ctx.user.id);
      }),

    // Get a specific analysis
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSavedVideoAnalysis(input.id);
      }),

    // Delete an analysis
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSavedVideoAnalysis(input.id);
        return { success: true };
      }),
  }),

  // ==================== VIDEO CLIPS ====================
  videoClips: router({
    // Upload video to S3 and get URL
    uploadVideo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file
        contentType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import('./storage');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop();
        const fileKey = `videos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        
        return {
          fileKey,
          url,
        };
      }),

    // Create a new video clip
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.number().int().positive(),
        startTime: z.number().int().min(0).default(0),
        endTime: z.number().int().positive().optional(),
        teamId: z.number().int().optional(),
        matchId: z.number().int().optional(),
        tags: z.array(z.object({
          tagType: z.enum(['goal', 'assist', 'shot', 'pass', 'dribble', 'tackle', 'interception', 'save', 'error', 'foul', 'set_piece', 'highlight', 'custom']),
          timestamp: z.number().int().min(0),
          description: z.string().optional(),
          playerId: z.number().int().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const clip = await db.createVideoClip({
          title: input.title,
          description: input.description,
          videoUrl: input.videoUrl,
          thumbnailUrl: input.thumbnailUrl,
          duration: input.duration,
          startTime: input.startTime,
          endTime: input.endTime,
          teamId: input.teamId,
          matchId: input.matchId,
          createdBy: ctx.user.id,
        });

        // Create tags if provided
        if (input.tags && input.tags.length > 0) {
          for (const tag of input.tags) {
            await db.createVideoTag({
              clipId: clip.id,
              tagType: tag.tagType,
              timestamp: tag.timestamp,
              description: tag.description,
              playerId: tag.playerId,
              createdBy: ctx.user.id,
            });
          }
        }

        return { clipId: clip.id, success: true };
      }),

    // List all video clips
    list: protectedProcedure
      .input(z.object({
        teamId: z.number().int().optional(),
        matchId: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }).optional())
      .query(async ({ input }) => {
        return db.listVideoClips(input);
      }),

    // Get a single video clip with tags
    get: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const clip = await db.getVideoClip(input.id);
        if (!clip) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video clip not found' });
        }
        const tags = await db.getVideoClipTags(input.id);
        return { ...clip, tags };
      }),

    // Delete a video clip
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        const clip = await db.getVideoClip(input.id);
        if (!clip) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Video clip not found' });
        }
        if (clip.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own clips' });
        }
        await db.deleteVideoClip(input.id);
        return { success: true };
      }),
  }),

  // ==================== OPPONENT VIDEO ANALYSIS ====================
  analysis: router({
    analyzeOpponentVideo: coachProcedure
      .input(z.object({ 
        videoUrl: z.string().url(),
        opponentJerseyColor: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Analyze video with AI vision
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a professional football tactical analyst. Analyze the provided match video and extract tactical information about the team. Focus on formation, playing style, strengths, weaknesses, key players, and tactical patterns.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this football match video and provide: 1) Formation (e.g., 4-3-3, 4-4-2), 2) Playing style (e.g., possession-based, counter-attacking), 3) 4-5 strengths, 4) 4-5 weaknesses to exploit, 5) 3-4 key players with their numbers, positions, and threat level (high/medium/low), 6) 4-5 tactical patterns observed, 7) 3-4 tactical recommendations to counter this team. ${input.opponentJerseyColor ? `Focus on the team wearing ${input.opponentJerseyColor} jerseys as the opponent team.` : ''} Return as JSON with keys: formation, playingStyle, strengths (array), weaknesses (array), keyPlayers (array of {number, position, threat, description}), tacticalPatterns (array), recommendations (array).`
                },
                {
                  type: 'file_url',
                  file_url: {
                    url: input.videoUrl,
                    mime_type: 'video/mp4'
                  }
                }
              ]
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'opponent_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  formation: { type: 'string' },
                  playingStyle: { type: 'string' },
                  strengths: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  weaknesses: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  keyPlayers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        number: { type: 'integer' },
                        position: { type: 'string' },
                        threat: { type: 'string', enum: ['high', 'medium', 'low'] },
                        description: { type: 'string' }
                      },
                      required: ['number', 'position', 'threat', 'description'],
                      additionalProperties: false
                    }
                  },
                  tacticalPatterns: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['formation', 'playingStyle', 'strengths', 'weaknesses', 'keyPlayers', 'tacticalPatterns', 'recommendations'],
                additionalProperties: false
              }
            }
          }
        });

        const content = response?.choices?.[0]?.message?.content;
        if (!content) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to analyze video' });
        }

        // Handle content as string or array
        const contentText = typeof content === 'string' ? content : JSON.stringify(content);
        const analysis = JSON.parse(contentText);
        
        // Send notification to coaches about completed analysis
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '🎬 Opponent Video Analysis Complete',
            content: `New opponent analysis completed!\n\n**Formation:** ${analysis.formation}\n**Style:** ${analysis.playingStyle}\n**Key Strengths:** ${analysis.strengths.slice(0, 2).join(', ')}\n**Weaknesses to Exploit:** ${analysis.weaknesses.slice(0, 2).join(', ')}\n\nView full analysis in Tactical Hub.`
          });
        } catch (error) {
          console.error('Failed to send video analysis notification:', error);
        }
        
        return analysis;
      }),
  }),

  // ==================== TACTICAL PLANS ====================
  tacticalPlans: router({
    savePlan: coachProcedure
      .input(z.object({
        name: z.string(),
        formation: z.string(),
        attackPattern: z.string().optional(),
        playerPositions: z.array(z.object({
          playerId: z.number(),
          x: z.number(),
          z: z.number()
        })),
        playerPaths: z.record(z.string(), z.array(z.object({
          x: z.number(),
          z: z.number()
        }))).optional(),
        description: z.string().optional(),
        isPublic: z.boolean().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [plan] = await db.insert(tacticalPlans).values({
          createdBy: ctx.user.id,
          name: input.name,
          formation: input.formation,
          attackPattern: input.attackPattern,
          playerPositions: JSON.stringify(input.playerPositions),
          playerPaths: input.playerPaths ? JSON.stringify(input.playerPaths) : null,
          description: input.description,
          isPublic: input.isPublic
        });
        
        // Send notification to coaches about new tactical plan
        try {
          const dbModule = await import('./db');
          const { users } = await import('../drizzle/schema');
          const { inArray } = await import('drizzle-orm');
          
          const coaches = await db.select().from(users)
            .where(inArray(users.role, ['admin', 'coach']));
          
          for (const coach of coaches) {
            if (coach.id !== ctx.user.id) { // Don't notify the creator
              await dbModule.createNotification({
                userId: coach.id,
                title: '📋 New Tactical Plan Created',
                message: `${ctx.user.name} created a new tactical plan: "${input.name}" (${input.formation})`,
                type: 'info',
                category: 'training'
              });
            }
          }
        } catch (error) {
          console.error('Failed to send tactical plan notifications:', error);
        }
        
        return { success: true, planId: plan.insertId };
      }),

    getMyPlans: coachProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const plans = await db.select().from(tacticalPlans)
          .where(eq(tacticalPlans.createdBy, ctx.user.id))
          .orderBy(desc(tacticalPlans.createdAt));
        
        return plans.map(plan => ({
          ...plan,
          playerPositions: typeof plan.playerPositions === 'string' 
            ? JSON.parse(plan.playerPositions) 
            : plan.playerPositions,
          playerPaths: plan.playerPaths && typeof plan.playerPaths === 'string'
            ? JSON.parse(plan.playerPaths)
            : plan.playerPaths
        }));
      }),

    deletePlan: coachProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(tacticalPlans)
          .where(and(
            eq(tacticalPlans.id, input.planId),
            eq(tacticalPlans.createdBy, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // AI Tactical Planner endpoints
    saveAIPlan: coachProcedure
      .input(z.object({
        name: z.string(),
        teamFormation: z.string(),
        teamPlayStyle: z.string(),
        teamStrengths: z.array(z.string()),
        teamKeyPlayers: z.string().optional(),
        opponentName: z.string().optional(),
        opponentFormation: z.string(),
        opponentPlayStyle: z.string(),
        opponentWeaknesses: z.array(z.string()),
        opponentKeyPlayers: z.string().optional(),
        tacticalOptions: z.array(z.any()),
        selectedTacticId: z.number(),
        matchId: z.number().optional(),
        matchDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [plan] = await db.insert(tacticalPlans).values({
          createdBy: ctx.user.id,
          name: input.name,
          formation: input.teamFormation,
          teamFormation: input.teamFormation,
          teamPlayStyle: input.teamPlayStyle,
          teamStrengths: JSON.stringify(input.teamStrengths),
          teamKeyPlayers: input.teamKeyPlayers,
          opponentName: input.opponentName,
          opponentFormation: input.opponentFormation,
          opponentPlayStyle: input.opponentPlayStyle,
          opponentWeaknesses: JSON.stringify(input.opponentWeaknesses),
          opponentKeyPlayers: input.opponentKeyPlayers,
          tacticalOptions: JSON.stringify(input.tacticalOptions),
          selectedTacticId: input.selectedTacticId,
          matchId: input.matchId,
          matchDate: input.matchDate,
          description: input.notes,
          playerPositions: JSON.stringify([]), // Empty for AI plans
          isPublic: false,
        });
        
        return { success: true, planId: plan.insertId };
      }),

    getAIPlans: coachProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, desc, isNotNull } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const plans = await db.select().from(tacticalPlans)
          .where(eq(tacticalPlans.createdBy, ctx.user.id))
          .orderBy(desc(tacticalPlans.createdAt));
        
        // Filter only AI plans (those with tacticalOptions)
        return plans
          .filter(plan => plan.tacticalOptions)
          .map(plan => ({
            id: plan.id,
            name: plan.name,
            teamFormation: plan.teamFormation,
            opponentName: plan.opponentName,
            opponentFormation: plan.opponentFormation,
            matchDate: plan.matchDate,
            createdAt: plan.createdAt,
          }));
      }),

    loadAIPlan: coachProcedure
      .input(z.object({ planId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { tacticalPlans } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [plan] = await db.select().from(tacticalPlans)
          .where(and(
            eq(tacticalPlans.id, input.planId),
            eq(tacticalPlans.createdBy, ctx.user.id)
          ));
        
        if (!plan) throw new Error('Plan not found');
        
        return {
          name: plan.name,
          teamFormation: plan.teamFormation,
          teamPlayStyle: plan.teamPlayStyle,
          teamStrengths: plan.teamStrengths ? JSON.parse(plan.teamStrengths as string) : [],
          teamKeyPlayers: plan.teamKeyPlayers,
          opponentName: plan.opponentName,
          opponentFormation: plan.opponentFormation,
          opponentPlayStyle: plan.opponentPlayStyle,
          opponentWeaknesses: plan.opponentWeaknesses ? JSON.parse(plan.opponentWeaknesses as string) : [],
          opponentKeyPlayers: plan.opponentKeyPlayers,
          tacticalOptions: plan.tacticalOptions ? JSON.parse(plan.tacticalOptions as string) : [],
          selectedTacticId: plan.selectedTacticId,
          matchId: plan.matchId,
          matchDate: plan.matchDate,
          notes: plan.description,
        };
      }),
  }),

  // Players management for tactical tools
  tacticalPlayers: router({
    getAll: coachProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const allPlayers = await db.select().from(players)
          .where(eq(players.status, 'active'));
        
        return allPlayers;
      }),

    getByPosition: coachProcedure
      .input(z.object({
        position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward'])
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const positionPlayers = await db.select().from(players)
          .where(and(
            eq(players.position, input.position),
            eq(players.status, 'active')
          ));
        
        return positionPlayers;
      }),

    getByTeam: coachProcedure
      .input(z.object({
        teamId: z.number()
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const teamPlayers = await db.select().from(players)
          .where(and(
            eq(players.teamId, input.teamId),
            eq(players.status, 'active')
          ));
        
        return teamPlayers;
      }),
  }),

  // ==================== COACH EDUCATION ====================
  coachEducation: router({
    getCourses: publicProcedure
      .query(async () => {
        // Return static FIFA coaching course data
        return [
          {
            id: 1,
            title: 'Grassroots Coaching Certificate',
            titleAr: 'شهادة تدريب القاعدة الشعبية',
            description: 'Entry-level coaching for youth development (Ages 4-12)',
            descriptionAr: 'تدريب مستوى الدخول لتطوير الشباب',
            category: 'grassroots',
            level: 'Grassroots',
            duration: 40,
            thumbnailUrl: null,
            isPublished: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            title: 'UEFA/FIFA C License',
            titleAr: 'رخصة C من FIFA',
            description: 'Foundation level for coaching youth teams',
            descriptionAr: 'المستوى الأساسي لتدريب فرق الشباب',
            category: 'c_license',
            level: 'C License',
            duration: 120,
            thumbnailUrl: null,
            isPublished: true,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            title: 'UEFA/FIFA B License',
            titleAr: 'رخصة B من FIFA',
            description: 'Advanced coaching for semi-professional levels',
            descriptionAr: 'تدريب متقدم للمستويات شبه الاحترافية',
            category: 'b_license',
            level: 'B License',
            duration: 200,
            thumbnailUrl: null,
            isPublished: true,
            order: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 4,
            title: 'UEFA/FIFA A License',
            titleAr: 'رخصة A من FIFA',
            description: 'Professional-level coaching qualification',
            descriptionAr: 'مؤهل تدريب على المستوى المحترف',
            category: 'a_license',
            level: 'A License',
            duration: 300,
            thumbnailUrl: null,
            isPublished: true,
            order: 4,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 5,
            title: 'UEFA Pro / FIFA Pro License',
            titleAr: 'رخصة Pro من FIFA',
            description: 'Highest coaching qualification for top-tier clubs',
            descriptionAr: 'أعلى مؤهل تدريبي للأندية الكبرى',
            category: 'pro_license',
            level: 'Pro License',
            duration: 400,
            thumbnailUrl: null,
            isPublished: true,
            order: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }),

    getQuizQuestions: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { quizQuestions } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const dbQuestions = await db.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        // If no questions in database, return fallback questions
        if (dbQuestions.length === 0) {
          const fallbackQuestions = [
            {
              id: 1,
              courseId: input.courseId,
              question: 'What is the primary objective of a 4-3-3 formation?',
              options: JSON.stringify([
                'Defensive stability',
                'Width in attack and midfield control',
                'Counter-attacking speed',
                'Physical dominance'
              ]),
              correctAnswer: 1,
              explanation: 'The 4-3-3 formation provides width in attack through wingers while maintaining midfield control with three central midfielders.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 2,
              courseId: input.courseId,
              question: 'When should a coach use positive reinforcement?',
              options: JSON.stringify([
                'Only after winning',
                'Immediately after good performance',
                'At the end of training',
                'Only for star players'
              ]),
              correctAnswer: 1,
              explanation: 'Positive reinforcement is most effective when given immediately after the desired behavior to strengthen the connection.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 3,
              courseId: input.courseId,
              question: 'What is the offside rule in football?',
              options: JSON.stringify([
                'Player cannot be ahead of the ball',
                'Player cannot be in opponent half',
                'Player is offside if ahead of second-last opponent when ball is played',
                'Player must stay behind midfield line'
              ]),
              correctAnswer: 2,
              explanation: 'A player is in an offside position if they are nearer to the opponent\'s goal line than both the ball and the second-last opponent when the ball is played to them.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 4,
              courseId: input.courseId,
              question: 'What is the best way to develop young players\' technical skills?',
              options: JSON.stringify([
                'Focus only on physical training',
                'Repetitive drills with game-like scenarios',
                'Only play matches',
                'Focus on tactics only'
              ]),
              correctAnswer: 1,
              explanation: 'Technical skills are best developed through repetitive drills that simulate game situations, allowing players to practice in realistic contexts.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 5,
              courseId: input.courseId,
              question: 'What is the role of a defensive midfielder in a 4-2-3-1 formation?',
              options: JSON.stringify([
                'Score goals',
                'Shield defense and distribute play',
                'Mark wingers',
                'Take corners'
              ]),
              correctAnswer: 1,
              explanation: 'In a 4-2-3-1, the defensive midfielder shields the back four and acts as a link between defense and attack through distribution.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 6,
              courseId: input.courseId,
              question: 'How should a coach handle player conflicts?',
              options: JSON.stringify([
                'Ignore them',
                'Address immediately and privately',
                'Punish both players',
                'Let players resolve it themselves'
              ]),
              correctAnswer: 1,
              explanation: 'Conflicts should be addressed immediately but privately to maintain team harmony and respect players\' dignity.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 7,
              courseId: input.courseId,
              question: 'What is the purpose of a warm-up before training?',
              options: JSON.stringify([
                'Waste time',
                'Prepare body and mind, prevent injuries',
                'Tire players out',
                'Show off skills'
              ]),
              correctAnswer: 1,
              explanation: 'Warm-ups prepare the body physically and mentally for activity while reducing injury risk through gradual intensity increase.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 8,
              courseId: input.courseId,
              question: 'What is pressing in football?',
              options: JSON.stringify([
                'Pushing opponents',
                'Applying pressure to win ball back quickly',
                'Running fast',
                'Defending deep'
              ]),
              correctAnswer: 1,
              explanation: 'Pressing is a tactical approach where players apply immediate pressure on opponents to win the ball back quickly and high up the pitch.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 9,
              courseId: input.courseId,
              question: 'How often should youth players train per week?',
              options: JSON.stringify([
                'Every day',
                '2-4 times depending on age',
                'Once a week',
                '7 times a week'
              ]),
              correctAnswer: 1,
              explanation: 'Youth players should train 2-4 times per week depending on age, allowing adequate recovery and avoiding burnout.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 10,
              courseId: input.courseId,
              question: 'What is the most important quality in a goalkeeper?',
              options: JSON.stringify([
                'Height only',
                'Positioning and decision-making',
                'Strength only',
                'Speed only'
              ]),
              correctAnswer: 1,
              explanation: 'While physical attributes help, positioning and decision-making are crucial as they determine when to come out, stay, or distribute.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 11,
              courseId: input.courseId,
              question: 'What is a counter-attack?',
              options: JSON.stringify([
                'Defending only',
                'Quick transition from defense to attack',
                'Slow build-up play',
                'Passing backwards'
              ]),
              correctAnswer: 1,
              explanation: 'A counter-attack is a rapid transition from defensive to offensive play, exploiting space left by the opposing team.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 12,
              courseId: input.courseId,
              question: 'How should a coach communicate with players?',
              options: JSON.stringify([
                'Shout and criticize',
                'Clear, positive, and constructive',
                'Never speak',
                'Only give orders'
              ]),
              correctAnswer: 1,
              explanation: 'Effective coaching communication is clear, positive, and constructive, fostering learning and confidence.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 13,
              courseId: input.courseId,
              question: 'What is the purpose of tactical periodization?',
              options: JSON.stringify([
                'Random training',
                'Structured training based on match demands',
                'Only physical training',
                'No planning'
              ]),
              correctAnswer: 1,
              explanation: 'Tactical periodization structures training around the tactical, technical, physical, and mental demands of the game.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 14,
              courseId: input.courseId,
              question: 'What is the role of a full-back in modern football?',
              options: JSON.stringify([
                'Only defend',
                'Defend and support attack',
                'Stay in position always',
                'Only attack'
              ]),
              correctAnswer: 1,
              explanation: 'Modern full-backs must defend their flank while also supporting attacks by overlapping and providing width.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 15,
              courseId: input.courseId,
              question: 'How should a coach develop team cohesion?',
              options: JSON.stringify([
                'Isolate players',
                'Team activities and clear communication',
                'Favor certain players',
                'Avoid team meetings'
              ]),
              correctAnswer: 1,
              explanation: 'Team cohesion develops through shared activities, clear communication, and creating an inclusive environment.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 16,
              courseId: input.courseId,
              question: 'What is the purpose of a cool-down after training?',
              options: JSON.stringify([
                'Waste time',
                'Gradually lower heart rate and prevent soreness',
                'Start next session',
                'Punish players'
              ]),
              correctAnswer: 1,
              explanation: 'Cool-downs gradually reduce heart rate, remove lactic acid, and help prevent muscle soreness and injury.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 17,
              courseId: input.courseId,
              question: 'What is the best formation for possession-based football?',
              options: JSON.stringify([
                '5-4-1',
                '4-3-3 or 4-2-3-1',
                '3-5-2',
                '4-4-2'
              ]),
              correctAnswer: 1,
              explanation: 'Formations like 4-3-3 and 4-2-3-1 provide numerical superiority in midfield, crucial for maintaining possession.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 18,
              courseId: input.courseId,
              question: 'How should a coach manage player rotation?',
              options: JSON.stringify([
                'Never rotate',
                'Based on fitness, form, and tactical needs',
                'Random selection',
                'Always play same 11'
              ]),
              correctAnswer: 1,
              explanation: 'Rotation should consider player fitness, current form, tactical requirements, and long-term development.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 19,
              courseId: input.courseId,
              question: 'What is the most effective way to teach tactics?',
              options: JSON.stringify([
                'Only lectures',
                'Visual demonstrations and practice',
                'No explanation',
                'Only written notes'
              ]),
              correctAnswer: 1,
              explanation: 'Tactics are best taught through visual demonstrations (video, board) followed by practical application in training.',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 20,
              courseId: input.courseId,
              question: 'What is the key to successful youth development?',
              options: JSON.stringify([
                'Winning only',
                'Long-term player development and education',
                'Physical training only',
                'Early specialization'
              ]),
              correctAnswer: 1,
              explanation: 'Successful youth development prioritizes long-term player growth, technical skills, and education over short-term results.',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          // Parse JSON options for fallback questions
          return fallbackQuestions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }));
        }
        
        // Parse JSON options for database questions
        return dbQuestions.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
      }),

    submitQuiz: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        courseTitle: z.string(),
        courseLevel: z.string(),
        answers: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts, quizQuestions, courseEnrollments } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        const { generateCertificate, generateCertificateNumber } = await import('./certificateGenerator');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get questions to calculate score
        const questions = await db.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        let correct = 0;
        questions.forEach((q, index) => {
          if (input.answers[index] === q.correctAnswer) {
            correct++;
          }
        });
        
        const score = Math.round((correct / questions.length) * 100);
        const passed = score >= 70;
        
        // Save attempt
        const [attempt] = await db.insert(quizAttempts).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          score,
          answers: input.answers,
          passed
        }).$returningId();
        
        let certificateUrl: string | null = null;
        
        // Generate certificate if passed
        if (passed) {
          try {
            const certificateNumber = generateCertificateNumber();
            certificateUrl = await generateCertificate({
              coachName: ctx.user.name || 'Coach',
              courseTitle: input.courseTitle,
              level: input.courseLevel,
              score,
              date: new Date(),
              certificateNumber
            });
            
            // Update enrollment with certificate
            const enrollment = await db.select()
              .from(courseEnrollments)
              .where(and(
                eq(courseEnrollments.userId, ctx.user.id),
                eq(courseEnrollments.courseId, input.courseId)
              ))
              .limit(1);
            
            if (enrollment.length > 0) {
              await db.update(courseEnrollments)
                .set({ 
                  certificateUrl,
                  completedAt: new Date(),
                  progress: 100
                })
                .where(eq(courseEnrollments.id, enrollment[0].id));
            } else {
              // Create enrollment if doesn't exist
              await db.insert(courseEnrollments).values({
                userId: ctx.user.id,
                courseId: input.courseId,
                certificateUrl,
                completedAt: new Date(),
                progress: 100
              });
            }
          } catch (error) {
            console.error('Failed to generate certificate:', error);
          }
        }
        
        // Check and award badges
        const earnedBadges = await checkAndAwardBadges(ctx.user.id, score, passed, db);
        
        // Check and update challenge progress
        const completedChallenges = await checkAndUpdateChallengeProgress(ctx.user.id, score, passed, db);
        
        return { score, passed, certificateUrl, earnedBadges, completedChallenges };
      }),

    getMyAttempts: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, ctx.user.id))
          .orderBy(desc(quizAttempts.attemptedAt));
      }),

    getMyEnrollments: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { courseEnrollments } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, ctx.user.id))
          .orderBy(desc(courseEnrollments.enrolledAt));
      }),

    generateModulePDF: protectedProcedure
      .input(z.object({
        level: z.string(),
        moduleId: z.string()
      }))
      .mutation(async ({ input }) => {
        const { generateModulePDF } = await import('./pdfGenerator');
        
        try {
          const result = await generateModulePDF(input.level, input.moduleId);
          return { url: result.url };
        } catch (error) {
          throw new Error('Failed to generate PDF');
        }
      }),

    getUserBadges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userBadges, badges } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const db = await getDb();
          if (!db) return [];
          
          const userBadgesList = await db.select({
            id: userBadges.id,
            badgeId: userBadges.badgeId,
            earnedAt: userBadges.earnedAt,
            progress: userBadges.progress,
            name: badges.name,
            description: badges.description,
            icon: badges.icon,
            category: badges.category
          })
            .from(userBadges)
            .innerJoin(badges, eq(userBadges.badgeId, badges.id))
            .where(eq(userBadges.userId, ctx.user.id));
          
          return userBadgesList;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getUserBadges error (tables may not exist):', error);
          return [];
        }
      }),

    getQuizReview: protectedProcedure
      .input(z.object({
        attemptId: z.number()
      }))
      .query(async ({ input, ctx }) => {
        const { getQuizReview } = await import('./getQuizReview');
        return await getQuizReview(input.attemptId);
      }),
  }),

  // ==================== DATA ANALYSIS ====================
  dataAnalysis: router({
    getPlayerMatchStats: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        matchId: z.number()
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { playerMatchStats, matches, players } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return null;
        
        const stats = await db.select()
          .from(playerMatchStats)
          .where(and(
            eq(playerMatchStats.playerId, input.playerId),
            eq(playerMatchStats.matchId, input.matchId)
          ))
          .limit(1);
        
        return stats[0] || null;
      }),

    getPlayerMatches: protectedProcedure
      .input(z.object({
        playerId: z.number()
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { matches, playerMatchStats } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        // Get all matches where player participated
        const playerStats = await db.select({
          matchId: playerMatchStats.matchId,
          minutesPlayed: playerMatchStats.minutesPlayed
        })
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId));
        
        const matchIds = playerStats.map(s => s.matchId);
        if (matchIds.length === 0) return [];
        
        const { inArray } = await import('drizzle-orm');
        const matchesData = await db.select()
          .from(matches)
          .where(inArray(matches.id, matchIds))
          .orderBy(desc(matches.matchDate));
        
        return matchesData;
      }),

    getAllPlayers: protectedProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { players } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(players)
          .where(eq(players.status, 'active'));
      }),

    getAllMatches: protectedProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { matches } = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(matches)
          .orderBy(desc(matches.matchDate))
          .limit(50);
      }),
    
    getUserBadges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userBadges, badges } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          
          const db = await getDb();
          if (!db) return [];
          
          const userBadgesList = await db.select({
            id: userBadges.id,
            badgeId: userBadges.badgeId,
            earnedAt: userBadges.earnedAt,
            progress: userBadges.progress,
            name: badges.name,
            description: badges.description,
            icon: badges.icon,
            category: badges.category
          })
            .from(userBadges)
            .innerJoin(badges, eq(userBadges.badgeId, badges.id))
            .where(eq(userBadges.userId, ctx.user.id));
          
          return userBadgesList;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getUserBadges error (tables may not exist):', error);
          return [];
        }
      }),
    
    getAllBadges: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { badges } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(badges)
          .where(eq(badges.isActive, true));
      }),
    
    getCoachStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { quizAttempts, courseEnrollments } = await import('../drizzle/schema');
        const { eq, sql, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return null;
        
        // Get all quiz attempts for this user
        const attempts = await db.select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, ctx.user.id))
          .orderBy(desc(quizAttempts.attemptedAt));
        
        // Get completed courses
        const completedCourses = await db.select()
          .from(courseEnrollments)
          .where(sql`${courseEnrollments.userId} = ${ctx.user.id} AND ${courseEnrollments.completedAt} IS NOT NULL`);
        
        // Calculate statistics
        const totalAttempts = attempts.length;
        const averageScore = totalAttempts > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
          : 0;
        
        // Prepare performance data for chart (last 10 attempts)
        const performanceData = attempts.slice(0, 10).reverse().map(a => ({
          date: new Date(a.attemptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: a.score
        }));
        
        return {
          completedCourses: completedCourses.length,
          totalAttempts,
          averageScore,
          performanceData
        };
      }),
    
    getLeaderboard: publicProcedure
      .query(async () => {
        try {
          const { getDb } = await import('./db');
          const { users, userBadges, quizAttempts } = await import('../drizzle/schema');
          const { sql, desc } = await import('drizzle-orm');
          
          const db = await getDb();
          if (!db) return [];
          
          // Get top coaches by badge count and average score
          const leaderboardData = await db.select({
            userId: users.id,
            userName: users.name,
            badgeCount: sql<number>`COUNT(DISTINCT ${userBadges.id})`,
            avgScore: sql<number>`AVG(${quizAttempts.score})`
          })
            .from(users)
            .leftJoin(userBadges, sql`${users.id} = ${userBadges.userId}`)
            .leftJoin(quizAttempts, sql`${users.id} = ${quizAttempts.userId}`)
            .groupBy(users.id, users.name)
            .orderBy(desc(sql`COUNT(DISTINCT ${userBadges.id})`), desc(sql`AVG(${quizAttempts.score})`))
            .limit(10);
          
          return leaderboardData;
        } catch (error) {
          // Tables don't exist yet, return empty array
          console.log('getLeaderboard error (tables may not exist):', error);
          return [];
        }
      }),
    
    getActiveChallenges: publicProcedure
      .query(async () => {
        const { getDb } = await import('./db');
        const { challenges } = await import('../drizzle/schema');
        const { and, eq, gte, lte } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const now = new Date();
        return await db.select()
          .from(challenges)
          .where(and(
            eq(challenges.isActive, true),
            lte(challenges.startDate, now),
            gte(challenges.endDate, now)
          ));
      }),
    
    getUserChallenges: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getDb } = await import('./db');
          const { userChallenges, challenges } = await import('../drizzle/schema');
          const { eq, and, gte } = await import('drizzle-orm');
          
          const db = await getDb();
          if (!db) return [];
          
          const now = new Date();
          
          const userChallengesList = await db.select({
            id: userChallenges.id,
            challengeId: userChallenges.challengeId,
            progress: userChallenges.progress,
            completed: userChallenges.completed,
            completedAt: userChallenges.completedAt,
            rewardClaimed: userChallenges.rewardClaimed,
            title: challenges.title,
            description: challenges.description,
            type: challenges.type,
            criteria: challenges.criteria,
            reward: challenges.reward,
            endDate: challenges.endDate
          })
            .from(userChallenges)
            .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
            .where(and(
              eq(userChallenges.userId, ctx.user.id),
              eq(challenges.isActive, true),
              gte(challenges.endDate, now)
            ));
          
          return userChallengesList;
        } catch (error) {
          // Table doesn't exist yet, return empty array
          console.log('getUserChallenges error (table may not exist):', error);
          return [];
        }
      }),
    
    claimReward: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await claimChallengeReward(ctx.user.id, input.challengeId, db);
        
        if (!result.success) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Cannot claim reward. Challenge not completed or already claimed.' 
          });
        }
        
        return result;
      }),
  }),

  // Training Library
  trainingLibrary: router({
    getExercises: publicProcedure
      .input(z.object({
        category: z.enum(['warm-up', 'technical', 'tactical', 'physical', 'cool-down']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        search: z.string().optional()
      }).optional())
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { eq, and, like, or } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        let conditions = [];
        
        if (input?.category) {
          conditions.push(eq(trainingExercises.category, input.category));
        }
        
        if (input?.difficulty) {
          conditions.push(eq(trainingExercises.difficulty, input.difficulty));
        }
        
        if (input?.search) {
          conditions.push(
            or(
              like(trainingExercises.title, `%${input.search}%`),
              like(trainingExercises.description, `%${input.search}%`)
            )
          );
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        return await db.select()
          .from(trainingExercises)
          .where(whereClause);
      }),
    
    getExerciseById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return null;
        
        const result = await db.select()
          .from(trainingExercises)
          .where(eq(trainingExercises.id, input.id))
          .limit(1);
        
        return result[0] || null;
      }),
    
    toggleFavorite: protectedProcedure
      .input(z.object({ exerciseId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { exerciseFavorites } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if already favorited
        const existing = await db.select()
          .from(exerciseFavorites)
          .where(and(
            eq(exerciseFavorites.userId, ctx.user.id),
            eq(exerciseFavorites.exerciseId, input.exerciseId)
          ))
          .limit(1);
        
        if (existing.length > 0) {
          // Remove favorite
          await db.delete(exerciseFavorites)
            .where(eq(exerciseFavorites.id, existing[0].id));
          return { favorited: false };
        } else {
          // Add favorite
          await db.insert(exerciseFavorites).values({
            userId: ctx.user.id,
            exerciseId: input.exerciseId
          });
          return { favorited: true };
        }
      }),
    
    getFavorites: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { exerciseFavorites, trainingExercises } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        const favorites = await db.select({
          id: trainingExercises.id,
          title: trainingExercises.title,
          description: trainingExercises.description,
          category: trainingExercises.category,
          difficulty: trainingExercises.difficulty,
          duration: trainingExercises.duration
        })
          .from(exerciseFavorites)
          .innerJoin(trainingExercises, eq(exerciseFavorites.exerciseId, trainingExercises.id))
          .where(eq(exerciseFavorites.userId, ctx.user.id));
        
        return favorites;
      }),
    
    initializeSampleData: publicProcedure
      .mutation(async () => {
        const { getDb } = await import('./db');
        const { trainingExercises } = await import('../drizzle/schema');
        const { sampleExercises } = await import('./sampleExercises');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if exercises already exist
        const existing = await db.select().from(trainingExercises).limit(1);
        if (existing.length > 0) {
          return { message: 'Sample data already exists' };
        }
        
        await db.insert(trainingExercises).values(sampleExercises);
        return { message: 'Sample data initialized successfully' };
      }),
  }),

  // Notifications V2 (Enhanced)
  notificationsV2: router({
    getNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return [];
        
        return await db.select()
          .from(notifications)
          .where(eq(notifications.userId, ctx.user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50);
      }),
    
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and, sql } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return 0;
        
        const result = await db.select({ count: sql<number>`COUNT(*)` })
          .from(notifications)
          .where(and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          ));
        
        return result[0]?.count || 0;
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { notifications } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(notifications)
          .set({ isRead: true, readAt: new Date() })
          .where(and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          ));
        
        return { success: true };
      }),
  }),

  // AI Coach Assistant
  aiCoach: router({
    askQuestion: protectedProcedure
      .input(z.object({
        question: z.string(),
        context: z.enum(['tactical', 'training', 'analysis', 'general']).optional(),
        playerId: z.number().optional(),
        teamId: z.number().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Gather context data from database
        let contextData = '';
        
        // If player ID provided, get player data
        if (input.playerId) {
          const player = await database.select().from(players).where(eq(players.id, input.playerId)).limit(1);
          if (player[0]) {
            const stats = await database.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, input.playerId))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(5);
            
            contextData += `\n\n**Player Context:**\n`;
            contextData += `- Name: ${player[0].name}\n`;
            contextData += `- Position: ${player[0].position}\n`;
            contextData += `- Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}\n`;
            
            if (stats.length > 0) {
              const avgTechnical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.technicalScore || 0), 0) / stats.length;
              const avgPhysical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.physicalScore || 0), 0) / stats.length;
              const avgTactical = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.tacticalScore || 0), 0) / stats.length;
              const avgMental = stats.reduce((sum: number, s: typeof stats[0]) => sum + (s.mentalScore || 0), 0) / stats.length;
              
              contextData += `\n**Recent Performance (Last 5 sessions):**\n`;
              contextData += `- Technical Score: ${avgTechnical.toFixed(1)}/100\n`;
              contextData += `- Physical Score: ${avgPhysical.toFixed(1)}/100\n`;
              contextData += `- Tactical Score: ${avgTactical.toFixed(1)}/100\n`;
              contextData += `- Mental Score: ${avgMental.toFixed(1)}/100\n`;
            }
          }
        }
        
        // If team ID provided, get team data
        if (input.teamId) {
          const team = await database.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
          if (team[0]) {
            const teamPlayers = await database.select().from(players).where(eq(players.teamId, input.teamId));
            
            contextData += `\n\n**Team Context:**\n`;
            contextData += `- Team: ${team[0].name}\n`;
            contextData += `- Age Group: ${team[0].ageGroup}\n`;
            contextData += `- Players: ${teamPlayers.length}\n`;
          }
        }
        
        const systemPrompt = `You are an expert football (soccer) coach with deep knowledge of:
- Tactical systems and formations (4-3-3, 4-4-2, 3-5-2, etc.)
- Training methodologies for different age groups
- Match analysis and opponent scouting
- Player development and position-specific training
- Modern football concepts: pressing, transitions, positional play, counter-pressing

Provide practical, actionable advice that coaches can implement immediately. Use examples from professional football when relevant.

**IMPORTANT:** When analyzing player data, provide specific insights based on their actual scores. Identify weaknesses (scores below 70) and strengths (scores above 80). Suggest concrete drills and exercises to address specific areas.`;

        const userMessage = input.question + contextData;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        });

        const rawContent = response?.choices?.[0]?.message?.content;
        const answer = typeof rawContent === 'string' ? rawContent : 'I apologize, but I could not generate a response. Please try again.';
        
        return { answer, contextUsed: contextData };
      }),
      
    analyzePlayer: protectedProcedure
      .input(z.object({
        playerId: z.number()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get player data
        const player = await db.select().from(players).where(eq(players.id, input.playerId)).limit(1);
        if (!player[0]) {
          throw new Error('Player not found');
        }
        
        // Get recent stats
        const stats = await db.select().from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, input.playerId))
          .orderBy(desc(playerSkillScores.assessmentDate))
          .limit(10);
        
        // Get recent matches
        const matches = await db.select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.playerId, input.playerId))
          .orderBy(desc(playerMatchStats.createdAt))
          .limit(5);
        
        const contextData = `**Player Analysis Request**

Player: ${player[0].name}
Position: ${player[0].position}
Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}

**Performance Data (Last 10 sessions):**
${stats.map((s, i) => `Session ${i + 1}: Technical ${s.technicalScore}, Physical ${s.physicalScore}, Tactical ${s.tacticalScore}, Mental ${s.mentalScore}`).join('\n')}

**Recent Match Performance (Last 5 matches):**
${matches.map((m, i) => `Match ${i + 1}: Goals ${m.goals}, Assists ${m.assists}, Passes ${m.passes}, Shots ${m.shots}`).join('\n')}`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football analyst. Analyze the player data and provide a JSON response with: {"strengths": ["strength1", "strength2", "strength3"], "weaknesses": ["weakness1", "weakness2", "weakness3"], "recommendations": [{"title": "rec title", "description": "rec description"}]}. Be specific and data-driven.' },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        let analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Try to parse JSON response
        let structuredAnalysis: any = null;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysis.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1].trim() : analysis;
          structuredAnalysis = JSON.parse(jsonStr);
        } catch (e) {
          // Fallback to plain text analysis
          structuredAnalysis = {
            strengths: ['Consistent performance', 'Good work ethic', 'Team player'],
            weaknesses: ['Needs more data for detailed analysis'],
            recommendations: [
              { title: 'Continue Training', description: 'Maintain current training regimen and track progress regularly.' }
            ]
          };
        }
        
        return { 
          analysis, 
          playerName: player[0].name,
          strengths: structuredAnalysis.strengths || [],
          weaknesses: structuredAnalysis.weaknesses || [],
          recommendations: structuredAnalysis.recommendations || []
        };
      }),
      
    getMatchAdvice: protectedProcedure
      .input(z.object({
        matchId: z.number().optional(),
        teamId: z.number(),
        opponentFormation: z.string(),
        currentScore: z.string().optional(),
        matchMinute: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get team data
        const team = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players with their stats
        const teamPlayers = await db.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats for each player
        const playerStatsData = await Promise.all(
          teamPlayers.map(async (player) => {
            const stats = await db.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(3);
            
            const avgTechnical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / stats.length : 0;
            const avgPhysical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / stats.length : 0;
            const avgTactical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / stats.length : 0;
            
            return {
              name: player.name,
              position: player.position,
              technical: avgTechnical.toFixed(1),
              physical: avgPhysical.toFixed(1),
              tactical: avgTactical.toFixed(1)
            };
          })
        );
        
        // Get recent match results
        let recentMatches = [];
        if (input.matchId) {
          recentMatches = await db.select()
            .from(matches)
            .where(eq(matches.teamId, input.teamId))
            .orderBy(desc(matches.matchDate))
            .limit(3);
        }
        
        const contextData = `**Match Tactical Analysis Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Opponent Formation: ${input.opponentFormation}
${input.currentScore ? `Current Score: ${input.currentScore}` : ''}
${input.matchMinute ? `Match Minute: ${input.matchMinute}` : ''}

**Squad Analysis:**
${playerStatsData.map(p => `${p.name} (${p.position}): Technical ${p.technical}, Physical ${p.physical}, Tactical ${p.tactical}`).join('\n')}

**Recent Form:**
${recentMatches.length > 0 ? recentMatches.map((m, i) => `Match ${i + 1}: ${m.result} (${m.goalsFor}-${m.goalsAgainst})`).join('\n') : 'No recent match data'}`;
        
        const response = await invokeLLM({
          messages: [
            { 
              role: 'system', 
              content: 'You are an elite football tactical analyst. Analyze the team composition, opponent formation, and provide: 1) Recommended formation, 2) Tactical approach (possession/counter/pressing), 3) Key player instructions, 4) Substitution suggestions if applicable, 5) Set piece strategies. Be specific and tactical.' 
            },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const advice = typeof rawContent === 'string' ? rawContent : 'Tactical advice unavailable';
        
        return { advice, teamName: team[0].name };
      }),
      
    generateTrainingPlan: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        focusAreas: z.array(z.enum(['technical', 'tactical', 'physical', 'mental'])).optional(),
        duration: z.enum(['week', 'month']).default('week')
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get team data
        const team = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get all team players
        const teamPlayers = await db.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Analyze team weaknesses by aggregating player stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
          const stats = await db.select().from(playerSkillScores)
            .where(eq(playerSkillScores.playerId, player.id))
            .orderBy(desc(playerSkillScores.assessmentDate))
            .limit(5);
            return stats;
          })
        );
        
        const flatStats = allStats.flat();
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / flatStats.length : 0;
        const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / flatStats.length : 0;
        
        // Get recent matches to understand performance context
        const recentMatches = await db.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(desc(matches.matchDate))
          .limit(5);
        
        const wins = recentMatches.filter(m => m.result === 'win').length;
        const losses = recentMatches.filter(m => m.result === 'loss').length;
        
        const contextData = `**Training Plan Generation Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}
Duration: ${input.duration === 'week' ? '1 Week' : '1 Month'}
${input.focusAreas ? `Focus Areas: ${input.focusAreas.join(', ')}` : 'All areas'}

**Team Performance Analysis:**
- Technical Average: ${avgTechnical.toFixed(1)}/100 ${avgTechnical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgTechnical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Physical Average: ${avgPhysical.toFixed(1)}/100 ${avgPhysical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgPhysical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Tactical Average: ${avgTactical.toFixed(1)}/100 ${avgTactical < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgTactical > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}
- Mental Average: ${avgMental.toFixed(1)}/100 ${avgMental < 70 ? '⚠️ NEEDS IMPROVEMENT' : avgMental > 80 ? '✅ STRONG' : '➡️ ADEQUATE'}

**Recent Match Results (Last 5):**
${recentMatches.map((m, i) => `Match ${i + 1}: ${m.result?.toUpperCase()} ${m.goalsFor}-${m.goalsAgainst} vs ${m.opponent || 'Unknown'}`).join('\n')}
Form: ${wins}W ${losses}L (${((wins / recentMatches.length) * 100).toFixed(0)}% win rate)`;
        
        const systemPrompt = `You are an expert football training coordinator. Create a detailed ${input.duration === 'week' ? 'weekly' : 'monthly'} training plan that:

1. **Prioritizes weak areas** (scores below 70) with specific drills
2. **Maintains strong areas** (scores above 80) with maintenance work
3. **Balances workload** across technical, tactical, physical, and mental training
4. **Considers age group** - adjust intensity and complexity accordingly
5. **Includes specific drills** with names, duration, and objectives
6. **Progressive difficulty** - builds throughout the period

Format the plan as:
- Day-by-day breakdown (for week) or week-by-week (for month)
- Session type, duration, and intensity
- Specific drills with clear instructions
- Expected outcomes

Be practical and implementable by academy coaches.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const plan = typeof rawContent === 'string' ? rawContent : 'Training plan unavailable';
        
        return { 
          plan, 
          teamName: team[0].name,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1),
            mental: avgMental.toFixed(1)
          }
        };
      }),
  }),

  // ==================== MATCH REPORTS ====================
  matchReports: router({
    generate: protectedProcedure
      .input(z.object({
        matchId: z.number()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get match data
        const match = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
        if (!match[0]) {
          throw new Error('Match not found');
        }
        
        // Get match player stats
        const playerStats = await db.select()
          .from(playerMatchStats)
          .where(eq(playerMatchStats.matchId, input.matchId));
        
        // Get player details
        const playerDetails = await Promise.all(
          playerStats.map(async (stat) => {
            const player = await db.select().from(players).where(eq(players.id, stat.playerId)).limit(1);
            return {
              name: player[0]?.name || 'Unknown',
              position: player[0]?.position || 'Unknown',
              ...stat
            };
          })
        );
        
        // Get match events if available
        const events = await db.select()
          .from(matchEvents)
          .where(eq(matchEvents.matchId, input.matchId))
          .orderBy(matchEvents.minute);
        
        const contextData = `**Match Report Generation Request**

Match: ${match[0].opponent}
Date: ${match[0].matchDate ? new Date(match[0].matchDate).toLocaleDateString() : 'Unknown'}
Result: ${match[0].result?.toUpperCase() || 'Unknown'} (${match[0].goalsFor || 0}-${match[0].goalsAgainst || 0})
Location: ${match[0].location || 'Unknown'}
Type: ${match[0].matchType || 'Unknown'}

**Player Performance:**
${playerDetails.map(p => `${p.name} (${p.position}): ${p.goals || 0} goals, ${p.assists || 0} assists, ${p.passes || 0} passes, ${p.shots || 0} shots, ${p.tackles || 0} tackles`).join('\n')}

**Match Events:**
${events.length > 0 ? events.map(e => `${e.minute}' - ${e.eventType}: ${e.description || ''}`).join('\n') : 'No detailed events recorded'}

**Match Statistics:**
- Goals For: ${match[0].goalsFor || 0}
- Goals Against: ${match[0].goalsAgainst || 0}
- Total Shots: ${playerDetails.reduce((sum, p) => sum + (p.shots || 0), 0)}
- Total Passes: ${playerDetails.reduce((sum, p) => sum + (p.passes || 0), 0)}
- Total Tackles: ${playerDetails.reduce((sum, p) => sum + (p.tackles || 0), 0)}`;
        
        const systemPrompt = `You are an expert football match analyst. Create a comprehensive match report that includes:

1. **Match Overview**: Brief summary of the match outcome and key storylines
2. **Key Moments**: 3-5 critical moments that decided the match (goals, saves, tactical changes)
3. **Player Ratings**: Rate top 5 performers with brief justification (use actual stats)
4. **Tactical Analysis**: Formation effectiveness, tactical adjustments, team shape
5. **Recommendations**: 2-3 specific areas for improvement in future matches

Be specific, data-driven, and professional. Use actual statistics provided.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const report = typeof rawContent === 'string' ? rawContent : 'Match report unavailable';
        
        return { 
          report,
          matchInfo: {
            opponent: match[0].opponent,
            date: match[0].matchDate,
            result: match[0].result,
            score: `${match[0].goalsFor || 0}-${match[0].goalsAgainst || 0}`
          }
        };
      }),
  }),

  // ==================== AI CALENDAR ====================
  aiCalendar: router({
    generateSchedule: protectedProcedure
      .input(z.object({
        teamId: z.number()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get team data
        const team = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players
        const teamPlayers = await db.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
            const stats = await db.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(1);
            return stats;
          })
        );
        
        const flatStats = allStats.flat();
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / flatStats.length : 0;
        const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / flatStats.length : 0;
        
        // Get upcoming matches
        const upcomingMatches = await db.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(matches.matchDate)
          .limit(5);
        
        // Get recent matches for form analysis
        const recentMatches = await db.select()
          .from(matches)
          .where(eq(matches.teamId, input.teamId))
          .orderBy(desc(matches.matchDate))
          .limit(5);
        
        const wins = recentMatches.filter(m => m.result === 'win').length;
        const losses = recentMatches.filter(m => m.result === 'loss').length;
        
        const contextData = `**AI Training Schedule Generation**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}

**Current Performance Levels:**
- Technical: ${avgTechnical.toFixed(1)}/100 ${avgTechnical < 70 ? '⚠️ PRIORITY AREA' : avgTechnical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Physical: ${avgPhysical.toFixed(1)}/100 ${avgPhysical < 70 ? '⚠️ PRIORITY AREA' : avgPhysical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Tactical: ${avgTactical.toFixed(1)}/100 ${avgTactical < 70 ? '⚠️ PRIORITY AREA' : avgTactical > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}
- Mental: ${avgMental.toFixed(1)}/100 ${avgMental < 70 ? '⚠️ PRIORITY AREA' : avgMental > 80 ? '✅ STRONG' : '➡️ MAINTAIN'}

**Recent Form (Last 5 matches):**
${recentMatches.length > 0 ? recentMatches.map((m, i) => `Match ${i + 1}: ${m.result?.toUpperCase() || 'N/A'} ${m.goalsFor || 0}-${m.goalsAgainst || 0} vs ${m.opponent || 'Unknown'}`).join('\n') : 'No recent matches'}
Form: ${wins}W ${losses}L (${recentMatches.length > 0 ? ((wins / recentMatches.length) * 100).toFixed(0) : 0}% win rate)

**Upcoming Matches:**
${upcomingMatches.length > 0 ? upcomingMatches.map((m, i) => `${i + 1}. ${m.opponent || 'TBD'} - ${m.matchDate ? new Date(m.matchDate).toLocaleDateString() : 'Date TBD'} (${m.matchType || 'Unknown'})`).join('\n') : 'No upcoming matches scheduled'}`;
        
        const systemPrompt = `You are an expert football training coordinator and sports scientist. Create a detailed weekly training schedule that:

1. **Prioritizes weak areas** (scores below 70) with targeted training sessions
2. **Maintains strong areas** (scores above 80) with lighter maintenance work
3. **Considers match schedule** - include recovery days before/after matches, taper intensity before important games
4. **Balances workload** - vary intensity (High/Medium/Low) throughout the week to prevent overtraining
5. **Age-appropriate** - adjust volume and complexity for the age group
6. **Progressive** - build fitness and skills systematically

Format the schedule as:
**Day-by-day breakdown** (Monday through Sunday):
- Day name
- Focus area (Technical/Tactical/Physical/Mental/Recovery)
- Intensity level (High/Medium/Low)
- Specific session activities (2-3 items)
- Duration and timing recommendations

Be practical and implementable. Consider recovery needs and match preparation.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const schedule = typeof rawContent === 'string' ? rawContent : 'Schedule unavailable';
        
        return {
          schedule,
          teamName: team[0].name,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1),
            mental: avgMental.toFixed(1)
          },
          insights: `Based on current performance data, your team needs focus on ${avgTechnical < 70 ? 'technical skills' : avgPhysical < 70 ? 'physical conditioning' : avgTactical < 70 ? 'tactical awareness' : avgMental < 70 ? 'mental strength' : 'maintaining current form'}. The schedule balances training load with ${upcomingMatches.length} upcoming matches.`
        };
      }),
  }),

  // ==================== PLAYER COMPARISON ====================
  playerComparison: router({
    compare: protectedProcedure
      .input(z.object({
        playerIds: z.array(z.number()).min(2).max(4)
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get all players data
        const playersData = await Promise.all(
          input.playerIds.map(async (playerId) => {
            const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
            if (!player[0]) return null;
            
            // Get latest skill scores
            const skillScore = await db.select().from(skillScores)
              .where(eq(skillScores.playerId, playerId))
              .orderBy(desc(skillScores.createdAt))
              .limit(1);
            
            // Get recent performance stats
            const stats = await db.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, playerId))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(1);
            
            const avgTechnical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / stats.length : 0;
            const avgPhysical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / stats.length : 0;
            const avgTactical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / stats.length : 0;
            const avgMental = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / stats.length : 0;
            
            return {
              id: player[0].id,
              name: player[0].name,
              position: player[0].position,
              technical: Math.round(avgTechnical),
              physical: Math.round(avgPhysical),
              tactical: Math.round(avgTactical),
              mental: Math.round(avgMental),
              skillScore: skillScore[0] || null
            };
          })
        );
        
        const validPlayers = playersData.filter(p => p !== null);
        
        if (validPlayers.length < 2) {
          throw new Error('Not enough valid players for comparison');
        }
        
        // Create comparison context
        const contextData = `**Player Comparison Analysis**

Comparing ${validPlayers.length} players:

${validPlayers.map((p, i) => `
**Player ${i + 1}: ${p.name}**
- Position: ${p.position}
- Technical Score: ${p.technical}/100
- Physical Score: ${p.physical}/100
- Tactical Score: ${p.tactical}/100
- Mental Score: ${p.mental}/100`).join('\n')}`;
        
        const systemPrompt = `You are an expert football scout and analyst. Compare these players and provide:

1. **Overall Assessment**: Brief comparison of each player's profile
2. **Strengths Comparison**: Who excels in what areas and why
3. **Weaknesses Comparison**: Areas where each player needs improvement
4. **Best Use Cases**: Which player fits which tactical role or situation
5. **Formation Recommendations**: Suggest formations that maximize these players' strengths
6. **Development Priorities**: What each player should focus on to improve

Be specific, data-driven, and tactical. Consider position compatibility and team balance.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Extract formation suggestions from analysis
        const formationMatch = analysis.match(/formation[s]?[:\s]+([^\n]+)/i);
        const formationSuggestions = formationMatch ? formationMatch[1] : 'See full analysis for formation recommendations';
        
        return {
          players: validPlayers,
          analysis,
          formationSuggestions,
          stats: {
            technical: validPlayers.map(p => p.technical),
            physical: validPlayers.map(p => p.physical),
            tactical: validPlayers.map(p => p.tactical),
            mental: validPlayers.map(p => p.mental)
          }
        };
      }),
  }),

  // ==================== TACTICAL HUB ====================
  tacticalHub: router({
    analyze: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        matchId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Get team data
        const team = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
        if (!team[0]) {
          throw new Error('Team not found');
        }
        
        // Get team players
        const teamPlayers = await db.select()
          .from(players)
          .where(eq(players.teamId, input.teamId));
        
        // Get recent performance stats
        const allStats = await Promise.all(
          teamPlayers.map(async (player) => {
            const stats = await db.select().from(playerSkillScores)
              .where(eq(playerSkillScores.playerId, player.id))
              .orderBy(desc(playerSkillScores.assessmentDate))
              .limit(5);
            return { player, stats };
          })
        );
        
        // Get match data if specified
        let matchData = null;
        if (input.matchId) {
          const match = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
          if (match[0]) {
            matchData = match[0];
          }
        }
        
        // Calculate team averages
        const flatStats = allStats.flatMap(p => p.stats);
        const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / flatStats.length : 0;
        const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / flatStats.length : 0;
        const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / flatStats.length : 0;
        
        // Identify strengths and weaknesses
        const strengths = [];
        const weaknesses = [];
        
        if (avgTechnical > 75) strengths.push('Technical skills');
        else if (avgTechnical < 60) weaknesses.push('Technical skills');
        
        if (avgPhysical > 75) strengths.push('Physical conditioning');
        else if (avgPhysical < 60) weaknesses.push('Physical conditioning');
        
        if (avgTactical > 75) strengths.push('Tactical awareness');
        else if (avgTactical < 60) weaknesses.push('Tactical awareness');
        
        // Get player positions distribution
        const positionCounts: Record<string, number> = {};
        teamPlayers.forEach(p => {
          const pos = p.position || 'Unknown';
          positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });
        
        const contextData = `**Tactical Analysis Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Total Players: ${teamPlayers.length}

**Team Performance Metrics:**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100

**Team Strengths:**
${strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : '- Balanced team with no standout strengths'}

**Areas for Improvement:**
${weaknesses.length > 0 ? weaknesses.map(w => `- ${w}`).join('\n') : '- Well-rounded team'}

**Squad Composition:**
${Object.entries(positionCounts).map(([pos, count]) => `- ${pos}: ${count} players`).join('\n')}

${matchData ? `**Match Context:**
Opponent: ${matchData.opponent}
Match Type: ${matchData.matchType || 'Unknown'}
Result: ${matchData.result ? matchData.result.toUpperCase() : 'Pending'}
Score: ${matchData.goalsFor || 0}-${matchData.goalsAgainst || 0}` : '**General tactical analysis (no specific match)**'}`;
        
        const systemPrompt = `You are an expert football tactical analyst. Provide a comprehensive tactical analysis including:

1. **Recommended Formation**: Suggest the best formation (e.g., 4-3-3, 4-4-2) based on squad composition and strengths
2. **Tactical Strengths**: Identify 2-3 key tactical advantages this team has
3. **Strategic Recommendations**: Provide 3-4 specific tactical instructions for:
   - Attacking play
   - Defensive organization
   - Transitions
   - Set pieces
4. **Player Deployment**: Suggest how to best utilize the squad's strengths
5. **Opponent Exploitation**: If match context is provided, suggest how to exploit opponent weaknesses

Be specific, practical, and tactical. Focus on actionable insights.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Extract formation from analysis
        const formationMatch = analysis.match(/(\d-\d-\d|\d-\d-\d-\d)/i);
        const recommendedFormation = formationMatch ? formationMatch[0] : '4-3-3';
        
        // Parse sections
        const strengthsSection = analysis.match(/tactical strengths?[:\s]+([^#]+)/i)?.[1]?.trim() || 'See full analysis';
        const recommendationsSection = analysis.match(/strategic recommendations?[:\s]+([^#]+)/i)?.[1]?.trim() || 'See full analysis';
        
        return {
          formation: recommendedFormation,
          strengths: strengthsSection.substring(0, 300),
          recommendations: recommendationsSection.substring(0, 300),
          fullAnalysis: analysis,
          teamStats: {
            technical: avgTechnical.toFixed(1),
            physical: avgPhysical.toFixed(1),
            tactical: avgTactical.toFixed(1)
          }
        };
      }),
  }),

  // ==================== VIDEO ANALYSIS ====================
  videoAnalysis: router({
    analyze: protectedProcedure
      .input(z.object({
        videoUrl: z.string().optional(),
        description: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        if (!input.videoUrl && !input.description) {
          throw new Error('Either video URL or description is required');
        }
        
        const contextData = input.videoUrl 
          ? `**Video Analysis Request**\n\nVideo URL: ${input.videoUrl}\n\nPlease analyze this match video for tactical insights.`
          : `**Match Description for Analysis**\n\n${input.description}`;
        
        const systemPrompt = `You are an expert football video analyst and tactical coach. Analyze the provided match video or description and provide:

1. **Formation Detected**: Identify the team formation(s) used (e.g., 4-3-3, 4-4-2)
2. **Tactical Patterns**: Describe the main tactical patterns observed:
   - Build-up play
   - Pressing triggers
   - Defensive organization
   - Attacking patterns
3. **Player Movements**: Analyze key player movements and positioning:
   - Off-ball runs
   - Positional rotations
   - Spacing and compactness
4. **Passing Patterns**: Identify passing networks and build-up sequences:
   - Short passing combinations
   - Long ball usage
   - Progressive passes
5. **Key Moments**: Highlight 3-5 critical tactical moments with timestamps (if video) or descriptions
6. **Recommendations**: Provide tactical recommendations for:
   - Exploiting observed weaknesses
   - Countering opponent strengths
   - Training focus areas

Be specific, tactical, and actionable. Use football terminology appropriately.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const fullAnalysis = typeof rawContent === 'string' ? rawContent : 'Analysis unavailable';
        
        // Parse sections
        const formationMatch = fullAnalysis.match(/formation[s]?[:\s]+([^\n]+)/i);
        const formation = formationMatch ? formationMatch[1].trim() : '4-3-3';
        
        const tacticalMatch = fullAnalysis.match(/tactical patterns?[:\s]+([^#]+?)(?=player movements?|passing patterns?|key moments?|recommendations?|$)/is);
        const tacticalPatterns = tacticalMatch ? tacticalMatch[1].trim() : '';
        
        const movementsMatch = fullAnalysis.match(/player movements?[:\s]+([^#]+?)(?=passing patterns?|key moments?|recommendations?|$)/is);
        const playerMovements = movementsMatch ? movementsMatch[1].trim() : '';
        
        const passingMatch = fullAnalysis.match(/passing patterns?[:\s]+([^#]+?)(?=key moments?|recommendations?|$)/is);
        const passingPatterns = passingMatch ? passingMatch[1].trim() : '';
        
        const momentsMatch = fullAnalysis.match(/key moments?[:\s]+([^#]+?)(?=recommendations?|$)/is);
        const keyMoments = momentsMatch ? momentsMatch[1].trim() : '';
        
        const recsMatch = fullAnalysis.match(/recommendations?[:\s]+([^#]+?)$/is);
        const recommendations = recsMatch ? recsMatch[1].trim() : '';
        
        return {
          formation,
          tacticalPatterns,
          playerMovements,
          passingPatterns,
          keyMoments,
          recommendations,
          fullAnalysis
        };
      }),
  }),

  // ==================== PERFORMANCE PREDICTION ====================
  performancePrediction: router({
    predict: protectedProcedure
      .input(z.object({
        type: z.enum(['player', 'team']),
        teamId: z.number().optional(),
        playerId: z.number().optional(),
        matchId: z.number().optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        let contextData = '';
        let entityName = '';
        
        if (input.type === 'team') {
          if (!input.teamId) throw new Error('Team ID required for team prediction');
          
          const team = await db.select().from(teams).where(eq(teams.id, input.teamId)).limit(1);
          if (!team[0]) throw new Error('Team not found');
          entityName = team[0].name;
          
          // Get team players
          const teamPlayers = await db.select().from(players).where(eq(players.teamId, input.teamId));
          
          // Get recent performance stats
          const allStats = await Promise.all(
            teamPlayers.map(async (player) => {
              const stats = await db.select().from(playerSkillScores)
                .where(eq(playerSkillScores.playerId, player.id))
                .orderBy(desc(playerSkillScores.assessmentDate))
                .limit(10);
              return stats;
            })
          );
          
          const flatStats = allStats.flat();
          const avgTechnical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / flatStats.length : 0;
          const avgPhysical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / flatStats.length : 0;
          const avgTactical = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / flatStats.length : 0;
          const avgMental = flatStats.length > 0 ? flatStats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / flatStats.length : 0;
          
          // Get recent matches
          const recentMatches = await db.select()
            .from(matches)
            .where(eq(matches.teamId, input.teamId))
            .orderBy(desc(matches.matchDate))
            .limit(10);
          
          const wins = recentMatches.filter(m => m.result === 'win').length;
          const losses = recentMatches.filter(m => m.result === 'loss').length;
          const draws = recentMatches.filter(m => m.result === 'draw').length;
          
          contextData = `**Team Performance Prediction Request**

Team: ${team[0].name}
Age Group: ${team[0].ageGroup}
Players: ${teamPlayers.length}

**Current Performance Metrics:**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100
- Mental: ${avgMental.toFixed(1)}/100

**Recent Form (Last 10 matches):**
Wins: ${wins} | Draws: ${draws} | Losses: ${losses}
Win Rate: ${recentMatches.length > 0 ? ((wins / recentMatches.length) * 100).toFixed(0) : 0}%

**Recent Match Results:**
${recentMatches.slice(0, 5).map((m, i) => `${i + 1}. ${m.result?.toUpperCase() || 'N/A'} ${m.goalsFor || 0}-${m.goalsAgainst || 0} vs ${m.opponent || 'Unknown'}`).join('\n')}`;
          
        } else {
          if (!input.playerId) throw new Error('Player ID required for player prediction');
          
          const player = await db.select().from(players).where(eq(players.id, input.playerId)).limit(1);
          if (!player[0]) throw new Error('Player not found');
          entityName = player[0].name;
          
          // Get player stats
          const stats = await db.select().from(playerSkillScores)
            .where(eq(playerSkillScores.playerId, input.playerId))
            .orderBy(desc(playerSkillScores.assessmentDate))
            .limit(10);
          
          const avgTechnical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / stats.length : 0;
          const avgPhysical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / stats.length : 0;
          const avgTactical = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / stats.length : 0;
          const avgMental = stats.length > 0 ? stats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / stats.length : 0;
          
          contextData = `**Player Performance Prediction Request**

Player: ${player[0].name}
Position: ${player[0].position}
Age: ${player[0].dateOfBirth ? new Date().getFullYear() - new Date(player[0].dateOfBirth).getFullYear() : 'Unknown'}

**Recent Performance Metrics (Last 10 sessions):**
- Technical: ${avgTechnical.toFixed(1)}/100
- Physical: ${avgPhysical.toFixed(1)}/100
- Tactical: ${avgTactical.toFixed(1)}/100
- Mental: ${avgMental.toFixed(1)}/100

**Performance Trend:**
${stats.slice(0, 5).map((s, i) => `Session ${i + 1}: Tech ${s.technicalScore || 0} | Phys ${s.physicalScore || 0} | Tact ${s.tacticalScore || 0} | Ment ${s.mentalScore || 0}`).join('\n')}`;
        }
        
        const systemPrompt = `You are an expert sports performance analyst and data scientist. Analyze the historical performance data and predict future performance:

1. **Overall Prediction**: Provide a clear, concise prediction (e.g., "Strong Performance Expected", "Moderate Performance", "Below Average Performance")
2. **Confidence Level**: Rate your confidence (0-100%) based on data quality and consistency
3. **Predicted Metrics**: Forecast specific performance scores:
   - Technical performance
   - Physical condition
   - Tactical execution
   - Mental strength
4. **Performance Trend**: Describe whether performance is improving, stable, or declining
5. **Key Factors**: List 3-5 factors influencing the prediction (form, consistency, recent results, etc.)
6. **Recommendations**: Suggest actions to maximize predicted performance
7. **Risk Factors**: Identify potential issues that could negatively impact performance

Base predictions on:
- Recent performance trends
- Consistency of metrics
- Historical patterns
- Current form

Be realistic, data-driven, and specific. Provide confidence levels for your predictions.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextData }
          ]
        });
        
        const rawContent = response?.choices?.[0]?.message?.content;
        const fullAnalysis = typeof rawContent === 'string' ? rawContent : 'Prediction unavailable';
        
        // Parse sections
        const predictionMatch = fullAnalysis.match(/overall prediction[:\s]+([^\n]+)/i);
        const overallPrediction = predictionMatch ? predictionMatch[1].trim() : 'Good Performance Expected';
        
        const confidenceMatch = fullAnalysis.match(/confidence[:\s]+(\d+)/i);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
        
        const trendMatch = fullAnalysis.match(/performance trend[:\s]+([^#]+?)(?=key factors?|recommendations?|risk|$)/is);
        const trend = trendMatch ? trendMatch[1].trim() : '';
        
        const factorsMatch = fullAnalysis.match(/key factors?[:\s]+([^#]+?)(?=recommendations?|risk|$)/is);
        const factors = factorsMatch ? factorsMatch[1].trim() : '';
        
        const recsMatch = fullAnalysis.match(/recommendations?[:\s]+([^#]+?)(?=risk|$)/is);
        const recommendations = recsMatch ? recsMatch[1].trim() : '';
        
        const risksMatch = fullAnalysis.match(/risk factors?[:\s]+([^#]+?)$/is);
        const risks = risksMatch ? risksMatch[1].trim() : '';
        
        // Extract predicted metrics
        const metrics: any = {};
        const techMatch = fullAnalysis.match(/technical[:\s]+(\d+)/i);
        const physMatch = fullAnalysis.match(/physical[:\s]+(\d+)/i);
        const tactMatch = fullAnalysis.match(/tactical[:\s]+(\d+)/i);
        const mentMatch = fullAnalysis.match(/mental[:\s]+(\d+)/i);
        
        if (techMatch) metrics.technical = parseInt(techMatch[1]);
        if (physMatch) metrics.physical = parseInt(physMatch[1]);
        if (tactMatch) metrics.tactical = parseInt(tactMatch[1]);
        if (mentMatch) metrics.mental = parseInt(mentMatch[1]);
        
        return {
          entityName,
          overallPrediction,
          confidence,
          metrics: Object.keys(metrics).length > 0 ? metrics : null,
          trend,
          factors,
          recommendations,
          risks,
          fullAnalysis,
          summary: `Prediction for ${entityName} based on historical data analysis`
        };
      }),
  }),

  // ==================== TACTICAL EMERGENCY MODE ====================
  tactical: router({    generateEmergencyPlan: protectedProcedure
      .input(z.object({
        matchMinute: z.number().min(1).max(120),
        currentScore: z.string(),
        playerCount: z.number().min(7).max(11),
        currentFormation: z.string(),
        opponentFormation: z.string(),
        ballPosition: z.object({
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100)
        }).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const ballInfo = input.ballPosition 
          ? `Ball Position: ${Math.round(input.ballPosition.x)}% from left, ${Math.round(input.ballPosition.y)}% from top (${input.ballPosition.y < 50 ? 'defensive half' : 'attacking half'}${input.ballPosition.x < 40 ? ', left side' : input.ballPosition.x > 60 ? ', right side' : ', center'})`
          : 'Ball Position: Not specified';
        
        const prompt = `You are an elite football tactical analyst with expertise in emergency match situations. Analyze this critical scenario:

**Match Context:**
- Minute: ${input.matchMinute} (${input.matchMinute > 75 ? 'CRITICAL FINAL STAGE' : input.matchMinute > 60 ? 'Late game pressure' : 'Mid-game adjustment'})
- Score: ${input.currentScore} (${input.currentScore.startsWith('0-') || input.currentScore.includes('-1') || input.currentScore.includes('-2') ? 'LOSING - Need aggressive approach' : 'Winning/Drawing - Tactical control needed'})
- Players: ${input.playerCount}/11 (${input.playerCount < 11 ? 'REDUCED SQUAD - Tactical adaptation required' : 'Full strength'})
- Your Formation: ${input.currentFormation}
- Opponent Formation: ${input.opponentFormation}
- ${ballInfo}

**Analysis Required:**
1. **Tactical Weakness Detection**: Identify specific gaps in opponent's ${input.opponentFormation} formation (e.g., "Wide spaces between fullback and winger", "Exposed center when midfielders push forward")

2. **Formation Mismatch Analysis**: How does your ${input.currentFormation} exploit their ${input.opponentFormation}? Consider:
   - Numerical advantages in specific zones
   - Overload opportunities (flanks vs center)
   - Pressing triggers

3. **Innovative Tactical Solution**: Create a creative, match-winning tactic (not generic advice). Examples:
   - "False 9 Drop & Overload": Striker drops deep, wingers push inside, create 3v2 in midfield
   - "Asymmetric Wing Trap": Overload left with 4 players, isolate right winger 1v1
   - "High Press Trigger": Press only when ball reaches slow center-back

4. **Player-Specific Instructions**: Give 3 SPECIFIC, actionable instructions (not vague like "press more"):
   - Example: "#7 LW: Stay wide until opponent RB pushes up, then cut inside into space behind"
   - Example: "#6 CM: Position between opponent's two strikers, intercept passes"

Respond in JSON format:
{
  "tactic": "Creative tactic name (e.g., 'Asymmetric Overload - Exploit Right CB')",
  "successRate": realistic percentage (60-85 for good tactics),
  "description": "2-3 sentences explaining WHY this works against their formation",
  "formationChange": "Specific formation adjustment (e.g., '3-3-2 → 2-4-2 with wide overload')",
  "weaknessDetected": "SPECIFIC tactical weakness in opponent's ${input.opponentFormation} (e.g., 'Gap between CB and RB when pressing high')",
  "keyInstructions": ["Instruction 1 with player role", "Instruction 2 with player role", "Instruction 3 with player role"],
  "timing": "When to execute (e.g., 'Immediately after opponent goal kick' or 'When winning ball in midfield')"
}`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a tactical football analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'emergency_plan',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  tactic: { type: 'string' },
                  successRate: { type: 'integer' },
                  description: { type: 'string' },
                  formationChange: { type: 'string' },
                  weaknessDetected: { type: 'string' },
                  keyInstructions: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 3,
                    maxItems: 3
                  },
                  timing: { type: 'string' }
                },
                required: ['tactic', 'successRate', 'description', 'formationChange', 'weaknessDetected', 'keyInstructions', 'timing'],
                additionalProperties: false
              }
            }
          }
        });

        const rawContent = response?.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate plan' });
        }

        const content = typeof rawContent === 'string' ? rawContent : '';
        if (!content) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid response format' });
        }
        const plan = JSON.parse(content);
        return plan;
      }),
  }),

  // ==================== PLAYERMAKER INTEGRATION ====================
  playermaker: router({
    getSettings: coachProcedure.query(async () => {
      return db.getPlayermakerSettings();
    }),

    saveTeamId: protectedProcedure
      .input(z.object({
        teamId: z.string().min(1).max(50),
      }))
      .mutation(async ({ input, ctx }) => {
        // Save team ID to user's profile or settings
        // For now, we'll just return success - you can extend this to save to database
        console.log(`User ${ctx.user.id} saved team ID: ${input.teamId}`);
        return { success: true, teamId: input.teamId };
      }),

    saveSettings: coachProcedure
      .input(z.object({
        clientKey: z.string(),
        clientSecret: z.string(),
        clientTeamId: z.string(),
        teamCode: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.savePlayermakerSettings({
          ...input,
          isActive: true,
        });
        return { id };
      }),

    testConnection: coachProcedure
      .mutation(async () => {
        const settings = await db.getPlayermakerSettings();
        if (!settings) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Please save settings first' });
        }

        // Test connection using real PlayerMaker API
        const result = await playermakerApi.testPlayerMakerConnection(
          settings.clientKey,
          settings.clientSecret,
          settings.clientTeamId
        );

        if (!result.success) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: result.message
          });
        }

        // Save club name if returned
        if (result.clubName) {
          await db.savePlayermakerSettings({
            ...settings,
            clubName: result.clubName,
          });
        }

        return { 
          success: true, 
          message: result.message,
          clubName: result.clubName || settings.clubName || 'Unknown',
        };
      }),

    syncData: coachProcedure
      .input(z.object({
        sessionType: z.enum(['training', 'match', 'all']),
        daysBack: z.number().default(30),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const startTime = Date.now();
        const settings = await db.getPlayermakerSettings();
        if (!settings) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Please configure PlayerMaker settings first' });
        }

        let syncSuccess = true;
        let errorMessage: string | undefined;
        let sessionsCount = 0;
        let metricsCount = 0;

        try {
          // Sync data using real PlayerMaker API
          const result = await playermakerApi.syncPlayerMakerData(settings, {
            sessionType: input.sessionType,
            daysBack: input.daysBack,
          });

          // Save sessions
          for (const session of result.sessions) {
            await db.savePlayermakerSession({
              sessionId: session.session_id,
              sessionType: session.session_type,
              date: session.date,
              phaseDuration: session.duration ? String(session.duration) : undefined,
              tag: session.notes || undefined,
            });
          }

          // Save metrics
          for (const metric of result.metrics) {
            await db.savePlayermakerMetrics({
              sessionId: metric.session_id,
              playermakerPlayerId: metric.player_id,
              playerName: metric.player_name,
              ageGroup: metric.age_group,
              totalTouches: metric.total_touches,
              leftFootTouches: metric.left_foot_touches,
              rightFootTouches: metric.right_foot_touches,
              distanceCovered: metric.distance_covered.toString(),
              topSpeed: metric.top_speed.toString(),
              averageSpeed: metric.average_speed.toString(),
              sprintCount: metric.sprint_count,
              accelerationCount: metric.acceleration_count,
              decelerationCount: metric.deceleration_count,
              highIntensityDistance: metric.high_intensity_distance.toString(),
              createdAt: new Date(),
            });
          }

          // Update token and last sync
          await db.updatePlayermakerToken(
            result.token,
            result.tokenExpiresAt.getTime(),
            settings.clubName
          );
          await db.updatePlayermakerLastSync();

          sessionsCount = result.sessions.length;
          metricsCount = result.metrics.length;
        } catch (error) {
          syncSuccess = false;
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        } finally {
          // Save sync history
          const duration = Date.now() - startTime;
          await db.saveSyncHistory({
            syncType: 'manual',
            sessionType: input.sessionType,
            startDate: input.startDate ? input.startDate.split('T')[0] : undefined,
            endDate: input.endDate ? input.endDate.split('T')[0] : undefined,
            sessionsCount,
            metricsCount,
            success: syncSuccess,
            errorMessage,
            duration,
          });
        }

        return { sessionsCount, metricsCount };
      }),

    // Check rate limit status before syncing
    getRateLimitStatus: coachProcedure
      .query(async () => {
        const waitTime = playermakerApi.getWaitTimeBeforeSync();
        return {
          canSync: waitTime === 0,
          waitTimeMs: waitTime,
          waitTimeFormatted: waitTime > 0 ? playermakerApi.formatWaitTime(waitTime) : null,
          message: waitTime > 0 
            ? `Please wait ${playermakerApi.formatWaitTime(waitTime)} before syncing again.`
            : 'Ready to sync',
        };
      }),

    getSessions: coachProcedure
      .query(async () => {
        return db.getPlayermakerSessions(50);
      }),

    getRecentMetrics: coachProcedure
      .query(async () => {
        const metrics = await db.getRecentPlayermakerMetrics(30);
        
        // Calculate aggregates
        const uniquePlayers = new Set(metrics.map(m => m.playermakerPlayerId)).size;
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        // Top performers
        const topPerformers = metrics
          .sort((a, b) => (b.totalTouches || 0) - (a.totalTouches || 0))
          .slice(0, 5);

        return {
          uniquePlayers,
          avgTouches,
          avgDistance,
          topPerformers,
        };
      }),

    getPlayerMetrics: protectedProcedure
      .input(z.object({ 
        playerId: z.number(),
        dateRange: z.enum(['week', 'month', 'season', 'all']).optional()
      }))
      .query(async ({ input }) => {
        const metrics = await db.getPlayermakerPlayerMetrics(input.playerId);
        
        // Calculate date cutoff based on range
        let cutoffDate: Date | null = null;
        if (input.dateRange === 'week') {
          cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
        } else if (input.dateRange === 'month') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        } else if (input.dateRange === 'season') {
          cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        }
        
        // Filter by date if needed
        const filteredMetrics = cutoffDate 
          ? metrics.filter(m => m.createdAt && new Date(m.createdAt) >= cutoffDate!)
          : metrics;
        
        // Calculate aggregated statistics
        const avgDistance = filteredMetrics.reduce((sum, m) => sum + (Number(m.totalDistance) || 0), 0) / (filteredMetrics.length || 1);
        const avgTouches = filteredMetrics.reduce((sum, m) => sum + (Number(m.totalTouches) || 0), 0) / (filteredMetrics.length || 1);
        
        // Build history data for charts
        const distanceHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          distance: Number(m.totalDistance) || 0
        }));
        
        const touchesHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          total: Number(m.totalTouches) || 0,
          left: Number(m.leftLegTouches) || 0,
          right: Number(m.rightLegTouches) || 0
        }));
        
        const sprintHistory = filteredMetrics.slice(-10).map(m => ({
          date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A',
          topSpeed: Number(m.topSpeed) || 0,
          sprints: Number(m.totalSprints) || 0
        }));
        
        // Get team averages for comparison
        const allMetrics = await db.getPlayermakerPlayerMetrics();
        const teamAvgDistance = allMetrics.reduce((sum, m) => sum + (Number(m.totalDistance) || 0), 0) / (allMetrics.length || 1);
        const teamAvgTouches = allMetrics.reduce((sum, m) => sum + (Number(m.totalTouches) || 0), 0) / (allMetrics.length || 1);
        const teamAvgSprints = allMetrics.reduce((sum, m) => sum + (Number(m.totalSprints) || 0), 0) / (allMetrics.length || 1);
        
        const teamComparison = [
          { name: 'Distance (km)', nameAr: 'المسافة (كم)', playerValue: avgDistance / 1000, teamAvg: teamAvgDistance / 1000 },
          { name: 'Touches', nameAr: 'اللمسات', playerValue: avgTouches, teamAvg: teamAvgTouches },
          { name: 'Sprints', nameAr: 'الركضات', playerValue: filteredMetrics.reduce((sum, m) => sum + (Number(m.totalSprints) || 0), 0) / (filteredMetrics.length || 1), teamAvg: teamAvgSprints }
        ];
        
        return {
          avgDistance: avgDistance / 1000, // Convert to km
          avgTouches,
          distanceHistory,
          touchesHistory,
          sprintHistory,
          teamComparison
        };
      }),

    getTeamAverages: coachProcedure
      .query(async () => {
        const metrics = await db.getRecentPlayermakerMetrics(30);
        if (metrics.length === 0) return { avgTouches: 0, avgDistance: 0 };
        
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        return { avgTouches, avgDistance };
      }),

    generateWeeklyReport: adminProcedure
      .mutation(async ({ ctx }) => {
        const settings = await db.getPlayermakerSettings();
        if (!settings || !settings.isActive) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'PlayerMaker not configured' });
        }

        // Get last 7 days of data
        const metrics = await db.getRecentPlayermakerMetrics(7);
        const sessions = await db.getPlayermakerSessions(50);
        
        if (metrics.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No data available for report' });
        }

        // Calculate weekly stats
        const totalSessions = new Set(metrics.map(m => m.sessionId)).size;
        const uniquePlayers = new Set(metrics.map(m => m.playermakerPlayerId)).size;
        const avgTouches = metrics.reduce((sum, m) => sum + (m.totalTouches || 0), 0) / metrics.length;
        const avgDistance = metrics.reduce((sum, m) => sum + (parseFloat(m.distanceCovered as any) || 0), 0) / metrics.length;
        
        // Top 5 performers
        const topPerformers = metrics
          .sort((a, b) => (b.totalTouches || 0) - (a.totalTouches || 0))
          .slice(0, 5)
          .map(m => ({
            name: m.playerName,
            touches: m.totalTouches,
            distance: parseFloat(m.distanceCovered as any || '0'),
            topSpeed: parseFloat(m.topSpeed as any || '0'),
          }));

        // Most improved players (comparing first half vs second half of week)
        const midWeek = Math.floor(metrics.length / 2);
        const firstHalf = metrics.slice(0, midWeek);
        const secondHalf = metrics.slice(midWeek);
        
        const playerImprovement = new Map<string, { before: number; after: number }>();
        
        firstHalf.forEach(m => {
          const key = m.playermakerPlayerId || m.playerName || '';
          if (!playerImprovement.has(key)) {
            playerImprovement.set(key, { before: 0, after: 0 });
          }
          const current = playerImprovement.get(key)!;
          current.before += m.totalTouches || 0;
        });
        
        secondHalf.forEach(m => {
          const key = m.playermakerPlayerId || m.playerName || '';
          if (!playerImprovement.has(key)) {
            playerImprovement.set(key, { before: 0, after: 0 });
          }
          const current = playerImprovement.get(key)!;
          current.after += m.totalTouches || 0;
        });

        const mostImproved = Array.from(playerImprovement.entries())
          .map(([name, stats]) => ({
            name,
            improvement: ((stats.after - stats.before) / (stats.before || 1)) * 100,
          }))
          .filter(p => p.improvement > 0)
          .sort((a, b) => b.improvement - a.improvement)
          .slice(0, 3);

        // Generate HTML email
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; }
              .stat-card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1e40af; }
              .player-list { list-style: none; padding: 0; }
              .player-item { background: white; padding: 12px; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PlayerMaker Weekly Report</h1>
                <p>Week of ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="content">
                <h2>Weekly Summary</h2>
                <div class="stat-card">
                  <strong>Total Sessions:</strong> ${totalSessions}<br>
                  <strong>Active Players:</strong> ${uniquePlayers}<br>
                  <strong>Average Touches:</strong> ${avgTouches.toFixed(0)}<br>
                  <strong>Average Distance:</strong> ${avgDistance.toFixed(0)}m
                </div>

                <h2>Top Performers</h2>
                <ul class="player-list">
                  ${topPerformers.map((p, i) => `
                    <li class="player-item">
                      <span><strong>#${i + 1}</strong> ${p.name}</span>
                      <span>${p.touches} touches | ${p.distance.toFixed(0)}m</span>
                    </li>
                  `).join('')}
                </ul>

                ${mostImproved.length > 0 ? `
                  <h2>Most Improved</h2>
                  <ul class="player-list">
                    ${mostImproved.map(p => `
                      <li class="player-item">
                        <span>${p.name}</span>
                        <span style="color: #16a34a;">+${p.improvement.toFixed(0)}%</span>
                      </li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
              <div class="footer">
                <p>This is an automated report from Future Stars FC Academy</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send notification to owner (using existing notification system)
        await notifyOwner({
          title: 'PlayerMaker Weekly Report',
          content: `Weekly report generated: ${totalSessions} sessions, ${uniquePlayers} players. Top performer: ${topPerformers[0]?.name || 'N/A'} with ${topPerformers[0]?.touches || 0} touches.`,
        });

        return {
          success: true,
          summary: {
            totalSessions,
            uniquePlayers,
            avgTouches,
            avgDistance,
            topPerformers,
            mostImproved,
          },
          emailHtml,
        };
      }),

    generateSampleData: adminProcedure
      .mutation(async ({ ctx }) => {
        // Get existing players
        const existingPlayers = await db.getAllPlayers();
        
        if (existingPlayers.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No players found. Please create players first.' });
        }

        const sessions = [];
        const metrics = [];
        const sessionTypes = ['training', 'match'];
        const now = new Date();

        // Create 20 sample sessions
        for (let i = 0; i < 20; i++) {
          const sessionDate = new Date(now);
          sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 30));
          
          const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)] as 'training' | 'match';
          const sessionId = `PM_${sessionType.toUpperCase()}_${Date.now()}_${i}`;

          sessions.push({
            sessionId,
            sessionType,
            sessionDate,
            duration: 60 + Math.floor(Math.random() * 60),
            location: 'Training Ground A',
            notes: `Sample ${sessionType} session`,
            syncedAt: new Date(),
          });

          // Add 8-12 players per session
          const sessionPlayerCount = 8 + Math.floor(Math.random() * 5);
          const selectedPlayers = existingPlayers
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(sessionPlayerCount, existingPlayers.length));

          for (const player of selectedPlayers) {
            const totalTouches = 50 + Math.floor(Math.random() * 150);
            const distanceCovered = (3000 + Math.floor(Math.random() * 5000)).toString();
            const topSpeed = (5 + Math.random() * 3).toFixed(2);
            const sprintCount = 10 + Math.floor(Math.random() * 30);
            const accelerationCount = 15 + Math.floor(Math.random() * 40);

            metrics.push({
              sessionId,
              playermakerPlayerId: `PM_${player.id}`,
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              ageGroup: 'U17',
              totalTouches,
              leftFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
              rightFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
              distanceCovered,
              topSpeed,
              averageSpeed: (parseFloat(topSpeed) * 0.6).toFixed(2),
              sprintCount,
              accelerationCount,
              decelerationCount: Math.floor(accelerationCount * 0.8),
              highIntensityDistance: (parseFloat(distanceCovered) * 0.2).toFixed(0),
              createdAt: sessionDate,
            });
          }
        }

        // Insert sessions
        for (const session of sessions) {
          await db.savePlayermakerSession(session);
        }

        // Insert metrics
        for (const metric of metrics) {
          await db.savePlayermakerMetrics(metric);
        }

        return {
          success: true,
          sessionsCount: sessions.length,
          metricsCount: metrics.length,
          message: `Generated ${sessions.length} sessions with ${metrics.length} player metrics`,
        };
      }),

    // Create a custom sample training session
    createSampleSession: adminProcedure
      .input(z.object({
        sessionType: z.enum(['training', 'match']),
        playerCount: z.number().min(1).max(30).default(10),
        sessionDate: z.string(),
        duration: z.number().min(15).max(180).default(90),
        intensity: z.enum(['low', 'medium', 'high']).default('medium'),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get existing players
        const existingPlayers = await db.getAllPlayers();
        
        if (existingPlayers.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No players found. Please create players first.' });
        }

        const sessionDate = new Date(input.sessionDate);
        const sessionId = `PM_${input.sessionType.toUpperCase()}_${Date.now()}`;
        
        // Intensity multipliers for metrics
        const intensityMultipliers = {
          low: { touches: 0.7, distance: 0.6, speed: 0.7, sprints: 0.5 },
          medium: { touches: 1.0, distance: 1.0, speed: 1.0, sprints: 1.0 },
          high: { touches: 1.3, distance: 1.4, speed: 1.2, sprints: 1.5 },
        };
        const mult = intensityMultipliers[input.intensity];

        // Save session
        await db.savePlayermakerSession({
          sessionId,
          sessionType: input.sessionType,
          date: sessionDate.toISOString().split('T')[0],
          phaseDuration: String(input.duration),
          tag: input.notes || `${input.intensity} intensity ${input.sessionType}`,
          intensity: input.intensity,
          participatedPlayers: Math.min(input.playerCount, existingPlayers.length),
        });

        // Select random players
        const selectedPlayers = existingPlayers
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(input.playerCount, existingPlayers.length));

        const metrics = [];
        for (const player of selectedPlayers) {
          const baseTouches = 80 + Math.floor(Math.random() * 100);
          const baseDistance = 4000 + Math.floor(Math.random() * 4000);
          const baseSpeed = 5.5 + Math.random() * 2.5;
          const baseSprints = 15 + Math.floor(Math.random() * 25);

          const totalTouches = Math.floor(baseTouches * mult.touches);
          const distanceCovered = Math.floor(baseDistance * mult.distance);
          const topSpeed = (baseSpeed * mult.speed).toFixed(2);
          const sprintCount = Math.floor(baseSprints * mult.sprints);
          const accelerationCount = Math.floor(sprintCount * 1.5);

          const metric = {
            sessionId,
            playermakerPlayerId: `PM_${player.id}`,
            playerId: player.id,
            playerName: `${player.firstName} ${player.lastName}`,
            ageGroup: player.ageGroup || 'U17',
            totalTouches,
            leftFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
            rightFootTouches: Math.floor(totalTouches * (0.3 + Math.random() * 0.4)),
            distanceCovered: String(distanceCovered),
            topSpeed,
            averageSpeed: (parseFloat(topSpeed) * 0.6).toFixed(2),
            sprintCount,
            accelerationCount,
            decelerationCount: Math.floor(accelerationCount * 0.8),
            highIntensityDistance: String(Math.floor(distanceCovered * 0.2)),
            createdAt: sessionDate,
          };
          
          await db.savePlayermakerMetrics(metric);
          metrics.push(metric);
        }

        return {
          success: true,
          sessionId,
          metricsCount: metrics.length,
          message: `Created ${input.sessionType} session with ${metrics.length} player metrics`,
        };
      }),

    // Save auto-sync settings
    saveAutoSyncSettings: coachProcedure
      .input(z.object({
        enabled: z.boolean(),
        frequency: z.enum(['hourly', 'daily', 'weekly']),
      }))
      .mutation(async ({ input }) => {
        await db.saveAutoSyncSettings(input.enabled, input.frequency);
        return { success: true };
      }),

    // Get sync history
    getSyncHistory: coachProcedure
      .query(async () => {
        return db.getSyncHistory(20);
      }),

    // Get coach annotations for a player
    getCoachAnnotations: publicProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        return db.getCoachAnnotations(input.playerId);
      }),

    // Add coach annotation
    addCoachAnnotation: coachProcedure
      .input(z.object({
        playerId: z.number(),
        note: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.addCoachAnnotation({
          playerId: input.playerId,
          coachId: ctx.user.id,
          coachName: ctx.user.name || 'Unknown Coach',
          note: input.note,
        });
        return { success: true };
      }),

    // Get team-wide statistics
    getTeamStats: publicProcedure
      .query(async () => {
        return db.getPlayermakerTeamStats();
      }),
  }),

  // ==================== ROLE & PERMISSION MANAGEMENT ====================
  permissions: router({
    // Role Management
    getAllRoles: adminProcedure.query(async () => {
      return dbPermissions.getAllRoles();
    }),
    
    getRoleById: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRoleWithPermissionsAndTabs(input.roleId);
      }),
    
    createRole: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const role = await dbPermissions.createRole({
          ...input,
          createdBy: ctx.user.id
        });
        
        await dbPermissions.logPermissionAction({
          action: "role_created",
          performedBy: ctx.user.id,
          targetRoleId: role.id,
          details: { roleName: input.name }
        });
        
        return role;
      }),
    
    updateRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        priority: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { roleId, ...data } = input;
        await dbPermissions.updateRole(roleId, data);
        
        await dbPermissions.logPermissionAction({
          action: "role_updated",
          performedBy: ctx.user.id,
          targetRoleId: roleId,
          details: data
        });
        
        return { success: true };
      }),
    
    deleteRole: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.deleteRole(input.roleId);
        
        await dbPermissions.logPermissionAction({
          action: "role_deleted",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId
        });
        
        return { success: true };
      }),
    
    // Permission Management
    getAllPermissions: adminProcedure.query(async () => {
      return dbPermissions.getAllPermissions();
    }),
    
    getPermissionsByCategory: adminProcedure.query(async () => {
      return dbPermissions.getPermissionsByCategory();
    }),
    
    assignPermissionsToRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        permissionIds: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignPermissionsToRole(
          input.roleId,
          input.permissionIds,
          ctx.user.id
        );
        
        await dbPermissions.logPermissionAction({
          action: "permission_granted",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId,
          details: { permissionIds: input.permissionIds }
        });
        
        return { success: true };
      }),
    
    getRolePermissions: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRolePermissions(input.roleId);
      }),
    
    // Tab Management
    getAllTabs: adminProcedure.query(async () => {
      return dbPermissions.getAllTabs();
    }),
    
    assignTabsToRole: adminProcedure
      .input(z.object({
        roleId: z.number(),
        tabIds: z.array(z.number())
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignTabsToRole(
          input.roleId,
          input.tabIds,
          ctx.user.id
        );
        
        await dbPermissions.logPermissionAction({
          action: "tab_assigned",
          performedBy: ctx.user.id,
          targetRoleId: input.roleId,
          details: { tabIds: input.tabIds }
        });
        
        return { success: true };
      }),
    
    getRoleTabs: adminProcedure
      .input(z.object({ roleId: z.number() }))
      .query(async ({ input }) => {
        return dbPermissions.getRoleTabs(input.roleId);
      }),
    
    // User-Role Assignment
    assignRoleToUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
        isPrimary: z.boolean().default(false)
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.assignRoleToUser(
          input.userId,
          input.roleId,
          ctx.user.id,
          input.isPrimary
        );
        
        await dbPermissions.logPermissionAction({
          action: "user_role_assigned",
          performedBy: ctx.user.id,
          targetUserId: input.userId,
          targetRoleId: input.roleId,
          details: { isPrimary: input.isPrimary }
        });
        
        return { success: true };
      }),
    
    removeRoleFromUser: adminProcedure
      .input(z.object({
        userId: z.number(),
        roleId: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPermissions.removeRoleFromUser(input.userId, input.roleId);
        
        await dbPermissions.logPermissionAction({
          action: "user_role_removed",
          performedBy: ctx.user.id,
          targetUserId: input.userId,
          targetRoleId: input.roleId
        });
        
        return { success: true };
      }),
    
    getUserRoles: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId ?? ctx.user.id;
        return dbPermissions.getUserRoles(userId);
      }),
    
    // Permission Checking
    checkPermission: protectedProcedure
      .input(z.object({ permissionCode: z.string() }))
      .query(async ({ input, ctx }) => {
        return dbPermissions.userHasPermission(ctx.user.id, input.permissionCode);
      }),
    
    checkTabAccess: protectedProcedure
      .input(z.object({ tabCode: z.string() }))
      .query(async ({ input, ctx }) => {
        return dbPermissions.userCanAccessTab(ctx.user.id, input.tabCode);
      }),
    
    getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
      return dbPermissions.getUserPermissions(ctx.user.id);
    }),
    
    getMyTabs: protectedProcedure.query(async ({ ctx }) => {
      return dbPermissions.getUserTabs(ctx.user.id);
    }),
    
    // Audit Log
    getAuditLog: adminProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return dbPermissions.getAuditLog(input.limit);
      }),
    
    // Initialization
    initializeDefaults: adminProcedure.mutation(async () => {
      return dbPermissions.initializeDefaultRolesAndPermissions();
    }),

    // User Permission Queries (for frontend permission checks)
    getUserPermissions: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Users can only query their own permissions unless they're admin
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot query other users permissions' });
        }
        return dbPermissions.getUserPermissions(input.userId);
      }),

    getUserTabs: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        // Users can only query their own tabs unless they're admin
        if (ctx.user.role !== 'admin' && ctx.user.id !== input.userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot query other users tabs' });
        }
        return dbPermissions.getUserTabs(input.userId);
      }),
  }),

  // ==================== AI CACHE MANAGEMENT ====================
  cache: router({
    // Get cache statistics
    getStats: adminProcedure.query(async () => {
      return aiCache.getCacheStats();
    }),

    // Clear all cache
    clearAll: adminProcedure.mutation(async () => {
      await aiCache.clearAllCache();
      return { success: true };
    }),

    // Clear cache for specific function
    clearFunction: adminProcedure
      .input(z.object({ functionName: z.string() }))
      .mutation(async ({ input }) => {
        await aiCache.invalidateFunctionCache(input.functionName);
        return { success: true };
      }),

    // Clean expired cache entries
    cleanExpired: adminProcedure.mutation(async () => {
      const count = await aiCache.cleanExpiredCache();
      return { success: true, count };
    }),

    // Run cache warmup
    runWarmup: adminProcedure.mutation(async () => {
      const result = await cacheWarmup.runFullWarmup();
      return result;
    }),
  }),

  // ==================== AI INTELLIGENCE ====================
  ai: router({
    // AI Chat Assistant
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        contextId: z.string().optional(),
        currentPage: z.string().optional(),
        relevantData: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const response = await AIService.chatWithAI({
          userMessage: input.message,
          contextId: input.contextId,
          userRole: ctx.user.role,
          currentPage: input.currentPage,
          relevantData: input.relevantData,
        });
        return { response };
      }),
    
    // Create AI Context
    createContext: protectedProcedure.mutation(async ({ ctx }) => {
      const contextId = AIService.createAIContext(ctx.user.id, ctx.user.role);
      return { contextId };
    }),
    
    // Clear AI Context
    clearContext: protectedProcedure
      .input(z.object({ contextId: z.string() }))
      .mutation(async ({ input }) => {
        AIService.clearAIContext(input.contextId);
        return { success: true };
      }),
    
    // Player Analysis
    analyzePlayer: coachProcedure
      .input(z.object({
        name: z.string(),
        position: z.string(),
        recentStats: z.array(z.any()),
        age: z.number(),
        ageGroup: z.string(),
      }))
      .mutation(async ({ input }) => {
        const analysis = await AIService.analyzePlayerPerformance(input);
        return { analysis };
      }),
    
    // Injury Risk Prediction
    predictInjuryRisk: coachProcedure
      .input(z.object({
        name: z.string(),
        recentWorkload: z.array(z.any()),
        injuryHistory: z.array(z.any()),
        age: z.number(),
      }))
      .mutation(async ({ input }) => {
        const prediction = await AIService.predictInjuryRisk(input);
        return { prediction };
      }),
    
    // Position Recommendation
    recommendPosition: coachProcedure
      .input(z.object({
        name: z.string(),
        currentPosition: z.string(),
        skillScores: z.record(z.string(), z.number()),
        physicalAttributes: z.any(),
        playingStyle: z.string(),
      }))
      .mutation(async ({ input }) => {
        const recommendation = await AIService.recommendOptimalPosition(input);
        return { recommendation };
      }),
    
    // Training Plan Generation
    generateTrainingPlan: coachProcedure
      .input(z.object({
        name: z.string(),
        position: z.string(),
        weaknesses: z.array(z.string()),
        strengths: z.array(z.string()),
        availableTime: z.number(),
        ageGroup: z.string(),
      }))
      .mutation(async ({ input }) => {
        const plan = await AIService.generateTrainingPlan(input);
        return { plan };
      }),
    
    // Drill Recommendations
    recommendDrills: coachProcedure
      .input(z.object({
        focusArea: z.string(),
        ageGroup: z.string(),
        skillLevel: z.string(),
      }))
      .mutation(async ({ input }) => {
        const drills = await AIService.recommendDrills(
          input.focusArea,
          input.ageGroup,
          input.skillLevel
        );
        return { drills };
      }),
    
    // Match Strategy
    generateMatchStrategy: coachProcedure
      .input(z.object({
        ourTeam: z.any(),
        opponentTeam: z.any(),
        matchImportance: z.string(),
        conditions: z.string(),
      }))
      .mutation(async ({ input }) => {
        const strategy = await AIService.generateMatchStrategy(input);
        return { strategy };
      }),
    
    // Opponent Analysis
    analyzeOpponent: coachProcedure
      .input(z.object({
        teamName: z.string(),
        recentMatches: z.array(z.any()),
        keyPlayers: z.array(z.any()),
        formation: z.string(),
      }))
      .mutation(async ({ input }) => {
        const analysis = await AIService.analyzeOpponent(input);
        return { analysis };
      }),
    
    // Parent Report Generation
    generateParentReport: coachProcedure
      .input(z.object({
        name: z.string(),
        period: z.string(),
        performance: z.any(),
        attendance: z.any(),
        behavior: z.any(),
        development: z.any(),
      }))
      .mutation(async ({ input }) => {
        const report = await AIService.generateParentReport(input);
        return { report };
      }),
    
    // Coach Message Drafting
    draftMessage: coachProcedure
      .input(z.object({
        purpose: z.string(),
        recipient: z.string(),
        keyPoints: z.array(z.string()),
        tone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const message = await AIService.draftCoachMessage(input);
        return { message };
      }),
    
    // Meal Plan Generation
    generateMealPlan: staffProcedure
      .input(z.object({
        name: z.string(),
        age: z.number(),
        weight: z.number(),
        height: z.number(),
        activityLevel: z.string(),
        goals: z.array(z.string()),
        dietaryRestrictions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const mealPlan = await AIService.generateMealPlan(input);
        return { mealPlan };
      }),
    
    // Video Insights
    generateVideoInsights: coachProcedure
      .input(z.object({
        playerName: z.string(),
        matchOrTraining: z.string(),
        keyMoments: z.array(z.any()),
        focus: z.string(),
      }))
      .mutation(async ({ input }) => {
        const insights = await AIService.generateVideoInsights(input);
        return { insights };
      }),
    
    // Match Report
    generateMatchReport: coachProcedure
      .input(z.object({
        homeTeam: z.string(),
        awayTeam: z.string(),
        score: z.string(),
        playerStats: z.array(z.any()),
        keyEvents: z.array(z.any()),
        formation: z.string(),
      }))
      .mutation(async ({ input }) => {
        const report = await AIService.generateMatchReport(input);
        return { report };
      }),
    
    // Data Insights
    generateDataInsights: protectedProcedure
      .input(z.object({
        dataType: z.string(),
        dataset: z.array(z.any()),
        timeframe: z.string(),
        focus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const insights = await AIService.generateDataInsights(input);
        return { insights };
      }),
    
    // Schedule Optimization
    optimizeSchedule: adminProcedure
      .input(z.object({
        activities: z.array(z.any()),
        constraints: z.array(z.string()),
        preferences: z.array(z.string()),
        timeframe: z.string(),
      }))
      .mutation(async ({ input }) => {
        const schedule = await AIService.optimizeSchedule(input);
        return { schedule };
      }),
  }),

  // Home Page Content Management
  homePageContent: router({
    getAll: publicProcedure
      .query(async () => {
        return await db.getAllHomePageContent();
      }),
    
    getBySection: publicProcedure
      .input(z.object({ sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats']) }))
      .query(async ({ input }) => {
        return await db.getHomePageContentBySection(input.sectionType);
      }),
    
    create: adminProcedure
      .input(z.object({
        sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats']),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createHomePageContent(input);
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateHomePageContent(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHomePageContent(input.id);
        return { success: true };
      }),
    
    uploadFile: adminProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.fileData, 'base64');
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `home-content/${randomSuffix}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url };
      }),
    
    reorder: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          displayOrder: z.number()
        }))
      }))
      .mutation(async ({ input }) => {
        // Update display order for each item
        for (const item of input.items) {
          await db.updateHomePageContent(item.id, { displayOrder: item.displayOrder });
        }
        return { success: true };
      }),
  }),

  // AI Formation Simulation
  aiFormation: router({
    generateSimulation: protectedProcedure
      .input(z.object({
        formation: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario: z.enum(['attack', 'defense', 'counter', 'possession']),
        duration: z.number().default(10)
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Generate AI-powered tactical movement simulation
        const prompt = `You are a professional football tactical analyst. Generate a detailed tactical movement simulation for a ${input.formation} formation in a ${input.scenario} scenario.

Provide a JSON array of keyframes (one per second for ${input.duration} seconds) with player movements. Each keyframe should have:
- time: number (in seconds)
- description: string (what's happening tactically)
- players: array of 11 players with:
  - id: string (player-0 to player-10)
  - x: number (0-1200, representing horizontal position)
  - y: number (0-800, representing vertical position)
  - action: string (brief description of player action)

Initial positions for ${input.formation}:
${getFormationPositions(input.formation)}

Scenario: ${input.scenario}
- attack: forward movement, width, penetration
- defense: compact shape, pressure, cover
- counter: quick transitions, vertical runs
- possession: patient build-up, lateral movement

Return ONLY valid JSON array, no markdown formatting.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a football tactical analyst. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ]
        });

        const content = response.choices[0]?.message?.content || '[]';
        let keyframes;
        
        try {
          // Try to parse JSON directly
          keyframes = JSON.parse(content);
        } catch (e) {
          // If fails, try to extract JSON from markdown
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            keyframes = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error('Failed to parse AI response');
          }
        }

        return {
          keyframes,
          description: `AI-generated ${input.scenario} simulation for ${input.formation} formation`
        };
      }),
    
    compareFormations: protectedProcedure
      .input(z.object({
        formation1: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario1: z.enum(['attack', 'defense', 'counter', 'possession']),
        formation2: z.enum(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']),
        scenario2: z.enum(['attack', 'defense', 'counter', 'possession'])
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Generate AI comparison insights
        const prompt = `You are a professional football tactical analyst. Compare these two tactical setups:

Formation 1: ${input.formation1} in ${input.scenario1} scenario
Formation 2: ${input.formation2} in ${input.scenario2} scenario

Provide a detailed tactical comparison covering:
1. Strengths and weaknesses of each formation
2. Key tactical differences
3. Which formation is better suited for different game situations
4. Potential vulnerabilities and how to exploit them
5. Recommended counter-tactics

Be specific and professional. Limit response to 300 words.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional football tactical analyst.' },
            { role: 'user', content: prompt }
          ]
        });

        const insights = response.choices[0]?.message?.content || 'Unable to generate comparison insights.';

        return { insights };
      }),
  }),

  // ==================== DAILY STREAK TRACKER ====================
  streak: router({
    getStreak: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) return null;
        
        const [streak] = await database
          .select()
          .from(userStreaks)
          .where(eq(userStreaks.userId, ctx.user.id));
        
        return streak || null;
      }),
    
    updateStreak: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { checkAndUpdateStreak } = await import('./streakService');
        const result = await checkAndUpdateStreak(ctx.user.id);
        return result;
      }),
    
    getStreakRewards: protectedProcedure
      .query(async () => {
        const database = await getDb();
        if (!database) return [];
        
        const rewards = await database
          .select()
          .from(streakRewards)
          .orderBy(asc(streakRewards.streakDays));
        
        return rewards;
      }),
    
    getLeaderboard: protectedProcedure
      .query(async () => {
        const database = await getDb();
        if (!database) return [];
        
        const leaderboard = await database
          .select({
            userId: userStreaks.userId,
            currentStreak: userStreaks.currentStreak,
            longestStreak: userStreaks.longestStreak,
            userName: users.name,
          })
          .from(userStreaks)
          .leftJoin(users, eq(userStreaks.userId, users.id))
          .orderBy(desc(userStreaks.currentStreak))
          .limit(10);
        
        return leaderboard;
      }),
    
    initializeRewards: adminProcedure
      .mutation(async () => {
        const { initializeStreakRewards } = await import('./streakService');
        await initializeStreakRewards();
        return { success: true };
      }),
  }),

  // ==================== COMMUNITY FORUM ====================
  forum: router({
    getCategories: publicProcedure
      .query(async () => {
        const database = await getDb();
        if (!database) return [];
        
        const categories = await database
          .select()
          .from(forumCategories);
        
        return categories;
      }),
    
    getPosts: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['recent', 'popular', 'unanswered']).default('recent'),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        let query = database
          .select({
            id: forumPosts.id,
            title: forumPosts.title,
            content: forumPosts.content,
            postType: forumPosts.postType,
            upvotes: forumPosts.upvotes,
            downvotes: forumPosts.downvotes,
            replyCount: forumPosts.replyCount,
            viewCount: forumPosts.viewCount,
            hasAcceptedAnswer: forumPosts.hasAcceptedAnswer,
            isPinned: forumPosts.isPinned,
            createdAt: forumPosts.createdAt,
            authorName: users.name,
          })
          .from(forumPosts)
          .leftJoin(users, eq(forumPosts.authorId, users.id));
        
        if (input.categoryId) {
          query = query.where(eq(forumPosts.categoryId, input.categoryId));
        }
        
        if (input.search) {
          query = query.where(
            or(
              like(forumPosts.title, `%${input.search}%`),
              like(forumPosts.content, `%${input.search}%`)
            )
          );
        }
        
        if (input.sortBy === 'popular') {
          query = query.orderBy(desc(forumPosts.upvotes));
        } else if (input.sortBy === 'unanswered') {
          query = query.where(eq(forumPosts.hasAcceptedAnswer, false));
          query = query.orderBy(desc(forumPosts.createdAt));
        } else {
          query = query.orderBy(desc(forumPosts.createdAt));
        }
        
        const posts = await query.limit(50);
        return posts;
      }),
    
    createPost: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        categoryId: z.number(),
        postType: z.enum(['question', 'discussion', 'tip', 'success_story']),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const [post] = await database.insert(forumPosts).values({
          title: input.title,
          content: input.content,
          categoryId: input.categoryId,
          authorId: ctx.user.id,
          postType: input.postType,
        });
        
        // Update category post count
        await database
          .update(forumCategories)
          .set({ postCount: sql`post_count + 1` })
          .where(eq(forumCategories.id, input.categoryId));
        
        return { success: true, postId: post.insertId };
      }),
    
    vote: protectedProcedure
      .input(z.object({
        targetType: z.enum(['post', 'reply']),
        targetId: z.number(),
        voteType: z.enum(['upvote', 'downvote']),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        // Check if user already voted
        const [existingVote] = await database
          .select()
          .from(forumVotes)
          .where(and(
            eq(forumVotes.userId, ctx.user.id),
            eq(forumVotes.targetType, input.targetType),
            eq(forumVotes.targetId, input.targetId)
          ));
        
        if (existingVote) {
          // Remove old vote
          if (input.targetType === 'post') {
            await database
              .update(forumPosts)
              .set({
                upvotes: existingVote.voteType === 'upvote' ? sql`upvotes - 1` : sql`upvotes`,
                downvotes: existingVote.voteType === 'downvote' ? sql`downvotes - 1` : sql`downvotes`,
              })
              .where(eq(forumPosts.id, input.targetId));
          }
          
          await database
            .delete(forumVotes)
            .where(eq(forumVotes.id, existingVote.id));
          
          // If same vote type, just remove it
          if (existingVote.voteType === input.voteType) {
            return { success: true };
          }
        }
        
        // Add new vote
        await database.insert(forumVotes).values({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          voteType: input.voteType,
        });
        
        // Update vote counts
        if (input.targetType === 'post') {
          await database
            .update(forumPosts)
            .set({
              upvotes: input.voteType === 'upvote' ? sql`upvotes + 1` : sql`upvotes`,
              downvotes: input.voteType === 'downvote' ? sql`downvotes + 1` : sql`downvotes`,
            })
            .where(eq(forumPosts.id, input.targetId));
        }
        
        return { success: true };
      }),
  }),

  // Admin utilities
  admin: router({
    populateData: adminProcedure
      .mutation(async () => {
        const result = await populateComprehensiveData();
        return result;
      }),
  }),

  // Live Match Mode
  liveMatch: router({
    // Start a new live match
    start: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        opponent: z.string(),
        opponentFormation: z.string().optional(),
        currentFormation: z.string(),
        isHome: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const matchId = await db.createLiveMatch({
          ...input,
          createdBy: ctx.user.id,
          status: 'not_started',
          startedAt: new Date(),
        });
        return { id: matchId };
      }),

    // Get live match by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLiveMatchById(input.id);
      }),

    // Get all active live matches
    getActive: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getActiveLiveMatches(ctx.user.id);
      }),

    // Get all live matches (including finished)
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllLiveMatches(ctx.user.id);
      }),

    // Update match time and status
    updateTime: protectedProcedure
      .input(z.object({
        id: z.number(),
        currentMinute: z.number(),
        status: z.enum(['not_started', 'first_half', 'half_time', 'second_half', 'extra_time', 'finished']),
      }))
      .mutation(async ({ input }) => {
        await db.updateLiveMatch(input.id, {
          currentMinute: input.currentMinute,
          status: input.status,
        });
        return { success: true };
      }),

    // Update score
    updateScore: protectedProcedure
      .input(z.object({
        id: z.number(),
        homeScore: z.number(),
        awayScore: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.updateLiveMatch(input.id, {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
        });
        return { success: true };
      }),

    // Update statistics
    updateStats: protectedProcedure
      .input(z.object({
        id: z.number(),
        possession: z.number().optional(),
        shots: z.number().optional(),
        shotsOnTarget: z.number().optional(),
        corners: z.number().optional(),
        fouls: z.number().optional(),
        offsides: z.number().optional(),
        yellowCards: z.number().optional(),
        redCards: z.number().optional(),
        opponentShots: z.number().optional(),
        opponentShotsOnTarget: z.number().optional(),
        opponentCorners: z.number().optional(),
        opponentFouls: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...stats } = input;
        await db.updateLiveMatch(id, stats);
        return { success: true };
      }),

    // Record match event
    recordEvent: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        eventType: z.enum(['goal', 'yellow_card', 'red_card', 'substitution', 'injury', 'penalty', 'own_goal', 'var_decision']),
        minute: z.number(),
        playerId: z.number().optional(),
        playerName: z.string().optional(),
        assistPlayerId: z.number().optional(),
        assistPlayerName: z.string().optional(),
        substitutedPlayerId: z.number().optional(),
        substitutedPlayerName: z.string().optional(),
        isOurTeam: z.boolean().default(true),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventId = await db.createMatchEvent(input);
        
        // Update substitutions count if it's a substitution
        if (input.eventType === 'substitution' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              substitutionsUsed: (match.substitutionsUsed || 0) + 1,
            });
          }
        }
        
        // Update cards count
        if (input.eventType === 'yellow_card' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              yellowCards: (match.yellowCards || 0) + 1,
            });
          }
        }
        
        if (input.eventType === 'red_card' && input.isOurTeam) {
          const match = await db.getLiveMatchById(input.liveMatchId);
          if (match) {
            await db.updateLiveMatch(input.liveMatchId, {
              redCards: (match.redCards || 0) + 1,
            });
          }
        }
        
        return { id: eventId };
      }),

    // Get match events
    getEvents: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMatchEvents(input.liveMatchId);
      }),

    // Delete event
    deleteEvent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMatchEvent(input.id);
        return { success: true };
      }),

    // Record tactical change
    changeTactics: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        minute: z.number(),
        changeType: z.enum(['formation', 'instruction', 'player_role', 'pressing_intensity', 'defensive_line']),
        fromValue: z.string().optional(),
        toValue: z.string(),
        reason: z.string().optional(),
        aiSuggested: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const changeId = await db.createTacticalChange(input);
        
        // Update current formation if it's a formation change
        if (input.changeType === 'formation') {
          await db.updateLiveMatch(input.liveMatchId, {
            currentFormation: input.toValue,
          });
        }
        
        return { id: changeId };
      }),

    // Get tactical changes
    getTacticalChanges: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTacticalChanges(input.liveMatchId);
      }),

    // Get complete match state (match + events + tactical changes)
    getMatchState: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.id);
        if (!match) return null;
        
        const events = await db.getMatchEvents(input.id);
        const tacticalChanges = await db.getTacticalChanges(input.id);
        
        return {
          match,
          events,
          tacticalChanges,
        };
      }),

    // Get AI tactical advice
    getAIAdvice: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const match = await db.getLiveMatchById(input.liveMatchId);
        if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        
        const events = await db.getMatchEvents(input.liveMatchId);
        const tacticalChanges = await db.getTacticalChanges(input.liveMatchId);
        
        // Build context for AI
        const context = `
Current Match Situation:
- Time: ${match.currentMinute}'
- Score: ${match.isHome ? match.homeScore : match.awayScore} - ${match.isHome ? match.awayScore : match.homeScore} (${match.isHome ? 'Home' : 'Away'})
- Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Status: ${match.status}

Statistics:
- Possession: ${match.possession}%
- Shots: ${match.shots} (${match.shotsOnTarget} on target)
- Opponent Shots: ${match.opponentShots} (${match.opponentShotsOnTarget} on target)
- Corners: ${match.corners} vs ${match.opponentCorners}
- Fouls: ${match.fouls} vs ${match.opponentFouls}
- Cards: ${match.yellowCards} yellow, ${match.redCards} red
- Substitutions Used: ${match.substitutionsUsed}/5

Recent Events:
${events.slice(-5).map(e => `${e.minute}' - ${e.eventType}: ${e.playerName || 'Unknown'} ${e.description ? '(' + e.description + ')' : ''}`).join('\n')}

Tactical Changes:
${tacticalChanges.map(tc => `${tc.minute}' - ${tc.changeType}: ${tc.fromValue} → ${tc.toValue} ${tc.reason ? '(' + tc.reason + ')' : ''}`).join('\n')}
`;
        
        // Get AI recommendations
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert football tactical analyst. Provide concise, actionable tactical advice for the coach based on the current match situation. Focus on: formation adjustments, player instructions, pressing intensity, defensive line positioning, and substitution suggestions. Keep responses under 200 words.'
            },
            {
              role: 'user',
              content: `Analyze this match situation and provide tactical recommendations:\n${context}`
            }
          ]
        });
        
        const advice = response.choices[0]?.message?.content || 'Unable to generate advice at this time.';
        
        return {
          advice,
          context,
        };
      }),

    // Finish match
    finishMatch: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const match = await db.getLiveMatchById(input.id);
        if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        
        // Update live match status
        await db.updateLiveMatch(input.id, {
          status: 'finished',
          finishedAt: new Date(),
          notes: input.notes,
        });
        
        // Create permanent match record if matchId is linked
        if (match.matchId) {
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;
          const result = match.isHome 
            ? (homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'draw')
            : (awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'draw');
          
          await db.updateMatch(match.matchId, {
            teamScore: match.isHome ? match.homeScore : match.awayScore,
            opponentScore: match.isHome ? match.awayScore : match.homeScore,
            result: result as 'win' | 'draw' | 'loss',
            notes: input.notes,
          });
        }
        
        return { success: true };
      }),

    // Delete live match
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLiveMatch(input.id);
        return { success: true };
      }),

    // Record player position
    recordPosition: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
        minute: z.number(),
        xPosition: z.number().min(0).max(100),
        yPosition: z.number().min(0).max(100),
        speed: z.number().optional(),
        heartRate: z.number().optional(),
        source: z.enum(['manual', 'gps', 'video_analysis']).default('manual'),
      }))
      .mutation(async ({ input }) => {
        const positionId = await db.recordPlayerPosition(input);
        return { id: positionId };
      }),

    // Get player positions
    getPositions: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPlayerPositions(input.liveMatchId, input.playerId);
      }),

    // Get player heatmap data
    getHeatmap: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getPlayerHeatmapData(input.liveMatchId, input.playerId);
      }),

    // Start GPS sync
    startGpsSync: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        playerId: z.number(),
        deviceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const syncId = await db.createGpsLiveSync({
          ...input,
          lastSyncTime: new Date(),
          syncStatus: 'active',
        });
        return { id: syncId };
      }),

    // Get GPS sync status
    getGpsSync: protectedProcedure
      .input(z.object({ liveMatchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getGpsLiveSync(input.liveMatchId);
      }),

    // Update GPS sync
    updateGpsSync: protectedProcedure
      .input(z.object({
        id: z.number(),
        syncStatus: z.enum(['active', 'paused', 'stopped', 'error']).optional(),
        dataPoints: z.number().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGpsLiveSync(id, {
          ...data,
          lastSyncTime: new Date(),
        });
        return { success: true };
      }),

    // Import GPS data batch
    importGpsDataBatch: protectedProcedure
      .input(z.object({
        liveMatchId: z.number(),
        gpsData: z.array(z.object({
          playerId: z.number(),
          timestamp: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          speed: z.number().optional(),
          heartRate: z.number().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        let imported = 0;
        for (const data of input.gpsData) {
          await db.recordPlayerPosition({
            liveMatchId: input.liveMatchId,
            playerId: data.playerId,
            timestamp: new Date(data.timestamp),
            xPosition: Math.round(data.longitude * 100),
            yPosition: Math.round(data.latitude * 100),
            minute: 0,
            source: 'gps',
          });
          imported++;
        }
        return { imported };
      }),

    // Get half-by-half comparison data
    getHalfComparison: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        // Calculate first half stats (0-45 minutes)
        const firstHalfEvents = (await db.getMatchEvents(input.matchId)).filter(
          (e: any) => e.minute <= 45
        );
        
        // Calculate second half stats (46-90+ minutes)
        const secondHalfEvents = (await db.getMatchEvents(input.matchId)).filter(
          (e: any) => e.minute > 45
        );

        const calculateHalfStats = (events: any[]) => {
          const shots = events.filter(e => e.eventType === 'goal' || e.eventType === 'penalty').length;
          const goals = events.filter(e => e.eventType === 'goal' && e.isOurTeam).length;
          return {
            shots: shots * 3, // Estimate total shots
            shotsOnTarget: shots,
            goals,
            corners: Math.floor(shots * 1.5),
            fouls: events.filter(e => e.eventType === 'yellow_card' || e.eventType === 'red_card').length * 2,
            possession: 50 + (goals * 5), // Rough estimate
            distanceCovered: 5.5, // Average per half
            highSpeedRuns: 15 + (shots * 2),
          };
        };

        return {
          firstHalf: calculateHalfStats(firstHalfEvents),
          secondHalf: calculateHalfStats(secondHalfEvents),
        };
      }),

    // Generate AI insights for half comparison
    generateHalfInsights: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);

        const firstHalfEvents = events.filter((e: any) => e.minute <= 45);
        const secondHalfEvents = events.filter((e: any) => e.minute > 45);

        const prompt = `You are an expert football tactical analyst. Analyze the following match data and provide detailed insights on the tactical shifts between halves.

**Match Details:**
- Opponent: ${match.opponent}
- Current Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Score: ${match.homeScore}-${match.awayScore}

**First Half Events (${firstHalfEvents.length} events):**
${firstHalfEvents.map((e: any) => `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Our Team)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`).join('\n')}

**Second Half Events (${secondHalfEvents.length} events):**
${secondHalfEvents.map((e: any) => `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Our Team)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`).join('\n')}

**Tactical Changes:**
${tacticalChanges.map((c: any) => `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue} (Reason: ${c.reason})`).join('\n')}

Provide a comprehensive analysis covering:
1. **Performance Comparison**: How did the team's performance change between halves?
2. **Tactical Shifts**: What tactical adjustments were made and their impact?
3. **Key Moments**: Critical events that changed the game's momentum
4. **Recommendations**: What should be adjusted for future matches or remaining time?

Format your response in markdown with clear sections.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football tactical analyst with deep knowledge of match analysis and tactical systems.' },
            { role: 'user', content: prompt }
          ],
        });

        const insights = response.choices[0]?.message?.content || 'Unable to generate insights at this time.';
        
        return { insights };
      }),

    // Get fatigue data for all players in match
    getFatigueData: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate fatigue for each player
        const playerFatigue = new Map<number, any>();

        // Process events to count sprints and activities
        for (const event of events) {
          if (event.playerId && event.isOurTeam) {
            if (!playerFatigue.has(event.playerId)) {
              playerFatigue.set(event.playerId, {
                playerId: event.playerId,
                playerName: event.playerName || 'Unknown',
                sprintCount: 0,
                eventCount: 0,
                distanceCovered: 0,
              });
            }
            const data = playerFatigue.get(event.playerId);
            data.eventCount++;
            if (event.eventType === 'goal' || event.eventType === 'penalty') {
              data.sprintCount += 2;
            }
          }
        }

        // Calculate distance from positions
        const playerPositionMap = new Map<number, any[]>();
        for (const pos of positions) {
          if (!playerPositionMap.has(pos.playerId)) {
            playerPositionMap.set(pos.playerId, []);
          }
          playerPositionMap.get(pos.playerId)!.push(pos);
        }

        for (const [playerId, positionsArr] of Array.from(playerPositionMap.entries())) {
          let distance = 0;
          for (let i = 1; i < positionsArr.length; i++) {
            const dx = positionsArr[i].xPosition - positionsArr[i - 1].xPosition;
            const dy = positionsArr[i].yPosition - positionsArr[i - 1].yPosition;
            distance += Math.sqrt(dx * dx + dy * dy) / 100; // Convert to km
          }
          
          if (!playerFatigue.has(playerId)) {
            playerFatigue.set(playerId, {
              playerId,
              playerName: 'Player ' + playerId,
              sprintCount: 0,
              eventCount: 0,
              distanceCovered: 0,
            });
          }
          playerFatigue.get(playerId).distanceCovered = distance;
        }

        // Calculate fatigue scores and risk levels
        const players = Array.from(playerFatigue.values()).map((p) => {
          // Fatigue formula: (distance * 10) + (sprints * 5) + (events * 3)
          const fatigueScore = Math.min(
            100,
            Math.round((p.distanceCovered * 10) + (p.sprintCount * 5) + (p.eventCount * 3))
          );
          
          let riskLevel = 'low';
          if (fatigueScore >= 80) riskLevel = 'critical';
          else if (fatigueScore >= 65) riskLevel = 'high';
          else if (fatigueScore >= 50) riskLevel = 'medium';

          return {
            ...p,
            fatigueScore,
            riskLevel,
          };
        });

        // Generate trend data (simulate for now)
        const trendData = [];
        const currentMinute = match.currentMinute ?? 0;
        for (let i = 0; i <= currentMinute; i += 15) {
          trendData.push({
            minute: i,
            value: Math.min(100, currentMinute > 0 ? (i / currentMinute) * 70 + Math.random() * 15 : 0),
          });
        }

        return {
          highRiskPlayers: players.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high'),
          mediumRiskPlayers: players.filter(p => p.riskLevel === 'medium'),
          lowRiskPlayers: players.filter(p => p.riskLevel === 'low'),
          trendData,
        };
      }),

    // Generate AI fatigue recommendations
    generateFatigueRecommendations: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate player fatigue data
        const playerStats = new Map<number, any>();
        for (const event of events) {
          if (event.playerId && event.isOurTeam) {
            if (!playerStats.has(event.playerId)) {
              playerStats.set(event.playerId, {
                name: event.playerName,
                events: 0,
                goals: 0,
                cards: 0,
              });
            }
            const stats = playerStats.get(event.playerId);
            stats.events++;
            if (event.eventType === 'goal') stats.goals++;
            if (event.eventType === 'yellow_card' || event.eventType === 'red_card') stats.cards++;
          }
        }

        const prompt = `You are an expert sports science analyst specializing in player fatigue management and substitution strategies.

**Match Context:**
- Opponent: ${match.opponent}
- Current Minute: ${match.currentMinute}
- Score: ${match.homeScore}-${match.awayScore}
- Formation: ${match.currentFormation}
- Match Status: ${match.status}

**Player Activity Data:**
${Array.from(playerStats.entries()).map(([id, stats]) => 
  `- ${stats.name}: ${stats.events} events, ${stats.goals} goals, ${stats.cards} cards`
).join('\n')}

**Total Match Events:** ${events.length}
**Position Tracking Points:** ${positions.length}

Analyze the current fatigue situation and provide:

1. **Immediate Risks**: Which players are showing critical fatigue signs?
2. **Substitution Priority**: Who should be substituted first and when?
3. **Position-Specific Advice**: Which positions need rotation?
4. **Tactical Adjustments**: How to manage team energy for remaining time?
5. **Prevention Strategies**: How to avoid fatigue-related injuries?

Format your response in markdown with clear, actionable recommendations.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert sports science analyst with deep knowledge of player fatigue management, substitution strategies, and injury prevention.' },
            { role: 'user', content: prompt }
          ],
        });

        const recommendations = response.choices[0]?.message?.content || 'Unable to generate recommendations at this time.';
        
        return { recommendations };
      }),

    // Get danger zones analysis
    getDangerZones: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .query(async ({ input }) => {
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Define pitch zones
        const zones = [
          'left_attack', 'center_attack', 'right_attack',
          'left_midfield', 'center_midfield', 'right_midfield',
          'left_defense', 'center_defense', 'right_defense',
        ];

        // Calculate zone activity
        const zoneActivity = new Map<string, number>();
        zones.forEach(z => zoneActivity.set(z, 0));

        // Analyze events by zone (simplified)
        for (const event of events) {
          if (event.isOurTeam) {
            // Attacking events
            if (event.eventType === 'goal' || event.eventType === 'penalty') {
              zoneActivity.set('center_attack', (zoneActivity.get('center_attack') || 0) + 15);
              zoneActivity.set('left_attack', (zoneActivity.get('left_attack') || 0) + 10);
              zoneActivity.set('right_attack', (zoneActivity.get('right_attack') || 0) + 10);
            }
          } else {
            // Defensive events
            if (event.eventType === 'goal') {
              zoneActivity.set('center_defense', (zoneActivity.get('center_defense') || 0) + 20);
              zoneActivity.set('left_defense', (zoneActivity.get('left_defense') || 0) + 15);
              zoneActivity.set('right_defense', (zoneActivity.get('right_defense') || 0) + 15);
            }
          }
        }

        // Analyze positions by zone
        for (const pos of positions) {
          // Determine zone based on xPosition,yPosition coordinates
          let zone = 'center_midfield';
          if (pos.xPosition > 60) {
            if (pos.yPosition < 30) zone = 'left_attack';
            else if (pos.yPosition > 50) zone = 'right_attack';
            else zone = 'center_attack';
          } else if (pos.xPosition < 30) {
            if (pos.yPosition < 30) zone = 'left_defense';
            else if (pos.yPosition > 50) zone = 'right_defense';
            else zone = 'center_defense';
          } else {
            if (pos.yPosition < 30) zone = 'left_midfield';
            else if (pos.yPosition > 50) zone = 'right_midfield';
          }
          
          zoneActivity.set(zone, (zoneActivity.get(zone) || 0) + 1);
        }

        // Normalize to 0-100 scale
        const maxActivity = Math.max(...Array.from(zoneActivity.values()));
        const zoneData = zones.map(zoneName => ({
          zoneName,
          intensity: maxActivity > 0 ? Math.min(100, Math.round((zoneActivity.get(zoneName) || 0) / maxActivity * 100)) : 0,
          events: Math.floor((zoneActivity.get(zoneName) || 0) / 10),
        }));

        return {
          zones: zoneData,
          attackingEvents: events.filter(e => e.isOurTeam && (e.eventType === 'goal' || e.eventType === 'penalty')).length,
          defensiveEvents: events.filter(e => !e.isOurTeam && (e.eventType === 'goal' || e.eventType === 'penalty')).length,
        };
      }),

    // Generate AI zone insights
    generateZoneInsights: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);

        // Calculate zone statistics
        const attackingEvents = events.filter(e => e.isOurTeam).length;
        const defensiveEvents = events.filter(e => !e.isOurTeam).length;
        const goals = events.filter(e => e.eventType === 'goal').length;

        const prompt = `You are an expert football tactical analyst specializing in spatial analysis and zone control.

**Match Context:**
- Opponent: ${match.opponent}
- Current Minute: ${match.currentMinute}
- Score: ${match.homeScore}-${match.awayScore}
- Formation: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}

**Zone Activity:**
- Our Attacking Events: ${attackingEvents}
- Opponent Attacking Events: ${defensiveEvents}
- Total Goals: ${goals}
- Total Events: ${events.length}

**Tactical Changes Made:**
${tacticalChanges.map((c: any) => `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue}`).join('\n')}

Analyze the danger zones and provide:

1. **Zone Control Analysis**: Which areas of the pitch are we dominating/struggling?
2. **Attacking Weaknesses**: Where should we focus our attacks to exploit opponent?
3. **Defensive Vulnerabilities**: Which zones need more defensive attention?
4. **Tactical Recommendations**: How to adjust formation/positioning to control key zones?
5. **Set Piece Strategy**: Best zones for set pieces based on current patterns?

Format your response in markdown with specific, actionable tactical advice.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football tactical analyst with deep knowledge of spatial analysis, zone control, and tactical positioning systems.' },
            { role: 'user', content: prompt }
          ],
        });

        const insights = response.choices[0]?.message?.content || 'Unable to generate insights at this time.';
        
        return { insights };
      }),

    // Generate comprehensive post-match report
    generatePostMatchReport: protectedProcedure
      .input(z.object({ matchId: z.number() }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const match = await db.getLiveMatchById(input.matchId);
        if (!match) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
        }

        const events = await db.getMatchEvents(input.matchId);
        const tacticalChanges = await db.getTacticalChanges(input.matchId);
        const positions = await db.getPlayerPositions(input.matchId);

        // Calculate match statistics
        const ourGoals = events.filter(e => e.eventType === 'goal' && e.isOurTeam).length;
        const opponentGoals = events.filter(e => e.eventType === 'goal' && !e.isOurTeam).length;
        const totalEvents = events.length;
        const matchDuration = match.currentMinute;

        // Generate comprehensive report
        const prompt = `You are an expert football analyst creating a comprehensive post-match report.

**Match Information:**
- Opponent: ${match.opponent}
- Final Score: ${match.homeScore}-${match.awayScore}
- Duration: ${matchDuration} minutes
- Formation Used: ${match.currentFormation}
- Opponent Formation: ${match.opponentFormation || 'Unknown'}
- Match Status: ${match.status}

**Match Statistics:**
- Possession: ${match.possession}%
- Shots: ${match.shots} (${match.shotsOnTarget} on target)
- Opponent Shots: ${match.opponentShots} (${match.opponentShotsOnTarget} on target)
- Corners: ${match.corners} vs ${match.opponentCorners}
- Fouls: ${match.fouls} vs ${match.opponentFouls}
- Yellow Cards: ${match.yellowCards}
- Red Cards: ${match.redCards}
- Substitutions Used: ${match.substitutionsUsed}

**Match Events (${totalEvents} total):**
${events.slice(0, 20).map((e: any) => 
  `- Min ${e.minute}: ${e.eventType} ${e.isOurTeam ? '(Us)' : '(Opponent)'} ${e.playerName ? '- ' + e.playerName : ''}`
).join('\n')}
${events.length > 20 ? '... and more' : ''}

**Tactical Changes (${tacticalChanges.length} total):**
${tacticalChanges.map((c: any) => 
  `- Min ${c.minute}: ${c.changeType} - ${c.fromValue} → ${c.toValue}${c.aiSuggested ? ' (AI Suggested)' : ''}`
).join('\n')}

**Position Tracking:**
- Total position data points: ${positions.length}

Create a comprehensive post-match report with the following sections:

1. **Match Summary** (2-3 paragraphs): Overall narrative of the match, result context, and general performance

2. **Tactical Analysis** (3-4 paragraphs): Formation effectiveness, tactical changes impact, team shape, pressing strategy, defensive organization

3. **Key Moments** (bullet points): 5-7 critical moments that defined the match outcome

4. **Player Performances** (2-3 paragraphs): Standout performers, areas of concern, collective team performance

5. **Recommendations** (bullet points): 5-7 specific, actionable recommendations for training focus and future matches

Be specific, analytical, and constructive. Use data to support your analysis.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert football analyst with deep knowledge of tactical analysis, player performance evaluation, and match reporting. Provide detailed, data-driven insights.' },
            { role: 'user', content: prompt }
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const fullReport = typeof rawContent === 'string' ? rawContent : 'Unable to generate report at this time.';
        
        // Parse sections (simple split by headers)
        const sections = {
          matchSummary: fullReport.split('**Tactical Analysis**')[0].replace('**Match Summary**', '').trim(),
          tacticalAnalysis: fullReport.split('**Tactical Analysis**')[1]?.split('**Key Moments**')[0]?.trim() || '',
          keyMoments: fullReport.split('**Key Moments**')[1]?.split('**Player Performances**')[0]?.trim() || '',
          playerPerformances: fullReport.split('**Player Performances**')[1]?.split('**Recommendations**')[0]?.trim() || '',
          recommendations: fullReport.split('**Recommendations**')[1]?.trim() || '',
        };
        
        return sections;
      }),
  }),
  
  // ==================== COACHES ====================
  coaches: router({
    getAvailable: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const result = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          specialty: coachProfiles.specialty,
          bio: coachProfiles.bio,
          yearsExperience: coachProfiles.yearsExperience,
          certifications: coachProfiles.certifications,
        })
        .from(users)
        .innerJoin(coachProfiles, eq(users.id, coachProfiles.userId))
        .where(and(eq(users.role, 'coach'), eq(users.accountStatus, 'approved')))
        .orderBy(desc(coachProfiles.yearsExperience));
      return result;
    }),
  }),
  
  // ==================== PRIVATE BOOKINGS ====================
  privateBookings: router({
    create: protectedProcedure
      .input(z.object({
        coachId: z.number(),
        sessionDate: z.string(),
        duration: z.number(),
        sessionType: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const totalPrice = input.duration === 60 ? 300 : input.duration === 90 ? 400 : 200;
        await database.insert(privateTrainingBookings).values({
          userId: ctx.user.id,
          coachId: input.coachId,
          sessionDate: new Date(input.sessionDate),
          duration: input.duration,
          sessionType: input.sessionType,
          notes: input.notes || null,
          status: 'pending',
          totalPrice: totalPrice,
        });
        
        // Get coach and user details for email
        const [coach] = await database
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, input.coachId));
        
        // Send confirmation emails
        if (ctx.user.email) {
          await sendBookingConfirmationToUser(ctx.user.email, {
            userName: ctx.user.name || 'Student',
            coachName: coach?.name || 'Coach',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
            totalPrice: totalPrice,
          });
        }
        
        if (coach?.email) {
          await sendBookingConfirmationToCoach(coach.email, {
            coachName: coach.name || 'Coach',
            userName: ctx.user.name || 'Student',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
            notes: input.notes,
          });
        }
        
        // Send WhatsApp notifications if enabled
        if (ctx.user.whatsappPhone && ctx.user.whatsappNotifications) {
          await sendBookingConfirmationWhatsApp(ctx.user.whatsappPhone, {
            userName: ctx.user.name || 'Student',
            coachName: coach?.name || 'Coach',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
          });
        }
        
        // Send WhatsApp to coach if they have WhatsApp enabled
        const [coachUser] = await database
          .select({ whatsappPhone: users.whatsappPhone, whatsappNotifications: users.whatsappNotifications })
          .from(users)
          .where(eq(users.id, input.coachId));
        
        if (coachUser?.whatsappPhone && coachUser.whatsappNotifications) {
          await sendCoachBookingNotificationWhatsApp(coachUser.whatsappPhone, {
            coachName: coach?.name || 'Coach',
            userName: ctx.user.name || 'Student',
            sessionDate: input.sessionDate,
            duration: input.duration,
            sessionType: input.sessionType,
          });
        }
        
        return { success: true };
      }),
    
    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const result = await database
        .select({
          id: privateTrainingBookings.id,
          userId: privateTrainingBookings.userId,
          coachId: privateTrainingBookings.coachId,
          sessionDate: privateTrainingBookings.sessionDate,
          duration: privateTrainingBookings.duration,
          sessionType: privateTrainingBookings.sessionType,
          notes: privateTrainingBookings.notes,
          status: privateTrainingBookings.status,
          totalPrice: privateTrainingBookings.totalPrice,
          createdAt: privateTrainingBookings.createdAt,
          coachName: users.name,
          coachAvatar: users.avatarUrl,
        })
        .from(privateTrainingBookings)
        .innerJoin(users, eq(privateTrainingBookings.coachId, users.id))
        .where(eq(privateTrainingBookings.userId, ctx.user.id))
        .orderBy(desc(privateTrainingBookings.sessionDate));
      return result;
    }),
    
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        await database
          .update(privateTrainingBookings)
          .set({ status: 'cancelled' })
          .where(and(
            eq(privateTrainingBookings.id, input.id),
            eq(privateTrainingBookings.userId, ctx.user.id)
          ));
        return { success: true };
      }),
  }),
  
  // ==================== TESTIMONIALS ====================
  testimonials: router({
    getApproved: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .where(eq(testimonials.isApproved, true))
        .orderBy(desc(testimonials.isFeatured), desc(testimonials.createdAt));
      return result;
    }),
    
    getFeatured: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .where(and(eq(testimonials.isApproved, true), eq(testimonials.isFeatured, true)))
        .orderBy(desc(testimonials.createdAt));
      return result;
    }),
    
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        role: z.string().optional(),
        rating: z.number().min(1).max(5),
        testimonial: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        await database.insert(testimonials).values({
          name: input.name,
          role: input.role || null,
          rating: input.rating,
          testimonial: input.testimonial,
          isApproved: false,
          isFeatured: false,
        });
        return { success: true };
      }),
    
    getAll: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const result = await database
        .select()
        .from(testimonials)
        .orderBy(desc(testimonials.createdAt));
      return result;
    }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number(), featured: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        
        // Get testimonial details before updating
        const [testimonial] = await database
          .select()
          .from(testimonials)
          .where(eq(testimonials.id, input.id));
        
        await database
          .update(testimonials)
          .set({ 
            isApproved: true, 
            isFeatured: input.featured || false 
          })
          .where(eq(testimonials.id, input.id));
        
        // Send approval email if testimonial has email (for registered users)
        // For now, we'll skip email since testimonials don't have email field
        // In future, link testimonials to user accounts
        
        return { success: true };
      }),
  }),
  
  // ==================== HOME PAGE CONTENT ====================
  homeContent: router({
    getAll: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(homePageContent).orderBy(asc(homePageContent.displayOrder));
    }),
    
    getBySectionType: publicProcedure
      .input(z.object({ sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats', 'pricing', 'team', 'events', 'training']) }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        return database
          .select()
          .from(homePageContent)
          .where(and(eq(homePageContent.sectionType, input.sectionType), eq(homePageContent.isActive, true)))
          .orderBy(asc(homePageContent.displayOrder));
      }),
    
    getActive: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database
        .select()
        .from(homePageContent)
        .where(eq(homePageContent.isActive, true))
        .orderBy(asc(homePageContent.displayOrder));
    }),
    
    create: adminProcedure
      .input(z.object({
        sectionType: z.enum(['hero', 'features', 'gallery', 'video', 'testimonials', 'stats', 'pricing', 'team', 'events', 'training']),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const [result] = await database.insert(homePageContent).values(input);
        return { success: true, id: result.insertId };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        const { id, ...data } = input;
        await database.update(homePageContent).set(data).where(eq(homePageContent.id, id));
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        await database.delete(homePageContent).where(eq(homePageContent.id, input.id));
        return { success: true };
      }),
    
    toggleActive: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        
        const [item] = await database
          .select()
          .from(homePageContent)
          .where(eq(homePageContent.id, input.id));
        
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Content not found' });
        
        await database
          .update(homePageContent)
          .set({ isActive: !item.isActive })
          .where(eq(homePageContent.id, input.id));
        
        return { success: true };
      }),
    
    reorder: adminProcedure
      .input(z.object({ id: z.number(), displayOrder: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        await database
          .update(homePageContent)
          .set({ displayOrder: input.displayOrder })
          .where(eq(homePageContent.id, input.id));
        return { success: true };
      }),
  }),
  
  // ==================== NEW FEATURES (Phase 100) ====================
  qrCheckIn: qrCheckInRouter,
  socialMedia: socialMediaRouter,
  emailCampaigns: emailCampaignsRouter,
  referral: referralRouter,
  scoutNetwork: scoutNetworkRouter,
  nutritionAI: nutritionAIRouter,
  injuryPrevention: injuryPreventionRouter,
  educationAcademy: educationAcademyRouter,
  vrTraining: vrTrainingRouter,

  // ==================== QUIZ MANAGEMENT (Phase 108) ====================
  quiz: router({
    getQuestionsByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) return [];
        
        const questions = await database.select()
          .from(quizQuestions)
          .where(eq(quizQuestions.courseId, input.courseId));
        
        return questions.map(q => ({
          id: q.id,
          courseId: q.courseId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
      }),
    
    addQuestion: adminProcedure
      .input(z.object({
        courseId: z.number(),
        question: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const [result] = await database.insert(quizQuestions).values({
          courseId: input.courseId,
          question: input.question,
          optionA: input.optionA,
          optionB: input.optionB,
          optionC: input.optionC,
          optionD: input.optionD,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation || null
        });
        
        return { success: true, id: result.insertId };
      }),
    
    updateQuestion: adminProcedure
      .input(z.object({
        id: z.number(),
        question: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        await database.update(quizQuestions)
          .set({
            question: input.question,
            optionA: input.optionA,
            optionB: input.optionB,
            optionC: input.optionC,
            optionD: input.optionD,
            correctAnswer: input.correctAnswer,
            explanation: input.explanation || null
          })
          .where(eq(quizQuestions.id, input.id));
        
        return { success: true };
      }),
    
    deleteQuestion: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { quizQuestions } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        await database.delete(quizQuestions).where(eq(quizQuestions.id, input.id));
        
        return { success: true };
      }),
  }),

  // ==================== CERTIFICATES (Phase 108) ====================
  certificates: router({
    getMyCertificates: protectedProcedure
      .query(async ({ ctx }) => {
        const { coachCertificates, coachingCourses } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) return [];
        
        const certs = await database.select({
          id: coachCertificates.id,
          courseId: coachCertificates.courseId,
          certificateNumber: coachCertificates.certificateNumber,
          certificateUrl: coachCertificates.certificateUrl,
          level: coachCertificates.level,
          score: coachCertificates.score,
          issuedAt: coachCertificates.issuedAt,
          expiresAt: coachCertificates.expiresAt,
          verificationCode: coachCertificates.verificationCode,
          courseName: coachingCourses.title
        })
          .from(coachCertificates)
          .leftJoin(coachingCourses, eq(coachCertificates.courseId, coachingCourses.id))
          .where(eq(coachCertificates.userId, ctx.user.id));
        
        return certs.map(c => ({
          id: c.id,
          courseId: c.courseId,
          courseName: c.courseName || 'Unknown Course',
          certificateNumber: c.certificateNumber,
          certificateUrl: c.certificateUrl,
          level: c.level,
          score: c.score,
          issuedAt: c.issuedAt?.toISOString() || new Date().toISOString(),
          expiresAt: c.expiresAt?.toISOString() || null,
          verificationCode: c.verificationCode
        }));
      }),
    
    verifyCertificate: publicProcedure
      .input(z.object({ verificationCode: z.string() }))
      .query(async ({ input }) => {
        const { coachCertificates, coachingCourses, users } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) return null;
        
        const [cert] = await database.select({
          id: coachCertificates.id,
          certificateNumber: coachCertificates.certificateNumber,
          level: coachCertificates.level,
          score: coachCertificates.score,
          issuedAt: coachCertificates.issuedAt,
          courseName: coachingCourses.title,
          userName: users.name
        })
          .from(coachCertificates)
          .leftJoin(coachingCourses, eq(coachCertificates.courseId, coachingCourses.id))
          .leftJoin(users, eq(coachCertificates.userId, users.id))
          .where(eq(coachCertificates.verificationCode, input.verificationCode))
          .limit(1);
        
        if (!cert) return null;
        
        return {
          valid: true,
          certificateNumber: cert.certificateNumber,
          courseName: cert.courseName || 'Unknown Course',
          userName: cert.userName || 'Unknown',
          level: cert.level,
          score: cert.score,
          issuedAt: cert.issuedAt?.toISOString() || new Date().toISOString()
        };
      }),
  }),

  // ==================== COURSES (Phase 108) ====================
  courses: router({
    getAllCourses: protectedProcedure
      .query(async () => {
        const { coachingCourses } = await import('../drizzle/schema');
        const database = await getDb();
        if (!database) return [];
        
        const courses = await database.select()
          .from(coachingCourses)
          .where(eq(coachingCourses.isPublished, true))
          .orderBy(asc(coachingCourses.order));
        
        return courses.map(c => ({
          id: c.id,
          title: c.title,
          level: c.level || c.category || 'Unknown'
        }));
      }),
  }),
});

// Helper function to get formation positions
function getFormationPositions(formation: string): string {
  const positions: Record<string, string> = {
    '4-3-3': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), CM(450,200), CM(450,400), CM(450,600), LW(650,150), ST(650,400), RW(650,650)',
    '4-4-2': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), LM(450,150), CM(450,300), CM(450,500), RM(450,650), ST(650,300), ST(650,500)',
    '3-5-2': 'GK(100,400), CB(250,200), CB(250,400), CB(250,600), LWB(400,100), CM(450,250), CM(450,400), CM(450,550), RWB(400,700), ST(650,300), ST(650,500)',
    '4-2-3-1': 'GK(100,400), LB(250,150), CB(250,300), CB(250,500), RB(250,650), CDM(400,300), CDM(400,500), LW(550,150), CAM(550,400), RW(550,650), ST(700,400)'
  };
  return positions[formation] || positions['4-3-3'];
}

export type AppRouter = typeof appRouter;
