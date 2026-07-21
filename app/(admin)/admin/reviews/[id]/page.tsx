import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { firstAttachmentBlobId, mediaUrl } from '@/lib/media';
import { timeToString } from '@/lib/format';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import InlineEditor from '@/components/admin/InlineEditor';
import { updateReview, updateReviewField } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ReviewShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePolicy('review', 'show');

  const review = await prisma.reviews.findUnique({ where: { id: BigInt(id) } });
  if (!review) notFound();

  const blobId = await firstAttachmentBlobId('Review', review.id, 'image');
  const update = updateReview.bind(null, id);
  const canUpdate = can(admin.acl, 'review', 'update');
  const fieldAction = (field: string) => updateReviewField.bind(null, id, field);

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Recenze', href: '/admin/reviews' }, { label: review.title }]}
      />
      <PageContent>
        <form action={update}>
          <div className="row">
            <div className="col-md-8">
              <div className="card striped-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Recenze</h4>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <InlineEditor label="Titulek" value={review.title} saveValue={fieldAction('title')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <div className="card-label">Vytvořena</div>
                    <div className="card-text">{timeToString(review.created_at)}</div>
                  </div>
                  <div className="card-row">
                    <div className="card-label">Upravena</div>
                    <div className="card-text">{timeToString(review.updated_at)}</div>
                  </div>
                </div>
              </div>

              <div className="card striped-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Text recenze</h4>
                </div>
                <div className="card-body">
                  <InlineEditor
                    label="Upravte text recenze"
                    value={review.text ?? ''}
                    type="textarea"
                    saveValue={fieldAction('text')}
                    editable={canUpdate}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card strpied-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Nastavení recenze</h4>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <InlineEditor label="Podpis" value={review.signature ?? ''} saveValue={fieldAction('signature')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <InlineEditor label="Datum" value={review.date ?? ''} saveValue={fieldAction('date')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <InlineEditor
                      label="Skore"
                      value={String(review.score)}
                      type="select"
                      options={[1, 2, 3, 4, 5].map((score) => ({ value: String(score), label: String(score) }))}
                      saveValue={fieldAction('score')}
                      editable={canUpdate}
                    />
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_approved"
                      name="is_approved"
                      value="true"
                      defaultChecked={review.is_approved}
                    />
                    <label className="form-check-label" htmlFor="is_approved">
                      Schválená
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_important"
                      name="is_important"
                      value="true"
                      defaultChecked={review.is_important}
                    />
                    <label className="form-check-label" htmlFor="is_important">
                      Důležitá
                    </label>
                  </div>
                </div>
              </div>

              <div className="card striped-tabled-with-hover">
                <div className="card-header">
                  <h4 className="card-title">Obrázek</h4>
                </div>
                <div className="card-body">
                  {blobId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(blobId)} alt="" className="img-fluid" />
                  )}
                  <div className="form-group mt-2">
                    <input type="file" name="image" className="form-control-file" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <button type="submit" className="btn btn-success btn-fill">
                Uložit recenzi
              </button>
            </div>
          </div>
        </form>
      </PageContent>
    </>
  );
}
