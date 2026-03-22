import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const conversations = await Conversation.find({}).lean();
  let deleted = 0;
  for (const conv of conversations) {
    const doctorUser = await User.findById(conv.doctorUserId).lean();
    const patientUser = await User.findById(conv.patientUserId).lean();
    if (!doctorUser || !patientUser) {
      await Conversation.deleteOne({ _id: conv._id });
      deleted++;
    }
  }
  return NextResponse.json({ deleted });
}