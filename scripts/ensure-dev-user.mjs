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

console.log('🔍 Checking for dev user...\n');

try {
  const [users] = await connection.execute(
    `SELECT openId, name, email, role FROM users WHERE openId = 'dev-user-id'`
  );
  
  if (users.length > 0) {
    console.log('✅ Dev user exists:');
    console.log(users[0]);
  } else {
    console.log('❌ Dev user not found');
    console.log('Creating dev user...\n');
    
    await connection.execute(
      `INSERT INTO users (openId, name, email, role, accountStatus, onboardingCompleted) 
       VALUES ('dev-user-id', 'Dev User', 'dev@example.com', 'admin', 'approved', true)`
    );
    
    console.log('✅ Dev user created successfully!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await connection.end();
}
