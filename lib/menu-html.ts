import 'server-only';
import { prisma } from './prisma';

export { MENU_NAMES, MENU_LAYOUTS } from './menu-constants';

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type ItemRow = {
  id: bigint;
  label: string;
  url: string;
  parent: number | null;
  position: number;
};

async function baseItems(menuId: bigint): Promise<ItemRow[]> {
  const items = await prisma.menu_items.findMany({
    where: { menu_id: menuId, parent: null },
    orderBy: { position: 'asc' },
  });
  return items as unknown as ItemRow[];
}

async function nestedItems(parentId: bigint): Promise<ItemRow[]> {
  const items = await prisma.menu_items.findMany({
    where: { parent: Number(parentId) },
    orderBy: { position: 'asc' },
  });
  return items as unknown as ItemRow[];
}

/** Renders the cached HTML for a menu, matching admin/menus/html/<name> templates. */
export async function renderMenuHtml(menuId: bigint, name: string): Promise<string> {
  const items = await baseItems(menuId);

  if (name === 'main_menu') {
    const parts: string[] = ['<ul class="nav navbar-nav">'];
    for (const item of items) {
      const nested = await nestedItems(item.id);
      parts.push('  <li class="dropdown">');
      if (nested.length > 0) {
        parts.push(
          `    <a class="dropdown-toggle js-activated" href="${esc(item.url)}">${esc(item.label)}</a>`,
        );
        parts.push('    <ul class="dropdown-menu">');
        for (const n of nested) {
          parts.push(
            `      <li class="dropdown"><a class="nav-link" href="${esc(n.url)}">${esc(n.label)}</a></li>`,
          );
        }
        parts.push('    </ul>');
      } else {
        parts.push(`    <a class="nav-link" href="${esc(item.url)}">${esc(item.label)}</a>`);
      }
      parts.push('  </li>');
    }
    parts.push('</ul>');
    return parts.join('\n');
  }

  if (name === 'footer_menu') {
    const parts = ['<ul class="footer-menu pull-right">'];
    for (const item of items) {
      parts.push(`  <li class=""><a class="" href="${esc(item.url)}">${esc(item.label)}</a></li>`);
    }
    parts.push('</ul>');
    return parts.join('\n');
  }

  // product_categories_menu (and any other)
  const parts = ['<ul class="border-list">'];
  for (const item of items) {
    parts.push(`  <li class=""><a class="" href="${esc(item.url)}">${esc(item.label)}</a></li>`);
  }
  parts.push('</ul>');
  return parts.join('\n');
}

/** Regenerates and persists a menu's cached HTML content. */
export async function cacheMenuHtml(menuId: bigint): Promise<void> {
  const menu = await prisma.menus.findUnique({ where: { id: menuId } });
  if (!menu) return;
  const content = await renderMenuHtml(menuId, menu.name);
  await prisma.menus.update({
    where: { id: menuId },
    data: { content, updated_at: new Date() },
  });
}
