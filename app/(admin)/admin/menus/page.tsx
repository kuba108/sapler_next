import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { MENU_NAMES } from '@/lib/menu-html';
import { LANGUAGES } from '@/lib/languages';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteMenu } from './actions';

export const dynamic = 'force-dynamic';

export default async function MenusIndex() {
  const user = await requirePolicy('menu', 'index');
  const menus = await prisma.menus.findMany({ orderBy: { name: 'asc' } });
  const langLabel = (code: string) => LANGUAGES.find((l) => l.code === code)?.label ?? code;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Menu', href: '/admin/menus' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'menu', 'create') && (
                  <Link href="/admin/menus/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nové menu
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title="Menu">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Název</th>
                    <th>Jazyk</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {menus.map((m) => (
                    <tr key={m.id.toString()}>
                      <td>
                        <Link href={`/admin/menus/${m.id}`}>{MENU_NAMES[m.name] ?? m.name}</Link>
                      </td>
                      <td>{langLabel(m.language)}</td>
                      <td className="row-actions">
                        {can(user.acl, 'menu', 'destroy') && (
                          <DeleteButton
                            id={m.id.toString()}
                            label={`${MENU_NAMES[m.name] ?? m.name} pro jazyk ${langLabel(m.language)}`}
                            action={deleteMenu}
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
