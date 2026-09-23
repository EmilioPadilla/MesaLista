import { useState } from 'react';
import { Button, Dropdown, Input, Modal, Popconfirm, Tooltip, message } from 'antd';
import { Check, MoreHorizontal, Send, Undo2 } from 'lucide-react';
import { useEventActionMutations } from 'hooks/useEventCalendar';
import type { EventActionStatus } from 'services/eventCalendar.service';
import type { EventTask } from 'utils/eventTasks';
import { formatShortDate } from '../format';

interface TaskActionsProps {
  task: EventTask;
  size?: 'small' | 'middle';
}

/**
 * Buttons for one event action: send its email (email actions), mark it done,
 * skip it, or undo a logged one. Marking done/skipped asks for an optional note
 * (e.g. the SPEI reference of a payout).
 */
export function TaskActions({ task, size = 'small' }: TaskActionsProps) {
  const { logAction, clearAction, sendActionEmail } = useEventActionMutations();
  const [logStatus, setLogStatus] = useState<EventActionStatus | null>(null);
  const [note, setNote] = useState('');

  const { event, definition, logged } = task;
  const target = { giftListId: event.giftListId, action: definition.key };

  if (logged) {
    const who = logged.completedBy ?? 'Automático';
    const label = logged.status === 'SKIPPED' ? 'Omitida' : 'Hecha';
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Tooltip title={logged.note || undefined}>
          <span>
            {label} · {formatShortDate(logged.completedAt, false)} · {who}
          </span>
        </Tooltip>
        <Popconfirm
          title="¿Deshacer?"
          description="La acción volverá a aparecer como pendiente."
          okText="Deshacer"
          cancelText="Cancelar"
          onConfirm={() => clearAction.mutateAsync(target).catch(() => message.error('No se pudo deshacer la acción'))}>
          <Button size="small" type="text" icon={<Undo2 className="h-3.5 w-3.5" />} loading={clearAction.isPending} />
        </Popconfirm>
      </div>
    );
  }

  const openLog = (status: EventActionStatus) => {
    setNote('');
    setLogStatus(status);
  };

  const submitLog = async () => {
    if (!logStatus) return;
    try {
      await logAction.mutateAsync({ ...target, status: logStatus, note });
      message.success(logStatus === 'DONE' ? 'Acción marcada como hecha' : 'Acción omitida');
      setLogStatus(null);
    } catch {
      message.error('No se pudo guardar la acción');
    }
  };

  const send = async () => {
    try {
      await sendActionEmail.mutateAsync(target);
      message.success(`Email enviado a ${event.user.email}`);
    } catch {
      message.error('No se pudo enviar el email');
    }
  };

  const isEmail = definition.kind === 'email' && definition.emailType;

  return (
    <div className="flex items-center gap-1">
      {isEmail ? (
        <>
          <Popconfirm
            title="Enviar email"
            description={`Se enviará "${definition.label}" a ${event.user.email}.`}
            okText="Enviar"
            cancelText="Cancelar"
            onConfirm={send}>
            <Button size={size} type="primary" icon={<Send className="h-3.5 w-3.5" />} loading={sendActionEmail.isPending}>
              Enviar
            </Button>
          </Popconfirm>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'done', label: 'Ya lo envié (marcar hecha)', onClick: () => openLog('DONE') },
                { key: 'skip', label: 'Omitir', onClick: () => openLog('SKIPPED') },
              ],
            }}>
            <Button size={size} type="text" icon={<MoreHorizontal className="h-4 w-4" />} />
          </Dropdown>
        </>
      ) : (
        <>
          <Button size={size} icon={<Check className="h-3.5 w-3.5" />} onClick={() => openLog('DONE')}>
            Hecha
          </Button>
          <Dropdown trigger={['click']} menu={{ items: [{ key: 'skip', label: 'Omitir', onClick: () => openLog('SKIPPED') }] }}>
            <Button size={size} type="text" icon={<MoreHorizontal className="h-4 w-4" />} />
          </Dropdown>
        </>
      )}

      <Modal
        open={logStatus !== null}
        onCancel={() => setLogStatus(null)}
        onOk={submitLog}
        okText={logStatus === 'SKIPPED' ? 'Omitir' : 'Marcar hecha'}
        cancelText="Cancelar"
        confirmLoading={logAction.isPending}
        title={`${definition.label} · ${event.coupleName}`}
        destroyOnHidden>
        <p className="text-sm text-gray-600 mb-2">
          {logStatus === 'SKIPPED'
            ? 'Esta acción dejará de aparecer como pendiente. ¿Por qué se omite?'
            : 'Nota opcional (p. ej. referencia SPEI, banco, quién respondió).'}
        </p>
        <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} autoFocus />
      </Modal>
    </div>
  );
}
