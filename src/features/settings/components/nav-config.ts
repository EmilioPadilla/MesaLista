import {
  User as UserIcon,
  KeyRound,
  Image as ImageIcon,
  FileText,
  Eye,
  CreditCard,
  MessageSquare,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export type SectionId = 'profile' | 'password' | 'cover' | 'details' | 'privacy' | 'fees' | 'rsvp' | 'danger';

export type SectionMeta = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  group: string;
  title: string;
  description: string;
  danger?: boolean;
};

export type SectionGroup = { label: string; items: SectionMeta[] };

export const GROUPS: SectionGroup[] = [
  {
    label: 'Cuenta',
    items: [
      {
        id: 'profile',
        label: 'Perfil',
        icon: UserIcon,
        group: 'Cuenta',
        title: 'Perfil',
        description: 'Tu información de contacto y los datos de tu pareja.',
      },
      {
        id: 'password',
        label: 'Contraseña',
        icon: KeyRound,
        group: 'Cuenta',
        title: 'Cambiar contraseña',
        description: 'Actualiza tu contraseña para mantener tu cuenta segura.',
      },
    ],
  },
  {
    label: 'Mesa de regalos',
    items: [
      {
        id: 'cover',
        label: 'Imagen de portada',
        icon: ImageIcon,
        group: 'Mesa de regalos',
        title: 'Imagen de portada',
        description: 'Esta imagen aparecerá como portada de tu página de regalos.',
      },
      {
        id: 'details',
        label: 'Información general',
        icon: FileText,
        group: 'Mesa de regalos',
        title: 'Información de la mesa',
        description: 'La dirección web, lugar, fecha y el mensaje que verán tus invitados.',
      },
      {
        id: 'privacy',
        label: 'Privacidad',
        icon: Eye,
        group: 'Mesa de regalos',
        title: 'Privacidad de tu mesa',
        description: 'Controla si tu mesa de regalos aparece en la página de búsqueda pública.',
      },
      {
        id: 'fees',
        label: 'Comisiones de pago',
        icon: CreditCard,
        group: 'Mesa de regalos',
        title: 'Comisiones de pago',
        description: 'Decide cómo manejar las comisiones de las plataformas de pago.',
      },
    ],
  },
  {
    label: 'Invitados',
    items: [
      {
        id: 'rsvp',
        label: 'Mensajes RSVP',
        icon: MessageSquare,
        group: 'Invitados',
        title: 'Mensajes RSVP',
        description: 'Personaliza los mensajes que verán tus invitados al confirmar o cancelar su asistencia.',
      },
    ],
  },
  {
    label: 'Zona avanzada',
    items: [
      {
        id: 'danger',
        label: 'Eliminar cuenta',
        icon: Trash2,
        group: 'Zona avanzada',
        title: 'Zona de peligro',
        description: 'Acciones irreversibles. Procede con cuidado.',
        danger: true,
      },
    ],
  },
];

export const SECTION_LOOKUP: Record<SectionId, SectionMeta> = GROUPS.reduce(
  (acc, g) => {
    g.items.forEach((i) => (acc[i.id] = i));
    return acc;
  },
  {} as Record<SectionId, SectionMeta>,
);

export const GIFT_LIST_SECTIONS: SectionId[] = ['cover', 'details', 'privacy', 'fees', 'rsvp'];
