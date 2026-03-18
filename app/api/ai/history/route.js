import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    
    // Fetch latest 20 chats for the user
    const chats = await Chat.find({ userId: user.userId })
      .select('title summary lastMessageAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(20);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

// Fetch a single full chat by ID
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await request.json();
    if (!chatId) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });

    await connectDB();
    const chat = await Chat.findOne({ _id: chatId, userId: user.userId });
    
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Fetch specific chat error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}
