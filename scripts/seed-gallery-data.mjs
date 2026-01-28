#!/usr/bin/env node
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);

const connection = await mysql.createConnection({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

console.log('🌱 Seeding gallery data...\n');

try {
  // Get an admin user ID (or create a default one)
  let [users] = await connection.execute(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );
  
  let adminUserId;
  if (users.length === 0) {
    console.log('⚠️  No admin user found, creating default admin...');
    const [result] = await connection.execute(
      `INSERT INTO users (openId, email, name, role) VALUES (?, ?, ?, ?)`,
      ['admin-gallery-seed', 'admin@academy.com', 'Admin User', 'admin']
    );
    adminUserId = result.insertId;
  } else {
    adminUserId = users[0].id;
  }

  // Clear existing gallery videos
  await connection.execute(
    `DELETE FROM academy_videos WHERE category LIKE 'gallery%'`
  );
  console.log('🗑️  Cleared existing gallery videos\n');

  // Insert gallery videos
  const galleryVideos = [
    {
      title: 'Team Photo - Academy Squad',
      titleAr: 'صورة الفريق - فريق الأكاديمية',
      description: 'Our talented academy team ready for training',
      descriptionAr: 'فريق الأكاديمية الموهوب جاهز للتدريب',
      category: 'gallery_highlights',
      videoUrl: '/media/team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg',
      thumbnailUrl: '/media/team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg',
      fileKey: 'team/b77066c1-11b8-4798-acb0-ae5d3b971ce0.jpg',
      isVideo: false,
      displayOrder: 1
    },
    {
      title: 'Group Training Session',
      titleAr: 'جلسة تدريب جماعية',
      description: 'Team building and group training activities',
      descriptionAr: 'أنشطة بناء الفريق والتدريب الجماعي',
      category: 'gallery_highlights',
      videoUrl: '/media/team/5980967093731969141(1).jpg',
      thumbnailUrl: '/media/team/5980967093731969141(1).jpg',
      fileKey: 'team/5980967093731969141(1).jpg',
      isVideo: false,
      displayOrder: 2
    }
  ];

  let insertedCount = 0;
  for (const video of galleryVideos) {
    const metadata = {
      titleAr: video.titleAr,
      descriptionAr: video.descriptionAr,
      isVideo: video.isVideo
    };

    await connection.execute(
      `INSERT INTO academy_videos 
       (title, description, category, videoUrl, thumbnailUrl, fileKey, duration, uploadedBy, isActive, displayOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        video.title,
        JSON.stringify(metadata),
        video.category,
        video.videoUrl,
        video.thumbnailUrl,
        video.fileKey,
        video.duration || 0,
        adminUserId,
        true,
        video.displayOrder
      ]
    );
    insertedCount++;
    console.log(`✅ Added: ${video.title}`);
  }

  console.log(`\n🎉 Successfully seeded ${insertedCount} gallery items!`);
  
} catch (error) {
  console.error('❌ Error seeding gallery:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
