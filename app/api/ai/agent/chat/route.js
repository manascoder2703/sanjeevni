import { NextResponse } from 'next/server';
import { getGeminiModel, HEALTH_SYSTEM_PROMPT } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const model = getGeminiModel(HEALTH_SYSTEM_PROMPT + "\nMaintain a helpful, concise tone. If the user is in the middle of a booking, gently ask for the missing details (like date, time, or doctor name) to proceed.");
    
    const recentMessages = messages.slice(-3);
    const history = recentMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({ history });
    const lastMessage = recentMessages[recentMessages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    return NextResponse.json({ reply: response.text().trim() });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: 'AI service error' }, { status: 500 });
  }
}
