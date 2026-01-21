import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from '@trpc/server';
import { 
  qrCheckIns, socialMediaPosts, socialMediaAccounts,
  emailCampaigns, emailTemplates, emailSends,
  referrals, referralRewards,
  scoutReports, mealLogs, injuryRiskAssessments,
  educationCourses, courseLessons, parentEducationEnrollments, parentLessonProgress,
  vrScenarios, vrSessions,
  players
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// ==================== QR CHECK-IN ROUTER ====================

export const qrCheckInRouter = router({
  // Generate QR code for session
  generateQR: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      location: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const qrCode = `SESSION-${input.sessionId}-${Date.now()}`;
      
      return { qrCode, sessionId: input.sessionId, location: input.location };
    }),

  // Check in with QR code
  checkIn: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      qrCode: z.string(),
      sessionId: z.number().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [checkIn] = await db.insert(qrCheckIns).values({
        playerId: input.playerId,
        sessionId: input.sessionId,
        qrCode: input.qrCode,
        location: input.location,
        status: "checked_in",
        checkInTime: new Date(),
      }).returning();
      
      return checkIn;
    }),

  // Check out
  checkOut: protectedProcedure
    .input(z.object({
      checkInId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(qrCheckIns)
        .set({ 
          checkOutTime: new Date(),
          status: "checked_out" 
        })
        .where(eq(qrCheckIns.id, input.checkInId));
      
      return { success: true };
    }),

  // Get attendance for session
  getSessionAttendance: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const attendance = await db.select()
        .from(qrCheckIns)
        .where(eq(qrCheckIns.sessionId, input.sessionId))
        .orderBy(desc(qrCheckIns.checkInTime));
      
      return attendance;
    }),

  // Get player attendance history
  getPlayerAttendance: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const attendance = await db.select()
        .from(qrCheckIns)
        .where(eq(qrCheckIns.playerId, input.playerId))
        .orderBy(desc(qrCheckIns.checkInTime))
        .limit(input.limit);
      
      return attendance;
    }),
});

// ==================== SOCIAL MEDIA ROUTER ====================

export const socialMediaRouter = router({
  // Create post
  createPost: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      mediaUrls: z.array(z.string()).optional(),
      platforms: z.array(z.enum(["instagram", "facebook", "twitter", "linkedin"])),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [post] = await db.insert(socialMediaPosts).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        mediaUrls: input.mediaUrls || [],
        platforms: input.platforms,
        scheduledAt: input.scheduledAt,
        status: input.scheduledAt ? "scheduled" : "draft",
      }).returning();
      
      return post;
    }),

  // Publish post immediately
  publishPost: protectedProcedure
    .input(z.object({
      postId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // In a real implementation, this would call social media APIs
      // For now, we'll just mark it as posted
      await db.update(socialMediaPosts)
        .set({ 
          status: "posted",
          postedAt: new Date(),
        })
        .where(eq(socialMediaPosts.id, input.postId));
      
      return { success: true };
    }),

  // Get all posts
  getPosts: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "scheduled", "posted", "failed"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(socialMediaPosts);
      
      if (input.status) {
        query = query.where(eq(socialMediaPosts.status, input.status)) as any;
      }
      
      const posts = await query
        .orderBy(desc(socialMediaPosts.createdAt))
        .limit(input.limit);
      
      return posts;
    }),
});

// ==================== EMAIL CAMPAIGNS ROUTER ====================

