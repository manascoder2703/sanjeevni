import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import { sendRealtimeNotification } from '@/lib/notifications';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import BookingLock from '@/models/BookingLock';
import { getUserFromRequest } from '@/lib/auth';
import axios from 'axios';

const SOCKET_SERVER = process.env.SOCKET_SERVER_INTERNAL || 'http://localhost:3001';
import { sendBookingConfirmation } from '@/lib/email';
import Review from '@/models/Review';
import { v4 as uuidv4 } from 'uuid';
import { cleanupExpiredAppointments } from '@/lib/appointments';
import { OCCUPYING_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import {
  doesTimeEntryOverlap,
  getSlotKeysForTimeLabel,
  isAllowedBookingIncrement,
  parseDateAndTimeSlot
} from '@/lib/bookingTime';

async function releaseBookingLock({ userId, doctorId, date, timeSlot }) {
  const lockCandidates = await BookingLock.find({
    doctorId,
    date,
    patientId: userId
  })
    .select('doctorId date timeSlot slotKeys patientId')
    .lean();
  const lock = lockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

  if (!lock) return;

  await BookingLock.deleteOne({ _id: lock._id });
  axios.post(`${SOCKET_SERVER}/internal/cancel-lock-timer`, {
    userId: lock.patientId,
    doctorId: lock.doctorId,
    date: lock.date,
    timeSlot: lock.timeSlot
  }).catch(err => console.error('Socket timer cancellation failed:', err.message));
}

function scheduleAppointmentExpiryTimer(appointment) {
  axios.post(`${SOCKET_SERVER}/internal/schedule-appointment-expiry`, {
    appointment: {
      _id: appointment._id,
      status: appointment.status,
      scheduledDateTime: appointment.scheduledDateTime,
      date: appointment.date,
      timeSlot: appointment.timeSlot
    }
  }).catch(err => console.error('Appointment expiry scheduling failed:', err.message));
}

export async function GET(request) {
  try {
    await connectDB();
    await cleanupExpiredAppointments();
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
      const dbAppointments = await Appointment.find({ patientId: user.userId })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name avatar' } })
        .sort({ date: -1 })
        .lean();
      
      // Explicitly check reviews for each appointment to ensure isReviewed is accurate
      const userReviews = await Review.find({ patientId: user.userId }).select('appointmentId').lean();
      const reviewedIds = new Set(userReviews.map(r => r.appointmentId.toString()));
      
      appointments = dbAppointments.map(appt => ({
        ...appt,
        isReviewed: appt.isReviewed || reviewedIds.has(appt._id.toString())
      }));
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
    if (!user) {
      const session = await getServerSession(authOptions);
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      user = { userId: session.user.id, role: session.user.role || 'patient' };
    }

    const { doctorId, date, timeSlot, notes } = await request.json();
    const now = new Date();
    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isAllowedBookingIncrement(timeSlot)) {
      return NextResponse.json({ error: 'Please choose a time from the dropdown list.' }, { status: 400 });
    }

    const slotKeys = getSlotKeysForTimeLabel(timeSlot);
    const scheduledDateTime = parseDateAndTimeSlot(date, timeSlot);
    if (!slotKeys.length || !scheduledDateTime) {
      return NextResponse.json({ error: 'Invalid appointment time selected' }, { status: 400 });
    }

    // [New] Prevent self-booking
    const doctor = await Doctor.findById(doctorId);
    if (doctor?.userId?.toString() === user.userId) {
      return NextResponse.json({ error: 'You cannot book an appointment with yourself.' }, { status: 400 });
    }

    // Check if DOCTOR is already booked
    const doctorBookedCandidates = await Appointment.find({
      doctorId,
      date,
      status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
    })
      .select('patientId timeSlot slotKeys')
      .lean();
    const doctorBooked = doctorBookedCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));
    
    if (doctorBooked) {
      if (doctorBooked.patientId.toString() === user.userId) {
        return NextResponse.json({ error: 'This slot got just booked by you' }, { status: 409 });
      }
      return NextResponse.json({ error: 'This slot got booked by someone else' }, { status: 409 });
    }

    // The patient must actively hold the slot lock before the appointment is created.
    const activeLockCandidates = await BookingLock.find({
      doctorId,
      date,
      patientId: user.userId,
      expiresAt: { $gt: now }
    })
      .select('doctorId date timeSlot slotKeys patientId expiresAt')
      .lean();
    const activeLock = activeLockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

    if (!activeLock) {
      const existingLockCandidates = await BookingLock.find({
        doctorId,
        date,
        expiresAt: { $gt: now }
      })
        .select('patientId timeSlot slotKeys expiresAt')
        .lean();
      const existingLock = existingLockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

      if (existingLock && existingLock.patientId !== user.userId) {
        return NextResponse.json({ error: 'Someone else is in the middle of booking this slot. Try again in a few minutes.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Please select the slot again before booking.' }, { status: 409 });
    }

    // [New] Check Booking Lock
    const existingLockCandidates = await BookingLock.find({
      doctorId,
      date,
      expiresAt: { $gt: now }
    });
    const existingLock = existingLockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));
    if (existingLock && existingLock.patientId !== user.userId) {
      return NextResponse.json({ error: 'Someone else is in the middle of booking this slot. Try again in a few minutes.' }, { status: 409 });
    }

    // Check if PATIENT is already booked (Concurrent booking prevention)
    const patientBookedCandidates = await Appointment.find({
      patientId: user.userId,
      date,
      status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
    })
      .select('timeSlot slotKeys')
      .lean();
    const patientBooked = patientBookedCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));
    if (patientBooked) {
      await releaseBookingLock({ userId: user.userId, doctorId, date, timeSlot });
      return NextResponse.json({ error: 'You already have another appointment at this same time' }, { status: 409 });
    }

    const roomId = uuidv4();
    let appointment;
    try {
      appointment = await Appointment.create({
        patientId: user.userId,
        doctorId,
        date,
        timeSlot,
        slotKeys,
        notes: notes || '',
        roomId,
        scheduledDateTime,
      });
    } catch (error) {
      if (error?.code === 11000) {
        await releaseBookingLock({ userId: user.userId, doctorId, date, timeSlot });

        const conflictingDoctorBookingCandidates = await Appointment.find({
          doctorId,
          date,
          status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
        })
          .select('patientId timeSlot slotKeys')
          .lean();
        const conflictingDoctorBooking = conflictingDoctorBookingCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

        if (conflictingDoctorBooking) {
          if (conflictingDoctorBooking.patientId.toString() === user.userId) {
            return NextResponse.json({ error: 'This slot got just booked by you' }, { status: 409 });
          }

          return NextResponse.json({ error: 'This slot got booked by someone else' }, { status: 409 });
        }

        const conflictingPatientBookingCandidates = await Appointment.find({
          patientId: user.userId,
          date,
          status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
        })
          .select('timeSlot slotKeys')
          .lean();
        const conflictingPatientBooking = conflictingPatientBookingCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

        if (conflictingPatientBooking) {
          return NextResponse.json({ error: 'You already have another appointment at this same time' }, { status: 409 });
        }
      }

      throw error;
    }

    // Clean up short-term lock after successful booking
    await releaseBookingLock({ userId: user.userId, doctorId, date, timeSlot });
    scheduleAppointmentExpiryTimer(appointment);

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

    // Trigger chat list refresh via socket
    try {
      axios.post(`${SOCKET_SERVER}/internal/chat-conversation`, {
        userIds: [user.userId, doctor.userId],
      }).catch(err => console.error('Chat sync notification failed:', err.message));
    } catch (chatSyncErr) {
      console.warn('Chat sync trigger failed:', chatSyncErr.message);
    }

    return NextResponse.json({ message: 'Appointment booked!', appointment }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
