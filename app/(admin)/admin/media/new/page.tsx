import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import { createAsset } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewAsset() {
  await requirePolicy('asset', 'create');
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Média', href: '/admin/media' }, { label: 'Nový soubor' }]}
      />
      <PageContent>
        <div className="col-md-12">
          <div className="card strpied-tabled-with-hover">
            <div className="card-header">
              <h4 className="card-title">Nový soubor</h4>
            </div>
            <div className="card-body">
              <form action={createAsset} className="form-horizontal" encType="multipart/form-data">
                <div className="form-group">
                  <label className="control-label">Název</label>
                  <input name="name" required className="form-control" />
                </div>
                <div className="form-group">
                  <label className="control-label">Popis</label>
                  <input name="description" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="control-label">Vyberte soubor</label>
                  <input type="file" name="file" required className="form-control-file" />
                </div>
                <button type="submit" className="btn btn-success btn-fill pull-right">
                  Vytvořit soubor
                </button>
              </form>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
