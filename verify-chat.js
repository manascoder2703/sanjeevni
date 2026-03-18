const fetch = require('node-fetch');

async function testChatEndpoint() {
  const url = 'http://localhost:3000/api/ai/chat';
  const cookie = 'sanjeevni_token=YOUR_TOKEN_HERE'; // Need a valid token to test fully
  
  const messages = [
    { role: 'assistant', content: 'Hi! How can I help?' },
    { role: 'user', content: 'I have a fever.' },
    { role: 'assistant', content: 'Sorry to hear that. Any other symptoms?' },
    { role: 'user', content: 'Yes, muscle pain.' }
  ];

  console.log('Testing Chat Endpoint with History...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 'Cookie': cookie // Skip auth for a pure logic check if possible, or use a real token
      },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

// Note: This script requires a running server and valid auth token to work fully.
// For now, I will manually verify using the browser since the server is running.
console.log('Skipping automated test, will use browser for manual verification.');
