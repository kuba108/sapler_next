/** ACL model/action definitions with Czech labels (from config/locales/acl.cs.yml). */
export const ACL_SCHEMA: {
  model: string;
  label: string;
  actions: { key: string; label: string }[];
}[] = [
  {
    model: 'dashboard',
    label: 'Dashboard',
    actions: [{ key: 'show_stats', label: 'Zobrazit statistiky' }],
  },
  {
    model: 'admin_user',
    label: 'Uživatelé',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
      { key: 'update_acl', label: 'Upravit práva uživatelů' },
      { key: 'change_passwords', label: 'Měnit hesla' },
    ],
  },
  {
    model: 'menu',
    label: 'Menu',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
      { key: 'change_order', label: 'Měnit pořadí' },
    ],
  },
  {
    model: 'menu_item',
    label: 'Položky menu',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
  {
    model: 'page',
    label: 'Stránky',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
  {
    model: 'review',
    label: 'Recenze',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
  {
    model: 'gallery',
    label: 'Galerie',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
  {
    model: 'gallery_item',
    label: 'Obrázky v galerii',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
  {
    model: 'setting',
    label: 'Nastavení',
    actions: [
      { key: 'index', label: 'Zobrazit seznam' },
      { key: 'show', label: 'Zobrazit detail' },
      { key: 'update', label: 'Upravit' },
      { key: 'create', label: 'Vytvořit' },
      { key: 'destroy', label: 'Smazat' },
    ],
  },
];
