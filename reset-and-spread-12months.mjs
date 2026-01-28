import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Resetting and spreading performance metrics across last 12 months...\n');

// First, reset all dates to January 2026
console.log('Step 1: Resetting all dates to January 2026...');
await connection.execute(
  `UPDATE performance_metrics SET createdAt = '2026-01-15 10:00:00'`
);

// Get all performance metrics
const [allMetrics] = await connection.execute(
  `SELECT id FROM performance_metrics ORDER BY id`
);

console.log(`Total metrics: ${allMetrics.length}`);

// Divide into 12 groups for 12 months (Feb 2025 - Jan 2026)
const metricsPerMonth = Math.floor(allMetrics.length / 12);
const months = [
  { month: 'February 2025', date: '2025-02-15' },
  { month: 'March 2025', date: '2025-03-15' },
  { month: 'April 2025', date: '2025-04-15' },
  { month: 'May 2025', date: '2025-05-15' },
  { month: 'June 2025', date: '2025-06-15' },
  { month: 'July 2025', date: '2025-07-15' },
  { month: 'August 2025', date: '2025-08-15' },
  { month: 'September 2025', date: '2025-09-15' },
  { month: 'October 2025', date: '2025-10-15' },
  { month: 'November 2025', date: '2025-11-15' },
  { month: 'December 2025', date: '2025-12-15' },
  { month: 'January 2026', date: '2026-01-15' },
];

console.log('\nStep 2: Distributing metrics across months...');
for (let i = 0; i < months.length; i++) {
  const start = i * metricsPerMonth;
  const end = i === months.length - 1 ? allMetrics.length : (i + 1) * metricsPerMonth;
  const monthMetrics = allMetrics.slice(start, end);
  
  console.log(`${months[i].month}: Updating ${monthMetrics.length} metrics`);
  
  for (const metric of monthMetrics) {
    await connection.execute(
      `UPDATE performance_metrics SET createdAt = ? WHERE id = ?`,
      [months[i].date, metric.id]
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
