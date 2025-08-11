import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }

  try {
    console.log(`Fetching coupons from ${startDate} to ${endDate}`);
    
    // Query PostgreSQL for coupons in date range
    const result = await query(
      'SELECT * FROM coupons WHERE date_created >= $1 AND date_created <= $2 ORDER BY created_at ASC',
      [startDate as string, endDate as string]
    );
    
    // Format the results to match expected structure
    const formattedCoupons = result.rows.map(row => ({
      id: row.id,
      couponCode: row.coupon_code,
      employeeId: row.employee_id,
      dateCreated: row.date_created,
      isUsed: row.is_used,
      createdAt: row.created_at,
      usedAt: row.used_at
    }));
    
    console.log(`Found ${formattedCoupons.length} coupons in date range`);
    
    return res.status(200).json(formattedCoupons);
    
  } catch (error: any) {
    console.error('Error retrieving coupons for date range:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve coupon data',
      error: error.message
    });
  }
}
    
