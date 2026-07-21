import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { timeToString, dateToString } from '@/lib/format';
import { PAGE_LAYOUTS } from '@/lib/page-constants';
import { LANGUAGES } from '@/lib/languages';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import InlineEditor from '@/components/admin/InlineEditor';
import { updatePageField } from '../actions';
import RouteChanger from './RouteChanger';

export const dynamic = 'force-dynamic';

export default async function PageShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePolicy('page', 'show');
  const page = await prisma.pages.findUnique({ where: { id: BigInt(id) } });
  if (!page) notFound();

  const routes = await prisma.routes.findMany({
    where: { routable_type: 'Page', routable_id: Number(page.id) },
    orderBy: [{ route_type: 'desc' }, { created_at: 'asc' }],
  });
  const standardRoute = routes.find((r) => r.route_type === 'standard');

  const locales = page.uuid
    ? await prisma.pages.findMany({ where: { uuid: page.uuid, id: { not: page.id } } })
    : [];

  const canUpdate = can(admin.acl, 'page', 'update');
  const fieldAction = (field: string) => updatePageField.bind(null, id, field);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Stránky', href: '/admin/pages' }, { label: page.title }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                <Link href={`/admin/pages/${id}/edit`} className="btn btn-warning">
                  <span className="fa fa-pencil" /> Editovat stránku
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="row">
            <div className="col-md-8">
              <div className="card striped-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Stránka</h4>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <InlineEditor label="Titulek" value={page.title} saveValue={fieldAction('title')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <div className="card-label">Vytvořena</div>
                    <div className="card-text">{timeToString(page.created_at)}</div>
                  </div>
                  <div className="card-row">
                    <div className="card-label">Upravena</div>
                    <div className="card-text">{timeToString(page.updated_at)}</div>
                  </div>
                </div>
              </div>

              <div className="card striped-tabled-with-hover">
                <div className="card-header">
                  <div className="row">
                    <div className="col-md-6">
                      <h4 className="card-title">Odkazy na stránku</h4>
                    </div>
                    <div className="col-md-6">
                      <div className="float-right">
                        {standardRoute && <RouteChanger routeId={standardRoute.id.toString()} />}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <table className="table table-hover table-striped">
                    <thead>
                      <tr>
                        <th>Permalink</th>
                        <th>Typ</th>
                        <th>Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((r) => (
                        <tr key={r.id.toString()} className={r.route_type === 'standard' ? 'current' : ''}>
                          <td>/{r.permalink}</td>
                          <td>{r.route_type === 'standard' ? 'Hlavní' : 'Přesměrování'}</td>
                          <td>{dateToString(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="col-md-4">
              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Nastavení stránky</h4>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <InlineEditor
                      label="Rozložení"
                      value={page.layout}
                      type="select"
                      options={PAGE_LAYOUTS}
                      saveValue={fieldAction('layout')}
                      editable={canUpdate}
                    />
                  </div>
                  <div className="card-row">
                    <InlineEditor
                      label="Jazyk"
                      value={page.language}
                      type="select"
                      options={LANGUAGES.map((language) => ({ value: language.code, label: language.label }))}
                      saveValue={fieldAction('language')}
                      editable={canUpdate}
                    />
                  </div>
                </div>
              </div>

              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">SEO</h4>
                </div>
                <div className="card-body">
                  {[
                    ['meta_title', 'Titulek'],
                    ['meta_keywords', 'Klíčová slova'],
                    ['meta_description', 'Popisek'],
                    ['og_title', 'OG Titulek'],
                    ['og_image', 'OG Obrázek'],
                    ['og_description', 'OG Popisek'],
                  ].map(([name, label]) => (
                    <div className="card-row" key={name}>
                      <InlineEditor
                        label={label}
                        value={(page[name as keyof typeof page] as string) ?? ''}
                        saveValue={fieldAction(name)}
                        editable={canUpdate}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {locales.length > 0 && (
                <div className="card strpied-tabled-with-hover">
                  <div className="card-header">
                    <h4 className="card-title">Jazykové verze</h4>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled">
                      {locales.map((l) => (
                        <li key={l.id.toString()}>
                          <Link href={`/admin/pages/${l.id}`}>
                            {LANGUAGES.find((x) => x.code === l.language)?.label ?? l.language}: {l.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
