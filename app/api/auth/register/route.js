import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { signToken } from '@/lib/auth';
import { sendOTPEmail, generateOTP } from '@/lib/email';

export async function POST(request) {
  console.log('--- Registration Attempt Started ---');
  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password, role, specialization, fee, experience, bio } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return NextResponse.json({
        error: 'Email already registered',
        details: `This email is already linked to a ${existingUser.role} account.`,
      }, { status: 409 });
    }

    // Generate OTP before creating user
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email: lowerEmail,
      password,
      role,
      otp,
      otpExpiry,
      isVerified: false,
    });

    if (role === 'doctor') {
      try {
        await Doctor.create({
          userId: user._id,
          specialization: specialization || 'General',
          fee: fee || 500,
          experience: experience || 1,
          bio: bio || '',
          isApproved: false,
        });
      } catch (docError) {
        await User.findByIdAndDelete(user._id);
        throw new Error('Failed to create doctor profile: ' + docError.message);
      }
    }

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, user.name);
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
      // Don't block registration if email fails — still return OTP required
    }

    return NextResponse.json(
      {
        message: 'Account created. Please verify your email.',
        otpRequired: true,
        email: user.email,
        user: { id: user._id, name: user.name, role: user.role, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('CRITICAL REGISTRATION ERROR:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Registration service error', debug: error.message }, { status: 500 });
  }
}