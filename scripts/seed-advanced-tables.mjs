#!/usr/bin/env node
/**
 * Additional Seed Script for Advanced Tables
 * Fills coaching courses, football laws, and other advanced tables
 * Run with: node scripts/seed-advanced-tables.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting advanced tables seeding...\n');

try {
  // Get existing data
  const [existingUsers] = await connection.execute('SELECT id, role FROM users LIMIT 10');
  const userIds = existingUsers.map(u => u.id);
  const coachIds = existingUsers.filter(u => u.role === 'coach').map(u => u.id);

  console.log(`Found ${userIds.length} users, ${coachIds.length} coaches`);

  // 1. COACHING COURSES
  console.log('\n🎓 Seeding Coaching Courses...');
  const [existingCourses] = await connection.execute('SELECT COUNT(*) as count FROM coaching_courses');
  if (existingCourses[0].count === 0) {
    const courses = [
      {
        title: 'FIFA Grassroots License',
        titleAr: 'رخصة فيفا الجذور',
        description: 'Introduction to coaching youth football',
        descriptionAr: 'مقدمة في تدريب كرة قدم الشباب',
        category: 'fifa_license',
        level: 'grassroots',
        duration: 120,
        isPublished: true
      },
      {
        title: 'UEFA C License',
        titleAr: 'رخصة يويفا سي',
        description: 'Intermediate coaching certification',
        descriptionAr: 'شهادة تدريب متوسطة',
        category: 'fifa_license',
        level: 'c_license',
        duration: 180,
        isPublished: true
      },
      {
        title: 'Laws of the Game',
        titleAr: 'قوانين اللعبة',
        description: 'Comprehensive guide to football rules',
        descriptionAr: 'دليل شامل لقواعد كرة القدم',
        category: 'laws_of_game',
        level: 'beginner',
        duration: 90,
        isPublished: true
      },
      {
        title: 'Tactical Analysis',
        titleAr: 'التحليل التكتيكي',
        description: 'Advanced tactical concepts',
        descriptionAr: 'مفاهيم تكتيكية متقدمة',
        category: 'tactics',
        level: 'advanced',
        duration: 150,
        isPublished: true
      },
      {
        title: 'Youth Development',
        titleAr: 'تطوير الشباب',
        description: 'Principles of youth player development',
        descriptionAr: 'مبادئ تطوير اللاعبين الشباب',
        category: 'youth_development',
        level: 'intermediate',
        duration: 120,
        isPublished: true
      }
    ];

    const courseIds = [];
    for (const course of courses) {
      const [result] = await connection.execute(
        `INSERT INTO coaching_courses (title, titleAr, description, descriptionAr, category, level, duration, isPublished, \`order\`) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [course.title, course.titleAr, course.description, course.descriptionAr, course.category, course.level, course.duration, course.isPublished, 0]
      );
      courseIds.push(result.insertId);
    }
    console.log(`✅ Created ${courses.length} coaching courses`);

    // Create modules for first course
    if (courseIds.length > 0) {
      const modules = [
        { courseId: courseIds[0], title: 'Introduction to Coaching', titleAr: 'مقدمة في التدريب', order: 1 },
        { courseId: courseIds[0], title: 'Basic Drills and Exercises', titleAr: 'التمارين الأساسية', order: 2 },
        { courseId: courseIds[0], title: 'Player Safety', titleAr: 'سلامة اللاعبين', order: 3 },
      ];

      for (const module of modules) {
        await connection.execute(
          `INSERT INTO course_modules (courseId, title, titleAr, \`order\`) VALUES (?, ?, ?, ?)`,
          [module.courseId, module.title, module.titleAr, module.order]
        );
      }
      console.log(`✅ Created ${modules.length} course modules`);
    }
  } else {
    console.log('⏭️  Coaching courses already exist');
  }

  // 2. FOOTBALL LAWS
  console.log('\n📖 Seeding Football Laws...');
  const [existingLaws] = await connection.execute('SELECT COUNT(*) as count FROM football_laws');
  if (existingLaws[0].count === 0) {
    const laws = [
      {
        lawNumber: 1,
        title: 'The Field of Play',
        titleAr: 'ملعب اللعب',
        content: 'The field of play must be rectangular...',
        contentAr: 'يجب أن يكون ملعب اللعب مستطيلاً...',
        summary: 'Requirements for the playing field',
        summaryAr: 'متطلبات ملعب اللعب'
      },
      {
        lawNumber: 2,
        title: 'The Ball',
        titleAr: 'الكرة',
        content: 'The ball must be spherical...',
        contentAr: 'يجب أن تكون الكرة كروية...',
        summary: 'Specifications for the match ball',
        summaryAr: 'مواصفات كرة المباراة'
      },
      {
        lawNumber: 3,
        title: 'The Players',
        titleAr: 'اللاعبون',
        content: 'A match is played by two teams...',
        contentAr: 'يتم لعب المباراة بين فريقين...',
        summary: 'Number of players and substitutions',
        summaryAr: 'عدد اللاعبين والاستبدالات'
      },
      {
        lawNumber: 4,
        title: 'Players Equipment',
        titleAr: 'معدات اللاعبين',
        content: 'Players must wear proper equipment...',
        contentAr: 'يجب على اللاعبين ارتداء المعدات المناسبة...',
        summary: 'Required player equipment and safety',
        summaryAr: 'المعدات المطلوبة للاعبين والسلامة'
      },
      {
        lawNumber: 5,
        title: 'The Referee',
        titleAr: 'الحكم',
        content: 'Each match is controlled by a referee...',
        contentAr: 'يتم التحكم في كل مباراة بواسطة حكم...',
        summary: 'Authority and duties of the referee',
        summaryAr: 'سلطة وواجبات الحكم'
      }
    ];

    for (const law of laws) {
      await connection.execute(
        `INSERT INTO football_laws (lawNumber, title, titleAr, content, contentAr, summary, summaryAr, \`order\`) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [law.lawNumber, law.title, law.titleAr, law.content, law.contentAr, law.summary, law.summaryAr, law.lawNumber]
      );
    }
    console.log(`✅ Created ${laws.length} football laws`);
  } else {
    console.log('⏭️  Football laws already exist');
  }

  // 3. COACH AVAILABILITY
  console.log('\n📅 Seeding Coach Availability...');
  const [existingAvailability] = await connection.execute('SELECT COUNT(*) as count FROM coach_availability');
  if (existingAvailability[0].count === 0 && coachIds.length > 0) {
    for (const coachId of coachIds.slice(0, 3)) {
      // Add availability for weekdays
      for (let day = 1; day <= 5; day++) {
        await connection.execute(
          `INSERT INTO coach_availability (coachId, dayOfWeek, startTime, endTime, isAvailable, sessionType) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [coachId, day, '09:00', '17:00', true, 'all']
        );
      }
    }
    console.log(`✅ Created coach availability schedules`);
  } else {
    console.log('⏭️  Coach availability already exists');
  }

  // 4. NOTIFICATIONS
  console.log('\n🔔 Seeding Notifications...');
  const [existingNotifications] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
  if (existingNotifications[0].count < 10 && userIds.length > 0) {
    const notificationTemplates = [
      { title: 'Welcome to the Academy!', message: 'Welcome to our football academy. Start your journey today!', type: 'success', category: 'general' },
      { title: 'Training Session Tomorrow', message: 'You have a training session scheduled for tomorrow at 4 PM', type: 'info', category: 'training' },
      { title: 'Performance Report Available', message: 'Your latest performance report is ready to view', type: 'info', category: 'performance' },
      { title: 'New Achievement Unlocked!', message: 'Congratulations! You earned the "100 Training Sessions" badge', type: 'success', category: 'achievement' }
    ];

    for (let i = 0; i < Math.min(20, userIds.length * 2); i++) {
      const template = notificationTemplates[i % notificationTemplates.length];
      const userId = userIds[i % userIds.length];
      
      await connection.execute(
        `INSERT INTO notifications (userId, title, message, type, category, isRead) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, template.title, template.message, template.type, template.category, Math.random() > 0.5]
      );
    }
    console.log(`✅ Created notifications`);
  } else {
    console.log('⏭️  Notifications already exist');
  }

  // 5. COACH FEEDBACK
  console.log('\n💬 Seeding Coach Feedback...');
  const [existingFeedback] = await connection.execute('SELECT COUNT(*) as count FROM coach_feedback');
  const [players] = await connection.execute('SELECT id FROM players LIMIT 30');
  if (existingFeedback[0].count < 20 && players.length > 0 && coachIds.length > 0) {
    for (let i = 0; i < Math.min(30, players.length); i++) {
      const playerId = players[i % players.length].id;
      const coachId = coachIds[i % coachIds.length];
      const categories = ['technical', 'physical', 'mental', 'tactical', 'general'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      await connection.execute(
        `INSERT INTO coach_feedback (playerId, coachId, feedbackDate, category, rating, strengths, areasToImprove, isVisibleToParent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, coachId, new Date().toISOString().split('T')[0], category, Math.floor(Math.random() * 2) + 4, 
        'Good ball control, strong positioning', 'Needs to improve passing accuracy', true]
      );
    }
    console.log(`✅ Created coach feedback`);
  } else {
    console.log('⏭️  Coach feedback already exists or insufficient data');
  }

  // 6. MEAL PLANS
  console.log('\n🍽️ Seeding Meal Plans...');
  const [existingMeals] = await connection.execute('SELECT COUNT(*) as count FROM meal_plans');
  if (existingMeals[0].count < 20 && players.length > 0 && userIds.length > 0) {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_training', 'post_training'];
    for (let i = 0; i < Math.min(30, players.length * 1.5); i++) {
      const playerId = players[Math.floor(Math.random() * players.length)].id;
      const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
      
      await connection.execute(
        `INSERT INTO meal_plans (playerId, title, planDate, mealType, calories, protein, carbs, fats, hydrationMl, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Plan`, 
        new Date().toISOString().split('T')[0], mealType, 
        Math.floor(Math.random() * 500) + 300, Math.floor(Math.random() * 40) + 20, 
        Math.floor(Math.random() * 60) + 30, Math.floor(Math.random() * 20) + 10, 
        Math.floor(Math.random() * 500) + 500, userIds[Math.floor(Math.random() * userIds.length)]]
      );
    }
    console.log(`✅ Created meal plans`);
  } else {
    console.log('⏭️  Meal plans already exist or insufficient data');
  }

  // 7. WORKOUT PLANS
  console.log('\n💪 Seeding Workout Plans...');
  const [existingWorkouts] = await connection.execute('SELECT COUNT(*) as count FROM workout_plans');
  if (existingWorkouts[0].count < 20 && players.length > 0 && userIds.length > 0) {
    const categories = ['strength', 'endurance', 'agility', 'flexibility', 'recovery', 'match_prep'];
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    
    for (let i = 0; i < Math.min(30, players.length); i++) {
      const playerId = players[Math.floor(Math.random() * players.length)].id;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      
      await connection.execute(
        `INSERT INTO workout_plans (playerId, title, description, category, difficulty, durationMinutes, scheduledDate, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [playerId, `${category.charAt(0).toUpperCase() + category.slice(1)} Training`, 
        `${difficulty} level ${category} workout plan`, category, difficulty, 
        Math.floor(Math.random() * 60) + 30, new Date().toISOString().split('T')[0], 
        userIds[Math.floor(Math.random() * userIds.length)]]
      );
    }
    console.log(`✅ Created workout plans`);
  } else {
    console.log('⏭️  Workout plans already exist or insufficient data');
  }

  // 8. POINTS TRANSACTIONS
  console.log('\n🏆 Seeding Points Transactions...');
  const [existingTransactions] = await connection.execute('SELECT COUNT(*) as count FROM points_transactions');
  if (existingTransactions[0].count < 50 && players.length > 0 && userIds.length > 0) {
    const types = ['attendance', 'performance', 'improvement', 'bonus', 'achievement'];
    
    for (let i = 0; i < Math.min(100, players.length * 3); i++) {
      const playerId = players[Math.floor(Math.random() * players.length)].id;
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 50) + 10;
      
      await connection.execute(
        `INSERT INTO points_transactions (playerId, amount, type, description, awardedBy) 
         VALUES (?, ?, ?, ?, ?)`,
        [playerId, amount, type, `Earned ${amount} points for ${type}`, 
        userIds[Math.floor(Math.random() * userIds.length)]]
      );
    }
    console.log(`✅ Created points transactions`);
  } else {
    console.log('⏭️  Points transactions already exist or insufficient data');
  }

  // 9. WEEKLY TARGETS
  console.log('\n🎯 Seeding Weekly Targets...');
  const [existingTargets] = await connection.execute('SELECT COUNT(*) as count FROM weekly_targets');
  if (existingTargets[0].count < 30 && players.length > 0) {
    const targetTypes = ['speed_actions', 'ball_touches', 'training_hours', 'goals', 'assists'];
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    
    for (let i = 0; i < Math.min(50, players.length * 2); i++) {
      const playerId = players[Math.floor(Math.random() * players.length)].id;
      const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
      const targetValue = Math.floor(Math.random() * 100) + 50;
      const currentValue = Math.floor(Math.random() * targetValue);
      
      await connection.execute(
        `INSERT INTO weekly_targets (playerId, weekStartDate, targetType, targetValue, currentValue, isCompleted) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [playerId, weekStart.toISOString().split('T')[0], targetType, targetValue, currentValue, currentValue >= targetValue]
      );
    }
    console.log(`✅ Created weekly targets`);
  } else {
    console.log('⏭️  Weekly targets already exist or insufficient data');
  }

  // 10. OPPONENTS
  console.log('\n⚔️ Seeding Opponents...');
  const [existingOpponents] = await connection.execute('SELECT COUNT(*) as count FROM opponents');
  if (existingOpponents[0].count < 5 && userIds.length > 0) {
    const opponents = [
      { name: 'Cairo Youth FC', league: 'Youth League', formation: '4-4-2', playingStyle: 'Possession-based football with emphasis on wing play' },
      { name: 'Alexandria United', league: 'Youth League', formation: '4-3-3', playingStyle: 'High-pressing and quick counter-attacks' },
      { name: 'Giza Academy', league: 'Youth League', formation: '3-5-2', playingStyle: 'Defensive solidity with long ball tactics' },
      { name: 'Delta Stars', league: 'Youth League', formation: '4-2-3-1', playingStyle: 'Attacking through the middle with creative midfielders' },
      { name: 'Red Sea Dolphins', league: 'Youth League', formation: '4-1-4-1', playingStyle: 'Balanced approach with strong defensive midfield' }
    ];
    
    for (const opponent of opponents) {
      await connection.execute(
        `INSERT INTO opponents (name, league, typicalFormation, playingStyle, strengths, weaknesses, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [opponent.name, opponent.league, opponent.formation, opponent.playingStyle, 
        JSON.stringify(['Strong midfield', 'Good passing']), 
        JSON.stringify(['Weak defense on set pieces', 'Slow transitions']), 
        userIds[0]]
      );
    }
    console.log(`✅ Created ${opponents.length} opponents`);
  } else {
    console.log('⏭️  Opponents already exist or insufficient data');
  }

  console.log('\n✅ Advanced tables seeding completed successfully!');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  throw error;
} finally {
  await connection.end();
}
