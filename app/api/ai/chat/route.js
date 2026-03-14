import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getGeminiModel, HEALTH_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await request.json();
    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const model = getGeminiModel(HEALTH_SYSTEM_PROMPT);

    // Build chat history (all but the last message)
    // IMPORTANT: Gemini history MUST start with 'user' role
    const history = messages.slice(0, -1)
      .filter((m, i) => i > 0 || m.role === 'user') // Skip initial assistant greeting if it's the first message
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMessage = messages[messages.length - 1];

    // If history is still starting with 'model', skip it to be safe
    const cleanHistory = (history.length > 0 && history[0].role === 'model') 
      ? history.slice(1) 
      : history;

    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 500 });
  }
}
