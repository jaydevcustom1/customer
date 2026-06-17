import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Get settings (Publicly accessible for client shop metadata)
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      // Create default if none exists
      settings = await prisma.setting.create({
        data: {
          restaurantName: 'E-Menu Bistro',
          logo: '',
          address: '123 Gourmet Blvd, Foodie City',
          phone: '+1 (555) 019-2834',
          tax: 10.00,
          serviceFee: 5.00,
          currency: 'USD'
        }
      });
    }

    res.json({
      ...settings,
      tax: Number(settings.tax),
      serviceFee: Number(settings.serviceFee)
    });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ message: 'Error retrieving settings' });
  }
});

// Update settings (Admin only)
router.put('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { restaurantName, logo, address, phone, tax, serviceFee, currency } = req.body;

  try {
    let settings = await prisma.setting.findFirst();

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          restaurantName: restaurantName || 'E-Menu Bistro',
          logo: logo || '',
          address: address || '',
          phone: phone || '',
          tax: Number(tax || 0),
          serviceFee: Number(serviceFee || 0),
          currency: currency || 'USD'
        }
      });
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          restaurantName: restaurantName !== undefined ? restaurantName : undefined,
          logo: logo !== undefined ? logo : undefined,
          address: address !== undefined ? address : undefined,
          phone: phone !== undefined ? phone : undefined,
          tax: tax !== undefined ? Number(tax) : undefined,
          serviceFee: serviceFee !== undefined ? Number(serviceFee) : undefined,
          currency: currency !== undefined ? currency : undefined
        }
      });
    }

    await logAuditAction(req.user.id, 'Updated Restaurant Settings', req);

    res.json({
      ...settings,
      tax: Number(settings.tax),
      serviceFee: Number(settings.serviceFee)
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

export default router;
