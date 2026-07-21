import Link from 'next/link';
import { logoutAction } from './actions';

export default function Navbar({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) {
  return (
    <nav className="navbar navbar-expand-lg" color-on-scroll="500">
      <div className="container-fluid">
        <div className="breadcrumbs">
          <Link href="/admin" className="home">
            <span className="fa fa-home" />
          </Link>
        </div>
        <div className="collapse navbar-collapse justify-content-end" id="navigation">
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <Link href={`/admin/admin_users/${userId}`} className="nav-link">
                {email}
              </Link>
            </li>
            <li className="nav-item">
              <form action={logoutAction}>
                <button type="submit" className="nav-link admin-logout-link">
                  <span className="no-icon">Odhlásit se</span>
                </button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
