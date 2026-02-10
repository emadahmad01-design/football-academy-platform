import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Define proper vertical formation templates
// x = left-right (5-95%), y = top-bottom (5=attacking end, 95=own goal)
const templates = {
  '4-3-3': [
    { role: 'GK',  x: 50,   y: 90 },
    { role: 'LB',  x: 18,   y: 72 },
    { role: 'CB',  x: 38,   y: 74 },
    { role: 'CB',  x: 62,   y: 74 },
    { role: 'RB',  x: 82,   y: 72 },
    { role: 'CM',  x: 30,   y: 52 },
    { role: 'CM',  x: 50,   y: 48 },
    { role: 'CM',  x: 70,   y: 52 },
    { role: 'LW',  x: 20,   y: 26 },
    { role: 'ST',  x: 50,   y: 20 },
    { role: 'RW',  x: 80,   y: 26 },
  ],
  '4-4-2': [
    { role: 'GK',  x: 50,   y: 90 },
    { role: 'LB',  x: 18,   y: 72 },
    { role: 'CB',  x: 38,   y: 74 },
    { role: 'CB',  x: 62,   y: 74 },
    { role: 'RB',  x: 82,   y: 72 },
    { role: 'LM',  x: 18,   y: 48 },
    { role: 'CM',  x: 38,   y: 50 },
    { role: 'CM',  x: 62,   y: 50 },
    { role: 'RM',  x: 82,   y: 48 },
    { role: 'ST',  x: 38,   y: 22 },
    { role: 'ST',  x: 62,   y: 22 },
  ],
  '4-2-3-1': [
    { role: 'GK',  x: 50,   y: 90 },
    { role: 'LB',  x: 18,   y: 72 },
    { role: 'CB',  x: 38,   y: 74 },
    { role: 'CB',  x: 62,   y: 74 },
    { role: 'RB',  x: 82,   y: 72 },
    { role: 'CDM', x: 38,   y: 56 },
    { role: 'CDM', x: 62,   y: 56 },
    { role: 'CAM', x: 20,   y: 36 },
    { role: 'CAM', x: 50,   y: 34 },
    { role: 'CAM', x: 80,   y: 36 },
    { role: 'ST',  x: 50,   y: 18 },
  ],
  '3-5-2': [
    { role: 'GK',  x: 50,   y: 90 },
    { role: 'CB',  x: 30,   y: 74 },
    { role: 'CB',  x: 50,   y: 72 },
    { role: 'CB',  x: 70,   y: 74 },
    { role: 'LWB', x: 12,   y: 50 },
    { role: 'CM',  x: 35,   y: 52 },
    { role: 'CM',  x: 50,   y: 48 },
    { role: 'CM',  x: 65,   y: 52 },
    { role: 'RWB', x: 88,   y: 50 },
    { role: 'ST',  x: 38,   y: 22 },
    { role: 'ST',  x: 62,   y: 22 },
  ],
  '3-4-3': [
    { role: 'GK',  x: 50,   y: 90 },
    { role: 'CB',  x: 30,   y: 74 },
    { role: 'CB',  x: 50,   y: 72 },
    { role: 'CB',  x: 70,   y: 74 },
    { role: 'LM',  x: 18,   y: 50 },
    { role: 'CM',  x: 38,   y: 52 },
    { role: 'CM',  x: 62,   y: 52 },
    { role: 'RM',  x: 82,   y: 50 },
    { role: 'LW',  x: 24,   y: 24 },
    { role: 'ST',  x: 50,   y: 20 },
    { role: 'RW',  x: 76,   y: 24 },
  ],
};

const [rows] = await conn.execute('SELECT id, name FROM formations WHERE isTemplate = 1');

for (const row of rows) {
  const templatePositions = templates[row.name];
  if (templatePositions) {
    const positions = templatePositions.map((p, idx) => ({
      id: idx + 1,
      ...p,
    }));
    await conn.execute('UPDATE formations SET positions = ? WHERE id = ?', [JSON.stringify(positions), row.id]);
    console.log(`✅ Updated "${row.name}" with proper vertical layout`);
    positions.forEach(p => console.log(`   ${p.role}: x=${p.x}%, y=${p.y}%`));
  } else {
    console.log(`⚠️ No template defined for "${row.name}"`);
  }
}

await conn.end();
console.log('\nDone!');
