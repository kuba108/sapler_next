/**
 * Rewrites stored HTML so it works inside the Next.js app without touching the DB.
 *
 * Original content contains absolute Active Storage URLs pointing at the old
 * production host, e.g.
 *   https://www.sapler.cz/rails/active_storage/blobs/redirect/<id>/<file>
 * We strip the host so they become site-relative and are served by our own
 * /rails/active_storage route (which resolves the blob key and redirects to S3).
 */
export function rewriteContent(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(
    /https?:\/\/[^/"']*\/rails\/active_storage\//g,
    '/rails/active_storage/',
  );
}
