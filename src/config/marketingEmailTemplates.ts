/**
 * Centralized marketing email templates configuration
 * Used across admin components for sending marketing emails to users
 */

export type MarketingEmailType = 1 | 2 | 3 | 4 | 'inactive_warning';

export interface MarketingEmailTemplate {
  type: MarketingEmailType;
  title: string;
  description: string;
  icon: string;
  color: string;
  timing?: string;
}

export const MARKETING_EMAIL_TEMPLATES: MarketingEmailTemplate[] = [
  {
    type: 1,
    title: 'Email 1: Bienvenida y Características',
    description: 'Presenta las características principales de MesaLista y recuerda por qué eligieron la plataforma.',
    icon: '👋',
    color: 'from-orange-400 to-orange-600',
    timing: 'Enviar 1-2 días después del registro',
  },
  {
    type: 2,
    title: 'Email 2: Guía de Inicio Rápido',
    description: 'Guía paso a paso para completar su mesa de regalos en 3 pasos simples.',
    icon: '🚀',
    color: 'from-blue-400 to-purple-600',
    timing: 'Enviar 3-4 días después si no hay actividad',
  },
  {
    type: 3,
    title: 'Email 3: Prueba Social e Historias de Éxito',
    description: 'Testimonios de parejas reales y estadísticas de la plataforma para generar confianza.',
    icon: '⭐',
    color: 'from-pink-400 to-orange-500',
    timing: 'Enviar 7 días después del registro',
  },
  {
    type: 4,
    title: 'Email 4: Re-engagement y Oferta Especial',
    description: 'Último empujón con urgencia y oferta especial para usuarios inactivos.',
    icon: '💜',
    color: 'from-purple-500 to-pink-500',
    timing: 'Enviar 14 días después si aún inactivo',
  },
  {
    type: 'inactive_warning',
    title: 'Advertencia de Inactividad',
    description: 'Email para usuarios inactivos por más de un mes sin regalos en su lista. Advierte sobre cierre de cuenta en 30 días.',
    icon: '⚠️',
    color: 'from-amber-400 to-orange-500',
    timing: 'Enviar cuando el usuario esté inactivo por más de 1 mes',
  },
];

/**
 * Get a specific email template by type
 */
export const getEmailTemplate = (type: MarketingEmailType): MarketingEmailTemplate | undefined => {
  return MARKETING_EMAIL_TEMPLATES.find((template) => template.type === type);
};

/**
 * Get all email templates
 */
export const getAllEmailTemplates = (): MarketingEmailTemplate[] => {
  return MARKETING_EMAIL_TEMPLATES;
};
