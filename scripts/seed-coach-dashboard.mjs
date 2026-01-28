#!/usr/bin/env node
/**
 * Seed Coach Dashboard Data
 * Fills tables needed for the Coach Dashboard (enrollments, attempts, certificates, badges)
 * Run with: node scripts/seed-coach-dashboard.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting Coach Dashboard data seeding...\n');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

try {
  // Get existing users
  const [existingUsers] = await connection.execute('SELECT id, role, name, email FROM users LIMIT 20');
  const userIds = existingUsers.map(u => u.id);
  
  console.log(`Found ${userIds.length} users`);

  if (userIds.length === 0) {
    console.log('❌ No users found. Please seed users first.');
    process.exit(1);
  }

  // Check and seed quiz questions if needed
  console.log('\n📝 Checking Quiz Questions...');
  const [existingQuestions] = await connection.execute('SELECT COUNT(*) as count FROM quiz_questions');
  if (existingQuestions[0].count === 0) {
    console.log('Creating quiz questions...');
    const questions = [
      // Course 1 - Grassroots
      { courseId: 1, question: 'What is the primary focus of grassroots football?', optionA: 'Winning at all costs', optionB: 'Player development and fun', optionC: 'Professional tactics', optionD: 'Physical conditioning', correctAnswer: 'B', explanation: 'Grassroots football focuses on player development and enjoyment of the game.' },
      { courseId: 1, question: 'What age group is typically considered grassroots level?', optionA: '18-25 years', optionB: '4-12 years', optionC: '13-17 years', optionD: 'All ages', correctAnswer: 'B', explanation: 'Grassroots typically covers ages 4-12, focusing on fundamental skills and enjoyment.' },
      { courseId: 1, question: 'How should a grassroots coach handle mistakes?', optionA: 'Punish the player', optionB: 'Ignore them completely', optionC: 'Use them as learning opportunities', optionD: 'Remove the player from training', correctAnswer: 'C', explanation: 'Mistakes are valuable learning opportunities at the grassroots level.' },
      
      // Course 2 - C License
      { courseId: 2, question: 'What is the 4-3-3 formation best known for?', optionA: 'Defensive stability', optionB: 'Width in attack with wingers', optionC: 'Physical dominance', optionD: 'Counter-attacking only', correctAnswer: 'B', explanation: 'The 4-3-3 provides attacking width through wingers while maintaining midfield control.' },
      { courseId: 2, question: 'What is the offside rule in football?', optionA: 'Player cannot be in opponent half', optionB: 'Player must stay behind the ball', optionC: 'Player is offside if ahead of second-last opponent when ball is played', optionD: 'Player cannot enter the box early', correctAnswer: 'C', explanation: 'A player is offside if nearer to the goal line than both ball and second-last opponent when ball is played to them.' },
      { courseId: 2, question: 'What is pressing in football?', optionA: 'Physical contact', optionB: 'Winning ball back quickly with pressure', optionC: 'Defending deep', optionD: 'Time wasting', correctAnswer: 'B', explanation: 'Pressing involves applying pressure to regain possession quickly after losing it.' },
      
      // Course 3 - B License
      { courseId: 3, question: 'What is the role of a defensive midfielder in 4-2-3-1?', optionA: 'Score goals', optionB: 'Shield defense and distribute play', optionC: 'Mark wingers', optionD: 'Take set pieces', correctAnswer: 'B', explanation: 'The DM shields the back four and links defense to attack through distribution.' },
      { courseId: 3, question: 'How should periodization be structured in football?', optionA: 'Same intensity all season', optionB: 'Phases of preparation, competition, and recovery', optionC: 'Rest completely between matches', optionD: 'Maximum intensity always', correctAnswer: 'B', explanation: 'Periodization divides the season into preparation, competition, and recovery phases.' },
      { courseId: 3, question: 'What is tactical periodization?', optionA: 'Only working on tactics', optionB: 'Integrating all training components around tactical objectives', optionC: 'Ignoring physical preparation', optionD: 'Focusing on set pieces only', correctAnswer: 'B', explanation: 'Tactical periodization integrates technical, physical, and psychological aspects around the game model.' },
      
      // Course 4 - A License
      { courseId: 4, question: 'What is man-marking vs zonal marking?', optionA: 'Same defensive system', optionB: 'Man-marking follows players, zonal covers areas', optionC: 'Only used in corners', optionD: 'Offensive tactics', correctAnswer: 'B', explanation: 'Man-marking assigns defenders to specific opponents while zonal covers designated areas.' },
      { courseId: 4, question: 'What is gegenpressing?', optionA: 'Slow build-up play', optionB: 'Immediate counter-pressing after losing ball', optionC: 'Parking the bus', optionD: 'Long ball tactics', correctAnswer: 'B', explanation: 'Gegenpressing involves immediate collective pressing to regain possession right after losing it.' },
      { courseId: 4, question: 'How do you develop a team playing philosophy?', optionA: 'Copy other successful teams', optionB: 'Define principles, train consistently, adapt to players', optionC: 'Change tactics every match', optionD: 'Let players decide', correctAnswer: 'B', explanation: 'Philosophy is developed by defining clear principles, consistent training, and adapting to available players.' },
      
      // Course 5 - Pro License
      { courseId: 5, question: 'What is squad rotation management?', optionA: 'Playing the same XI always', optionB: 'Strategic player selection based on fixtures and fitness', optionC: 'Random team selection', optionD: 'Only using substitutes', correctAnswer: 'B', explanation: 'Rotation involves strategic selection considering fixture congestion, player fitness, and competition.' },
      { courseId: 5, question: 'How should a coach manage player psychology at elite level?', optionA: 'Ignore mental aspects', optionB: 'Individual and team psychological support', optionC: 'Focus only on tactics', optionD: 'Motivate through fear', correctAnswer: 'B', explanation: 'Elite coaching requires attention to both individual psychological needs and team dynamics.' },
      { courseId: 5, question: 'What is the role of data analytics in modern football?', optionA: 'Not important', optionB: 'Inform decisions on tactics, recruitment, and performance', optionC: 'Replace coaching', optionD: 'Only for marketing', correctAnswer: 'B', explanation: 'Data analytics supports decision-making in tactics, player recruitment, and performance analysis.' }
    ];

    for (const q of questions) {
      await connection.execute(
        `INSERT INTO quiz_questions (courseId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.courseId, q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer, q.explanation]
      );
    }
    console.log(`✅ Created ${questions.length} quiz questions`);
  } else {
    console.log(`⏭️  Quiz questions already exist (${existingQuestions[0].count})`);
  }

  // Seed badges table
  console.log('\n🏅 Checking Badges...');
  const [existingBadges] = await connection.execute('SELECT COUNT(*) as count FROM badges');
  if (existingBadges[0].count === 0) {
    console.log('Creating badges...');
    const badges = [
      { name: 'First Quiz', description: 'Completed your first quiz', icon: 'trophy', category: 'completion', criteria: JSON.stringify({ type: 'quiz_count', value: 1 }) },
      { name: 'Quiz Master', description: 'Completed 5 quizzes', icon: 'award', category: 'milestone', criteria: JSON.stringify({ type: 'quiz_count', value: 5 }) },
      { name: 'Perfect Score', description: 'Achieved 100% on a quiz', icon: 'star', category: 'excellence', criteria: JSON.stringify({ type: 'perfect_score', value: 100 }) },
      { name: 'Dedicated Learner', description: 'Completed 10 quizzes', icon: 'book', category: 'mastery', criteria: JSON.stringify({ type: 'quiz_count', value: 10 }) },
      { name: 'Grassroots Graduate', description: 'Completed Grassroots course', icon: 'graduation-cap', category: 'education', criteria: JSON.stringify({ type: 'course_completion', courseId: 1 }) },
      { name: 'Licensed Coach', description: 'Earned a coaching license', icon: 'badge-check', category: 'education', criteria: JSON.stringify({ type: 'certificate_earned', value: 1 }) },
      { name: 'Top Scorer', description: 'Scored above 90% on 3 quizzes', icon: 'medal', category: 'performance', criteria: JSON.stringify({ type: 'high_score_count', value: 3, threshold: 90 }) },
      { name: 'Quick Learner', description: 'Passed a quiz on first attempt', icon: 'zap', category: 'excellence', criteria: JSON.stringify({ type: 'first_attempt_pass', value: 1 }) }
    ];

    for (const badge of badges) {
      await connection.execute(
        `INSERT INTO badges (name, description, icon, category, criteria) VALUES (?, ?, ?, ?, ?)`,
        [badge.name, badge.description, badge.icon, badge.category, badge.criteria]
      );
    }
    console.log(`✅ Created ${badges.length} badges`);
  } else {
    console.log(`⏭️  Badges already exist (${existingBadges[0].count})`);
  }

  // Seed course enrollments
  console.log('\n📚 Seeding Course Enrollments...');
  const [existingEnrollments] = await connection.execute('SELECT COUNT(*) as count FROM course_enrollments');
  
  // Get coaching courses from database
  const [dbCourses] = await connection.execute('SELECT id FROM coaching_courses LIMIT 5');
  const courseIds = dbCourses.length > 0 ? dbCourses.map(c => c.id) : [1, 2, 3, 4, 5];
  
  if (existingEnrollments[0].count < 10) {
    console.log('Creating course enrollments...');
    
    for (const userId of userIds) {
      // Enroll each user in 1-3 random courses
      const numCourses = randomInt(1, Math.min(3, courseIds.length));
      const shuffledCourses = [...courseIds].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < numCourses; i++) {
        const courseId = shuffledCourses[i];
        const isCompleted = Math.random() > 0.4; // 60% chance of being completed
        const progress = isCompleted ? 100 : randomInt(10, 90);
        const completedAt = isCompleted ? new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000) : null;
        const certificateUrl = isCompleted ? `https://academy.futurestarsfc.com/certificates/${userId}-course-${courseId}.pdf` : null;
        
        try {
          await connection.execute(
            `INSERT INTO course_enrollments (userId, courseId, progress, completedAt, certificateUrl, enrolledAt) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [userId, courseId, progress, completedAt, certificateUrl]
          );
        } catch (e) {
          // Ignore duplicate enrollments
          if (!e.message.includes('Duplicate')) throw e;
        }
      }
    }
    console.log(`✅ Created course enrollments for ${userIds.length} users`);
  } else {
    console.log(`⏭️  Course enrollments already exist (${existingEnrollments[0].count})`);
  }

  // Seed quiz attempts
  console.log('\n📝 Seeding Quiz Attempts...');
  const [existingAttempts] = await connection.execute('SELECT COUNT(*) as count FROM quiz_attempts');
  if (existingAttempts[0].count < 20) {
    console.log('Creating quiz attempts...');
    
    for (const userId of userIds) {
      // Create 2-5 quiz attempts per user
      const numAttempts = randomInt(2, 5);
      
      for (let i = 0; i < numAttempts; i++) {
        const courseId = courseIds[randomInt(0, courseIds.length - 1)];
        const score = randomInt(50, 100);
        const passed = score >= 70;
        const answers = JSON.stringify([
          { questionId: 1, answer: randomInt(0, 3), correct: Math.random() > 0.3 },
          { questionId: 2, answer: randomInt(0, 3), correct: Math.random() > 0.3 },
          { questionId: 3, answer: randomInt(0, 3), correct: Math.random() > 0.3 }
        ]);
        
        await connection.execute(
          `INSERT INTO quiz_attempts (userId, courseId, score, answers, passed, attemptedAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, courseId, score, answers, passed, new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000)]
        );
      }
    }
    console.log(`✅ Created quiz attempts for ${userIds.length} users`);
  } else {
    console.log(`⏭️  Quiz attempts already exist (${existingAttempts[0].count})`);
  }

  // Seed user badges
  console.log('\n🏅 Seeding User Badges...');
  const [existingUserBadges] = await connection.execute('SELECT COUNT(*) as count FROM user_badges');
  if (existingUserBadges[0].count < 10) {
    console.log('Creating user badges...');
    
    // Get badge IDs
    const [badgeRows] = await connection.execute('SELECT id FROM badges LIMIT 8');
    const badgeIds = badgeRows.map(b => b.id);
    
    if (badgeIds.length > 0) {
      for (const userId of userIds) {
        // Award 1-4 random badges to each user
        const numBadges = randomInt(1, Math.min(4, badgeIds.length));
        const shuffledBadges = [...badgeIds].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < numBadges; i++) {
          const badgeId = shuffledBadges[i];
          const progress = randomInt(70, 100);
          
          try {
            await connection.execute(
              `INSERT INTO user_badges (user_id, badge_id, earned_at, progress) 
               VALUES (?, ?, ?, ?)`,
              [userId, badgeId, new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000), progress]
            );
          } catch (e) {
            // Ignore duplicates
            if (!e.message.includes('Duplicate')) throw e;
          }
        }
      }
      console.log(`✅ Awarded badges to ${userIds.length} users`);
    } else {
      console.log('⚠️  No badges found to award');
    }
  } else {
    console.log(`⏭️  User badges already exist (${existingUserBadges[0].count})`);
  }

  // Seed coach certificates
  console.log('\n🎓 Seeding Coach Certificates...');
  const [existingCerts] = await connection.execute('SELECT COUNT(*) as count FROM coach_certificates');
  if (existingCerts[0].count < 5) {
    console.log('Creating coach certificates...');
    
    // Get quiz attempts that passed
    const [passedAttempts] = await connection.execute(
      'SELECT id, userId, courseId, score FROM quiz_attempts WHERE passed = 1 LIMIT 20'
    );
    
    for (const attempt of passedAttempts) {
      const certNumber = `CERT-${Date.now()}-${attempt.userId}-${attempt.courseId}`;
      const verificationCode = `VER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const levels = ['grassroots', 'c_license', 'b_license', 'a_license', 'pro_license'];
      const level = levels[Math.min(attempt.courseId - 1, levels.length - 1)] || 'grassroots';
      
      try {
        await connection.execute(
          `INSERT INTO coach_certificates (userId, courseId, quizAttemptId, certificateNumber, certificateUrl, level, score, verificationCode, issuedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [attempt.userId, attempt.courseId, attempt.id, certNumber, 
           `https://academy.futurestarsfc.com/certificates/${certNumber}.pdf`,
           level, attempt.score, verificationCode]
        );
      } catch (e) {
        // Ignore duplicates
        if (!e.message.includes('Duplicate')) throw e;
      }
    }
    console.log(`✅ Created certificates from ${passedAttempts.length} passed attempts`);
  } else {
    console.log(`⏭️  Coach certificates already exist (${existingCerts[0].count})`);
  }

  console.log('\n✅ Coach Dashboard data seeding completed!');
  console.log('\nSummary:');
  console.log('- Quiz questions created for all courses');
  console.log('- Badges system populated');
  console.log('- Course enrollments with progress');
  console.log('- Quiz attempts with scores');
  console.log('- User badges awarded');
  console.log('- Coach certificates issued');

} catch (error) {
  console.error('❌ Error seeding database:', error);
  throw error;
} finally {
  await connection.end();
}
