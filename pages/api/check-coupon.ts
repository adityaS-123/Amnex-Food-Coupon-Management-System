import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Coupon code is required' });
  }

  try {
    // Check if coupon exists in PostgreSQL database
    const result = await query(
      'SELECT * FROM coupons WHERE coupon_code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Coupon not found',
        isValid: false 
      });
    }

    const coupon = result.rows[0];

    // Check if coupon is already used
    if (coupon.is_used) {
      return res.status(200).json({
        message: 'Coupon has already been used',
        isValid: false,
        coupon: {
          couponCode: coupon.coupon_code,
          employeeId: coupon.employee_id,
          dateCreated: coupon.date_created,
          isUsed: coupon.is_used,
          usedAt: coupon.used_at
        }
      });
    }

    // Check if coupon is for today
    const today = new Date().toISOString().split('T')[0];
    if (coupon.date_created !== today) {
      return res.status(200).json({
        message: 'Coupon is not valid for today',
        isValid: false,
        coupon: {
          couponCode: coupon.coupon_code,
          employeeId: coupon.employee_id,
          dateCreated: coupon.date_created,
          isUsed: coupon.is_used
        }
      });
    }

    // Coupon is valid
    return res.status(200).json({
      message: 'Coupon is valid',
      isValid: true,
      coupon: {
        couponCode: coupon.coupon_code,
        employeeId: coupon.employee_id,
        dateCreated: coupon.date_created,
        isUsed: coupon.is_used,
        createdAt: coupon.created_at
      }
    });

  } catch (error) {
    console.error('Error checking coupon:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

