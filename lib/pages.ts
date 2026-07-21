import { prisma } from './prisma';
import { loadSetting } from './settings';

export type ResolvedPage = Awaited<ReturnType<typeof prisma.pages.findUnique>>;

export type RouteResolution =
  | { kind: 'page'; page: NonNullable<ResolvedPage> }
  | { kind: 'redirect'; permalink: string }
  | { kind: 'not_found' };

/**
 * Port of Rails RouteService#find_by_permalink.
 * - no permalink -> home page
 * - route_type 'redirect' -> redirect to the target's standard permalink
 * - otherwise load the routable (only Page is used in this app)
 */
export async function resolveRoute(permalink?: string): Promise<RouteResolution> {
  if (!permalink) {
    const home = await prisma.pages.findFirst({ where: { home_page: true } });
    if (home) return { kind: 'page', page: home };
    const first = await prisma.pages.findFirst({ orderBy: { id: 'asc' } });
    return first ? { kind: 'page', page: first } : { kind: 'not_found' };
  }

  const route = await prisma.routes.findFirst({ where: { permalink } });
  if (!route) return { kind: 'not_found' };

  if (route.route_type === 'redirect' && route.routable_id != null) {
    const target = await prisma.routes.findFirst({
      where: {
        routable_id: route.routable_id,
        routable_type: route.routable_type ?? undefined,
        route_type: 'standard',
      },
    });
    if (target) return { kind: 'redirect', permalink: target.permalink };
  }

  if (route.routable_type === 'Page' && route.routable_id != null) {
    const page = await prisma.pages.findUnique({
      where: { id: BigInt(route.routable_id) },
    });
    if (page) return { kind: 'page', page };
  }

  return { kind: 'not_found' };
}

/** Standard permalink for a page id. */
export async function permalinkForPage(pageId: bigint): Promise<string | null> {
  const route = await prisma.routes.findFirst({
    where: { routable_type: 'Page', routable_id: Number(pageId), route_type: 'standard' },
  });
  return route?.permalink ?? null;
}

/** Other-language siblings of a page (same uuid, different id). */
export async function pageLocales(page: NonNullable<ResolvedPage>) {
  if (!page.uuid) return [];
  const siblings = await prisma.pages.findMany({
    where: { uuid: page.uuid, id: { not: page.id } },
  });
  const result: { language: string; permalink: string }[] = [];
  for (const sib of siblings) {
    const permalink = await permalinkForPage(sib.id);
    if (permalink) result.push({ language: sib.language, permalink });
  }
  return result;
}

/** Metadata resolution mirroring Page#meta_* (fallback to Setting). */
export async function pageMeta(page: NonNullable<ResolvedPage>) {
  const fallback = async (value: string | null, settingKey: string) =>
    value && value.length > 0 ? value : await loadSetting(settingKey);

  return {
    title: page.title || (await loadSetting('title')),
    metaTitle: await fallback(page.meta_title, 'meta_title'),
    metaDescription: await fallback(page.meta_description, 'meta_description'),
    metaKeywords: await fallback(page.meta_keywords, 'meta_keywords'),
    ogTitle: await fallback(page.og_title, 'og_title'),
    ogDescription: await fallback(page.og_description, 'og_description'),
    ogImage: await fallback(page.og_image, 'og_image'),
    ogUrl: await loadSetting('og_url'),
  };
}
