#!/usr/bin/env node
/**
 * Seed Private Training Coaches
 * Creates coach users, profiles, schedules, and reviews
 * Run with: node scripts/seed-coaches.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🌱 Seeding private training coaches...\n');

try {
  // 1. Create sample coach users
  const coachUsers = [
    {
      openId: 'coach-ahmed-001',
      name: 'Coach Ahmed Hassan',
      email: 'ahmed.hassan@futurefc.com',
      role: 'coach',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    {
      openId: 'coach-mohamed-002',
      name: 'Coach Mohamed Ali',
      email: 'mohamed.ali@futurefc.com',
      role: 'coach',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    },
    {
      openId: 'coach-omar-003',
      name: 'Coach Omar Khaled',
      email: 'omar.khaled@futurefc.com',
      role: 'coach',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
    {
      openId: 'coach-sara-004',
      name: 'Coach Sara Ibrahim',
      email: 'sara.ibrahim@futurefc.com',
      role: 'coach',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    {
      openId: 'coach-karim-005',
      name: 'Coach Karim Mostafa',
      email: 'karim.mostafa@futurefc.com',
      role: 'coach',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    },
  ];

  console.log('Creating coach users...');
  const insertedUserIds = [];
  
  for (const user of coachUsers) {
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE openId = ?',
      [user.openId]
    );
    
    if (existing.length > 0) {
      console.log(`  ✓ Coach ${user.name} already exists (ID: ${existing[0].id})`);
      insertedUserIds.push(existing[0].id);
    } else {
      const [result] = await connection.execute(
        'INSERT INTO users (openId, name, email, role, avatarUrl) VALUES (?, ?, ?, ?, ?)',
        [user.openId, user.name, user.email, user.role, user.avatarUrl]
      );
      console.log(`  ✓ Created coach ${user.name} (ID: ${result.insertId})`);
      insertedUserIds.push(result.insertId);
    }
  }

  // 2. Create coach profiles
  const coachProfilesData = [
    {
      title: 'Head Coach',
      specialization: 'technical',
      qualifications: 'UEFA A License, AFC Pro Diploma',
      experience: '15 years of professional coaching experience. Former player for Al-Ahly youth academy.',
      yearsExperience: 15,
      bio: 'Specialized in developing young talent with focus on technical skills and ball control. Passionate about nurturing the next generation of Egyptian football stars.',
      achievements: JSON.stringify(['Egyptian Premier League Youth Champion 2020', 'Best Youth Coach Award 2019']),
      languages: JSON.stringify(['Arabic', 'English']),
      isPublic: 1,
    },
    {
      title: 'Technical Coach',
      specialization: 'tactical',
      qualifications: 'UEFA B License, Sports Science Degree',
      experience: '10 years coaching experience with focus on tactical awareness and game intelligence.',
      yearsExperience: 10,
      bio: 'Expert in tactical training and match analysis. Helps players understand positioning, movement, and decision-making on the field.',
      achievements: JSON.stringify(['Regional Championship Winner 2021', 'Youth Development Excellence Award']),
      languages: JSON.stringify(['Arabic', 'English', 'French']),
      isPublic: 1,
    },
    {
      title: 'Fitness & Goalkeeping Coach',
      specialization: 'goalkeeping',
      qualifications: 'AFC Goalkeeping License, Certified Fitness Trainer',
      experience: '8 years specializing in goalkeeper development and physical conditioning.',
      yearsExperience: 8,
      bio: 'Former professional goalkeeper with expertise in reflexes, positioning, and distribution. Also certified in youth fitness training.',
      achievements: JSON.stringify(['Trained 5 national youth team goalkeepers', 'Fitness Innovation Award 2022']),
      languages: JSON.stringify(['Arabic', 'English']),
      isPublic: 1,
    },
    {
      title: 'Youth Development Coach',
      specialization: 'technical',
      qualifications: 'UEFA B License, Child Psychology Certificate',
      experience: '12 years working with young players aged 6-16. Expert in age-appropriate training methods.',
      yearsExperience: 12,
      bio: 'Passionate about youth development with a focus on building confidence and fundamental skills. Creates fun and engaging training sessions.',
      achievements: JSON.stringify(['Youth Coach of the Year 2021', 'Developed 20+ academy players']),
      languages: JSON.stringify(['Arabic', 'English']),
      isPublic: 1,
    },
    {
      title: 'Striker & Finishing Coach',
      specialization: 'tactical',
      qualifications: 'UEFA A License, Former Professional Player',
      experience: '7 years coaching forwards and strikers. Played professionally for 10 years including Egyptian national team.',
      yearsExperience: 7,
      bio: 'Former professional striker with 150+ career goals. Specializes in finishing, positioning, and attacking movement training.',
      achievements: JSON.stringify(['Former National Team Player', 'Top Scorer Award 2015', 'Champions League Participant']),
      languages: JSON.stringify(['Arabic', 'English', 'Italian']),
      isPublic: 1,
    },
  ];

  console.log('\nCreating coach profiles...');
  for (let i = 0; i < insertedUserIds.length && i < coachProfilesData.length; i++) {
    const userId = insertedUserIds[i];
    const profile = coachProfilesData[i];
    
    const [existing] = await connection.execute(
      'SELECT id FROM coach_profiles WHERE userId = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      console.log(`  ✓ Profile for user ID ${userId} already exists`);
    } else {
      await connection.execute(
        `INSERT INTO coach_profiles 
         (userId, title, specialization, qualifications, experience, yearsExperience, bio, achievements, languages, isPublic) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, profile.title, profile.specialization, profile.qualifications, profile.experience, 
         profile.yearsExperience, profile.bio, profile.achievements, profile.languages, profile.isPublic]
      );
      console.log(`  ✓ Created profile for user ID ${userId}`);
    }
  }

  // 3. Create training locations (if not exist)
  const locations = [
    {
      name: 'Main Field',
      nameAr: 'الملعب الرئيسي',
      description: 'Full-size grass field with professional lighting',
      descriptionAr: 'ملعب عشبي كامل الحجم مع إضاءة احترافية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 2,
      isActive: 1,
    },
    {
      name: 'Indoor Court',
      nameAr: 'الملعب الداخلي',
      description: 'Climate-controlled indoor facility for all-weather training',
      descriptionAr: 'منشأة داخلية مكيفة للتدريب في جميع الأحوال الجوية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 1,
      isActive: 1,
    },
    {
      name: 'Training Pitch A',
      nameAr: 'ملعب التدريب أ',
      description: 'Smaller training pitch ideal for 1-on-1 sessions',
      descriptionAr: 'ملعب تدريب صغير مثالي للجلسات الفردية',
      address: 'Future Stars FC Academy, New Cairo',
      capacity: 3,
      isActive: 1,
    },
  ];

  console.log('\nCreating training locations...');
  for (const location of locations) {
    const [existing] = await connection.execute(
      'SELECT id FROM training_locations WHERE name = ?',
      [location.name]
    );
    
    if (existing.length > 0) {
      console.log(`  ✓ Location "${location.name}" already exists`);
    } else {
      await connection.execute(
        `INSERT INTO training_locations 
         (name, nameAr, description, descriptionAr, address, capacity, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [location.name, location.nameAr, location.description, location.descriptionAr, 
         location.address, location.capacity, location.isActive]
      );
      console.log(`  ✓ Created location: ${location.name}`);
    }
  }

  // 4. Create schedule slots for coaches
  const scheduleData = [
    // Coach 1 - Ahmed (weekdays mornings and evenings)
    { coachIndex: 0, slots: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 0, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 1, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 3, startTime: '17:00', endTime: '18:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '10:00', endTime: '11:00', pricePerSession: 600, isRecurring: 1 },
    ]},
    // Coach 2 - Mohamed (afternoons)
    { coachIndex: 1, slots: [
      { dayOfWeek: 1, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 2, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 2, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 4, startTime: '14:00', endTime: '15:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 4, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 6, startTime: '11:00', endTime: '12:00', pricePerSession: 550, isRecurring: 1 },
    ]},
    // Coach 3 - Omar (mornings and weekends)
    { coachIndex: 2, slots: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: 1 },
      { dayOfWeek: 2, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: 1 },
      { dayOfWeek: 4, startTime: '08:00', endTime: '09:00', pricePerSession: 400, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '11:00', endTime: '12:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 6, startTime: '09:00', endTime: '10:00', pricePerSession: 500, isRecurring: 1 },
    ]},
    // Coach 4 - Sara (evenings and weekends)
    { coachIndex: 3, slots: [
      { dayOfWeek: 1, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 3, startTime: '16:00', endTime: '17:00', pricePerSession: 450, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '14:00', endTime: '15:00', pricePerSession: 550, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '16:00', endTime: '17:00', pricePerSession: 550, isRecurring: 1 },
      { dayOfWeek: 6, startTime: '10:00', endTime: '11:00', pricePerSession: 550, isRecurring: 1 },
    ]},
    // Coach 5 - Karim (flexible schedule)
    { coachIndex: 4, slots: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '11:00', pricePerSession: 600, isRecurring: 1 },
      { dayOfWeek: 2, startTime: '15:00', endTime: '16:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 4, startTime: '15:00', endTime: '16:00', pricePerSession: 500, isRecurring: 1 },
      { dayOfWeek: 5, startTime: '15:00', endTime: '16:00', pricePerSession: 600, isRecurring: 1 },
      { dayOfWeek: 6, startTime: '14:00', endTime: '15:00', pricePerSession: 600, isRecurring: 1 },
    ]},
  ];

  console.log('\nCreating schedule slots...');
  let totalSlots = 0;
  for (const { coachIndex, slots } of scheduleData) {
    const coachId = insertedUserIds[coachIndex];
    if (!coachId) continue;
    
    for (const slot of slots) {
      try {
        await connection.execute(
          `INSERT INTO coach_schedule_slots 
           (coachId, locationId, dayOfWeek, startTime, endTime, pricePerSession, isRecurring, isAvailable) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [coachId, 1, slot.dayOfWeek, slot.startTime, slot.endTime, slot.pricePerSession, slot.isRecurring, 1]
        );
        totalSlots++;
      } catch (e) {
        // Slot may already exist
      }
    }
    console.log(`  ✓ Created ${slots.length} slots for coach ID ${coachId}`);
  }

  // 5. Create sample reviews
  const sampleReviews = [
    { rating: 5, comment: 'Excellent coach! My son improved significantly after just a few sessions.' },
    { rating: 5, comment: 'Very professional and patient with the kids. Highly recommended!' },
    { rating: 4, comment: 'Great technical training. My daughter loves the sessions.' },
    { rating: 5, comment: 'Best private training experience. Coach is very dedicated.' },
    { rating: 4, comment: 'Good communication and flexible scheduling.' },
    { rating: 5, comment: 'Outstanding results! My child\'s confidence has grown tremendously.' },
    { rating: 5, comment: 'Exceptional coach with great attention to detail.' },
    { rating: 4, comment: 'Very knowledgeable and motivating. Highly satisfied!' },
  ];

  console.log('\nCreating sample reviews...');
  for (let i = 0; i < insertedUserIds.length; i++) {
    const coachId = insertedUserIds[i];
    if (!coachId) continue;
    
    // Add 2-4 reviews per coach
    const reviewCount = 2 + (i % 3);
    for (let j = 0; j < reviewCount; j++) {
      const review = sampleReviews[(i + j) % sampleReviews.length];
      try {
        await connection.execute(
          'INSERT INTO coach_reviews (coachId, reviewerId, rating, comment) VALUES (?, ?, ?, ?)',
          [coachId, 1, review.rating, review.comment]
        );
      } catch (e) {
        // Review may already exist
      }
    }
    console.log(`  ✓ Created ${reviewCount} reviews for coach ID ${coachId}`);
  }

  console.log('\n✅ Successfully seeded private training coaches!');
  console.log(`   - ${insertedUserIds.length} coaches created`);
  console.log(`   - ${totalSlots} schedule slots created`);
  
  await connection.end();
  process.exit(0);

} catch (error) {
  console.error('❌ Error seeding data:', error);
  await connection.end();
  process.exit(1);
}
