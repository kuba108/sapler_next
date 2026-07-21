'use client';

import { useActionState, useState } from 'react';
import { PAGE_LAYOUTS, PAGE_STATES, parameterize } from '@/lib/page-constants';
import { LANGUAGES } from '@/lib/languages';
import { createPage, type CreatePageState } from '../actions';

const initial: CreatePageState = {};

export default function NewPageForm() {
  const [state, formAction] = useActionState(createPage, initial);
  const [title, setTitle] = useState('');
  const [permalink, setPermalink] = useState('');
  const [locked, setLocked] = useState(true);

  return (
    <>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      <form action={formAction} className="form-horizontal">
        <div className="row">
          <div className="col-md-8">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Nová stránka</h4>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="control-label">Titulek</label>
                  <input
                    name="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="control-label">Permalink</label>
                  <div className="input-group">
                    <input
                      name="permalink"
                      className="form-control"
                      value={permalink}
                      disabled={locked}
                      onChange={(e) => setPermalink(e.target.value)}
                    />
                    <div className="input-group-append">
                      <button
                        type="button"
                        className="btn btn-default"
                        onClick={() => setPermalink(parameterize(title))}
                      >
                        Kopírovat
                      </button>
                      <button type="button" className="btn btn-default" onClick={() => setLocked(false)}>
                        Změnit
                      </button>
                      <button type="button" className="btn btn-default" onClick={() => setLocked(true)}>
                        Zamknout
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-success btn-fill pull-right">
                  Vytvořit stránku
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Nastavení stránky</h4>
              </div>
              <div className="card-body">
                <table className="table">
                  <tbody>
                    <tr>
                      <td>Rozložení</td>
                      <td>
                        <select name="layout" className="custom-select">
                          {PAGE_LAYOUTS.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Jazyk</td>
                      <td>
                        <select name="language" className="custom-select">
                          {LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Stav</td>
                      <td>
                        <select name="state" className="custom-select">
                          {PAGE_STATES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
