'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { parameterize } from '@/lib/page-constants';
import { attachOne } from '@/lib/media';
import { s3Delete } from '@/lib/s3';

export async function createAsset(formData: FormData) {
  const user = await requirePolicy('asset', 'create');
  const name = String(formData.get('name') || '');
  const description = String(formData.get('description') || '');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const permalinkBase = parameterize(name);
  const existingCount = await prisma.assets.count({ where: { permalink_base: permalinkBase } });
  const permalink = existingCount > 0 ? `${existingCount + 1}-${permalinkBase}` : permalinkBase;

  const asset = await prisma.assets.create({
    data: {
      name,
      description,
      permalink,
      permalink_base: permalinkBase,
      mime_type: file.type || 'application/octet-stream',
      admin_user_id: user.id,
      state: 'visible',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  await attachOne('Asset', asset.id, 'file', file);
  revalidatePath('/admin/media');
  redirect('/admin/media');
}

export async function updateAssetField(id: string, field: string, value: string) {
  try {
    await requirePolicy('asset', 'update');
    if (field !== 'name' && field !== 'description') return { ok: false, msg: 'Pole nelze upravit.' };
    await prisma.assets.update({
      where: { id: BigInt(id) },
      data: { [field]: value, updated_at: new Date() },
    });
    revalidatePath(`/admin/media/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Soubor se nepodařilo uložit.' };
  }
}

export async function deleteAsset(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('asset', 'destroy');
    const assetId = BigInt(id);
    const attachment = await prisma.active_storage_attachments.findFirst({
      where: { record_type: 'Asset', record_id: assetId, name: 'file' },
    });
    if (attachment) {
      const blob = await prisma.active_storage_blobs.findUnique({ where: { id: attachment.blob_id } });
      await prisma.active_storage_attachments.delete({ where: { id: attachment.id } });
      if (blob) {
        await prisma.active_storage_blobs.delete({ where: { id: blob.id } }).catch(() => {});
        await s3Delete(blob.key).catch(() => {});
      }
    }
    await prisma.assets.delete({ where: { id: assetId } });
    revalidatePath('/admin/media');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Soubor nebyl smazán.' };
  }
}
