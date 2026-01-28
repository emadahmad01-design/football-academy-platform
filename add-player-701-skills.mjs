import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const playerId = 701;
const assessmentDate = new Date().toISOString().split('T')[0];

// For goalkeeper position
const technicalBase = randomInt(65, 88);
const physicalBase = randomInt(70, 90);
const defensiveBase = randomInt(75, 95);
const mentalBase = randomInt(70, 90);

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
const twoFootedScore = Math.min(100, Math.round(Math.abs(leftFootScore - rightFootScore) > 30 ? 40 : 70));
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
const technicalOverall = Math.round((ballControl + firstTouch + dribbling + passing + shooting + crossing + heading) / 7);
const physicalOverall = Math.round((speed + acceleration + agility + stamina + strength + jumping) / 6);
const mentalOverall = Math.round((positioning + vision + composure + decisionMaking + workRate) / 5);
const defensiveOverall = Math.round((marking + tackling + interceptions) / 3);

const overallRating = Math.round((technicalOverall + physicalOverall + mentalOverall + defensiveOverall) / 4);
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
    playerId, assessmentDate,
    ballControl, firstTouch, dribbling, passing, shooting, crossing, heading,
    leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
    speed, acceleration, agility, stamina, strength, jumping,
    positioning, vision, composure, decisionMaking, workRate,
    marking, tackling, interceptions,
    technicalOverall, physicalOverall, mentalOverall, defensiveOverall,
    overallRating, potentialRating
  ]
);

console.log(`✅ Created skill score for player 701 (Mahmoud Trezeguet - Goalkeeper)`);
console.log(`   Technical: ${technicalOverall}, Physical: ${physicalOverall}, Mental: ${mentalOverall}, Defensive: ${defensiveOverall}`);
console.log(`   Overall Rating: ${overallRating}`);

await connection.end();
