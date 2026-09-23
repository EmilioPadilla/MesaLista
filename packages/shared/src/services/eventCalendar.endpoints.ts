export const eventCalendarEndpoints = {
  events: `/admin/event-calendar`,
  action: (giftListId: number, action: string) => `/admin/event-calendar/${giftListId}/actions/${action}`,
  sendAction: (giftListId: number, action: string) => `/admin/event-calendar/${giftListId}/actions/${action}/send`,
};
