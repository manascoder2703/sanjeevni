import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId, doctorRating, platformRating, comment } = await request.json();

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    // Ensure this patient owns the appointment
    if (appointment.patientId.toString() !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If already reviewed, fix the flag and return success silently
    if (appointment.isReviewed) {
      return NextResponse.json({ message: 'Already reviewed' });
    }

    // Check review collection too (catches old records without isReviewed flag)
    const existing = await Review.findOne({ appointmentId });
    if (existing) {
      await Appointment.findByIdAndUpdate(appointmentId, { isReviewed: true });
      return NextResponse.json({ message: 'Already reviewed' });
    }

    

    
    const review = await Review.create({
      appointmentId,
      patientId: user.userId,
      doctorId: appointment.doctorId,
      doctorRating: Number(doctorRating),
      platformRating: Number(platformRating),
      comment: comment || '',
    });

    // Update appointment status to completed and isReviewed
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'completed',
      isReviewed: true
    });

    // Update doctor stats
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const currentRating = doctor.rating || 0;
      const currentTotal = doctor.totalReviews || 0;
      const newTotal = currentTotal + 1;
      doctor.rating = ((currentRating * currentTotal) + Number(doctorRating)) / newTotal;
      doctor.totalReviews = newTotal;
      await doctor.save();
    }

    return NextResponse.json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Review submit error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'You have already reviewed this consultation' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
