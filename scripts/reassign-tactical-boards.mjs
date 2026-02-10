import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all users
const [users] = await conn.execute('SELECT id, email FROM users');
console.log(`Found ${users.length} users in the database:\n`);
users.forEach(u => console.log(`  - User ID ${u.id}: ${u.email}`));

const targetUserId = users.length > 1 ? users[1].id : users[0].id; // Use second user if exists, otherwise first
console.log(`\nAssigning tactical boards to User ID: ${targetUserId}`);

// Check if tactical boards already exist
const [existing] = await conn.execute('SELECT COUNT(*) as count FROM tactical_boards WHERE createdBy = ?', [targetUserId]);
if (existing[0].count > 0) {
  console.log(`\n✅ User already has ${existing[0].count} tactical boards.`);
  await conn.end();
  process.exit(0);
}

// If no boards for this user, reassign the seeded ones or create new
const [allBoards] = await conn.execute('SELECT id, name, createdBy FROM tactical_boards');
if (allBoards.length > 0) {
  console.log(`\nReassigning ${allBoards.length} existing tactical boards to user ${targetUserId}...`);
  await conn.execute('UPDATE tactical_boards SET createdBy = ?', [targetUserId]);
  console.log(`✅ Reassigned all tactical boards!`);
} else {
  console.log('\nNo tactical boards found. Please run seed-tactical-boards.mjs first.');
}

await conn.end();
