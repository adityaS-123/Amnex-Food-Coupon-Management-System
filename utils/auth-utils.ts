import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SECRET_KEY_FILE = path.join(process.cwd(), 'data', 'jwt-secret.key');

// Function to generate or retrieve JWT secret
export function getJwtSecret(): string {
  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if secret key file exists
    if (fs.existsSync(SECRET_KEY_FILE)) {
      // Read existing secret
      return fs.readFileSync(SECRET_KEY_FILE, 'utf8').trim();
    } else {
      // Generate a new strong random secret
      const newSecret = crypto.randomBytes(64).toString('hex');
      
      // Save the secret to file
      fs.writeFileSync(SECRET_KEY_FILE, newSecret);
      console.log('New JWT secret key generated and saved');
      
      return newSecret;
    }
  } catch (error) {
    console.error('Error managing JWT secret key:', error);
    // Fallback to default only if file operations fail
    return 'amnex-food-attendance-officer-secret-key-default';
  }
}
