import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import { createReview } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewReview() {
  await requirePolicy('review', 'create');

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Recenze', href: '/admin/reviews' },
          { label: 'Nová recenze' },
        ]}
      />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                <Link href="/admin/reviews" className="btn btn-danger">
                  <i className="fa fa-times" /> Zrušit
                </Link>
              </div>
            </div>
          </div>
        </div>

        <form action={createReview} className="form-horizontal">
          <div className="row">
            <div className="col-md-8">
              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Nová recenze</h4>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="control-label">Titulek</label>
                    <input name="title" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Text</label>
                    <textarea name="text" className="form-control" rows={14} />
                  </div>
                  <button type="submit" className="btn btn-success btn-fill pull-right">
                    Vytvořit recenzi
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Nastavení recenze</h4>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="control-label">Obrázek</label>
                    <input type="file" name="image" className="form-control-file" accept="image/*" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Podpis</label>
                    <input name="signature" className="form-control" />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="control-label">Datum</label>
                        <input name="date" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="control-label">Skore</label>
                        <select name="score" className="custom-select" defaultValue="5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </PageContent>
    </>
  );
}
