import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import {
  getConversationAccessFilter,
  serializeConversationForViewer,
  syncPortalConversationsForUser,
} from '@/lib/portalChat';

const conversationPopulate = [
  { path: 'doctorUserId', select: 'name avatar email' },
  { path: 'patientUserId', select: 'name avatar email phone' },
  { path: 'doctorProfileId', select: 'specialization hospital isOnline isApproved' },
];

export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user || !['doctor', 'patient'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncPortalConversationsForUser(user);

    const conversations = await Conversation.find(getConversationAccessFilter(user))
      .populate(conversationPopulate)
      .sort({ urgent: -1, lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const result = conversations
      .filter((conversation) => {
        if (user.role !== 'patient') return true;
        // If doctor exists, he must be approved.
        return conversation.doctorProfileId?.isApproved !== false;
      })
      .map((conversation) => serializeConversationForViewer(conversation, user));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error('Chat conversations GET error:', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
