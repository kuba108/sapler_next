import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { timeToString } from '@/lib/format';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import InlineEditor from '@/components/admin/InlineEditor';
import { updateAdminUserField } from '../actions';
import PasswordChanger from './PasswordChanger';

export const dynamic = 'force-dynamic';

export default async function AdminUserShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requirePolicy('admin_user', 'show');
  const user = await prisma.admin_users.findUnique({ where: { id: BigInt(id) } });
  if (!user) notFound();

  const isSelf = me.id === user.id;
  const canChangePassword = isSelf || can(me.acl, 'admin_user', 'change_passwords');
  const canUpdateAcl = can(me.acl, 'admin_user', 'update_acl');
  const canUpdate = can(me.acl, 'admin_user', 'update');
  const fieldAction = (field: string) => updateAdminUserField.bind(null, id, field);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Uživatelé', href: '/admin/admin_users' },
          { label: `${user.first_name} ${user.last_name}` },
        ]}
      />
      <PageContent>
        <div className="row">
          <div className={canChangePassword ? 'col-md-8' : 'col-md-12'}>
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Uživatel</h4>
              </div>
              <div className="card-body">
                  <div className="card-row">
                    <InlineEditor label="Jméno" value={user.first_name ?? ''} saveValue={fieldAction('first_name')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <InlineEditor label="Přijmení" value={user.last_name ?? ''} saveValue={fieldAction('last_name')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <InlineEditor label="E-mail" value={user.email} type="email" saveValue={fieldAction('email')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <div className="card-label">Vytvořen</div>
                    <div className="card-text">{timeToString(user.created_at)}</div>
                  </div>
                  <div className="card-row">
                    <div className="card-label">Upraven</div>
                    <div className="card-text">{timeToString(user.updated_at)}</div>
                  </div>
              </div>
            </div>
          </div>

          {canChangePassword && (
            <div className="col-md-4">
              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Nastavení</h4>
                </div>
                <div className="card-body">
                  <PasswordChanger userId={id} />
                </div>
              </div>
            </div>
          )}
        </div>

        {canUpdateAcl && (
          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-8">
                  <h4 className="card-title">Uživatelská práva</h4>
                </div>
                <div className="col-md-4">
                  <div className="float-right">
                    <Link href={`/admin/admin_users/${id}/policies`} className="btn btn-default">
                      Upravit práva
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
