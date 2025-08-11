import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../utils/aws-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await query(`
      SELECT * FROM menu_files 
      WHERE is_active = TRUE 
      ORDER BY upload_date DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No menu found' });
    }

    const menuData = result.rows[0];
    const publicUrl = `/api/uploads/menus/${menuData.file_name}`;

    console.log('Menu PDF data:', menuData);

    res.status(200).json({
      pdfUrl: publicUrl,
      fileName: menuData.file_name,
      uploadDate: menuData.upload_date,
      originalName: menuData.original_name,
      size: menuData.file_size,
      source: 'local-storage'
    });

  } catch (error) {
    console.error('Error fetching menu PDF:', error);
    res.status(500).json({ 
      message: 'Failed to fetch menu PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
