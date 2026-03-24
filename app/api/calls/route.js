import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import CallLog from '@/models/CallLog';
import User from '@/models/User';
import Doctor from '@/models/Doctor';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = user.role === 'doctor' 
      ? { doctorUserId: user.userId, deletedByDoctor: { $ne: true } } 
      : { patientUserId: user.userId, deletedByPatient: { $ne: true } };

    const logs = await CallLog.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: user.role === 'doctor' ? 'patientUserId' : 'doctorUserId',
        select: 'name avatar role'
      })
      .populate({
        path: 'doctorProfileId',
        select: 'specialization'
      })
      .lean();

    // Map logs to a consistent format for the UI
    const formattedLogs = logs.map(log => {
      const otherUser = user.role === 'doctor' ? log.patientUserId : log.doctorUserId;
      const isIncoming = log.initiatorRole !== user.role;
      
      return {
        _id: log._id,
        otherUser: {
          id: otherUser?._id,
          name: otherUser?.name || 'Unknown User',
          avatar: otherUser?.avatar,
          specialty: log.doctorProfileId?.specialization || (otherUser?.role === 'doctor' ? 'Doctor' : 'Patient')
        },
        direction: isIncoming ? 'incoming' : 'outgoing',
        status: log.status, // 'completed', 'missed', 'rejected', 'declined'
        duration: log.duration,
        startTime: log.startTime,
        createdAt: log.createdAt,
        initiatorRole: log.initiatorRole,
        conversationId: log.conversationId
      };
    });

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Call logs FETCH error:', error);
    return NextResponse.json({ error: 'Failed to fetch call logs' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids, all } = await request.json();
    const deleteField = user.role === 'doctor' ? 'deletedByDoctor' : 'deletedByPatient';
    const query = user.role === 'doctor' 
      ? { doctorUserId: user.userId } 
      : { patientUserId: user.userId };

    if (all) {
      await CallLog.updateMany(query, { $set: { [deleteField]: true } });
    } else if (Array.isArray(ids) && ids.length > 0) {
      await CallLog.updateMany({ ...query, _id: { $in: ids } }, { $set: { [deleteField]: true } });
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Call logs DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete call logs' }, { status: 500 });
  }
}
