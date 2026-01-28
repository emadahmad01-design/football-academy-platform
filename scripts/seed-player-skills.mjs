#!/usr/bin/env node
/**
 * Seed Player Skill Scores
 * Populates player_skill_scores table with realistic assessment data
 * Run with: node scripts/seed-player-skills.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting player skill scores seeding...\n');

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

try {
  // Get existing players
  const [players] = await connection.execute('SELECT id, position FROM players');
  
  if (players.length === 0) {
    console.log('❌ No players found in database');
    process.exit(0);
  }

  console.log(`Found ${players.length} players`);

  // Check existing skill scores
  const [existingScores] = await connection.execute(
    'SELECT COUNT(*) as count FROM player_skill_scores'
  );

  console.log(`Existing skill scores: ${existingScores[0].count}\n`);

  let insertCount = 0;

  // For each player, create skill scores if they don't exist
  for (const player of players) {
    const [playerScores] = await connection.execute(
      'SELECT COUNT(*) as count FROM player_skill_scores WHERE playerId = ?',
      [player.id]
    );

    // Only add if player has no scores
    if (playerScores[0].count === 0) {
      const today = new Date();
      const assessmentDate = formatDate(today);

      // Generate realistic scores based on position
      let technicalBase, physicalBase, defensiveBase, mentalBase;

      switch (player.position) {
        case 'goalkeeper':
          technicalBase = randomInt(65, 88);
          physicalBase = randomInt(70, 90);
          defensiveBase = randomInt(75, 95);
          mentalBase = randomInt(70, 90);
          break;
        case 'defender':
          technicalBase = randomInt(60, 85);
          physicalBase = randomInt(75, 92);
          defensiveBase = randomInt(80, 96);
          mentalBase = randomInt(68, 88);
          break;
        case 'midfielder':
          technicalBase = randomInt(70, 92);
          physicalBase = randomInt(68, 88);
          defensiveBase = randomInt(65, 85);
          mentalBase = randomInt(72, 90);
          break;
        case 'forward':
          technicalBase = randomInt(72, 94);
          physicalBase = randomInt(70, 90);
          defensiveBase = randomInt(55, 75);
          mentalBase = randomInt(70, 88);
          break;
        default:
          technicalBase = randomInt(65, 85);
          physicalBase = randomInt(65, 85);
          defensiveBase = randomInt(65, 85);
          mentalBase = randomInt(65, 85);
      }

      // Individual technical skills
      const ballControl = randomInt(technicalBase - 5, technicalBase + 5);
      const firstTouch = randomInt(technicalBase - 8, technicalBase + 2);
      const dribbling = randomInt(technicalBase - 10, technicalBase + 5);
      const passing = randomInt(technicalBase - 3, technicalBase + 7);
      const shooting = randomInt(technicalBase - 15, technicalBase + 10);
      const crossing = randomInt(technicalBase - 12, technicalBase + 8);
      const heading = randomInt(technicalBase - 20, technicalBase + 10);

      // Foot preference
      const leftFootScore = randomInt(40, 90);
      const rightFootScore = randomInt(40, 90);
      const twoFootedScore = Math.min(
        100,
        Math.round(Math.abs(leftFootScore - rightFootScore) > 30 ? 40 : 70)
      );
      const weakFootUsage = twoFootedScore > 70 ? randomInt(30, 60) : randomInt(5, 25);

      // Physical skills
      const speed = randomInt(physicalBase - 8, physicalBase + 8);
      const acceleration = randomInt(physicalBase - 5, physicalBase + 10);
      const agility = randomInt(physicalBase - 10, physicalBase + 5);
      const stamina = randomInt(physicalBase - 5, physicalBase + 10);
      const strength = randomInt(physicalBase - 8, physicalBase + 8);
      const jumping = randomInt(physicalBase - 15, physicalBase + 5);

      // Mental skills
      const positioning = randomInt(mentalBase - 8, mentalBase + 8);
      const vision = randomInt(mentalBase - 10, mentalBase + 5);
      const composure = randomInt(mentalBase - 5, mentalBase + 10);
      const decisionMaking = randomInt(mentalBase - 5, mentalBase + 10);
      const workRate = randomInt(mentalBase - 3, mentalBase + 8);

      // Defensive skills
      const marking = randomInt(defensiveBase - 10, defensiveBase + 5);
      const tackling = randomInt(defensiveBase - 5, defensiveBase + 10);
      const interceptions = randomInt(defensiveBase - 8, defensiveBase + 8);

      // Calculate overall scores
      const technicalOverall = Math.round(
        (ballControl + firstTouch + dribbling + passing + shooting + crossing + heading) / 7
      );
      const physicalOverall = Math.round(
        (speed + acceleration + agility + stamina + strength + jumping) / 6
      );
      const mentalOverall = Math.round(
        (positioning + vision + composure + decisionMaking + workRate) / 5
      );
      const defensiveOverall = Math.round(
        (marking + tackling + interceptions) / 3
      );

      const overallRating = Math.round(
        (technicalOverall + physicalOverall + mentalOverall + defensiveOverall) / 4
      );
      const potentialRating = Math.min(100, overallRating + randomInt(5, 20));

      await connection.execute(
        `INSERT INTO player_skill_scores (
          playerId, assessmentDate,
          ballControl, firstTouch, dribbling, passing, shooting, crossing, heading,
          leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
          speed, acceleration, agility, stamina, strength, jumping,
          positioning, vision, composure, decisionMaking, workRate,
          marking, tackling, interceptions,
          technicalOverall, physicalOverall, mentalOverall, defensiveOverall,
          overallRating, potentialRating
        ) VALUES (
          ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )`,
        [
          player.id, assessmentDate,
          ballControl, firstTouch, dribbling, passing, shooting, crossing, heading,
          leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
          speed, acceleration, agility, stamina, strength, jumping,
          positioning, vision, composure, decisionMaking, workRate,
          marking, tackling, interceptions,
          technicalOverall, physicalOverall, mentalOverall, defensiveOverall,
          overallRating, potentialRating
        ]
      );
      insertCount++;
    }
  }

  console.log(`✅ Successfully created ${insertCount} skill score records`);
  console.log(`📊 Total skill scores in database: ${existingScores[0].count + insertCount}`);

} catch (error) {
  console.error('❌ Error seeding skill scores:', error.message);
  process.exit(1);
} finally {
  await connection.end();
  console.log('\n✨ Seeding complete!');
}
