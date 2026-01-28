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

console.log('🧪 Testing gallery query...\n');

try {
  // Test the actual query that will be used
  const [videos] = await connection.execute(
    `SELECT * FROM academy_videos WHERE category LIKE 'gallery%' AND isActive = 1 ORDER BY displayOrder, createdAt DESC`
  );
  
  console.log(`Found ${videos.length} gallery videos:\n`);
  
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title}`);
    console.log(`   Category: ${video.category}`);
    console.log(`   VideoURL: ${video.videoUrl}`);
    console.log(`   Thumbnail: ${video.thumbnailUrl || 'None'}`);
    console.log(`   Display Order: ${video.displayOrder}`);
    console.log('');
  });
  
  // Test if files exist
  console.log('\n📁 Checking if media files exist...');
  const fs = await import('fs');
  const path = await import('path');
  
  for (const video of videos) {
    const filePath = path.join(process.cwd(), 'client', 'public', video.videoUrl);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${video.videoUrl}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await connection.end();
}
