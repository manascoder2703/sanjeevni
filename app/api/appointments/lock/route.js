import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookingLock from '@/models/BookingLock';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';
import axios from 'axios';
import { OCCUPYING_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import {
  doesTimeEntryOverlap,
  getSlotKeysForTimeLabel,
  isAllowedBookingIncrement
} from '@/lib/bookingTime';

const SOCKET_SERVER = process.env.SOCKET_SERVER_INTERNAL || 'http://localhost:3001';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const timeSlot = searchParams.get('timeSlot');

    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const slotKeys = getSlotKeysForTimeLabel(timeSlot);
    if (!slotKeys.length || !isAllowedBookingIncrement(timeSlot)) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    const lockCandidates = await BookingLock.find({
      doctorId,
      date,
      patientId: user.userId,
      expiresAt: { $gt: new Date() }
    })
      .select('expiresAt timeSlot slotKeys')
      .lean();
    const lock = lockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

    if (lock) {
      return NextResponse.json({ success: true, exists: true, expiresAt: lock.expiresAt });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { doctorId, date, timeSlot } = await request.json();
    const now = new Date();
    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isAllowedBookingIncrement(timeSlot)) {
      return NextResponse.json({ error: 'Please choose a time from the dropdown list.' }, { status: 400 });
    }

    const slotKeys = getSlotKeysForTimeLabel(timeSlot);
    if (!slotKeys.length) {
      return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    // TTL cleanup is not immediate, so clear any stale lock for this slot first.
    await BookingLock.deleteMany({
      doctorId,
      date,
      expiresAt: { $lte: now }
    });

    const doctor = await Doctor.findById(doctorId);
    if (doctor?.userId?.toString() === user.userId) {
      return NextResponse.json({ error: 'You cannot book an appointment with yourself.' }, { status: 400 });
    }

    const appointmentCandidates = await Appointment.find({
      doctorId,
      date,
      status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
    })
      .select('patientId timeSlot slotKeys')
      .lean();
    const confirmed = appointmentCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

    if (confirmed) {
      if (confirmed.patientId.toString() === user.userId) {
        return NextResponse.json({ error: 'This time slot was just booked by you.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'This time slot was just booked by someone else.' }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await BookingLock.create({
        doctorId,
        date,
        timeSlot,
        slotKeys,
        patientId: user.userId,
        expiresAt
      });

      axios.post(`${SOCKET_SERVER}/internal/lock-timer`, {
        userId: user.userId,
        doctorId,
        date,
        timeSlot,
        expiresAt
      }).catch(err => console.error('Socket notification failed:', err.message));

      return NextResponse.json({ success: true, expiresAt });
    } catch (err) {
      if (err.code === 11000) {
        const existingLockCandidates = await BookingLock.find({
          doctorId,
          date,
          expiresAt: { $gt: now }
        })
          .select('patientId expiresAt timeSlot slotKeys')
          .lean();
        const existingLock = existingLockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

        if (existingLock && existingLock.patientId === user.userId) {
          return NextResponse.json({
            success: true,
            expiresAt: existingLock.expiresAt,
            alreadyLockedByYou: true
          });
        }

        return NextResponse.json({ error: 'Someone else is currently booking this slot. Try again in 10 minutes.' }, { status: 409 });
      }

      throw err;
    }
  } catch (error) {
    console.error('Lock Error:', error);
    return NextResponse.json({ error: 'Server error during locking' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { doctorId, date, timeSlot } = await request.json();
    const lockCandidates = await BookingLock.find({
      doctorId,
      date,
      patientId: user.userId,
      expiresAt: { $gt: new Date() }
    })
      .select('_id timeSlot slotKeys')
      .lean();
    const matchingLock = lockCandidates.find((entry) => doesTimeEntryOverlap(entry, timeSlot));

    if (matchingLock) {
      await BookingLock.deleteOne({ _id: matchingLock._id });
    }

    axios.post(`${SOCKET_SERVER}/internal/cancel-lock-timer`, {
      userId: user.userId,
      doctorId,
      date,
      timeSlot: matchingLock?.timeSlot || timeSlot
    }).catch(err => console.error('Socket timer cancellation failed:', err.message));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
