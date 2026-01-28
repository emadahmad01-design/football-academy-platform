import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Spreading performance metrics across last 12 months...\n');

// Get all performance metrics
const [allMetrics] = await connection.execute(
  `SELECT id, createdAt FROM performance_metrics ORDER BY id`
);

console.log(`Total metrics: ${allMetrics.length}`);

// Divide into 12 groups for 12 months
const metricsPerMonth = Math.floor(allMetrics.length / 12);
const months = [
  { month: 'February 2025', offset: -11 },
  { month: 'March 2025', offset: -10 },
  { month: 'April 2025', offset: -9 },
  { month: 'May 2025', offset: -8 },
  { month: 'June 2025', offset: -7 },
  { month: 'July 2025', offset: -6 },
  { month: 'August 2025', offset: -5 },
  { month: 'September 2025', offset: -4 },
  { month: 'October 2025', offset: -3 },
  { month: 'November 2025', offset: -2 },
  { month: 'December 2025', offset: -1 },
  { month: 'January 2026', offset: 0 },
];

for (let i = 0; i < months.length; i++) {
  const start = i * metricsPerMonth;
  const end = i === months.length - 1 ? allMetrics.length : (i + 1) * metricsPerMonth;
  const monthMetrics = allMetrics.slice(start, end);
  
  console.log(`${months[i].month}: Updating ${monthMetrics.length} metrics`);
  
  for (const metric of monthMetrics) {
    const newDate = new Date(metric.createdAt);
    newDate.setMonth(newDate.getMonth() + months[i].offset);
    
    await connection.execute(
      `UPDATE performance_metrics SET createdAt = ? WHERE id = ?`,
      [newDate, metric.id]
    );
  }
}

console.log('\nVerifying distribution:');
const [distribution] = await connection.execute(
  `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count 
   FROM performance_metrics 
   GROUP BY month 
   ORDER BY month`
);

console.log(JSON.stringify(distribution, null, 2));

await connection.end();
console.log('\nDone!');