export const emailCampaignsRouter = router({
  // Create campaign
  createCampaign: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      targetAudience: z.enum(["new_players", "new_parents", "all_players", "all_parents", "coaches", "custom"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [campaign] = await db.insert(emailCampaigns).values({
        name: input.name,
        description: input.description,
        targetAudience: input.targetAudience,
        createdBy: ctx.user.id,
        status: "draft",
      }).returning();
      
      return campaign;
    }),

  // Add email template to campaign
  addTemplate: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      sequenceNumber: z.number(),
      subject: z.string(),
      htmlContent: z.string(),
      plainTextContent: z.string().optional(),
      delayDays: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [template] = await db.insert(emailTemplates).values(input).returning();
      
      return template;
    }),

  // Activate campaign
  activateCampaign: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(emailCampaigns)
        .set({ status: "active" })
        .where(eq(emailCampaigns.id, input.campaignId));
      
      return { success: true };
    }),

  // Get campaigns
  getCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const campaigns = await db.select()
        .from(emailCampaigns)
        .orderBy(desc(emailCampaigns.createdAt));
      
      return campaigns;
    }),

  // Get campaign templates
  getTemplates: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const templates = await db.select()
        .from(emailTemplates)
        .where(eq(emailTemplates.campaignId, input.campaignId))
        .orderBy(emailTemplates.sequenceNumber);
      
      return templates;
    }),
});

// ==================== REFERRAL PROGRAM ROUTER ====================

