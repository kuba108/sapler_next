'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Delete control mirroring the admin delete-modal flow. Shows a confirmation
 * modal, then calls a server action. `action` receives the record id.
 */
export default function DeleteButton({
  id,
  label,
  action,
  redirectTo,
}: {
  id: string;
  label: string;
  action: (id: string) => Promise<{ ok: boolean; msg?: string }>;
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      const res = await action(id);
      setOpen(false);
      if (res.ok) {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        alert(res.msg || 'Smazání se nezdařilo.');
      }
    });
  }

  return (
    <>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        rel="tooltip"
        title="Smazat"
        className="btn btn-danger btn-link btn-xs"
      >
        <i className="fa fa-times" />
      </a>

      {open && (
        <div
          className="modal fade show"
          style={{ display: 'block', background: 'rgba(0,0,0,.5)' }}
          role="dialog"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Určitě odstranit?</h4>
                <button type="button" className="close" onClick={() => setOpen(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">Chcete odstranit {label}?</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default float-left"
                  onClick={() => setOpen(false)}
                >
                  Zavřít
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-fill"
                  onClick={confirmDelete}
                  disabled={pending}
                >
                  Odstranit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
