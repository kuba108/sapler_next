'use client';

import { useState, useTransition } from 'react';
import { changePassword } from '../actions';

export default function PasswordChanger({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, startTransition] = useTransition();
  const action = changePassword.bind(null, userId);

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await action(formData);
      setMsg(res.msg || '');
      if (res.ok) setTimeout(() => setOpen(false), 1200);
    });
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Změnit heslo
      </button>
      {open && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Změnit heslo</h5>
                <button type="button" className="close" onClick={() => setOpen(false)}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <form action={submit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Nové heslo</label>
                    <input name="password" type="password" className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Heslo znovu</label>
                    <input name="password_confirmation" type="password" className="form-control" />
                  </div>
                  {msg && <p>{msg}</p>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-danger" onClick={() => setOpen(false)}>
                    Zrušit
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={pending}>
                    Uložit heslo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
