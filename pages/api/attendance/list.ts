import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { date, status } = req.query;
    const attendanceDate = date || new Date().toISOString().split('T')[0];

    // Get attendance data with coupon information
    let queryText = `
      SELECT 
        c.employee_id,
        c.coupon_code,
        c.coupon_type,
        a.is_present,
        a.attendance_marked_at,
        c.created_at
      FROM coupons c
      LEFT JOIN attendance a ON c.id = a.coupon_id AND a.attendance_date = $1
      WHERE c.date_created = $1
    `;

    const queryParams = [attendanceDate];

    if (status && status !== 'all') {
      if (status === 'present') {
        queryText += ' AND a.is_present = TRUE';
      } else if (status === 'absent') {
        queryText += ' AND (a.is_present = FALSE OR a.is_present IS NULL)';
      }
    }

    queryText += ' ORDER BY c.created_at DESC';

    const result = await query(queryText, queryParams);

    const attendanceList = result.rows.map(row => ({
      employeeId: row.employee_id,
      couponCode: row.coupon_code,
      couponType: row.coupon_type,
      isPresent: row.is_present || false,
      attendanceMarkedAt: row.attendance_marked_at
    }));

    const totalCoupons = attendanceList.length;
    const presentCount = attendanceList.filter(item => item.isPresent).length;
    const absentCount = totalCoupons - presentCount;
    const attendanceRate = totalCoupons > 0 ? Math.round((presentCount / totalCoupons) * 100) : 0;

    res.status(200).json({
      attendanceList,
      totalCoupons,
      presentCount,
      absentCount,
      summary: {
        attendanceRate,
        date: attendanceDate
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
      