import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get total coupon count
    const totalResult = await query('SELECT COUNT(*) as count FROM coupons');
    const totalCount = parseInt(totalResult.rows[0].count);

    // Get today's coupon count
    const today = new Date().toISOString().split('T')[0];
    const todayResult = await query(
      'SELECT COUNT(*) as count FROM coupons WHERE date_created = $1',
      [today]
    );
    const todayCount = parseInt(todayResult.rows[0].count);

    // Get unique employees count for today
    const employeeResult = await query(
      'SELECT COUNT(DISTINCT employee_id) as count FROM coupons WHERE date_created = $1',
      [today]
    );
    const employeeCount = parseInt(employeeResult.rows[0].count);

    res.status(200).json({
      totalCount,
      todayCount,
      employeeCount
    });

  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

