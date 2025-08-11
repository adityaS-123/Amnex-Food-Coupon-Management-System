import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get employees from database
    const employeesResult = await query(`
      SELECT id, name, department 
      FROM employees 
      ORDER BY name ASC
    `);

    res.status(200).json(employeesResult.rows);
  } catch (error) {
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
