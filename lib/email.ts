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
