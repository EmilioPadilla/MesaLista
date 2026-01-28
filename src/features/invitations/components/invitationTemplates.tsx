import type { InvitationTemplate } from 'types/models/invitation';
import React from 'react';
import {
  ElegantWeddingTemplate,
  ModernMinimalistTemplate,
  FloralRomanceTemplate,
  BoldCelebrationTemplate,
  BabyShowerTemplate,
  AnniversaryTemplate,
} from './templates';

// Template definitions
export const invitationTemplates: InvitationTemplate[] = [
  {
    id: 'elegant-wedding',
    name: 'Boda Elegante',
    description: 'Diseño clásico y sofisticado perfecto para bodas formales',
    thumbnail: 'wedding-elegant',
    category: 'wedding',
    previewComponent: 'ElegantWeddingPreview',
    fields: [
      { key: 'title', label: 'Nombres de los Novios', type: 'text', placeholder: 'Ana & Carlos', defaultValue: '' },
      {
        key: 'subtitle',
        label: 'Subtítulo',
        type: 'text',
        placeholder: 'Te invitamos a celebrar nuestra boda',
        defaultValue: 'Te invitamos a celebrar nuestra boda',
      },
      { key: 'date', label: 'Fecha del Evento', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '18:00', defaultValue: '18:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Hacienda San Miguel, Guadalajara', defaultValue: '' },
      {
        key: 'message',
        label: 'Mensaje Personal',
        type: 'textarea',
        placeholder: 'Será un honor contar con tu presencia...',
        defaultValue: '',
      },
    ],
  },
  {
    id: 'modern-minimalist',
    name: 'Minimalista Moderno',
    description: 'Diseño limpio y elegante con enfoque minimalista',
    thumbnail: 'modern-minimalist',
    category: 'wedding',
    previewComponent: 'ModernMinimalistPreview',
    fields: [
      { key: 'title', label: 'Título del Evento', type: 'text', placeholder: 'Nuestra Boda', defaultValue: '' },
      { key: 'names', label: 'Nombres', type: 'text', placeholder: 'Ana & Carlos', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '18:00', defaultValue: '18:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Lugar del evento', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Tu presencia es nuestro mejor regalo', defaultValue: '' },
    ],
  },
  {
    id: 'floral-romance',
    name: 'Romance Floral',
    description: 'Diseño romántico con detalles florales',
    thumbnail: 'floral-romance',
    category: 'wedding',
    previewComponent: 'FloralRomancePreview',
    fields: [
      { key: 'title', label: 'Nombres de los Novios', type: 'text', placeholder: 'Ana & Carlos', defaultValue: '' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Nos casamos', defaultValue: 'Nos casamos' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '18:00', defaultValue: '18:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Jardín Botánico', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Celebra con nosotros', defaultValue: '' },
    ],
  },
  {
    id: 'bold-celebration',
    name: 'Celebración Audaz',
    description: 'Diseño vibrante y colorido para fiestas',
    thumbnail: 'bold-celebration',
    category: 'birthday',
    previewComponent: 'BoldCelebrationPreview',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: '¡Estás Invitado!', defaultValue: '¡Estás Invitado!' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'A mi fiesta', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '20:00', defaultValue: '20:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Salón de Fiestas', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: '¡Ven a celebrar!', defaultValue: '' },
    ],
  },
  {
    id: 'baby-shower-soft',
    name: 'Baby Shower Suave',
    description: 'Diseño tierno para celebrar la llegada del bebé',
    thumbnail: 'baby-shower',
    category: 'baby-shower',
    previewComponent: 'BabyShowerPreview',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Baby Shower', defaultValue: 'Baby Shower' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Celebrando la llegada de', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '16:00', defaultValue: '16:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Casa de la familia', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Acompáñanos a celebrar', defaultValue: '' },
    ],
  },
  {
    id: 'anniversary-golden',
    name: 'Aniversario Dorado',
    description: 'Diseño elegante para celebrar aniversarios',
    thumbnail: 'anniversary',
    category: 'anniversary',
    previewComponent: 'AnniversaryPreview',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Aniversario', defaultValue: 'Aniversario' },
      { key: 'names', label: 'Nombres', type: 'text', placeholder: 'Ana & Carlos', defaultValue: '' },
      { key: 'date', label: 'Fecha', type: 'date', placeholder: '', defaultValue: '' },
      { key: 'time', label: 'Hora', type: 'time', placeholder: '19:00', defaultValue: '19:00' },
      { key: 'location', label: 'Ubicación', type: 'location', placeholder: 'Restaurante', defaultValue: '' },
      { key: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Celebra con nosotros', defaultValue: '' },
    ],
  },
];

export function getTemplateById(templateId: string): InvitationTemplate | undefined {
  return invitationTemplates.find((t) => t.id === templateId);
}

export interface InvitationSection {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  order: number;
  description: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
}

/**
 * Centralized function to render the appropriate template component based on templateId
 */
export function renderTemplateComponent(
  templateId: string,
  data: Record<string, any>,
  formatDate: (dateString: string) => string,
  sections?: InvitationSection[],
  palette?: ColorPalette,
): React.ReactElement {
  const templateProps = { data, formatDate, sections, palette };

  switch (templateId) {
    case 'elegant-wedding':
      return <ElegantWeddingTemplate {...templateProps} />;
    case 'modern-minimalist':
      return <ModernMinimalistTemplate {...templateProps} />;
    case 'floral-romance':
      return <FloralRomanceTemplate {...templateProps} />;
    case 'bold-celebration':
      return <BoldCelebrationTemplate {...templateProps} />;
    case 'baby-shower-soft':
      return <BabyShowerTemplate {...templateProps} />;
    case 'anniversary-golden':
      return <AnniversaryTemplate {...templateProps} />;
    default:
      return <ElegantWeddingTemplate {...templateProps} />;
  }
}
