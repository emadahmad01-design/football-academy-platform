import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT id, name, templateName, isTemplate, LEFT(positions, 120) as posPreview FROM formations WHERE isTemplate = 1');
console.log("=== Formation Templates (isTemplate=true) ===");
console.log(JSON.stringify(rows, null, 2));
console.log(`\nTotal: ${rows.length} templates`);

// Check which ones have array format vs object format
for (const row of rows) {
  try {
    const [fullRows] = await conn.execute('SELECT positions FROM formations WHERE id = ?', [row.id]);
    const parsed = JSON.parse(fullRows[0].positions);
    const isArray = Array.isArray(parsed);
    console.log(`  ID ${row.id} "${row.name}" => ${isArray ? '✅ Array (Formation)' : '❌ Object (Tactical Board format)'}`);
  } catch (e) {
    console.log(`  ID ${row.id} "${row.name}" => ❌ Parse error`);
  }
}

await conn.end();
