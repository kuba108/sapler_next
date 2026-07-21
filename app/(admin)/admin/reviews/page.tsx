import Link from 'next/link';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { dateToString } from '@/lib/format';
import { Breadcrumbs, PageContent, Card } from '@/components/admin/ui';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteReview } from './actions';

export const dynamic = 'force-dynamic';

export default async function ReviewsIndex() {
  const user = await requirePolicy('review', 'index');
  const reviews = await prisma.reviews.findMany({ orderBy: { created_at: 'desc' } });

  return (
    <>
      <Breadcrumbs items={[{ label: 'Recenze', href: '/admin/reviews' }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                {can(user.acl, 'review', 'create') && (
                  <Link href="/admin/reviews/new" className="btn btn-primary">
                    <i className="fa fa-plus" /> Nová recenze
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <Card title="Recenze">
              <table className="table table-hover table-striped">
                <thead>
                  <tr>
                    <th>Titulek</th>
                    <th>Datum</th>
                    <th>Vytvořena</th>
                    <th>Změněna</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id.toString()}>
                      <td>
                        {can(user.acl, 'review', 'show') ? (
                          <Link href={`/admin/reviews/${r.id}`}>{r.title}</Link>
                        ) : (
                          r.title
                        )}
                      </td>
                      <td>{dateToString(r.date)}</td>
                      <td>{dateToString(r.created_at)}</td>
                      <td>{dateToString(r.updated_at)}</td>
                      <td className="row-actions">
                        {can(user.acl, 'review', 'destroy') && (
                          <DeleteButton
                            id={r.id.toString()}
                            label={`Recenzi ${r.title}`}
                            action={deleteReview}
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
