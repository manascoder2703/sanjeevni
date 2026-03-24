import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import BookingLock from '@/models/BookingLock';
import { getUserFromRequest } from '@/lib/auth';
import { OCCUPYING_APPOINTMENT_STATUSES } from '@/lib/appointmentStatus';
import {
  getSlotKeysForTimeLabel,
  slotKeyToTimeLabel
} from '@/lib/bookingTime';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date');
    const user = await getUserFromRequest(request).catch(() => null);
    const doctor = await Doctor.findById(resolvedParams.id).populate('userId', 'name email avatar phone').lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    if (!selectedDate) {
      return NextResponse.json({ doctor });
    }

    const [appointments, locks] = await Promise.all([
      Appointment.find({
        doctorId: resolvedParams.id,
        date: selectedDate,
        status: { $in: OCCUPYING_APPOINTMENT_STATUSES }
      })
        .select('timeSlot slotKeys patientId')
        .lean(),
      BookingLock.find({
        doctorId: resolvedParams.id,
        date: selectedDate,
        expiresAt: { $gt: new Date() }
      })
        .select('timeSlot slotKeys patientId')
        .lean()
    ]);

    const slotStates = {};
    for (const appointment of appointments) {
      const state = appointment.patientId?.toString() === user?.userId ? 'bookedByYou' : 'booked';
      // Fill the entire 60-minute duration starting from the appointment time
      const keys = getSlotKeysForTimeLabel(appointment.timeSlot);

      for (const slotKey of keys) {
        slotStates[slotKeyToTimeLabel(slotKey)] = state;
      }
    }

    for (const lock of locks) {
      const state = lock.patientId === user?.userId ? 'lockedByYou' : 'locked';
      // Fill the entire 60-minute duration starting from the lock time
      const keys = getSlotKeysForTimeLabel(lock.timeSlot);

      for (const slotKey of keys) {
        const label = slotKeyToTimeLabel(slotKey);
        if (slotStates[label]) continue;
        slotStates[label] = state;
      }
    }

    // Include manually set busy ranges (only if NOT expired for today)
    if (doctor.busyRanges && doctor.busyRanges.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const range of doctor.busyRanges) {
        if (range.date === selectedDate) {
          // If viewing today, skip checking ranges that have already ended
          if (selectedDate === todayStr) {
            const [eH, eM] = range.endTime.split(':').map(Number);
            const endMin = eH * 60 + eM;
            if (nowMin > endMin) continue; 
          }

          for (const slotKey of range.slotKeys) {
            const label = slotKeyToTimeLabel(slotKey);
            if (slotStates[label]) continue;
            slotStates[label] = 'doctorBusy';
          }
        }
      }
    }

    return NextResponse.json({ doctor, slotStates });
  } catch (error) {
    console.error('Doctor fetch error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
