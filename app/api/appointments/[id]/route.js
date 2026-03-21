import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { getUserFromRequest } from '@/lib/auth';
import { sendRealtimeNotification } from '@/lib/notifications';
import Doctor from '@/models/Doctor';
import axios from 'axios';

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled', 'rejected']);
const SOCKET_SERVER = process.env.SOCKET_SERVER_INTERNAL || 'http://localhost:3001';

function syncAppointmentExpiryTimer(appointment) {
  if (['pending', 'confirmed'].includes(appointment.status)) {
    axios.post(`${SOCKET_SERVER}/internal/schedule-appointment-expiry`, {
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        scheduledDateTime: appointment.scheduledDateTime,
        date: appointment.date,
        timeSlot: appointment.timeSlot
      }
    }).catch(err => console.error('Appointment expiry scheduling failed:', err.message));
    return;
  }

  axios.post(`${SOCKET_SERVER}/internal/cancel-appointment-expiry`, {
    appointmentId: appointment._id
  }).catch(err => console.error('Appointment expiry cancellation failed:', err.message));
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { status } = await request.json();
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid appointment status' }, { status: 400 });
    }

    const resolvedParams = await params;
    const appointment = await Appointment.findById(resolvedParams.id);
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    if (user.role === 'doctor') {
      const doctor = await Doctor.findById(appointment.doctorId).select('userId');
      if (!doctor || doctor.userId?.toString() !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role === 'patient') {
      const ownsAppointment = appointment.patientId?.toString() === user.userId;
      const canCancel = status === 'cancelled' && ['pending', 'confirmed'].includes(appointment.status);
      if (!ownsAppointment || !canCancel) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    appointment.status = status;
    await appointment.save();
    syncAppointmentExpiryTimer(appointment);

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
