'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { parameterize } from '@/lib/page-constants';
import { defaultWidgetJson } from '@/lib/widgets';
import { publishPageContent } from '@/lib/content-render';
import { attachOne } from '@/lib/media';

/* ----------------------------- Page CRUD ----------------------------- */

export type CreatePageState = { error?: string };

export async function createPage(_prev: CreatePageState, formData: FormData): Promise<CreatePageState> {
  const user = await requirePolicy('page', 'create');
  const title = String(formData.get('title') || '');
  const permalink = parameterize(String(formData.get('permalink') || title));
  const parentId = formData.get('parent_id') ? BigInt(String(formData.get('parent_id'))) : null;

  const parent = parentId ? await prisma.pages.findUnique({ where: { id: parentId } }) : null;

  const page = await prisma.pages.create({
    data: {
      title,
      layout: String(formData.get('layout') || 'default'),
      language: String(formData.get('language') || 'cs'),
      state: String(formData.get('state') || 'hidden'),
      publish_type: 'public',
      uuid: parent?.uuid ?? randomUUID(),
      admin_user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  await prisma.routes.create({
    data: {
      routable_id: Number(page.id),
      routable_type: 'Page',
      permalink,
      route_type: 'standard',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (parent) {
    await duplicatePageModels(parent.id, page.id);
    await publishPageContent(page.id);
  }

  revalidatePath('/admin/pages');
  redirect('/admin/pages');
}

async function duplicatePageModels(sourceId: bigint, targetId: bigint) {
  const sections = await prisma.sections.findMany({
    where: { page_id: sourceId },
    orderBy: { created_at: 'asc' },
  });
  for (const section of sections) {
    const newSection = await prisma.sections.create({
      data: {
        page_id: targetId,
        name: section.name,
        description: section.description,
        position: section.position,
        css_classes: section.css_classes,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    const wrappers = await prisma.wrappers.findMany({
      where: { section_id: section.id },
      orderBy: { created_at: 'asc' },
    });
    for (const wrapper of wrappers) {
      const newWrapper = await prisma.wrappers.create({
        data: {
          section_id: newSection.id,
          name: wrapper.name,
          description: wrapper.description,
          position: wrapper.position,
          css_classes: wrapper.css_classes,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const wws = await prisma.wrapper_widgets.findMany({
        where: { wrapper_id: wrapper.id },
        orderBy: { created_at: 'asc' },
        include: { widgets: true },
      });
      for (const ww of wws) {
        const newWidget = await prisma.widgets.create({
          data: {
            name: ww.widgets.name,
            description: ww.widgets.description,
            global: ww.widgets.global,
            status: ww.widgets.status,
            json: ww.widgets.json,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        await prisma.wrapper_widgets.create({
          data: {
            wrapper_id: newWrapper.id,
            widget_id: newWidget.id,
            part: ww.part,
            position: ww.position,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    }
  }
}

export async function updatePageSettings(id: string, formData: FormData) {
  await requirePolicy('page', 'update');
  const data: Record<string, unknown> = { updated_at: new Date() };
  for (const key of [
    'title',
    'layout',
    'state',
    'meta_title',
    'meta_description',
    'meta_keywords',
    'og_title',
    'og_description',
    'og_image',
  ] as const) {
    if (formData.has(key)) data[key] = String(formData.get(key) || '');
  }
  await prisma.pages.update({ where: { id: BigInt(id) }, data });
  revalidatePath(`/admin/pages/${id}`);
}

const EDITABLE_PAGE_FIELDS = new Set([
  'title',
  'layout',
  'language',
  'meta_title',
  'meta_description',
  'meta_keywords',
  'og_title',
  'og_description',
  'og_image',
]);

export async function updatePageField(id: string, field: string, value: string) {
  try {
    await requirePolicy('page', 'update');
    if (!EDITABLE_PAGE_FIELDS.has(field)) return { ok: false, msg: 'Pole nelze upravit.' };
    await prisma.pages.update({
      where: { id: BigInt(id) },
      data: { [field]: value, updated_at: new Date() },
    });
    revalidatePath(`/admin/pages/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Stránku se nepodařilo uložit.' };
  }
}

export async function deletePage(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('page', 'destroy');
    const pid = BigInt(id);
    // Clean up composition + routes (Rails dependent: :destroy).
    const sections = await prisma.sections.findMany({ where: { page_id: pid } });
    for (const s of sections) {
      const wrappers = await prisma.wrappers.findMany({ where: { section_id: s.id } });
      for (const w of wrappers) {
        await prisma.wrapper_widgets.deleteMany({ where: { wrapper_id: w.id } });
      }
      await prisma.wrappers.deleteMany({ where: { section_id: s.id } });
    }
    await prisma.sections.deleteMany({ where: { page_id: pid } });
    await prisma.routes.deleteMany({ where: { routable_type: 'Page', routable_id: Number(pid) } });
    await prisma.pages.delete({ where: { id: pid } });
    revalidatePath('/admin/pages');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Stránka nebyla smazána.' };
  }
}

/* ------------------------------- Routes ------------------------------ */

export async function changeRoute(routeId: string, newPermalinkRaw: string) {
  await requirePolicy('page', 'update');
  const route = await prisma.routes.findUnique({ where: { id: BigInt(routeId) } });
  if (!route) return { ok: false, msg: 'Odkaz nenalezen.' };
  const newPermalink = parameterize(newPermalinkRaw);
  if (route.permalink === newPermalink) {
    return { ok: false, msg: 'Nový permalink je stejný jako aktuální.' };
  }

  // Ensure no other resource owns the permalink.
  const clashing = await prisma.routes.findMany({ where: { permalink: newPermalink } });
  for (const r of clashing) {
    if (r.routable_id !== route.routable_id) {
      return { ok: false, msg: 'Nový permalink již existuje pro jiný odkaz.' };
    }
  }

  // Restore an existing route for the same resource, or create a new standard one.
  let target = await prisma.routes.findFirst({
    where: {
      permalink: newPermalink,
      routable_type: route.routable_type ?? undefined,
      routable_id: route.routable_id ?? undefined,
    },
  });
  if (target) {
    await prisma.routes.update({ where: { id: target.id }, data: { route_type: 'standard' } });
  } else {
    target = await prisma.routes.create({
      data: {
        routable_id: route.routable_id,
        routable_type: route.routable_type,
        permalink: newPermalink,
        route_type: 'standard',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  await prisma.routes.update({ where: { id: route.id }, data: { route_type: 'redirect' } });
  await prisma.menu_items.updateMany({
    where: { url: route.permalink, kind: 'page' },
    data: { url: newPermalink },
  });

  revalidatePath(`/admin/pages/${route.routable_id}`);
  return { ok: true };
}

/* ------------------------------ Composer ----------------------------- */

export async function addSection(pageId: string, name: string) {
  await requirePolicy('page', 'update');
  const last = await prisma.sections.findFirst({
    where: { page_id: BigInt(pageId) },
    orderBy: { position: 'desc' },
  });
  const section = await prisma.sections.create({
    data: {
      page_id: BigInt(pageId),
      name,
      position: (last?.position ?? 0) + 1,
      css_classes: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return {
    ok: true,
    section: {
      id: section.id.toString(),
      name: section.name,
      description: section.description ?? '',
      cssClasses: section.css_classes ?? [],
      wrappers: [],
    },
  };
}

export async function updateSection(sectionId: string, cssClasses: string, description = '') {
  await requirePolicy('page', 'update');
  await prisma.sections.update({
    where: { id: BigInt(sectionId) },
    data: {
      css_classes: cssClasses.split(/\s+/).filter(Boolean),
      description,
      updated_at: new Date(),
    },
  });
  return { ok: true };
}

export async function deleteSection(sectionId: string) {
  await requirePolicy('page', 'update');
  const wrappers = await prisma.wrappers.findMany({ where: { section_id: BigInt(sectionId) } });
  for (const w of wrappers) {
    await prisma.wrapper_widgets.deleteMany({ where: { wrapper_id: w.id } });
  }
  await prisma.wrappers.deleteMany({ where: { section_id: BigInt(sectionId) } });
  await prisma.sections.delete({ where: { id: BigInt(sectionId) } });
  return { ok: true };
}

export async function addWrapper(sectionId: string, name: string) {
  await requirePolicy('page', 'update');
  const last = await prisma.wrappers.findFirst({
    where: { section_id: BigInt(sectionId) },
    orderBy: { position: 'desc' },
  });
  const wrapper = await prisma.wrappers.create({
    data: {
      section_id: BigInt(sectionId),
      name,
      position: (last?.position ?? 0) + 1,
      css_classes: [],
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return {
    ok: true,
    wrapper: { id: wrapper.id.toString(), name: wrapper.name, parts: {} },
  };
}

export async function deleteWrapper(wrapperId: string) {
  await requirePolicy('page', 'update');
  await prisma.wrapper_widgets.deleteMany({ where: { wrapper_id: BigInt(wrapperId) } });
  await prisma.wrappers.delete({ where: { id: BigInt(wrapperId) } });
  return { ok: true };
}

export async function addWidget(wrapperId: string, widgetName: string, part: string) {
  await requirePolicy('page', 'update');
  const json = defaultWidgetJson(widgetName);
  const widget = await prisma.widgets.create({
    data: {
      name: widgetName,
      json: JSON.stringify(json),
      global: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  const last = await prisma.wrapper_widgets.findFirst({
    where: { wrapper_id: BigInt(wrapperId), part },
    orderBy: { position: 'desc' },
  });
  const wrapperWidget = await prisma.wrapper_widgets.create({
    data: {
      wrapper_id: BigInt(wrapperId),
      widget_id: widget.id,
      part,
      position: (last?.position ?? 0) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return {
    ok: true,
    widget: {
      wrapperWidgetId: wrapperWidget.id.toString(),
      widgetId: widget.id.toString(),
      name: widget.name ?? '',
      json,
      imageBlobId: null,
    },
  };
}

export async function updateWidgetJson(widgetId: string, json: Record<string, unknown>) {
  await requirePolicy('page', 'update');
  await prisma.widgets.update({
    where: { id: BigInt(widgetId) },
    data: { json: JSON.stringify(json), updated_at: new Date() },
  });
  return { ok: true };
}

export async function uploadWidgetImage(widgetId: string, formData: FormData) {
  await requirePolicy('page', 'update');
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    const blobId = await attachOne('Widget', BigInt(widgetId), 'attachments', image);
    return { ok: true, blobId: blobId.toString() };
  }
  return { ok: false, blobId: null };
}

export async function deleteWrapperWidget(wrapperWidgetId: string) {
  await requirePolicy('page', 'update');
  const ww = await prisma.wrapper_widgets.findUnique({ where: { id: BigInt(wrapperWidgetId) } });
  if (ww) {
    await prisma.wrapper_widgets.delete({ where: { id: ww.id } });
    await prisma.widgets.delete({ where: { id: ww.widget_id } }).catch(() => {});
  }
  return { ok: true };
}

/** Reorders sections by id array (mirrors update_sections_order). */
export async function reorderSections(ids: string[]) {
  await requirePolicy('page', 'update');
  let pos = 1;
  for (const id of ids) {
    await prisma.sections.update({ where: { id: BigInt(id) }, data: { position: pos++ } });
  }
  return { ok: true };
}

/**
 * Reorders wrappers within a section and (re)assigns their section
 * (mirrors update_wrappers_order — supports moving a wrapper between sections).
 */
export async function reorderWrappers(sectionId: string, ids: string[]) {
  await requirePolicy('page', 'update');
  let pos = 1;
  for (const id of ids) {
    await prisma.wrappers.update({
      where: { id: BigInt(id) },
      data: { section_id: BigInt(sectionId), position: pos++ },
    });
  }
  return { ok: true };
}

/**
 * Reorders widgets within a wrapper column part and (re)assigns their wrapper
 * and part (mirrors update_wrapper_widgets — supports moving between columns).
 */
export async function reorderWrapperWidgets(
  wrapperId: string,
  part: string,
  ids: string[],
) {
  await requirePolicy('page', 'update');
  let pos = 1;
  for (const id of ids) {
    await prisma.wrapper_widgets.update({
      where: { id: BigInt(id) },
      data: { wrapper_id: BigInt(wrapperId), part, position: pos++ },
    });
  }
  return { ok: true };
}

export async function publishPage(pageId: string): Promise<{ ok: boolean; msg: string }> {
  try {
    await requirePolicy('page', 'update');
    await publishPageContent(BigInt(pageId));
    revalidatePath(`/admin/pages/${pageId}`);
    return { ok: true, msg: 'Změny na stránce byly uloženy :)' };
  } catch {
    return { ok: false, msg: 'Změny na stránce nebyly uloženy.' };
  }
}
