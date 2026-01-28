import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Check if player exists
const [playerResult] = await connection.execute(
  'SELECT id, firstName, lastName, position FROM players WHERE id = 701'
);

console.log('Player 701:', playerResult);

// Check total players
const [playerCount] = await connection.execute('SELECT COUNT(*) as count FROM players');
console.log('Total players:', playerCount[0].count);

// Check skill scores
const [skillCount] = await connection.execute('SELECT COUNT(*) as count FROM player_skill_scores');
console.log('Total skill scores:', skillCount[0].count);

// Get first few players with skill scores
const [playersWithScores] = await connection.execute(
  'SELECT DISTINCT playerId FROM player_skill_scores LIMIT 5'
);
console.log('Sample players with scores:', playersWithScores);

await connection.end();
