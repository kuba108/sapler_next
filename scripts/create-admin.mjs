/**
 * Creates or updates an admin user with a known password (dev convenience).
 * Usage: node --env-file=.env scripts/create-admin.mjs <email> <password>
 *
 * Grants a full ACL (all modules/actions). Safe to re-run.
 */
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const email = (process.argv[2] || 'admin@local').toLowerCase();
const password = process.argv[3] || 'admin1234';

const FULL_ACL = {
  policies: {
    dashboard: { show_stats: '1' },
    admin_user: {
      index: '1', show: '1', update: '1', create: '1', destroy: '1',
      update_acl: '1', change_passwords: '1',
    },
    menu: { index: '1', show: '1', update: '1', create: '1', destroy: '1', change_order: '1' },
    menu_item: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
    page: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
    review: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
    gallery: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
    gallery_item: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
    setting: { index: '1', show: '1', update: '1', create: '1', destroy: '1' },
  },
};

const digest = bcrypt.hashSync(password, 11);

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const existing = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
if (existing.rows.length > 0) {
  await client.query(
    'UPDATE admin_users SET encrypted_password = $1, acl = $2, deleted_at = NULL, updated_at = now() WHERE email = $3',
    [digest, JSON.stringify(FULL_ACL), email],
  );
  console.log(`Updated admin ${email} (password: ${password})`);
} else {
  await client.query(
    `INSERT INTO admin_users (email, encrypted_password, acl, first_name, last_name, sign_in_count, created_at, updated_at)
     VALUES ($1, $2, $3, 'Admin', 'Local', 0, now(), now())`,
    [email, digest, JSON.stringify(FULL_ACL)],
  );
  console.log(`Created admin ${email} (password: ${password})`);
}
await client.end();
