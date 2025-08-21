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
      description: 'Gracias por ser parte de nuestro día especial',
      coupleName: 'Sol & Emilio',
      imageUrl:
        'https://pub-659df55516a64947b3e528a4322c71ac.r2.dev/uploads/4a6987b6-9bcf-440e-89fa-9093d0dc67c8-EmilioandMarianaFullAlbum-143.jpg',
      invitationCount: 170,
      weddingDate: new Date('2025-11-29'),
      weddingLocation: 'Casona de los 5 Patios, Querétaro',
    },
  });

  // Create some sample gifts
  const gifts = await Promise.all([
    prisma.gift.create({
      data: {
        title: 'Laguna Azul / Sky Lagoon',
        description: 'Un spa geotermal en medio de campos de lava. Aguas cálidas, vapor y vista volcánica… ¡Sí, por favor!',
        price: 3600.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour al Círculo Dorado',
        description:
          'Géisers gigantes, cascadas increíbles y volcanes activos. ¡Ayúdanos a empezar la luna de miel explorando Islandia como se debe!',
        price: 2800.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour de auroras boreales',
        description: 'Uno de nuestros mayores sueños: ver auroras tomados de la mano. ¿Nos ayudas a hacerlo realidad?',
        price: 3500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour en bici por Copenhague',
        description: 'Recorrer la ciudad más bike-friendly del mundo como locales, ¡pero enamorados!',
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751312011727?timestamp=1751312012776',
        price: 1400.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Crucero por canales',
        description: 'Navegar por los canales de Copenhague o Estocolmo y brindar con una vista de ensueño.',
        price: 1200.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Moto de nieve sobre un glaciar',
        description: 'A toda velocidad sobre un glaciar eterno. ¡Una aventura que promete adrenalina y vistas impresionantes!',
        price: 2900.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Transporte público',
        description: 'Metro, bus, tren o ferry… ¡para movernos como locales (pero sin perdernos)!',
        price: 500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Castillos nórdicos',
        description: 'Visitar castillos de cuentos en Suecia y Dinamarca. ',
        price: 1600.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cena romántica',
        description: 'Una cena elegante con platillos nórdicos, luz tenue y muchas miradas bonitas.',
        price: 3000.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Desayuno escandinavo',
        description: 'Pan recién horneado, mermeladas caseras y café fuerte. ¿Quién dijo que el desayuno no es romántico?',
        price: 900.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Clase de cocina local',
        description: 'Queremos volver sabiendo preparar smørrebrød o albóndigas suecas. ¡Imaginen el brunch post-boda!',
        price: 2500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Drinks de noche',
        description: '¡Para relajarnos después de un día de mucho conocer!',
        price: 1500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Comida Callejera',
        description: 'Hot dogs islandeses, arenques, regaliz negro… sí, probaremos todo.',
        price: 600.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Hotel boutique en Copenhague',
        description: 'Diseño danés + comodidad + amor = nuestra fórmula perfecta para descansar',
        price: 3500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 noche estancia en Cabaña con jacuzzi',
        description: 'Una noche en medio de la nada, con estrellas, auroras y jacuzzi caliente. Suena perfecto, ¿no?',
        price: 4000.0,
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751335625735?timestamp=1751335626757',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 noche en Hotel con vista a fiordos',
        description: 'Despertar frente a montañas, lagos y neblina mágica. Un sueño nórdico.',
        price: 3400.0,
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751336067359?timestamp=1751336068433',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Masaje en pareja',
        description: 'Después de tantos paseos, ¡nuestros cuerpos agradecerán este apapacho!',
        price: 2500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Sauna tradicional noruega',
        description: 'Cultura, calor y relajación. ¡Un ritual que queremos vivir!',
        price: 1600.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Sesión de fotos en pareja',
        description: 'Un fotógrafo local nos ayudará a capturar momentos mágicos para toda la vida.',
        price: 2000.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Álbum impreso de nuestra luna de miel',
        description: 'Para guardar cada risa, abrazo y paisaje. ¡Y mostrárselos a ustedes después!',
        price: 1200.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Snacks locales',
        description: 'Regaliz, salmón seco, chocolates raros… porque los snacks también son cultura.',
        price: 450.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Aportación vuelos internacionales',
        description:
          'Dicen que el amor te hace volar, ¡pero los boletos también ayudan! Gracias por empujarnos (literalmente) hacia Islandia, nuestro primer destino de luna de miel.',
        price: 1500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Paseo en kayak al atardecer en los fiordos noruegos',
        description: 'Imagínanos remando entre montañas gigantes, aguas tranquilas y un atardecer que pinta el cielo de rosa y naranja.',
        price: 2500.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Trineo con Huskies',
        description: 'Perros felices, nieve por doquier y nosotros en un trineo: como en una película navideña.',
        price: 3000.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tren escénico por Noruega (Flåm Railway)',
        description: 'Uno de los viajes en tren más bellos del mundo: fiordos, cascadas y paisajes de cuento desde nuestra ventanilla.',
        price: 1900.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Tour a cuevas de hielo',
        description: 'Como entrar en un mundo de cristal azul. Un paseo mágico por la naturaleza congelada de Islandia.',
        price: 3600.0,
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751388810819?timestamp=1751388811966',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Avistamiento de ballenas en Islandia',
        description: 'Navegar por aguas frías en busca de gigantes del mar. Un recuerdo impresionante para toda la vida.',
        price: 4300.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Paseo en helicóptero sobre fiordos',
        description: 'Si volar juntos ya es especial, imagina hacerlo sobre montañas y lagos infinitos. ¡Wow!',
        price: 6000.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Brunch nórdico con vista',
        description: 'Panes artesanales, arenque, café fuerte y un paisaje de postal. Un desayuno que no olvidaremos.',
        price: 1000.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: '1 Noche en el Icehotel de Jukkasjärvi',
        description:
          'Dormir en una habitación hecha completamente de hielo, con esculturas y sacos térmicos. Una noche fría... pero inolvidable.',
        price: 6800.0,
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751389948506?timestamp=1751389949409',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Almaya: Juego de Sábanas de Microfibra',
        description:
          'Juego de Sábanas de Microfibra Suave de Lujo con Doble Cepillado / 1800 Hilos de Alta Calidad y Bolsillo Lateral para Accesorios (Plata, King Size)',
        price: 747.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'BATTILO HOME - Manta gris oscuro',
        description:
          'BATTILO HOME - Manta gris oscuro para sofá, manta de punto de carbón versátil para silla, 152.4 x 203.2 cm, manta gris cálida súper suave con borlas para cama, sofá y sala de estar',
        price: 780.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'ESQUIMAL Edredón Acolchado',
        description: 'Edredón Acolchado Relleno Down Alternative Ultra Suave. Ideal para Funda Duvet. Hipoalergénico. (Blanco, King Size)',
        price: 1099.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Bluelander Cobija King Size',
        description:
          'Cobija King Size para Cama o Sofá, Manta Ultrasuave y Transpirable, Calidad Premium, Afelpado Tipo Borrego Térmico para Climas Fríos, Ligera, 220 * 240 cm (Perla, King Size)',
        price: 799.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Mosley 4 almohadas decorativas',
        description: 'Mosley Paquete de 4 Piezas, Relleno hipoalergénico de Almohada de Forma Cuadrada, 50x50 Cms (4, 50.5x50.5 cm)',
        price: 499.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'SELECTSHOP Set De 2 Almohadas',
        description:
          'Set De 2 Almohada De Memory Foam Triturado Ultra Suave Cojin Ajustable con Funda Exterior Antibacterial Transpirable Almohada Comoda Confortable Suoper Comoda 45 X 64 cm',
        price: 529.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de 6 Toallas de Baño',
        description:
          '100% Algodón, Ultra Suave, Resistentes a la Decoloración, Secado Rápido, Extra Absorbentes, 2 Toallas de Baño, 2 Toallas de Mano, 2 Toallitas, Hotel y SPA - Gris',
        price: 569.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de accesorios de baño',
        description:
          '5 accesorios de baño negro conjunto completo con dispensador de jabón de loción, titular del cepillo de dientes, titular de Qtip, la bandeja de la vaniy jabon,organizador de la decoración del cuarto de baño,negro mate',
        price: 699.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Foindtower - Juego de 2 fundas de almohada',
        description:
          'Juego de 2 fundas de almohada decorativas de lino con flecos, acogedoras, bohemias, para sofá, cama, sala de estar, decoración del hogar, 45.72 x 45.72 cm, color verde oliva',
        price: 579.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'AI-PIKA Tapete para Baño de Piedra',
        description:
          'Tapete de Ducha de Tierra Diatomácea, Superficie Absorbente Instantánea, Secado Rápido en 30 Segundos, Antideslizante, Fácil de Limpiar, Apto para Tina de Baño',
        price: 499.0,
        imageUrl: 'https://s3-us-west-2.amazonaws.com/uniko-prod/tmp/images/1751310392449?timestamp=1751310393350',
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'VASAGLE Cesto para Ropa Sucia',
        description:
          'VASAGLE Cesto para Ropa Sucia, Cesta Colada, 2 Bolsas Colada de Tela Oxford Extraíble y Desmontable, 2 x 46 L, 73 x 33 x 72 cm, Estante, Marco Metálico, Negro',
        price: 927.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'ZOMILUX - 20 Ganchos De Madera para Ropa',
        description:
          'ZOMILUX - Ganchos De Madera para Ropa - Ganchos para Pantalones – Barra Antideslizante - Ganchos para Ropa Madera Premium – Gancho Giratorio 360 Grados – Ultra Resistentes y Duraderos de Alta Calidad',
        price: 749.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Greenote aspiradora inalambrica',
        description:
          '22000 Pa aspiradora de Mano 4 en 1, 200 W aspiradoras potentes con LED, Vacuum Cleaner de función de autoportante, Cepillo para Suelos Duros/pelos de Mascotas',
        price: 1888.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Vaporizador de Ropa',
        description: 'Oster® Vaporizador de Ropa de Pedestal Vertical, con Gancho 360° para Sostener las Prendas, Negro',
        price: 1599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'JOYMOOP - Juego de mopa y cubeta',
        description:
          'JOYMOOP - Juego de mopa y cubeta con escurridor Plano, Almohadillas Microfibra Reutilizables, Uso húmedo y seco, Ideal para Madera, Laminado y cerámica',
        price: 986.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Freidora de Aire Digital',
        description:
          'Oster® Freidora de Aire Digital con Recubrimiento Oster® DiamondForce, Ventana y Luz Interna, 4L de Capacidad, con 10 Programas Automáticos CKSTAF40WDDF',
        price: 1440.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Ninja - Licuadora TWISTi',
        description: 'Ninja - Licuadora TWISTi con 5 programas Auto-iQ + 2 vasos, Gris | SS151',
        price: 3999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Cafetera Nespresso Vertuo Next',
        description:
          'Cafetera Nespresso Vertuo Next, Cafetera de Cápsulas, Máquina de Café Espresso, Cafetera Automática, Cafetera Eléctrica, Cafetera Negra',
        price: 3999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Batidora de Inmersión',
        description: 'Oster® Batidora de Inmersión con Vaso Medidor, Picador y Globo Batidor, 2 Velocidades, 300 W, Negra',
        price: 799.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Oster® Tostador de 2 Rebanadas',
        description:
          'Oster® Tostador de 2 Rebanadas, 7 Niveles de Tostado, Ranuras Extra Anchas, Función para Cancelar, Bagel, Descongelar y Recalentar, Negro',
        price: 699.0,
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
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cuchillos Profesionales',
        description: 'Juego de Cuchillos Profesionales, 15 Piezas, Acero Inoxidable, Mango Ergonómico, con Bloque de Madera, Negro',
        price: 1299.0,
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
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Vajilla de Porcelana',
        description: 'Juego de Vajilla de Porcelana, 20 Piezas, Resistente a Microondas y Lavavajillas, Blanco',
        price: 1299.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Cubiertos de Acero Inoxidable',
        description: 'Juego de Cubiertos de Acero Inoxidable, 24 Piezas, Resistentes a la Corrosión, Plateado',
        price: 899.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Vasos de Cristal',
        description: 'Juego de Vasos de Cristal, 12 Piezas, Resistentes a Golpes y Rayones, Transparente',
        price: 599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Copas de Vino',
        description: 'Juego de Copas de Vino, 6 Piezas, Cristal Sin Plomo, Elegantes y Duraderas, Transparente',
        price: 699.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Tazas de Café',
        description: 'Juego de Tazas de Café, 6 Piezas, Porcelana de Alta Calidad, Resistentes a Microondas y Lavavajillas, Blanco',
        price: 499.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Tabla de Quesos',
        description: 'Juego de Tabla de Quesos, 5 Piezas, Madera de Bambú, Cuchillos Especiales, Natural',
        price: 599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Recipientes Herméticos',
        description:
          'Juego de Recipientes Herméticos, 10 Piezas, Vidrio Borosilicato, Aptos para Microondas, Horno, Congelador y Lavavajillas, Transparente',
        price: 799.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Báscula Digital de Cocina',
        description: 'Báscula Digital de Cocina, Precisión de 1g, Capacidad de 5kg, Pantalla LCD, Acero Inoxidable',
        price: 399.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Organizador de Especias',
        description: 'Organizador de Especias, 20 Frascos, Giratorio, Acero Inoxidable, Compacto y Elegante',
        price: 699.0,
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
        title: 'Purificador de Aire',
        description:
          'Purificador de Aire con Filtro HEPA, Elimina 99.97% de Alérgenos, Ideal para Habitaciones de hasta 50m², Silencioso, Blanco',
        price: 2499.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Humidificador Ultrasónico',
        description: 'Humidificador Ultrasónico, 4L de Capacidad, Difusor de Aromas, Apagado Automático, Luz Nocturna, Blanco',
        price: 899.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Ventilador de Torre',
        description: 'Ventilador de Torre, 3 Velocidades, Oscilación, Temporizador, Control Remoto, 76cm de Altura, Negro',
        price: 999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Lámpara de Pie Moderna',
        description:
          'Lámpara de Pie Moderna, Luz LED Regulable, 3 Temperaturas de Color, Control Táctil, Ideal para Sala o Dormitorio, Negro',
        price: 1299.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Lámparas de Mesa',
        description: 'Juego de Lámparas de Mesa, 2 Piezas, Base de Cerámica, Pantalla de Tela, Elegantes y Modernas, Gris',
        price: 999.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Espejo de Pared Decorativo',
        description: 'Espejo de Pared Decorativo, Marco de Metal, Diseño Geométrico, 80cm de Diámetro, Dorado',
        price: 1499.0,
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
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Juego de Toallas Premium',
        description: 'Juego de Toallas Premium, 6 Piezas, 100% Algodón Egipcio, Ultra Absorbentes, Suaves y Duraderas, Gris',
        price: 1299.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Dispensador de Jabón Automático',
        description: 'Dispensador de Jabón Automático, Sensor Infrarrojo, 350ml de Capacidad, Acero Inoxidable, Ideal para Baño o Cocina',
        price: 599.0,
        weddingListId: weddingList.id,
      },
    }),
    prisma.gift.create({
      data: {
        title: 'Báscula de Baño Digital',
        description: 'Báscula de Baño Digital, Vidrio Templado, Pantalla LCD, Capacidad de 180kg, Precisa y Elegante',
        price: 499.0,
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
        title: 'Cortina de Ducha Decorativa',
        description: 'Cortina de Ducha Decorativa, 180x180cm, Material Resistente al Moho, Impermeable, Diseño Moderno, Incluye Ganchos',
        price: 499.0,
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

  // Update the isPurchased status for the first few gifts
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
