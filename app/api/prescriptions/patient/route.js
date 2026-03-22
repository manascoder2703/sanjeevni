import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Prescription from '@/models/Prescription';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prescriptions = await Prescription.find({
      patientUserId: user.userId,
      status: { $ne: 'cancelled' },
    })
      .populate('doctorUserId', 'name avatar')
      .populate('doctorProfileId', 'specialization hospital qualifications')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('GET patient prescriptions error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}