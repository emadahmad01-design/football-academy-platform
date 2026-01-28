import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const playerId = 701;

// Create 10 performance metrics for the last 2 weeks
const today = new Date();
let insertCount = 0;

for (let i = 0; i < 10; i++) {
  const daysAgo = randomInt(0, 14);
  const sessionDate = new Date(today);
  sessionDate.setDate(sessionDate.getDate() - daysAgo);
  
  const sessionTypes = ['training', 'match', 'assessment'];
  const sessionType = sessionTypes[randomInt(0, 2)];
  
  const technical = randomInt(65, 90);
  const physical = randomInt(70, 92);
  const tactical = randomInt(68, 88);
  const overall = Math.round((technical + physical + tactical) / 3);
  
  await connection.execute(
    `INSERT INTO performance_metrics 
     (playerId, sessionDate, sessionType, 
      touches, passes, passAccuracy, shots, shotsOnTarget,
      dribbles, successfulDribbles, distanceCovered, topSpeed, sprints,
      accelerations, decelerations, possessionWon, possessionLost,
      interceptions, tackles,
      technicalScore, physicalScore, tacticalScore, overallScore)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      playerId, formatDate(sessionDate), sessionType,
      randomInt(30, 80), randomInt(20, 60), randomInt(70, 95), randomInt(0, 8), randomInt(0, 5),
      randomInt(5, 20), randomInt(2, 15), randomInt(5000, 11000), randomInt(280, 340), randomInt(15, 35),
      randomInt(20, 45), randomInt(20, 45), randomInt(5, 15), randomInt(3, 12),
      randomInt(2, 10), randomInt(4, 14),
      technical, physical, tactical, overall
    ]
  );
  insertCount++;
}

console.log(`✅ Created ${insertCount} performance metrics for player 701 (Mahmoud Trezeguet)`);

// Show the metrics
const [metrics] = await connection.execute(
  'SELECT sessionDate, sessionType, technicalScore, physicalScore, overallScore FROM performance_metrics WHERE playerId = 701 ORDER BY sessionDate DESC'
);
console.log('Performance metrics:', metrics);

await connection.end();
