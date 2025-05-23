import nodemailer from 'nodemailer';
import { generateRandomPassword } from '../utils/password';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

interface InviteAffiliateEmailOptions {
  email: string;
  password: string;
  tenantName: string;
  inviteLink: string;
}

export const emailService = {
  /**
   * Send an invitation email to a potential affiliate
   */
  sendAffiliateInvitation: async (options: InviteAffiliateEmailOptions) => {
    const { email, password, tenantName, inviteLink } = options;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'affiliates@example.com',
      to: email,
      subject: `You've been invited to join ${tenantName}'s Affiliate Program`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${tenantName}'s Affiliate Program</h2>
          <p>You have been invited to become an affiliate partner. This is a great opportunity to earn commissions by promoting our products.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f7f7f7; border-radius: 5px;">
            <p><strong>Your login credentials:</strong></p>
            <p>Email: ${email}</p>
            <p>Temporary Password: ${password}</p>
            <p style="color: #ff4500;">Please change your password after logging in for the first time.</p>
          </div>
          
          <a href="${inviteLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accept Invitation & Login
          </a>
          
          <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
          
          <p style="margin-top: 40px; font-size: 12px; color: #666;">
            If you didn't expect this invitation, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      console.log('Attempting to send email to:', email);
      const info = await transporter.sendMail(mailOptions);
      console.log('Affiliate invitation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending affiliate invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  },
}; 