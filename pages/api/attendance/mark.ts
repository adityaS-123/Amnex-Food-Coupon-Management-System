import { NextApiRequest, NextApiResponse } from 'next';
import { pool, query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Use a transaction for atomic operations
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    const { couponCode, employeeId } = req.body;

    if (!couponCode) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find the coupon
    const couponResult = await client.query(
      'SELECT * FROM coupons WHERE coupon_code = $1 AND date_created = $2 FOR UPDATE', // Add FOR UPDATE to lock the row
      [couponCode, today]
    );

    if (couponResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Invalid coupon code or coupon expired' });
    }

    const coupon = couponResult.rows[0];

    // Check if attendance already marked
    const existingAttendance = await client.query(
      'SELECT * FROM attendance WHERE coupon_id = $1 AND attendance_date = $2',
      [coupon.id, today]
    );

    if (existingAttendance.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        message: 'Attendance already marked for this coupon',
        attendance: {
          employeeId: existingAttendance.rows[0].employee_id,
          couponCode: couponCode,
          isPresent: existingAttendance.rows[0].is_present,
          markedAt: existingAttendance.rows[0].attendance_marked_at
        }
      });
    }

    // Mark attendance
    const attendanceResult = await client.query(`
      INSERT INTO attendance (coupon_id, employee_id, attendance_date, is_present, attendance_marked_at)
      VALUES ($1, $2, $3, TRUE, NOW())
      RETURNING *
    `, [coupon.id, coupon.employee_id, today]);

    // Update coupon as used
    await client.query(
      'UPDATE coupons SET is_used = TRUE, used_at = NOW() WHERE id = $1',
      [coupon.id]
    );

    // Commit the transaction
    await client.query('COMMIT');

    const attendance = attendanceResult.rows[0];

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance: {
        employeeId: attendance.employee_id,
        couponCode: coupon.coupon_code,
        isPresent: attendance.is_present,
        markedAt: attendance.attendance_marked_at
      }
    });

  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    // Release client back to pool
    client.release();
  }
}
