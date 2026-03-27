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

    let query = search ? {} : { isApproved: true };
    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    // 1. If search is provided, find matching users first
    if (search) {
      const users = await User.find({
        role: 'doctor',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      query = { 
        ...query, 
        $or: [
          { userId: { $in: userIds } },
          { specialization: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const doctors = await Doctor.find(query).populate('userId', 'name email avatar').lean();

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
