import { memo, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import type {
  CalendarController,
  CalendarOptions,
  DateClickInfo,
  DatesSetInfo,
  EventClickInfo,
  EventDisplayInfo,
  EventInput,
  ViewOptions,
} from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import esLocale from '@fullcalendar/react/locales/es';
import { Check, Heart, X } from 'lucide-react';
import type { CalendarEvent } from 'services/eventCalendar.service';
import { type EventTask, isPublished, localDayKey } from 'utils/eventTasks';
import { cn } from 'utils/utils';
import { formatCurrency } from 'src/features/admin/analytics/components/analyticsShared';

/**
 * The admin event calendar on FullCalendar v7 — the same package and theming
 * approach as the planner app's Calendario (src/features/plannerCalendar): v7
 * draws structure only, and every visible style is a Tailwind class handed to one
 * of its *Class props. The skeleton CSS sits in the `fullcalendar` cascade layer
 * (src/styles/_calendar.css) so these classes win.
 *
 * Two kinds of item share the grid: a couple's event day (a ribbon with a heart,
 * dashed while the list is a draft) and an admin action on its due date (a small
 * square marker, coloured by urgency, filled once done).
 */

export interface VisibleRange {
  /** The month the title names (not the neighbouring days drawn around it). */
  currentStart: Date;
  viewType: string;
  title: string;
}

type ItemProps = { kind: 'event'; event: CalendarEvent } | { kind: 'task'; task: EventTask };

interface EventCalendarGridProps {
  controller: CalendarController;
  events: CalendarEvent[];
  tasks: EventTask[];
  selectedDay: string | null;
  onSelectDay: (dayKey: string) => void;
  onSelectEvent: (giftListId: number) => void;
  onDatesSet: (range: VisibleRange) => void;
}

const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[0.14em]';

const TASK_TONE: Record<EventTask['state'], string> = {
  overdue: 'var(--destructive)',
  due_today: '#d97706',
  upcoming: '#0284c7',
  done: '#4f7f4c',
  skipped: '#9c8b79',
};

const SHARED_OPTIONS: CalendarOptions = {
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  locale: esLocale,
  headerToolbar: false,
  height: 'auto',
  borderless: true,
  fixedWeekCount: false,
  editable: false,
  // Couples' event days first, then actions by urgency.
  eventOrder: 'order,title',
  dayMaxEvents: 3,

  viewClass: 'text-sm text-foreground',
  tableHeaderClass: 'bg-card',
  fillerClass: 'border border-border',
  dayRowClass: 'border border-border',
  dayHeaderRowClass: 'border border-border',

  eventClass: (info) =>
    cn(
      'cursor-pointer outline-none',
      info.view.type.startsWith('list') ? 'focus-visible:bg-secondary/60' : 'rounded-md focus-visible:ring-2 focus-visible:ring-primary/50',
    ),
  eventContent: (info) => <ItemChip info={info} />,
  rowEventClass: (info) => cn('mb-px', info.isStart && 'ms-1', info.isEnd && 'me-1'),

  moreLinkContent: (info) => `+${info.num} más`,
  rowMoreLinkClass: 'mx-1 mb-px rounded-md transition-colors hover:bg-secondary',
  rowMoreLinkInnerClass: 'px-1.5 py-[3px] text-xs leading-4 font-medium text-primary-strong',
  popoverClass: 'm-1 min-w-60 overflow-hidden rounded-xl border border-border bg-popover text-sm shadow-lg',
  popoverCloseClass:
    'absolute end-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
  popoverCloseContent: () => <X className="h-4 w-4" aria-hidden />,
};

/** `YYYY-MM-DD` of a FullCalendar DateMarker, which stores local wall time in its UTC fields. */
const markerDayKey = (marker: Date) => marker.toISOString().slice(0, 10);

const dayGridOptions = (selectedDay: string | null): ViewOptions => ({
  dayHeaderFormat: { weekday: 'short' },
  dayHeaderAlign: 'start',
  dayHeaderClass: (info) => cn('border border-border', info.inPopover ? 'bg-muted/60' : 'bg-muted/40'),
  dayHeaderInnerClass: (info) =>
    cn(info.inPopover ? 'px-3 py-2 pe-10 text-xs font-semibold text-foreground' : cn('px-2.5 py-2', EYEBROW, 'text-muted-foreground')),
  dayHeaderDividerClass: 'border-b border-border',
  dayCellClass: (info) =>
    cn(
      !info.inPopover && 'cursor-pointer border border-border transition-colors hover:bg-secondary/40',
      (info.isOther || info.isDisabled) && !info.inPopover && 'bg-muted/45',
      info.isToday && !info.inPopover && 'bg-primary/[0.035]',
      !info.inPopover && markerDayKey(info.date) === selectedDay && 'shadow-[inset_0_0_0_2px_var(--primary)]',
    ),
  dayCellTopClass: 'flex px-1.5 pt-1.5',
  dayCellTopInnerClass: 'flex items-center gap-1',
  dayCellTopContent: (info) =>
    info.inPopover ? null : (
      <span
        className={cn(
          'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[13px] leading-none tabular-nums',
          info.isToday ? 'bg-primary font-semibold text-primary-foreground' : info.isOther ? 'text-muted-foreground/70' : 'text-foreground',
        )}>
        {info.dayNumberText}
      </span>
    ),
  dayCellInnerClass: (info) => cn(info.inPopover ? 'p-2' : 'min-h-[5.25rem] pt-0.5'),
  dayCellBottomClass: 'min-h-1',
});

const LIST_OPTIONS: ViewOptions = {
  listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
  listDayAltFormat: false,
  listDaysClass: 'w-full',
  listDayClass: 'flex flex-col border-b border-border last:border-b-0',
  listDayHeaderClass: (info) =>
    cn('flex items-center gap-2 border-b border-border px-4 py-2.5 sm:px-5', info.isToday ? 'bg-primary/[0.06]' : 'bg-muted/60'),
  listDayHeaderInnerClass: (info) =>
    cn('flex items-center text-[15px] font-semibold tracking-tight', info.isToday ? 'text-primary-strong' : 'text-foreground'),
  // Called once per side of the header; only the primary side (level 0) has anything to say.
  listDayHeaderContent: (info) =>
    info.level > 0 ? null : (
      <>
        {info.text.charAt(0).toLocaleUpperCase('es-MX') + info.text.slice(1)}
        {info.isToday && (
          <span className={cn(EYEBROW, 'ms-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground')}>Hoy</span>
        )}
      </>
    ),
  listDayBodyClass: 'flex flex-col divide-y divide-border',
  listItemEventClass: 'flex px-4 py-3 transition-colors hover:bg-secondary/40 sm:px-5',
  listItemEventInnerClass: 'flex w-full min-w-0',
  noEventsClass: 'flex flex-col items-center justify-center',
  noEventsInnerClass: 'px-4 py-14 text-center text-sm text-muted-foreground',
  noEventsContent: () => 'Nada en este mes.',
};

const TASK_ORDER: Record<EventTask['state'], number> = { overdue: 1, due_today: 2, upcoming: 3, done: 4, skipped: 5 };

function toEventInputs(events: CalendarEvent[], tasks: EventTask[]): EventInput[] {
  return [
    ...events.map((event) => ({
      id: `event-${event.giftListId}`,
      title: event.coupleName,
      start: localDayKey(new Date(event.eventDate)),
      allDay: true,
      order: 0,
      extendedProps: { kind: 'event', event } satisfies ItemProps,
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      title: `${task.definition.label} · ${task.event.coupleName}`,
      start: localDayKey(task.dueDate),
      allDay: true,
      order: TASK_ORDER[task.state],
      extendedProps: { kind: 'task', task } satisfies ItemProps,
    })),
  ];
}

export const EventCalendarGrid = memo(function EventCalendarGrid({
  controller,
  events,
  tasks,
  selectedDay,
  onSelectDay,
  onSelectEvent,
  onDatesSet,
}: EventCalendarGridProps) {
  const eventInputs = useMemo(() => toEventInputs(events, tasks), [events, tasks]);
  const views = useMemo<Record<string, ViewOptions>>(
    () => ({
      dayGrid: dayGridOptions(selectedDay),
      list: LIST_OPTIONS,
      dayGridMonth: { titleFormat: { month: 'long', year: 'numeric' } },
      listMonth: { titleFormat: { month: 'long', year: 'numeric' } },
    }),
    [selectedDay],
  );

  const handleEventClick = useCallback(
    (info: EventClickInfo) => {
      info.jsEvent.preventDefault();
      const item = info.event.extendedProps as ItemProps;
      onSelectEvent(item.kind === 'event' ? item.event.giftListId : item.task.event.giftListId);
    },
    [onSelectEvent],
  );

  const handleDateClick = useCallback((info: DateClickInfo) => onSelectDay(info.dateStr.slice(0, 10)), [onSelectDay]);

  const handleDatesSet = useCallback(
    (info: DatesSetInfo) => onDatesSet({ currentStart: info.view.currentStart, viewType: info.view.type, title: info.view.title }),
    [onDatesSet],
  );

  return (
    <FullCalendar
      {...SHARED_OPTIONS}
      views={views}
      controller={controller}
      initialView="dayGridMonth"
      events={eventInputs}
      eventClick={handleEventClick}
      dateClick={handleDateClick}
      datesSet={handleDatesSet}
    />
  );
});

// ── Chips ───────────────────────────────────────────────────────────────────

function ItemChip({ info }: { info: EventDisplayInfo }) {
  const item = info.event.extendedProps as ItemProps;
  const isList = info.view.type.startsWith('list');

  if (item.kind === 'event') return isList ? <EventListRow event={item.event} /> : <EventRibbon event={item.event} />;
  return isList ? <TaskListRow task={item.task} /> : <TaskLine task={item.task} />;
}

function EventRibbon({ event }: { event: CalendarEvent }) {
  const published = isPublished(event);
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-[3px] text-xs leading-4 font-medium',
        published ? 'bg-primary/14 text-primary-strong' : 'border border-dashed border-border-strong text-muted-foreground',
      )}
      title={`${event.coupleName} · ${event.title}${published ? '' : ' (borrador)'}`}>
      <Heart className={cn('h-3 w-3 shrink-0', published && 'fill-current')} aria-hidden />
      <span className="truncate">{event.coupleName}</span>
    </span>
  );
}

