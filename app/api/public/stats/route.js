import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

export async function GET() {
  try {
    await connectDB();
    const approvedDoctorsCount = await Doctor.countDocuments({ isApproved: true });
    const onlineDoctorsCount = await Doctor.countDocuments({ isApproved: true, isOnline: true });
    
    return NextResponse.json({ 
      doctorCount: approvedDoctorsCount,
      onlineCount: onlineDoctorsCount
    });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
