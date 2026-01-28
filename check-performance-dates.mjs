import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count 
   FROM performance_metrics 
   GROUP BY month 
   ORDER BY month DESC 
   LIMIT 10`
);

console.log('Performance metrics by month:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
