import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getUserFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const doctor = await Doctor.findOne({ userId: decoded.userId });

    return NextResponse.json({ user, doctor });
  } catch (error) {
    console.error('GET doctor profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const decoded = await getUserFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json();

    // Validate avatar size
    if (body.avatar && body.avatar.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Avatar image too large. Please use an image under 1.5 MB.' }, { status: 400 });
    }

    // Update User fields
    const userFields = ['name', 'phone', 'avatar'];
    const userUpdates = {};
    for (const f of userFields) {
      if (body[f] !== undefined) userUpdates[f] = body[f];
    }
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: userUpdates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    // Update Doctor fields
    const doctorFields = ['specialization', 'bio', 'fee', 'experience', 'hospital', 'clinicAddress', 'qualifications', 'languages', 'consultationType'];
    const doctorUpdates = {};
    for (const f of doctorFields) {
      if (body[f] !== undefined) doctorUpdates[f] = body[f];
    }
    const doctor = await Doctor.findOneAndUpdate(
      { userId: decoded.userId },
      { $set: doctorUpdates },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ message: 'Profile updated successfully', user, doctor });
  } catch (error) {
    console.error('PUT doctor profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
