import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { dateToString } from '@/lib/format';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deletePage } from './actions';

export const dynamic = 'force-dynamic';

export default async function PagesIndex() {
  const user = await requirePolicy('page', 'index');
  const pages = await prisma.pages.findMany({
    orderBy: { created_at: 'desc' },
    include: { admin_users: true },
  });

  return (
    <>
      <Breadcrumbs items={[{ label: 'Stránky', href: '/admin/pages' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'page', 'create') && (
                  <Link href="/admin/pages/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nová stránka
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title="Stránky">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Titulek</th>
                    <th>Autor</th>
                    <th>Vytvořena</th>
                    <th>Změněna</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.id.toString()}>
                      <td>
                        {can(user.acl, 'page', 'show') ? (
                          <Link href={`/admin/pages/${p.id}`}>{p.title}</Link>
                        ) : (
                          p.title
                        )}
                      </td>
                      <td>
                        {p.admin_users
                          ? `${p.admin_users.first_name ?? ''} ${p.admin_users.last_name ?? ''}`
                          : ''}
                      </td>
                      <td>{dateToString(p.created_at)}</td>
                      <td>{dateToString(p.updated_at)}</td>
                      <td className="row-actions">
                        {can(user.acl, 'page', 'destroy') && (
                          <DeleteButton
                            id={p.id.toString()}
                            label={`Stránku ${p.title}`}
                            action={deletePage}
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
