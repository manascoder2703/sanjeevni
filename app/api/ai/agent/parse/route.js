import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, INTENT_PARSING_PROMPT } from '@/lib/gemini';
import connectDB from '@/lib/mongodb';
import AICache from '@/models/AICache';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const prompt = message.trim().toLowerCase();
    const role = user.role;

    // 1. Check Cache first
    try {
      await connectDB();
      const cached = await AICache.findOne({ prompt, role });
      if (cached) {
        console.log('AI Cache Hit:', prompt);
        return NextResponse.json(cached.response);
      }
    } catch (cacheErr) {
      console.error('Cache Lookup Error (Non-fatal):', cacheErr);
    }

    // 2. Use Gemini to parse intent into JSON
    const model = getGeminiModel(INTENT_PARSING_PROMPT);
    const result = await model.generateContent(`Role: ${role}\nUser Message: ${message.trim()}`);

    if (!result.response) {
      throw new Error('AI response blocked or empty');
    }

    const text = result.response.text().trim();
    
    // Extract JSON from the response
    let parsed;
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found');
      }
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonStr);

      // 3. Store in Cache for future use
      try {
        await AICache.create({ prompt, role, response: parsed });
      } catch (cacheStoreErr) {
        console.error('Cache Storage Error (Non-fatal):', cacheStoreErr);
      }

    } catch (e) {
      console.error('Intent Parse Error:', e, 'Raw text:', text);
      return NextResponse.json({ 
        intent: 'UNKNOWN', 
        message: 'Could not categorize intent',
        raw: text 
      });
    }

    return NextResponse.json(parsed);

  } catch (error) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ error: 'AI limit reached. Try again in 30s.' }, { status: 429 });
    }
    console.error('AI Agent Parse Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
