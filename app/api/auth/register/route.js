import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  console.log('--- Registration Attempt Started ---');
  try {
    await connectDB();
    console.log('Database connected');
    
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed for:', body.email);
    } catch (e) {
      console.error('Failed to parse request body');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password, role, specialization, fee, experience, bio } = body;

    if (!name || !email || !password || !role) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    console.log('Checking for existing user with email:', lowerEmail);

    // Check if user already exists
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      console.log('User already exists:', existingUser.email, 'with role:', existingUser.role);
      return NextResponse.json({ 
        error: 'Email already registered',
        details: `This email is already linked to a ${existingUser.role} account.` 
      }, { status: 409 });
    }

    console.log('Creating new user...');
    // Create user
    const user = await User.create({ 
      name, 
      email: lowerEmail, 
      password, 
      role 
    });
    console.log('User created:', user._id);

    // If doctor, create doctor profile
    if (role === 'doctor') {
      console.log('Creating doctor profile...');
      try {
        await Doctor.create({
          userId: user._id,
          specialization: specialization || 'General',
          fee: fee || 500,
          experience: experience || 1,
          bio: bio || '',
          isApproved: false,
        });
        console.log('Doctor profile created');
      } catch (docError) {
        console.error('Doctor profile creation failed:', docError);
        await User.findByIdAndDelete(user._id);
        throw new Error('Failed to create doctor profile: ' + docError.message);
      }
    }

    console.log('Signing token...');
    const token = signToken({ userId: user._id, role: user.role, name: user.name, email: user.email });

    const response = NextResponse.json(
      { 
        message: 'Registration successful', 
        user: { id: user._id, name: user.name, role: user.role, email: user.email } 
      },
      { status: 201 }
    );
    
    response.cookies.set('sanjeevni_token', token, { 
      httpOnly: true, 
      secure: false, // Set explicitly for dev
      sameSite: 'lax',
      maxAge: 5 * 60 * 60, 
      path: '/' 
    });
    
    console.log('--- Registration Successful ---');
    return response;
  } catch (error) {
    console.error('CRITICAL REGISTRATION ERROR:', error);
    
    if (error.code === 11000) {
      console.log('Duplicate key error caught');
      return NextResponse.json({ 
        error: 'Email already registered',
        details: 'An account with this email already exists.' 
      }, { status: 409 });
    }

    if (error.name === 'ValidationError') {
      console.log('Validation error caught');
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Registration service error',
      debug: error.message 
    }, { status: 500 });
  }
}
