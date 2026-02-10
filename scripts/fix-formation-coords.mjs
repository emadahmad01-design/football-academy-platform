import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Tactical Board canvas dimensions
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const [rows] = await conn.execute('SELECT id, name, positions FROM formations WHERE isTemplate = 1');

for (const row of rows) {
  try {
    const positions = JSON.parse(row.positions);
    if (!Array.isArray(positions)) continue;
    
    // Check if coordinates are pixel-based (values > 100 means pixels, not percentages)
    const maxX = Math.max(...positions.map(p => p.x));
    const maxY = Math.max(...positions.map(p => p.y));
    
    if (maxX > 100 || maxY > 100) {
      // Convert pixel coordinates to percentages
      const converted = positions.map(p => ({
        ...p,
        x: Math.round((p.x / CANVAS_WIDTH) * 100 * 10) / 10,
        y: Math.round((p.y / CANVAS_HEIGHT) * 100 * 10) / 10,
      }));
      
      await conn.execute('UPDATE formations SET positions = ? WHERE id = ?', [JSON.stringify(converted), row.id]);
      console.log(`✅ Fixed "${row.name}" - converted pixel coords to percentages`);
      converted.forEach(p => console.log(`   ${p.role}: (${p.x}%, ${p.y}%)`));
    } else {
      console.log(`⏭️ "${row.name}" - already in percentage format`);
    }
  } catch (e) {
    console.error(`❌ "${row.name}" - error: ${e.message}`);
  }
}

await conn.end();
console.log('\nDone!');
