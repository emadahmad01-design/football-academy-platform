#!/usr/bin/env node
/**
 * Seed Players and Link to Parents
 * Creates sample players and links them to parent users
 * Run with: node scripts/seed-players.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🌱 Seeding players...\n');

try {
  // Check existing users
  const [users] = await connection.execute(
    'SELECT id, name, email, role FROM users LIMIT 20'
  );
  
  console.log('Existing users:');
  console.table(users);

  // Get or create parent users
  let parentIds = users.filter(u => u.role === 'parent').map(u => u.id);
  
  if (parentIds.length === 0) {
    console.log('\n📝 Creating parent users...');
    const parentUsers = [
      {
        openId: 'parent-001',
        name: 'Ahmed Mohamed',
        email: 'ahmed.parent@example.com',
        role: 'parent',
      },
      {
        openId: 'parent-002',
        name: 'Fatma Hassan',
        email: 'fatma.parent@example.com',
        role: 'parent',
      },
      {
        openId: 'parent-003',
        name: 'Mahmoud Ali',
        email: 'mahmoud.parent@example.com',
        role: 'parent',
      },
    ];

    for (const user of parentUsers) {
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE openId = ?',
        [user.openId]
      );
      
      if (existing.length > 0) {
        parentIds.push(existing[0].id);
        console.log(`  ✓ Parent ${user.name} already exists (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.execute(
          'INSERT INTO users (openId, name, email, role) VALUES (?, ?, ?, ?)',
          [user.openId, user.name, user.email, user.role]
        );
        parentIds.push(result.insertId);
        console.log(`  ✓ Created parent ${user.name} (ID: ${result.insertId})`);
      }
    }
  }

  // Create sample players
  const samplePlayers = [
    {
      firstName: 'Omar',
      lastName: 'Ahmed',
      dateOfBirth: '2012-05-15',
      position: 'midfielder',
      preferredFoot: 'right',
      height: 145,
      weight: 40,
      jerseyNumber: 10,
    },
    {
      firstName: 'Youssef',
      lastName: 'Mohamed',
      dateOfBirth: '2013-08-22',
      position: 'forward',
      preferredFoot: 'left',
      height: 150,
      weight: 42,
      jerseyNumber: 9,
    },
    {
      firstName: 'Ali',
      lastName: 'Hassan',
      dateOfBirth: '2011-03-10',
      position: 'defender',
      preferredFoot: 'right',
      height: 155,
      weight: 48,
      jerseyNumber: 4,
    },
    {
      firstName: 'Nour',
      lastName: 'Khaled',
      dateOfBirth: '2012-11-30',
      position: 'goalkeeper',
      preferredFoot: 'right',
      height: 152,
      weight: 45,
      jerseyNumber: 1,
    },
    {
      firstName: 'Ziad',
      lastName: 'Ibrahim',
      dateOfBirth: '2013-06-18',
      position: 'midfielder',
      preferredFoot: 'both',
      height: 148,
      weight: 41,
      jerseyNumber: 8,
    },
    {
      firstName: 'Mariam',
      lastName: 'Ali',
      dateOfBirth: '2012-09-05',
      position: 'forward',
      preferredFoot: 'right',
      height: 142,
      weight: 38,
      jerseyNumber: 7,
    },
  ];

  console.log('\n👦 Creating players...');
  const playerIds = [];
  
  for (const player of samplePlayers) {
    const [result] = await connection.execute(
      `INSERT INTO players 
       (firstName, lastName, dateOfBirth, position, preferredFoot, height, weight, jerseyNumber) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [player.firstName, player.lastName, player.dateOfBirth, player.position, 
       player.preferredFoot, player.height, player.weight, player.jerseyNumber]
    );
    playerIds.push(result.insertId);
    console.log(`  ✓ Created player ${player.firstName} ${player.lastName} (ID: ${result.insertId})`);
  }

  // Link players to parents
  console.log('\n🔗 Linking players to parents...');
  for (let i = 0; i < playerIds.length; i++) {
    const playerId = playerIds[i];
    const parentId = parentIds[i % parentIds.length]; // Distribute players among parents
    
    try {
      await connection.execute(
        'INSERT INTO parent_player_relations (parentUserId, playerId) VALUES (?, ?)',
        [parentId, playerId]
      );
      console.log(`  ✓ Linked player ID ${playerId} to parent ID ${parentId}`);
    } catch (e) {
      console.log(`  ⚠ Relation may already exist`);
    }
  }

  // Show final summary
  console.log('\n📊 Summary:');
  const [playerCount] = await connection.execute('SELECT COUNT(*) as count FROM players');
  const [relationCount] = await connection.execute('SELECT COUNT(*) as count FROM parent_player_relations');
  console.log(`  - Total players: ${playerCount[0].count}`);
  console.log(`  - Total parent-player relations: ${relationCount[0].count}`);

  console.log('\n✅ Successfully seeded players!');
  
  await connection.end();
  process.exit(0);

} catch (error) {
  console.error('❌ Error seeding data:', error);
  await connection.end();
  process.exit(1);
}
