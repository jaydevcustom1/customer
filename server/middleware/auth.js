import jwt from 'jsonwebtoken';
import prisma from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforqrmenuapp2026');
    
    // Set user details directly from the verified token payload to save database queries
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name || '',
      email: decoded.email || ''
    };
    
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access for this user role' });
    }
    next();
  };
};
