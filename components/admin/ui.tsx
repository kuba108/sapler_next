import Link from 'next/link';

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <div className="content-breadcrumbs" style={{ padding: '15px 15px 0' }}>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb" style={{ background: 'transparent', marginBottom: 0 }}>
          <li className="breadcrumb-item">
            <Link href="/admin">
              <span className="fa fa-home" />
            </Link>
          </li>
          {items.map((it, i) => (
            <li
              key={i}
              className={`breadcrumb-item${i === items.length - 1 ? ' active' : ''}`}
            >
              {it.href && i !== items.length - 1 ? <Link href={it.href}>{it.label}</Link> : it.label}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

export function PageContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="content">
      <div className="container-fluid">{children}</div>
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card strpied-tabled-with-hover ${className}`}>
      {title && (
        <div className="card-header">
          <h4 className="card-title">{title}</h4>
        </div>
      )}
      <div className="card-body table-full-width table-responsive">{children}</div>
    </div>
  );
}
