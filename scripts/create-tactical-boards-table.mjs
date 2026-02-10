import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Check if tactical_boards table exists
const [tables] = await conn.execute("SHOW TABLES LIKE 'tactical_boards'");
if (tables.length > 0) {
  console.log('✅ tactical_boards table already exists');
  await conn.end();
  process.exit(0);
}

console.log('Creating tactical_boards table...');

await conn.execute(`
  CREATE TABLE tactical_boards (
    id int AUTO_INCREMENT NOT NULL,
    name varchar(100) NOT NULL,
    homeFormation varchar(20),
    awayFormation varchar(20),
    homePlayers text NOT NULL,
    awayPlayers text NOT NULL,
    drawings text NOT NULL,
    teamId int,
    createdBy int NOT NULL,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT tactical_boards_id PRIMARY KEY(id)
  )
`);

await conn.execute(`
  ALTER TABLE tactical_boards 
  ADD CONSTRAINT tactical_boards_teamId_teams_id_fk 
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE no action ON UPDATE no action
`);

await conn.execute(`
  ALTER TABLE tactical_boards 
  ADD CONSTRAINT tactical_boards_createdBy_users_id_fk 
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE no action ON UPDATE no action
`);

console.log('✅ tactical_boards table created successfully!');
await conn.end();
