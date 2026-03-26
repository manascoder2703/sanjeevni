import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, INTENT_PARSING_PROMPT } from '@/lib/gemini';
import connectDB from '@/lib/mongodb';
import AICache from '@/models/AICache';
import UserAISession from '@/models/UserAISession';

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

    // 2. Load or create Session
    let session;
    try {
      session = await UserAISession.findOne({ userId: user.userId });
      if (!session) {
        session = new UserAISession({ userId: user.userId, messages: [], bookingContext: null });
      }
    } catch (sessionErr) {
      console.error('Session Load Error:', sessionErr);
    }

    // 3. Use Gemini to parse intent into JSON
    const model = getGeminiModel(INTENT_PARSING_PROMPT);
    
    // Provide current date and history for context-aware parsing
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const historyText = session?.messages?.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n') || '';
    const contextPrompt = `Today's Date: ${currentDateStr}\n${historyText ? `History:\n${historyText}\n\n` : ''}`;
    
    const result = await model.generateContent(`${contextPrompt}Role: ${role}\nUser Message: ${message.trim()}`);

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

      // 4. Update Session and Store in Cache
      try {
        if (session) {
          session.messages.push({ role: 'user', content: message.trim() });
          // Note: Assistant response will be pushed in the widget handleSend or here if we return it
          // For now, we only push the user message to keep the parse route as a pure "parser"
          // but we can update the bookingContext if the parser found anything
          if (parsed.intent === 'BOOK_DOCTOR' || parsed.intent === 'PROVIDE_INFO') {
              // We'll let the frontend handle the merge and send the updated context in a separate call 
              // or we can do a partial merge here if we want the backend to be the source of truth
          }
          await session.save();
        }
        await AICache.create({ prompt, role, response: parsed });
      } catch (cacheStoreErr) {
        console.error('Cache/Session Storage Error (Non-fatal):', cacheStoreErr);
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
