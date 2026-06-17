import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs (Admin only)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100 // Return the 100 most recent logs
    });

    res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ message: 'Error retrieving audit logs' });
  }
});

export default router;
