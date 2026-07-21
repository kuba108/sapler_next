import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import SettingField from './SettingField';
import HomePageSelector from './HomePageSelector';

export const dynamic = 'force-dynamic';

const SEO = [
  { label: 'Titulek', name: 'title' },
  { label: 'Meta titulek', name: 'meta_title' },
  { label: 'Meta popis webu', name: 'meta_description' },
  { label: 'Meta klíčová slova', name: 'meta_keywords' },
];

const SHARING = [
  { label: 'OG titulek', name: 'og_title' },
  { label: 'OG popis webu', name: 'og_description' },
  { label: 'OG URL', name: 'og_url' },
  { label: 'OG obrázek', name: 'og_image' },
];

export default async function SettingsPage() {
  await requirePolicy('setting', 'index');

  const settings = await prisma.settings.findMany();
  const byName = new Map(settings.map((s) => [s.name, s.value]));

  const pages = await prisma.pages.findMany({ orderBy: { title: 'asc' } });
  const home = pages.find((p) => p.home_page);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Nastavení', href: '/admin/settings' }]} />
      <PageContent>
        <div className="row">
          <div className="col-md-6">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">SEO</h4>
              </div>
              <div className="card-body">
                {SEO.map((s) => (
                  <SettingField
                    key={s.name}
                    label={s.label}
                    name={s.name}
                    defaultValue={byName.get(s.name) ?? ''}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Úvodní stránka</h4>
              </div>
              <div className="card-body">
                <HomePageSelector
                  pages={pages.map((p) => ({ id: p.id.toString(), title: p.title }))}
                  currentHomeId={home?.id.toString() ?? null}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Sdílení webu</h4>
              </div>
              <div className="card-body">
                {SHARING.map((s) => (
                  <SettingField
                    key={s.name}
                    label={s.label}
                    name={s.name}
                    defaultValue={byName.get(s.name) ?? ''}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
