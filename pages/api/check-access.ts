import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Instead of returning a 403 with "Access Restricted",
  // return information about the current access state
  
  // Get settings (from your existing logic)
  const settings = {
    startTime: 12, // 12 PM
    startMinutes: 0,
    endTime: 13, // 1 PM
    endMinutes: 0,
    // ...other settings
  };
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  const startTotalMinutes = (settings.startTime * 60) + (settings.startMinutes || 0);
  const endTotalMinutes = (settings.endTime * 60) + (settings.endMinutes || 0);
  const currentTotalMinutes = (currentHour * 60) + currentMinutes;
  
  const isActive = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
  
  return res.status(200).json({
    isActive,
    startTime: `${settings.startTime}:${(settings.startMinutes || 0).toString().padStart(2, '0')}`,
    endTime: `${settings.endTime}:${(settings.endMinutes || 0).toString().padStart(2, '0')}`,
    currentTime: `${currentHour}:${currentMinutes.toString().padStart(2, '0')}`,
  });
}
