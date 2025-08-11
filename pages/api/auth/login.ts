import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Simple JWT secret for development
const JWT_SECRET = 'amnex-food-attendance-officer-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    console.log('Login attempt:', { username });

    // Hardcoded admin credentials for immediate testing
    if (username === 'admin' && password === 'admin@1234@5678') {
      // Generate JWT token
      const token = jwt.sign(
        { 
          username: 'admin',
          name: 'Admin Officer',
          role: 'attendance_officer'
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Return success with token
      return res.status(200).json({
        message: 'Login successful',
        token,
        name: 'Admin Officer'
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
