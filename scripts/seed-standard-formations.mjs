import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Same positions as getFormationPositions in ProfessionalTacticalBoardNew.tsx
const formations = {
  '4-3-3': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 150, label: 'LB' },
      { x: 200, y: 300, label: 'CB' },
      { x: 200, y: 500, label: 'CB' },
      { x: 200, y: 650, label: 'RB' },
      { x: 350, y: 200, label: 'CM' },
      { x: 350, y: 400, label: 'CM' },
      { x: 350, y: 600, label: 'CM' },
      { x: 500, y: 150, label: 'LW' },
      { x: 500, y: 400, label: 'ST' },
      { x: 500, y: 650, label: 'RW' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 150, label: 'LB' },
      { x: 1000, y: 300, label: 'CB' },
      { x: 1000, y: 500, label: 'CB' },
      { x: 1000, y: 650, label: 'RB' },
      { x: 850, y: 200, label: 'CM' },
      { x: 850, y: 400, label: 'CM' },
      { x: 850, y: 600, label: 'CM' },
      { x: 700, y: 150, label: 'LW' },
      { x: 700, y: 400, label: 'ST' },
      { x: 700, y: 650, label: 'RW' },
    ],
  },
  '4-4-2': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 150, label: 'LB' },
      { x: 200, y: 300, label: 'CB' },
      { x: 200, y: 500, label: 'CB' },
      { x: 200, y: 650, label: 'RB' },
      { x: 350, y: 150, label: 'LM' },
      { x: 350, y: 300, label: 'CM' },
      { x: 350, y: 500, label: 'CM' },
      { x: 350, y: 650, label: 'RM' },
      { x: 500, y: 300, label: 'ST' },
      { x: 500, y: 500, label: 'ST' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 150, label: 'LB' },
      { x: 1000, y: 300, label: 'CB' },
      { x: 1000, y: 500, label: 'CB' },
      { x: 1000, y: 650, label: 'RB' },
      { x: 850, y: 150, label: 'LM' },
      { x: 850, y: 300, label: 'CM' },
      { x: 850, y: 500, label: 'CM' },
      { x: 850, y: 650, label: 'RM' },
      { x: 700, y: 300, label: 'ST' },
      { x: 700, y: 500, label: 'ST' },
    ],
  },
  '4-2-3-1': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 150, label: 'LB' },
      { x: 200, y: 300, label: 'CB' },
      { x: 200, y: 500, label: 'CB' },
      { x: 200, y: 650, label: 'RB' },
      { x: 300, y: 300, label: 'CDM' },
      { x: 300, y: 500, label: 'CDM' },
      { x: 450, y: 150, label: 'LAM' },
      { x: 450, y: 400, label: 'CAM' },
      { x: 450, y: 650, label: 'RAM' },
      { x: 550, y: 400, label: 'ST' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 150, label: 'LB' },
      { x: 1000, y: 300, label: 'CB' },
      { x: 1000, y: 500, label: 'CB' },
      { x: 1000, y: 650, label: 'RB' },
      { x: 900, y: 300, label: 'CDM' },
      { x: 900, y: 500, label: 'CDM' },
      { x: 750, y: 150, label: 'LAM' },
      { x: 750, y: 400, label: 'CAM' },
      { x: 750, y: 650, label: 'RAM' },
      { x: 650, y: 400, label: 'ST' },
    ],
  },
  '3-5-2': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 250, label: 'CB' },
      { x: 200, y: 400, label: 'CB' },
      { x: 200, y: 550, label: 'CB' },
      { x: 350, y: 100, label: 'LWB' },
      { x: 350, y: 280, label: 'CM' },
      { x: 350, y: 400, label: 'CM' },
      { x: 350, y: 520, label: 'CM' },
      { x: 350, y: 700, label: 'RWB' },
      { x: 500, y: 300, label: 'ST' },
      { x: 500, y: 500, label: 'ST' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 250, label: 'CB' },
      { x: 1000, y: 400, label: 'CB' },
      { x: 1000, y: 550, label: 'CB' },
      { x: 850, y: 100, label: 'LWB' },
      { x: 850, y: 280, label: 'CM' },
      { x: 850, y: 400, label: 'CM' },
      { x: 850, y: 520, label: 'CM' },
      { x: 850, y: 700, label: 'RWB' },
      { x: 700, y: 300, label: 'ST' },
      { x: 700, y: 500, label: 'ST' },
    ],
  },
  '3-4-3': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 250, label: 'CB' },
      { x: 200, y: 400, label: 'CB' },
      { x: 200, y: 550, label: 'CB' },
      { x: 350, y: 150, label: 'LM' },
      { x: 350, y: 320, label: 'CM' },
      { x: 350, y: 480, label: 'CM' },
      { x: 350, y: 650, label: 'RM' },
      { x: 500, y: 200, label: 'LW' },
      { x: 500, y: 400, label: 'ST' },
      { x: 500, y: 600, label: 'RW' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 250, label: 'CB' },
      { x: 1000, y: 400, label: 'CB' },
      { x: 1000, y: 550, label: 'CB' },
      { x: 850, y: 150, label: 'LM' },
      { x: 850, y: 320, label: 'CM' },
      { x: 850, y: 480, label: 'CM' },
      { x: 850, y: 650, label: 'RM' },
      { x: 700, y: 200, label: 'LW' },
      { x: 700, y: 400, label: 'ST' },
      { x: 700, y: 600, label: 'RW' },
    ],
  },
  '5-3-2': {
    home: [
      { x: 100, y: 400, label: 'GK' },
      { x: 200, y: 100, label: 'LWB' },
      { x: 200, y: 260, label: 'CB' },
      { x: 200, y: 400, label: 'CB' },
      { x: 200, y: 540, label: 'CB' },
      { x: 200, y: 700, label: 'RWB' },
      { x: 350, y: 250, label: 'CM' },
      { x: 350, y: 400, label: 'CM' },
      { x: 350, y: 550, label: 'CM' },
      { x: 500, y: 300, label: 'ST' },
      { x: 500, y: 500, label: 'ST' },
    ],
    away: [
      { x: 1100, y: 400, label: 'GK' },
      { x: 1000, y: 100, label: 'LWB' },
      { x: 1000, y: 260, label: 'CB' },
      { x: 1000, y: 400, label: 'CB' },
      { x: 1000, y: 540, label: 'CB' },
      { x: 1000, y: 700, label: 'RWB' },
      { x: 850, y: 250, label: 'CM' },
      { x: 850, y: 400, label: 'CM' },
      { x: 850, y: 550, label: 'CM' },
      { x: 700, y: 300, label: 'ST' },
      { x: 700, y: 500, label: 'ST' },
    ],
  },
};

