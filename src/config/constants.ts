import { CreditCard, TrendingUp } from 'lucide-react';

export const faqs = [
  {
    question: '¿Hay costos ocultos o comisiones adicionales?',
    answer:
      'No hay costos ocultos. Nuestros precios son transparentes y solo pagas la tarifa del plan que elijas. No cobramos comisiones por las compras.',
  },
  {
    question: '¿Cuándo estará disponible el servicio para mi evento?',
    answer:
      'Actualmente, estamos trabajando en la implementación de nuevos servicios y estamos en el proceso de lanzamiento. ¡Te invitamos a que te sigas al perfil de MesaLista para estar al tanto de los nuevos desarrollos!',
  },
  {
    question: '¿Qué tipo de pagos aceptas?',
    answer: 'Actualmente, aceptamos pagos por medio de PayPal y Stripe.',
  },
  {
    question: '¿Qué pasa si mi boda se pospone?',
    answer:
      'Entendemos que las fechas pueden cambiar. Ofrecemos flexibilidad total para ajustar las fechas de tu evento sin costo adicional.',
  },
  {
    question: '¿Puedo usar MesaLista para otros eventos además de bodas?',
    answer:
      '¡Definitivamente! Nuestros planes funcionan perfectamente para baby showers, aniversarios, quinceañeras y cualquier celebración especial.',
  },
  {
    question: '¿Ofrecen soporte en español?',
    answer:
      'Sí, todo nuestro soporte está disponible en español e inglés. Nuestro equipo está ubicado en México y entiende perfectamente las tradiciones locales.',
  },
  {
    question: '¿Cómo se maneja la información de mi tarjeta?',
    answer: 'Nuestro sistema no almacena información de formas de pago. Todo el manejo de pagos se realiza a través de Stripe y Paypal.',
  },
];

export const plans = [
  {
    name: 'Plan Fijo',
    description: 'Pago único',
    price: '$3,000 MXN',
    period: 'pago único',
    icon: CreditCard,
    color: 'text-[#d4704a]',
    bgColor: 'bg-[#d4704a]',
    bgGradient: 'from-white to-[#d4704a]/5',
    iconBg: 'bg-[#d4704a]/10',
    features: ['Mesa de regalos ilimitada', 'Sin comisiones por ventas', 'Soporte al cliente', 'Listas de regalos inspiradas por nosotros'],
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
      'Sin costo inicial',
      'Perfecto para comenzar',
      'Soporte al cliente',
      'Listas de regalos inspiradas por nosotros',
    ],
    limitations: [],
    popular: false,
    cta: 'Comenzar con Comisión',
  },
];
