import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password, role, specialization, fee, experience, bio } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await User.create({ name, email, password, role });

    // If doctor, create doctor profile
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: specialization || 'General',
        fee: fee || 500,
        experience: experience || 1,
        bio: bio || '',
        isApproved: false,
      });
    }

    const token = signToken({ userId: user._id, role: user.role, name: user.name, email: user.email });

    const response = NextResponse.json(
      { message: 'Registration successful', user: { id: user._id, name: user.name, role: user.role, email: user.email } },
      { status: 201 }
    );
    response.cookies.set('sanjeevni_token', token, { httpOnly: true, maxAge: 5 * 60 * 60, path: '/' });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}
