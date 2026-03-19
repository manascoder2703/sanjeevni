import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import { sendRealtimeNotification } from '@/lib/notifications';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { sendBookingConfirmation } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    await connectDB();
    let user = await getUserFromRequest(request);
    if (!user) {
      const session = await getServerSession(authOptions);
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = { userId: session.user.id, role: session.user.role || 'patient' };
    }

    let appointments;
    if (user.role === 'patient') {
      appointments = await Appointment.find({ patientId: user.userId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
        .sort({ date: -1 })
        .lean();
    } else if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user.userId });
      appointments = await Appointment.find({ doctorId: doctor?._id })
        .populate('patientId', 'name email avatar phone')
        .sort({ date: -1 })
        .lean();
    } else {
      // admin
      appointments = await Appointment.find({})
        .populate('patientId', 'name email')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .sort({ date: -1 })
        .lean();
    }
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    let user = await getUserFromRequest(request);
    console.log('USER DEBUG:', JSON.stringify(user, null, 2));
    if (!user) {
      const session = await getServerSession(authOptions);
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      console.log('SESSION DEBUG:', JSON.stringify(session, null, 2));
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = { userId: session.user.id, role: session.user.role || 'patient' };
    }
    if (user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doctorId, date, timeSlot, notes } = await request.json();
    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing booking at same slot
    const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: { $ne: 'cancelled' } });
    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
    }

    // Combine date and timeSlot into a single Date object
    let hours, minutes;
    if (timeSlot.includes(' ')) {
      const [time, modifier] = timeSlot.split(' ');
      [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    } else {
      [hours, minutes] = timeSlot.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
    }
    const scheduledDateTime = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(String(minutes).split(':')[0]).padStart(2, '0')}:00`);

    const roomId = uuidv4();
    const appointment = await Appointment.create({
      patientId: user.userId,
      doctorId,
      date,
      timeSlot,
      notes: notes || '',
      roomId,
      scheduledDateTime,
    });

    // Send confirmation email (non-blocking)
    try {
      const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
      const patient = await User.findById(user.userId);
      await sendBookingConfirmation({
        patientEmail: patient.email,
        patientName: patient.name,
        doctorName: doctor.userId.name,
        date,
        timeSlot,
        appointmentId: appointment._id.toString().slice(-6).toUpperCase(),
      });
    } catch (emailErr) {
      console.warn('Email sending failed (non-critical):', emailErr.message);
    }

    // Send real-time notification to doctor
    try {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        await sendRealtimeNotification(doctor.userId, {
          title: 'New Appointment',
          content: `A new appointment has been booked for ${date} at ${timeSlot}.`,
          type: 'booking',
          link: '/dashboard/doctor'
        });
      }
    } catch (notifyErr) {
      console.warn('Real-time notification failed:', notifyErr.message);
    }

    return NextResponse.json({ message: 'Appointment booked!', appointment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
