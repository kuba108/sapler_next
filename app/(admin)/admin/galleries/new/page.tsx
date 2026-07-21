import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import { createGallery } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewGallery() {
  await requirePolicy('gallery', 'create');
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Galerie', href: '/admin/galleries' }, { label: 'Nová galerie' }]}
      />
      <PageContent>
        <div className="col-md-12">
          <div className="card strpied-tabled-with-hover">
            <div className="card-header">
              <h4 className="card-title">Nová galerie</h4>
            </div>
            <div className="card-body">
              <form action={createGallery} className="form-horizontal">
                <div className="form-group">
                  <label className="control-label">Název</label>
                  <input name="name" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="control-label">Popis</label>
                  <input name="description" className="form-control" />
                </div>
                <button type="submit" className="btn btn-success btn-fill pull-right">
                  Vytvořit galerii
                </button>
              </form>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
