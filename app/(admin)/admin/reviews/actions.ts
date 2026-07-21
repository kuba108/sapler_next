'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { attachOne } from '@/lib/media';

export async function createReview(formData: FormData) {
  await requirePolicy('review', 'create');
  const review = await prisma.reviews.create({
    data: {
      title: String(formData.get('title') || ''),
      text: String(formData.get('text') || ''),
      signature: String(formData.get('signature') || ''),
      date: String(formData.get('date') || ''),
      score: Number(formData.get('score') || 0),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    await attachOne('Review', review.id, 'image', image);
  }

  revalidatePath('/admin/reviews');
  redirect(`/admin/reviews/${review.id}`);
}

export async function updateReview(id: string, formData: FormData) {
  await requirePolicy('review', 'update');
  const data: Record<string, unknown> = { updated_at: new Date() };
  for (const key of ['title', 'text', 'signature', 'date'] as const) {
    if (formData.has(key)) data[key] = String(formData.get(key) || '');
  }
  if (formData.has('score')) data.score = Number(formData.get('score') || 0);
  if (formData.has('is_approved')) data.is_approved = formData.get('is_approved') === 'true';
  if (formData.has('is_important')) data.is_important = formData.get('is_important') === 'true';

  await prisma.reviews.update({ where: { id: BigInt(id) }, data });

  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    await attachOne('Review', BigInt(id), 'image', image);
  }

  revalidatePath(`/admin/reviews/${id}`);
}

export async function updateReviewField(id: string, field: string, value: string) {
  try {
    await requirePolicy('review', 'update');
    if (!['title', 'text', 'signature', 'date', 'score'].includes(field)) {
      return { ok: false, msg: 'Pole nelze upravit.' };
    }
    await prisma.reviews.update({
      where: { id: BigInt(id) },
      data: { [field]: field === 'score' ? Number(value) : value, updated_at: new Date() },
    });
    revalidatePath(`/admin/reviews/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Recenzi se nepodařilo uložit.' };
  }
}

export async function deleteReview(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('review', 'destroy');
    await prisma.reviews.delete({ where: { id: BigInt(id) } });
    revalidatePath('/admin/reviews');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Recenze nebyla smazána.' };
  }
}
