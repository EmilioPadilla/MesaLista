import { EVENT_ACTIONS, type EventActionDefinition } from '../config/eventActions';
import type { CalendarEvent, CalendarEventAction } from '../services/eventCalendar.service';

export type EventTaskState = 'overdue' | 'due_today' | 'upcoming' | 'done' | 'skipped';

export interface EventTask {
  /** Stable id: `${giftListId}:${actionKey}` */
  id: string;
  event: CalendarEvent;
  definition: EventActionDefinition;
  dueDate: Date;
  /** Calendar days from today to the due date; negative when overdue. */
  daysUntilDue: number;
  state: EventTaskState;
  logged?: CalendarEventAction;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight (local time) of the given date. Event dates are entered and shown in local time. */
export const startOfLocalDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** `YYYY-MM-DD` of the local calendar day, for grouping by day. */
export const localDayKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const addLocalDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Whole calendar days from `from` to `to` (DST-safe via rounding). */
export const calendarDaysBetween = (from: Date, to: Date): number =>
  Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / MS_PER_DAY);

export const isPublished = (event: CalendarEvent): boolean => event.publishedAt !== null;

/**
 * Expand every published event into its dated admin actions (EVENT_ACTIONS).
 *
 * Drafts get no tasks: they can't receive money, so there is nothing to collect
 * bank details for. Pending actions are also dropped when they can no longer
 * matter:
 *   - the payout is already logged, so the bank steps before it are implied;
 *   - it is an email and the event already passed — the emails count down to the
 *     event ("¡Cada vez falta menos para tu gran día!"), so they can't go out late;
 *   - the list has collected nothing and either the action needs funds or the
 *     event already passed (no money is coming, so there is nothing to transfer).
 * Logged actions are always kept, so the event's history stays visible.
 */
export function buildEventTasks(events: CalendarEvent[], today: Date = new Date()): EventTask[] {
  const todayStart = startOfLocalDay(today);
  const tasks: EventTask[] = [];

  for (const event of events) {
    if (!isPublished(event)) continue;

    const eventDay = startOfLocalDay(new Date(event.eventDate));
    const eventPassed = eventDay.getTime() < todayStart.getTime();
    const hasFunds = event.grossCollected > 0;
    const loggedByKey = new Map(event.actions.map((logged) => [logged.action, logged]));
    const payoutClosed = loggedByKey.has('payout_sent');

    for (const definition of EVENT_ACTIONS) {
      const logged = loggedByKey.get(definition.key);
      if (!logged) {
        if (payoutClosed) continue;
        if (definition.kind === 'email' && eventPassed) continue;
        if (!hasFunds && (definition.requiresFunds || eventPassed)) continue;
      }

      const dueDate = addLocalDays(eventDay, definition.offsetDays);
      const daysUntilDue = calendarDaysBetween(todayStart, dueDate);

      let state: EventTaskState;
      if (logged) state = logged.status === 'SKIPPED' ? 'skipped' : 'done';
      else if (daysUntilDue < 0) state = 'overdue';
      else if (daysUntilDue === 0) state = 'due_today';
      else state = 'upcoming';

      tasks.push({
        id: `${event.giftListId}:${definition.key}`,
        event,
        definition,
        dueDate,
        daysUntilDue,
        state,
        logged,
      });
    }
  }

  return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export const isPendingTask = (task: EventTask): boolean =>
  task.state === 'overdue' || task.state === 'due_today' || task.state === 'upcoming';
