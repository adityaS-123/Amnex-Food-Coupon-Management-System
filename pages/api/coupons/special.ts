import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { couponType, couponCode } = req.body;
    
    // Add 'open' as a valid coupon type
    if (!couponType || !['guest', 'newEmployee', 'open'].includes(couponType)) {
      return res.status(400).json({ message: 'Invalid coupon type' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get limits from settings
    let maxCoupons = couponType === 'guest' ? 20 : 10;
    try {
      const settingKey = couponType === 'guest' ? 'guestCoupons' : 'newEmployeeCoupons';
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

    // Check daily limits
    const todayCount = await query(
      'SELECT COUNT(*) as count FROM coupons WHERE coupon_type = $1 AND date_created = $2',
      [couponType, today]
    );

    let remainingCount = 0;
    
    if (couponType === 'guest') {
      remainingCount = maxCoupons - parseInt(todayCount.rows[0].count) - 1;
    } else if (couponType === 'newEmployee') {
      remainingCount = maxCoupons - parseInt(todayCount.rows[0].count) - 1;
    } else if (couponType === 'open') {
      // Open coupons don't have limits
      remainingCount = 999; // Set a high number to indicate unlimited
    }
    
    if (remainingCount <= 0 && couponType !== 'open') {
      return res.status(403).json({
        message: `Daily limit reached for ${couponType} coupons`
      });
    }

    // Insert special coupon
    const result = await query(`
      INSERT INTO coupons (employee_id, coupon_code, date_created, created_at, is_used, coupon_type)
      VALUES ($1, $2, $3, NOW(), FALSE, $4)
      RETURNING *
    `, [
      couponType === 'guest' ? 'GUEST' : couponType === 'newEmployee' ? 'NEW_EMP' : 'OPEN',
      couponCode,
      today,
      couponType
    ]);

    const coupon = result.rows[0];

    res.status(201).json({
      message: 'Special coupon created successfully',
      coupon: {
        id: coupon.id,
        couponCode: coupon.coupon_code,
        couponType: coupon.coupon_type,
        dateCreated: coupon.date_created,
        createdAt: coupon.created_at
      },
      remaining: remainingCount
    });

  } catch (error) {
    console.error('Error creating special coupon:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}