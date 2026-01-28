export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'MesaLista',
  'url': 'https://www.mesalista.com.mx',
  'logo': 'https://www.mesalista.com.mx/svg/MesaLista_isotipo.svg',
  'description': 'Plataforma digital para crear mesas de regalos de eventos en México',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'MX',
  },
  'contactPoint': {
    '@type': 'ContactPoint',
    'contactType': 'customer service',
    'availableLanguage': 'Spanish',
  },
  'sameAs': ['https://www.facebook.com/mesalista', 'https://www.instagram.com/mesalista'],
};

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  'serviceType': 'Mesa de Regalos Digital',
  'provider': {
    '@type': 'Organization',
    'name': 'MesaLista',
    'url': 'https://www.mesalista.com.mx',
  },
  'areaServed': {
    '@type': 'Country',
    'name': 'México',
  },
  'description': 'Servicio de mesa de regalos digital para eventos. Gestiona RSVP, recibe regalos en efectivo o productos.',
  'offers': {
    '@type': 'Offer',
    'availability': 'https://schema.org/InStock',
    'price': '0',
    'priceCurrency': 'MXN',
  },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'MesaLista',
  'url': 'https://www.mesalista.com.mx',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': 'https://www.mesalista.com.mx/buscar?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url,
  })),
});

export const faqSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map((faq) => ({
    '@type': 'Question',
    'name': faq.question,
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': faq.answer,
    },
  })),
});

export const productSchema = (product: { name: string; description: string; image: string; price: number; currency?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': product.name,
  'description': product.description,
  'image': product.image,
  'offers': {
    '@type': 'Offer',
    'price': product.price,
    'priceCurrency': product.currency || 'MXN',
    'availability': 'https://schema.org/InStock',
  },
});

export const eventSchema = (event: { name: string; startDate: string; endDate?: string; location?: string; description?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  'name': event.name,
  'startDate': event.startDate,
  'endDate': event.endDate,
  'location': event.location
    ? {
        '@type': 'Place',
        'name': event.location,
      }
    : undefined,
  'description': event.description,
  'organizer': {
    '@type': 'Organization',
    'name': 'MesaLista',
    'url': 'https://www.mesalista.com.mx',
  },
});
