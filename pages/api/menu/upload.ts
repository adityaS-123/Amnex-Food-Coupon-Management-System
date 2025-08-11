import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { uploadMenuFile, cleanupOldMenus } from '../../../lib/fileStorage';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('=== MENU UPLOAD API START ===');
  
  try {
    // Parse the form data
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const parseResult = await form.parse(req);
    const fields = parseResult[0];
    const files = parseResult[1];
    
    console.log('Form parsed:', { fields, files });

    const uploadedFile = Array.isArray(files.menuPdf) ? files.menuPdf[0] : files.menuPdf;
    
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (uploadedFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    console.log('File details:', {
      originalName: uploadedFile.originalFilename,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      filepath: uploadedFile.filepath
    });

    // Read the file buffer
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    console.log('File buffer size:', fileBuffer.length);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `menu-${timestamp}.pdf`;
    
    console.log('Uploading file with filename:', fileName);

    // Upload to local storage
    const uploadResult = await uploadMenuFile(fileBuffer, fileName);
    
    console.log('Upload result:', uploadResult);

    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult.error);
      return res.status(500).json({ 
        message: 'Failed to upload file', 
        error: uploadResult.error 
      });
    }

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    // Trigger cleanup of old files (async)
    cleanupOldMenus().then(cleanupResult => {
      console.log('Cleanup completed:', cleanupResult);
    }).catch(error => {
      console.error('Cleanup failed:', error);
    });

    console.log('=== MENU UPLOAD SUCCESS ===');

    res.status(200).json({
      message: 'Menu uploaded successfully to local storage',
      pdfUrl: uploadResult.url,
      fileName,
      uploadDate: new Date().toISOString(),
      debug: {
        storage: 'local-filesystem',
        originalSize: uploadedFile.size,
        uploadedSize: fileBuffer.length
      }
    });

  } catch (error) {
    console.error('=== MENU UPLOAD ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}


