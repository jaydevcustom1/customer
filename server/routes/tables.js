import express from 'express';
import QRCode from 'qrcode';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Get all tables (Publicly accessible for client table validation)
router.get('/', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
    });
    res.json(tables);
  } catch (error) {
    console.error('Fetch tables error:', error);
    res.status(500).json({ message: 'Error retrieving tables' });
  }
});

// Create table (Admin and Staff)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { tableNumber } = req.body;

  if (!tableNumber) {
    return res.status(400).json({ message: 'Table number is required' });
  }

  try {
    const existing = await prisma.table.findUnique({ where: { tableNumber } });
    if (existing) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    // Generate table-specific client URL
    // Format: http://<origin>/menu?table=<tableNumber>
    // Since we don't know the exact client URL, we use a relative link or localhost fallback, or just store the tableNumber in QR
    // Better yet: we store the full URL path, which makes scanning take the user straight to the menu page.
    const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
    const qrData = `${clientOrigin}/menu?table=${encodeURIComponent(tableNumber)}`;

    // Generate base64 QR Code
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 1000,
      color: {
        dark: '#0f172a',  // dark slate
        light: '#ffffff'
      }
    });

    const table = await prisma.table.create({
      data: {
        tableNumber,
        qrCode: qrCodeBase64,
        status: 'AVAILABLE'
      }
    });

    await logAuditAction(req.user.id, `Created Table: ${table.tableNumber}`, req);

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Error creating table' });
  }
});

// Update table status (Admin, Kitchen, Staff)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // AVAILABLE, OCCUPIED, RESERVED

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const table = await prisma.table.update({
      where: { id },
      data: { status }
    });

    await logAuditAction(req.user.id, `Updated Table ${table.tableNumber} status to ${status}`, req);

    res.json(table);
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({ message: 'Error updating table status' });
  }
});

// Delete table (Admin)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const table = await prisma.table.delete({
      where: { id }
    });

    await logAuditAction(req.user.id, `Deleted Table: ${table.tableNumber}`, req);

    res.json({ message: 'Table deleted successfully', table });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Error deleting table' });
  }
});

export default router;
