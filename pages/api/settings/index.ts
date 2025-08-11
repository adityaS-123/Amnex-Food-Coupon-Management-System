import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');

// Ensure the data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Default settings
const defaultSettings = {
  maxCoupons: 70,
  startTime: 10,
  startMinutes: 0,
  endTime: 16,
  endMinutes: 0,
  guestCoupons: 20,
  newEmployeeCoupons: 10
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureDataDirectory();
  
  // GET request - return current settings
  if (req.method === 'GET') {
    try {
      if (fs.existsSync(settingsFilePath)) {
        const settingsData = fs.readFileSync(settingsFilePath, 'utf8');
        const settings = JSON.parse(settingsData);
        console.log('Sending settings to client:', settings);
        return res.status(200).json(settings);
      } else {
        // If settings file doesn't exist, create it with defaults
        fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
        return res.status(200).json(defaultSettings);
      }
    } catch (error) {
      console.error('Error reading settings:', error);
      return res.status(500).json({ message: 'Failed to read settings', error: error.message });
    }
  }
  
  // POST request - update settings
  if (req.method === 'POST') {
    try {
      const updatedSettings = req.body;
      
      console.log('RECEIVED SETTINGS UPDATE:', JSON.stringify(updatedSettings, null, 2));
      
      // IMPORTANT: Save exactly what was received without applying any defaults
      fs.writeFileSync(settingsFilePath, JSON.stringify(updatedSettings, null, 2));
      
      // Read back from file to confirm what was saved
      const savedSettings = JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      console.log('CONFIRMED SAVED SETTINGS:', JSON.stringify(savedSettings, null, 2));
      
      return res.status(200).json({ 
        message: 'Settings updated successfully',
        settings: savedSettings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ message: 'Failed to update settings', error: error.message });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}