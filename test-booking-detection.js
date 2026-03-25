const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const INTENT_PARSING_PROMPT = `You are a strict Natural Language to JSON parser for Sanjeevni.
Your goal is to identify user intent and extract parameters. 
Respond ONLY with a JSON object. No conversational filler.

Supported Intents:
1. "SEARCH_DOCTORS": User wants to find a doctor. Params: { "specialty": string, "city": string, "query": string }
2. "BOOK_DOCTOR": User wants to book an appointment. Params: { "doctorName": string, "date": string, "timeSlot": string, "missingFields": string[] }
   - Required Fields: "doctorName", "date", "timeSlot".
   - If even one is missing, list it in "missingFields".
3. "GET_AVAILABILITY": User wants to know when a doctor is free. Params: { "doctorId": string, "doctorName": string, "date": string }`;

async function testBookingInfoDetection() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-lite-latest',
    systemInstruction: INTENT_PARSING_PROMPT
  });

  const testCases = [
    "I want to book an appointment with Dr. John",
    "Book Dr. John for Monday",
    "Book Dr. John for Monday at 10:00 AM"
  ];

  for (const text of testCases) {
    console.log(`\nTesting: "${text}"`);
    try {
      const result = await model.generateContent(text);
      console.log("Response:", result.response.text().trim());
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

testBookingInfoDetection();
