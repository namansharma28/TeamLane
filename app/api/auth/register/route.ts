export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { sendOTPEmail, generateOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gravitas');

    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection('email_otps').insertOne({
      email: email.toLowerCase(),
      otp,
      expires: otpExpires,
      type: 'email_verification',
      userId: result.insertedId,
      createdAt: new Date(),
    });

    try {
      await sendOTPEmail(email, name, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      await db.collection('users').deleteOne({ _id: result.insertedId });
      await db.collection('email_otps').deleteOne({ email: email.toLowerCase() });
      
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Account created successfully. Please check your email for the verification code.',
      userId: result.insertedId,
      email: email.toLowerCase(),
      requiresVerification: true,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
