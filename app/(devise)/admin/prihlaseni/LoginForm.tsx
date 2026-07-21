'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <>
      {state.error && (
        <div className="alert alert-primary" role="alert">
          {state.error}
        </div>
      )}

      <div className="content">
        <div className="container">
          <div className="col-md-4 col-sm-6 ml-auto mr-auto">
            <div className="head-bar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/devise/ruby-logo-64-64.png" alt="RubyQ" />
              <h1>
                Ruby<em>Q</em> | admin
              </h1>
            </div>

            <form action={formAction} className="form">
              <div className="card card-login">
                <div className="card-header">
                  <h3 className="header text-center">Přihlášení</h3>
                </div>
                <div className="card-body">
                  <div className="card-body">
                    <div className="form-group">
                      <label htmlFor="email">E-mailová adresa</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control"
                        autoFocus
                        autoComplete="email"
                        placeholder="Napište e-mail"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Heslo</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        className="form-control"
                        autoComplete="off"
                        placeholder="Heslo"
                      />
                    </div>
                  </div>
                </div>
                <div className="card-footer ml-auto mr-auto">
                  <button
                    type="submit"
                    className="login-btn btn btn-danger btn-wd btn-fill"
                    disabled={pending}
                  >
                    Přihlásit se
                  </button>
                </div>
              </div>
            </form>

            <div className="container-footer">
              <div className="float-left">
                <a href="/">Zpět na web</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
