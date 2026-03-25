const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const INTENT_PARSING_PROMPT = `You are a strict Natural Language to JSON parser for Sanjeevni.
Your goal is to identify user intent and extract parameters. 
Respond ONLY with a JSON object. No conversational filler.

Supported Intents & Role Permissions:
- ROLE "patient":
  1. "SEARCH_DOCTORS": Find doctors. Params: { "specialty", "city", "query" }
  2. "BOOK_DOCTOR": Book appointment. Params: { "doctorName", "date", "timeSlot", "missingFields" }
- COMMON:
  1. "PROVIDE_INFO": User provides a fragment like a date, time, or name as a follow-up. 
     Params: { "date", "timeSlot", "doctorName", "fragmentType": "date"|"time"|"name"|"notes" }

Rules:
- If a user sends ONLY a date, time, or name (e.g., "10:00 AM", "Monday", "Dr. John"), categorize it as "PROVIDE_INFO".
- Respond ONLY with JSON.`;

async function testFragmentParsing() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    systemInstruction: INTENT_PARSING_PROMPT
  });

  const testCases = [
    { text: "10:00 AM", role: "patient" },
    { text: "Monday", role: "patient" },
    { text: "Dr. Smith", role: "patient" }
  ];

  for (const tc of testCases) {
    console.log(`\nTesting: "${tc.text}" (Role: ${tc.role})`);
    try {
      const result = await model.generateContent(`Role: ${tc.role}\nUser Message: ${tc.text}`);
      console.log("Response:", result.response.text().trim());
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

testFragmentParsing();
