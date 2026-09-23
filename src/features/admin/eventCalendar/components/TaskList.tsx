import { Empty } from 'antd';
import { Landmark, Mail } from 'lucide-react';
import type { EventTask } from 'utils/eventTasks';
import { formatCurrency } from 'src/features/admin/analytics/components/analyticsShared';
import { TaskActions } from './TaskActions';
import { formatShortDate } from '../format';

export const dueLabel = (task: EventTask) => {
  const days = task.daysUntilDue;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days > 0) return `En ${days} días`;
  return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`;
};

const DUE_TONE: Record<string, string> = {
  overdue: 'text-red-600',
  due_today: 'text-amber-600',
  upcoming: 'text-gray-500',
};

interface TaskGroup {
  key: string;
  title: string;
  tasks: EventTask[];
}

interface TaskListProps {
  groups: TaskGroup[];
  onSelectEvent: (giftListId: number) => void;
  emptyText: string;
}

export function TaskList({ groups, onSelectEvent, emptyText }: TaskListProps) {
  const nonEmpty = groups.filter((group) => group.tasks.length > 0);
  if (nonEmpty.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {nonEmpty.map((group) => (
        <section key={group.key}>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {group.title}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{group.tasks.length}</span>
          </h3>
          <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-100">
            {group.tasks.map((task) => (
              <TaskRow key={task.id} task={task} onSelectEvent={onSelectEvent} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TaskRow({ task, onSelectEvent }: { task: EventTask; onSelectEvent: (giftListId: number) => void }) {
  const { event, definition } = task;
  const Icon = definition.kind === 'email' ? Mail : Landmark;

  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg ${
            definition.kind === 'email' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
          }`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900">{definition.label}</div>
          <button
            type="button"
            onClick={() => onSelectEvent(event.giftListId)}
            className="max-w-full truncate text-left text-sm text-[#b85a37] hover:underline">
            {event.coupleName}
          </button>
          <div className="text-xs text-gray-500">
            <span className={DUE_TONE[task.state] ?? ''}>{dueLabel(task)}</span>
            {' · '}Evento {formatShortDate(event.eventDate)}
            {definition.kind === 'bank' && <> · {formatCurrency(event.grossCollected)} recaudado</>}
          </div>
        </div>
      </div>
      <div className="flex-none sm:pl-2">
        <TaskActions task={task} />
      </div>
    </li>
  );
}
