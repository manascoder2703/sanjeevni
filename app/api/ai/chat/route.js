import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, chatId: existingChatId } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    await connectDB();

    // Prepare Gemini Model - Using gemini-flash-lite-latest for maximum free-tier reliability
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest",
      systemInstruction: "You are Sanjeevni AI, an empathetic health assistant. Provide medically informative, general guidance. Always advise professional consultation for serious concerns. Keep responses concise and readable."
    });

    // AGGRESSIVE QUOTA PROTECTION: Truncate history to only last 8 messages (4 exchanges)
    // This dramatically reduces token usage per request.
    const recentMessages = messages.length > 9 ? messages.slice(-9) : messages;

    // Format for Gemini (alternating User/Model)
    let history = [];
    let lastRole = null;

    recentMessages.slice(0, -1).forEach((m) => {
      if (history.length === 0 && m.role === 'assistant') return;
      const currentRole = m.role === 'assistant' ? 'model' : 'user';
      if (currentRole !== lastRole) {
        history.push({ role: currentRole, parts: [{ text: m.content || '' }] });
        lastRole = currentRole;
      }
    });

    const chat = model.startChat({ history });
    const lastMessage = recentMessages[recentMessages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const reply = response.text();

    if (!response) {
      return NextResponse.json({ error: 'AI response blocked or empty' }, { status: 500 });
    }

    // --- Persistence Logic ---
    let chatId = existingChatId;
    let savedChat;

    if (chatId) {
      savedChat = await Chat.findOneAndUpdate(
        { _id: chatId, userId: user.userId },
        { 
          $push: { 
            messages: [
              { role: 'user', content: lastMessage },
              { role: 'assistant', content: reply }
            ] 
          },
          lastMessageAt: new Date()
        },
        { new: true }
      );
    } 

    // Create new chat if none exists or update failed
    if (!savedChat) {
      // Optimized: Generate title WITHOUT an extra AI call to save quota
      const title = lastMessage.length > 40 
        ? lastMessage.substring(0, 40) + "..." 
        : lastMessage;

      savedChat = await Chat.create({
        userId: user.userId,
        title: title || 'New Health Chat',
        messages: [
          ...messages.slice(0, -1),
          { role: 'user', content: lastMessage },
          { role: 'assistant', content: reply }
        ]
      });
      chatId = savedChat._id;
    }

    /* Quota Optimization: Disabling auto-summary to prevent extra API calls
    if (savedChat.messages.length >= 10 && savedChat.messages.length % 10 === 0) {
      ...
    }
    */

    return NextResponse.json({ reply, chatId });

  } catch (error) {
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json({ error: 'AI is temporarily busy (Free Tier Limit). Please try again in 30 seconds.' }, { status: 429 });
    }
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
