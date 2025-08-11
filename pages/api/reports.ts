import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Get all coupons within date range
    const couponsResult = await query(`
      SELECT 
        id,
        employee_id,
        coupon_code,
        coupon_type,
        date_created,
        created_at,
        is_used,
        used_at
      FROM coupons 
      WHERE date_created BETWEEN $1 AND $2
      ORDER BY created_at DESC
    `, [startDate, endDate]);

    const coupons = couponsResult.rows;

    // Calculate statistics
    const totalCoupons = coupons.length;
    const uniqueEmployees = new Set(coupons.map(c => c.employee_id)).size;
    
    // Group by employee
    const employeeStats = coupons.reduce((acc, coupon) => {
      const empId = coupon.employee_id;
      if (!acc[empId]) {
        acc[empId] = { employeeId: empId, couponCount: 0 };
      }
      acc[empId].couponCount++;
      return acc;
    }, {});

    // Group by date
    const dailyBreakdown = coupons.reduce((acc, coupon) => {
      const date = coupon.date_created;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Calculate sales stats (assuming each coupon has a value)
    const totalSales = coupons.reduce((sum, coupon) => sum + (coupon.amount || 0), 0);

    const reportData = {
      employeeStats: {
        totalUniqueEmployees: uniqueEmployees,
        activeEmployees: uniqueEmployees,
        employeeList: Object.values(employeeStats)
      },
      salesStats: {
        totalSales
      },
      orderStats: {
        totalOrders: totalCoupons
      },
      dateRange: {
        startDate,
        endDate
      },
      raw: coupons.map(coupon => ({
        employeeId: coupon.employee_id,
        couponCode: coupon.coupon_code,
        dateCreated: coupon.date_created,
        createdAt: coupon.created_at
      })),
      totalCoupons,
      dailyBreakdown
    };

    res.status(200).json(reportData);

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
