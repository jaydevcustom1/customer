import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import prisma from '../db.js';

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Setting
  const defaultSetting = await prisma.setting.upsert({
    where: { id: 'default-setting-id' },
    update: {},
    create: {
      id: 'default-setting-id',
      restaurantName: 'The Golden Plate Bistro',
      address: '742 Evergreen Terrace, Springfield',
      phone: '+1 (555) 762-3849',
      logo: '',
      tax: 8.50,
      serviceFee: 10.00,
      currency: 'USD'
    }
  });
  console.log('Default settings created/verified.');

  // 2. Create Users (Admin & Kitchen Staff)
  const hashedPassword = await bcrypt.hash('123123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bistro.com' },
    update: {
      name: 'admin',
      password: hashedPassword
    },
    create: {
      name: 'admin',
      email: 'admin@bistro.com',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  const kitchenUser = await prisma.user.upsert({
    where: { email: 'kitchen@bistro.com' },
    update: {},
    create: {
      name: 'Chef Gordon',
      email: 'kitchen@bistro.com',
      password: staffPassword,
      role: 'KITCHEN',
    }
  });

  console.log('Users created:', {
    admin: adminUser.email,
    kitchen: kitchenUser.email
  });

  // 3. Create Categories
  const categories = [
    { name: 'Meals', description: 'Gourmet main courses and hearty meals' },
    { name: 'Drinks', description: 'Refreshing beverages, mocktails, and coffee' },
    { name: 'Desserts', description: 'Decadent sweet treats and pastries' },
    { name: 'Snacks', description: 'Quick bites and finger foods' },
    { name: 'Specials', description: 'Chef\'s signature choices and seasonal items' }
  ];

  const dbCategories = [];
  for (const cat of categories) {
    const dbCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat
    });
    dbCategories.push(dbCat);
  }
  console.log(`Created ${dbCategories.length} categories.`);

  // Find category map
  const mealsCat = dbCategories.find(c => c.name === 'Meals');
  const drinksCat = dbCategories.find(c => c.name === 'Drinks');
  const dessertsCat = dbCategories.find(c => c.name === 'Desserts');
  const snacksCat = dbCategories.find(c => c.name === 'Snacks');
  const specialsCat = dbCategories.find(c => c.name === 'Specials');

  // 4. Create Products
  const products = [
    // Meals
    {
      categoryId: mealsCat.id,
      name: 'Truffle Ribeye Steak',
      description: 'Prime ribeye steak grilled to perfection, drizzled with truffle butter, served with roasted potatoes.',
      price: 34.99,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      status: true
    },
    {
      categoryId: mealsCat.id,
      name: 'Classic Bistro Burger',
      description: 'Angus beef patty, cheddar, brioche bun, house-made pickle relish, served with crispy fries.',
      price: 16.50,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      status: true
    },
    {
      categoryId: mealsCat.id,
      name: 'Wild Mushroom Risotto',
      description: 'Creamy Arborio rice slow-cooked with wild shiitake and portobello mushrooms, parmesan cheese.',
      price: 19.99,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&auto=format&fit=crop&q=80',
      status: true
    },

    // Drinks
    {
      categoryId: drinksCat.id,
      name: 'Iced Matcha Latte',
      description: 'Premium stone-ground Uji matcha whisked with cold milk and sweet honey, poured over ice.',
      price: 6.25,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
      status: true
    },
    {
      categoryId: drinksCat.id,
      name: 'Fresh Passionfruit Lemonade',
      description: 'Zesty lemon juice muddled with fresh passionfruit seeds, sparkling water, mint leaves.',
      price: 5.50,
      stock: 120,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
      status: true
    },

    // Desserts
    {
      categoryId: dessertsCat.id,
      name: 'Molten Chocolate Lava Cake',
      description: 'Warm chocolate cake with a liquid fudge center, served with a scoop of vanilla bean gelato.',
      price: 9.50,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
      status: true
    },
    {
      categoryId: dessertsCat.id,
      name: 'Classic Tiramisu',
      description: 'Espresso-soaked ladyfingers layered with whipped mascarpone cream, dusted with dark cocoa.',
      price: 8.99,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
      status: true
    },

    // Snacks
    {
      categoryId: snacksCat.id,
      name: 'Truffle Parmesan Fries',
      description: 'Hand-cut golden fries tossed in white truffle oil, sea salt, freshly grated parmesan cheese.',
      price: 8.50,
      stock: 80,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
      status: true
    },

    // Specials
    {
      categoryId: specialsCat.id,
      name: 'Lobster Mac & Cheese',
      description: 'Succulent chunks of fresh Atlantic lobster folded into a rich, creamy four-cheese macaroni bake.',
      price: 28.00,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&auto=format&fit=crop&q=80',
      status: true
    }
  ];

  for (const prod of products) {
    const dbProd = await prisma.product.create({
      data: prod
    });

    // Seed stock inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: dbProd.id,
        quantity: prod.stock,
        type: 'STOCK_IN',
        notes: 'Initial seed stock'
      }
    });
  }
  console.log(`Created ${products.length} products with initial stock logs.`);

  // 5. Create Tables & QR Codes
  const tableNumbers = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5'];
  const clientOrigin = 'http://localhost:3000'; // Default Dev Port

  for (const tabNum of tableNumbers) {
    const qrData = `${clientOrigin}/menu?table=${encodeURIComponent(tabNum)}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 1000,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    await prisma.table.upsert({
      where: { tableNumber: tabNum },
      update: {},
      create: {
        tableNumber: tabNum,
        qrCode: qrCodeBase64,
        status: 'AVAILABLE'
      }
    });
  }
  console.log(`Created tables: ${tableNumbers.join(', ')} with pre-generated QR codes.`);

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
