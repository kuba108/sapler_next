'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('admin_user[email]') || formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('admin_user[password]') || formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Neplatný e-mail nebo heslo.' };
  }

  const user = await prisma.admin_users.findUnique({ where: { email } });
  if (!user || user.deleted_at || !verifyPassword(password, user.encrypted_password)) {
    return { error: 'Neplatný e-mail nebo heslo.' };
  }

  await createSession({ adminUserId: user.id.toString(), email: user.email });
  redirect('/admin');
}
