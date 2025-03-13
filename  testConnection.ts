import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://username:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    },
  },
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Conexão com o banco de dados bem-sucedida!');
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();