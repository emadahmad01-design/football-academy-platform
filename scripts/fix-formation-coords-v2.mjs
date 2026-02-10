import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Tactical Board canvas dimensions (horizontal field)
const TB_WIDTH = 1200;  // x axis: goal to goal (left to right)
const TB_HEIGHT = 800;  // y axis: sideline to sideline (top to bottom)

// Formation Builder: vertical field
// x = left to right (sideline to sideline), 0-100%
// y = top to bottom (attacking end to defending end), 0-100%
// GK at bottom (high y ~90%), strikers at top (low y ~15%)

const [rows] = await conn.execute('SELECT id, name, positions FROM formations WHERE isTemplate = 1');

for (const row of rows) {
  try {
    const positions = JSON.parse(row.positions);
    if (!Array.isArray(positions)) continue;
    
    // Convert from tactical board horizontal layout to formation builder vertical layout
    // TB x (0-1200, goal-to-goal) → FB y (inverted: GK at bottom ~90, ST at top ~15)
    // TB y (0-800, sideline-to-sideline) → FB x (5-95)
    const converted = positions.map(p => {
      // Normalize tactical board coords to 0-1 range
      // Current values are already percentages from last fix (0-50 range roughly)
      // But they were wrong percentages (divided by 1200/800), so let's recover original pixels
      const origPixelX = (p.x / 100) * TB_WIDTH;
      const origPixelY = (p.y / 100) * TB_HEIGHT;
      
      // Now map to vertical formation builder
      // TB x (depth: 0=own goal, 600=halfway, 1200=opponent goal) 
      //   → FB y (depth: 90=own goal, 50=halfway, 10=opponent end) = inverted
      const fbY = 90 - ((origPixelX / (TB_WIDTH / 2)) * 75); // GK near 90, ST near 15
      
      // TB y (width: 0=top sideline, 400=center, 800=bottom sideline) 
      //   → FB x (width: 5=left, 50=center, 95=right)
      const fbX = 5 + ((origPixelY / TB_HEIGHT) * 90);
      
      return {
        ...p,
        x: Math.round(Math.max(5, Math.min(95, fbX)) * 10) / 10,
        y: Math.round(Math.max(5, Math.min(95, fbY)) * 10) / 10,
      };
    });
    
    await conn.execute('UPDATE formations SET positions = ? WHERE id = ?', [JSON.stringify(converted), row.id]);
    console.log(`✅ Fixed "${row.name}":`);
    converted.forEach(p => console.log(`   ${p.role}: x=${p.x}%, y=${p.y}%`));
  } catch (e) {
    console.error(`❌ "${row.name}" - error: ${e.message}`);
  }
}

await conn.end();
console.log('\nDone! Coordinates now mapped for vertical formation builder field.');