function TaskMarker({ task, className }: { task: EventTask; className?: string }) {
  const color = TASK_TONE[task.state];
  const filled = task.state === 'done' || task.state === 'skipped';
  return (
    <span
      className={cn('flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]', className)}
      style={{ borderColor: color, background: filled ? color : 'transparent' }}
      aria-hidden>
      {task.state === 'done' && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
    </span>
  );
}

function TaskLine({ task }: { task: EventTask }) {
  const closed = task.state === 'done' || task.state === 'skipped';
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-[3px] text-xs leading-4 transition-colors hover:bg-secondary/70',
        closed
          ? 'text-muted-foreground line-through decoration-muted-foreground/50'
          : task.state === 'overdue'
            ? 'text-destructive'
            : 'text-foreground',
      )}
      title={`${task.definition.label} · ${task.event.coupleName}`}>
      <TaskMarker task={task} />
      <span className="truncate">{task.event.coupleName}</span>
    </span>
  );
}

function EventListRow({ event }: { event: CalendarEvent }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-3">
      <Heart className={cn('h-4 w-4 shrink-0 text-primary', isPublished(event) && 'fill-current')} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{event.coupleName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {isPublished(event) ? 'Evento' : 'Evento · lista en borrador'} · {formatCurrency(event.grossCollected)} recaudado
        </span>
      </span>
    </span>
  );
}

function TaskListRow({ task }: { task: EventTask }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-3">
      <TaskMarker task={task} className="ms-[3px]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{task.definition.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{task.event.coupleName}</span>
      </span>
    </span>
  );
}
