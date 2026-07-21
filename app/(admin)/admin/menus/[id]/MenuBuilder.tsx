'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  saveMenuOrder,
} from '../actions';

export type MenuItemNode = {
  id: string;
  label: string;
  url: string;
  kind: string;
  newWindow: boolean;
  pageId: string | null;
  children: MenuItemNode[];
};

type PageOption = { id: string; title: string };

function ItemModal({
  title,
  item,
  pages,
  onClose,
  onSubmit,
}: {
  title: string;
  item?: MenuItemNode;
  pages: PageOption[];
  onClose: () => void;
  onSubmit: (fd: FormData) => Promise<{ ok: boolean }>;
}) {
  const [kind, setKind] = useState(item?.kind ?? 'page');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(fd: FormData) {
    fd.set('kind', kind);
    startTransition(async () => {
      const res = await onSubmit(fd);
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        alert('Uložení se nezdařilo.');
      }
    });
  }

  return (
    <div className="menu-editor-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="menu-editor-modal-backdrop" type="button" onClick={onClose} aria-label="Zavřít" />
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form action={submit}>
            <div className="modal-body">
              {!item && (
                <ul className="nav nav-tabs" role="tablist">
                  {[
                    ['page', 'Odkaz na stránku'],
                    ['custom', 'Vlastní odkaz'],
                    ['group', 'Skupina odkazů'],
                  ].map(([k, lbl]) => (
                    <li className="nav-item" key={k}>
                      <button
                        type="button"
                        className={`nav-link${kind === k ? ' active' : ''}`}
                        onClick={() => setKind(k)}
                      >
                        {lbl}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="tab-content pt-3">
                {kind === 'page' && (
                  <div className="form-group row">
                    <label className="col-sm-4 control-label" htmlFor="menu-item-page">Zvolte stránku</label>
                    <div className="col-sm-8">
                      <select id="menu-item-page" name="page_id" className="form-control" defaultValue={item?.pageId ?? pages[0]?.id ?? ''}>
                        {pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {kind === 'custom' && (
                  <div className="form-group row">
                    <label className="col-sm-4 control-label" htmlFor="menu-item-url">URL</label>
                    <div className="col-sm-8">
                      <input id="menu-item-url" name="url" className="form-control" defaultValue={item?.url ?? ''} />
                    </div>
                  </div>
                )}
                <div className="form-group row">
                  <label className="col-sm-4 control-label" htmlFor="menu-item-label">Popisek</label>
                  <div className="col-sm-8">
                    <input id="menu-item-label" name="label" className="form-control" defaultValue={item?.label ?? ''} />
                  </div>
                </div>
                {kind === 'custom' && (
                  <div className="form-group row">
                    <label className="col-sm-4 control-label" htmlFor="new_window">Otevřít v novém okně</label>
                    <div className="col-sm-8 d-flex align-items-center">
                      <input
                        type="checkbox"
                        id="new_window"
                        name="new_window"
                        value="true"
                        defaultChecked={item?.newWindow}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={onClose}>
                Zrušit
              </button>
              <button type="submit" className="btn btn-success" disabled={pending}>
                {item ? 'Uložit změny' : 'Přidat odkaz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MenuBuilder({
  menuId,
  items: initial,
  pages,
}: {
  menuId: string;
  items: MenuItemNode[];
  pages: PageOption[];
}) {
  const [items, setItems] = useState(initial);
  const [editMode, setEditMode] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MenuItemNode | null>(null);
  const [saving, startSaving] = useTransition();
  const router = useRouter();

  const createAction = createMenuItem.bind(null, menuId);

  // Flatten helpers for reorder / nesting operations on a 2-level tree.
  function moveTop(index: number, dir: -1 | 1) {
    const next = items.map((item) => ({ ...item, children: [...item.children] }));
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  function indent(index: number) {
    if (index === 0) return;
    const next = items.map((item) => ({ ...item, children: [...item.children] }));
    const [node] = next.splice(index, 1);
    const parent = next[index - 1];
    parent.children = [...parent.children, { ...node, children: [] }, ...node.children];
    node.children = [];
    setItems(next);
  }

  function outdentChild(parentIndex: number, childIndex: number) {
    const next = items.map((item) => ({ ...item, children: [...item.children] }));
    const parent = next[parentIndex];
    const [child] = parent.children.splice(childIndex, 1);
    next.splice(parentIndex + 1, 0, { ...child, children: [] });
    setItems(next);
  }

  function moveChild(parentIndex: number, childIndex: number, dir: -1 | 1) {
    const next = items.map((item) => ({ ...item, children: [...item.children] }));
    const children = next[parentIndex].children;
    const target = childIndex + dir;
    if (target < 0 || target >= children.length) return;
    [children[childIndex], children[target]] = [children[target], children[childIndex]];
    setItems(next);
  }

  function save() {
    startSaving(async () => {
      await saveMenuOrder(
        menuId,
        items.map((it) => ({ id: it.id, children: it.children.map((c) => c.id) })),
      );
      setEditMode(false);
      router.refresh();
    });
  }

  async function remove(id: string) {
    if (!confirm('Odstranit položku menu?')) return;
    const res = await deleteMenuItem(id);
    if (res.ok) router.refresh();
  }

  return (
    <div className="menu-builder">
      <div className="top-panel">
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <button
                className={`btn btn-warning${editMode ? ' active' : ''}`}
                onClick={() => setEditMode((v) => !v)}
              >
                <span className="fa fa-pencil" /> Upravit pořadí
              </button>{' '}
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <span className="fa fa-plus" /> Přidat odkaz
              </button>
            </div>
            <div className="float-right">
              <button className="btn btn-success" onClick={save} disabled={saving || !editMode}>
                <span className="fa fa-check" /> Uložit změny
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card strpied-tabled-with-hover">
            <div className="card-header">
              <h4 className="card-title">Menu</h4>
            </div>
            <div className="card-body">
              <div className="items-panel">
                {items.length === 0 ? (
                  <p>
                    <em>Menu nemá žádné položky</em>
                  </p>
                ) : (
                <ul id="menu-items" className={editMode ? 'edit' : undefined}>
                  {items.map((item, i) => (
                    <li key={item.id} className="menu-item">
                      <span className="fa fa-bars draggable" /> {item.label}
                      {item.url && <>&nbsp;<em>({item.url})</em></>}
                      &nbsp;|&nbsp;{kindLabel(item.kind)}
                      <div className="menu-item-actions">
                          {editMode ? (
                            <>
                              <button className="btn-simple btn-link" onClick={() => moveTop(i, -1)} title="Posunout nahoru">↑</button>
                              <button className="btn-simple btn-link" onClick={() => moveTop(i, 1)} title="Posunout dolů">↓</button>
                              <button className="btn-simple btn-link" onClick={() => indent(i)} title="Vnořit">→</button>
                            </>
                          ) : (
                            <>
                              <button className="change-menu-item-btn btn-simple btn-link" onClick={() => setEditing(item)} title="Upravit položku">
                                <span className="fa fa-edit" />
                              </button>
                              <button className="remove-link-btn btn-simple btn-link" onClick={() => remove(item.id)} title="Odstranit položku">
                                <span className="fa fa-close" />
                              </button>
                            </>
                          )}
                      </div>
                      {item.children.length > 0 && (
                        <ul className="sub-menu">
                          {item.children.map((child, j) => (
                            <li key={child.id} className="menu-item">
                              <span className="fa fa-bars draggable" /> {child.label}
                              {child.url && <>&nbsp;<em>({child.url})</em></>}
                              &nbsp;|&nbsp;{kindLabel(child.kind)}
                              <div className="menu-item-actions">
                                  {editMode ? (
                                    <>
                                      <button className="btn-simple btn-link" onClick={() => moveChild(i, j, -1)}>↑</button>
                                      <button className="btn-simple btn-link" onClick={() => moveChild(i, j, 1)}>↓</button>
                                      <button className="btn-simple btn-link" onClick={() => outdentChild(i, j)}>←</button>
                                    </>
                                  ) : (
                                    <>
                                      <button className="change-menu-item-btn btn-simple btn-link" onClick={() => setEditing(child)} title="Upravit položku">
                                        <span className="fa fa-edit" />
                                      </button>
                                      <button className="remove-link-btn btn-simple btn-link" onClick={() => remove(child.id)} title="Odstranit položku">
                                        <span className="fa fa-close" />
                                      </button>
                                    </>
                                  )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <ItemModal
          title="Přidat odkaz do menu"
          pages={pages}
          onClose={() => setCreating(false)}
          onSubmit={createAction}
        />
      )}
      {editing && (
        <ItemModal
          title="Upravit odkaz"
          item={editing}
          pages={pages}
          onClose={() => setEditing(null)}
          onSubmit={updateMenuItem.bind(null, editing.id)}
        />
      )}
    </div>
  );
}

function kindLabel(kind: string) {
  return ({ page: 'Stránka', custom: 'Vlastní odkaz', group: 'Skupina odkazů' } as Record<string, string>)[kind] ?? kind;
}
