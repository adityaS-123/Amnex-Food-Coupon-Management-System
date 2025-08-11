import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT setting_key, setting_value FROM settings');
      
      const settings: any = {
        maxCoupons: 70,
        startTime: 10,
        startMinutes: 0,
        endTime: 23,
        endMinutes: 0,
        guestCoupons: 20,
        newEmployeeCoupons: 10
      };

      result.rows.forEach(row => {
        const value = row.setting_value;
        if (['maxCoupons', 'startTime', 'startMinutes', 'endTime', 'endMinutes', 'guestCoupons', 'newEmployeeCoupons'].includes(row.setting_key)) {
          settings[row.setting_key] = parseInt(value);
        } else {
          settings[row.setting_key] = value;
        }
      });

      res.status(200).json(settings);

    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const settings = req.body;

      // Update or insert settings
      for (const [key, value] of Object.entries(settings)) {
        await query(`
          INSERT INTO settings (setting_key, setting_value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (setting_key)
          DO UPDATE SET setting_value = $2, updated_at = NOW()
        `, [key, String(value)]);
      }

      res.status(200).json({
        message: 'Settings updated successfully',
        settings
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
