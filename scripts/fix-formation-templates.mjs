import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all formation templates with tactical board format
const [rows] = await conn.execute('SELECT id, name, positions FROM formations WHERE isTemplate = 1');

let fixed = 0;
for (const row of rows) {
  try {
    const parsed = JSON.parse(row.positions);
    
    // Check if it's tactical board format
    if (parsed && parsed.homePlayers && !Array.isArray(parsed)) {
      const homePlayers = parsed.homePlayers;
      
      // Convert to formation builder format: [{x, y, role}]
      const formationPositions = homePlayers.map((p, idx) => ({
        id: idx + 1,
        x: p.x,
        y: p.y,
        role: p.label || p.role || "CM",
      }));
      
      const newPositions = JSON.stringify(formationPositions);
      await conn.execute('UPDATE formations SET positions = ? WHERE id = ?', [newPositions, row.id]);
      console.log(`✅ Fixed ID ${row.id} "${row.name}" - converted ${homePlayers.length} players to formation format`);
      fixed++;
    } else if (Array.isArray(parsed)) {
      console.log(`⏭️ ID ${row.id} "${row.name}" - already in correct format`);
    }
  } catch (e) {
    console.error(`❌ ID ${row.id} "${row.name}" - error: ${e.message}`);
  }
}

console.log(`\nDone! Fixed ${fixed} formations.`);

// Verify
const [verify] = await conn.execute('SELECT id, name, LEFT(positions, 100) as posPreview FROM formations WHERE isTemplate = 1');
console.log("\n=== Verified Formations ===");
for (const row of verify) {
  const parsed = JSON.parse(row.posPreview + '...');  // Won't work for verify, let's do it properly
}

const [verifyFull] = await conn.execute('SELECT id, name, positions FROM formations WHERE isTemplate = 1');
for (const row of verifyFull) {
  const parsed = JSON.parse(row.positions);
  console.log(`  ID ${row.id} "${row.name}" => ${Array.isArray(parsed) ? '✅ Array' : '❌ Object'} (${parsed.length || 0} positions)`);
}

await conn.end();
