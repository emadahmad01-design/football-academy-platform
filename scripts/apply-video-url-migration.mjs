import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Applying migration: Expanding videoUrl column to 2000 characters...');
    
    await connection.execute(`
      ALTER TABLE training_videos 
      MODIFY COLUMN videoUrl varchar(2000) NOT NULL
    `);
    
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration();
