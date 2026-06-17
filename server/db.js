import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Standard Prisma Client initialization (using native binary engine in Prisma 5)
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
