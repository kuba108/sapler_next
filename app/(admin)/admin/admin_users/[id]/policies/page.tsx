import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { ACL_SCHEMA } from '@/lib/acl-schema';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import { updateAcl } from '../../actions';
import AclEditor from './AclEditor';

export const dynamic = 'force-dynamic';

export default async function AclPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePolicy('admin_user', 'update_acl');
  const user = await prisma.admin_users.findUnique({ where: { id: BigInt(id) } });
  if (!user) notFound();

  const policies =
    (user.acl as { policies?: Record<string, Record<string, string>> })?.policies ?? {};

  const initial: Record<string, Record<string, boolean>> = {};
  for (const group of ACL_SCHEMA) {
    initial[group.model] = {};
    for (const a of group.actions) {
      initial[group.model][a.key] = policies[group.model]?.[a.key] === '1';
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Uživatelé', href: '/admin/admin_users' },
          { label: `${user.first_name} ${user.last_name}`, href: `/admin/admin_users/${id}` },
          { label: 'Práva' },
        ]}
      />
      <PageContent>
        <div className="card">
          <div className="card-header">
            <div className="row">
              <div className="col-md-8">
                <h4 className="card-title">
                  Upravit práva uživatele <strong>{user.first_name} {user.last_name}</strong>
                </h4>
              </div>
              <div className="col-md-4">
                <div className="float-right">
                  <Link href={`/admin/admin_users/${id}`} className="btn btn-default">
                    Zpět na detail uživatele
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <AclEditor userId={id} initial={initial} action={updateAcl} />
          </div>
        </div>
      </PageContent>
    </>
  );
}
