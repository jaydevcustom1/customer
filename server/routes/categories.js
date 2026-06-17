import express from 'express';
import prisma from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logAuditAction } from '../utils/audit.js';

const router = express.Router();

// Get all categories (Publicly accessible for customers)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ message: 'Error retrieving categories' });
  }
});

// Create a new category (Admin and Staff)
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { name, description, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        status: status !== undefined ? status : true,
      },
    });

    await logAuditAction(req.user.id, `Created Category: ${category.name}`, req);

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update a category (Admin and Staff)
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing && existing.id !== id) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        status: status !== undefined ? status : undefined,
      },
    });

    await logAuditAction(req.user.id, `Updated Category: ${category.name}`, req);

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete a category (Admin and Staff)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.delete({
      where: { id },
    });

    await logAuditAction(req.user.id, `Deleted Category: ${category.name}`, req);

    res.json({ message: 'Category deleted successfully', category });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

export default router;
