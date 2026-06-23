import { CreditCard, TrendingUp } from 'lucide-react';

export const faqs = [
  {
    question: '¿Cómo funciona la mesa de regalos digital?',
    answer:
      'MesaLista funciona siendo una plataforma digital en donde tu eliges la “idea” de los regalos que quieras recibir, ya sean cosas físicas, experiencias, servicios, etc… Tu fijas un monto, foto y descripción de cada regalo. Al finalizar tu evento, tu recibes el 100% de lo recaudado en una transferencia en tu cuenta de banco.',
  },
  {
    question: '¿Cómo puedo retirar mis fondos?',
    answer:
      'En la semana de tu evento te enviaremos un correo para solicitar tu número de cuenta Clabe así como la carátula de tu estado de cuenta donde podamos ver el nombre tuyo o de tu pareja. Una vez que finalice tu evento, te haremos llegar el resumen de tu Mesa de Regalos para que nos confirmes y enviaremos los fondos en un lapso menor a 15 días hábiles.',
  },
  {
    question: '¿Qué tipo de pagos aceptas?',
    answer: 'Actualmente, aceptamos pagos por medio de PayPal y tarjeta de débito o crédito.',
  },
  {
    question: '¿Qué pasa si mi evento se pospone?',
    answer:
      'Entendemos que las fechas pueden cambiar. Ofrecemos flexibilidad total para ajustar las fechas de tu evento sin costo adicional.',
  },
  {
    question: '¿Puedo usar MesaLista para otros eventos además de bodas?',
    answer:
      '¡Definitivamente! Nuestros planes funcionan perfectamente para baby showers, aniversarios, quinceañeras y cualquier celebración especial.',
  },
  {
    question: '¿Puedo abrir mi mesa de regalos desde otro país?',
    answer:
      'Por el momento solamente tenemos servicio en México y trabajamos con pesos mexicanos, sin embargo, si puedes recibir dinero de tarjetas de otro país.',
  },
  {
    question: '¿Las plataformas cobran comisión por uso?',
    answer:
      'Sí, tanto Stripe como PayPal cobran un porcentaje en cada transacción por el uso de su plataforma, por lo general es entre un 3.00% y un 4.50%. En la configuración de tu mesa puedes elegir si quieres absorber tú esa comisión o si prefieres que a tus invitados se les cobre a la hora de hacer el pago.',
  },
  {
    question: '¿Cómo se maneja la información de mi tarjeta?',
    answer: 'Nuestro sistema no almacena información de formas de pago. Todo el manejo de pagos se realiza a través de Stripe y Paypal.',
  },
  {
    question: '¿Puedo facturar mi mesa de regalos?',
    answer: 'Si, en caso de necesitar factura, por favor envíanos un correo a info@mesalista.com o un WhatsApp al +52 446 306 9982.',
  },
];

export const plans = [
  {
    name: 'Plan Fijo',
    description: 'Pago único',
    price: '$2,000 MXN',
    period: 'pago único',
    icon: CreditCard,
    color: 'text-[#d4704a]',
    bgColor: 'bg-[#d4704a]',
    bgGradient: 'from-white to-[#d4704a]/5',
    iconBg: 'bg-[#d4704a]/10',
    features: [
      'Mesa de regalos ilimitada',
      'Sin comisiones por ventas de MesaLista',
      'Pagos seguros con Stripe y PayPal',
      'Gestión de RSVPs con códigos únicos',
      'Listas prediseñadas por expertos (6+ colecciones)',
      'Estadísticas en tiempo real',
      'Control de privacidad de tu mesa',
      'Elige quién paga las comisiones de pago',
      'Invitados ilimitados',
      'Soporte dedicado',
    ],
    limitations: [],
    popular: true,
    cta: 'Comenzar con Plan Fijo',
  },
  {
    name: 'Plan por Comisión',
    description: 'Comisión de 3.00% por cada venta',
    price: '3.00%',
    period: 'por cada venta',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    bgGradient: 'from-white to-green-50',
    iconBg: 'bg-green-100',
    features: [
      'Mesa de regalos ilimitada',
      'Sin costo inicial — perfecto para comenzar',
      'Pagos seguros con Stripe y PayPal',
      'Gestión de RSVPs con códigos únicos',
      'Listas prediseñadas por expertos (6+ colecciones)',
      'Estadísticas en tiempo real',
      'Control de privacidad de tu mesa',
      'Elige quién paga las comisiones de pago',
      'Invitados ilimitados',
      'Soporte dedicado',
    ],
    limitations: [],
    popular: false,
    cta: 'Comenzar con Comisión',
  },
];
