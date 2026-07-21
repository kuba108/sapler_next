import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import NewPageForm from './NewPageForm';

export const dynamic = 'force-dynamic';

export default async function NewPage() {
  await requirePolicy('page', 'create');
  return (
    <>
      <Breadcrumbs items={[{ label: 'Stránky', href: '/admin/pages' }, { label: 'Nová stránka' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                <Link href="/admin/pages" className="btn btn-danger">
                  <i className="fa fa-times" /> Zrušit
                </Link>
              </div>
            </div>
          </div>
        </div>
        <NewPageForm />
      </PageContent>
    </>
  );
}
