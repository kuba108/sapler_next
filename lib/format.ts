/** Czech date/time formatting mirroring the admin's I18n.l helpers. */
export function timeToString(value: Date | null | undefined): string {
  if (!value) return 'Žádné datum';
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function dateToString(value: Date | string | null | undefined): string {
  if (!value) return 'Žádné datum';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : 'Žádné datum';
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(d);
}
