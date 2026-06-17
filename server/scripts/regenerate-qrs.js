import QRCode from 'qrcode';
import prisma from '../db.js';

async function main() {
  console.log('Regenerating all table QR codes to 1000x1000 resolution...');
  
  const tables = await prisma.table.findMany();
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

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
    console.log(`Updated ${table.tableNumber} QR code to 1000x1000.`);
  }

  console.log('Successfully regenerated all QR codes!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
