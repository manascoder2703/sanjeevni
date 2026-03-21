import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import { emitChatMessage } from '@/lib/chatRealtime';
import {
  getConversationAccessFilter,
  getConversationParticipantIds,
} from '@/lib/portalChat';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { conversationId } = await params;

    if (!user || !['doctor', 'patient'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text = '', kind = 'text' } = await request.json();
    const trimmedText = text.trim();

    if (!trimmedText) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const accessFilter = {
      _id: conversationId,
      ...getConversationAccessFilter(user),
    };

    const conversation = await Conversation.findOne(accessFilter).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const createdAt = new Date();
    const messageId = new mongoose.Types.ObjectId();
    const unreadField = user.role === 'doctor' ? 'patientUnreadCount' : 'doctorUnreadCount';

    await Conversation.updateOne(accessFilter, {
      $push: {
        messages: {
          _id: messageId,
          senderId: user.userId,
          senderRole: user.role,
          text: trimmedText,
          kind,
          createdAt,
          deliveredAt: createdAt,
          readAt: null,
        },
      },
      $set: {
        lastMessageText: trimmedText,
        lastMessageAt: createdAt,
      },
      $inc: {
        [unreadField]: 1,
      },
    });

    await emitChatMessage({
      conversationId,
      userIds: getConversationParticipantIds(conversation),
      message: {
        _id: String(messageId),
        senderId: String(user.userId),
        senderRole: user.role,
        text: trimmedText,
        kind,
        createdAt,
        deliveredAt: createdAt,
        readAt: null,
        mine: true,
      },
    });

    return NextResponse.json({
      message: {
        _id: String(messageId),
        senderId: String(user.userId),
        senderRole: user.role,
        text: trimmedText,
        kind,
        createdAt,
        deliveredAt: createdAt,
        readAt: null,
        mine: true,
      },
    });
  } catch (error) {
    console.error('Chat message POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
