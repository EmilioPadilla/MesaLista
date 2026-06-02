import {
  User as UserIcon,
  KeyRound,
  Image as ImageIcon,
  FileText,
  Eye,
  CreditCard,
  MessageSquare,
  Heart,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

export type SectionId =
  | 'perfil'
  | 'contrasena'
  | 'portada'
  | 'informacion'
  | 'privacidad'
  | 'comisiones'
  | 'rsvp'
  | 'agradecimiento'
  | 'eliminar-cuenta';

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
        id: 'perfil',
        label: 'Perfil',
        icon: UserIcon,
        group: 'Cuenta',
        title: 'Perfil',
        description: 'Tu información de contacto y los datos de tu pareja.',
      },
      {
        id: 'contrasena',
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
        id: 'portada',
        label: 'Imagen de portada',
        icon: ImageIcon,
        group: 'Mesa de regalos',
        title: 'Imagen de portada',
        description: 'Esta imagen aparecerá como portada de tu página de regalos.',
      },
      {
        id: 'informacion',
        label: 'Información general',
        icon: FileText,
        group: 'Mesa de regalos',
        title: 'Información de la mesa',
        description: 'La dirección web, lugar, fecha y el mensaje que verán tus invitados.',
      },
      {
        id: 'privacidad',
        label: 'Privacidad',
        icon: Eye,
        group: 'Mesa de regalos',
        title: 'Privacidad de tu mesa',
        description: 'Controla si tu mesa de regalos aparece en la página de búsqueda pública.',
      },
      {
        id: 'comisiones',
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
      {
        id: 'agradecimiento',
        label: 'Mensaje de agradecimiento',
        icon: Heart,
        group: 'Invitados',
        title: 'Mensaje de agradecimiento',
        description: 'El mensaje que tus invitados verán en el correo de confirmación al regalarte algo. Si lo dejas vacío, no se incluirá.',
      },
    ],
  },
  {
    label: 'Zona avanzada',
    items: [
      {
        id: 'eliminar-cuenta',
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

export const GIFT_LIST_SECTIONS: SectionId[] = ['portada', 'informacion', 'privacidad', 'comisiones', 'rsvp', 'agradecimiento'];
