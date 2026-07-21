'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Option = { value: string; label: string };
type SaveResult = { ok?: boolean; msg?: string } | void;

export default function InlineEditor({
  label,
  value,
  saveValue,
  type = 'text',
  options = [],
  editable = true,
}: {
  label: string;
  value: string;
  saveValue: (value: string) => Promise<SaveResult>;
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select';
  options?: Option[];
  editable?: boolean;
}) {
  const [current, setCurrent] = useState(value);
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const shown = type === 'select'
    ? options.find((option) => option.value === current)?.label ?? current
    : current;

  function edit() {
    setDraft(current);
    setError('');
    setEditing(true);
  }

  function cancel() {
    setDraft(current);
    setError('');
    setEditing(false);
  }

  function save() {
    startTransition(async () => {
      try {
        const result = await saveValue(draft);
        if (result && result.ok === false) {
          setError(result.msg || 'Uložení se nezdařilo.');
          return;
        }
        setCurrent(draft);
        setEditing(false);
        setError('');
        router.refresh();
      } catch {
        setError('Uložení se nezdařilo.');
      }
    });
  }

  const controls = (
    <div className="input-group-append inline-editor-actions">
      <button type="button" className="btn-cancel btn btn-danger" onClick={cancel} disabled={pending} aria-label="Zrušit">
        <span className="fa fa-times" />
      </button>
      <button type="button" className="btn-submit btn btn-success" onClick={save} disabled={pending} aria-label="Uložit">
        <span className={`fa ${pending ? 'fa-spinner fa-spin' : 'fa-check'}`} />
      </button>
    </div>
  );

  return (
    <div className={`inline-editor${type === 'textarea' ? ' inline-textarea-editor' : ''}${editing ? ' edited' : ''}`}>
      <div className="editor-label"><span>{label}</span></div>
      <div className="inline-editor-show">
        <span className="editor-text">{shown || '\u00a0'}</span>
        {editable && (
          <button type="button" className="btn-edit btn btn-sm btn-warning" onClick={edit} aria-label={`Upravit: ${label}`}>
            <span className="fa fa-pencil" />
          </button>
        )}
      </div>
      <div className="inline-editor-edit">
        {type === 'textarea' && <div className="edit-toolbar">{controls}</div>}
        <div className="form-group">
          <div className="input-group">
            {type === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className="form-control"
                rows={10}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            ) : type === 'select' ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                className="form-control custom-select"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              >
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                className="form-control"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') save();
                  if (event.key === 'Escape') cancel();
                }}
              />
            )}
            {type !== 'textarea' && controls}
          </div>
        </div>
        {error && <small className="text-danger">{error}</small>}
      </div>
    </div>
  );
}
