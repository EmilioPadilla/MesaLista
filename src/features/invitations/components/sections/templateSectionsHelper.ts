import { InvitationSection } from '../InvitationEditor/InvitationSectionManager';

/**
 * Template-specific section configurations
 * Each template has unique sections that make sense for its purpose
 */

// Elegant Wedding Template - Classic formal wedding
export const elegantWeddingSections: InvitationSection[] = [
  { id: 'header', name: 'Encabezado', icon: '👰', enabled: true, order: 1, description: 'Nombres y fecha principal' },
  { id: 'presentation', name: 'Presentación', icon: '👨‍👩‍👧‍👦', enabled: true, order: 2, description: 'Padres de los novios' },
  { id: 'event', name: 'Ceremonia', icon: '💒', enabled: true, order: 3, description: 'Detalles de la ceremonia' },
  { id: 'dresscode', name: 'Código de Vestimenta', icon: '👔', enabled: true, order: 4, description: 'Etiqueta del evento' },
  { id: 'schedule', name: 'Cronograma', icon: '⏰', enabled: true, order: 5, description: 'Itinerario del día' },
  { id: 'accommodation', name: 'Hospedaje', icon: '🏨', enabled: true, order: 6, description: 'Hoteles recomendados' },
  { id: 'gifts', name: 'Mesa de Regalos', icon: '🎁', enabled: true, order: 7, description: 'Opciones de regalo' },
  { id: 'gallery', name: 'Galería', icon: '📸', enabled: true, order: 8, description: 'Fotos de la pareja' },
  { id: 'rsvp', name: 'Confirmación', icon: '✉️', enabled: true, order: 9, description: 'RSVP' },
];

// Modern Minimalist Template - Clean and simple
export const modernMinimalistSections: InvitationSection[] = [
  { id: 'header', name: 'Encabezado', icon: '💍', enabled: true, order: 1, description: 'Nombres y fecha' },
  { id: 'event', name: 'Evento', icon: '📍', enabled: true, order: 2, description: 'Lugar y hora' },
  { id: 'schedule', name: 'Itinerario', icon: '🕐', enabled: true, order: 3, description: 'Programa del día' },
  { id: 'gifts', name: 'Regalos', icon: '🎁', enabled: true, order: 4, description: 'Mesa de regalos' },
  { id: 'gallery', name: 'Fotos', icon: '📷', enabled: true, order: 5, description: 'Galería de imágenes' },
  { id: 'rsvp', name: 'RSVP', icon: '✓', enabled: true, order: 6, description: 'Confirmar asistencia' },
];

// Floral Romance Template - Romantic garden wedding
export const floralRomanceSections: InvitationSection[] = [
  { id: 'header', name: 'Portada Romántica', icon: '🌸', enabled: true, order: 1, description: 'Nombres con flores' },
  { id: 'presentation', name: 'Familias', icon: '💐', enabled: true, order: 2, description: 'Presentación de familias' },
  { id: 'event', name: 'Ceremonia en Jardín', icon: '🌺', enabled: true, order: 3, description: 'Detalles del evento' },
  { id: 'dresscode', name: 'Vestimenta', icon: '👗', enabled: true, order: 4, description: 'Código de vestimenta' },
  { id: 'schedule', name: 'Programa', icon: '🌹', enabled: true, order: 5, description: 'Cronograma floral' },
  { id: 'accommodation', name: 'Alojamiento', icon: '🏡', enabled: true, order: 6, description: 'Lugares para hospedarse' },
  { id: 'gifts', name: 'Detalles de Regalo', icon: '🎀', enabled: true, order: 7, description: 'Mesa de regalos' },
  { id: 'gallery', name: 'Nuestros Momentos', icon: '🌷', enabled: true, order: 8, description: 'Galería romántica' },
  { id: 'rsvp', name: 'Confirmación', icon: '💌', enabled: true, order: 9, description: 'Confirmar presencia' },
];

// Bold Celebration Template - Vibrant party/birthday
export const boldCelebrationSections: InvitationSection[] = [
  { id: 'header', name: '¡Fiesta!', icon: '🎉', enabled: true, order: 1, description: 'Título de la celebración' },
  { id: 'event', name: 'Detalles del Evento', icon: '🎊', enabled: true, order: 2, description: 'Cuándo y dónde' },
  { id: 'schedule', name: 'Actividades', icon: '🎈', enabled: true, order: 3, description: 'Programa de la fiesta' },
  { id: 'dresscode', name: 'Dress Code', icon: '🎭', enabled: true, order: 4, description: 'Cómo vestir' },
  { id: 'gifts', name: 'Regalos', icon: '🎁', enabled: true, order: 5, description: 'Sugerencias de regalo' },
  { id: 'gallery', name: 'Recuerdos', icon: '📸', enabled: true, order: 6, description: 'Fotos del festejado' },
  { id: 'rsvp', name: 'Confirma', icon: '✉️', enabled: true, order: 7, description: 'RSVP' },
];

// Baby Shower Template - Soft and sweet
export const babyShowerSections: InvitationSection[] = [
  { id: 'header', name: 'Bienvenida', icon: '👶', enabled: true, order: 1, description: 'Celebrando al bebé' },
  { id: 'event', name: 'Detalles', icon: '🍼', enabled: true, order: 2, description: 'Fecha y lugar' },
  { id: 'schedule', name: 'Programa', icon: '🎀', enabled: true, order: 3, description: 'Actividades del baby shower' },
  { id: 'gifts', name: 'Lista de Regalos', icon: '🎁', enabled: true, order: 4, description: 'Regalos para el bebé' },
  { id: 'gallery', name: 'Momentos Especiales', icon: '📷', enabled: true, order: 5, description: 'Fotos del embarazo' },
  { id: 'rsvp', name: 'Confirmación', icon: '💌', enabled: true, order: 6, description: 'Confirmar asistencia' },
];

// Anniversary Template - Elegant celebration
export const anniversarySections: InvitationSection[] = [
  { id: 'header', name: 'Aniversario', icon: '💑', enabled: true, order: 1, description: 'Celebración de amor' },
  { id: 'presentation', name: 'Historia', icon: '💕', enabled: true, order: 2, description: 'Nuestra historia juntos' },
  { id: 'event', name: 'Celebración', icon: '🥂', enabled: true, order: 3, description: 'Detalles del evento' },
  { id: 'schedule', name: 'Programa', icon: '⏰', enabled: true, order: 4, description: 'Itinerario de la celebración' },
  { id: 'dresscode', name: 'Vestimenta', icon: '👔', enabled: true, order: 5, description: 'Código de vestimenta' },
  { id: 'gifts', name: 'Regalos', icon: '🎁', enabled: true, order: 6, description: 'Sugerencias de regalo' },
  { id: 'gallery', name: 'A Través de los Años', icon: '📸', enabled: true, order: 7, description: 'Fotos de la pareja' },
  { id: 'rsvp', name: 'Confirmación', icon: '✉️', enabled: true, order: 8, description: 'RSVP' },
];

/**
 * Get sections for a specific template
 */
export function getSectionsForTemplate(templateId: string): InvitationSection[] {
  switch (templateId) {
    case 'elegant-wedding':
      return elegantWeddingSections;
    case 'modern-minimalist':
      return modernMinimalistSections;
    case 'floral-romance':
      return floralRomanceSections;
    case 'bold-celebration':
      return boldCelebrationSections;
    case 'baby-shower-soft':
      return babyShowerSections;
    case 'anniversary-golden':
      return anniversarySections;
    default:
      return elegantWeddingSections;
  }
}
