import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get the first user (admin) to assign as creator
const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
if (!users.length) {
  console.error('❌ No users found. Please create a user first.');
  await conn.end();
  process.exit(1);
}
const creatorId = users[0].id;

// Tactical Board formations (horizontal field: 1200x800)
// Home team on left (x: 0-600), Away team on right (x: 600-1200)
const tacticalBoardFormations = [
  {
    name: "4-4-2 vs 4-3-3",
    homeFormation: "4-4-2",
    awayFormation: "4-3-3",
    homePlayers: [
      { id: "home-0", x: 100, y: 400, number: 1, team: "home", label: "GK" },
      { id: "home-1", x: 200, y: 150, number: 2, team: "home", label: "LB" },
      { id: "home-2", x: 200, y: 300, number: 3, team: "home", label: "CB" },
      { id: "home-3", x: 200, y: 500, number: 4, team: "home", label: "CB" },
      { id: "home-4", x: 200, y: 650, number: 5, team: "home", label: "RB" },
      { id: "home-5", x: 350, y: 150, number: 6, team: "home", label: "LM" },
      { id: "home-6", x: 350, y: 300, number: 7, team: "home", label: "CM" },
      { id: "home-7", x: 350, y: 500, number: 8, team: "home", label: "CM" },
      { id: "home-8", x: 350, y: 650, number: 9, team: "home", label: "RM" },
      { id: "home-9", x: 500, y: 300, number: 10, team: "home", label: "ST" },
      { id: "home-10", x: 500, y: 500, number: 11, team: "home", label: "ST" },
    ],
    awayPlayers: [
      { id: "away-0", x: 1100, y: 400, number: 1, team: "away", label: "GK" },
      { id: "away-1", x: 1000, y: 150, number: 2, team: "away", label: "LB" },
      { id: "away-2", x: 1000, y: 300, number: 3, team: "away", label: "CB" },
      { id: "away-3", x: 1000, y: 500, number: 4, team: "away", label: "CB" },
      { id: "away-4", x: 1000, y: 650, number: 5, team: "away", label: "RB" },
      { id: "away-5", x: 850, y: 200, number: 6, team: "away", label: "CM" },
      { id: "away-6", x: 850, y: 400, number: 7, team: "away", label: "CM" },
      { id: "away-7", x: 850, y: 600, number: 8, team: "away", label: "CM" },
      { id: "away-8", x: 700, y: 150, number: 9, team: "away", label: "LW" },
      { id: "away-9", x: 700, y: 400, number: 10, team: "away", label: "ST" },
      { id: "away-10", x: 700, y: 650, number: 11, team: "away", label: "RW" },
    ],
    drawings: []
  },
  {
    name: "4-3-3 vs 4-4-2",
    homeFormation: "4-3-3",
    awayFormation: "4-4-2",
    homePlayers: [
      { id: "home-0", x: 100, y: 400, number: 1, team: "home", label: "GK" },
      { id: "home-1", x: 200, y: 150, number: 2, team: "home", label: "LB" },
      { id: "home-2", x: 200, y: 300, number: 3, team: "home", label: "CB" },
      { id: "home-3", x: 200, y: 500, number: 4, team: "home", label: "CB" },
      { id: "home-4", x: 200, y: 650, number: 5, team: "home", label: "RB" },
      { id: "home-5", x: 350, y: 200, number: 6, team: "home", label: "CM" },
      { id: "home-6", x: 350, y: 400, number: 7, team: "home", label: "CM" },
      { id: "home-7", x: 350, y: 600, number: 8, team: "home", label: "CM" },
      { id: "home-8", x: 500, y: 150, number: 9, team: "home", label: "LW" },
      { id: "home-9", x: 500, y: 400, number: 10, team: "home", label: "ST" },
      { id: "home-10", x: 500, y: 650, number: 11, team: "home", label: "RW" },
    ],
    awayPlayers: [
      { id: "away-0", x: 1100, y: 400, number: 1, team: "away", label: "GK" },
      { id: "away-1", x: 1000, y: 150, number: 2, team: "away", label: "LB" },
      { id: "away-2", x: 1000, y: 300, number: 3, team: "away", label: "CB" },
      { id: "away-3", x: 1000, y: 500, number: 4, team: "away", label: "CB" },
      { id: "away-4", x: 1000, y: 650, number: 5, team: "away", label: "RB" },
      { id: "away-5", x: 850, y: 150, number: 6, team: "away", label: "LM" },
      { id: "away-6", x: 850, y: 300, number: 7, team: "away", label: "CM" },
      { id: "away-7", x: 850, y: 500, number: 8, team: "away", label: "CM" },
      { id: "away-8", x: 850, y: 650, number: 9, team: "away", label: "RM" },
      { id: "away-9", x: 700, y: 300, number: 10, team: "away", label: "ST" },
      { id: "away-10", x: 700, y: 500, number: 11, team: "away", label: "ST" },
    ],
    drawings: []
  },
  {
    name: "3-5-2 vs 4-2-3-1",
    homeFormation: "3-5-2",
    awayFormation: "4-2-3-1",
    homePlayers: [
      { id: "home-0", x: 100, y: 400, number: 1, team: "home", label: "GK" },
      { id: "home-1", x: 200, y: 250, number: 2, team: "home", label: "CB" },
      { id: "home-2", x: 200, y: 400, number: 3, team: "home", label: "CB" },
      { id: "home-3", x: 200, y: 550, number: 4, team: "home", label: "CB" },
      { id: "home-4", x: 300, y: 100, number: 5, team: "home", label: "LWB" },
      { id: "home-5", x: 350, y: 300, number: 6, team: "home", label: "CM" },
      { id: "home-6", x: 350, y: 400, number: 7, team: "home", label: "CM" },
      { id: "home-7", x: 350, y: 500, number: 8, team: "home", label: "CM" },
      { id: "home-8", x: 300, y: 700, number: 9, team: "home", label: "RWB" },
      { id: "home-9", x: 500, y: 300, number: 10, team: "home", label: "ST" },
      { id: "home-10", x: 500, y: 500, number: 11, team: "home", label: "ST" },
    ],
    awayPlayers: [
      { id: "away-0", x: 1100, y: 400, number: 1, team: "away", label: "GK" },
      { id: "away-1", x: 1000, y: 150, number: 2, team: "away", label: "LB" },
      { id: "away-2", x: 1000, y: 300, number: 3, team: "away", label: "CB" },
      { id: "away-3", x: 1000, y: 500, number: 4, team: "away", label: "CB" },
      { id: "away-4", x: 1000, y: 650, number: 5, team: "away", label: "RB" },
      { id: "away-5", x: 900, y: 300, number: 6, team: "away", label: "CDM" },
      { id: "away-6", x: 900, y: 500, number: 7, team: "away", label: "CDM" },
      { id: "away-7", x: 750, y: 150, number: 8, team: "away", label: "LAM" },
      { id: "away-8", x: 750, y: 400, number: 9, team: "away", label: "CAM" },
      { id: "away-9", x: 750, y: 650, number: 10, team: "away", label: "RAM" },
      { id: "away-10", x: 650, y: 400, number: 11, team: "away", label: "ST" },
    ],
    drawings: []
  },
  {
    name: "4-2-3-1 vs 3-4-3",
    homeFormation: "4-2-3-1",
    awayFormation: "3-4-3",
    homePlayers: [
      { id: "home-0", x: 100, y: 400, number: 1, team: "home", label: "GK" },
      { id: "home-1", x: 200, y: 150, number: 2, team: "home", label: "LB" },
      { id: "home-2", x: 200, y: 300, number: 3, team: "home", label: "CB" },
      { id: "home-3", x: 200, y: 500, number: 4, team: "home", label: "CB" },
      { id: "home-4", x: 200, y: 650, number: 5, team: "home", label: "RB" },
      { id: "home-5", x: 300, y: 300, number: 6, team: "home", label: "CDM" },
      { id: "home-6", x: 300, y: 500, number: 7, team: "home", label: "CDM" },
      { id: "home-7", x: 450, y: 150, number: 8, team: "home", label: "LAM" },
      { id: "home-8", x: 450, y: 400, number: 9, team: "home", label: "CAM" },
      { id: "home-9", x: 450, y: 650, number: 10, team: "home", label: "RAM" },
      { id: "home-10", x: 550, y: 400, number: 11, team: "home", label: "ST" },
    ],
    awayPlayers: [
      { id: "away-0", x: 1100, y: 400, number: 1, team: "away", label: "GK" },
      { id: "away-1", x: 1000, y: 250, number: 2, team: "away", label: "CB" },
      { id: "away-2", x: 1000, y: 400, number: 3, team: "away", label: "CB" },
      { id: "away-3", x: 1000, y: 550, number: 4, team: "away", label: "CB" },
      { id: "away-4", x: 850, y: 150, number: 5, team: "away", label: "LM" },
      { id: "away-5", x: 850, y: 300, number: 6, team: "away", label: "CM" },
      { id: "away-6", x: 850, y: 500, number: 7, team: "away", label: "CM" },
      { id: "away-7", x: 850, y: 650, number: 8, team: "away", label: "RM" },
      { id: "away-8", x: 700, y: 200, number: 9, team: "away", label: "LW" },
      { id: "away-9", x: 700, y: 400, number: 10, team: "away", label: "ST" },
      { id: "away-10", x: 700, y: 600, number: 11, team: "away", label: "RW" },
    ],
    drawings: []
  },
  {
    name: "5-3-2 vs 4-4-2 Diamond",
    homeFormation: "5-3-2",
    awayFormation: "4-4-2",
    homePlayers: [
      { id: "home-0", x: 100, y: 400, number: 1, team: "home", label: "GK" },
      { id: "home-1", x: 200, y: 120, number: 2, team: "home", label: "LWB" },
      { id: "home-2", x: 200, y: 270, number: 3, team: "home", label: "CB" },
      { id: "home-3", x: 200, y: 400, number: 4, team: "home", label: "CB" },
      { id: "home-4", x: 200, y: 530, number: 5, team: "home", label: "CB" },
      { id: "home-5", x: 200, y: 680, number: 6, team: "home", label: "RWB" },
      { id: "home-6", x: 350, y: 250, number: 7, team: "home", label: "CM" },
      { id: "home-7", x: 350, y: 400, number: 8, team: "home", label: "CM" },
      { id: "home-8", x: 350, y: 550, number: 9, team: "home", label: "CM" },
      { id: "home-9", x: 500, y: 300, number: 10, team: "home", label: "ST" },
      { id: "home-10", x: 500, y: 500, number: 11, team: "home", label: "ST" },
    ],
    awayPlayers: [
      { id: "away-0", x: 1100, y: 400, number: 1, team: "away", label: "GK" },
      { id: "away-1", x: 1000, y: 150, number: 2, team: "away", label: "LB" },
      { id: "away-2", x: 1000, y: 300, number: 3, team: "away", label: "CB" },
      { id: "away-3", x: 1000, y: 500, number: 4, team: "away", label: "CB" },
      { id: "away-4", x: 1000, y: 650, number: 5, team: "away", label: "RB" },
      { id: "away-5", x: 900, y: 400, number: 6, team: "away", label: "CDM" },
      { id: "away-6", x: 800, y: 250, number: 7, team: "away", label: "LM" },
      { id: "away-7", x: 800, y: 550, number: 8, team: "away", label: "RM" },
      { id: "away-8", x: 750, y: 400, number: 9, team: "away", label: "CAM" },
      { id: "away-9", x: 700, y: 300, number: 10, team: "away", label: "ST" },
      { id: "away-10", x: 700, y: 500, number: 11, team: "away", label: "ST" },
    ],
    drawings: []
  }
];

console.log(`Creating ${tacticalBoardFormations.length} tactical board formations...\n`);

for (const formation of tacticalBoardFormations) {
  await conn.execute(
    `INSERT INTO tactical_boards 
     (name, homeFormation, awayFormation, homePlayers, awayPlayers, drawings, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      formation.name,
      formation.homeFormation,
      formation.awayFormation,
      JSON.stringify(formation.homePlayers),
      JSON.stringify(formation.awayPlayers),
      JSON.stringify(formation.drawings),
      creatorId
    ]
  );
  console.log(`✅ Created: ${formation.name}`);
}

console.log(`\n✅ Successfully created ${tacticalBoardFormations.length} tactical board formations!`);
await conn.end();
