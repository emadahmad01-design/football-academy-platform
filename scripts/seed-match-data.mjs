#!/usr/bin/env node
/**
 * Match and Video Analysis Data Seed Script
 * Fills match-related tables with realistic data
 * Run with: node scripts/seed-match-data.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting match and video data seeding...\n');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

try {
  // Get existing data
  const [existingUsers] = await connection.execute('SELECT id FROM users LIMIT 20');
  const [existingPlayers] = await connection.execute('SELECT id FROM players LIMIT 50');
  const [existingTeams] = await connection.execute('SELECT id FROM teams LIMIT 20');
  const [existingMatches] = await connection.execute('SELECT id, teamId FROM matches LIMIT 30');
  
  const userIds = existingUsers.map(u => u.id);
  const playerIds = existingPlayers.map(p => p.id);
  const teamIds = existingTeams.map(t => t.id);
  const matchIds = existingMatches.map(m => m.id);

  console.log(`Found ${userIds.length} users, ${playerIds.length} players, ${teamIds.length} teams, ${matchIds.length} matches`);

  // 1. PLAYER MATCH STATS
  console.log('\n⚽ Seeding Player Match Stats...');
  const [existingMatchStats] = await connection.execute('SELECT COUNT(*) as count FROM player_match_stats');
  if (existingMatchStats[0].count < 50 && matchIds.length > 0 && playerIds.length > 0) {
    for (let i = 0; i < Math.min(100, matchIds.length * 5); i++) {
      const matchId = matchIds[randomInt(0, matchIds.length - 1)];
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      
      await connection.execute(
        `INSERT INTO player_match_stats (matchId, playerId, minutesPlayed, started, goals, assists, 
        touches, passes, passAccuracy, shots, shotsOnTarget, dribbles, successfulDribbles, 
        tackles, interceptions, distanceCovered, topSpeed, coachRating, performanceScore) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchId, playerId, randomInt(45, 90), randomInt(0, 1) === 1, randomInt(0, 2), randomInt(0, 2),
        randomInt(30, 80), randomInt(20, 60), randomInt(70, 95), randomInt(0, 8), randomInt(0, 5),
        randomInt(3, 15), randomInt(1, 10), randomInt(2, 10), randomInt(1, 8), randomInt(5000, 10000),
        randomInt(250, 350), randomInt(6, 10), randomInt(65, 90)]
      );
    }
    console.log(`✅ Created player match stats`);
  } else {
    console.log('⏭️  Player match stats already exist or insufficient data');
  }

  // 2. MATCH SHOTS (xG Data)
  console.log('\n🎯 Seeding Match Shots (xG)...');
  const [existingShots] = await connection.execute('SELECT COUNT(*) as count FROM match_shots');
  if (existingShots[0].count < 50 && matchIds.length > 0 && playerIds.length > 0 && teamIds.length > 0) {
    for (let i = 0; i < Math.min(150, matchIds.length * 10); i++) {
      const matchId = matchIds[randomInt(0, matchIds.length - 1)];
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const teamId = teamIds[randomInt(0, teamIds.length - 1)];
      const isGoal = Math.random() > 0.85;
      const xGValue = isGoal ? randomInt(50, 95) / 100 : randomInt(5, 60) / 100;
      
      await connection.execute(
        `INSERT INTO match_shots (matchId, playerId, playerName, teamId, minute, positionX, positionY, 
        xGValue, isGoal, isOnTarget, shotType, situation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchId, playerId, `Player ${playerId}`, teamId, randomInt(1, 90), 
        randomInt(60, 100), randomInt(30, 70), xGValue, isGoal, isGoal || Math.random() > 0.5,
        ['right_foot', 'left_foot', 'header'][randomInt(0, 2)],
        ['open_play', 'corner', 'free_kick', 'counter_attack'][randomInt(0, 3)]]
      );
    }
    console.log(`✅ Created match shots with xG data`);
  } else {
    console.log('⏭️  Match shots already exist or insufficient data');
  }

  // 3. MATCH PASSES (xA Data)
  console.log('\n🔄 Seeding Match Passes (xA)...');
  const [existingPasses] = await connection.execute('SELECT COUNT(*) as count FROM match_passes');
  if (existingPasses[0].count < 50 && matchIds.length > 0 && playerIds.length > 0 && teamIds.length > 0) {
    for (let i = 0; i < Math.min(200, matchIds.length * 15); i++) {
      const matchId = matchIds[randomInt(0, matchIds.length - 1)];
      const fromPlayerId = playerIds[randomInt(0, playerIds.length - 1)];
      const toPlayerId = playerIds[randomInt(0, playerIds.length - 1)];
      const teamId = teamIds[randomInt(0, teamIds.length - 1)];
      const isKeyPass = Math.random() > 0.9;
      const xAValue = isKeyPass ? randomInt(10, 40) / 100 : randomInt(0, 10) / 100;
      
      await connection.execute(
        `INSERT INTO match_passes (matchId, fromPlayerId, fromPlayerName, toPlayerId, toPlayerName, 
        teamId, minute, fromX, fromY, toX, toY, xAValue, isSuccessful, isKeyPass, passType) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchId, fromPlayerId, `Player ${fromPlayerId}`, toPlayerId, `Player ${toPlayerId}`,
        teamId, randomInt(1, 90), randomInt(20, 80), randomInt(20, 80), randomInt(20, 80), 
        randomInt(20, 80), xAValue, Math.random() > 0.2, isKeyPass,
        ['short', 'long', 'through_ball', 'cross'][randomInt(0, 3)]]
      );
    }
    console.log(`✅ Created match passes with xA data`);
  } else {
    console.log('⏭️  Match passes already exist or insufficient data');
  }

  // 4. MATCH DEFENSIVE ACTIONS
  console.log('\n🛡️ Seeding Match Defensive Actions...');
  const [existingDefensive] = await connection.execute('SELECT COUNT(*) as count FROM match_defensive_actions');
  if (existingDefensive[0].count < 50 && matchIds.length > 0 && playerIds.length > 0 && teamIds.length > 0) {
    for (let i = 0; i < Math.min(200, matchIds.length * 12); i++) {
      const matchId = matchIds[randomInt(0, matchIds.length - 1)];
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const teamId = teamIds[randomInt(0, teamIds.length - 1)];
      
      await connection.execute(
        `INSERT INTO match_defensive_actions (matchId, playerId, playerName, teamId, minute, 
        positionX, positionY, actionType, isSuccessful) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [matchId, playerId, `Player ${playerId}`, teamId, randomInt(1, 90),
        randomInt(10, 90), randomInt(10, 90),
        ['tackle', 'interception', 'block', 'clearance', 'aerial_duel'][randomInt(0, 4)],
        Math.random() > 0.3]
      );
    }
    console.log(`✅ Created match defensive actions`);
  } else {
    console.log('⏭️  Match defensive actions already exist or insufficient data');
  }

  // 5. MAN OF THE MATCH
  console.log('\n🌟 Seeding Man of the Match...');
  const [existingMotm] = await connection.execute('SELECT COUNT(*) as count FROM man_of_the_match');
  if (existingMotm[0].count < 10 && matchIds.length > 0 && playerIds.length > 0 && userIds.length > 0) {
    for (let i = 0; i < Math.min(matchIds.length, 20); i++) {
      const matchId = matchIds[i];
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      
      await connection.execute(
        `INSERT INTO man_of_the_match (matchId, playerId, rating, reason, selectedBy) 
        VALUES (?, ?, ?, ?, ?)`,
        [matchId, playerId, randomInt(8, 10), 'Outstanding performance with great contribution', 
        userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created man of the match records`);
  } else {
    console.log('⏭️  Man of the match records already exist or insufficient data');
  }

  // 6. GPS TRACKER DATA
  console.log('\n📡 Seeding GPS Tracker Data...');
  const [existingGps] = await connection.execute('SELECT COUNT(*) as count FROM gps_tracker_data');
  const [sessions] = await connection.execute('SELECT id FROM training_sessions LIMIT 20');
  if (existingGps[0].count < 30 && playerIds.length > 0 && (sessions.length > 0 || matchIds.length > 0)) {
    for (let i = 0; i < Math.min(100, playerIds.length * 2); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const useMatch = matchIds.length > 0 && Math.random() > 0.5;
      const sessionId = useMatch ? null : (sessions.length > 0 ? sessions[randomInt(0, sessions.length - 1)].id : null);
      const matchId = useMatch && matchIds.length > 0 ? matchIds[randomInt(0, matchIds.length - 1)] : null;
      
      await connection.execute(
        `INSERT INTO gps_tracker_data (playerId, sessionId, matchId, deviceType, recordedAt, 
        totalDistance, highSpeedDistance, sprintDistance, maxSpeed, avgSpeed, accelerations, 
        decelerations, avgHeartRate, maxHeartRate, playerLoad) 
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, sessionId, matchId, 'CITYPLAY', randomInt(5000, 10000), 
        randomInt(500, 1500), randomInt(200, 600), randomInt(700, 900), randomInt(450, 650),
        randomInt(15, 35), randomInt(15, 35), randomInt(140, 170), randomInt(180, 200), 
        randomInt(30000, 80000)]
      );
    }
    console.log(`✅ Created GPS tracker data`);
  } else {
    console.log('⏭️  GPS tracker data already exist or insufficient data');
  }

  // 7. VIDEO ANALYSIS
  console.log('\n🎥 Seeding Video Analysis...');
  const [existingVideos] = await connection.execute('SELECT COUNT(*) as count FROM video_analysis');
  if (existingVideos[0].count < 10 && playerIds.length > 0 && userIds.length > 0) {
    for (let i = 0; i < Math.min(20, playerIds.length / 2); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const matchId = matchIds.length > 0 ? matchIds[randomInt(0, matchIds.length - 1)] : null;
      
      await connection.execute(
        `INSERT INTO video_analysis (playerId, matchId, title, videoUrl, videoType, 
        overallScore, analysisStatus, uploadedBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, matchId, `Match Analysis ${i + 1}`, 
        `https://example.com/videos/analysis-${i + 1}.mp4`, 
        ['match_highlight', 'training_clip', 'skill_demo'][randomInt(0, 2)],
        randomInt(70, 95), 'completed', userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created video analysis records`);
  } else {
    console.log('⏭️  Video analysis already exists or insufficient data');
  }

  // 8. AI TRAINING RECOMMENDATIONS
  console.log('\n🤖 Seeding AI Training Recommendations...');
  const [existingAiRecs] = await connection.execute('SELECT COUNT(*) as count FROM ai_training_recommendations');
  if (existingAiRecs[0].count < 20 && playerIds.length > 0) {
    for (let i = 0; i < Math.min(30, playerIds.length); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const today = new Date();
      
      await connection.execute(
        `INSERT INTO ai_training_recommendations (playerId, generatedDate, strengthsIdentified, 
        weaknessesIdentified, focusAreas, priorityMetric1, priorityMetric2, priorityMetric3, isActive) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, formatDate(today), 
        JSON.stringify(['Good ball control', 'Strong positioning']),
        JSON.stringify(['Passing accuracy needs work', 'Speed could improve']),
        JSON.stringify(['Passing', 'Speed training', 'Positioning']),
        'passing', 'speed', 'positioning', true]
      );
    }
    console.log(`✅ Created AI training recommendations`);
  } else {
    console.log('⏭️  AI training recommendations already exist or insufficient data');
  }

  // 9. NUTRITION LOGS
  console.log('\n🥗 Seeding Nutrition Logs...');
  const [existingNutritionLogs] = await connection.execute('SELECT COUNT(*) as count FROM nutrition_logs');
  if (existingNutritionLogs[0].count < 30 && playerIds.length > 0) {
    for (let i = 0; i < Math.min(100, playerIds.length * 3); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const daysAgo = randomInt(0, 30);
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - daysAgo);
      
      await connection.execute(
        `INSERT INTO nutrition_logs (playerId, logDate, totalCalories, totalProtein, totalCarbs, 
        totalFats, hydrationMl, mealsLogged) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, formatDate(logDate), randomInt(1800, 3000), randomInt(80, 150),
        randomInt(200, 350), randomInt(50, 100), randomInt(2000, 4000), randomInt(3, 6)]
      );
    }
    console.log(`✅ Created nutrition logs`);
  } else {
    console.log('⏭️  Nutrition logs already exist or insufficient data');
  }

  // 10. PLAYER ACTIVITIES
  console.log('\n📊 Seeding Player Activities...');
  const [existingActivities] = await connection.execute('SELECT COUNT(*) as count FROM player_activities');
  if (existingActivities[0].count < 50 && playerIds.length > 0) {
    for (let i = 0; i < Math.min(150, playerIds.length * 4); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const daysAgo = randomInt(0, 60);
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - daysAgo);
      const activityTypes = ['training', 'match', 'assessment'];
      const activityType = activityTypes[randomInt(0, activityTypes.length - 1)];
      
      await connection.execute(
        `INSERT INTO player_activities (playerId, activityType, activityDate, durationMinutes, 
        possessions, workRate, ballTouches, speedActions, leftFootPercent, rightFootPercent) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, activityType, activityDate, randomInt(60, 120), randomInt(50, 150),
        randomInt(80, 120), randomInt(100, 300), randomInt(10, 40), randomInt(30, 50), 
        randomInt(50, 70)]
      );
    }
    console.log(`✅ Created player activities`);
  } else {
    console.log('⏭️  Player activities already exist or insufficient data');
  }

  // 11. FORMATIONS
  console.log('\n⚙️ Seeding Formations...');
  const [existingFormations] = await connection.execute('SELECT COUNT(*) as count FROM formations');
  if (existingFormations[0].count < 5 && teamIds.length > 0 && userIds.length > 0) {
    const formations = [
      { name: '4-4-2 Classic', template: '4-4-2', description: 'Traditional balanced formation' },
      { name: '4-3-3 Attack', template: '4-3-3', description: 'Attacking formation with wingers' },
      { name: '3-5-2 Defensive', template: '3-5-2', description: 'Defensive with wing backs' },
      { name: '4-2-3-1 Modern', template: '4-2-3-1', description: 'Modern attacking formation' },
      { name: '4-1-4-1 Counter', template: '4-1-4-1', description: 'Counter-attack focused' }
    ];
    
    for (const formation of formations) {
      await connection.execute(
        `INSERT INTO formations (name, templateName, description, positions, teamId, createdBy, isTemplate) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [formation.name, formation.template, formation.description, 
        JSON.stringify([]), teamIds[randomInt(0, teamIds.length - 1)], 
        userIds[randomInt(0, userIds.length - 1)], true]
      );
    }
    console.log(`✅ Created ${formations.length} formations`);
  } else {
    console.log('⏭️  Formations already exist or insufficient data');
  }

  console.log('\n✅ Match and video data seeding completed successfully!');
  console.log('\nSummary:');
  console.log('- Player match statistics and performance data');
  console.log('- xG and xA analytics (shots and passes)');
  console.log('- GPS tracker and physical metrics');
  console.log('- Video analysis and AI recommendations');
  console.log('- Nutrition logs and player activities');
  console.log('- Tactical formations and defensive actions');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  throw error;
} finally {
  await connection.end();
}
