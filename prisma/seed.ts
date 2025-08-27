import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed database...');

  // Clear existing data
  await prisma.giftCategoryOnGift.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.giftCategory.deleteMany();
  await prisma.weddingList.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.cartItem.deleteMany();

  console.log('Deleted existing records');

  // Create gift categories
  const categories = await Promise.all([
    prisma.giftCategory.create({ data: { name: 'Cocina' } }),
    prisma.giftCategory.create({ data: { name: 'Electrodomésticos' } }),
    prisma.giftCategory.create({ data: { name: 'Viaje' } }),
    prisma.giftCategory.create({ data: { name: 'Baño' } }),
  ]);

  const [cocinaCategory, electroCategory, viajeCategory, banoCategory] = categories;
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
      coupleSlug: 'sol-y-emilio',
      email: 'sol.emilio@example.com',
      imageUrl:
        'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/4a6987b6-9bcf-440e-89fa-9093d0dc67c8-EmilioandMarianaFullAlbum-143.jpg',
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
      description: `Como muchos de ustedes ya saben, en enero de 2026 comenzamos una nueva aventura… ¡en otro país!

Por eso, nuestra mesa de regalos es un poquito diferente: en lugar de los regalos tradicionales, les compartimos dos opciones con mucho significado para nosotros:

💛 Nuestra luna de miel por el norte de Europa, una experiencia que soñamos desde hace tiempo.

📦 Nuestra mudanza internacional, para ayudarnos a construir un nuevo hogar lejos, pero siempre con ustedes cerca.

Si desean apoyarnos, pueden hacerlo a través de la siguiente mesa de regalos.

Su cariño, sus buenos deseos y su presencia son el mejor regalo de todos.

Con amor,
Emilio & Mariana`,
      coupleName: 'Sol & Emilio',
      imageUrl:
        'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/4a6987b6-9bcf-440e-89fa-9093d0dc67c8-EmilioandMarianaFullAlbum-143.jpg',
      invitationCount: 170,
      weddingDate: new Date('2025-11-29'),
      weddingLocation: 'Querétaro, Querétaro',
      weddingVenue: 'Casona de los 5 Patios',
    },
  });

  // Create some sample gifts
  const gifts = await Promise.all([
    prisma.gift.create({
      data: {
        title: 'Regalo prueba',
        description: 'Regalo de prueba',
        price: 1.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Regalo prueba 2',
        description: 'Regalo de prueba 2',
        price: 9.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Laguna Azul / Sky Lagoon',
        description: 'Un spa geotermal en medio de campos de lava. Aguas cálidas, vapor y vista volcánica… ¡Sí, por favor!',
        price: 3600.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/skylagoon.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour al Círculo Dorado',
        description:
          'Géisers gigantes, cascadas increíbles y volcanes activos. ¡Ayúdanos a empezar la luna de miel explorando Islandia como se debe!',
        price: 2800.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/tour_dorado.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour de auroras boreales',
        description: 'Uno de nuestros mayores sueños: ver auroras tomados de la mano. ¿Nos ayudas a hacerlo realidad?',
        price: 3500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/auroras_boreales.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour en bici por Copenhague',
        description: 'Recorrer la ciudad más bike-friendly del mundo como locales, ¡pero enamorados!',
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/bici_copenhage.jpeg',
        price: 1400.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Crucero por canales',
        description: 'Navegar por los canales de Copenhague o Estocolmo y brindar con una vista de ensueño.',
        price: 1200.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/crucero_canales.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Moto de nieve sobre un glaciar',
        description: 'A toda velocidad sobre un glaciar eterno. ¡Una aventura que promete adrenalina y vistas impresionantes!',
        price: 2900.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/motonieve.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Transporte público',
        description: 'Metro, bus, tren o ferry… ¡para movernos como locales (pero sin perdernos)!',
        price: 500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/transporte_publico.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Castillos nórdicos',
        description: 'Visitar castillos de cuentos en Suecia y Dinamarca. ',
        price: 1600.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/castillo_nordico.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cena romántica',
        description: 'Una cena elegante con platillos nórdicos, luz tenue y muchas miradas bonitas.',
        price: 3000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cena_romantica.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Desayuno escandinavo',
        description: 'Pan recién horneado, mermeladas caseras y café fuerte. ¿Quién dijo que el desayuno no es romántico?',
        price: 900.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/desayuno_escandinavo.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Clase de cocina local',
        description: 'Queremos volver sabiendo preparar smørrebrød o albóndigas suecas. ¡Imaginen el brunch post-boda!',
        price: 2500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/clase_cocina.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Drinks de noche',
        description: '¡Para relajarnos después de un día de mucho conocer!',
        price: 1500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/drinks_noche.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Comida Callejera',
        description: 'Hot dogs islandeses, arenques, regaliz negro… sí, probaremos todo.',
        price: 600.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/comida_callejera.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Hotel boutique en Copenhague',
        description: 'Diseño danés + comodidad + amor = nuestra fórmula perfecta para descansar',
        price: 3500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/hotel_boutique_copenhage.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 noche estancia en Cabaña con jacuzzi',
        description: 'Una noche en medio de la nada, con estrellas, auroras y jacuzzi caliente. Suena perfecto, ¿no?',
        price: 4000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cabana_jacuzzi.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 noche en Hotel con vista a fiordos',
        description: 'Despertar frente a montañas, lagos y neblina mágica. Un sueño nórdico.',
        price: 3400.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/hote_vista_fiordos.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Masaje en pareja',
        description: 'Después de tantos paseos, ¡nuestros cuerpos agradecerán este apapacho!',
        price: 2500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/masaje_pareja.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Sauna tradicional noruega',
        description: 'Cultura, calor y relajación. ¡Un ritual que queremos vivir!',
        price: 1600.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/sauna_noruega.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Sesión de fotos en pareja',
        description: 'Un fotógrafo local nos ayudará a capturar momentos mágicos para toda la vida.',
        price: 2000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/sesion_fotos_pareja.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Álbum impreso de nuestra luna de miel',
        description: 'Para guardar cada risa, abrazo y paisaje. ¡Y mostrárselos a ustedes después!',
        price: 1200.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/album_honeymoon.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Snacks locales',
        description: 'Regaliz, salmón seco, chocolates raros… porque los snacks también son cultura.',
        price: 450.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/snacks_locales.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Aportación vuelos internacionales',
        description:
          'Dicen que el amor te hace volar, ¡pero los boletos también ayudan! Gracias por empujarnos (literalmente) hacia Islandia, nuestro primer destino de luna de miel.',
        price: 1500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/aportacion_vuelos_inter.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Paseo en kayak al atardecer en los fiordos noruegos',
        description: 'Imagínanos remando entre montañas gigantes, aguas tranquilas y un atardecer que pinta el cielo de rosa y naranja.',
        price: 2500.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/paseo_kayak.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Trineo con Huskies',
        description: 'Perros felices, nieve por doquier y nosotros en un trineo: como en una película navideña.',
        price: 3000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/trineo_huskies.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tren escénico por Noruega (Flåm Railway)',
        description: 'Uno de los viajes en tren más bellos del mundo: fiordos, cascadas y paisajes de cuento desde nuestra ventanilla.',
        price: 1900.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/tren_escenico.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour a cuevas de hielo',
        description: 'Como entrar en un mundo de cristal azul. Un paseo mágico por la naturaleza congelada de Islandia.',
        price: 3600.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/tour_cuevas_hielo.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Avistamiento de ballenas en Islandia',
        description: 'Navegar por aguas frías en busca de gigantes del mar. Un recuerdo impresionante para toda la vida.',
        price: 4300.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/avistamiento_ballenas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Paseo en helicóptero sobre fiordos',
        description: 'Si volar juntos ya es especial, imagina hacerlo sobre montañas y lagos infinitos. ¡Wow!',
        price: 6000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/paseo_helicoptero.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Brunch nórdico con vista',
        description: 'Panes artesanales, arenque, café fuerte y un paisaje de postal. Un desayuno que no olvidaremos.',
        price: 1000.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/brunch_nordico_vista.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 Noche en el Icehotel de Jukkasjärvi',
        description:
          'Dormir en una habitación hecha completamente de hielo, con esculturas y sacos térmicos. Una noche fría... pero inolvidable.',
        price: 6800.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/ice_hotel.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Almaya: Juego de Sábanas de Microfibra',
        description:
          'Juego de Sábanas de Microfibra Suave de Lujo con Doble Cepillado / 1800 Hilos de Alta Calidad y Bolsillo Lateral para Accesorios (Plata, King Size)',
        price: 747.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/almaya_sabanas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'BATTILO HOME - Manta gris oscuro',
        description:
          'BATTILO HOME - Manta gris oscuro para sofá, manta de punto de carbón versátil para silla, 152.4 x 203.2 cm, manta gris cálida súper suave con borlas para cama, sofá y sala de estar',
        price: 780.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/batillo_manta.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'ESQUIMAL Edredón Acolchado',
        description: 'Edredón Acolchado Relleno Down Alternative Ultra Suave. Ideal para Funda Duvet. Hipoalergénico. (Blanco, King Size)',
        price: 1099.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/esquimal-edredon.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Bluelander Cobija King Size',
        description:
          'Cobija King Size para Cama o Sofá, Manta Ultrasuave y Transpirable, Calidad Premium, Afelpado Tipo Borrego Térmico para Climas Fríos, Ligera, 220 * 240 cm (Perla, King Size)',
        price: 799.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/bluelander_cobija.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Mosley 4 almohadas decorativas',
        description: 'Mosley Paquete de 4 Piezas, Relleno hipoalergénico de Almohada de Forma Cuadrada, 50x50 Cms (4, 50.5x50.5 cm)',
        price: 499.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/mosley_almohadas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'SELECTSHOP Set De 2 Almohadas',
        description:
          'Set De 2 Almohada De Memory Foam Triturado Ultra Suave Cojin Ajustable con Funda Exterior Antibacterial Transpirable Almohada Comoda Confortable Suoper Comoda 45 X 64 cm',
        price: 529.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/selectshop-almohadas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de 6 Toallas de Baño',
        description:
          '100% Algodón, Ultra Suave, Resistentes a la Decoloración, Secado Rápido, Extra Absorbentes, 2 Toallas de Baño, 2 Toallas de Mano, 2 Toallitas, Hotel y SPA - Gris',
        price: 569.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/toallas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de accesorios de baño',
        description:
          '5 accesorios de baño negro conjunto completo con dispensador de jabón de loción, titular del cepillo de dientes, titular de Qtip, la bandeja de la vaniy jabon,organizador de la decoración del cuarto de baño,negro mate',
        price: 699.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/accesorios_bano.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Foindtower - Juego de 2 fundas de almohada',
        description:
          'Juego de 2 fundas de almohada decorativas de lino con flecos, acogedoras, bohemias, para sofá, cama, sala de estar, decoración del hogar, 45.72 x 45.72 cm, color verde oliva',
        price: 579.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/juego_fundas.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'AI-PIKA Tapete para Baño de Piedra',
        description:
          'Tapete de Ducha de Tierra Diatomácea, Superficie Absorbente Instantánea, Secado Rápido en 30 Segundos, Antideslizante, Fácil de Limpiar, Apto para Tina de Baño',
        price: 499.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/aipika_tapete_piedra.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'VASAGLE Cesto para Ropa Sucia',
        description:
          'VASAGLE Cesto para Ropa Sucia, Cesta Colada, 2 Bolsas Colada de Tela Oxford Extraíble y Desmontable, 2 x 46 L, 73 x 33 x 72 cm, Estante, Marco Metálico, Negro',
        price: 927.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/vasagle_cesto_ropa.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'ZOMILUX - 20 Ganchos De Madera para Ropa',
        description:
          'ZOMILUX - Ganchos De Madera para Ropa - Ganchos para Pantalones – Barra Antideslizante - Ganchos para Ropa Madera Premium – Gancho Giratorio 360 Grados – Ultra Resistentes y Duraderos de Alta Calidad',
        price: 749.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/ganchos.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Greenote aspiradora inalambrica',
        description:
          '22000 Pa aspiradora de Mano 4 en 1, 200 W aspiradoras potentes con LED, Vacuum Cleaner de función de autoportante, Cepillo para Suelos Duros/pelos de Mascotas',
        price: 1888.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/greenote.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Vaporizador de Ropa',
        description: 'Oster® Vaporizador de Ropa de Pedestal Vertical, con Gancho 360° para Sostener las Prendas, Negro',
        price: 1599.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/oster_vaporizador.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'JOYMOOP - Juego de mopa y cubeta',
        description:
          'JOYMOOP - Juego de mopa y cubeta con escurridor Plano, Almohadillas Microfibra Reutilizables, Uso húmedo y seco, Ideal para Madera, Laminado y cerámica',
        price: 986.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/joymoop_juego.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Freidora de Aire Digital',
        description:
          'Oster® Freidora de Aire Digital con Recubrimiento Oster® DiamondForce, Ventana y Luz Interna, 4L de Capacidad, con 10 Programas Automáticos CKSTAF40WDDF',
        price: 1440.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/oster_airfryer.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Ninja - Licuadora TWISTi',
        description: 'Ninja - Licuadora TWISTi con 5 programas Auto-iQ + 2 vasos, Gris | SS151',
        price: 3999.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/ninja_licuadora.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cafetera Nespresso Vertuo Next',
        description:
          'Cafetera Nespresso Vertuo Next, Cafetera de Cápsulas, Máquina de Café Espresso, Cafetera Automática, Cafetera Eléctrica, Cafetera Negra',
        price: 3999.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/nespresso.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Batidora de Inmersión',
        description: 'Oster® Batidora de Inmersión con Vaso Medidor, Picador y Globo Batidor, 2 Velocidades, 300 W, Negra',
        price: 799.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/oster_wafflera.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Tostador de 2 Rebanadas',
        description:
          'Oster® Tostador de 2 Rebanadas, 7 Niveles de Tostado, Ranuras Extra Anchas, Función para Cancelar, Bagel, Descongelar y Recalentar, Negro',
        price: 699.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/oster_toaster.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Hervidor Eléctrico',
        description: 'Oster® Hervidor Eléctrico de 1.7 L, Apagado Automático, Filtro Removible, Luz Indicadora, Libre de BPA, Negro',
        price: 599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Utensilios de Cocina',
        description:
          'Juego de Utensilios de Cocina de Silicona, 11 Piezas, Resistentes al Calor, No Tóxicos, Antiadherentes, con Soporte, Negro',
        price: 499.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/juego_utensilios.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cuchillos Profesionales',
        description: 'Juego de Cuchillos Profesionales, 15 Piezas, Acero Inoxidable, Mango Ergonómico, con Bloque de Madera, Negro',
        price: 1299.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cuchillos_cocina.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Sartenes Antiadherentes',
        description: 'Juego de Sartenes Antiadherentes, 3 Piezas, Aluminio Forjado, Aptos para Todo Tipo de Cocinas, Negro',
        price: 999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Ollas de Acero Inoxidable',
        description: 'Juego de Ollas de Acero Inoxidable, 10 Piezas, Aptas para Todo Tipo de Cocinas, Asas Ergonómicas, Plateado',
        price: 1499.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/hamilton_olla_coccion.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Vajilla de Porcelana',
        description: 'Juego de Vajilla de Porcelana, 20 Piezas, Resistente a Microondas y Lavavajillas, Blanco',
        price: 1299.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/juego_vajilla.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cubiertos de Acero Inoxidable',
        description: 'Juego de Cubiertos de Acero Inoxidable, 24 Piezas, Resistentes a la Corrosión, Plateado',
        price: 899.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cubiertos_6_juegos.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Vasos de Cristal',
        description: 'Juego de Vasos de Cristal, 12 Piezas, Resistentes a Golpes y Rayones, Transparente',
        price: 599.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/vasos_vidrio.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Copas de Vino',
        description: 'Juego de Copas de Vino, 6 Piezas, Cristal Sin Plomo, Elegantes y Duraderas, Transparente',
        price: 699.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/copas_6.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Tazas de Café',
        description: 'Juego de Tazas de Café, 6 Piezas, Porcelana de Alta Calidad, Resistentes a Microondas y Lavavajillas, Blanco',
        price: 499.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/tazas+cafe.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Tabla de Quesos',
        description: 'Juego de Tabla de Quesos, 5 Piezas, Madera de Bambú, Cuchillos Especiales, Natural',
        price: 599.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/tablas_corte.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Recipientes Herméticos',
        description:
          'EasyWare JUEGO DE RECIPIENTES DE VIDRIO HERMÉTICO, CONTENEDORES Para Alimentos con Tapas Cierre Fácil, Refractarios para Cocina, Horno, Refrigerador Congelador (JUEGO 10 RECIPIENTES (20 PZ))',
        price: 799.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/juego_recipientes_vidrio.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Organizador de Especias',
        description: 'Organizador de Especias, 20 Frascos, Giratorio, Acero Inoxidable, Compacto y Elegante',
        price: 699.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/organizador_especias.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Robot Aspirador',
        description:
          'Robot Aspirador Inteligente, Conectividad WiFi, Compatible con Alexa y Google Assistant, Programable, Autonomía de 120 minutos, Negro',
        price: 3999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Lámpara de Pie Moderna',
        description:
          'Lámpara de Pie Moderna, Luz LED Regulable, 3 Temperaturas de Color, Control Táctil, Ideal para Sala o Dormitorio, Negro',
        price: 1299.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/lampara_piso.png',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Lámparas de Mesa',
        description: 'Juego de Lámparas de Mesa, 2 Piezas, Base de Cerámica, Pantalla de Tela, Elegantes y Modernas, Gris',
        price: 999.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/lampara_mesa.png',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cuadros Decorativos',
        description: 'Juego de Cuadros Decorativos, 3 Piezas, Estilo Abstracto, Marco de Madera, Ideal para Sala o Dormitorio',
        price: 1299.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Alfombra de Área',
        description: 'Alfombra de Área, 160x230cm, Material Sintético de Alta Calidad, Diseño Geométrico, Gris y Blanco',
        price: 1699.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cortinas Blackout',
        description: 'Juego de Cortinas Blackout, 2 Paneles, 140x240cm cada uno, Aislantes Térmicas, Reduce Ruido, Gris Oscuro',
        price: 999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Organizador de Zapatos',
        description: 'Organizador de Zapatos, Capacidad para 20 Pares, Estructura de Metal, Fácil Montaje, Negro',
        price: 799.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/zapatero.png',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Accesorios para Baño',
        description: 'Juego de Accesorios para Baño, 5 Piezas, Acero Inoxidable, Incluye Toallero, Portapapel, Ganchos y más, Cromado',
        price: 899.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Organizador de Maquillaje',
        description: 'Organizador de Maquillaje, Acrílico Transparente, Múltiples Compartimentos, Elegante y Funcional',
        price: 599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Espejo de Maquillaje con Luz',
        description: 'Espejo de Maquillaje con Luz LED, Aumento 1x/5x/10x, Recargable, Ajustable, Ideal para Tocador',
        price: 799.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Secador de Pelo Profesional',
        description: 'Secador de Pelo Profesional, 2200W, Tecnología Iónica, 3 Temperaturas, 2 Velocidades, Concentrador y Difusor, Negro',
        price: 999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Plancha de Pelo Profesional',
        description:
          'Plancha de Pelo Profesional, Placas de Cerámica, Temperatura Ajustable, Calentamiento Rápido, Apagado Automático, Negro',
        price: 899.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'EKO Mirage-T Bote de Basura',
        description:
          'EKO Mirage-T Bote de Basura Rectangular con Sensor de Movimiento sin Contacto de 50 litros, Acabado de Acero Inoxidable Cepillado',
        price: 2199.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/bote_basura.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Libbey Vajilla de Vidrio',
        description: 'Libbey Vajilla de Vidrio Tempo 12 Piezaserno',
        price: 1299.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/libbie_vajilla_vidrio.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cocktail Bar Set Kit 23 Piezas',
        description:
          'Cocktail Bar Set Kit 23 Piezas Utensilios de Bar, Coctelera 750ML Barra de Coctelería de Acero Inoxidable Juego de Cóctel con Soporte Conjuntos para el Bar, Coctelera de Cóctel Hogar Mezclar Bebidas.',
        price: 599.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cocktail_bar_set.jpeg',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cúpula de Cristal Transparente',
        description: 'MyGift - Cúpula pequeña de Cristal Transparente para postres o quesos de 19 cm con Bandeja de Madera de Acacia',
        price: 799.0,
        imageUrl: 'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/cupula_cristal.jpeg',
        weddingListId: weddingList.id,
      },
    }),
  ]);

  // Associate gifts with categories
  await Promise.all([
    // Juego de Vajilla -> Cocina
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[0].id, categoryId: cocinaCategory.id, weddingListId: weddingList.id },
    }),
    // Licuadora -> Electrodomésticos
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[1].id, categoryId: electroCategory.id, weddingListId: weddingList.id },
    }),
    // Juego de Toallas -> Baño
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[2].id, categoryId: banoCategory.id, weddingListId: weddingList.id },
    }),
    // TV -> Electrodomésticos
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[3].id, categoryId: electroCategory.id, weddingListId: weddingList.id },
    }),
    // Cena en Islandia -> Viaje
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[4].id, categoryId: viajeCategory.id, weddingListId: weddingList.id },
    }),
    // Tour por Dolomitas -> Viaje
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[5].id, categoryId: viajeCategory.id, weddingListId: weddingList.id },
    }),

    // Nespresso -> Electrodomésticos + Cocina (example of multiple categories)
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[6].id, categoryId: electroCategory.id, weddingListId: weddingList.id },
    }),
    prisma.giftCategoryOnGift.create({
      data: { giftId: gifts[6].id, categoryId: cocinaCategory.id, weddingListId: weddingList.id },
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

  // Update the isPurchased status for the first few gift

  console.log(`Created ${4} users, 1 wedding list and ${gifts.length} gifts`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
