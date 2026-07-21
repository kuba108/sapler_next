import { prisma } from './prisma';

/**
 * Mirrors Rails `Setting.load_value` — returns the stored value or '' when
 * missing. Cached per request via React cache to avoid duplicate queries.
 */
export async function loadSetting(name: string): Promise<string> {
  const setting = await prisma.settings.findFirst({ where: { name } });
  return setting?.value ?? '';
}

export async function allSettings() {
  return prisma.settings.findMany({ orderBy: { name: 'asc' } });
}
