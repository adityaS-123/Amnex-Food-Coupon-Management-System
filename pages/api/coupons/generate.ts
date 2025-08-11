import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { employeeId, employeeName, couponType } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Get current coupon counts
    const countResult = await query(`
      SELECT coupon_type, COUNT(*) as count
      FROM coupons WHERE date_created = $1
      GROUP BY coupon_type
    `, [today]);
    
    // Get settings for coupon limits
    const settingsResult = await query(`
      SELECT setting_key, setting_value FROM settings 
      WHERE setting_key IN ('maxCoupons', 'guestCoupons', 'newEmployeeCoupons')
    `);
    
    // Parse settings
    let maxCoupons = 70;
    let guestCoupons = 5;
    let newEmployeeCoupons = 10;
    
    settingsResult.rows.forEach(row => {
      if (row.setting_key === 'maxCoupons') maxCoupons = parseInt(row.setting_value);
      if (row.setting_key === 'guestCoupons') guestCoupons = parseInt(row.setting_value);
      if (row.setting_key === 'newEmployeeCoupons') newEmployeeCoupons = parseInt(row.setting_value);
    });
    
    // Calculate current usage
    let employeeCoupons = 0;
    let usedGuestCoupons = 0;
    let usedNewEmployeeCoupons = 0;
    let usedOpenCoupons = 0;
    
    countResult.rows.forEach(row => {
      if (row.coupon_type === 'employee') employeeCoupons = parseInt(row.count);
      if (row.coupon_type === 'guest') usedGuestCoupons = parseInt(row.count);
      if (row.coupon_type === 'newEmployee') usedNewEmployeeCoupons = parseInt(row.count);
      if (row.coupon_type === 'open') usedOpenCoupons = parseInt(row.count);
    });
    
    const totalUsed = employeeCoupons + usedGuestCoupons + usedNewEmployeeCoupons + usedOpenCoupons;
    
    // Check if total limit is reached
    if (totalUsed >= maxCoupons) {
      return res.status(400).json({ message: 'Maximum coupon limit reached for today' });
    }
    
    // Check coupon type specific limits
    if (couponType === 'guest' && usedGuestCoupons >= guestCoupons) {
      return res.status(400).json({ message: 'Guest coupon limit reached for today' });
    }
    
    if (couponType === 'newEmployee' && usedNewEmployeeCoupons >= newEmployeeCoupons) {
      return res.status(400).json({ message: 'New employee coupon limit reached for today' });
    }
    
    // Generate unique coupon code
    const couponCode = `${couponType.toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Save to database
    await query(`
      INSERT INTO coupons (coupon_code, employee_id, employee_name, coupon_type, date_created)
      VALUES ($1, $2, $3, $4, $5)
    `, [couponCode, employeeId, employeeName, couponType, today]);
    
    res.status(201).json({ 
      message: 'Coupon generated successfully',
      couponCode,
      remainingTotal: maxCoupons - (totalUsed + 1)
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error generating coupon',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
