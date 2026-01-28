import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [performanceCount] = await connection.execute('SELECT COUNT(*) as count FROM performance_metrics');
console.log('Total performance metrics:', performanceCount[0].count);

const [recentMetrics] = await connection.execute(
  'SELECT id, playerId, sessionDate, sessionType, technicalScore, physicalScore FROM performance_metrics ORDER BY sessionDate DESC LIMIT 5'
);
console.log('Recent metrics:', recentMetrics);

await connection.end();
