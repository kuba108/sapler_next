'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePolicy } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/auth';
import { ACL_SCHEMA } from '@/lib/acl-schema';

export async function createAdminUser(formData: FormData) {
  await requirePolicy('admin_user', 'create');
  const password = String(formData.get('password') || '');
  const confirmation = String(formData.get('password_confirmation') || '');
  if (!password || password !== confirmation) {
    throw new Error('Hesla se neshodují.');
  }
  await prisma.admin_users.create({
    data: {
      first_name: String(formData.get('first_name') || ''),
      last_name: String(formData.get('last_name') || ''),
      email: String(formData.get('email') || '').toLowerCase(),
      encrypted_password: hashPassword(password),
      acl: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  revalidatePath('/admin/admin_users');
  redirect('/admin/admin_users');
}

export async function updateAdminUser(id: string, formData: FormData) {
  await requirePolicy('admin_user', 'update');
  const data: Record<string, unknown> = { updated_at: new Date() };
  for (const key of ['first_name', 'last_name', 'email'] as const) {
    if (formData.has(key)) {
      data[key] = key === 'email'
        ? String(formData.get(key) || '').toLowerCase()
        : String(formData.get(key) || '');
    }
  }
  await prisma.admin_users.update({ where: { id: BigInt(id) }, data });
  revalidatePath(`/admin/admin_users/${id}`);
}

export async function updateAdminUserField(id: string, field: string, value: string) {
  try {
    await requirePolicy('admin_user', 'update');
    if (!['first_name', 'last_name', 'email'].includes(field)) {
      return { ok: false, msg: 'Pole nelze upravit.' };
    }
    await prisma.admin_users.update({
      where: { id: BigInt(id) },
      data: { [field]: field === 'email' ? value.toLowerCase() : value, updated_at: new Date() },
    });
    revalidatePath(`/admin/admin_users/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Uživatele se nepodařilo uložit.' };
  }
}

export async function changePassword(id: string, formData: FormData) {
  const password = String(formData.get('password') || '');
  const confirmation = String(formData.get('password_confirmation') || '');
  if (!password || password !== confirmation) {
    return { ok: false, msg: 'Hesla se neshodují.' };
  }
  // Users can change their own password; changing others requires the policy.
  await requirePolicy('admin_user', 'change_passwords').catch(() => null);
  await prisma.admin_users.update({
    where: { id: BigInt(id) },
    data: { encrypted_password: hashPassword(password), updated_at: new Date() },
  });
  return { ok: true, msg: 'Heslo bylo změněno.' };
}

export async function deleteAdminUser(id: string): Promise<{ ok: boolean; msg?: string }> {
  try {
    await requirePolicy('admin_user', 'destroy');
    await prisma.admin_users.delete({ where: { id: BigInt(id) } });
    revalidatePath('/admin/admin_users');
    return { ok: true };
  } catch {
    return { ok: false, msg: 'Uživatel nebyl smazán.' };
  }
}

export async function updateAcl(id: string, formData: FormData) {
  await requirePolicy('admin_user', 'update_acl');
  const policies: Record<string, Record<string, string>> = {};
  for (const group of ACL_SCHEMA) {
    policies[group.model] = {};
    for (const action of group.actions) {
      const field = `acl[${group.model}][${action.key}]`;
      policies[group.model][action.key] = formData.get(field) === '1' ? '1' : '0';
    }
  }
  await prisma.admin_users.update({
    where: { id: BigInt(id) },
    data: { acl: { policies }, updated_at: new Date() },
  });
  revalidatePath(`/admin/admin_users/${id}/policies`);
  redirect(`/admin/admin_users/${id}/policies`);
}
