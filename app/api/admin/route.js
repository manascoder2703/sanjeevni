import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const [totalUsers, totalDoctors, totalAppointments, pendingDoctors, pendingAppointments] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments({ isApproved: true }),
      Appointment.countDocuments(),
      Doctor.countDocuments({ isApproved: false }),
      Appointment.countDocuments({ status: 'pending' }),
    ]);
    const recentDoctors = await Doctor.find({ isApproved: false }).populate('userId', 'name email').lean();
    return NextResponse.json({ totalUsers, totalDoctors, totalAppointments, pendingDoctors, pendingAppointments, recentDoctors });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { doctorId, action } = await request.json();
    
    if (action === 'reject') {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        await User.findByIdAndDelete(doctor.userId);
        await Doctor.findByIdAndDelete(doctorId);
      }
      return NextResponse.json({ message: 'Doctor rejected and removed' });
    }
    
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { isApproved: action === 'approve' }, { new: true });
    return NextResponse.json({ doctor });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
