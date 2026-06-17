import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Get all inventory logs (Admin and Staff)
router.get('/logs', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const logs = await prisma.inventoryLog.findMany({
      include: {
        product: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Cap at 100 most recent logs
    });

    res.json(logs);
  } catch (error) {
    console.error('Fetch inventory logs error:', error);
    res.status(500).json({ message: 'Error retrieving inventory logs' });
  }
});

// Adjust inventory stock manually (Admin and Staff)
router.post('/adjust', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { productId, quantity, type, notes } = req.body; // type: STOCK_IN, STOCK_OUT

  if (!productId || !quantity || !type) {
    return res.status(400).json({ message: 'Product, quantity, and type are required' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const adjustQty = Number(quantity);

    if (type === 'STOCK_OUT' && product.stock < adjustQty) {
      return res.status(400).json({ message: 'Cannot reduce stock below 0' });
    }

    // Begin Prisma Transaction for adjustment
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Create log
      await tx.inventoryLog.create({
        data: {
          productId,
          quantity: adjustQty,
          type,
          notes: notes || 'Manual adjustment',
          userId: req.user.id
        }
      });

      // Update product stock
      return await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            [type === 'STOCK_IN' ? 'increment' : 'decrement']: adjustQty
          }
        }
      });
    });

    await logAuditAction(
      req.user.id,
      `Manually adjusted stock for ${product.name} (${type === 'STOCK_IN' ? '+' : '-'}${adjustQty})`,
      req
    );

    res.json({
      message: 'Stock adjusted successfully',
      stock: updatedProduct.stock
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Error adjusting stock' });
  }
});

export default router;
