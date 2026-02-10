import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

async function migrate() {
  console.log('Migrating tactical_boards table schema...\n');

  try {
    // Step 1: Add new columns
    console.log('1. Adding new columns: formation, players');
    await connection.execute(`
      ALTER TABLE tactical_boards 
      ADD COLUMN formation VARCHAR(20) AFTER name,
      ADD COLUMN players TEXT AFTER formation
    `);
    console.log('   ✅ New columns added\n');

    // Step 2: Migrate data from old columns to new columns
    console.log('2. Migrating data from homeFormation/homePlayers to formation/players');
    await connection.execute(`
      UPDATE tactical_boards 
      SET formation = homeFormation,
          players = homePlayers
      WHERE formation IS NULL
    `);
    console.log('   ✅ Data migrated\n');

    // Step 3: Make formation NOT NULL
    console.log('3. Making formation column NOT NULL');
    await connection.execute(`
      ALTER TABLE tactical_boards 
      MODIFY COLUMN formation VARCHAR(20) NOT NULL
    `);
    console.log('   ✅ Formation column now NOT NULL\n');

    // Step 4: Make players NOT NULL
    console.log('4. Making players column NOT NULL');
    await connection.execute(`
      ALTER TABLE tactical_boards 
      MODIFY COLUMN players TEXT NOT NULL
    `);
    console.log('   ✅ Players column now NOT NULL\n');

    // Step 5: Drop old columns
    console.log('5. Dropping old columns: homeFormation, awayFormation, homePlayers, awayPlayers');
    await connection.execute(`
      ALTER TABLE tactical_boards 
      DROP COLUMN homeFormation,
      DROP COLUMN awayFormation,
      DROP COLUMN homePlayers,
      DROP COLUMN awayPlayers
    `);
    console.log('   ✅ Old columns dropped\n');

    // Verify the new structure
    const [rows] = await connection.execute('DESCRIBE tactical_boards');
    console.log('New table structure:');
    console.table(rows);

    await connection.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await connection.end();
    process.exit(1);
  }
}

migrate();
