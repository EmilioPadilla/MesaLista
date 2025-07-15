import { PrismaClient } from '@prisma/client';

async function main() {
  try {
    console.log('Initializing Prisma client...');
    const prisma = new PrismaClient();
    
    console.log('Testing database connection...');
    // Try a simple query
    const users = await prisma.user.findMany({
      take: 1,
    });
    
    console.log('Connection successful!');
    console.log(`Found ${users.length} users`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

main();
