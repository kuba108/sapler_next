import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-auth';
import { canIndex } from '@/lib/acl';
import Sidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/admin/Navbar';
import BootstrapBehaviors from '@/components/admin/BootstrapBehaviors';

export const metadata: Metadata = {
  title: 'RubyQ',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const nav = [
    { href: '/admin', label: 'Dashboard', icon: 'nc-chart-pie-35', match: '/admin', model: 'dashboard' as const },
    { href: '/admin/admin_users', label: 'Uživatelé', icon: 'nc-circle-09', match: '/admin/admin_users', model: 'admin_user' as const },
    { href: '/admin/menus', label: 'Menu', icon: 'nc-compass-05', match: '/admin/menus', model: 'menu' as const },
    { href: '/admin/pages', label: 'Stránky', icon: 'nc-single-copy-04', match: '/admin/pages', model: 'page' as const },
    { href: '/admin/reviews', label: 'Recenze', icon: 'nc-email-85', match: '/admin/reviews', model: 'review' as const },
    { href: '/admin/galleries', label: 'Galerie', icon: 'nc-album-2', match: '/admin/galleries', model: 'gallery' as const },
    { href: '/admin/settings', label: 'Nastavení', icon: 'nc-settings-gear-64', match: '/admin/settings', model: 'setting' as const },
  ].filter((item) => canIndex(user.acl, item.model));

  return (
    <html lang="cs">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" />
        <link href="/assets/admin.css" rel="stylesheet" />
        <link href="/assets/admin-overrides.css" rel="stylesheet" />
      </head>
      <body className="admin">
        <BootstrapBehaviors />
        <div className="wrapper">
          <Sidebar nav={nav.map(({ href, label, icon, match }) => ({ href, label, icon, match }))} />
          <div className="main-panel">
            <Navbar email={user.email} userId={user.id.toString()} />
            {children}
            <footer className="footer">
              <div className="container-fluid">
                <nav>
                  <p className="copyright text-center">
                    &copy; {new Date().getFullYear()} Jakub Malina, made with love for better web apps
                  </p>
                </nav>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
