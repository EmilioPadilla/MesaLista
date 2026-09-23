import { useState } from 'react';
import { Alert, Button, Descriptions, Drawer, Modal, Spin, Tag, message } from 'antd';
import { Copy, ExternalLink, Eye, Landmark, Mail } from 'lucide-react';
import { useEmailPreview } from 'hooks/useEmail';
import type { MarketingEmailType } from 'src/config/marketingEmailTemplates';
import { describeEventActionOffset } from 'src/config/eventActions';
import type { CalendarEvent } from 'services/eventCalendar.service';
import { type EventTask, isPublished } from 'utils/eventTasks';
import { formatCurrency, useIsMobile } from 'src/features/admin/analytics/components/analyticsShared';
import { TaskActions } from './TaskActions';
import { dueLabel } from './TaskList';
import { formatLongDate, formatShortDate } from '../format';

interface EventDrawerProps {
  event: CalendarEvent | null;
  tasks: EventTask[];
  onClose: () => void;
}

const STATE_TAG: Record<EventTask['state'], { color: string; label: string }> = {
  overdue: { color: 'red', label: 'Vencida' },
  due_today: { color: 'orange', label: 'Hoy' },
  upcoming: { color: 'blue', label: 'Pendiente' },
  done: { color: 'green', label: 'Hecha' },
  skipped: { color: 'default', label: 'Omitida' },
};

export function EventDrawer({ event, tasks, onClose }: EventDrawerProps) {
  const isMobile = useIsMobile();
  const [previewType, setPreviewType] = useState<MarketingEmailType | null>(null);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => message.success('Copiado'));
  };

  return (
    <Drawer
      open={event !== null}
      onClose={onClose}
      width={isMobile ? '100%' : 520}
      title={event?.coupleName}
      extra={
        event?.user.slug && (
          <Button
            type="text"
            icon={<ExternalLink className="h-4 w-4" />}
            href={`/${event.user.slug}/regalos`}
            target="_blank"
            rel="noreferrer">
            Ver mesa
          </Button>
        )
      }>
      {event && (
        <div className="flex flex-col gap-6">
          <div>
            <div className="text-lg font-semibold text-gray-900">{formatLongDate(event.eventDate)}</div>
            <div className="text-sm text-gray-500">{event.title}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {isPublished(event) ? <Tag color="green">Publicada</Tag> : <Tag>Borrador</Tag>}
              {event.planType && <Tag color="purple">{event.planType === 'FIXED' ? 'Plan fijo' : 'Comisión'}</Tag>}
              {!event.isActive && <Tag color="red">Inactiva</Tag>}
            </div>
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Titular">
              {event.user.firstName} {event.user.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <span className="flex items-center gap-2">
                <a href={`mailto:${event.user.email}`}>{event.user.email}</a>
                <Button size="small" type="text" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(event.user.email)} />
              </span>
            </Descriptions.Item>
            {event.user.phoneNumber && (
              <Descriptions.Item label="Teléfono">
                <a href={`https://wa.me/${event.user.phoneNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  {event.user.phoneNumber}
                </a>
              </Descriptions.Item>
            )}
            {(event.eventVenue || event.eventLocation) && (
              <Descriptions.Item label="Lugar">{[event.eventVenue, event.eventLocation].filter(Boolean).join(', ')}</Descriptions.Item>
            )}
            <Descriptions.Item label="Recaudado">
              <span className="font-semibold">{formatCurrency(event.grossCollected)}</span>
              <span className="text-gray-500">
                {' '}
                · {event.paidPaymentsCount} {event.paidPaymentsCount === 1 ? 'pago' : 'pagos'}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Acciones</h3>
            {!isPublished(event) ? (
              <Alert
                type="info"
                showIcon
                message="Lista en borrador"
                description="Las acciones bancarias empiezan cuando la pareja publica su lista, porque hasta entonces no puede recibir dinero."
              />
            ) : tasks.length === 0 ? (
              <Alert
                type="info"
                showIcon
                message="Sin acciones pendientes"
                description="El evento ya pasó y la lista no recaudó dinero, así que no hay nada que transferir."
              />
            ) : (
              <ol className="flex flex-col gap-3">
                {tasks.map((task) => {
                  const Icon = task.definition.kind === 'email' ? Mail : Landmark;
                  const tag = STATE_TAG[task.state];
                  return (
                    <li key={task.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-4 w-4 flex-none text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.definition.label}</div>
                            <div className="text-xs text-gray-500">
                              {formatShortDate(task.dueDate)} · {describeEventActionOffset(task.definition.offsetDays)}
                              {(task.state === 'overdue' || task.state === 'due_today' || task.state === 'upcoming') &&
                                ` · ${dueLabel(task)}`}
                            </div>
                          </div>
                        </div>
                        <Tag color={tag.color} className="mr-0!">
                          {tag.label}
                        </Tag>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">{task.definition.description}</p>
                      {task.logged?.note && <p className="mt-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">{task.logged.note}</p>}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        {task.definition.emailType ? (
                          <Button
                            size="small"
                            type="link"
                            className="px-0!"
                            icon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => setPreviewType(task.definition.emailType!)}>
                            Vista previa
                          </Button>
                        ) : (
                          <span />
                        )}
                        <TaskActions task={task} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <EmailPreview userId={event.user.id} emailType={previewType} onClose={() => setPreviewType(null)} />
        </div>
      )}
    </Drawer>
  );
}

function EmailPreview({ userId, emailType, onClose }: { userId: number; emailType: MarketingEmailType | null; onClose: () => void }) {
  const { data, isLoading, isError } = useEmailPreview(emailType ?? 'bank_info_request', userId, emailType !== null);

  return (
    <Modal open={emailType !== null} onCancel={onClose} footer={null} width={720} title="Vista previa del email">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin />
        </div>
      ) : isError || !data ? (
        <Alert type="error" message="No se pudo cargar la vista previa" />
      ) : (
        <>
          <div className="mb-3 text-sm">
            <span className="text-gray-500">Asunto: </span>
            <span className="font-semibold">{data.data.subject}</span>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded border border-gray-200" dangerouslySetInnerHTML={{ __html: data.data.html }} />
        </>
      )}
    </Modal>
  );
}
