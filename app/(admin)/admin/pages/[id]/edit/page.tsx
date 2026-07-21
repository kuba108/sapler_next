import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { firstAttachmentBlobId } from '@/lib/media';
import { WRAPPER_PARTS } from '@/lib/widgets';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import PageComposer, { type SectionData } from './PageComposer';
import type { WidgetData } from './WidgetEditor';

export const dynamic = 'force-dynamic';

export default async function PageEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePolicy('page', 'update');
  const page = await prisma.pages.findUnique({ where: { id: BigInt(id) } });
  if (!page) notFound();

  const sectionRows = await prisma.sections.findMany({
    where: { page_id: page.id },
    orderBy: { position: 'asc' },
  });

  const sections: SectionData[] = [];
  for (const section of sectionRows) {
    const wrapperRows = await prisma.wrappers.findMany({
      where: { section_id: section.id },
      orderBy: { position: 'asc' },
    });

    const wrappers = [];
    for (const wrapper of wrapperRows) {
      const parts: Record<string, WidgetData[]> = {};
      for (const part of WRAPPER_PARTS[wrapper.name] ?? ['column']) {
        const wws = await prisma.wrapper_widgets.findMany({
          where: { wrapper_id: wrapper.id, part },
          orderBy: { position: 'asc' },
          include: { widgets: true },
        });
        parts[part] = await Promise.all(
          wws.map(async (ww) => {
            let json: Record<string, unknown> = {};
            try {
              json = ww.widgets.json ? JSON.parse(ww.widgets.json) : {};
            } catch {
              json = {};
            }
            const imageBlobId =
              ww.widgets.name === 'image'
                ? await firstAttachmentBlobId('Widget', ww.widgets.id, 'attachments')
                : null;
            return {
              wrapperWidgetId: ww.id.toString(),
              widgetId: ww.widgets.id.toString(),
              name: ww.widgets.name ?? '',
              json,
              imageBlobId: imageBlobId ? imageBlobId.toString() : null,
            };
          }),
        );
      }
      wrappers.push({ id: wrapper.id.toString(), name: wrapper.name, parts });
    }

    sections.push({
      id: section.id.toString(),
      name: section.name,
      description: section.description ?? '',
      cssClasses: section.css_classes ?? [],
      wrappers,
    });
  }

  const galleries = await prisma.galleries.findMany({ orderBy: { name: 'asc' } });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Stránky', href: '/admin/pages' },
          { label: page.title, href: `/admin/pages/${id}` },
          { label: 'Editace stránky' },
        ]}
      />
      <PageContent>
        <PageComposer
          pageId={id}
          sections={sections}
          galleries={galleries.map((g) => ({ id: g.id.toString(), name: g.name }))}
        />
      </PageContent>
    </>
  );
}
