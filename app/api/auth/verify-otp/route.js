import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check OTP matches
    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    // Check OTP not expired
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'OTP has expired. Please login again.' }, { status: 400 });
    }

    // Clear OTP and mark verified
    await User.updateOne(
      { _id: user._id },
      { $set: { otp: null, otpExpiry: null, isVerified: true } }
    );

    // Issue token
    const token = signToken({
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      message: 'OTP verified successfully',
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });

    response.cookies.set('sanjeevni_token', token, {
      httpOnly: true,
      maxAge: 5 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Resend OTP
export async function PUT(request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { sendOTPEmail, generateOTP } = await import('@/lib/email');
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.updateOne({ _id: user._id }, { $set: { otp, otpExpiry } });

    await sendOTPEmail(user.email, otp, user.name);

    return NextResponse.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}