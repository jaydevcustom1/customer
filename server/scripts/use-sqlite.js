import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const envPath = path.join(process.cwd(), '.env');

console.log('Converting Prisma configuration to SQLite for easy local testing...');

if (!fs.existsSync(schemaPath)) {
  console.error('Error: schema.prisma not found at ' + schemaPath);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Change database provider to sqlite
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');

// 2. Remove @db.Decimal(10, 2) and @db.Decimal(5, 2) annotations (unsupported by SQLite)
schema = schema.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');

// 3. Since SQLite doesn't support Decimal type natively in the same way (Prisma handles it as Decimal but it can cause issues on some systems, or it maps to Float/String in standard databases, but Prisma client handles Decimal using Decimal.js which is fine, but SQLite doesn't support standard Decimal mappings. Let's make sure it translates to Float or stays Decimal. Prisma SQLite supports Decimal type since v4.0.0 by storing it as Float under the hood. So we just remove the @db.Decimal annotation, and it works perfectly!)
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✔ Updated schema.prisma successfully (SQLite provider + annotations removed).');

// 4. Update .env file to use file database
if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, 'utf8');
  env = env.replace(/DATABASE_URL\s*=\s*".*"/g, 'DATABASE_URL="file:./dev.db"');
  fs.writeFileSync(envPath, env, 'utf8');
  console.log('✔ Updated .env successfully to DATABASE_URL="file:./dev.db".');
} else {
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\nPORT=5000\nJWT_SECRET="supersecretkeyforqrmenuapp2026"\n', 'utf8');
  console.log('✔ Created .env with SQLite config.');
}

console.log('\nSetup complete! You can now run:\n  npx prisma db push\n  npm run seed\n  npm run dev\n');
