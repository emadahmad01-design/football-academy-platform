// Script to fix PlayerMaker credentials using drizzle
import { db } from '../server/db';
import { playermakerSettings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Correct credentials from PlayerMaker
const CORRECT_CLIENT_KEY = 'fudJZY)=V=469W@PQEhS#eB&*-xKlPyR';
const CORRECT_CLIENT_SECRET = '?7gS#Nfph0-UVm@vv_$5UI1+krKat5(nCnFzzWZJQc3jHrdawbXA@pRkfhMqc#KpM(4ZAU=p';
const TEAM_ID = '6591';
const TEAM_CODE = 'cLIo';

async function main() {
  console.log('Checking PlayerMaker settings in database...');
  
  // Get current settings
  const settings = await db.select().from(playermakerSettings).limit(1);
  
  if (settings.length > 0) {
    const current = settings[0];
    console.log('\nCurrent values:');
    console.log('ID:', current.id);
    console.log('ClientKey:', current.clientKey);
    console.log('ClientSecret length:', current.clientSecret?.length);
    console.log('TeamId:', current.clientTeamId);
    console.log('TeamCode:', current.teamCode);
    
    console.log('\nExpected:');
    console.log('ClientKey:', CORRECT_CLIENT_KEY);
    console.log('ClientSecret length:', CORRECT_CLIENT_SECRET.length);
    
    const keyMatch = current.clientKey === CORRECT_CLIENT_KEY;
    const secretMatch = current.clientSecret === CORRECT_CLIENT_SECRET;
    
    console.log('\nMatches:');
    console.log('ClientKey match:', keyMatch);
    console.log('ClientSecret match:', secretMatch);
    
    if (!secretMatch || !keyMatch) {
      console.log('\n⚠️ Credentials mismatch! Updating...');
      
      await db.update(playermakerSettings)
        .set({
          clientKey: CORRECT_CLIENT_KEY,
          clientSecret: CORRECT_CLIENT_SECRET,
          clientTeamId: TEAM_ID,
          teamCode: TEAM_CODE,
        })
        .where(eq(playermakerSettings.id, current.id));
      
      console.log('✅ Credentials updated successfully!');
      
      // Verify
      const updated = await db.select().from(playermakerSettings).where(eq(playermakerSettings.id, current.id));
      console.log('New ClientSecret length:', updated[0]?.clientSecret?.length);
    } else {
      console.log('\n✅ Credentials are already correct!');
    }
  } else {
    console.log('No settings found!');
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
