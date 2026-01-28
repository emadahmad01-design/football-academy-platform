#!/usr/bin/env node
import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbUrl = new URL(process.env.DATABASE_URL);

const connection = await mysql.createConnection({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

console.log('⚡ Updating dev user to admin...\n');

try {
  await connection.execute(
    `UPDATE users SET role = 'admin', accountStatus = 'approved', onboardingCompleted = true WHERE openId = 'dev-user-id'`
  );
  
  console.log('✅ Dev user updated to admin with approved status');
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await connection.end();
}
