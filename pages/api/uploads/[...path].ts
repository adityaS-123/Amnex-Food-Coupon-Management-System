import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: filePath } = req.query;
  
  if (!filePath || !Array.isArray(filePath)) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const fullPath = path.join(uploadDir, ...filePath);
  
  // Security check - ensure the file is within the upload directory
  if (!fullPath.startsWith(uploadDir)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  try {
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
}
