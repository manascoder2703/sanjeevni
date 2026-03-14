import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');
    const search = searchParams.get('search');

    const query = { isApproved: true };
    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    let doctors = await Doctor.find(query).populate('userId', 'name email avatar').lean();

    if (search) {
      const s = search.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.userId?.name?.toLowerCase().includes(s) ||
          d.specialization?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
