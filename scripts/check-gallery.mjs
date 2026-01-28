#!/usr/bin/env node
import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔍 Checking gallery content...\n');

try {
  const [videos] = await connection.execute(
    `SELECT id, title, category, videoUrl, thumbnailUrl, isActive 
     FROM academy_videos 
     WHERE category LIKE 'gallery%' 
     ORDER BY displayOrder, createdAt DESC`
  );
  
  console.log(`Found ${videos.length} gallery videos:\n`);
  
  if (videos.length > 0) {
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Category: ${video.category}`);
      console.log(`   Active: ${video.isActive ? 'Yes' : 'No'}`);
      console.log(`   URL: ${video.videoUrl?.substring(0, 50)}...`);
      console.log('');
    });
  } else {
    console.log('❌ No gallery videos found in database');
    console.log('💡 Run: node scripts/seed-gallery-data.mjs to populate gallery\n');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
