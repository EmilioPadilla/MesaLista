import { useDocumentHead } from 'src/hooks/useDocumentHead';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'MesaLista - Mesa de Regalos Digital para tu Evento',
  description = 'Crea tu mesa de regalos en minutos. Gestiona RSVP, recibe regalos en efectivo o productos. Fácil, elegante y sin comisiones ocultas.',
  keywords = 'mesa de regalos, evento, matrimonio, regalos de evento, lista de eventos, RSVP, confirmaciones, regalos digitales, México',
  canonicalUrl,
  ogImage = 'https://www.mesalista.com.mx/og-image.jpg',
  ogType = 'website',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title.includes('MesaLista') ? title : `${title} | MesaLista`;
  const url = canonicalUrl || `https://www.mesalista.com.mx${window.location.pathname}`;

  useDocumentHead({
    title: fullTitle,
    meta: [
      { name: 'title', content: fullTitle },
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' },
      // Open Graph / Facebook
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: url },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:locale', content: 'es_MX' },
      { property: 'og:site_name', content: 'MesaLista' },
      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: url },
      { property: 'twitter:title', content: fullTitle },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: ogImage },
    ],
    link: [{ rel: 'canonical', href: url }],
    script: structuredData ? JSON.stringify(structuredData) : undefined,
  });

  return null;
};
