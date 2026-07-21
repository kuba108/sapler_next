import { requirePolicy } from '@/lib/admin-auth';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import { createAdminUser } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewAdminUser() {
  await requirePolicy('admin_user', 'create');
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Uživatelé', href: '/admin/admin_users' },
          { label: 'Nový uživatel' },
        ]}
      />
      <PageContent>
        <div className="row">
          <div className="col-md-8">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Nový uživatel</h4>
              </div>
              <div className="card-body">
                <form action={createAdminUser} className="form-horizontal">
                  <div className="form-group">
                    <label className="control-label">Jméno</label>
                    <input name="first_name" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Přijmení</label>
                    <input name="last_name" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">E-mail</label>
                    <input name="email" type="email" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Heslo</label>
                    <input name="password" type="password" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Heslo znovu</label>
                    <input name="password_confirmation" type="password" className="form-control" />
                  </div>
                  <button type="submit" className="btn btn-success btn-fill pull-right">
                    Vytvořit uživatele
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
