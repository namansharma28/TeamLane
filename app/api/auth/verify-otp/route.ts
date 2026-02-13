export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, otp, type = 'email_verification' } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('gravitas');

    const otpRecord = await db.collection('email_otps').findOne({
      email: email.toLowerCase(),
      otp,
      type,
      expires: { $gt: new Date() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (type === 'email_verification') {
      const result = await db.collection('users').updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            emailVerified: new Date(),
            updatedAt: new Date(),
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    await db.collection('email_otps').deleteOne({
      _id: otpRecord._id
    });

    return NextResponse.json({
      message: type === 'email_verification' 
        ? 'Email verified successfully' 
        : 'OTP verified successfully',
      verified: true,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
