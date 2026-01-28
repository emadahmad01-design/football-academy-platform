import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { teams } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Checking for duplicate teams...\n');

// Get all teams
const allTeams = await db.select().from(teams);

// Group by name
const teamsByName = {};
allTeams.forEach(team => {
  if (!teamsByName[team.name]) {
    teamsByName[team.name] = [];
  }
  teamsByName[team.name].push(team);
});

// Find duplicates
const duplicates = Object.entries(teamsByName).filter(([name, teams]) => teams.length > 1);

if (duplicates.length === 0) {
  console.log('No duplicate teams found.');
} else {
  console.log(`Found ${duplicates.length} duplicate team names:\n`);
  duplicates.forEach(([name, teams]) => {
    console.log(`Team: ${name} (${teams.length} duplicates)`);
    teams.forEach(t => {
      console.log(`  - ID: ${t.id}, Age Group: ${t.ageGroup}`);
    });
    console.log('');
  });
}

await connection.end();
