import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [result] = await connection.execute(
  'SELECT id, ballControl, speed, technicalOverall, physicalOverall FROM player_skill_scores WHERE playerId = 701'
);

console.log('Player 701 skill scores:', result);

await connection.end();
