import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const doctor = await Doctor.findById(resolvedParams.id).populate('userId', 'name email avatar phone').lean();
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch (error) {
    console.error('Doctor fetch error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
