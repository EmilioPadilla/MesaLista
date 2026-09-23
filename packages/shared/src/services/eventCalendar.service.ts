import apiClient from './client';
import { eventCalendarEndpoints } from './eventCalendar.endpoints';

export type EventActionStatus = 'DONE' | 'SKIPPED';

export interface CalendarEventAction {
  action: string;
  status: EventActionStatus;
  note: string | null;
  completedAt: string;
  completedBy: string | null;
}

export interface CalendarEvent {
  giftListId: number;
  title: string;
  coupleName: string;
  eventDate: string;
  eventLocation: string | null;
  eventVenue: string | null;
  planType: 'FIXED' | 'COMMISSION' | null;
  publishedAt: string | null;
  isActive: boolean;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    slug: string | null;
  };
  grossCollected: number;
  paidPaymentsCount: number;
  actions: CalendarEventAction[];
}

export const eventCalendarService = {
  getEvents: async (): Promise<CalendarEvent[]> => {
    const response = await apiClient.get<CalendarEvent[]>(eventCalendarEndpoints.events);
    return response.data;
  },

  logAction: async (giftListId: number, action: string, body: { status: EventActionStatus; note?: string | null }) => {
    const response = await apiClient.put(eventCalendarEndpoints.action(giftListId, action), body);
    return response.data;
  },

  clearAction: async (giftListId: number, action: string): Promise<void> => {
    await apiClient.delete(eventCalendarEndpoints.action(giftListId, action));
  },

  sendActionEmail: async (giftListId: number, action: string) => {
    const response = await apiClient.post(eventCalendarEndpoints.sendAction(giftListId, action));
    return response.data;
  },
};

export default eventCalendarService;
