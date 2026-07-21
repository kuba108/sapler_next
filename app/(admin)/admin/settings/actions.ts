'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';

export async function saveSetting(
  name: string,
  value: string,
  valueType = 'String',
): Promise<{ ok: boolean; msg: string }> {
  try {
    await requirePolicy('setting', 'update');
    const existing = await prisma.settings.findFirst({ where: { name } });
    if (existing) {
      await prisma.settings.update({
        where: { id: existing.id },
        data: { value, updated_at: new Date() },
      });
    } else {
      await prisma.settings.create({
        data: {
          name,
          value,
          value_type: valueType,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    revalidatePath('/admin/settings');
    return { ok: true, msg: 'Nastavení bylo uloženo.' };
  } catch {
    return { ok: false, msg: 'Nastavení nebylo uloženo.' };
  }
}

export async function setHomePage(pageId: string): Promise<{ ok: boolean; msg: string }> {
  try {
    await requirePolicy('setting', 'update');
    const id = BigInt(pageId);
    await prisma.pages.update({ where: { id }, data: { home_page: true } });
    await prisma.pages.updateMany({ where: { id: { not: id } }, data: { home_page: false } });
    revalidatePath('/admin/settings');
    return { ok: true, msg: 'Úvodní stránka byla nastavena.' };
  } catch {
    return { ok: false, msg: 'Nastavení nebylo uloženo.' };
  }
}
