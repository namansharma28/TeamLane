export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { sendOTPEmail, generateOTP } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, type = 'email_verification' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gravitas');

    const user = await db.collection('users').findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (type === 'email_verification' && user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    const recentOTP = await db.collection('email_otps').findOne({
      email: email.toLowerCase(),
      type,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });

    if (recentOTP) {
      return NextResponse.json(
        { error: 'OTP was sent recently. Please wait 1 minute before requesting another.' },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection('email_otps').deleteMany({
      email: email.toLowerCase(),
      type
    });

    await db.collection('email_otps').insertOne({
      email: email.toLowerCase(),
      otp,
      expires: otpExpires,
      type,
      userId: user._id,
      createdAt: new Date(),
    });

    await sendOTPEmail(email, user.name, otp);

    return NextResponse.json({
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
