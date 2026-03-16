const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to deploy migrations.');
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  const migrationsDir = path.join(__dirname, '..', '..', '..', 'supabase', 'migrations');

  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected.');

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`\nApplying ${file}`);
      const fullSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = fullSql
        .split(/;\s*\n/)
        .map((statement) => statement.trim())
        .filter((statement) => statement && !statement.startsWith('--'));

      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
    }

    console.log('\nMigration deployment complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
