import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import { forgotPasswordLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Rate limiting — max 3 attempts per hour to prevent email spam
    const limit = forgotPasswordLimiter(request);
    if (!limit.success) {
      const retryAfterSec = Math.ceil((limit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    await connectDB();
    const { email } = await request.json();


    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security reasons, don't indicate if the user exists or not.
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set expire (10 mins)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      });

      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Email could not be sent', err);
      return NextResponse.json({ error: 'Email could not be sent' }, { status: 500 });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
