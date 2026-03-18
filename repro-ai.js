const axios = require('axios');

async function testRoutes() {
  console.log("Testing Symptom Checker...");
  try {
    const res = await axios.post('http://localhost:3000/api/ai/symptom-check', 
      { symptoms: "I have a headache and fever" },
      { validateStatus: () => true }
    );
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Symptom Test Error:", err.message);
  }

  console.log("\nTesting Health Chat...");
  try {
    const res = await axios.post('http://localhost:3000/api/ai/chat', 
      { messages: [{ role: 'user', content: 'What is a cold?' }] },
      { validateStatus: () => true }
    );
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Chat Test Error:", err.message);
  }
}

testRoutes();
