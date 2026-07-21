import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { MENU_NAMES } from '@/lib/menu-html';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import MenuBuilder, { type MenuItemNode } from './MenuBuilder';

export const dynamic = 'force-dynamic';

export default async function MenuShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePolicy('menu', 'show');
  const menu = await prisma.menus.findUnique({ where: { id: BigInt(id) } });
  if (!menu) notFound();

  const allItems = await prisma.menu_items.findMany({
    where: { menu_id: menu.id },
    orderBy: { position: 'asc' },
  });

  const base = allItems.filter((i) => i.parent == null);
  const items: MenuItemNode[] = base.map((item) => ({
    id: item.id.toString(),
    label: item.label,
    url: item.url,
    kind: item.kind,
    newWindow: item.new_window,
    pageId: item.page_id ? item.page_id.toString() : null,
    children: allItems
      .filter((c) => c.parent === Number(item.id))
      .map((c) => ({
        id: c.id.toString(),
        label: c.label,
        url: c.url,
        kind: c.kind,
        newWindow: c.new_window,
        pageId: c.page_id ? c.page_id.toString() : null,
        children: [],
      })),
  }));

  const pages = await prisma.pages.findMany({
    where: { language: menu.language },
    orderBy: { title: 'asc' },
  });

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Menu', href: '/admin/menus' }, { label: MENU_NAMES[menu.name] ?? menu.name }]}
      />
      <PageContent>
        <MenuBuilder
          key={allItems
            .map((item) =>
              [item.id, item.parent, item.position, item.kind, item.label, item.url, item.page_id, item.new_window].join(':'),
            )
            .join('|')}
          menuId={id}
          items={items}
          pages={pages.map((p) => ({ id: p.id.toString(), title: p.title }))}
        />
      </PageContent>
    </>
  );
}
