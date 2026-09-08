import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { dateToString } from '@/lib/format';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteAsset } from './actions';

export const dynamic = 'force-dynamic';

export default async function MediaIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const user = await requirePolicy('asset', 'index');
  const assets = await prisma.assets.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { created_at: 'desc' },
    include: { admin_users: true },
  });
  const isFiltered = q !== '';

  return (
    <>
      <Breadcrumbs items={[{ label: 'Média', href: '/admin/media' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'asset', 'create') && (
                  <Link href="/admin/media/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nový soubor
                  </Link>
                )}
              </div>
              <form method="get" className="float-right form-inline pages-filter-form">
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Hledat podle názvu…"
                  className="form-control mr-2 pages-filter-search"
                />
                <button type="submit" className="btn btn-secondary mr-2">
                  <i className="fa fa-search" /> Filtrovat
                </button>
                {isFiltered && (
                  <Link href="/admin/media" className="btn btn-link">
                    Zrušit filtr
                  </Link>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title={isFiltered ? `Soubor (${assets.length})` : 'Soubor'}>
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Autor</th>
                    <th>Vytvořena</th>
                    <th>Změněna</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        Žádné soubory.
                      </td>
                    </tr>
                  )}
                  {assets.map((a) => (
                    <tr key={a.id.toString()}>
                      <td>
                        {can(user.acl, 'asset', 'show') ? (
                          <Link href={`/admin/media/${a.id}`}>{a.name}</Link>
                        ) : (
                          a.name
                        )}
                      </td>
                      <td>
                        {a.admin_users
                          ? `${a.admin_users.first_name ?? ''} ${a.admin_users.last_name ?? ''}`
                          : ''}
                      </td>
                      <td>{dateToString(a.created_at)}</td>
                      <td>{dateToString(a.updated_at)}</td>
                      <td className="row-actions">
                        {can(user.acl, 'asset', 'destroy') && (
                          <DeleteButton
                            id={a.id.toString()}
                            label={`Soubor ${a.name}`}
                            action={deleteAsset}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </PageContent>
    </>
  );
}
