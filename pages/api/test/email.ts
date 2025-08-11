import { NextApiRequest, NextApiResponse } from 'next';
import { sendCouponEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log environment variables for debugging
    console.log('Email environment check:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      FROM_EMAIL: process.env.FROM_EMAIL,
      hasPassword: !!process.env.SMTP_PASS
    });

    const { employeeId, email, couponCode, couponType } = req.body;

    // Use defaults if not provided
    const testEmployeeId = employeeId || 'TEST001';
    const testEmail = email || 'test@amnex.com'; // Replace with your test email
    const testCouponCode = couponCode || 'TEST-001-12/18/24';
    const testCouponType = couponType || 'employee';

    console.log('Testing email with:', {
      employeeId: testEmployeeId,
      email: testEmail,
      couponCode: testCouponCode,
      couponType: testCouponType
    });

    const result = await sendCouponEmail(testEmployeeId, testEmail, testCouponCode, testCouponType);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        testData: {
          employeeId: testEmployeeId,
          email: testEmail,
          couponCode: testCouponCode,
          couponType: testCouponType
        },
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        testData: {
          employeeId: testEmployeeId,
          email: testEmail,
          couponCode: testCouponCode,
          couponType: testCouponType
        }
      });
    }

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
