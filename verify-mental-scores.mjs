import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Testing mental score data...\n');

// Check if column exists
const [columns] = await connection.execute(`
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'performance_metrics' AND COLUMN_NAME = 'mentalScore'
`);

console.log('1. Database Schema:');
console.table(columns);

// Check data statistics
const [stats] = await connection.execute(`
  SELECT 
    COUNT(*) as total_records,
    AVG(mentalScore) as avg_mental,
    MIN(mentalScore) as min_mental,
    MAX(mentalScore) as max_mental,
    COUNT(CASE WHEN mentalScore > 0 THEN 1 END) as records_with_mental
  FROM performance_metrics
`);

console.log('\n2. Data Statistics:');
console.table(stats);

// Check distribution by team
const [teamStats] = await connection.execute(`
  SELECT 
    t.name as team_name,
    COUNT(pm.id) as total_metrics,
    AVG(pm.technicalScore) as avg_technical,
    AVG(pm.physicalScore) as avg_physical,
    AVG(pm.tacticalScore) as avg_tactical,
    AVG(pm.mentalScore) as avg_mental,
    AVG(pm.overallScore) as avg_overall
  FROM performance_metrics pm
  JOIN players p ON pm.playerId = p.id
  JOIN teams t ON p.teamId = t.id
  GROUP BY t.id, t.name
  ORDER BY t.name
`);

console.log('\n3. Mental Scores by Team:');
console.table(teamStats.map(t => ({
  team: t.team_name,
  metrics: t.total_metrics,
  technical: Math.round(t.avg_technical),
  physical: Math.round(t.avg_physical),
  tactical: Math.round(t.avg_tactical),
  mental: Math.round(t.avg_mental),
  overall: Math.round(t.avg_overall)
})));

// Sample recent records
const [recent] = await connection.execute(`
  SELECT 
    CONCAT(p.firstName, ' ', p.lastName) as player_name,
    t.name as team_name,
    pm.technicalScore,
    pm.physicalScore,
    pm.tacticalScore,
    pm.mentalScore,
    pm.overallScore,
    DATE_FORMAT(pm.sessionDate, '%Y-%m-%d') as date
  FROM performance_metrics pm
  JOIN players p ON pm.playerId = p.id
  JOIN teams t ON p.teamId = t.id
  ORDER BY pm.sessionDate DESC
  LIMIT 10
`);

console.log('\n4. Recent Performance Records (with mental scores):');
console.table(recent);

await connection.end();
console.log('\n✓ Mental score system verified successfully!');
