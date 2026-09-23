/** "30 sep 2026" — Spanish short date, independent of dayjs's global locale. */
export const formatShortDate = (date: string | Date, withYear = true) =>
  new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }) });

/** "Martes, 30 de septiembre de 2026" */
export const formatLongDate = (date: string | Date) => {
  const label = new Date(date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
