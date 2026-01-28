#!/usr/bin/env node
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('🔌 Connected to database');
  console.log('⚠️  WARNING: This will DROP ALL TABLES!');
  console.log('🔄 Fetching all tables...');

  // Get all tables
  const [tables] = await connection.execute('SHOW TABLES');
  const tableNames = tables.map(row => Object.values(row)[0]);

  console.log(`📋 Found ${tableNames.length} tables to drop`);

  // Disable foreign key checks
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Drop all tables
  for (const table of tableNames) {
    console.log(`   🗑️  Dropping ${table}...`);
    await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
  }

  // Re-enable foreign key checks
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

  console.log('✅ All tables dropped successfully');
  console.log('🚀 Now run: npx drizzle-kit push');

  await connection.end();
}

resetDatabase().catch(console.error);
