/** Page layout & state options (from config/locales/configs.cs.yml). */
export const PAGE_LAYOUTS: { value: string; label: string }[] = [
  { value: 'default', label: 'Defaultní' },
  { value: 'home', label: 'Úvodní stránka' },
  { value: 'products', label: 'Produktová stránka' },
];

export const PAGE_STATES: { value: string; label: string }[] = [
  { value: 'hidden', label: 'Skrytá' },
  { value: 'visible', label: 'Viditelná' },
];

/** Rails String#parameterize equivalent for permalinks. */
export function parameterize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
