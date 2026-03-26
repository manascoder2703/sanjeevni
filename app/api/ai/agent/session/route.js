import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserAISession from '@/models/UserAISession';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const session = await UserAISession.findOne({ userId: user.userId });

    if (!session) {
      return NextResponse.json({ messages: [], bookingContext: null });
    }

    return NextResponse.json({
      messages: session.messages,
      bookingContext: session.bookingContext
    });
  } catch (error) {
    console.error('Fetch AI Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    await UserAISession.deleteOne({ userId: user.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AI Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
