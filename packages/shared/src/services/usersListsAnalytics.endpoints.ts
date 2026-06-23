export const usersListsAnalyticsEndpoints = {
  summary: `/admin/users-lists-analytics/summary`,
  users: `/admin/users-lists-analytics/users`,
  lists: `/admin/users-lists-analytics/lists`,
  listVisibility: (listId: number) => `/admin/users-lists-analytics/lists/${listId}/visibility`,
};
