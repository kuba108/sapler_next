'use client';

import { useState } from 'react';
import { ACL_SCHEMA } from '@/lib/acl-schema';

type AclState = Record<string, Record<string, boolean>>;

export default function AclEditor({
  userId,
  initial,
  action,
}: {
  userId: string;
  initial: AclState;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  const [state, setState] = useState<AclState>(initial);
  const boundAction = action.bind(null, userId);

  function toggle(model: string, key: string, value: boolean) {
    setState((prev) => ({ ...prev, [model]: { ...prev[model], [key]: value } }));
  }

  function toggleAll(model: string, value: boolean) {
    setState((prev) => {
      const group = ACL_SCHEMA.find((g) => g.model === model)!;
      const next: Record<string, boolean> = {};
      for (const a of group.actions) next[a.key] = value;
      return { ...prev, [model]: next };
    });
  }

  return (
    <form action={boundAction} className="form-inline">
      {ACL_SCHEMA.map((group) => {
        const allChecked = group.actions.every((a) => state[group.model]?.[a.key]);
        return (
          <div className="acl-group" key={group.model}>
            <h5>
              <label>
                <input
                  type="checkbox"
                  className="check-all"
                  checked={allChecked}
                  onChange={(e) => toggleAll(group.model, e.target.checked)}
                />{' '}
                <strong>{group.label}</strong>
              </label>
            </h5>
            {group.actions.map((a) => {
              const checked = !!state[group.model]?.[a.key];
              return (
                <div className="checkbox" key={a.key}>
                  <label>
                    {/* Hidden field ensures unchecked boxes submit '0' */}
                    <input type="hidden" name={`acl[${group.model}][${a.key}]`} value={checked ? '1' : '0'} />
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggle(group.model, a.key, e.target.checked)}
                    />{' '}
                    {a.label}
                  </label>
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="form-group clearfix" style={{ width: '100%' }}>
        <div className="pull-right">
          <button type="submit" className="btn btn-success btn-fill">
            Uložit nastavení práv
          </button>
        </div>
      </div>
    </form>
  );
}
