import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteAdminUser } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminUsersIndex() {
  const user = await requirePolicy('admin_user', 'index');
  const users = await prisma.admin_users.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
  });

  return (
    <>
      <Breadcrumbs items={[{ label: 'Uživatelé', href: '/admin/admin_users' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'admin_user', 'create') && (
                  <Link href="/admin/admin_users/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nový uživatel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title="Uživatelé">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Jméno</th>
                    <th>Přijmení</th>
                    <th>E-mail</th>
                    <th>Počet přihlášení</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id.toString()}>
                      <td>
                        {can(user.acl, 'admin_user', 'show') ? (
                          <Link href={`/admin/admin_users/${u.id}`}>{u.first_name}</Link>
                        ) : (
                          u.first_name
                        )}
                      </td>
                      <td>{u.last_name}</td>
                      <td>{u.email}</td>
                      <td>{u.sign_in_count}</td>
                      <td className="row-actions">
                        {can(user.acl, 'admin_user', 'destroy') && (
                          <DeleteButton
                            id={u.id.toString()}
                            label={`Uživatele ${u.first_name} ${u.last_name}`}
                            action={deleteAdminUser}
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
