import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Input, Row, Segmented, Select, Space, Spin, Switch } from 'antd';
import { AlertTriangle, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock, Heart, PartyPopper, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarController } from '@fullcalendar/react';
import dayjs from 'dayjs';
import { useEventCalendar } from 'hooks/useEventCalendar';
import { EVENT_ACTIONS } from 'src/config/eventActions';
import type { CalendarEvent } from 'services/eventCalendar.service';
import { type EventTask, buildEventTasks, isPendingTask, isPublished, localDayKey } from 'utils/eventTasks';
import { StatCard, summaryGutter } from 'src/features/admin/analytics/components/analyticsShared';
import { EventCalendarGrid, type VisibleRange } from '../components/EventCalendarGrid';
import { TaskList } from '../components/TaskList';
import { EventDrawer } from '../components/EventDrawer';
import { formatLongDate } from '../format';

/** How far ahead the "Pendientes" panel looks. */
const UPCOMING_WINDOW_DAYS = 14;

type PanelView = 'pending' | 'done';
type CalendarView = 'dayGridMonth' | 'listMonth';

const capitalizeFirst = (text: string) => text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1);

export function EventCalendarPage() {
  const navigate = useNavigate();
  const { data: events, isLoading, isError, refetch } = useEventCalendar();

  // FullCalendar owns navigation and reports each new month through `datesSet`.
  const controller = useCalendarController();
  const [range, setRange] = useState<VisibleRange | null>(null);
  const handleDatesSet = useCallback((next: VisibleRange) => setRange(next), []);
  const handleSelectDay = useCallback((key: string) => setSelectedDay((current) => (current === key ? null : key)), []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showDrafts, setShowDrafts] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [panelView, setPanelView] = useState<PanelView>('pending');

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (events ?? []).filter((event) => {
      if (!showDrafts && !isPublished(event)) return false;
      if (!query) return true;
      return [event.coupleName, event.title, event.user.email, event.user.firstName, event.user.lastName]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [events, search, showDrafts]);

  const allTasks = useMemo(() => buildEventTasks(filteredEvents), [filteredEvents]);
  const tasks = useMemo(
    () => (actionFilter === 'all' ? allTasks : allTasks.filter((task) => task.definition.key === actionFilter)),
    [allTasks, actionFilter],
  );

  const eventsByDay = useMemo(() => groupBy(filteredEvents, (event) => localDayKey(new Date(event.eventDate))), [filteredEvents]);
  const tasksByDay = useMemo(() => groupBy(tasks, (task) => localDayKey(task.dueDate)), [tasks]);

  const pending = tasks.filter(isPendingTask);
  const overdue = pending.filter((task) => task.state === 'overdue');
  const dueToday = pending.filter((task) => task.state === 'due_today');
  const nextWeek = pending.filter((task) => task.state === 'upcoming' && task.daysUntilDue <= 7);
  const upcomingWindow = pending.filter((task) => task.state === 'upcoming' && task.daysUntilDue <= UPCOMING_WINDOW_DAYS);
  const recentlyDone = tasks
    .filter((task) => task.logged)
    .sort((a, b) => new Date(b.logged!.completedAt).getTime() - new Date(a.logged!.completedAt).getTime())
    .slice(0, 30);

  const visibleMonth = dayjs(range?.currentStart ?? new Date());
  const eventsThisMonth = filteredEvents.filter((event) => dayjs(event.eventDate).isSame(visibleMonth, 'month')).length;
  const monthName = visibleMonth.toDate().toLocaleDateString('es-MX', { month: 'long' });

  const selectedEvent = (events ?? []).find((event) => event.giftListId === selectedEventId) ?? null;
  const selectedEventTasks = selectedEvent ? allTasks.filter((task) => task.event.giftListId === selectedEvent.giftListId) : [];

  const goToday = () => {
    controller.today();
    setSelectedDay(localDayKey(new Date()));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-[1600px] px-4">
        <Space className="mb-4">
          <Button icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/')} type="text">
            Volver
          </Button>
        </Space>

        <div className="mb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            <CalendarDays className="h-7 w-7 text-[#d4704a] sm:h-8 sm:w-8" />
            Calendario de Eventos
          </h1>
          <p className="mt-2 text-gray-600">
            Fechas de los eventos de todas las parejas y las acciones de email y banco que dependen de ellas.
          </p>
        </div>

        {isError && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message="No se pudo cargar el calendario"
            action={<Button onClick={() => refetch()}>Reintentar</Button>}
          />
        )}

        <Row gutter={summaryGutter} className="mb-6">
          <Col xs={12} lg={6}>
            <StatCard
              title="Acciones vencidas"
              value={overdue.length}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="#dc2626"
              background="bg-red-50!"
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="Para hoy"
              value={dueToday.length}
              icon={<Clock className="h-5 w-5" />}
              color="#d97706"
              background="bg-amber-50!"
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="Próximos 7 días"
              value={nextWeek.length}
              icon={<CalendarDays className="h-5 w-5" />}
              color="#0284c7"
              background="bg-sky-50!"
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title={`Eventos en ${monthName}`}
              value={eventsThisMonth}
              icon={<PartyPopper className="h-5 w-5" />}
              color="#d4704a"
              background="bg-orange-50!"
            />
          </Col>
        </Row>

        <Card className="mb-4" size="small">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              allowClear
              prefix={<Search className="h-4 w-4 text-gray-400" />}
              placeholder="Buscar pareja, lista o email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={actionFilter}
              onChange={setActionFilter}
              className="sm:w-64"
              options={[
                { value: 'all', label: 'Todas las acciones' },
                ...EVENT_ACTIONS.map((action) => ({ value: action.key, label: action.label })),
              ]}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Switch size="small" checked={showDrafts} onChange={setShowDrafts} />
              Mostrar borradores
            </label>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card
              styles={{ body: { padding: 0 } }}
              title={
                <div className="flex flex-wrap items-center justify-between gap-2 py-1">
                  <span className="text-base font-semibold">{range ? capitalizeFirst(range.title) : ''}</span>
                  <Space size={4} wrap>
                    <Segmented<CalendarView>
                      size="small"
                      value={(range?.viewType as CalendarView) ?? 'dayGridMonth'}
                      onChange={(view) => controller.changeView(view)}
                      options={[
                        { value: 'dayGridMonth', label: 'Mes' },
                        { value: 'listMonth', label: 'Lista' },
                      ]}
                    />
                    <Button size="small" onClick={goToday}>
                      Hoy
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      icon={<ChevronLeft className="h-4 w-4" />}
                      onClick={() => controller.prev()}
                      aria-label="Mes anterior"
                    />
                    <Button
                      size="small"
                      type="text"
                      icon={<ChevronRight className="h-4 w-4" />}
                      onClick={() => controller.next()}
                      aria-label="Mes siguiente"
                    />
                  </Space>
                </div>
              }>
              <EventCalendarGrid
                controller={controller}
                events={filteredEvents}
                tasks={tasks}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
                onSelectEvent={setSelectedEventId}
                onDatesSet={handleDatesSet}
              />
              <Legend />
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <div className="flex flex-col gap-4">
              {selectedDay && (
                <SelectedDayCard
                  dayKey={selectedDay}
                  events={eventsByDay.get(selectedDay) ?? []}
                  tasks={tasksByDay.get(selectedDay) ?? []}
                  onSelectEvent={setSelectedEventId}
                  onClose={() => setSelectedDay(null)}
                />
              )}

              <Card
                title={
                  <Segmented<PanelView>
                    value={panelView}
                    onChange={setPanelView}
                    options={[
                      { value: 'pending', label: `Pendientes (${overdue.length + dueToday.length + upcomingWindow.length})` },
                      { value: 'done', label: 'Registradas' },
                    ]}
                  />
                }>
                {panelView === 'pending' ? (
                  <TaskList
                    onSelectEvent={setSelectedEventId}
                    emptyText="Nada pendiente en los próximos días"
                    groups={[
                      { key: 'overdue', title: 'Vencidas', tasks: overdue },
                      { key: 'today', title: 'Hoy', tasks: dueToday },
                      { key: 'upcoming', title: `Próximos ${UPCOMING_WINDOW_DAYS} días`, tasks: upcomingWindow },
                    ]}
                  />
                ) : (
                  <TaskList
                    onSelectEvent={setSelectedEventId}
                    emptyText="Aún no hay acciones registradas"
                    groups={[{ key: 'done', title: 'Más recientes', tasks: recentlyDone }]}
                  />
                )}
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      <EventDrawer event={selectedEvent} tasks={selectedEventTasks} onClose={() => setSelectedEventId(null)} />
    </div>
  );
}

function SelectedDayCard({
  dayKey,
  events,
  tasks,
  onSelectEvent,
  onClose,
}: {
  dayKey: string;
  events: CalendarEvent[];
  tasks: EventTask[];
  onSelectEvent: (giftListId: number) => void;
  onClose: () => void;
}) {
  const date = dayjs(dayKey).toDate();
  return (
    <Card
      size="small"
      title={formatLongDate(date)}
      extra={
        <Button size="small" type="text" onClick={onClose}>
          Cerrar
        </Button>
      }>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Eventos</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500">Sin eventos este día.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {events.map((event) => (
                <li key={event.giftListId}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event.giftListId)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-gray-50">
                    <span className="truncate text-sm font-medium text-gray-900">{event.coupleName}</span>
                    <span className="ml-2 flex-none text-xs text-gray-500">{isPublished(event) ? 'Publicada' : 'Borrador'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {tasks.length > 0 && (
          <TaskList onSelectEvent={onSelectEvent} emptyText="" groups={[{ key: 'day', title: 'Acciones con fecha este día', tasks }]} />
        )}
      </div>
    </Card>
  );
}

function Legend() {
  const tasks = [
    { color: 'var(--destructive)', label: 'Acción vencida' },
    { color: '#d97706', label: 'Vence hoy' },
    { color: '#0284c7', label: 'Próxima acción' },
    { color: '#4f7f4c', label: 'Hecha', filled: true },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Heart className="h-3 w-3 fill-current text-primary" aria-hidden />
        Evento
      </span>
      <span className="flex items-center gap-1.5">
        <Heart className="h-3 w-3 text-muted-foreground" aria-hidden />
        Borrador
      </span>
      {tasks.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px] border-[1.5px]"
            style={{ borderColor: item.color, background: item.filled ? item.color : 'transparent' }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}
