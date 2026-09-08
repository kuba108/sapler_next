import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { timeToString } from '@/lib/format';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import InlineEditor from '@/components/admin/InlineEditor';
import DeleteButton from '@/components/admin/DeleteButton';
import { updateAssetField, deleteAsset } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AssetShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePolicy('asset', 'show');

  const asset = await prisma.assets.findUnique({ where: { id: BigInt(id) } });
  if (!asset) notFound();

  const canUpdate = can(admin.acl, 'asset', 'update');
  const fieldAction = (field: string) => updateAssetField.bind(null, id, field);
  const downloadPath = `/download/${asset.permalink}`;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Média', href: '/admin/media' }, { label: asset.name }]} />
      <PageContent>
        <div className="top-panel">
          <div className="row">
            <div className="col-md-12">
              <div className="float-left">
                <a href={downloadPath} target="_blank" rel="noreferrer" className="btn btn-primary">
                  <span className="fa fa-download" /> Stáhnout soubor
                </a>
              </div>
              <div className="float-right">
                {can(admin.acl, 'asset', 'destroy') && (
                  <DeleteButton
                    id={id}
                    label={`Soubor ${asset.name}`}
                    action={deleteAsset}
                    redirectTo="/admin/media"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Soubor</h4>
              </div>
              <div className="card-body">
                <div className="card-row">
                  <InlineEditor label="Název" value={asset.name} saveValue={fieldAction('name')} editable={canUpdate} />
                </div>
                <div className="card-row">
                  <div className="card-label">Odkaz</div>
                  <div className="card-text">{downloadPath}</div>
                </div>
                <div className="card-row">
                  <InlineEditor
                    label="Popis"
                    value={asset.description ?? ''}
                    saveValue={fieldAction('description')}
                    editable={canUpdate}
                  />
                </div>
                <div className="card-row">
                  <div className="card-label">Typ</div>
                  <div className="card-text">{asset.mime_type}</div>
                </div>
                <div className="card-row">
                  <div className="card-label">Vytvořena</div>
                  <div className="card-text">{timeToString(asset.created_at)}</div>
                </div>
                <div className="card-row">
                  <div className="card-label">Upravena</div>
                  <div className="card-text">{timeToString(asset.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
