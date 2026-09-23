/**
 * Admin follow-ups tied to each event's date, shown on /admin/calendario.
 *
 * This is the schedule: what has to happen and how many days before (negative)
 * or after (positive) the event it is due. The server only stores which actions
 * an admin already completed or skipped (EventAction table), so moving a
 * deadline here takes effect for every event with no data migration.
 *
 * The server keeps its own list of valid keys in server/services/eventCalendarService.ts —
 * add a key there too when adding one here.
 */
import type { MarketingEmailType } from './marketingEmailTemplates';

export type EventActionKey = 'bank_info_request' | 'bank_info_received' | 'payout_sent';

export type EventActionKind = 'email' | 'bank';

export interface EventActionDefinition {
  key: EventActionKey;
  kind: EventActionKind;
  label: string;
  description: string;
  /** Days relative to the event date: -7 is a week before, 3 is three days after. */
  offsetDays: number;
  /** For email actions, the marketing email the calendar sends from the "Enviar" button. */
  emailType?: MarketingEmailType;
  /** Only due when the list has actually collected money (nothing to transfer otherwise). */
  requiresFunds?: boolean;
}

export const EVENT_ACTIONS: EventActionDefinition[] = [
  {
    key: 'bank_info_request',
    kind: 'email',
    label: 'Solicitar datos bancarios',
    description: 'Enviar el email de Solicitud de Información Bancaria (titular, banco, CLABE, carátula).',
    offsetDays: -7,
    emailType: 'bank_info_request',
  },
  {
    key: 'bank_info_received',
    kind: 'bank',
    label: 'Datos bancarios recibidos',
    description: 'Confirmar que la pareja respondió con su CLABE y carátula, y que los datos coinciden con el titular.',
    offsetDays: -2,
  },
  {
    key: 'payout_sent',
    kind: 'bank',
    label: 'Transferencia realizada',
    description: 'Transferir a la pareja lo recaudado en su mesa de regalos.',
    offsetDays: 3,
    requiresFunds: true,
  },
];

export const getEventAction = (key: string): EventActionDefinition | undefined => EVENT_ACTIONS.find((action) => action.key === key);

/** Human description of an offset, e.g. "7 días antes del evento". */
export const describeEventActionOffset = (offsetDays: number): string => {
  if (offsetDays === 0) return 'El día del evento';
  const days = Math.abs(offsetDays);
  const unit = days === 1 ? 'día' : 'días';
  return `${days} ${unit} ${offsetDays < 0 ? 'antes' : 'después'} del evento`;
};
