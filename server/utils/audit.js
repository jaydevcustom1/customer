import prisma from '../db.js';

export const logAuditAction = async (userId, action, req = null) => {
  try {
    let ipAddress = 'unknown';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    }
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};
