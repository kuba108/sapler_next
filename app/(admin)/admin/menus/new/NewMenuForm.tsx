'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { MENU_NAMES, MENU_LAYOUTS } from '@/lib/menu-constants';
import { LANGUAGES } from '@/lib/languages';
import { createMenu, type CreateMenuState } from '../actions';

const initial: CreateMenuState = {};

export default function NewMenuForm() {
  const [state, formAction] = useActionState(createMenu, initial);

  return (
    <>
      {state.error && (
        <div className="alert alert-danger">{state.error}</div>
      )}
      <div className="top-panel">
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <Link href="/admin/menus" className="btn btn-danger">
                <i className="fa fa-times" /> Zrušit
              </Link>
            </div>
          </div>
        </div>
      </div>

      <form action={formAction} className="form-horizontal">
        <div className="row">
          <div className="col-md-8">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Nové menu</h4>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="control-label">Název</label>
                  <select name="name" className="custom-select">
                    {Object.entries(MENU_NAMES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-success btn-fill pull-right">
                  Vytvořit menu
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card strpied-tabled-with-hover">
              <div className="card-header">
                <h4 className="card-title">Nastavení menu</h4>
              </div>
              <div className="card-body">
                <table className="table">
                  <tbody>
                    <tr>
                      <td>Rozložení</td>
                      <td>
                        <select name="layout" className="custom-select">
                          {Object.entries(MENU_LAYOUTS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
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
