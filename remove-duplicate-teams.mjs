import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  teams, players, matches, trainingSessions, leagueStandings,
  matchDefensiveActions, matchPasses, matchShots
} from './drizzle/schema.ts';
import { sql, eq, inArray } from 'drizzle-orm';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('Removing duplicate teams...\n');

// Get all teams
const allTeams = await db.select().from(teams);

// Group by name and age group
const teamsByNameAndAge = {};
allTeams.forEach(team => {
  const key = `${team.name}_${team.ageGroup}`;
  if (!teamsByNameAndAge[key]) {
    teamsByNameAndAge[key] = [];
  }
  teamsByNameAndAge[key].push(team);
});

// For each duplicate group, keep the first (lowest ID) and remove others
let totalRemoved = 0;

for (const [key, teamGroup] of Object.entries(teamsByNameAndAge)) {
  if (teamGroup.length > 1) {
    // Sort by ID to keep the oldest record
    teamGroup.sort((a, b) => a.id - b.id);
    
    const keepTeam = teamGroup[0];
    const removeTeams = teamGroup.slice(1);
    const removeIds = removeTeams.map(t => t.id);
    
    console.log(`Team: ${keepTeam.name} (${keepTeam.ageGroup})`);
    console.log(`  Keeping ID: ${keepTeam.id}`);
    console.log(`  Removing IDs: ${removeIds.join(', ')}`);
    
    // Update all references to point to the kept team
    
    // 1. Update players
    const playersToUpdate = await db.select().from(players).where(inArray(players.teamId, removeIds));
    if (playersToUpdate.length > 0) {
      console.log(`  Updating ${playersToUpdate.length} players`);
      await db.update(players)
        .set({ teamId: keepTeam.id })
        .where(inArray(players.teamId, removeIds));
    }
    
    // 2. Update matches
    const matchesToUpdate = await db.select().from(matches).where(inArray(matches.teamId, removeIds));
    if (matchesToUpdate.length > 0) {
      console.log(`  Updating ${matchesToUpdate.length} matches`);
      await db.update(matches)
        .set({ teamId: keepTeam.id })
        .where(inArray(matches.teamId, removeIds));
    }
    
    // 3. Update training sessions
    const sessionsToUpdate = await db.select().from(trainingSessions).where(inArray(trainingSessions.teamId, removeIds));
    if (sessionsToUpdate.length > 0) {
      console.log(`  Updating ${sessionsToUpdate.length} training sessions`);
      await db.update(trainingSessions)
        .set({ teamId: keepTeam.id })
        .where(inArray(trainingSessions.teamId, removeIds));
    }
    
    // 4. Update league standings
    const standingsToUpdate = await db.select().from(leagueStandings).where(inArray(leagueStandings.teamId, removeIds));
    if (standingsToUpdate.length > 0) {
      console.log(`  Updating ${standingsToUpdate.length} league standings`);
      await db.update(leagueStandings)
        .set({ teamId: keepTeam.id })
        .where(inArray(leagueStandings.teamId, removeIds));
    }
    
    // 5. Update match defensive actions
    const defActionsToUpdate = await db.select().from(matchDefensiveActions).where(inArray(matchDefensiveActions.teamId, removeIds));
    if (defActionsToUpdate.length > 0) {
      console.log(`  Updating ${defActionsToUpdate.length} match defensive actions`);
      await db.update(matchDefensiveActions)
        .set({ teamId: keepTeam.id })
        .where(inArray(matchDefensiveActions.teamId, removeIds));
    }
    
    // 6. Update match passes
    const passesToUpdate = await db.select().from(matchPasses).where(inArray(matchPasses.teamId, removeIds));
    if (passesToUpdate.length > 0) {
      console.log(`  Updating ${passesToUpdate.length} match passes`);
      await db.update(matchPasses)
        .set({ teamId: keepTeam.id })
        .where(inArray(matchPasses.teamId, removeIds));
    }
    
    // 8. Update match shots
    const shotsToUpdate = await db.select().from(matchShots).where(inArray(matchShots.teamId, removeIds));
    if (shotsToUpdate.length > 0) {
      console.log(`  Updating ${shotsToUpdate.length} match shots`);
      await db.update(matchShots)
        .set({ teamId: keepTeam.id })
        .where(inArray(matchShots.teamId, removeIds));
    }
    
    // Update all other team references using raw SQL
    console.log(`  Updating all other team references...`);
    const tablesToUpdate = ['formations', 'set_pieces', 'match_briefings', 'match_strategies'];
    
    for (const table of tablesToUpdate) {
      for (const removeId of removeIds) {
        try {
          await connection.execute(
            `UPDATE ${table} SET teamId = ? WHERE teamId = ?`,
            [keepTeam.id, removeId]
          );
        } catch (err) {
          // Table might not exist or have teamId column, skip
        }
      }
    }
    
    // Delete duplicate teams
    await db.delete(teams).where(inArray(teams.id, removeIds));
    
    totalRemoved += removeIds.length;
    console.log('');
  }
}

console.log(`\nTotal duplicate teams removed: ${totalRemoved}`);
console.log('Done!');

await connection.end();
