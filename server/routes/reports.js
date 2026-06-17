import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Helper to get start and end dates
const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 1. Get KPI Summary (Admin and Staff)
router.get('/summary', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    const today = getStartOfToday();
    const week = getStartOfWeek();
    const month = getStartOfMonth();

    // 1. Revenue queries
    const todaySales = await prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { amount: true }
    });

    const weeklySales = await prisma.sale.aggregate({
      where: { createdAt: { gte: week } },
      _sum: { amount: true }
    });

    const monthlySales = await prisma.sale.aggregate({
      where: { createdAt: { gte: month } },
      _sum: { amount: true }
    });

    // 2. Order count queries
    const pendingCount = await prisma.order.count({
      where: { status: 'PENDING' }
    });

    const completedCount = await prisma.order.count({
      where: { status: 'COMPLETED' }
    });

    // 3. Low stock count query
    const lowStockCount = await prisma.product.count({
      where: {
        stock: { lt: 10 },
        status: true
      }
    });

    res.json({
      revenue: {
        today: Number(todaySales._sum.amount || 0),
        weekly: Number(weeklySales._sum.amount || 0),
        monthly: Number(monthlySales._sum.amount || 0)
      },
      orders: {
        pending: pendingCount,
        completed: completedCount
      },
      lowStock: lowStockCount
    });
  } catch (error) {
    console.error('Fetch reports summary error:', error);
    res.status(500).json({ message: 'Error retrieving reports summary' });
  }
});

// 2. Get Chart & Analytics Data (Admin and Staff)
router.get('/charts', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  try {
    // 1. Sales over the last 7 days (Daily Sales)
    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const sales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: { amount: true }
      });

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailySales.push({
        date: dayName,
        revenue: Number(sales._sum.amount || 0)
      });
    }

    // 2. Sales by Category
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: {
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      }
    });

    const categoryPerformance = categories.map(cat => {
      let revenue = 0;
      cat.products.forEach(prod => {
        prod.orderItems.forEach(item => {
          revenue += Number(item.price) * item.quantity;
        });
      });

      return {
        name: cat.name,
        value: revenue
      };
    }).filter(c => c.value > 0);

    // 3. Best Selling Products (Top 5)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED'
        }
      },
      include: {
        product: {
          select: { name: true }
        }
      }
    });

    const productSalesMap = {};
    orderItems.forEach(item => {
      const name = item.product.name;
      if (!productSalesMap[name]) {
        productSalesMap[name] = 0;
      }
      productSalesMap[name] += item.quantity;
    });

    const bestSellers = Object.entries(productSalesMap)
      .map(([name, quantity]) => ({ name, sales: quantity }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 4. Low stock products list
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: 10 },
        status: true
      },
      select: {
        id: true,
        name: true,
        stock: true
      },
      orderBy: { stock: 'asc' },
      take: 5
    });

    res.json({
      dailySales,
      categoryPerformance,
      bestSellers,
      lowStockProducts
    });
  } catch (error) {
    console.error('Fetch reports charts error:', error);
    res.status(500).json({ message: 'Error retrieving charts data' });
  }
});

// 3. Export Reports CSV (Admin)
router.get('/export', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { type } = req.query; // 'sales' or 'inventory'

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        include: {
          order: {
            select: { receiptNumber: true, status: true, customerName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      let csv = 'ID,Receipt Number,Amount,Customer Name,Date,Status\n';
      sales.forEach(sale => {
        csv += `"${sale.id}","${sale.order.receiptNumber}",${sale.amount},"${sale.order.customerName || 'N/A'}","${sale.createdAt.toISOString()}","${sale.order.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      return res.status(200).send(csv);
    }

    if (type === 'inventory') {
      const logs = await prisma.inventoryLog.findMany({
        include: {
          product: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      let csv = 'Log ID,Product Name,Quantity,Type,Notes,Date\n';
      logs.forEach(log => {
        csv += `"${log.id}","${log.product.name}",${log.quantity},"${log.type}","${log.notes || 'N/A'}","${log.createdAt.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
      return res.status(200).send(csv);
    }

    res.status(400).json({ message: 'Invalid export type. Use ?type=sales or ?type=inventory' });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Error exporting report' });
  }
});

export default router;
