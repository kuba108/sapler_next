import { revalidatePath } from 'next/cache';

/**
 * Public pages are served from the ISR cache without touching the DB, so any admin
 * change that affects them (published content, routes, menus, settings) must purge it.
 * The whole site is purged at once: edits are rare and pages share the header menu.
 */
export function revalidateSite() {
  revalidatePath('/', 'layout');
}
