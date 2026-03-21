import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import {
  emitChatRead,
  emitConversationUpdate,
} from '@/lib/chatRealtime';
import {
  getConversationAccessFilter,
  getConversationParticipantIds,
  serializeConversationDetailForViewer,
  syncPortalConversationsForUser,
} from '@/lib/portalChat';

const conversationPopulate = [
  { path: 'doctorUserId', select: 'name avatar email' },
  { path: 'patientUserId', select: 'name avatar email phone' },
  { path: 'doctorProfileId', select: 'specialization hospital isOnline fee experience' },
];

async function loadConversationForViewer(conversationId, user) {
  return Conversation.findOne({
    _id: conversationId,
    ...getConversationAccessFilter(user),
  })
    .populate(conversationPopulate)
    .lean();
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { conversationId } = await params;

    if (!user || !['doctor', 'patient'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncPortalConversationsForUser(user);

    const conversation = await loadConversationForViewer(conversationId, user);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      conversation: serializeConversationDetailForViewer(conversation, user),
    });
  } catch (error) {
    console.error('Chat conversation detail GET error:', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { conversationId } = await params;

    if (!user || !['doctor', 'patient'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const accessFilter = {
      _id: conversationId,
      ...getConversationAccessFilter(user),
    };

    const conversation = await Conversation.findOne(accessFilter).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (typeof body.urgent === 'boolean') {
      if (user.role !== 'doctor') {
        return NextResponse.json({ error: 'Only doctors can change urgency' }, { status: 403 });
      }

      await Conversation.updateOne(accessFilter, {
        $set: { urgent: body.urgent },
      });

      await emitConversationUpdate({
        conversationId,
        userIds: getConversationParticipantIds(conversation),
      });
    }

    if (body.markRead) {
      const unreadMessageIds = (conversation.messages || [])
        .filter((message) => message.senderRole !== user.role && !message.readAt)
        .map((message) => message._id.toString());

      if (unreadMessageIds.length > 0) {
        const now = new Date();
        const unreadField = user.role === 'doctor' ? 'doctorUnreadCount' : 'patientUnreadCount';
        const lastSeenField = user.role === 'doctor' ? 'doctorLastSeenAt' : 'patientLastSeenAt';

        await Conversation.updateOne(
          accessFilter,
          {
            $set: {
              [unreadField]: 0,
              [lastSeenField]: now,
              'messages.$[message].readAt': now,
            },
          },
          {
            arrayFilters: [
              {
                'message.senderRole': { $ne: user.role },
                'message.readAt': null,
              },
            ],
          }
        );

        await emitChatRead({
          conversationId,
          userIds: getConversationParticipantIds(conversation),
          messageIds: unreadMessageIds,
          readByUserId: String(user.userId),
        });
      }
    }

    const updatedConversation = await loadConversationForViewer(conversationId, user);

    return NextResponse.json({
      conversation: serializeConversationDetailForViewer(updatedConversation, user),
    });
  } catch (error) {
    console.error('Chat conversation PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
