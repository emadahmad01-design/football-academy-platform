// Direct test of PlayerMaker API credentials
// This bypasses environment variables to test the exact credentials

const API_BASE_URL = 'https://b2b.playermaker.co.uk/api/b2b/v1';

// Exact credentials from PlayerMaker email
const credentials = {
  clientKey: 'fudJZY)=V=469W@PQEhS#eB&*-xKlPyR',
  clientSecret: '?7gS#Nfph0-UVm@vv_$5UI1+krKat5(nCnFzzWZJQc3jHrdawbXA@pRkfhMqc#KpM(4ZAU=p',
  clientTeamId: 6591
};

console.log('Testing PlayerMaker API with direct credentials...');
console.log('URL:', `${API_BASE_URL}/account/login`);
console.log('ClientKey length:', credentials.clientKey.length);
console.log('ClientSecret length:', credentials.clientSecret.length);

// Also check environment variables
console.log('\n--- Environment Variables ---');
console.log('PLAYERMAKER_CLIENT_KEY:', process.env.PLAYERMAKER_CLIENT_KEY ? `Set (${process.env.PLAYERMAKER_CLIENT_KEY.length} chars)` : 'NOT SET');
console.log('PLAYERMAKER_CLIENT_SECRET:', process.env.PLAYERMAKER_CLIENT_SECRET ? `Set (${process.env.PLAYERMAKER_CLIENT_SECRET.length} chars)` : 'NOT SET');
console.log('PLAYERMAKER_TEAM_ID:', process.env.PLAYERMAKER_TEAM_ID || 'NOT SET');

// Compare env vs hardcoded
if (process.env.PLAYERMAKER_CLIENT_KEY) {
  console.log('\nClientKey match:', process.env.PLAYERMAKER_CLIENT_KEY === credentials.clientKey);
}
if (process.env.PLAYERMAKER_CLIENT_SECRET) {
  console.log('ClientSecret match:', process.env.PLAYERMAKER_CLIENT_SECRET === credentials.clientSecret);
}

console.log('\n--- Testing API Call ---');

try {
  const response = await fetch(`${API_BASE_URL}/account/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  console.log('Response status:', response.status);
  
  const data = await response.text();
  console.log('Response:', data);
  
  if (response.ok) {
    const json = JSON.parse(data);
    console.log('\n✅ SUCCESS!');
    console.log('Club Name:', json.clubName);
    console.log('Token:', json.token.substring(0, 20) + '...');
    console.log('Teams:', JSON.stringify(json.teams, null, 2));
  } else {
    console.log('\n❌ FAILED');
  }
} catch (error) {
  console.error('Error:', error.message);
}
