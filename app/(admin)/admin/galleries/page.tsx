import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { dateToString } from '@/lib/format';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteGallery } from './actions';

export const dynamic = 'force-dynamic';

export default async function GalleriesIndex() {
  const user = await requirePolicy('gallery', 'index');
  const galleries = await prisma.galleries.findMany({
    orderBy: { created_at: 'desc' },
    include: { admin_users: true },
  });

  return (
    <>
      <Breadcrumbs items={[{ label: 'Galerie', href: '/admin/galleries' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'gallery', 'create') && (
                  <Link href="/admin/galleries/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nová galerie
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title="Galerie">
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
                  {galleries.map((g) => (
                    <tr key={g.id.toString()}>
                      <td>
                        {can(user.acl, 'gallery', 'show') ? (
                          <Link href={`/admin/galleries/${g.id}`}>{g.name}</Link>
                        ) : (
                          g.name
                        )}
                      </td>
                      <td>
                        {g.admin_users
                          ? `${g.admin_users.first_name ?? ''} ${g.admin_users.last_name ?? ''}`
                          : ''}
                      </td>
                      <td>{dateToString(g.created_at)}</td>
                      <td>{dateToString(g.updated_at)}</td>
                      <td className="row-actions">
                        {can(user.acl, 'gallery', 'destroy') && (
                          <DeleteButton
                            id={g.id.toString()}
                            label={`Galerii ${g.name}`}
                            action={deleteGallery}
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
