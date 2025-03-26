const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Tentando conectar ao banco de dados...');
    
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Conexão bem-sucedida:', result);
    
  } catch (error) {
    console.error('Erro ao conectar:', error);
    console.error('Detalhes do erro:', error.message);
    
    if (error.message.includes('SSL')) {
      console.error('Parece haver um problema com a conexão SSL. Tente modificar as configurações SSL na URL do banco de dados.');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('Verifique suas credenciais de acesso ao banco de dados.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();