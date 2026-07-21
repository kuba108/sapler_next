import { prisma } from './prisma';

/**
 * Returns the cached HTML of a menu (Rails `menu(name, language)` helper).
 * Menus are pre-rendered into `menus.content` by the admin, mirroring the
 * original app which served the cached HTML on the public site.
 */
export async function menuHtml(name: string, language: string): Promise<string> {
  const menu = await prisma.menus.findFirst({ where: { name, language } });
  return menu?.content ?? '';
}
