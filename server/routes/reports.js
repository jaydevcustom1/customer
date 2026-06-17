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

    // Fetch all sales since the start of the month in a single query
    const monthlySalesData = await prisma.sale.findMany({
      where: { createdAt: { gte: month } },
      select: { amount: true, createdAt: true }
    });

    // Sum in memory to avoid multiple round-trips
    let todayTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;

    monthlySalesData.forEach(sale => {
      const amt = Number(sale.amount || 0);
      const date = new Date(sale.createdAt);
      
      monthlyTotal += amt;
      if (date >= today) {
        todayTotal += amt;
      }
      if (date >= week) {
        weeklyTotal += amt;
      }
    });

    // Run counts concurrently
    const [pendingCount, completedCount, lowStockCount] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.product.count({ where: { stock: { lt: 10 }, status: true } })
    ]);

    res.json({
      revenue: {
        today: todayTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Sales over the last 7 days (Daily Sales) - Fetch in a single query
    const last7DaysSales = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { amount: true, createdAt: true }
    });

    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dailySum = last7DaysSales
        .filter(sale => {
          const date = new Date(sale.createdAt);
          return date >= start && date <= end;
        })
        .reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

      dailySales.push({
        date: dayName,
        revenue: dailySum
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

    // 3. Best Selling Products (Top 5) - Optimized using groupBy
    const bestSellersData = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'COMPLETED'
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const productIds = bestSellersData.map(item => item.productId);
    const productsInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const bestSellers = bestSellersData.map(item => {
      const prod = productsInfo.find(p => p.id === item.productId);
      return {
        name: prod ? prod.name : 'Unknown',
        sales: item._sum.quantity || 0
      };
    });

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
