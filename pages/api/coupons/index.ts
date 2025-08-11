import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';
import nodemailer from 'nodemailer';

// Helper function to check if current time is within allowed hours
function isWithinAllowedTime(settings: any): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  const startTimeInMinutes = (settings.startTime || 10) * 60 + (settings.startMinutes || 0);
  const endTimeInMinutes = (settings.endTime || 23) * 60 + (settings.endMinutes || 0);
  
  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  
}


// Helper function to generate sequential number for today
async function generateSequentialNumber(): Promise<string> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      'SELECT COUNT(*) as count FROM coupons WHERE date_created = $1',
      [today]
    );
    const count = parseInt(result.rows[0].count) + 1;
    return count.toString(); // Return as string without padding
  } catch (error) {
    console.error('Error generating sequence number:', error);
    return '1';
  }
}

// Helper function to get employee email
async function getEmployeeEmail(employeeId: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT email FROM employees WHERE employee_id = $1 AND is_active = TRUE',
      [employeeId]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].email;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting employee email:', error);
    return null;
  }
}

// Send coupon email
async function sendCouponEmail(employeeId: string, couponCode: string) {
  try {
    console.log(`Looking up email for employee: ${employeeId}`);
    
    // Get employee email from database with explicit schema
    const employeeResult = await query(
      'SELECT email, full_name FROM fcms_scm.employees WHERE employee_id = $1 AND is_active = TRUE',
      [employeeId]
    );
    
    console.log(`Query result for ${employeeId}:`, employeeResult.rows);
    
    if (employeeResult.rows.length === 0) {
      console.log(`No active employee found with ID ${employeeId}`);
      return { success: false, error: 'Employee not found or inactive' };
    }
    
    const employee = employeeResult.rows[0];
    const employeeEmail = employee.email;
    const employeeName = employee.full_name;
    
    if (!employeeEmail) {
      console.log(`No email address found for employee ${employeeId}`);
      return { success: false, error: 'Employee email address not available' };
    }
    
    console.log(`Sending email to: ${employeeEmail} for employee: ${employeeName}`);
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Generate QR code as buffer for attachment
    const QRCode = require('qrcode');
    const attendanceUrl = `${process.env.BASE_URL || 'https://fms.amnex.co.in/'}/scan-qr?code=${encodeURIComponent(couponCode)}&auto=true`;
    const qrCodeBuffer = await QRCode.toBuffer(attendanceUrl, {
      width: 200,
      color: {
        dark: '#8B4513',
        light: '#FFFFFF'
      }
    });
    
    // Email HTML template with attached QR code
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .coupon-code { background: #FFD166; color: #8B4513; font-size: 24px; font-weight: bold; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #FF6B35; font-family: 'Courier New', monospace; }
          .qr-section { text-align: center; margin: 20px 0; background: #FFF8E1; padding: 20px; border-radius: 8px; }
          .qr-code { margin: 15px 0; }
          .footer { background: #FFF8E1; padding: 20px; text-align: center; color: #8B4513; }
          .note { background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196F3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ AMNEX Food Coupon</h1>
            <p>Your daily meal coupon is ready!</p>
          </div>
          <div class="content">
            <h2>Hello ${employeeName || employeeId},</h2>
            <p>Your food coupon for <strong>${new Date().toLocaleDateString()}</strong> has been generated successfully.</p>
            
            <div class="coupon-code">
              ${couponCode}
            </div>
            
            <div class="qr-section">
              <h3>📱 QR Code for Attendance</h3>
              <p>Scan the attached QR code image to mark your attendance:</p>
              <div class="qr-code">
                <img src="cid:qrcode" alt="QR Code for ${couponCode}" style="border: 2px solid #8B4513; border-radius: 8px; max-width: 200px;">
              </div>
              <p style="font-size: 12px; color: #666;">Show the QR code attachment at the cafeteria</p>
            </div>
            
            <div class="note">
              <h3>📋 Important Notes:</h3>
              <ul>
                <li>This coupon is valid only for today's meal service</li>
                <li>Present this coupon at the cafeteria</li>
                <li>Scan the attached QR code to mark your attendance</li>
                <li>Keep this email for your records</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>📅 Generated on: ${new Date().toLocaleString()}</p>
            <p>© ${new Date().getFullYear()} AMNEX Food Services</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email with QR code attachment
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'AMNEX Food Services'}" <${process.env.FROM_EMAIL}>`,
      to: employeeEmail,
      subject: `🍽️ AMNEX Food Coupon - ${couponCode} (${new Date().toLocaleDateString()})`,
      html: emailHtml,
      attachments: [
        {
          filename: `QR_Code_${couponCode}.png`,
          content: qrCodeBuffer,
          cid: 'qrcode' // Referenced in the HTML as cid:qrcode
        }
      ]
    };
    
    console.log('Sending email with QR code attachment:', { to: mailOptions.to, subject: mailOptions.subject });
    
    await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${employeeEmail}`);
    return { success: true, email: employeeEmail };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`API Request: ${req.method} ${req.url}`);
  
  if (req.method === 'POST') {
    try {
      const { employeeId, sendEmail } = req.body;

      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required' });
      }

      // First, verify if employee ID exists in the database
      const employeeResult = await query(
        'SELECT employee_id, full_name, email FROM employees WHERE employee_id = $1 AND is_active = TRUE',
        [employeeId]
      );

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({
          message: "Employee ID not found or inactive. Please contact admin for further details."
        });
      }

      const employee = employeeResult.rows[0];
      const employeeName = employee.full_name;

      const today = new Date().toISOString().split('T')[0];

      // Check if employee already has a coupon for today FIRST
      const existingCoupon = await query(
        'SELECT * FROM coupons WHERE employee_id = $1 AND date_created = $2',
        [employeeId, today]
      );

      if (existingCoupon.rows.length > 0) {
        console.log('Employee already has a coupon for today, returning existing coupon');
        
        let emailResult = null;
        if (sendEmail) {
          console.log('Sending existing coupon via email...');
          emailResult = await sendCouponEmail(employeeId, existingCoupon.rows[0].coupon_code);
        }
        
        return res.status(200).json({
          success: true,
          message: emailResult?.success 
            ? 'You already have a coupon for today! Your existing coupon has been sent to your email.' 
            : 'You already have a coupon for today. Only one coupon per day is allowed.',
          coupon: {
            couponCode: existingCoupon.rows[0].coupon_code,
            employeeId: existingCoupon.rows[0].employee_id,
            employeeName: employeeName, // Add employee name to response
            dateCreated: existingCoupon.rows[0].date_created,
            isUsed: existingCoupon.rows[0].is_used,
            createdAt: existingCoupon.rows[0].created_at
          },
          isExisting: true,
          emailSent: emailResult?.success || false,
          employeeEmail: emailResult?.email || null,
          emailError: emailResult?.error || null
        });
      }

      // Only proceed with new coupon generation if no existing coupon found
      console.log('No existing coupon found, proceeding with validation and generation...');

      // Get settings for time and limit checks
      let settings = {
        maxCoupons: 70,
        startTime: 10,
        startMinutes: 0,
        endTime: 23,
        endMinutes: 0
      };

      try {
        const settingsResult = await query(
          'SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($1, $2, $3, $4, $5)',
          ['maxCoupons', 'startTime', 'startMinutes', 'endTime', 'endMinutes']
        );

        settingsResult.rows.forEach(row => {
          settings[row.setting_key] = parseInt(row.setting_value);
        });
      } catch (settingsError) {
        console.log('Using default settings');
      }

      // Check time restrictions for NEW coupons only
      console.log('Checking time restrictions for new coupon...');
      if (!isWithinAllowedTime(settings)) {
        const formatTime = (hours, minutes) => {
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        const startTimeFormatted = formatTime(settings.startTime, settings.startMinutes || 0);
        const endTimeFormatted = formatTime(settings.endTime, settings.endMinutes || 0);
        
        console.log('Time restriction enforced:', startTimeFormatted, 'to', endTimeFormatted);
        return res.status(403).json({ 
          message: `Coupon generation is only allowed between ${startTimeFormatted} and ${endTimeFormatted}` 
        });
      }

      // Check daily limit
      const dailyCountResult = await query(
        'SELECT COUNT(*) as count FROM coupons WHERE date_created = $1',
        [today]
      );
      const dailyCount = parseInt(dailyCountResult.rows[0].count);

      if (dailyCount >= settings.maxCoupons) {
        return res.status(403).json({ 
          message: `Daily coupon limit of ${settings.maxCoupons} has been reached` 
        });
      }

      // Generate coupon code in AMNEX-X-M/D/YY format
      const sequenceNumber = await generateSequentialNumber();
      const dateObj = new Date();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      const year = dateObj.getFullYear().toString().substr(-2);
      const formattedDate = `${month}/${day}/${year}`;
      const finalCouponCode = `AMNEX-${sequenceNumber}-${formattedDate}`;

      // Create new coupon
      const result = await query(`
        INSERT INTO coupons (employee_id, coupon_code, date_created, created_at, is_used)
        VALUES ($1, $2, $3, NOW(), FALSE)
        RETURNING *
      `, [employeeId, finalCouponCode, today]);

      const coupon = result.rows[0];

      console.log('Coupon saved successfully:', coupon.coupon_code);

      // Send email if requested
      let emailResult = null;
      if (sendEmail) {
        emailResult = await sendCouponEmail(employeeId, finalCouponCode);
      }
      
      // When returning a new coupon, include employee name
      return res.status(201).json({ 
        success: true, 
        message: emailResult?.success ? 'Coupon created and email sent successfully!' : 'Coupon created successfully',
        coupon: {
          id: coupon.id,
          couponCode: coupon.coupon_code,
          employeeId: coupon.employee_id,
          employeeName: employeeName, // Add employee name to response
          dateCreated: coupon.date_created,
          isUsed: coupon.is_used,
          createdAt: coupon.created_at
        },
        isExisting: false,
        emailSent: emailResult?.success || false,
        employeeEmail: emailResult?.email || null,
        emailError: emailResult?.error || null
      });

    } catch (error: any) {
      console.error('Error creating coupon:', error);
      return res.status(500).json({ 
        message: 'Failed to create coupon',
        error: error.message 
      });
    }
  } else if (req.method === 'GET') {
  try {
    const { date } = req.query;
    console.log('Fetching coupons for date:', date);
    
    if (date) {
      try {
        const result = await query(
          'SELECT * FROM coupons WHERE date_created = $1 ORDER BY created_at DESC',
          [date]
        );
        
        const formattedCoupons = result.rows.map(row => ({
          id: row.id,
          couponCode: row.coupon_code,
          employeeId: row.employee_id,
          dateCreated: row.date_created,
          isUsed: row.is_used,
          createdAt: row.created_at
        }));
        
        return res.status(200).json(formattedCoupons);
      } catch (queryError: any) {
        console.error('Query Error:', queryError);
        return res.status(500).json({ message: 'Error querying coupons' });
      }
    } else {
      const result = await query('SELECT * FROM coupons ORDER BY created_at DESC LIMIT 100');
      const formattedCoupons = result.rows.map(row => ({
        id: row.id,
        couponCode: row.coupon_code,
        employeeId: row.employee_id,
        dateCreated: row.date_created,
        isUsed: row.is_used,
        createdAt: row.created_at
      }));
      return res.status(200).json(formattedCoupons);
    }
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch coupons',
      error: error.message 
    });
  }
}}