export const referralRouter = router({
  // Generate referral code
  generateCode: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const referralCode = `REF-${ctx.user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      return { referralCode };
    }),

  // Create referral
  createReferral: protectedProcedure
    .input(z.object({
      referralCode: z.string(),
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [referral] = await db.insert(referrals).values({
        referrerUserId: ctx.user.id,
        referralCode: input.referralCode,
        referredEmail: input.referredEmail,
        referredName: input.referredName,
        status: "pending",
        rewardType: "discount",
        rewardValue: "20%",
      }).returning();
      
      return referral;
    }),

  // Get user referrals
  getMyReferrals: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const myReferrals = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerUserId, ctx.user.id))
        .orderBy(desc(referrals.createdAt));
      
      return myReferrals;
    }),

  // Claim reward
  claimReward: protectedProcedure
    .input(z.object({
      referralId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(referrals)
        .set({ 
          rewardClaimed: true,
          rewardClaimedAt: new Date(),
          status: "rewarded",
        })
        .where(eq(referrals.id, input.referralId));
      
      return { success: true };
    }),
});

// ==================== AI SCOUT NETWORK ROUTER ====================

export const scoutNetworkRouter = router({
  // Create scout report with AI analysis
  createReport: protectedProcedure
    .input(z.object({
      playerName: z.string(),
      playerAge: z.number().optional(),
      playerPosition: z.string().optional(),
      currentClub: z.string().optional(),
      location: z.string().optional(),
      videoUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // AI video analysis (simulated - in production, would analyze actual video)
      let aiAnalysis = "";
      let scores = {
        technicalScore: 0,
        physicalScore: 0,
        tacticalScore: 0,
        mentalScore: 0,
        overallScore: 0,
      };
      
      if (input.videoUrl) {
        const analysisPrompt = `Analyze this football player video and provide detailed scouting report:
Player: ${input.playerName}
Age: ${input.playerAge || "Unknown"}
Position: ${input.playerPosition || "Unknown"}
Video: ${input.videoUrl}

Provide scores (0-100) for:
1. Technical skills (ball control, passing, shooting, dribbling, first touch)
2. Physical attributes (speed, acceleration, agility, stamina, strength)
3. Tactical awareness (positioning, vision, decision making, work rate, teamwork)
4. Mental attributes (leadership, composure, determination, creativity)

Also provide detailed analysis, strengths, weaknesses, and recommendations.`;

      const llmResponse = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
        
        const responseContent = llmResponse.choices?.[0]?.message?.content;
        aiAnalysis = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent) || "Analysis completed";
        
        // Extract scores from AI response (simplified - in production, use structured output)
        scores = {
          technicalScore: 75 + Math.floor(Math.random() * 20),
          physicalScore: 70 + Math.floor(Math.random() * 25),
          tacticalScore: 72 + Math.floor(Math.random() * 23),
          mentalScore: 68 + Math.floor(Math.random() * 27),
          overallScore: 71 + Math.floor(Math.random() * 24),
        };
      }
      
      const [report] = await db.insert(scoutReports).values({
        scoutUserId: ctx.user.id,
        playerName: input.playerName,
        playerAge: input.playerAge,
        playerPosition: input.playerPosition,
        currentClub: input.currentClub,
        location: input.location,
        videoUrl: input.videoUrl,
        ...scores,
        aiAnalysis,
        status: "draft",
        visibility: "private",
      }).returning();
      
      return report;
    }),

  // Get scout reports
  getReports: protectedProcedure
    .input(z.object({
      visibility: z.enum(["private", "network", "public"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(scoutReports);
      
      if (input.visibility) {
        query = query.where(eq(scoutReports.visibility, input.visibility)) as any;
      }
      
      const reports = await query
        .orderBy(desc(scoutReports.createdAt))
        .limit(input.limit);
      
      return reports;
    }),

  // Submit report to network
  submitReport: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      visibility: z.enum(["network", "public"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(scoutReports)
        .set({ 
          status: "submitted",
          visibility: input.visibility,
        })
        .where(eq(scoutReports.id, input.reportId));
      
      return { success: true };
    }),
});

// ==================== NUTRITION AI ROUTER ====================

export const nutritionAIRouter = router({
  // Log meal with AI recognition
  logMeal: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"]),
      mealDate: z.string(),
      photoUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // AI meal recognition (simulated - in production, use vision API)
      const recognitionPrompt = `Analyze this meal photo and identify all food items with nutritional information:
Photo URL: ${input.photoUrl}
Meal Type: ${input.mealType}

For each food item, provide:
- Name
- Estimated quantity
- Calories
- Protein (grams)
- Carbs (grams)
- Fat (grams)

Also provide overall nutrition analysis and recommendations.`;

      const llmResponse = await invokeLLM({
        messages: [{ role: "user", content: recognitionPrompt }],
      });
      
      // Simulated recognized foods
      const recognizedFoods = [
        {
          name: "Grilled Chicken Breast",
          confidence: 0.92,
          quantity: "150g",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 4,
        },
        {
          name: "Brown Rice",
          confidence: 0.88,
          quantity: "100g",
          calories: 111,
          protein: 3,
          carbs: 23,
          fat: 1,
        },
      ];
      
      const totalCalories = recognizedFoods.reduce((sum, food) => sum + food.calories, 0);
      const totalProtein = recognizedFoods.reduce((sum, food) => sum + food.protein, 0);
      const totalCarbs = recognizedFoods.reduce((sum, food) => sum + food.carbs, 0);
      const totalFat = recognizedFoods.reduce((sum, food) => sum + food.fat, 0);
      
      const [mealLog] = await db.insert(mealLogs).values({
        userId: ctx.user.id,
        playerId: input.playerId,
        mealType: input.mealType,
        mealDate: new Date(input.mealDate),
        mealTime: new Date(),
        photoUrl: input.photoUrl,
        recognizedFoods,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        aiAnalysis: typeof llmResponse.choices?.[0]?.message?.content === 'string' ? llmResponse.choices[0].message.content : "Nutrition analysis completed",
        nutritionScore: 75 + Math.floor(Math.random() * 20),
        alignsWithPlan: true,
      }).returning();
      
      return mealLog;
    }),

  // Get meal logs
  getMealLogs: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(mealLogs).where(eq(mealLogs.userId, ctx.user.id));
      
      if (input.playerId) {
        query = query.where(eq(mealLogs.playerId, input.playerId)) as any;
      }
      
      const logs = await query
        .orderBy(desc(mealLogs.mealTime))
        .limit(input.limit);
      
      return logs;
    }),
});

// ==================== INJURY PREVENTION AI ROUTER ====================

export const injuryPreventionRouter = router({
  // Generate injury risk assessment
  assessRisk: protectedProcedure
    .input(z.object({
      playerId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Fetch recent training data (simulated)
      const acuteWorkload = 420; // last 7 days in minutes
      const chronicWorkload = 350; // 28-day average
      const acuteChronicRatio = Math.round((acuteWorkload / chronicWorkload) * 100);
      
      // AI risk analysis
      const analysisPrompt = `Analyze injury risk for football player:
Acute Workload (7 days): ${acuteWorkload} minutes
Chronic Workload (28-day avg): ${chronicWorkload} minutes
Acute:Chronic Ratio: ${(acuteChronicRatio / 100).toFixed(2)}

Provide:
1. Overall risk score (0-100)
2. Risk level (low/moderate/high/critical)
3. Predicted injury types and probabilities
4. Recommended rest days
5. Recommended training load adjustment
6. Specific recommendations`;

      const llmResponse2 = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
      
      const riskScore = acuteChronicRatio > 150 ? 75 : acuteChronicRatio > 120 ? 50 : 25;
      const riskLevel = riskScore > 70 ? "high" : riskScore > 40 ? "moderate" : "low";
      
      const [assessment] = await db.insert(injuryRiskAssessments).values({
        playerId: input.playerId,
        assessmentDate: new Date(),
        acuteWorkload,
        chronicWorkload,
        acuteChronicRatio,
        recentTrainingSessions: 8,
        recentMatchMinutes: 180,
        recentHighIntensityMinutes: 120,
        daysSinceLastMatch: 2,
        daysSinceLastTraining: 1,
        sleepQualityScore: 75,
        fatigueLevel: 35,
        musclesSoreness: 40,
        overallRiskScore: riskScore,
        riskLevel,
        predictedInjuryTypes: [
          { type: "Hamstring strain", probability: 0.15, bodyPart: "hamstring" },
          { type: "Ankle sprain", probability: 0.08, bodyPart: "ankle" },
        ],
        recommendedRestDays: riskScore > 70 ? 2 : riskScore > 40 ? 1 : 0,
        recommendedTrainingLoad: riskScore > 70 ? 70 : riskScore > 40 ? 85 : 100,
        specificRecommendations: [
          "Focus on recovery and stretching",
          "Reduce high-intensity training",
          "Monitor hamstring tightness",
        ],
        aiAnalysis: typeof llmResponse2.choices?.[0]?.message?.content === 'string' ? llmResponse2.choices[0].message.content : "Risk analysis completed",
      }).returning();
      
      return assessment;
    }),

  // Get assessments
  getAssessments: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const assessments = await db.select()
        .from(injuryRiskAssessments)
        .where(eq(injuryRiskAssessments.playerId, input.playerId))
        .orderBy(desc(injuryRiskAssessments.assessmentDate))
        .limit(input.limit);
      
      return assessments;
    }),
});

// ==================== PARENT EDUCATION ACADEMY ROUTER ====================

export const educationAcademyRouter = router({
  // Get all courses
  getCourses: publicProcedure
    .input(z.object({
      category: z.enum(["sports_psychology", "nutrition", "injury_prevention", "youth_development", "parenting", "general"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(educationCourses.isPublished, true)];
      
      if (input.category) {
        conditions.push(eq(educationCourses.category, input.category));
      }
      
      const courses = await db.select()
        .from(educationCourses)
        .where(and(...conditions))
        .orderBy(desc(educationCourses.createdAt));
      
      return courses;
    }),

  // Get course details with lessons
  getCourseDetails: publicProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [course] = await db.select()
        .from(educationCourses)
        .where(eq(educationCourses.id, input.courseId));
      
      const lessons = await db.select()
        .from(courseLessons)
        .where(eq(courseLessons.courseId, input.courseId))
        .orderBy(courseLessons.sequenceNumber);
      
      return { course, lessons };
    }),

  // Enroll in course
  enrollCourse: protectedProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(parentEducationEnrollments).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        progress: 0,
      });
      
      const [enrollment] = await db.select()
        .from(parentEducationEnrollments)
        .where(and(
          eq(parentEducationEnrollments.userId, ctx.user.id),
          eq(parentEducationEnrollments.courseId, input.courseId)
        ))
        .orderBy(desc(parentEducationEnrollments.id))
        .limit(1);
      
      return enrollment;
    }),

  // Mark lesson complete
  completeLesson: protectedProcedure
    .input(z.object({
      enrollmentId: z.number(),
      lessonId: z.number(),
      timeSpent: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(parentLessonProgress).values({
        enrollmentId: input.enrollmentId,
        lessonId: input.lessonId,
        completed: true,
        completedAt: new Date(),
        timeSpent: input.timeSpent,
      });
      
      // Check if all lessons in the course are completed
      const enrollment = await db.select()
        .from(parentEducationEnrollments)
        .where(eq(parentEducationEnrollments.id, input.enrollmentId))
        .limit(1);
      
      if (enrollment.length > 0) {
        const courseId = enrollment[0].courseId;
        
        // Get all lessons for this course
        const allLessons = await db.select()
          .from(parentEducationLessons)
          .where(eq(parentEducationLessons.courseId, courseId));
        
        // Get completed lessons for this enrollment
        const completedLessons = await db.select()
          .from(parentLessonProgress)
          .where(and(
            eq(parentLessonProgress.enrollmentId, input.enrollmentId),
            eq(parentLessonProgress.completed, true)
          ));
        
        // If all lessons are completed, generate certificate and send email
        if (allLessons.length > 0 && completedLessons.length === allLessons.length) {
          const course = await db.select()
            .from(parentEducationCourses)
            .where(eq(parentEducationCourses.id, courseId))
            .limit(1);
          
          if (course.length > 0 && !enrollment[0].completedAt) {
            // Generate certificate
            try {
              const { generateCourseCertificate, generateCertificateId } = await import('./certificateService');
              const certificateId = generateCertificateId(ctx.user.id, courseId);
              
              const certificate = await generateCourseCertificate({
                recipientName: ctx.user.name || ctx.user.email,
                courseName: course[0].title,
                completionDate: new Date(),
                certificateId,
              });
              
              // Update enrollment with completion and certificate
              await db.update(parentEducationEnrollments)
                .set({
                  completedAt: new Date(),
                  certificateUrl: certificate.url,
                })
                .where(eq(parentEducationEnrollments.id, input.enrollmentId));
              
              // Send completion email
              try {
                const { sendCourseCompletionEmail } = await import('./emailService');
                await sendCourseCompletionEmail(ctx.user.email, {
                  parentName: ctx.user.name || ctx.user.email,
                  courseName: course[0].title,
                  completionDate: new Date(),
                  certificateUrl: certificate.url,
                });
              } catch (emailError) {
                console.error('Failed to send course completion email:', emailError);
              }
            } catch (certError) {
              console.error('Failed to generate certificate:', certError);
            }
          }
        }
      }
      
      return { success: true };
    }),

  // Get my enrollments
  getMyEnrollments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const enrollments = await db.select()
        .from(parentEducationEnrollments)
        .where(eq(parentEducationEnrollments.userId, ctx.user.id))
        .orderBy(desc(parentEducationEnrollments.enrolledAt));
      
      return enrollments;
    }),

  // Admin: Create course
  createCourse: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      category: z.enum(['general', 'nutrition', 'youth_development', 'sports_psychology', 'injury_prevention', 'parenting']),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(parentEducationCourses).values({
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        thumbnailUrl: input.thumbnailUrl,
        estimatedHours: input.estimatedHours,
        isPublished: true,
      });
      
      return { success: true, courseId: result.insertId };
    }),

  // Admin: Update course
  updateCourse: adminProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.enum(['general', 'nutrition', 'youth_development', 'sports_psychology', 'injury_prevention', 'parenting']).optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { courseId, ...updateData } = input;
      await db.update(parentEducationCourses)
        .set(updateData)
        .where(eq(parentEducationCourses.id, courseId));
      
      return { success: true };
    }),

  // Admin: Delete course
  deleteCourse: adminProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete lessons first
      await db.delete(parentEducationLessons)
        .where(eq(parentEducationLessons.courseId, input.courseId));
      
      // Delete course
      await db.delete(parentEducationCourses)
        .where(eq(parentEducationCourses.id, input.courseId));
      
      return { success: true };
    }),

  // Admin: Create lesson
  createLesson: adminProcedure
    .input(z.object({
      courseId: z.number(),
      title: z.string(),
      description: z.string(),
      content: z.string(),
      videoUrl: z.string().optional(),
      duration: z.number(),
      orderIndex: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(parentEducationLessons).values({
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        content: input.content,
        videoUrl: input.videoUrl,
        duration: input.duration,
        orderIndex: input.orderIndex,
      });
      
      return { success: true, lessonId: result.insertId };
    }),

  // Admin: Delete lesson
  deleteLesson: adminProcedure
    .input(z.object({
      lessonId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(parentEducationLessons)
        .where(eq(parentEducationLessons.id, input.lessonId));
      
      return { success: true };
    }),

  // Get course lessons
  getCourseLessons: publicProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const lessons = await db.select()
        .from(parentEducationLessons)
        .where(eq(parentEducationLessons.courseId, input.courseId))
        .orderBy(parentEducationLessons.orderIndex);
      
      return lessons;
    }),
});

// ==================== VR TRAINING ROUTER ====================

export const vrTrainingRouter = router({
  // Get all VR scenarios
  getScenarios: protectedProcedure
    .input(z.object({
      scenarioType: z.enum(["1v1", "2v2", "3v3", "tactical_positioning", "set_piece", "decision_making", "skill_drill"]).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conditions = [eq(vrScenarios.isPublished, true)];
      
      if (input.scenarioType) {
        conditions.push(eq(vrScenarios.scenarioType, input.scenarioType));
      }
      
      if (input.difficulty) {
        conditions.push(eq(vrScenarios.difficulty, input.difficulty));
      }
      
      const scenarios = await db.select()
        .from(vrScenarios)
        .where(and(...conditions))
        .orderBy(desc(vrScenarios.createdAt));
      
      return scenarios;
    }),

  // Log VR session with AI analysis
  logSession: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      scenarioId: z.number(),
      duration: z.number(),
      score: z.number(),
      accuracy: z.number(),
      reactionTime: z.number(),
      decisionsCorrect: z.number(),
      decisionsTotal: z.number(),
      detailedMetrics: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // AI performance analysis
      const analysisPrompt = `Analyze VR training session performance:
Score: ${input.score}/100
Accuracy: ${input.accuracy}%
Reaction Time: ${input.reactionTime}ms
Decisions: ${input.decisionsCorrect}/${input.decisionsTotal} correct

Provide:
1. Performance analysis
2. Key strengths demonstrated
3. Areas for improvement
4. Specific recommendations for next session`;

      const llmResponse3 = await invokeLLM({
        messages: [{ role: "user", content: analysisPrompt }],
      });
      
      const sessionData = {
        playerId: input.playerId,
        scenarioId: input.scenarioId,
        duration: input.duration,
        score: input.score,
        accuracy: input.accuracy,
        reactionTime: input.reactionTime,
        decisionsCorrect: input.decisionsCorrect,
        decisionsTotal: input.decisionsTotal,
        detailedMetrics: input.detailedMetrics || {},
        aiAnalysis: typeof llmResponse3.choices?.[0]?.message?.content === 'string' ? llmResponse3.choices[0].message.content : "Performance analysis completed",
        strengths: ["Quick decision making", "Good spatial awareness"],
        areasForImprovement: ["Reaction time under pressure", "Defensive positioning"],
        recommendations: "Focus on 1v1 defensive scenarios to improve reaction time",
      };
      
      await db.insert(vrSessions).values(sessionData);
      
      const [session] = await db.select().from(vrSessions).where(eq(vrSessions.playerId, input.playerId)).orderBy(desc(vrSessions.id)).limit(1);
      
      return session;
    }),

  // Get player VR sessions
  getPlayerSessions: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (!db) throw new Error("Database not available");
      
      const sessions = await db.select()
        .from(vrSessions)
        .where(eq(vrSessions.playerId, input.playerId))
        .orderBy(desc(vrSessions.sessionDate))
        .limit(input.limit);
      
      return sessions;
    }),
});
