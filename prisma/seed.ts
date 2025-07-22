import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed database...');

  // Clear existing data
  await prisma.giftCategoryOnGift.deleteMany();
  await prisma.giftPurchase.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.giftCategory.deleteMany();
  await prisma.weddingList.deleteMany();
  await prisma.user.deleteMany();

  console.log('Deleted existing records');

  // Create gift categories
  const categories = await Promise.all([
    prisma.giftCategory.create({ data: { name: 'Cocina' } }),
    prisma.giftCategory.create({ data: { name: 'Electrodomésticos' } }),
    prisma.giftCategory.create({ data: { name: 'Viaje' } }),
    prisma.giftCategory.create({ data: { name: 'Baño' } }),
    prisma.giftCategory.create({ data: { name: 'Decoración' } }),
    prisma.giftCategory.create({ data: { name: 'Otros' } }),
  ]);

  const [cocinaCategory, electroCategory, viajeCategory, banoCategory, decoracionCategory, otrosCategory] = categories;
  console.log(`Created ${categories.length} gift categories`);

  // Create users with hashed passwords
  const saltRounds = 10;

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', saltRounds),
      role: 'ADMIN',
    },
  });

  // Create a couple
  const couple = await prisma.user.create({
    data: {
      firstName: 'Sol',
      lastName: 'Rosales',
      spouseFirstName: 'Emilio',
      spouseLastName: 'Padilla',
      email: 'sol.emilio@example.com',
      password: await bcrypt.hash('couple123', saltRounds),
      phoneNumber: '+52 123 456 7890',
      role: 'COUPLE',
    },
  });

  // Create a wedding list for the couple
  const weddingList = await prisma.weddingList.create({
    data: {
      coupleId: couple.id,
      title: 'Boda de Sol & Emilio',
      description: 'Gracias por ser parte de nuestro día especial',
      coupleName: 'Sol & Emilio',
      invitationCount: 170,
      weddingDate: new Date('2025-11-29'),
      weddingLocation: 'Casona de los 5 Patios, Querétaro',
    },
  });

  // Create some sample gifts
  const gifts = await Promise.all([
    prisma.gift.create({
      data: {
        title: 'Juego de Vajilla',
        description: 'Juego de vajilla de porcelana para 8 personas',
        price: 250.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-vajilla.webp',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Licuadora',
        description: 'Licuadora de alta potencia',
        price: 120.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-licuadora.webp',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Toallas',
        description: 'Juego de toallas de baño de algodón',
        price: 80.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-toallas.jpg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'TV 40"',
        description: 'TV 40" de 4K',
        price: 1200.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-tv.jpg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cena en Islandia',
        description: 'Cena en Islandia para dos personas',
        price: 2500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-cenaIslandia.webp',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour por Dolomitas',
        description: 'Tour por Dolomitas para dos personas',
        price: 1500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-dolomitas.jpg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Nespresso Vertuo Next',
        description: 'Nespresso Vertuo Next con espumador y 50 capsulas',
        price: 3500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/69e7f643-0b9b-4d81-ac37-4ab3888cf177-nespresso.avif',
        weddingListId: weddingList.id,
      },
    }),
  ]);

  // Associate gifts with categories
  await Promise.all([
    // Juego de Vajilla -> Cocina
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[0].id, categoryId: cocinaCategory.id },
    }),
    // Licuadora -> Electrodomésticos
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[1].id, categoryId: electroCategory.id },
    }),
    // Juego de Toallas -> Baño
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[2].id, categoryId: banoCategory.id },
    }),
    // TV -> Electrodomésticos
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[3].id, categoryId: electroCategory.id },
    }),
    // Cena en Islandia -> Viaje
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[4].id, categoryId: viajeCategory.id },
    }),
    // Tour por Dolomitas -> Viaje
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[5].id, categoryId: viajeCategory.id },
    }),
    // Nespresso -> Electrodomésticos + Cocina (example of multiple categories)
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[6].id, categoryId: electroCategory.id },
    }),
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[6].id, categoryId: cocinaCategory.id },
    }),
  ]);

  console.log('Associated gifts with categories');

  // Create a guest user
  const guest = await prisma.user.create({
    data: {
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@example.com',
      password: await bcrypt.hash('guest123', saltRounds),
      role: 'GUEST',
    },
  });

  // Create another guest user
  const guest2 = await prisma.user.create({
    data: {
      firstName: 'María',
      lastName: 'López',
      email: 'maria@example.com',
      password: await bcrypt.hash('guest123', saltRounds),
      role: 'GUEST',
    },
  });

  // Create gift purchases with different statuses
  const purchases = await Promise.all([
    // PENDING purchase
    prisma.giftPurchase.create({
      data: {
        giftId: gifts[0].id,
        userId: guest.id,
        message: '¡Felicidades por su boda! Espero que disfruten este regalo.',
        status: 'PENDING',
      },
    }),
    // DELIVERED purchase
    prisma.giftPurchase.create({
      data: {
        giftId: gifts[1].id,
        userId: guest2.id,
        message: 'Les deseo mucha felicidad en su nueva vida juntos.',
        status: 'DELIVERED',
      },
    }),
    // THANKED purchase
    prisma.giftPurchase.create({
      data: {
        giftId: gifts[2].id,
        userId: guest.id,
        message: 'Un pequeño detalle para su nuevo hogar.',
        status: 'THANKED',
      },
    }),
  ]);

  // Update the isPurchased status for the gifts
  await Promise.all([
    prisma.gift.update({
      where: { id: gifts[0].id },
      data: { isPurchased: true },
    }),
    prisma.gift.update({
      where: { id: gifts[1].id },
      data: { isPurchased: true },
    }),
    prisma.gift.update({
      where: { id: gifts[2].id },
      data: { isPurchased: true },
    }),
  ]);

  console.log(`Created ${4} users, 1 wedding list, ${gifts.length} gifts, and ${purchases.length} gift purchases`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
