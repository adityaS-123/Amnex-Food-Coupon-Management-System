import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { date } = req.query;

  try {
    let result;
    
    if (date) {
      // Count coupons for specific date
      result = await query('SELECT COUNT(*) AS count FROM coupons WHERE date_created = $1', [date as string]);
      const count = parseInt(result.rows[0].count, 10);
      
      return res.status(200).json({
        count,
        date: date as string
      });
    } else {
      // Count all coupons in the database
      result = await query('SELECT COUNT(*) AS count FROM coupons');
      const count = parseInt(result.rows[0].count, 10);

      return res.status(200).json({ count });
    }
  } catch (error: any) {
    console.error('Error counting coupons:', error);
    return res.status(500).json({ 
      message: 'Failed to count coupons', 
      error: error.message 
    });
  }
}
