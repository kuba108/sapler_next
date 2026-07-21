'use client';

import { useState, useTransition } from 'react';
import { setHomePage } from './actions';

export default function HomePageSelector({
  pages,
  currentHomeId,
}: {
  pages: { id: string; title: string }[];
  currentHomeId: string | null;
}) {
  const [pageId, setPageId] = useState(currentHomeId ?? pages[0]?.id ?? '');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await setHomePage(pageId);
      setMsg(res.msg);
      setTimeout(() => setMsg(''), 2500);
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="form-group mb-2">
        <select
          className="select-picker form-control"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary mb-2" disabled={pending}>
        Nastavit stránku
      </button>
      {msg && <span className="ml-2">{msg}</span>}
    </form>
  );
}
