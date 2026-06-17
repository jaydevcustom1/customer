import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Setup Multer local disk storage
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Images only (jpg, jpeg, png, webp, gif)'));
  }
});

// Get all products (Publicly accessible)
router.get('/', async (req, res) => {
  try {
    const { categoryId, search } = req.query;

    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Formatting decimal prices back to numbers
    const formattedProducts = products.map(product => ({
      ...product,
      price: Number(product.price),
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
});

// Create product (Admin and Staff)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('image'), async (req, res) => {
  const { categoryId, name, description, price, stock, status } = req.body;

  if (!categoryId || !name || !price) {
    return res.status(400).json({ message: 'Category, name, and price are required' });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        name,
        description,
        price: Number(price),
        stock: Number(stock || 0),
        status: status === 'true' || status === true,
        image: imageUrl,
      },
    });

    // Create initial stock in log if stock > 0
    if (Number(stock) > 0) {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          quantity: Number(stock),
          type: 'STOCK_IN',
          notes: 'Initial stock on creation',
          userId: req.user.id
        }
      });
    }

    await logAuditAction(req.user.id, `Created Product: ${product.name} (Stock: ${stock})`, req);

    res.status(201).json({ ...product, price: Number(product.price) });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product (Admin and Staff)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { categoryId, name, description, price, stock, status } = req.body;

  try {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imageUrl = existingProduct.image;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      // Clean up old local image if it existed and was local
      if (existingProduct.image && existingProduct.image.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), existingProduct.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const data = {};
    if (categoryId) data.categoryId = categoryId;
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (status !== undefined) data.status = status === 'true' || status === true;
    data.image = imageUrl;

    // Handle stock changes and create logs
    if (stock !== undefined) {
      const newStock = Number(stock);
      const stockDiff = newStock - existingProduct.stock;
      data.stock = newStock;

      if (stockDiff !== 0) {
        await prisma.inventoryLog.create({
          data: {
            productId: id,
            quantity: Math.abs(stockDiff),
            type: stockDiff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
            notes: `Manual adjustment (stock changed from ${existingProduct.stock} to ${newStock})`,
            userId: req.user.id
          }
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    await logAuditAction(req.user.id, `Updated Product: ${updatedProduct.name}`, req);

    res.json({ ...updatedProduct, price: Number(updatedProduct.price) });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product (Admin)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.delete({
      where: { id },
    });

    // Delete local image file
    if (product.image && product.image.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), product.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await logAuditAction(req.user.id, `Deleted Product: ${product.name}`, req);

    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

export default router;
