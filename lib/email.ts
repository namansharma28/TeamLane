import * as nodemailer from 'nodemailer';

// Create transporter with Brevo configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // false for 587, true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Additional options for Brevo
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
};

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
export async function sendOTPEmail(email: string, name: string, otp: string) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"TeamLane" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Verify your TeamLane account - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">TeamLane</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6;">
              Hi ${name}, thank you for signing up for TeamLane! Please use the verification code below to complete your registration:
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't create an account with TeamLane, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              The TeamLane Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Send password reset email with token URL
export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"TeamLane" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset your TeamLane password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">TeamLane</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
            <h2 style="color: #333;">Password Reset</h2>
            <p style="color: #666; line-height: 1.6;">
              Hi ${name}, you requested to reset your password. Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #7c3aed; word-break: break-all; font-size: 12px;">
              ${resetUrl}
            </p>
            <p style="color: #666; line-height: 1.6;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              The TeamLane Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Send password reset OTP (alternative method)
export async function sendPasswordResetOTP(email: string, otp: string) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"TeamLane" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset your TeamLane password - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">TeamLane</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
            <h2 style="color: #333;">Password Reset</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password. Please use the code below to reset your password:
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              The TeamLane Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send password reset OTP:', error);
    throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Send email to team members
export async function sendTeamEmail(
  recipients: string[],
  subject: string,
  message: string,
  eventName?: string
) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"TeamLane" <${process.env.SENDER_EMAIL}>`,
      to: recipients.join(', '),
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #7c3aed; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">TeamLane</h1>
            ${eventName ? `<p style="color: #e9d5ff; margin: 5px 0 0 0;">${eventName}</p>` : ''}
          </div>
          <div style="padding: 30px; background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">
              ${message}
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This email was sent from TeamLane Event Management System
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
              © ${new Date().getFullYear()} TeamLane. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send team email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
