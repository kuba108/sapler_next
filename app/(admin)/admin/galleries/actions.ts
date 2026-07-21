'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { currentAdminUser } from '@/lib/auth';
import { attachOne } from '@/lib/media';
import { LANGUAGES } from '@/lib/languages';

export async function createGallery(formData: FormData) {
  const user = await requirePolicy('gallery', 'create');
  await prisma.galleries.create({
    data: {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      admin_user_id: user.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  revalidatePath('/admin/galleries');
  redirect('/admin/galleries');
}

export async function updateGallery(id: string, formData: FormData) {
  await requirePolicy('gallery', 'update');
  await prisma.galleries.update({
    where: { id: BigInt(id) },
    data: {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      updated_at: new Date(),
    },
  });
  revalidatePath(`/admin/galleries/${id}`);
}

export async function updateGalleryField(id: string, field: string, value: string) {
  try {
    await requirePolicy('gallery', 'update');
    if (field !== 'name' && field !== 'description') return { ok: false, msg: 'Pole nelze upravit.' };
    await prisma.galleries.update({
      where: { id: BigInt(id) },
      data: { [field]: value, updated_at: new Date() },
    });
    revalidatePath(`/admin/galleries/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Galerii se nepodařilo uložit.' };
  }
}

export async function deleteGallery(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('gallery', 'destroy');
    await prisma.gallery_items.deleteMany({ where: { gallery_id: BigInt(id) } });
    await prisma.galleries.delete({ where: { id: BigInt(id) } });
    revalidatePath('/admin/galleries');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Galerie nebyla smazána.' };
  }
}

function i18nFromForm(formData: FormData, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { code } of LANGUAGES) {
    const v = formData.get(`${prefix}[${code}]`);
    if (v != null) out[code] = String(v);
  }
  return out;
}

export async function createGalleryItem(galleryId: string, formData: FormData) {
  await requirePolicy('gallery_item', 'create');
  const last = await prisma.gallery_items.findFirst({
    where: { gallery_id: BigInt(galleryId) },
    orderBy: { position: 'desc' },
  });
  const item = await prisma.gallery_items.create({
    data: {
      gallery_id: BigInt(galleryId),
      label: String(formData.get('label') || ''),
      description: String(formData.get('description') || ''),
      label_i18n: i18nFromForm(formData, 'label_i18n'),
      description_i18n: i18nFromForm(formData, 'description_i18n'),
      position: (last?.position ?? 0) + 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    await attachOne('GalleryItem', item.id, 'image', image);
  }
  revalidatePath(`/admin/galleries/${galleryId}`);
  return { ok: true };
}

export async function updateGalleryItem(itemId: string, formData: FormData) {
  await requirePolicy('gallery_item', 'update');
  const item = await prisma.gallery_items.update({
    where: { id: BigInt(itemId) },
    data: {
      label: String(formData.get('label') || ''),
      description: String(formData.get('description') || ''),
      label_i18n: i18nFromForm(formData, 'label_i18n'),
      description_i18n: i18nFromForm(formData, 'description_i18n'),
      updated_at: new Date(),
    },
  });
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    await attachOne('GalleryItem', item.id, 'image', image);
  }
  revalidatePath(`/admin/galleries/${item.gallery_id}`);
  return { ok: true };
}

export async function deleteGalleryItem(itemId: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('gallery_item', 'destroy');
    const item = await prisma.gallery_items.findUnique({ where: { id: BigInt(itemId) } });
    if (item) {
      await prisma.gallery_items.delete({ where: { id: item.id } });
      revalidatePath(`/admin/galleries/${item.gallery_id}`);
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Obrázek se nepodařilo smazat.' };
  }
}

export async function reorderGalleryItems(
  galleryId: string,
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  await requirePolicy('gallery', 'update');
  let pos = 1;
  for (const id of orderedIds) {
    await prisma.gallery_items.update({
      where: { id: BigInt(id) },
      data: { position: pos++ },
    });
  }
  revalidatePath(`/admin/galleries/${galleryId}`);
  return { ok: true };
}
