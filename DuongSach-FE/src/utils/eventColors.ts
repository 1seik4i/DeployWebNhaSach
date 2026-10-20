export const EVENT_STATUS_COLORS = {
  happening: '#16A34A',
  upcoming: '#0284C7',
  draft: '#EAB308',
  completed: '#6B7280',
  cancelled: '#B91C1C',
  default: '#17382E',
} as const;

export const getEventStatusColor = (status?: string) => {
  if (status && status in EVENT_STATUS_COLORS) {
    return EVENT_STATUS_COLORS[status as keyof typeof EVENT_STATUS_COLORS];
  }

  return EVENT_STATUS_COLORS.default;
};
