const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create some wedding lists with gifts
    const weddingList1 = await prisma.weddingList.create({
      data: {
        coupleId: 1, // Assuming user with ID 1 exists and has COUPLE role
        title: 'María y Juan Wedding List',
        description: 'Regalos para nuestra boda',
        coupleName: 'María y Juan',
        weddingDate: new Date('2025-12-15'),
        imageUrl: 'https://via.placeholder.com/150',
        gifts: {
          create: [
            {
              title: 'Juego de Vajilla',
              description: 'Vajilla de porcelana para 8 personas',
              price: 2500,
              category: 'Kitchen',
              isPurchased: false
            },
            {
              title: 'Licuadora',
              description: 'Licuadora de alta potencia',
              price: 1200,
              category: 'Appliances',
              isPurchased: false
            },
            {
              title: 'Juego de Sábanas',
              description: 'Sábanas de algodón egipcio',
              price: 1800,
              category: 'Bedroom',
              isPurchased: true
            }
          ]
        }
      }
    });

    const weddingList2 = await prisma.weddingList.create({
      data: {
        coupleId: 2, // Assuming user with ID 2 exists and has COUPLE role
        title: 'Ana y Carlos Wedding List',
        description: 'Regalos para celebrar nuestra unión',
        coupleName: 'Ana y Carlos',
        weddingDate: new Date('2025-10-22'),
        imageUrl: 'https://via.placeholder.com/150',
        gifts: {
          create: [
            {
              title: 'Cafetera',
              description: 'Cafetera automática',
              price: 3200,
              category: 'Kitchen',
              isPurchased: false
            },
            {
              title: 'Batería de Cocina',
              description: 'Set de ollas y sartenes antiadherentes',
              price: 4500,
              category: 'Kitchen',
              isPurchased: false
            }
          ]
        }
      }
    });

    console.log('Wedding lists created successfully:', {
      weddingList1: {
        id: weddingList1.id,
        coupleName: weddingList1.coupleName
      },
      weddingList2: {
        id: weddingList2.id,
        coupleName: weddingList2.coupleName
      }
    });
  } catch (error) {
    console.error('Error seeding wedding lists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
