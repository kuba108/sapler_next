import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { dateToString } from '@/lib/format';
import { LANGUAGES } from '@/lib/languages';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deletePage } from './actions';

export const dynamic = 'force-dynamic';

export default async function PagesIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lang?: string }>;
}) {
  const { q = '', lang = '' } = await searchParams;
  const user = await requirePolicy('page', 'index');
  const pages = await prisma.pages.findMany({
    where: {
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(lang ? { language: lang } : {}),
    },
    orderBy: { created_at: 'desc' },
    include: { admin_users: true },
  });
  const isFiltered = q !== '' || lang !== '';

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
              <form method="get" className="float-right form-inline pages-filter-form">
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Hledat podle titulku…"
                  className="form-control mr-2 pages-filter-search"
                />
                <select name="lang" defaultValue={lang} className="form-control custom-select mr-2 pages-filter-lang">
                  <option value="">Všechny jazyky</option>
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-secondary mr-2">
                  <i className="fa fa-search" /> Filtrovat
                </button>
                {isFiltered && (
                  <Link href="/admin/pages" className="btn btn-link">
                    Zrušit filtr
                  </Link>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title={isFiltered ? `Stránky (${pages.length})` : 'Stránky'}>
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Titulek</th>
                    <th>Jazyk</th>
                    <th>Autor</th>
                    <th>Vytvořena</th>
                    <th>Změněna</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        Žádné stránky neodpovídají filtru.
                      </td>
                    </tr>
                  )}
                  {pages.map((p) => (
                    <tr key={p.id.toString()}>
                      <td>
                        {can(user.acl, 'page', 'show') ? (
                          <Link href={`/admin/pages/${p.id}`}>{p.title}</Link>
                        ) : (
                          p.title
                        )}
                      </td>
                      <td>{LANGUAGES.find((language) => language.code === p.language)?.label ?? p.language}</td>
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
