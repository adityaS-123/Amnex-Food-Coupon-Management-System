import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const getMenuFilePath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'menu.json');
};

const defaultMenu = {
  date: new Date().toISOString().split('T')[0],
  lunch: {
    items: ['Rice', 'Dal', 'Vegetable Curry', 'Roti'],
    time: '12:00 PM - 2:00 PM'
  },
  specialNote: 'Fresh and hygienic food served daily'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const menuFilePath = getMenuFilePath();

  if (req.method === 'GET') {
    try {
      let menu = defaultMenu;
      
      if (fs.existsSync(menuFilePath)) {
        const menuData = fs.readFileSync(menuFilePath, 'utf8');
        menu = JSON.parse(menuData);
      }
      
      return res.status(200).json(menu);
    } catch (error) {
      console.error('Error reading menu:', error);
      return res.status(200).json(defaultMenu);
    }
  }

  if (req.method === 'POST') {
    try {
      const menuData = req.body;
      
      // Add current date
      menuData.date = new Date().toISOString().split('T')[0];
      
      fs.writeFileSync(menuFilePath, JSON.stringify(menuData, null, 2));
      
      return res.status(200).json({
        success: true,
        message: 'Menu updated successfully',
        menu: menuData
      });
    } catch (error) {
      console.error('Error saving menu:', error);
      return res.status(500).json({
        message: 'Failed to save menu',
        error: error.message
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
      