import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Use the same JWT secret as in login.ts
const JWT_SECRET = 'amnex-food-attendance-officer-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      console.log('Token missing in verify request');
      return res.status(400).json({ message: 'Token is required' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
        role?: string;
        username?: string;
        name?: string;
      };
      console.log('Token verified successfully:', decoded);
      
      // Check if user has attendance officer role
      if (decoded.role !== 'attendance_officer') {
        console.log('User lacks attendance officer role:', decoded);
        return res.status(403).json({ message: 'Not authorized to mark attendance' });
      }

      return res.status(200).json({
        valid: true,
        user: {
          username: decoded.username || 'unknown',
          name: decoded.name || 'Unknown User'
        }
      });
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
