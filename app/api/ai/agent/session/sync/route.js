import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserAISession from '@/models/UserAISession';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, bookingContext } = await request.json();

    await connectDB();
    await UserAISession.findOneAndUpdate(
      { userId: user.userId },
      { 
        messages: messages.slice(-20), // Keep last 20 messages for longevity
        bookingContext,
        updatedAt: new Date() // Trigger TTL refresh
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync AI Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
