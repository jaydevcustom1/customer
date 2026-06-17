import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initIO } from './socket.js';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import tablesRoutes from './routes/tables.js';
import ordersRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import auditRoutes from './routes/audit.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initIO(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API Mapping
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'QR Menu ordering backend API is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server'
  });
});

import prisma from './db.js';
import QRCode from 'qrcode';

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Auto-regenerate table QR codes to ensure they match CLIENT_URL (Netlify URL)
  try {
    const tables = await prisma.table.findMany();
    const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
    console.log(`Auto-regenerating QR codes with CLIENT_URL: ${clientOrigin}`);
    for (const table of tables) {
      const qrData = `${clientOrigin}/menu?table=${encodeURIComponent(table.tableNumber)}`;
      const qrCodeBase64 = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 1000,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      await prisma.table.update({
        where: { id: table.id },
        data: { qrCode: qrCodeBase64 }
      });
    }
    console.log('Successfully updated all table QR codes.');
  } catch (error) {
    console.error('Error auto-regenerating QR codes on startup:', error);
  }
});
