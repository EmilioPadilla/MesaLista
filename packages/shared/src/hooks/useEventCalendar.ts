import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import eventCalendarService, { CalendarEvent, EventActionStatus } from '../services/eventCalendar.service';

const eventCalendarKey = ['eventCalendar'];

/**
 * Hook to fetch every event with its collected money and logged admin actions
 */
export const useEventCalendar = () => {
  return useQuery<CalendarEvent[]>({
    queryKey: eventCalendarKey,
    queryFn: () => eventCalendarService.getEvents(),
    staleTime: 60 * 1000,
  });
};

/**
 * Mark, skip, undo or send an event action. Every mutation refetches the calendar
 * so the task list and the event drawer stay in sync with the server's log.
 */
export const useEventActionMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: eventCalendarKey });

  const logAction = useMutation({
    mutationFn: ({
      giftListId,
      action,
      status,
      note,
    }: {
      giftListId: number;
      action: string;
      status: EventActionStatus;
      note?: string | null;
    }) => eventCalendarService.logAction(giftListId, action, { status, note }),
    onSuccess: invalidate,
  });

  const clearAction = useMutation({
    mutationFn: ({ giftListId, action }: { giftListId: number; action: string }) => eventCalendarService.clearAction(giftListId, action),
    onSuccess: invalidate,
  });

  const sendActionEmail = useMutation({
    mutationFn: ({ giftListId, action }: { giftListId: number; action: string }) =>
      eventCalendarService.sendActionEmail(giftListId, action),
    onSuccess: invalidate,
  });

  return { logAction, clearAction, sendActionEmail };
};