function buildPlayers(positions, team) {
  return positions.map((pos, idx) => ({
    id: `${team}-${idx}`,
    x: pos.x,
    y: pos.y,
    team,
    number: idx + 1,
    label: pos.label,
  }));
}

async function seed() {
  // Clear old tactical boards that are standard formations
  console.log('Clearing existing standard formation tactical boards...');
  const formationNames = Object.keys(formations);
  for (const name of formationNames) {
    await connection.execute(
      `DELETE FROM tactical_boards WHERE formation = ?`,
      [name]
    );
  }

  // Also clean up old "X vs Y" format entries
  await connection.execute(`DELETE FROM tactical_boards WHERE name LIKE '% vs %'`);

  console.log('Seeding 6 standard formations into tactical_boards table...');

  for (const [name, data] of Object.entries(formations)) {
    const players = buildPlayers(data.home, 'home');

    await connection.execute(
      `INSERT INTO tactical_boards (name, formation, players, drawings, createdBy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,           // name = formation name (e.g. "4-3-3")
        name,           // formation = same
        JSON.stringify(players),
        JSON.stringify([]), // no drawings
        2,              // createdBy = dev user
      ]
    );

    console.log(`  ✅ Seeded: ${name}`);
  }

  // Verify
  const [rows] = await connection.execute('SELECT id, name, formation, LENGTH(players) as playerLen FROM tactical_boards ORDER BY id');
  console.log('\nAll tactical boards in database:');
  rows.forEach(r => console.log(`  ID ${r.id}: "${r.name}" (formation: ${r.formation}, ${r.playerLen} bytes)`));

  await connection.end();
  console.log('\n✅ Done! 6 standard formations seeded.');
}

seed().catch(console.error);
