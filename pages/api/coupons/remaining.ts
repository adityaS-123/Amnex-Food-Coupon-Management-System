import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    let maxCoupons = 70;
    let guestCoupons = 20;
    let newEmployeeCoupons = 10;
    let openCoupons = 10; // Default limit for open coupons

    try {
      const settingsResult = await query(
        'SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($1, $2, $3, $4)',
        ['maxCoupons', 'guestCoupons', 'newEmployeeCoupons', 'openCoupons']
      );

      settingsResult.rows.forEach(row => {
        if (row.setting_key === 'maxCoupons') maxCoupons = parseInt(row.setting_value);
        if (row.setting_key === 'guestCoupons') guestCoupons = parseInt(row.setting_value);
        if (row.setting_key === 'newEmployeeCoupons') newEmployeeCoupons = parseInt(row.setting_value);
        if (row.setting_key === 'openCoupons') openCoupons = parseInt(row.setting_value);
      });
    } catch (settingsError) {
      console.log('Using default settings');
    }

    const couponCounts = await query(`
      SELECT coupon_type, COUNT(*) as count
      FROM coupons WHERE date_created = $1 
      GROUP BY coupon_type
    `, [today]);

    let employeeCoupons = 0;
    let usedGuestCoupons = 0;
    let usedNewEmployeeCoupons = 0;
    let usedOpenCoupons = 0;

    couponCounts.rows.forEach(row => {
      if (row.coupon_type === 'employee') employeeCoupons = parseInt(row.count);
      if (row.coupon_type === 'guest') usedGuestCoupons = parseInt(row.count);
      if (row.coupon_type === 'newEmployee') usedNewEmployeeCoupons = parseInt(row.count);
      if (row.coupon_type === 'open') usedOpenCoupons = parseInt(row.count);
    });

    const totalUsed = employeeCoupons + usedGuestCoupons + usedNewEmployeeCoupons;

    res.status(200).json({
      maxCoupons,
      totalUsed,
      remaining: maxCoupons - totalUsed,
      guestCoupons: {
        max: guestCoupons,
        used: usedGuestCoupons,
        remaining: guestCoupons - usedGuestCoupons
      },
      newEmployeeCoupons: {
        max: newEmployeeCoupons,
        used: usedNewEmployeeCoupons,
        remaining: newEmployeeCoupons - usedNewEmployeeCoupons
      },
      openCoupons: {
        max: openCoupons,
        used: usedOpenCoupons,
        remaining: openCoupons - usedOpenCoupons
      },
      employeeCoupons: {
        used: employeeCoupons,
        remaining: maxCoupons - totalUsed
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}