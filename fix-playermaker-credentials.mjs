// Script to fix PlayerMaker credentials in the database
import { createConnection } from 'mysql2/promise';

// Correct credentials from PlayerMaker
const CORRECT_CLIENT_KEY = 'fudJZY)=V=469W@PQEhS#eB&*-xKlPyR';
const CORRECT_CLIENT_SECRET = '?7gS#Nfph0-UVm@vv_$5UI1+krKat5(nCnFzzWZJQc3jHrdawbXA@pRkfhMqc#KpM(4ZAU=p';
const TEAM_ID = '6591';
const TEAM_CODE = 'cLIo';

async function main() {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connected to database');

  // Check current values
  const [rows] = await connection.execute(
    'SELECT id, clientKey, clientSecret, LENGTH(clientSecret) as secret_length, clientTeamId, teamCode FROM playermaker_settings LIMIT 1'
  );

  console.log('\\nCurrent database values:');
  if (rows.length > 0) {
    const row = rows[0];
    console.log('ID:', row.id);
    console.log('ClientKey:', row.clientKey);
    console.log('ClientSecret length:', row.secret_length);
    console.log('TeamId:', row.clientTeamId);
    console.log('TeamCode:', row.teamCode);
    
    console.log('\\nExpected values:');
    console.log('ClientKey:', CORRECT_CLIENT_KEY);
    console.log('ClientSecret length:', CORRECT_CLIENT_SECRET.length);
    
    console.log('\\nMatches:');
    console.log('ClientKey match:', row.clientKey === CORRECT_CLIENT_KEY);
    console.log('ClientSecret match:', row.clientSecret === CORRECT_CLIENT_SECRET);
    
    if (row.clientSecret !== CORRECT_CLIENT_SECRET) {
      console.log('\\n⚠️ ClientSecret mismatch! Updating...');
      
      await connection.execute(
        'UPDATE playermaker_settings SET clientSecret = ?, clientKey = ?, clientTeamId = ?, teamCode = ? WHERE id = ?',
        [CORRECT_CLIENT_SECRET, CORRECT_CLIENT_KEY, TEAM_ID, TEAM_CODE, row.id]
      );
      
      console.log('✅ Credentials updated successfully!');
      
      // Verify
      const [verifyRows] = await connection.execute(
        'SELECT LENGTH(clientSecret) as secret_length FROM playermaker_settings WHERE id = ?',
        [row.id]
      );
      console.log('New ClientSecret length:', verifyRows[0].secret_length);
    } else {
      console.log('\\n✅ Credentials are already correct!');
    }
  } else {
    console.log('No settings found, inserting new record...');
    await connection.execute(
      'INSERT INTO playermaker_settings (clientKey, clientSecret, clientTeamId, teamCode, isActive) VALUES (?, ?, ?, ?, 1)',
      [CORRECT_CLIENT_KEY, CORRECT_CLIENT_SECRET, TEAM_ID, TEAM_CODE]
    );
    console.log('✅ New settings inserted!');
  }

  await connection.end();
  console.log('\\nDone!');
}

main().catch(console.error);
