#!/usr/bin/env node
/**
 * Fix Team Types
 * Updates existing teams to have proper teamType (main/academy)
 * Run with: node scripts/fix-team-types.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔧 Fixing team types...\n');

try {
  // Check current teams
  const [teams] = await connection.execute('SELECT id, name, ageGroup, teamType FROM teams');
  
  console.log(`Found ${teams.length} teams:\n`);
  teams.forEach(team => {
    console.log(`  - ${team.name} (${team.ageGroup}) - Type: ${team.teamType || 'NULL'}`);
  });

  // Update teams to have proper types
  // Typically U17-U21 and Senior teams are "main" teams
  // U9-U15 are "academy" teams
  console.log('\n📝 Updating team types...\n');

  for (const team of teams) {
    let teamType = 'academy';
    
    // Assign "main" type to older age groups
    if (team.ageGroup && (
      team.ageGroup.includes('U17') || 
      team.ageGroup.includes('U18') ||
      team.ageGroup.includes('U19') || 
      team.ageGroup.includes('U21') ||
      team.ageGroup.includes('Senior') ||
      team.name.toLowerCase().includes('first') ||
      team.name.toLowerCase().includes('main')
    )) {
      teamType = 'main';
    }

    await connection.execute(
      'UPDATE teams SET teamType = ? WHERE id = ?',
      [teamType, team.id]
    );
    
    console.log(`  ✅ ${team.name} → ${teamType}`);
  }

  // Show updated teams
  console.log('\n📊 Updated teams:\n');
  const [updatedTeams] = await connection.execute(
    'SELECT teamType, COUNT(*) as count FROM teams GROUP BY teamType'
  );
  
  updatedTeams.forEach(row => {
    console.log(`  ${row.teamType}: ${row.count} teams`);
  });

  // Create at least one team of each type if missing
  const mainTeamCount = updatedTeams.find(t => t.teamType === 'main')?.count || 0;
  const academyTeamCount = updatedTeams.find(t => t.teamType === 'academy')?.count || 0;

  if (mainTeamCount === 0) {
    console.log('\n⚠️  No main teams found. Creating sample main team...');
    await connection.execute(
      'INSERT INTO teams (name, ageGroup, teamType, description) VALUES (?, ?, ?, ?)',
      ['First Team', 'U19', 'main', 'Main senior team']
    );
    console.log('  ✅ Created "First Team" as main team');
  }

  if (academyTeamCount === 0) {
    console.log('\n⚠️  No academy teams found. Creating sample academy team...');
    await connection.execute(
      'INSERT INTO teams (name, ageGroup, teamType, description) VALUES (?, ?, ?, ?)',
      ['U12 Academy', 'U12', 'academy', 'Youth academy team']
    );
    console.log('  ✅ Created "U12 Academy" as academy team');
  }

  console.log('\n✅ Team types fixed successfully!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
