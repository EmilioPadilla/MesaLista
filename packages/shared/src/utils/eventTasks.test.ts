import { describe, it, expect } from 'vitest';
import { buildEventTasks } from './eventTasks';
import type { CalendarEvent } from '../services/eventCalendar.service';

// Local-time dates so the tests don't depend on the machine's timezone.
const TODAY = new Date(2026, 8, 23, 15, 30); // 23 Sep 2026, mid-afternoon

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  giftListId: 1,
  title: 'Boda Ana y Luis',
  coupleName: 'Ana & Luis',
  eventDate: new Date(2026, 8, 30).toISOString(), // a week from TODAY
  eventLocation: null,
  eventVenue: null,
  planType: 'COMMISSION',
  publishedAt: new Date(2026, 5, 1).toISOString(),
  isActive: true,
  user: { id: 7, firstName: 'Ana', lastName: 'Ruiz', email: 'ana@x.com', phoneNumber: null, slug: 'ana-luis' },
  grossCollected: 5000,
  paidPaymentsCount: 3,
  actions: [],
  ...overrides,
});

const byKey = (tasks: ReturnType<typeof buildEventTasks>) => Object.fromEntries(tasks.map((t) => [t.definition.key, t]));

describe('buildEventTasks', () => {
  it('makes the bank info email due exactly one week before the event', () => {
    const tasks = byKey(buildEventTasks([makeEvent()], TODAY));

    expect(tasks.bank_info_request.state).toBe('due_today');
    expect(tasks.bank_info_request.daysUntilDue).toBe(0);
    expect(tasks.bank_info_received.state).toBe('upcoming');
    expect(tasks.bank_info_received.daysUntilDue).toBe(5);
    expect(tasks.payout_sent.daysUntilDue).toBe(10);
  });

  it('flags missed deadlines as overdue', () => {
    const tasks = byKey(buildEventTasks([makeEvent({ eventDate: new Date(2026, 8, 26).toISOString() })], TODAY));

    expect(tasks.bank_info_request.state).toBe('overdue');
    expect(tasks.bank_info_request.daysUntilDue).toBe(-4);
  });

  it('stops offering the bank info email once the event has passed, but keeps the bank steps', () => {
    const past = makeEvent({ eventDate: new Date(2026, 6, 1).toISOString() });
    const tasks = byKey(buildEventTasks([past], TODAY));

    expect(tasks.bank_info_request).toBeUndefined();
    expect(tasks.bank_info_received.state).toBe('overdue');
    expect(tasks.payout_sent.state).toBe('overdue');
  });

  it('gives drafts no tasks', () => {
    expect(buildEventTasks([makeEvent({ publishedAt: null })], TODAY)).toHaveLength(0);
  });

  it('skips the payout when nothing was collected, but still asks for bank info before the event', () => {
    const tasks = byKey(buildEventTasks([makeEvent({ grossCollected: 0 })], TODAY));

    expect(tasks.payout_sent).toBeUndefined();
    expect(tasks.bank_info_request.state).toBe('due_today');
  });

  it('drops pending bank steps for a past event that collected nothing', () => {
    const past = makeEvent({ eventDate: new Date(2026, 6, 1).toISOString(), grossCollected: 0 });
    expect(buildEventTasks([past], TODAY)).toHaveLength(0);
  });

  it('treats earlier bank steps as settled once the payout is logged', () => {
    const past = makeEvent({
      eventDate: new Date(2026, 6, 1).toISOString(),
      actions: [{ action: 'payout_sent', status: 'DONE', note: null, completedAt: '2026-07-05T00:00:00.000Z', completedBy: 'Admin' }],
    });
    const tasks = buildEventTasks([past], TODAY);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].state).toBe('done');
  });

  it('reports logged actions as done or skipped', () => {
    const tasks = byKey(
      buildEventTasks(
        [
          makeEvent({
            actions: [
              { action: 'bank_info_request', status: 'DONE', note: null, completedAt: '2026-09-22T00:00:00.000Z', completedBy: null },
              {
                action: 'bank_info_received',
                status: 'SKIPPED',
                note: 'Ya los teníamos',
                completedAt: '2026-09-22T00:00:00.000Z',
                completedBy: 'Admin',
              },
            ],
          }),
        ],
        TODAY,
      ),
    );

    expect(tasks.bank_info_request.state).toBe('done');
    expect(tasks.bank_info_received.state).toBe('skipped');
  });
});
