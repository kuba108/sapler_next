import 'server-only';
import { redirect } from 'next/navigation';
import { currentAdminUser } from './auth';
import { can, type PolicyModel } from './acl';

/** Loads the current admin user or redirects to the login screen. */
export async function requireAdmin() {
  const user = await currentAdminUser();
  if (!user) redirect('/admin/prihlaseni');
  return user;
}

/** Loads the admin user and enforces a specific policy, else redirects to dashboard. */
export async function requirePolicy(model: PolicyModel, action: string) {
  const user = await requireAdmin();
  if (!can(user.acl, model, action)) {
    redirect('/admin');
  }
  return user;
}
