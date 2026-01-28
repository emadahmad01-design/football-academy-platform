#!/usr/bin/env node
/**
 * Comprehensive Seed Script for All Tables
 * Fills empty tables with realistic sample data
 * Run with: node scripts/seed-all-tables.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting comprehensive database seeding...\n');

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

try {
  // Get existing data
  const [existingUsers] = await connection.execute('SELECT id, role FROM users LIMIT 20');
  const [existingPlayers] = await connection.execute('SELECT id, userId, position FROM players LIMIT 50');
  const [existingTeams] = await connection.execute('SELECT id, name FROM teams LIMIT 20');
  const [existingMatches] = await connection.execute('SELECT id, teamId FROM matches LIMIT 20');
  const [existingSessions] = await connection.execute('SELECT id, teamId FROM training_sessions LIMIT 20');

  const userIds = existingUsers.map(u => u.id);
  const playerIds = existingPlayers.map(p => p.id);
  const teamIds = existingTeams.map(t => t.id);
  const matchIds = existingMatches.map(m => m.id);
  const sessionIds = existingSessions.map(s => s.id);
  const coachIds = existingUsers.filter(u => u.role === 'coach').map(u => u.id);

  console.log(`Found ${userIds.length} users, ${playerIds.length} players, ${teamIds.length} teams`);

  // 1. MEMBERSHIP PLANS
  console.log('\n📋 Seeding Membership Plans...');
  const [existingPlans] = await connection.execute('SELECT COUNT(*) as count FROM membership_plans');
  if (existingPlans[0].count === 0) {
    const plans = [
      { name: 'Basic Monthly', description: 'Basic training package', durationMonths: 1, price: 500, features: JSON.stringify(['2 training sessions per week', 'Performance tracking', 'Basic analytics']) },
      { name: 'Standard Quarterly', description: 'Standard training package', durationMonths: 3, price: 1350, originalPrice: 1500, features: JSON.stringify(['3 training sessions per week', 'Performance tracking', 'Video analysis', 'Nutrition plans']), isPopular: true },
      { name: 'Premium Semi-Annual', description: 'Premium training package', durationMonths: 6, price: 2500, originalPrice: 3000, features: JSON.stringify(['4 training sessions per week', 'Advanced analytics', 'Mental coaching', 'Priority support', '1 private session/month']) },
      { name: 'Elite Annual', description: 'Elite training package', durationMonths: 12, price: 4500, originalPrice: 6000, features: JSON.stringify(['Unlimited training sessions', 'Full analytics suite', 'Mental & nutrition coaching', 'Priority support', '2 private sessions/month', 'Tournament participation']) }
    ];

    for (const plan of plans) {
      await connection.execute(
        'INSERT INTO membership_plans (name, description, durationMonths, price, originalPrice, features, isPopular, isActive, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [plan.name, plan.description, plan.durationMonths, plan.price, plan.originalPrice || plan.price, plan.features, plan.isPopular || false, true, 0]
      );
    }
    console.log(`✅ Created ${plans.length} membership plans`);
  } else {
    console.log('⏭️  Membership plans already exist');
  }

  // 2. TRAINING LOCATIONS
  console.log('\n📍 Seeding Training Locations...');
  const [existingLocations] = await connection.execute('SELECT COUNT(*) as count FROM training_locations');
  if (existingLocations[0].count === 0) {
    const locations = [
      { name: 'Main Training Ground', nameAr: 'الملعب الرئيسي', address: 'New Cairo, Cairo', capacity: 4 },
      { name: 'North Field', nameAr: 'الملعب الشمالي', address: '5th Settlement, Cairo', capacity: 2 },
      { name: 'Indoor Arena', nameAr: 'الصالة الداخلية', address: 'Maadi, Cairo', capacity: 2 },
      { name: 'West Training Center', nameAr: 'مركز التدريب الغربي', address: '6th October, Giza', capacity: 3 }
    ];

    for (const location of locations) {
      await connection.execute(
        'INSERT INTO training_locations (name, nameAr, address, capacity, isActive) VALUES (?, ?, ?, ?, ?)',
        [location.name, location.nameAr, location.address, location.capacity, true]
      );
    }
    console.log(`✅ Created ${locations.length} training locations`);
  } else {
    console.log('⏭️  Training locations already exist');
  }

  // 3. REWARDS
  console.log('\n🎁 Seeding Rewards...');
  const [existingRewards] = await connection.execute('SELECT COUNT(*) as count FROM rewards');
  if (existingRewards[0].count === 0) {
    const rewards = [
      { name: 'Academy Jersey', nameAr: 'قميص الأكاديمية', description: 'Official academy training jersey', descriptionAr: 'قميص تدريب رسمي للأكاديمية', pointsCost: 500, category: 'merchandise', stock: 50 },
      { name: 'Training Ball', nameAr: 'كرة تدريب', description: 'Professional training football', descriptionAr: 'كرة قدم تدريب احترافية', pointsCost: 300, category: 'merchandise', stock: 30 },
      { name: 'Private Training Session', nameAr: 'جلسة تدريب خاصة', description: '1-hour private coaching session', descriptionAr: 'جلسة تدريب خاصة لمدة ساعة واحدة', pointsCost: 1000, category: 'training', stock: 10 },
      { name: 'Tournament Entry', nameAr: 'دخول البطولة', description: 'Free entry to next academy tournament', descriptionAr: 'دخول مجاني للبطولة القادمة', pointsCost: 800, category: 'experience', stock: 20 },
      { name: 'Academy Cap', nameAr: 'قبعة الأكاديمية', description: 'Official academy cap', descriptionAr: 'قبعة رسمية للأكاديمية', pointsCost: 200, category: 'merchandise', stock: 100 },
      { name: 'Water Bottle', nameAr: 'زجاجة مياه', description: 'Premium sports water bottle', descriptionAr: 'زجاجة مياه رياضية متميزة', pointsCost: 150, category: 'merchandise', stock: 80 }
    ];

    for (const reward of rewards) {
      await connection.execute(
        'INSERT INTO rewards (name, nameAr, description, descriptionAr, pointsCost, category, stock, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [reward.name, reward.nameAr, reward.description, reward.descriptionAr, reward.pointsCost, reward.category, reward.stock, true]
      );
    }
    console.log(`✅ Created ${rewards.length} rewards`);
  } else {
    console.log('⏭️  Rewards already exist');
  }

  // 4. TRAINING DRILLS LIBRARY
  console.log('\n⚽ Seeding Training Drills...');
  const [existingDrills] = await connection.execute('SELECT COUNT(*) as count FROM training_drills');
  if (existingDrills[0].count === 0) {
    const drills = [
      { title: 'Cone Dribbling', titleAr: 'المراوغة بين الأقماع', description: 'Dribble through cones to improve ball control', descriptionAr: 'راوغ بين الأقماع لتحسين التحكم بالكرة', category: 'dribbling', difficulty: 'beginner', duration: 15, targetsDribbling: true, targetsBallControl: true, forPosition: 'all' },
      { title: 'Passing Accuracy Drill', titleAr: 'تمرين دقة التمرير', description: 'Pass the ball accurately between partners', descriptionAr: 'مرر الكرة بدقة بين الشركاء', category: 'passing', difficulty: 'beginner', duration: 20, targetsPassing: true, forPosition: 'all' },
      { title: 'Shooting Practice', titleAr: 'تدريب التسديد', description: 'Practice shooting from different angles', descriptionAr: 'تدرب على التسديد من زوايا مختلفة', category: 'shooting', difficulty: 'intermediate', duration: 25, targetsShooting: true, forPosition: 'forward' },
      { title: 'Speed Ladder', titleAr: 'سلم السرعة', description: 'Agility and footwork training', descriptionAr: 'تدريب الرشاقة وحركة القدمين', category: 'speed_agility', difficulty: 'intermediate', duration: 10, targetsSpeed: true, forPosition: 'all' },
      { title: 'First Touch Control', titleAr: 'التحكم باللمسة الأولى', description: 'Improve first touch and ball control', descriptionAr: 'حسّن اللمسة الأولى والتحكم بالكرة', category: 'ball_control', difficulty: 'intermediate', duration: 20, targetsBallControl: true, targetsFirstTouch: true, forPosition: 'all' },
      { title: 'Goalkeeper Reaction Drills', titleAr: 'تدريبات سرعة البديهة لحارس المرمى', description: 'Quick reaction and reflex training', descriptionAr: 'تدريب سرعة رد الفعل والمنعكسات', category: 'goalkeeper', difficulty: 'intermediate', duration: 15, forPosition: 'goalkeeper' },
      { title: 'Defensive Positioning', titleAr: 'المواقع الدفاعية', description: 'Learn proper defensive positioning', descriptionAr: 'تعلم المواقع الدفاعية الصحيحة', category: 'positioning', difficulty: 'advanced', duration: 30, targetsPositioning: true, forPosition: 'defender' },
      { title: 'Heading Practice', titleAr: 'تدريب الضربات الرأسية', description: 'Practice heading technique and accuracy', descriptionAr: 'تدرب على تقنية ودقة الضربات الرأسية', category: 'heading', difficulty: 'intermediate', duration: 20, targetsHeading: true, forPosition: 'all' }
    ];

    for (const drill of drills) {
      await connection.execute(
        'INSERT INTO training_drills (title, titleAr, description, descriptionAr, category, difficulty, duration, targetsBallControl, targetsPassing, targetsShooting, targetsDribbling, targetsSpeed, targetsPositioning, targetsFirstTouch, targetsHeading, forPosition, pointsReward, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [drill.title, drill.titleAr, drill.description, drill.descriptionAr, drill.category, drill.difficulty, drill.duration, drill.targetsBallControl || false, drill.targetsPassing || false, drill.targetsShooting || false, drill.targetsDribbling || false, drill.targetsSpeed || false, drill.targetsPositioning || false, drill.targetsFirstTouch || false, drill.targetsHeading || false, drill.forPosition, 10, true]
      );
    }
    console.log(`✅ Created ${drills.length} training drills`);
  } else {
    console.log('⏭️  Training drills already exist');
  }

  // 5. MASTERCLASS CONTENT
  console.log('\n🎓 Seeding Masterclass Content...');
  const [existingMasterclass] = await connection.execute('SELECT COUNT(*) as count FROM masterclass_content');
  if (existingMasterclass[0].count === 0) {
    const masterclasses = [
      { title: 'Introduction to Football Basics', titleAr: 'مقدمة في أساسيات كرة القدم', description: 'Learn the fundamentals of football', descriptionAr: 'تعلم أساسيات كرة القدم', category: 'getting_started', position: 'all', difficulty: 'beginner', durationMinutes: 15, instructor: 'Coach Ahmed' },
      { title: 'Advanced Dribbling Techniques', titleAr: 'تقنيات المراوغة المتقدمة', description: 'Master dribbling like a pro', descriptionAr: 'أتقن المراوغة كالمحترفين', category: 'skills', position: 'all', difficulty: 'advanced', durationMinutes: 25, instructor: 'Coach Mohamed' },
      { title: 'Striker Positioning', titleAr: 'مواقع المهاجم', description: 'Learn optimal striker positioning', descriptionAr: 'تعلم المواقع المثالية للمهاجم', category: 'position_specific', position: 'forward', difficulty: 'intermediate', durationMinutes: 20, instructor: 'Coach Hassan' },
      { title: 'Defending 101', titleAr: 'الدفاع 101', description: 'Essential defending techniques', descriptionAr: 'تقنيات الدفاع الأساسية', category: 'tactics', position: 'defender', difficulty: 'beginner', durationMinutes: 18, instructor: 'Coach Khaled' },
      { title: 'Midfield Mastery', titleAr: 'إتقان خط الوسط', description: 'Control the midfield like a pro', descriptionAr: 'سيطر على خط الوسط كالمحترفين', category: 'position_specific', position: 'midfielder', difficulty: 'intermediate', durationMinutes: 22, instructor: 'Coach Omar' }
    ];

    for (const masterclass of masterclasses) {
      await connection.execute(
        'INSERT INTO masterclass_content (title, titleAr, description, descriptionAr, videoUrl, category, position, difficulty, durationMinutes, instructor, isPublished, viewCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [masterclass.title, masterclass.titleAr, masterclass.description, masterclass.descriptionAr, `https://example.com/videos/${masterclass.title.toLowerCase().replace(/\s+/g, '-')}.mp4`, masterclass.category, masterclass.position, masterclass.difficulty, masterclass.durationMinutes, masterclass.instructor, true, randomInt(50, 500)]
      );
    }
    console.log(`✅ Created ${masterclasses.length} masterclass videos`);
  } else {
    console.log('⏭️  Masterclass content already exists');
  }

  // 6. ACADEMY EVENTS
  console.log('\n📅 Seeding Academy Events...');
  const [existingEvents] = await connection.execute('SELECT COUNT(*) as count FROM academy_events');
  if (existingEvents[0].count === 0 && userIds.length > 0) {
    const now = new Date();
    const events = [
      { title: 'Summer Training Camp', description: 'Intensive summer training program', eventType: 'camp', startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(['U9', 'U11', 'U13']), maxParticipants: 30, fee: 150000, status: 'upcoming' },
      { title: 'Youth Tournament 2026', description: 'Annual youth football tournament', eventType: 'tournament', startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(['U11', 'U13', 'U15']), maxParticipants: 100, fee: 50000, status: 'upcoming' },
      { title: 'Free Trial Session', description: 'Try out our training program', eventType: 'trial', startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(['all']), maxParticipants: 20, fee: 0, status: 'upcoming' },
      { title: 'Coaching Workshop', description: 'Professional coaching techniques workshop', eventType: 'workshop', startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(['coaches']), maxParticipants: 15, fee: 100000, status: 'upcoming' }
    ];

    for (const event of events) {
      await connection.execute(
        'INSERT INTO academy_events (title, description, eventType, startDate, endDate, ageGroups, maxParticipants, currentParticipants, fee, isPublic, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [event.title, event.description, event.eventType, event.startDate, event.endDate, event.ageGroups, event.maxParticipants, 0, event.fee, true, event.status, userIds[0]]
      );
    }
    console.log(`✅ Created ${events.length} academy events`);
  } else {
    console.log('⏭️  Academy events already exist or no users found');
  }

  // 7. COACH PROFILES
  console.log('\n👨‍🏫 Seeding Coach Profiles...');
  const [existingCoachProfiles] = await connection.execute('SELECT COUNT(*) as count FROM coach_profiles');
  if (existingCoachProfiles[0].count === 0 && coachIds.length > 0) {
    for (const coachId of coachIds.slice(0, 5)) {
      const specializations = ['technical', 'tactical', 'fitness', 'youth_development', 'goalkeeping'];
      const spec = specializations[randomInt(0, specializations.length - 1)];
      await connection.execute(
        'INSERT INTO coach_profiles (userId, title, specialization, qualifications, experience, yearsExperience, bio, isPublic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [coachId, 'Professional Coach', spec, JSON.stringify(['UEFA B License', 'First Aid Certified']), 'Experienced youth football coach with passion for development', randomInt(5, 15), 'Dedicated coach with extensive experience in youth development', true]
      );
    }
    console.log(`✅ Created coach profiles for ${Math.min(5, coachIds.length)} coaches`);
  } else {
    console.log('⏭️  Coach profiles already exist or no coaches found');
  }

  // 8. PLAYER POINTS
  console.log('\n🏆 Seeding Player Points...');
  const [existingPlayerPoints] = await connection.execute('SELECT COUNT(*) as count FROM player_points');
  if (existingPlayerPoints[0].count === 0 && playerIds.length > 0) {
    for (const playerId of playerIds) {
      const totalEarned = randomInt(100, 1000);
      const totalRedeemed = randomInt(0, totalEarned / 2);
      const points = totalEarned - totalRedeemed;
      const level = Math.floor(totalEarned / 200) + 1;
      
      await connection.execute(
        'INSERT INTO player_points (playerId, points, totalEarned, totalRedeemed, level) VALUES (?, ?, ?, ?, ?)',
        [playerId, points, totalEarned, totalRedeemed, level]
      );
    }
    console.log(`✅ Created player points for ${playerIds.length} players`);
  } else {
    console.log('⏭️  Player points already exist');
  }

  // 9. PERFORMANCE METRICS (Sample data for recent dates)
  console.log('\n📊 Seeding Performance Metrics...');
  const [existingMetrics] = await connection.execute('SELECT COUNT(*) as count FROM performance_metrics');
  if (existingMetrics[0].count < 50 && playerIds.length > 0 && userIds.length > 0) {
    const count = Math.min(100, playerIds.length * 2);
    for (let i = 0; i < count; i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const sessionDate = formatDate(randomDate(new Date(2025, 0, 1), new Date()));
      const sessionTypes = ['training', 'match', 'assessment'];
      
      await connection.execute(
        `INSERT INTO performance_metrics (playerId, sessionDate, sessionType, touches, passes, passAccuracy, shots, shotsOnTarget, 
        dribbles, successfulDribbles, distanceCovered, topSpeed, sprints, accelerations, decelerations, 
        possessionWon, possessionLost, interceptions, tackles, technicalScore, physicalScore, tacticalScore, overallScore, recordedBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, sessionDate, sessionTypes[randomInt(0, 2)], randomInt(20, 80), randomInt(10, 50), randomInt(60, 95), 
        randomInt(0, 10), randomInt(0, 5), randomInt(5, 20), randomInt(2, 15), randomInt(3000, 8000), 
        randomInt(250, 350), randomInt(10, 30), randomInt(15, 40), randomInt(15, 40), randomInt(5, 20), 
        randomInt(5, 15), randomInt(2, 10), randomInt(3, 12), randomInt(60, 90), randomInt(60, 90), 
        randomInt(60, 90), randomInt(60, 90), userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created ${count} performance metrics`);
  } else {
    console.log('⏭️  Performance metrics already exist');
  }

  // 10. MENTAL ASSESSMENTS
  console.log('\n🧠 Seeding Mental Assessments...');
  const [existingMental] = await connection.execute('SELECT COUNT(*) as count FROM mental_assessments');
  if (existingMental[0].count < 30 && playerIds.length > 0 && userIds.length > 0) {
    for (let i = 0; i < Math.min(50, playerIds.length); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const assessmentDate = formatDate(randomDate(new Date(2025, 0, 1), new Date()));
      
      await connection.execute(
        `INSERT INTO mental_assessments (playerId, assessmentDate, confidenceLevel, anxietyLevel, motivationLevel, 
        focusLevel, resilienceScore, teamworkScore, leadershipScore, stressLevel, overallMentalScore, assessedBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, assessmentDate, randomInt(4, 9), randomInt(2, 6), randomInt(5, 9), randomInt(5, 9), 
        randomInt(5, 9), randomInt(6, 10), randomInt(4, 8), randomInt(2, 6), randomInt(60, 85), 
        userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created mental assessments`);
  } else {
    console.log('⏭️  Mental assessments already exist');
  }

  // 11. INJURIES (Some players)
  console.log('\n🏥 Seeding Injury Records...');
  const [existingInjuries] = await connection.execute('SELECT COUNT(*) as count FROM injuries');
  if (existingInjuries[0].count < 10 && playerIds.length > 0 && userIds.length > 0) {
    const injuryTypes = ['Sprain', 'Strain', 'Bruise', 'Fracture', 'Concussion'];
    const bodyParts = ['Ankle', 'Knee', 'Hamstring', 'Shoulder', 'Wrist'];
    const severities = ['minor', 'moderate', 'severe'];
    
    for (let i = 0; i < Math.min(15, playerIds.length / 3); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const injuryDate = formatDate(randomDate(new Date(2024, 6, 1), new Date()));
      const expectedRecovery = formatDate(new Date(new Date(injuryDate).getTime() + randomInt(7, 45) * 24 * 60 * 60 * 1000));
      
      await connection.execute(
        `INSERT INTO injuries (playerId, injuryType, bodyPart, severity, injuryDate, expectedRecoveryDate, 
        status, reportedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, injuryTypes[randomInt(0, 4)], bodyParts[randomInt(0, 4)], severities[randomInt(0, 2)], 
        injuryDate, expectedRecovery, randomInt(0, 1) ? 'recovering' : 'recovered', userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created injury records`);
  } else {
    console.log('⏭️  Injury records already exist');
  }

  // 12. ATTENDANCE
  console.log('\n✅ Seeding Attendance Records...');
  const [existingAttendance] = await connection.execute('SELECT COUNT(*) as count FROM attendance');
  if (existingAttendance[0].count < 100 && playerIds.length > 0 && userIds.length > 0) {
    const statuses = ['present', 'absent', 'late', 'excused'];
    for (let i = 0; i < Math.min(200, playerIds.length * 4); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const sessionDate = formatDate(randomDate(new Date(2025, 0, 1), new Date()));
      const status = statuses[randomInt(0, 3)];
      
      await connection.execute(
        `INSERT INTO attendance (playerId, sessionType, sessionDate, status, durationMinutes, recordedBy) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [playerId, 'training', sessionDate, status, status === 'present' ? randomInt(60, 120) : 0, 
        userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created attendance records`);
  } else {
    console.log('⏭️  Attendance records already exist');
  }

  // 13. PLAYER SKILL SCORES
  console.log('\n⭐ Seeding Player Skill Scores...');
  const [existingSkills] = await connection.execute('SELECT COUNT(*) as count FROM player_skill_scores');
  if (existingSkills[0].count < 30 && playerIds.length > 0 && userIds.length > 0) {
    for (const playerId of playerIds.slice(0, Math.min(50, playerIds.length))) {
      const assessmentDate = formatDate(randomDate(new Date(2025, 0, 1), new Date()));
      const technical = randomInt(50, 85);
      const physical = randomInt(50, 85);
      const mental = randomInt(50, 85);
      const defensive = randomInt(40, 80);
      const overall = Math.floor((technical + physical + mental + defensive) / 4);
      
      await connection.execute(
        `INSERT INTO player_skill_scores (playerId, assessmentDate, ballControl, firstTouch, dribbling, passing, 
        shooting, crossing, heading, leftFootScore, rightFootScore, speed, acceleration, agility, stamina, strength, 
        jumping, positioning, vision, composure, decisionMaking, workRate, marking, tackling, interceptions, 
        technicalOverall, physicalOverall, mentalOverall, defensiveOverall, overallRating, potentialRating, assessedBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, assessmentDate, randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), 
        randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(40, 75), randomInt(60, 90), 
        randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), 
        randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), randomInt(50, 85), 
        randomInt(50, 85), randomInt(40, 80), randomInt(40, 80), randomInt(40, 80), technical, physical, 
        mental, defensive, overall, overall + randomInt(5, 15), userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created player skill scores`);
  } else {
    console.log('⏭️  Player skill scores already exist');
  }

  // 14. DEVELOPMENT PLANS
  console.log('\n📈 Seeding Development Plans...');
  const [existingDevPlans] = await connection.execute('SELECT COUNT(*) as count FROM development_plans');
  if (existingDevPlans[0].count < 20 && playerIds.length > 0 && userIds.length > 0) {
    for (let i = 0; i < Math.min(30, playerIds.length); i++) {
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const startDate = formatDate(randomDate(new Date(2025, 0, 1), new Date()));
      const endDate = formatDate(new Date(new Date(startDate).getTime() + 90 * 24 * 60 * 60 * 1000));
      
      await connection.execute(
        `INSERT INTO development_plans (playerId, title, startDate, endDate, status, overallProgress, 
        shortTermGoals, longTermGoals, strengthsAnalysis, areasForImprovement, createdBy) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, 'Q1 2026 Development Plan', startDate, endDate, 'active', randomInt(20, 70), 
        'Improve passing accuracy, increase speed', 'Become a key player in the first team', 
        'Good ball control, strong work ethic', 'Needs to work on shooting accuracy and positioning', 
        userIds[randomInt(0, userIds.length - 1)]]
      );
    }
    console.log(`✅ Created development plans`);
  } else {
    console.log('⏭️  Development plans already exist');
  }

  // 15. ACHIEVEMENTS
  console.log('\n🏅 Seeding Achievements...');
  const [existingAchievements] = await connection.execute('SELECT COUNT(*) as count FROM achievements');
  if (existingAchievements[0].count < 30 && playerIds.length > 0) {
    const achievementTypes = [
      { title: 'First Goal', category: 'milestone', icon: 'goal' },
      { title: '100 Training Sessions', category: 'milestone', icon: 'training' },
      { title: 'Perfect Attendance', category: 'award', icon: 'attendance' },
      { title: 'Most Improved Player', category: 'award', icon: 'trophy' },
      { title: 'Team Captain', category: 'award', icon: 'captain' }
    ];
    
    for (let i = 0; i < Math.min(50, playerIds.length * 1.5); i++) {
      const achievement = achievementTypes[randomInt(0, achievementTypes.length - 1)];
      const playerId = playerIds[randomInt(0, playerIds.length - 1)];
      const achievedDate = formatDate(randomDate(new Date(2024, 0, 1), new Date()));
      
      await connection.execute(
        `INSERT INTO achievements (playerId, title, description, category, achievedDate, iconType) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [playerId, achievement.title, `Earned ${achievement.title}`, achievement.category, achievedDate, achievement.icon]
      );
    }
    console.log(`✅ Created achievements`);
  } else {
    console.log('⏭️  Achievements already exist');
  }

  // 16. LEAGUE STANDINGS
  console.log('\n🏆 Seeding League Standings...');
  const [existingStandings] = await connection.execute('SELECT COUNT(*) as count FROM league_standings');
  if (existingStandings[0].count === 0 && teamIds.length > 0) {
    for (let i = 0; i < teamIds.length; i++) {
      const played = randomInt(10, 25);
      const won = randomInt(0, played);
      const lost = randomInt(0, played - won);
      const drawn = played - won - lost;
      const goalsFor = randomInt(won * 1, won * 3 + drawn);
      const goalsAgainst = randomInt(lost * 1, lost * 3 + drawn);
      const points = won * 3 + drawn;
      
      await connection.execute(
        `INSERT INTO league_standings (teamId, season, leagueName, played, won, drawn, lost, goalsFor, 
        goalsAgainst, goalDifference, points, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamIds[i], '2025-2026', 'Youth League', played, won, drawn, lost, goalsFor, goalsAgainst, 
        goalsFor - goalsAgainst, points, i + 1]
      );
    }
    console.log(`✅ Created league standings`);
  } else {
    console.log('⏭️  League standings already exist');
  }

  // 17. CONTACT INQUIRIES
  console.log('\n📧 Seeding Contact Inquiries...');
  const [existingInquiries] = await connection.execute('SELECT COUNT(*) as count FROM contact_inquiries');
  if (existingInquiries[0].count < 5) {
    const inquiries = [
      { name: 'Ahmed Hassan', email: 'ahmed@example.com', phone: '01234567890', subject: 'Registration Inquiry', message: 'I would like to register my son for the academy' },
      { name: 'Fatma Ali', email: 'fatma@example.com', phone: '01234567891', subject: 'Training Schedule', message: 'What are the training times for U12 team?' },
      { name: 'Mohamed Khaled', email: 'mohamed@example.com', phone: '01234567892', subject: 'Tournament Info', message: 'When is the next tournament?' }
    ];
    
    for (const inquiry of inquiries) {
      await connection.execute(
        `INSERT INTO contact_inquiries (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [inquiry.name, inquiry.email, inquiry.phone, inquiry.subject, inquiry.message, 'new']
      );
    }
    console.log(`✅ Created contact inquiries`);
  } else {
    console.log('⏭️  Contact inquiries already exist');
  }

  // 18. REGISTRATION REQUESTS
  console.log('\n📝 Seeding Registration Requests...');
  const [existingRequests] = await connection.execute('SELECT COUNT(*) as count FROM registration_requests');
  if (existingRequests[0].count < 5) {
    const requests = [
      { parentName: 'Omar Youssef', parentEmail: 'omar@example.com', parentPhone: '01111111111', childName: 'Youssef Omar', childDateOfBirth: '2014-03-15', childAge: 11, preferredPosition: 'midfielder', status: 'pending' },
      { parentName: 'Sara Ahmed', parentEmail: 'sara@example.com', parentPhone: '01222222222', childName: 'Ahmed Ali', childDateOfBirth: '2013-07-22', childAge: 12, preferredPosition: 'forward', status: 'contacted' },
      { parentName: 'Hassan Mohamed', parentEmail: 'hassan@example.com', parentPhone: '01333333333', childName: 'Mohamed Hassan', childDateOfBirth: '2015-11-10', childAge: 10, preferredPosition: 'defender', status: 'trial_scheduled' }
    ];
    
    for (const request of requests) {
      await connection.execute(
        `INSERT INTO registration_requests (parentName, parentEmail, parentPhone, childName, childDateOfBirth, 
        childAge, preferredPosition, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [request.parentName, request.parentEmail, request.parentPhone, request.childName, request.childDateOfBirth, 
        request.childAge, request.preferredPosition, request.status]
      );
    }
    console.log(`✅ Created registration requests`);
  } else {
    console.log('⏭️  Registration requests already exist');
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nSummary:');
  console.log('- Membership plans, rewards, and training drills created');
  console.log('- Training locations and masterclass content added');
  console.log('- Player data populated (points, skills, performance)');
  console.log('- Academy events and coach profiles set up');
  console.log('- Attendance, injuries, and achievements recorded');
  console.log('- League standings and contact inquiries added');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  throw error;
} finally {
  await connection.end();
}
