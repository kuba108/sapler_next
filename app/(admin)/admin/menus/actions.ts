'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { cacheMenuHtml } from '@/lib/menu-html';

export type CreateMenuState = { error?: string };

export async function createMenu(_prev: CreateMenuState, formData: FormData): Promise<CreateMenuState> {
  await requirePolicy('menu', 'create');
  const name = String(formData.get('name') || '');
  const language = String(formData.get('language') || '');
  const layout = String(formData.get('layout') || 'default');

  const exists = await prisma.menus.findFirst({ where: { name, language } });
  if (exists) {
    return { error: 'Menu stejného typu pro tento jazyk již existuje. Pokud jej chcete nahradit, nejprve menu smažte.' };
  }

  const parent = await prisma.menus.findFirst({ where: { name, language: 'cs' } });
  const menu = await prisma.menus.create({
    data: {
      name,
      language,
      layout,
      uuid: parent?.uuid ?? randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Duplicate structure from the Czech parent menu (localized labels/links).
  if (parent) {
    await duplicateMenu(parent.id, menu.id, language);
    await cacheMenuHtml(menu.id);
  }

  revalidatePath('/admin/menus');
  redirect('/admin/menus');
}

async function duplicateMenu(sourceId: bigint, targetId: bigint, targetLang: string) {
  const base = await prisma.menu_items.findMany({
    where: { menu_id: sourceId, parent: null },
    orderBy: { position: 'asc' },
  });
  for (const item of base) {
    await duplicateItem(item, null, targetId, targetLang);
  }
}

async function duplicateItem(
  item: { id: bigint; label: string; url: string; position: number; kind: string; new_window: boolean; page_id: bigint | null },
  parentId: bigint | null,
  targetMenuId: bigint,
  targetLang: string,
) {
  let pageId: bigint | null = null;
  let label = item.label;
  let url = item.url;

  if (item.page_id) {
    const sourcePage = await prisma.pages.findUnique({ where: { id: item.page_id } });
    if (sourcePage?.uuid) {
      const targetPage = await prisma.pages.findFirst({
        where: { uuid: sourcePage.uuid, language: targetLang },
      });
      if (targetPage) {
        pageId = targetPage.id;
        label = targetPage.title;
        const route = await prisma.routes.findFirst({
          where: { routable_type: 'Page', routable_id: Number(targetPage.id), route_type: 'standard' },
        });
        url = route?.permalink ?? '';
      }
    }
  }

  const created = await prisma.menu_items.create({
    data: {
      menu_id: targetMenuId,
      page_id: pageId,
      parent: parentId ? Number(parentId) : null,
      label,
      url,
      position: item.position,
      kind: item.kind,
      new_window: item.new_window,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const children = await prisma.menu_items.findMany({
    where: { parent: Number(item.id) },
    orderBy: { position: 'asc' },
  });
  for (const child of children) {
    await duplicateItem(child, created.id, targetMenuId, targetLang);
  }
}

export async function deleteMenu(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('menu', 'destroy');
    await prisma.menu_items.deleteMany({ where: { menu_id: BigInt(id) } });
    await prisma.menus.delete({ where: { id: BigInt(id) } });
    revalidatePath('/admin/menus');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Menu nebylo smazáno.' };
  }
}

async function nextPosition(menuId: bigint): Promise<number> {
  const last = await prisma.menu_items.findFirst({
    where: { menu_id: menuId },
    orderBy: { position: 'desc' },
  });
  return (last?.position ?? 0) + 1;
}

export async function createMenuItem(menuId: string, formData: FormData) {
  await requirePolicy('menu_item', 'create');
  const kind = String(formData.get('kind') || 'custom');
  const mId = BigInt(menuId);

  let url = String(formData.get('url') || '');
  let label = String(formData.get('label') || '');
  let pageId: bigint | null = null;

  if (kind === 'page' && formData.get('page_id')) {
    pageId = BigInt(String(formData.get('page_id')));
    const route = await prisma.routes.findFirst({
      where: { routable_type: 'Page', routable_id: Number(pageId), route_type: 'standard' },
    });
    url = route?.permalink ?? '';
    if (!label) {
      const page = await prisma.pages.findUnique({ where: { id: pageId } });
      label = page?.title ?? '';
    }
  }

  await prisma.menu_items.create({
    data: {
      menu_id: mId,
      page_id: pageId,
      kind,
      label,
      url,
      new_window: formData.get('new_window') === 'true' || formData.get('new_window') === '1',
      position: await nextPosition(mId),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  await cacheMenuHtml(mId);
  revalidatePath(`/admin/menus/${menuId}`);
  return { ok: true };
}

export async function updateMenuItem(itemId: string, formData: FormData) {
  await requirePolicy('menu_item', 'update');
  const item = await prisma.menu_items.findUnique({ where: { id: BigInt(itemId) } });
  if (!item) return { ok: false };

  const kind = String(formData.get('kind') || item.kind);
  const data: Record<string, unknown> = {
    kind,
    label: String(formData.get('label') || ''),
    new_window: formData.get('new_window') === 'true' || formData.get('new_window') === '1',
    updated_at: new Date(),
  };

  if (kind === 'page' && formData.get('page_id')) {
    const pageId = BigInt(String(formData.get('page_id')));
    const route = await prisma.routes.findFirst({
      where: { routable_type: 'Page', routable_id: Number(pageId), route_type: 'standard' },
    });
    data.page_id = pageId;
    data.url = route?.permalink ?? '';
  } else if (formData.has('url')) {
    data.url = String(formData.get('url') || '');
  }

  await prisma.menu_items.update({ where: { id: item.id }, data });
  if (item.menu_id) await cacheMenuHtml(item.menu_id);
  revalidatePath(`/admin/menus/${item.menu_id}`);
  return { ok: true };
}

export async function deleteMenuItem(itemId: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('menu_item', 'destroy');
    const item = await prisma.menu_items.findUnique({ where: { id: BigInt(itemId) } });
    if (!item) return { ok: true };
    // Detach children (match Rails: nested items lose parent).
    await prisma.menu_items.updateMany({ where: { parent: Number(item.id) }, data: { parent: null } });
    await prisma.menu_items.delete({ where: { id: item.id } });
    if (item.menu_id) await cacheMenuHtml(item.menu_id);
    revalidatePath(`/admin/menus/${item.menu_id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Položka nebyla smazána.' };
  }
}

/** Persists a new tree order/nesting: array of { id, children:[ids] }. */
export async function saveMenuOrder(
  menuId: string,
  tree: { id: string; children: string[] }[],
): Promise<{ ok: boolean }> {
  await requirePolicy('menu', 'change_order');
  let pos = 1;
  for (const node of tree) {
    await prisma.menu_items.update({
      where: { id: BigInt(node.id) },
      data: { parent: null, position: pos++ },
    });
    let childPos = 1;
    for (const childId of node.children) {
      await prisma.menu_items.update({
        where: { id: BigInt(childId) },
        data: { parent: Number(node.id), position: childPos++ },
      });
    }
  }
  await cacheMenuHtml(BigInt(menuId));
  revalidatePath(`/admin/menus/${menuId}`);
  return { ok: true };
}
