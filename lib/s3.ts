import fs from 'fs';
import path from 'path';
import { query } from '../utils/aws-config';

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

interface CleanupResult {
  success: boolean;
  deletedCount?: number;
  failedCount?: number;
  totalProcessed?: number;
  error?: string;
}

export const uploadMenuToS3 = async (
  file: Buffer, 
  fileName: string
): Promise<UploadResult> => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'menus');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file);
    
    // Deactivate old menu files
    await query(`UPDATE menu_files SET is_active = FALSE WHERE is_active = TRUE`);
    
    // Save metadata to database
    await query(`
      INSERT INTO menu_files (file_name, original_name, file_path, file_size)
      VALUES ($1, $2, $3, $4)
    `, [fileName, fileName, filePath, file.length]);
    
    // Create public URL that can be served by Next.js
    const publicUrl = `/api/uploads/menus/${fileName}`;
    
    return {
      success: true,
      url: publicUrl,
      key: `menus/${fileName}`,
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const deleteFromS3 = async (key: string) => {
  try {
    const fileName = key.replace('menus/', '');
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'menus');
    const filePath = path.join(uploadDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const listS3Objects = async (prefix: string = 'menus/') => {
  try {
    const result = await query(`
      SELECT file_name as key, file_size as size, upload_date as lastmodified 
      FROM menu_files 
      WHERE is_active = TRUE 
      ORDER BY upload_date DESC
    `);
    
    return { success: true, objects: result.rows };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getSignedUrlForS3 = async (key: string) => {
  const fileName = key.replace('menus/', '');
  const publicUrl = `/uploads/menus/${fileName}`;
  return { success: true, url: publicUrl };
};

export const cleanupOldMenus = async (): Promise<CleanupResult> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 8);
    
    const oldFiles = await query(`
      SELECT file_path FROM menu_files 
      WHERE upload_date < $1 AND is_active = TRUE
    `, [cutoffDate]);
    
    let deletedCount = 0;
    for (const file of oldFiles.rows) {
      try {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Failed to delete file: ${file.file_path}`, err);
      }
    }
    
    await query(`
      UPDATE menu_files 
      SET is_active = FALSE 
      WHERE upload_date < $1
    `, [cutoffDate]);
    
    return {
      success: true,
      deletedCount,
      failedCount: 0,
      totalProcessed: oldFiles.rows.length,
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
