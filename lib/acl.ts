/**
 * Port of the Pundit policy layer. Permissions live in
 * admin_users.acl = { policies: { <model>: { <action>: "1" | "0" } } }.
 */
export type Acl = {
  policies?: Record<string, Record<string, string>>;
};

export type PolicyModel =
  | 'dashboard'
  | 'admin_user'
  | 'menu'
  | 'menu_item'
  | 'page'
  | 'review'
  | 'gallery'
  | 'gallery_item'
  | 'setting';

export function can(
  acl: unknown,
  model: PolicyModel,
  action: string,
): boolean {
  const policies = (acl as Acl)?.policies;
  return policies?.[model]?.[action] === '1';
}

/** Convenience: is any action of a model allowed (for sidebar visibility). */
export function canIndex(acl: unknown, model: PolicyModel): boolean {
  return can(acl, model, 'index') || can(acl, model, 'show_stats');
}
