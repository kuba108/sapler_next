'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match: string;
};

export default function Sidebar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div
      className="sidebar"
      data-color="blue"
      data-image="/assets/admin/sidebar-7.jpg"
    >
      <div className="sidebar-wrapper">
        <div className="logo">
          <Link href="/admin" className="simple-text">
            Sapler Admin
          </Link>
        </div>
        <ul className="nav">
          {nav.map((item) => {
            const active =
              item.match === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.match);
            return (
              <li key={item.href} className={`nav-item${active ? ' active' : ''}`}>
                <Link href={item.href} className="nav-link">
                  <i className={`nc-icon ${item.icon}`} />
                  <p>{item.label}</p>
                </Link>
              </li>
            );
          })}
          <li className="nav-item">
            <a href="/" className="nav-link" target="_blank" rel="noreferrer">
              <i className="nc-icon nc-tv-2" />
              <p>Zobrazit web</p>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
