'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeRoute } from '../actions';

export default function RouteChanger({ routeId }: { routeId: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await changeRoute(routeId, value);
      setMsg(res.msg || '');
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Změnit odkaz na stránku
      </button>
      {open && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Změnit odkaz</h5>
                <button type="button" className="close" onClick={() => setOpen(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nový permalink</label>
                  <input
                    className="form-control"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                {msg && <p className="text-danger">{msg}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={() => setOpen(false)}>
                  Zrušit
                </button>
                <button type="button" className="btn btn-primary" onClick={submit} disabled={pending}>
                  Změnit odkaz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
