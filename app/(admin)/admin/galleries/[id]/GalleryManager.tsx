'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/lib/languages';
import { mediaUrl } from '@/lib/media-url';
import {
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  reorderGalleryItems,
} from '../actions';

export type Item = {
  id: string;
  label: string;
  description: string;
  labelI18n: Record<string, string>;
  descriptionI18n: Record<string, string>;
  imageBlobId: string | null;
};

function ItemModal({
  title,
  item,
  onClose,
  onSubmit,
}: {
  title: string;
  item?: Item;
  onClose: () => void;
  onSubmit: (fd: FormData) => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(fd: FormData) {
    startTransition(async () => {
      const res = await onSubmit(fd);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        alert('Uložení se nezdařilo.');
      }
    });
  }

  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,.5)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form action={submit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="col-md-6 mb-3">
                  <input name="label" defaultValue={item?.label} placeholder="Název" className="form-control" />
                </div>
                <div className="col-md-6 mb-3">
                  <input
                    name="description"
                    defaultValue={item?.description}
                    placeholder="Popis"
                    className="form-control"
                  />
                </div>
              </div>
              {LANGUAGES.map((lang) => (
                <div className="form-row" key={lang.code}>
                  <div className="col-md-6 mb-3">
                    <input
                      name={`label_i18n[${lang.code}]`}
                      defaultValue={item?.labelI18n?.[lang.code] ?? ''}
                      placeholder={`Název ${lang.label}`}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <input
                      name={`description_i18n[${lang.code}]`}
                      defaultValue={item?.descriptionI18n?.[lang.code] ?? ''}
                      placeholder={`Popis ${lang.label}`}
                      className="form-control"
                    />
                  </div>
                </div>
              ))}
              <div className="custom-file mb-2 mr-sm-2">
                <input type="file" name="image" className="form-control-file" accept="image/*" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={onClose}>
                Zrušit
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {item ? 'Upravit obrázek' : 'Nahrát obrázek'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function GalleryManager({
  galleryId,
  items: initialItems,
}: {
  galleryId: string;
  items: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const router = useRouter();

  const createAction = createGalleryItem.bind(null, galleryId);

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...items];
    const from = next.findIndex((i) => i.id === dragId);
    const to = next.findIndex((i) => i.id === targetId);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    reorderGalleryItems(galleryId, next.map((i) => i.id));
  }

  async function removeItem(id: string) {
    if (!confirm('Odstranit obrázek?')) return;
    const res = await deleteGalleryItem(id);
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  return (
    <>
      <div className="top-panel">
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                <span className="fa fa-plus" /> Přidat nový obrázek
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card strpied-tabled-with-hover">
        <div className="card-header">
          <h4 className="card-title">Obrázky</h4>
        </div>
        <div className="card-body gallery-list">
          {items.map((item) => (
            <div
              key={item.id}
              className="gallery-item"
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(item.id)}
            >
              {item.imageBlobId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(item.imageBlobId)} className="img-fluid" loading="lazy" alt="" />
              ) : (
                <div
                  className="img-fluid bg-light d-flex align-items-center justify-content-center"
                  style={{ width: 500, height: 300 }}
                >
                  <span className="text-muted">Bez obrázku</span>
                </div>
              )}
              <div className="shadow">
                <div className="top-bar d-flex">
                  <a className="drag-placeholder mr-auto" style={{ cursor: 'grab' }}>
                    <span className="fa fa-bars" />
                  </a>
                  <a className="remove-btn" style={{ cursor: 'pointer' }} onClick={() => removeItem(item.id)}>
                    <span className="fa fa-times" />
                  </a>
                </div>
                <button
                  type="button"
                  className="btn btn-warning btn-fill"
                  onClick={() => setEditing(item)}
                >
                  <span className="fa fa-pencil" /> Upravit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {creating && (
        <ItemModal title="Nový obrázek" onClose={() => setCreating(false)} onSubmit={createAction} />
      )}
      {editing && (
        <ItemModal
          title="Upravit obrázek"
          item={editing}
          onClose={() => setEditing(null)}
          onSubmit={updateGalleryItem.bind(null, editing.id)}
        />
      )}
    </>
  );
}
