import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { getUserFromRequest } from '@/lib/auth';
import { sendRealtimeNotification } from '@/lib/notifications';

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { status } = await request.json();
    const resolvedParams = await params;
    const appointment = await Appointment.findByIdAndUpdate(
      resolvedParams.id,
      { status },
      { new: true }
    );
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    // Send real-time notification to patient
    try {
      await sendRealtimeNotification(appointment.patientId, {
        title: 'Appointment Updated',
        content: `Your appointment status has been updated to: ${status}.`,
        type: 'approval',
        link: '/dashboard/patient'
      });
    } catch (notifyErr) {
      console.warn('Real-time notification failed:', notifyErr.message);
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
