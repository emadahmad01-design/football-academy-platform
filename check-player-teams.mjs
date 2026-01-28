import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Checking player-team assignments...\n');

const [playersByTeam] = await connection.execute(
  `SELECT teamId, COUNT(*) as count 
   FROM players 
   WHERE teamId IS NOT NULL 
   GROUP BY teamId 
   ORDER BY teamId`
);

console.log('Players per team:');
console.log(JSON.stringify(playersByTeam, null, 2));

const [nullTeam] = await connection.execute(
  `SELECT COUNT(*) as count FROM players WHERE teamId IS NULL`
);

console.log('\nPlayers without team:', nullTeam[0].count);

const [samplePlayers] = await connection.execute(
  `SELECT id, firstName, lastName, teamId FROM players LIMIT 10`
);

console.log('\nSample players:');
console.log(JSON.stringify(samplePlayers, null, 2));

await connection.end();
