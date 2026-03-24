import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';
import axios from 'axios';
import { getSlotKeysForTimeLabel } from '@/lib/bookingTime';

const SOCKET_SERVER = process.env.SOCKET_SERVER_INTERNAL || 'http://localhost:3001';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date, startTime, endTime } = await request.json();
    console.log('[BusyAPI] Request data:', { date, startTime, endTime, userId: user.userId });

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing date, startTime, or endTime' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ userId: user.userId });
    if (!doctor) {
      console.warn('[BusyAPI] Doctor profile NOT FOUND for userId:', user.userId);
      return NextResponse.json({ error: 'Doctor profile not found. Have you completed your setup?' }, { status: 404 });
    }

    // Calculate slots to block (all minutes in the range)
    // For simplicity, we can use a range of keys.
    // However, the user said "booked at 3:15 so 3:15 to 4:15".
    // We can generate all minutes between startTime and endTime.
    
    // Helper to generate all minutes between two 24h strings
    const parseTime = (hhm) => {
      const [h, m] = hhm.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const slots = [];
    for (let m = start; m <= end; m++) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      let dispH = h % 12;
      if (dispH === 0) dispH = 12;
      slots.push(`${String(dispH).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`);
    }

    const newRange = { date, startTime, endTime, slotKeys: slots };
    if (!doctor.busyRanges) doctor.busyRanges = [];
    doctor.busyRanges.push(newRange);
    await doctor.save();

    // Broadcast update for each minute blocked
    // For large ranges, we might want a bulk event, but our socket supports slot:occupied per minute
    // Let's use a specialized event or just broadcast the whole range update
    axios.post(`${SOCKET_SERVER}/internal/broadcast`, {
      event: 'doctor:busy-range-added',
      data: { doctorId: String(user.userId), date, startTime, endTime, slotKeys: slots }
    }).catch(err => console.error('Broadcast failed:', err.message));

    return NextResponse.json({ success: true, range: newRange });
  } catch (error) {
    console.error('Busy Range Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { date, startTime } = await request.json();
    const doctor = await Doctor.findOne({ userId: user.userId });
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const originalRange = doctor.busyRanges.find(r => r.date === date && r.startTime === startTime);
    doctor.busyRanges = doctor.busyRanges.filter(r => !(r.date === date && r.startTime === startTime));
    await doctor.save();

    if (originalRange) {
        axios.post(`${SOCKET_SERVER}/internal/broadcast`, {
          event: 'doctor:busy-range-removed',
          data: { doctorId: String(user.userId), date, slotKeys: originalRange.slotKeys }
        }).catch(err => console.error('Broadcast failed:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
