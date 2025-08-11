import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { couponType, couponCode } = req.body;

    if (!couponType || !couponCode) {
      return res.status(400).json({ message: 'Coupon type and code are required' });
    }

    if (!['guest', 'newEmployee', 'open'].includes(couponType)) {
      return res.status(400).json({ message: 'Invalid coupon type' });
    }

    const today = new Date().toISOString().split('T')[0];

    let maxCoupons = 10; // Default limit
    try {
      let settingKey;
      if (couponType === 'guest') settingKey = 'guestCoupons';
      else if (couponType === 'newEmployee') settingKey = 'newEmployeeCoupons';
      else if (couponType === 'open') settingKey = 'openCoupons';
      
      const settingResult = await query(
        'SELECT setting_value FROM settings WHERE setting_key = $1',
        [settingKey]
      );
      if (settingResult.rows.length > 0) {
        maxCoupons = parseInt(settingResult.rows[0].setting_value);
      }
    } catch (settingsError) {
      console.log('Using default limits');
    }

    const todayCount = await query(
      'SELECT COUNT(*) as count FROM coupons WHERE coupon_type = $1 AND date_created = $2',
      [couponType, today]
    );

    if (parseInt(todayCount.rows[0].count) >= maxCoupons) {
      return res.status(409).json({ 
        message: `Daily limit for ${couponType} coupons reached` 
      });
    }

    const result = await query(`
      INSERT INTO coupons (employee_id, coupon_code, coupon_type, date_created, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [couponType.toUpperCase(), couponCode, couponType, today]);

    const coupon = result.rows[0];
    const remaining = maxCoupons - parseInt(todayCount.rows[0].count) - 1;

    res.status(201).json({
      message: 'Special coupon created successfully',
      coupon: {
        id: coupon.id,
        couponCode: coupon.coupon_code,
        couponType: coupon.coupon_type,
        dateCreated: coupon.date_created,
        createdAt: coupon.created_at,
        type: coupon.coupon_type
      },
      remaining
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}