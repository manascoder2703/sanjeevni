import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getUserFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET patient profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const decoded = await getUserFromRequest(request);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json();

    const allowedFields = ['name', 'phone', 'dob', 'gender', 'bloodGroup', 'address', 'allergies', 'avatar'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    // Validate avatar size (base64 ~1.3x file size; cap at ~1.5MB stored)
    if (updates.avatar && updates.avatar.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Avatar image too large. Please use an image under 1.5 MB.' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    return NextResponse.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('PUT patient profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
