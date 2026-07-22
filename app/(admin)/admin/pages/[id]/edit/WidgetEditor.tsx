'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { WIDGET_LABELS } from '@/lib/widgets';
import { mediaUrl } from '@/lib/media-url';
import { updateWidgetJson, uploadWidgetImage } from '../../actions';

// Quill touches the DOM/window, so load it client-side only.
const QuillEditor = dynamic(() => import('@/components/admin/QuillEditor'), {
  ssr: false,
  loading: () => <div className="text-muted">Načítám editor…</div>,
});

export type WidgetData = {
  wrapperWidgetId: string;
  widgetId: string;
  name: string;
  json: Record<string, unknown>;
  imageBlobId: string | null;
};

type GalleryOption = { id: string; name: string };

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function WidgetEditor({
  widget,
  galleries,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
}: {
  widget: WidgetData;
  galleries: GalleryOption[];
  onDelete: (wrapperWidgetId: string) => void;
  onDragStart: (height: number) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  isDragging: boolean;
}) {
  const [json, setJson] = useState<Record<string, unknown>>(widget.json);
  const [saved, setSaved] = useState<null | boolean>(null);
  const [open, setOpen] = useState(false);
  const [edited, setEdited] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const jsonRef = useRef(json);

  function set(key: string, value: unknown) {
    setJson((prev) => {
      const next = { ...prev, [key]: value };
      jsonRef.current = next;
      return next;
    });
    setEdited(true);
  }

  const save = useCallback(() => {
    startTransition(async () => {
      const res = await updateWidgetJson(widget.widgetId, jsonRef.current);
      setSaved(res.ok);
      if (res.ok) setEdited(false);
      setTimeout(() => setSaved(null), 1500);
    });
  }, [widget.widgetId]);

  useEffect(() => {
    window.addEventListener('page-composer:save-all-widgets', save);
    return () => window.removeEventListener('page-composer:save-all-widgets', save);
  }, [save]);

  function str(key: string): string {
    return (json[key] as string) ?? '';
  }

  function uploadImage(formData: FormData) {
    startTransition(async () => {
      await uploadWidgetImage(widget.widgetId, formData);
      router.refresh();
    });
  }

  return (
    <div
      className={`widget widget-editor${open ? ' open' : ''}${edited ? ' edited' : ''}${isDragging ? ' widget-dragging' : ''}`}
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setDragImage(event.currentTarget, 24, 20);
        onDragStart(event.currentTarget.getBoundingClientRect().height);
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div
        className="widget-header"
        draggable
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest('.header-btn')) setOpen((value) => !value);
        }}
      >
        <h4>{WIDGET_LABELS[widget.name] ?? widget.name}</h4>
        <div className="pull-right">
          <button className="widget-save-btn header-btn" onClick={save} disabled={pending} title="Uložit widget">
            <span className={`fa ${saved === true ? 'fa-check' : 'fa-save'}`} />
          </button>
          <button
            className="remove-widget-btn header-btn"
            onClick={() => onDelete(widget.wrapperWidgetId)}
            title="Odstranit widget"
          >
            <span className="fa fa-times-circle" />
          </button>
        </div>
      </div>
      <div className="widget-body">
        {widget.name === 'headline' && (
          <>
            <Field label="Text nadpisu">
              <input className="form-control" value={str('label')} onChange={(e) => set('label', e.target.value)} />
            </Field>
            <Field label="Velikost">
              <select className="form-control" value={str('size')} onChange={(e) => set('size', e.target.value)}>
                {['h1', 'h2', 'h3', 'h4', 'h5'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Zarovnání">
              <select className="form-control" value={str('align')} onChange={(e) => set('align', e.target.value)}>
                {['left', 'center', 'right'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Styl (with_icon pro ikonu)">
              <input className="form-control" value={str('style')} onChange={(e) => set('style', e.target.value)} />
            </Field>
            <Field label="Ikona (CSS třída)">
              <input className="form-control" value={str('icon')} onChange={(e) => set('icon', e.target.value)} />
            </Field>
          </>
        )}

        {widget.name === 'text' && (
          <>
            <Field label="Text">
              <textarea className="form-control" rows={4} value={str('text')} onChange={(e) => set('text', e.target.value)} />
            </Field>
            <Field label="Zarovnání">
              <select className="form-control" value={str('align')} onChange={(e) => set('align', e.target.value)}>
                {['left', 'center', 'right'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </>
        )}

        {widget.name === 'wysiwyg' && (
          <Field label="Obsah">
            <QuillEditor value={str('html')} onChange={(html) => set('html', html)} />
          </Field>
        )}

        {widget.name === 'divide' && (
          <Field label="Velikost mezery (px)">
            <input className="form-control" value={str('size')} onChange={(e) => set('size', e.target.value)} />
          </Field>
        )}

        {widget.name === 'image' && (
          <>
            {widget.imageBlobId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(widget.imageBlobId)} alt="" className="img-fluid mb-2" style={{ maxHeight: 160 }} />
            )}
            <Field label="Alt text">
              <input className="form-control" value={str('alt')} onChange={(e) => set('alt', e.target.value)} />
            </Field>
            <form action={uploadImage}>
              <input type="file" name="image" accept="image/*" className="form-control-file" />
              <button type="submit" className="btn btn-xs btn-primary mt-1" disabled={pending}>
                Nahrát obrázek
              </button>
            </form>
          </>
        )}

        {(widget.name === 'gallery' || widget.name === 'owl_portfolio') && (
          <>
            <Field label="Galerie">
              <select className="form-control" value={str('gallery_id')} onChange={(e) => set('gallery_id', e.target.value)}>
                <option value="">— vyberte —</option>
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>
            {widget.name === 'gallery' && (
              <Field label="Počet sloupců">
                <input className="form-control" value={str('columns')} onChange={(e) => set('columns', e.target.value)} />
              </Field>
            )}
          </>
        )}

        {widget.name === 'map' && (
          <>
            <Field label="Adresa">
              <input className="form-control" value={str('address')} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="Zoom">
              <input className="form-control" value={str('zoom')} onChange={(e) => set('zoom', e.target.value)} />
            </Field>
            <Field label="Typ mapy">
              <select className="form-control" value={str('maptype')} onChange={(e) => set('maptype', e.target.value)}>
                <option value="roadmap">Mapa</option>
                <option value="satellite">Satelit</option>
              </select>
            </Field>
          </>
        )}

        {widget.name === 'yt_video' && (
          <>
            <Field label="URL videa (embed)">
              <input className="form-control" value={str('url')} onChange={(e) => set('url', e.target.value)} />
            </Field>
            <Field label="Šířka">
              <input className="form-control" value={str('width')} onChange={(e) => set('width', e.target.value)} />
            </Field>
            <Field label="Výška">
              <input className="form-control" value={str('height')} onChange={(e) => set('height', e.target.value)} />
            </Field>
          </>
        )}

        {widget.name === 'icon_bucket' && (
          <>
            <Field label="Nadpis">
              <input className="form-control" value={str('headline')} onChange={(e) => set('headline', e.target.value)} />
            </Field>
            <Field label="Text">
              <textarea className="form-control" value={str('text')} onChange={(e) => set('text', e.target.value)} />
            </Field>
            <Field label="Ikona (název SVG, např. 0101)">
              <input className="form-control" value={str('icon')} onChange={(e) => set('icon', e.target.value)} />
            </Field>
            <Field label="Odkaz">
              <input className="form-control" value={str('link')} onChange={(e) => set('link', e.target.value)} />
            </Field>
          </>
        )}

        {widget.name === 'contact_form' && (
          <>
            <Field label="Cílový e-mail">
              <input className="form-control" value={str('target_email')} onChange={(e) => set('target_email', e.target.value)} />
            </Field>
            <Field label="Zpráva po odeslání">
              <input className="form-control" value={str('success_message')} onChange={(e) => set('success_message', e.target.value)} />
            </Field>
            <Field label="Popisek pole jméno">
              <input className="form-control" value={str('label_name')} onChange={(e) => set('label_name', e.target.value)} />
            </Field>
            <Field label="Popisek pole e-mail">
              <input className="form-control" value={str('label_email')} onChange={(e) => set('label_email', e.target.value)} />
            </Field>
            <Field label="Popisek pole text">
              <input className="form-control" value={str('label_text')} onChange={(e) => set('label_text', e.target.value)} />
            </Field>
          </>
        )}

        {(widget.name === 'steps' || widget.name === 'testimonials') && (
          <Field label="Data (JSON)">
            <textarea
              className="form-control"
              rows={8}
              defaultValue={JSON.stringify(
                widget.name === 'steps' ? json.steps ?? [] : json.testimonials ?? [],
                null,
                2,
              )}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (widget.name === 'steps') set('steps', parsed);
                  else set('testimonials', parsed);
                } catch {
                  /* ignore invalid JSON until valid */
                }
              }}
            />
          </Field>
        )}
      </div>
      <div className="widget-footer" />
    </div>
  );
}
