import prisma from '../db.js';

async function main() {
  const tables = await prisma.table.findMany();
  console.log('Tables in DB:', tables.map(t => ({ id: t.id, tableNumber: t.tableNumber, status: t.status })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
