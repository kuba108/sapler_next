import { notFound } from 'next/navigation';
import { requirePolicy } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/acl';
import { firstAttachmentBlobId } from '@/lib/media';
import { timeToString } from '@/lib/format';
import { Breadcrumbs, PageContent } from '@/components/admin/ui';
import InlineEditor from '@/components/admin/InlineEditor';
import { updateGalleryField } from '../actions';
import GalleryManager, { type Item } from './GalleryManager';

export const dynamic = 'force-dynamic';

export default async function GalleryShow({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePolicy('gallery', 'show');
  const gallery = await prisma.galleries.findUnique({ where: { id: BigInt(id) } });
  if (!gallery) notFound();

  const rawItems = await prisma.gallery_items.findMany({
    where: { gallery_id: gallery.id },
    orderBy: { position: 'asc' },
  });

  const items: Item[] = await Promise.all(
    rawItems.map(async (it) => {
      const blobId = await firstAttachmentBlobId('GalleryItem', it.id, 'image');
      return {
        id: it.id.toString(),
        label: it.label ?? '',
        description: it.description ?? '',
        labelI18n: (it.label_i18n as Record<string, string>) ?? {},
        descriptionI18n: (it.description_i18n as Record<string, string>) ?? {},
        imageBlobId: blobId ? blobId.toString() : null,
      };
    }),
  );

  const canUpdate = can(admin.acl, 'gallery', 'update');
  const fieldAction = (field: string) => updateGalleryField.bind(null, id, field);

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Galerie', href: '/admin/galleries' }, { label: gallery.name }]}
      />
      <PageContent>
        <div className="row">
          <div className="col-md-8">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Galerie</h4>
              </div>
              <div className="card-body">
                  <div className="card-row">
                    <InlineEditor label="Název" value={gallery.name} saveValue={fieldAction('name')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <InlineEditor label="Popis" value={gallery.description ?? ''} saveValue={fieldAction('description')} editable={canUpdate} />
                  </div>
                  <div className="card-row">
                    <div className="card-label">Vytvořena</div>
                    <div className="card-text">{timeToString(gallery.created_at)}</div>
                  </div>
                  <div className="card-row">
                    <div className="card-label">Upravena</div>
                    <div className="card-text">{timeToString(gallery.updated_at)}</div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        <GalleryManager galleryId={id} items={items} />
      </PageContent>
    </>
  );
}
