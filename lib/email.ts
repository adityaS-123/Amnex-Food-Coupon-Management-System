import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add debug logging
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

export async function sendCouponEmail(
  employeeId: string,
  employeeEmail: string,
  couponCode: string,
  couponType: string = 'employee'
) {
  try {
    console.log('Email configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASS
    });

    // Verify SMTP connection first
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const couponTypeLabel = couponType === 'guest' ? 'Guest Coupon' : 
                           couponType === 'newEmployee' ? 'New Employee Coupon' : 
                           couponType === 'open' ? 'Open Coupon' :
                           'Employee Coupon';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .coupon-box { background: #FFD166; border: 2px dashed #FF6B35; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .coupon-code { font-size: 36px; font-weight: bold; color: #8B4513; font-family: 'Courier New', monospace; letter-spacing: 2px; }
          .coupon-type { background: #FF6B35; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; }
          .employee-info { background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ AMNEX Food Coupon</h1>
            <p>Your meal coupon is ready!</p>
          </div>
          
          <div class="content">
            <div class="employee-info">
              <h3>Hello ${employeeId}!</h3>
              <p>Your food coupon has been generated successfully for today's meal service.</p>
            </div>
            
            <div class="coupon-box">
              <div class="coupon-type">${couponTypeLabel}</div>
              <div class="coupon-code">${couponCode}</div>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Valid For:</strong> Today's meal service only</p>
            </div>
            
            <div style="text-align: left; background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">📋 Instructions:</h4>
              <ul style="margin: 10px 0;">
                <li>Present this coupon code at the cafeteria counter</li>
                <li>Show this email or mention the code: <strong>${couponCode}</strong></li>
                <li>This coupon is valid for today only</li>
                <li>One coupon per employee per day</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} AMNEX. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
            <p style="font-size: 12px; color: #999;">Employee ID: ${employeeId} | Email: ${employeeEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'AMNEX Food'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: employeeEmail,
      subject: `🍽️ Your AMNEX Food Coupon - ${couponCode}`,
      html: htmlContent,
      text: `Hello ${employeeId}, Your AMNEX food coupon: ${couponCode}. Valid for today's meal service. Present this code at the cafeteria.`
    };

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
