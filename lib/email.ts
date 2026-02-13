import * as nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });
};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function testSMTPConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

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
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px;">
            <h1 style="color: #333; margin: 0;">TeamLane</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up for TeamLane! Please use the verification code below to complete your registration:
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This code will expire in 10 minutes.
            </p>
            <p style="color: #666; line-height: 1.6;">
              If you didn't create an account with TeamLane, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">
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

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"TeamLane" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset your TeamLane password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: hsl(270 70% 65%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: hsl(270 70% 65%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Your Password</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>We received a request to reset your password for your TeamLane account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: hsl(270 70% 65%);">${resetUrl}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>The TeamLane Team</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
