import express from 'express';
import prisma from '../db.js';
import { getIO } from '../socket.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Generate unique receipt number
const generateReceiptNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const randomStr = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `REC-${dateStr}-${randomStr}`;
};

// 1. Customer Checkout (Public)
router.post('/checkout', async (req, res) => {
  const { customerName, tableId, items, notes } = req.body;

  if (!tableId || !items || !items.length) {
    return res.status(400).json({ message: 'Table and items are required' });
  }

  try {
    // Verify table exists
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Run order placement in database transaction
    const order = await prisma.$transaction(async (tx) => {
      let orderTotal = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (!product.status) {
          throw new Error(`Product "${product.name}" is currently unavailable`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Only ${product.stock} available.`);
        }

        // Calculate subtotal
        const itemPrice = Number(product.price);
        const itemTotal = itemPrice * item.quantity;
        orderTotal += itemTotal;

        orderItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          price: itemPrice
        });

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        // Log stock decrement
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            type: 'STOCK_OUT',
            notes: `Order checkout`
          }
        });
      }

      // Generate receipt number
      const receiptNumber = generateReceiptNumber();

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          receiptNumber,
          customerName,
          tableId,
          status: 'PENDING',
          total: orderTotal,
          notes,
          items: {
            create: orderItemsToCreate
          }
        },
        include: {
          table: {
            select: { tableNumber: true }
          },
          items: {
            include: {
              product: {
                select: { name: true, image: true }
              }
            }
          }
        }
      });

      // Register customer if name is provided
      if (customerName) {
        await tx.customer.create({
          data: {
            name: customerName,
          }
        });
      }

      return newOrder;
    });

    // Broadcast to Admin and Kitchen via Socket.IO
    try {
      const io = getIO();
      // Format decimal fields for frontend
      const ioOrder = {
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          price: Number(item.price),
        }))
      };
      
      io.to('admin').emit('new-order', ioOrder);
      io.to('kitchen').emit('new-order', ioOrder);
    } catch (e) {
      console.warn('Socket emit failed (Socket server might not be running yet):', e.message);
    }

    res.status(201).json({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
      }))
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ message: error.message || 'Error processing checkout' });
  }
});

// 2. Track Order / View Receipt by Receipt Number (Public)
router.get('/track/:receiptNumber', async (req, res) => {
  const { receiptNumber } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { receiptNumber },
      include: {
        table: {
          select: { tableNumber: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, image: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order receipt not found' });
    }

    res.json({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
      }))
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Error tracking order' });
  }
});

// 3. Get All Orders (Admin/Kitchen/Staff)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, tableId } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (tableId) {
      where.tableId = tableId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: {
          select: { tableNumber: true }
        },
        items: {
          include: {
            product: {
              select: { name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Error retrieving orders' });
  }
});

// 4. Update Order Status (Admin/Kitchen/Staff)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING, PREPARING, READY, COMPLETED, CANCELLED

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Process status transition
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If transitioning to COMPLETED, check or create Sales record
      if (status === 'COMPLETED' && existingOrder.status !== 'COMPLETED') {
        await tx.sale.upsert({
          where: { orderId: id },
          update: {},
          create: {
            orderId: id,
            amount: existingOrder.total
          }
        });
      }

      // 2. If transitioning to CANCELLED and it wasn't cancelled already, restore inventory stock
      if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });

          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'STOCK_IN',
              notes: `Order cancellation (Receipt: ${existingOrder.receiptNumber})`
            }
          });
        }

        // Also delete sale if it was created
        await tx.sale.deleteMany({
          where: { orderId: id }
        });
      }

      // Update Order Status
      return await tx.order.update({
        where: { id },
        data: { status },
        include: {
          table: {
            select: { tableNumber: true }
          },
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        }
      });
    });

    // Audit log
    await logAuditAction(req.user.id, `Changed Order Status: ${updatedOrder.receiptNumber} -> ${status}`, req);

    // Broadcast update via Socket.IO
    try {
      const io = getIO();
      const ioOrder = {
        ...updatedOrder,
        total: Number(updatedOrder.total),
        items: updatedOrder.items.map(item => ({
          ...item,
          price: Number(item.price),
        }))
      };

      // Emit to rooms
      io.to('admin').emit('order-status-updated', ioOrder);
      io.to('kitchen').emit('order-status-updated', ioOrder);
      io.to(`order:${updatedOrder.receiptNumber}`).emit('order-status-updated', ioOrder);
    } catch (e) {
      console.warn('Socket status emit failed:', e.message);
    }

    res.json({
      ...updatedOrder,
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map(item => ({
        ...item,
        price: Number(item.price),
      }))
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: error.message || 'Error updating order status' });
  }
});

export default router;
