import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Adding mentalScore column to performance_metrics...\n');

try {
  await connection.execute(`ALTER TABLE performance_metrics ADD COLUMN mentalScore int DEFAULT 0`);
  console.log('✓ Column added successfully');
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Column already exists');
  } else {
    console.error('Error:', error.message);
    throw error;
  }
}

console.log('\nFilling mental scores for existing records...');

// Update existing records with random mental scores between 60-90
await connection.execute(`
  UPDATE performance_metrics 
  SET mentalScore = FLOOR(60 + (RAND() * 31))
  WHERE mentalScore = 0 OR mentalScore IS NULL
`);

const [result] = await connection.execute('SELECT COUNT(*) as count FROM performance_metrics WHERE mentalScore > 0');
console.log(`✓ Updated ${result[0].count} records with mental scores`);

console.log('\nVerifying data...');
const [sample] = await connection.execute(`
  SELECT id, playerId, technicalScore, physicalScore, tacticalScore, mentalScore, overallScore 
  FROM performance_metrics 
  LIMIT 5
`);

console.log('Sample records:');
console.table(sample);

await connection.end();
console.log('\nDone!');
