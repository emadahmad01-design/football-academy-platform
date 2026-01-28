import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Checking saved formations...\n');

const [rows] = await connection.execute(`
  SELECT id, name, templateName, positions, createdBy, createdAt 
  FROM formations 
  ORDER BY createdAt DESC 
  LIMIT 5
`);

console.log(`Found ${rows.length} formations:`);
rows.forEach((row, i) => {
  console.log(`\n--- Formation ${i + 1} ---`);
  console.log('ID:', row.id);
  console.log('Name:', row.name);
  console.log('Template:', row.templateName);
  console.log('Created By:', row.createdBy);
  console.log('Created:', row.createdAt);
  console.log('Positions (first 200 chars):', row.positions?.substring(0, 200));
});

await connection.end();
