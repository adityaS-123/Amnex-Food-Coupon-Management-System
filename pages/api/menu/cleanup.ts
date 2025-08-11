import { NextApiRequest, NextApiResponse } from 'next';
import { cleanupOldMenus } from '../../../lib/fileStorage';

interface CleanupResponse {
  message: string;
  deletedCount?: number;
  failedCount?: number;
  totalProcessed?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await cleanupOldMenus();
    
    if (result.success) {
      res.status(200).json({
        message: 'Local file cleanup completed successfully',
        deletedCount: result.deletedCount,
        failedCount: result.failedCount,
        totalProcessed: result.totalProcessed,
      });
    } else {
      res.status(500).json({
        message: 'Local file cleanup failed',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      message: 'Cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
