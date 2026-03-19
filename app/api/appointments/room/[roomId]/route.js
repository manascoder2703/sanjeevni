import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;
    const appointment = await Appointment.findOne({ roomId })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
      .populate('patientId', 'name');

    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
