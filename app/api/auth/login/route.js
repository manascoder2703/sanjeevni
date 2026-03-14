import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { loginLimiter } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Rate limiting — must happen before any DB calls
    const limit = loginLimiter(request);
    if (!limit.success) {
      const retryAfterSec = Math.ceil((limit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user._id, role: user.role, name: user.name, email: user.email });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });
    response.cookies.set('sanjeevni_token', token, { httpOnly: true, maxAge: 5 * 60 * 60, path: '/' });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
