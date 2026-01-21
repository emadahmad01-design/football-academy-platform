import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';

// Parent-only procedure
const parentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'parent') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access required' });
  }
  return next({ ctx });
});
import { getDb } from './db';
import { 
  parentPlayerRelations, 
  players, 
  playerSkillScores, 
  privateTrainingBookings, 
  notifications,
  // progressReportHistory, // TODO: Add this table to schema
  playerActivities,
  coachProfiles,
  users
} from '../drizzle/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export const parentDashboardRouter = router({
  /**
   * Get comprehensive dashboard data for parent
   * Returns all children with their latest stats, upcoming sessions, and recent notifications
   */
  getDashboardData: parentProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;

    // Get all children linked to this parent
    const childRelations = await database
      .select({
        playerId: parentPlayerRelations.playerId,
        relationshipType: parentPlayerRelations.relationshipType,
        playerName: players.name,
        playerAge: players.age,
        playerPosition: players.position,
        playerTeam: players.team,
        playerPhoto: players.photo,
      })
      .from(parentPlayerRelations)
      .leftJoin(players, eq(parentPlayerRelations.playerId, players.id))
      .where(eq(parentPlayerRelations.parentUserId, userId));

    // Get latest skills for each child
    const childrenWithStats = await Promise.all(
      childRelations.map(async (child) => {
        if (!child.playerId) return null;

        // Latest skill assessment
        const latestSkills = await database
          .select()
          .from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, child.playerId))
          .orderBy(desc(playerSkillScores.id))
          .limit(1);

        // Count activities in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentActivities = await database
          .select({ count: sql<number>`count(*)` })
          .from(playerActivities)
          .where(
            and(
              eq(playerActivities.playerId, child.playerId),
              gte(playerActivities.activityDate, thirtyDaysAgo)
            )
          );

        // Upcoming bookings
        const upcomingBookings = await database
          .select()
          .from(privateTrainingBookings)
          .where(
            and(
              eq(privateTrainingBookings.playerId, child.playerId),
              gte(privateTrainingBookings.sessionDate, new Date())
            )
          )
          .orderBy(privateTrainingBookings.sessionDate)
          .limit(3);

        return {
          ...child,
          latestSkills: latestSkills[0] || null,
          recentActivityCount: recentActivities[0]?.count || 0,
          upcomingBookings: upcomingBookings.length,
        };
      })
    );

    // Get upcoming sessions (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingSessions = await database
      .select({
        id: privateTrainingBookings.id,
        playerId: privateTrainingBookings.playerId,
        playerName: players.name,
        coachId: privateTrainingBookings.coachId,
        coachName: users.name,
        sessionDate: privateTrainingBookings.sessionDate,
        startTime: privateTrainingBookings.startTime,
        duration: privateTrainingBookings.duration,
        sessionType: privateTrainingBookings.sessionType,
        status: privateTrainingBookings.status,
      })
      .from(privateTrainingBookings)
      .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
      .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
      .where(
        and(
          sql`${privateTrainingBookings.playerId} IN (SELECT playerId FROM ${parentPlayerRelations} WHERE parentUserId = ${userId})`,
          gte(privateTrainingBookings.sessionDate, new Date()),
          sql`${privateTrainingBookings.sessionDate} <= ${sevenDaysFromNow}`
        )
      )
      .orderBy(privateTrainingBookings.sessionDate)
      .limit(10);

    // Get recent notifications (last 30 days)
    const recentNotifications = await database
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          gte(notifications.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // Get recent reports - TODO: Implement when progressReportHistory table is added
    const recentReports: any[] = [];

    return {
      children: childrenWithStats.filter(Boolean),
      upcomingSessions,
      recentNotifications,
      recentReports,
    };
  }),

  /**
   * Get summary of all children with key stats
   */
  getChildrenSummary: parentProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;

    const childRelations = await database
      .select({
        playerId: parentPlayerRelations.playerId,
        relationshipType: parentPlayerRelations.relationshipType,
        playerName: players.name,
        playerAge: players.age,
        playerPosition: players.position,
        playerTeam: players.team,
        playerPhoto: players.photo,
      })
      .from(parentPlayerRelations)
      .leftJoin(players, eq(parentPlayerRelations.playerId, players.id))
      .where(eq(parentPlayerRelations.parentUserId, userId));

    const summaries = await Promise.all(
      childRelations.map(async (child) => {
        if (!child.playerId) return null;

        const latestSkills = await database
          .select()
          .from(playerSkillScores)
          .where(eq(playerSkillScores.playerId, child.playerId))
          .orderBy(desc(playerSkillScores.id))
          .limit(1);

        const totalActivities = await database
          .select({ count: sql<number>`count(*)` })
          .from(playerActivities)
          .where(eq(playerActivities.playerId, child.playerId));

        return {
          ...child,
          overallRating: latestSkills[0]?.overallRating || 0,
          technicalAvg: latestSkills[0]?.technicalAvg || 0,
          physicalAvg: latestSkills[0]?.physicalAvg || 0,
          tacticalAvg: latestSkills[0]?.tacticalAvg || 0,
          mentalAvg: latestSkills[0]?.mentalAvg || 0,
          totalActivities: totalActivities[0]?.count || 0,
        };
      })
    );

    return summaries.filter(Boolean);
  }),

  /**
   * Get upcoming sessions for next 7 days
   */
  getUpcomingSessions: parentProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const sessions = await database
      .select({
        id: privateTrainingBookings.id,
        playerId: privateTrainingBookings.playerId,
        playerName: players.name,
        playerPhoto: players.photo,
        coachId: privateTrainingBookings.coachId,
        coachName: users.name,
        coachPhoto: coachProfiles.profilePhoto,
        sessionDate: privateTrainingBookings.sessionDate,
        startTime: privateTrainingBookings.startTime,
        duration: privateTrainingBookings.duration,
        sessionType: privateTrainingBookings.sessionType,
        status: privateTrainingBookings.status,
        location: privateTrainingBookings.location,
      })
      .from(privateTrainingBookings)
      .leftJoin(players, eq(privateTrainingBookings.playerId, players.id))
      .leftJoin(users, eq(privateTrainingBookings.coachId, users.id))
      .leftJoin(coachProfiles, eq(privateTrainingBookings.coachId, coachProfiles.userId))
      .where(
        and(
          sql`${privateTrainingBookings.playerId} IN (SELECT playerId FROM ${parentPlayerRelations} WHERE parentUserId = ${userId})`,
          gte(privateTrainingBookings.sessionDate, new Date()),
          sql`${privateTrainingBookings.sessionDate} <= ${sevenDaysFromNow}`
        )
      )
      .orderBy(privateTrainingBookings.sessionDate);

    return sessions;
  }),

  /**
   * Get recent notifications for last 30 days
   */
  getRecentNotifications: parentProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available');
    }

    const userId = ctx.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNotifications = await database
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          gte(notifications.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return recentNotifications;
  }),

  /**
   * Get recent progress reports
   * TODO: Implement when progressReportHistory table is added to schema
   */
  getRecentReports: parentProcedure.query(async ({ ctx }) => {
    // Placeholder - return empty array until table is created
    return [];
  }),
});
