import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const performanceRouter = router({
  getPlayerSkills: protectedProcedure
    .input(z.object({ playerId: z.number() }))
    .query(async ({ input }) => {
      // Get latest skill scores
      const latestSkills = await db.getLatestSkillScore(input.playerId);
      
      if (!latestSkills) {
        return {
          overallRating: 0,
          radarData: [],
          progressionData: []
        };
      }
      
      // Build radar chart data
      const radarData = [
        { skill: 'Technical', value: latestSkills.technicalScore || 0 },
        { skill: 'Physical', value: latestSkills.physicalScore || 0 },
        { skill: 'Tactical', value: latestSkills.tacticalScore || 0 },
        { skill: 'Mental', value: latestSkills.mentalScore || 0 },
        { skill: 'Ball Control', value: latestSkills.ballControl || 0 },
        { skill: 'Passing', value: latestSkills.passing || 0 }
      ];
      
      // Get skill history for progression chart
      const skillHistory = await db.getSkillScoreHistory(input.playerId);
      
      // Build progression data
      const progressionData = skillHistory.slice(-10).map(s => ({
        date: s.assessmentDate ? new Date(s.assessmentDate).toLocaleDateString() : 'N/A',
        technical: s.technicalScore || 0,
        physical: s.physicalScore || 0,
        tactical: s.tacticalScore || 0,
        mental: s.mentalScore || 0
      }));
      
      // Calculate overall rating (average of all scores)
      const scores = [
        latestSkills.technicalScore,
        latestSkills.physicalScore,
        latestSkills.tacticalScore,
        latestSkills.mentalScore,
        latestSkills.ballControl,
        latestSkills.passing,
        latestSkills.shooting,
        latestSkills.dribbling,
        latestSkills.defending,
        latestSkills.positioning
      ].filter(s => s !== null && s !== undefined) as number[];
      
      const overallRating = scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;
      
      return {
        overallRating,
        radarData,
        progressionData
      };
    })
});
