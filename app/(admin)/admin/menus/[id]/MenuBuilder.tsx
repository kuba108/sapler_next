'use client';

import { Fragment, useState, useTransition, type DragEvent } from 'react';
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
type DropTarget = { parentId: string | null; beforeId: string | null };

function cloneItems(items: MenuItemNode[]): MenuItemNode[] {
  return items.map((item) => ({
    ...item,
    children: item.children.map((child) => ({ ...child, children: [] })),
  }));
}

function moveItem(items: MenuItemNode[], sourceId: string, target: DropTarget) {
  if (target.parentId === sourceId || target.beforeId === sourceId) return items;

  const next = cloneItems(items);
  let source: MenuItemNode | undefined;

  const topIndex = next.findIndex((item) => item.id === sourceId);
  if (topIndex >= 0) {
    [source] = next.splice(topIndex, 1);
  } else {
    for (const parent of next) {
      const childIndex = parent.children.findIndex((child) => child.id === sourceId);
      if (childIndex >= 0) {
        [source] = parent.children.splice(childIndex, 1);
        break;
      }
    }
  }

  if (!source) return items;

  if (target.parentId === null) {
    const targetIndex = target.beforeId
      ? next.findIndex((item) => item.id === target.beforeId)
      : next.length;
    next.splice(targetIndex < 0 ? next.length : targetIndex, 0, source);
    return next;
  }

  const parent = next.find((item) => item.id === target.parentId);
  if (!parent) return items;

  const targetIndex = target.beforeId
    ? parent.children.findIndex((child) => child.id === target.beforeId)
    : parent.children.length;

  // The persisted menu supports two levels. When a parent is nested, keep its
  // former children beside it instead of silently creating an unsupported level.
  const childrenToInsert = [{ ...source, children: [] }, ...source.children];
  parent.children.splice(
    targetIndex < 0 ? parent.children.length : targetIndex,
    0,
    ...childrenToInsert,
  );
  return next;
}

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
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
      try {
        const result = await saveMenuOrder(
          menuId,
          items.map((it) => ({ id: it.id, children: it.children.map((c) => c.id) })),
        );
        if (!result.ok) throw new Error('Menu order was not saved');
        setEditMode(false);
        router.refresh();
      } catch {
        alert('Pořadí menu se nepodařilo uložit.');
      }
    });
  }

  function startDrag(event: DragEvent<HTMLElement>, id: string) {
    setDraggingId(id);
    setDropTarget(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }

  function finishDrag() {
    setDraggingId(null);
    setDropTarget(null);
  }

  function dragOver(event: DragEvent<HTMLLIElement>, target: DropTarget) {
    if (!draggingId || target.parentId === draggingId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget(target);
  }

  function drop(event: DragEvent<HTMLLIElement>, target: DropTarget) {
    event.preventDefault();
    event.stopPropagation();
    const sourceId = draggingId || event.dataTransfer.getData('text/plain');
    if (sourceId) setItems((current) => moveItem(current, sourceId, target));
    finishDrag();
  }

  function renderDropZone(target: DropTarget, key: string) {
    const active =
      dropTarget?.parentId === target.parentId && dropTarget?.beforeId === target.beforeId;

    return (
      <li
        key={key}
        className={`menu-drop-zone${active ? ' is-active' : ''}`}
        aria-hidden="true"
        onDragEnter={(event) => dragOver(event, target)}
        onDragOver={(event) => dragOver(event, target)}
        onDrop={(event) => drop(event, target)}
      />
    );
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
                type="button"
                className={`btn btn-warning${editMode ? ' active' : ''}`}
                onClick={() => {
                  finishDrag();
                  setEditMode((v) => !v);
                }}
              >
                <span className="fa fa-pencil" /> Upravit pořadí
              </button>{' '}
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                <span className="fa fa-plus" /> Přidat odkaz
              </button>
            </div>
            <div className="float-right">
              {editMode && (
                <button
                  type="button"
                  className="btn btn-success btn-fill menu-save-btn"
                  onClick={save}
                  disabled={saving}
                >
                  <span className={`fa ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />{' '}
                  {saving ? 'Ukládám…' : 'Uložit změny'}
                </button>
              )}
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
                  <ul
                    id="menu-items"
                    className={
                      `${editMode ? 'edit' : ''}${draggingId ? ' is-dragging' : ''}`.trim() ||
                      undefined
                    }
                  >
                    {items.map((item, i) => (
                      <Fragment key={item.id}>
                        {editMode &&
                          renderDropZone(
                            { parentId: null, beforeId: item.id },
                            `top-before-${item.id}`,
                          )}
                        <li
                          className={`menu-item${draggingId === item.id ? ' is-dragged' : ''}`}
                        >
                          <span
                            className="fa fa-bars draggable"
                            draggable={editMode}
                            role={editMode ? 'button' : undefined}
                            tabIndex={editMode ? 0 : undefined}
                            aria-label={editMode ? `Přesunout ${item.label}` : undefined}
                            title={editMode ? 'Přetáhněte položku na nové místo' : undefined}
                            onDragStart={(event) => startDrag(event, item.id)}
                            onDragEnd={finishDrag}
                          />{' '}
                          {item.label}
                          {item.url && (
                            <>
                              &nbsp;<em>({item.url})</em>
                            </>
                          )}
                          &nbsp;|&nbsp;{kindLabel(item.kind)}
                          <div className="menu-item-actions">
                          {editMode ? (
                            <>
                              <button
                                type="button"
                                className="btn-simple btn-link"
                                onClick={() => moveTop(i, -1)}
                                title="Posunout nahoru"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn-simple btn-link"
                                onClick={() => moveTop(i, 1)}
                                title="Posunout dolů"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="btn-simple btn-link"
                                onClick={() => indent(i)}
                                title="Vnořit"
                              >
                                →
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="change-menu-item-btn btn-simple btn-link"
                                onClick={() => setEditing(item)}
                                title="Upravit položku"
                              >
                                <span className="fa fa-edit" />
                              </button>
                              <button
                                type="button"
                                className="remove-link-btn btn-simple btn-link"
                                onClick={() => remove(item.id)}
                                title="Odstranit položku"
                              >
                                <span className="fa fa-close" />
                              </button>
                            </>
                          )}
                          </div>
                          {(item.children.length > 0 || editMode) && (
                            <ul className="sub-menu">
                              {item.children.map((child, j) => (
                                <Fragment key={child.id}>
                                  {editMode &&
                                    renderDropZone(
                                      { parentId: item.id, beforeId: child.id },
                                      `child-before-${item.id}-${child.id}`,
                                    )}
                                  <li
                                    className={`menu-item${draggingId === child.id ? ' is-dragged' : ''}`}
                                  >
                                    <span
                                      className="fa fa-bars draggable"
                                      draggable={editMode}
                                      role={editMode ? 'button' : undefined}
                                      tabIndex={editMode ? 0 : undefined}
                                      aria-label={
                                        editMode ? `Přesunout ${child.label}` : undefined
                                      }
                                      title={
                                        editMode
                                          ? 'Přetáhněte položku na nové místo'
                                          : undefined
                                      }
                                      onDragStart={(event) => startDrag(event, child.id)}
                                      onDragEnd={finishDrag}
                                    />{' '}
                                    {child.label}
                                    {child.url && (
                                      <>
                                        &nbsp;<em>({child.url})</em>
                                      </>
                                    )}
                                    &nbsp;|&nbsp;{kindLabel(child.kind)}
                                    <div className="menu-item-actions">
                                  {editMode ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn-simple btn-link"
                                        onClick={() => moveChild(i, j, -1)}
                                        title="Posunout nahoru"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-simple btn-link"
                                        onClick={() => moveChild(i, j, 1)}
                                        title="Posunout dolů"
                                      >
                                        ↓
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-simple btn-link"
                                        onClick={() => outdentChild(i, j)}
                                        title="Přesunout o úroveň výše"
                                      >
                                        ←
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="change-menu-item-btn btn-simple btn-link"
                                        onClick={() => setEditing(child)}
                                        title="Upravit položku"
                                      >
                                        <span className="fa fa-edit" />
                                      </button>
                                      <button
                                        type="button"
                                        className="remove-link-btn btn-simple btn-link"
                                        onClick={() => remove(child.id)}
                                        title="Odstranit položku"
                                      >
                                        <span className="fa fa-close" />
                                      </button>
                                    </>
                                  )}
                                    </div>
                                  </li>
                                </Fragment>
                              ))}
                              {editMode &&
                                renderDropZone(
                                  { parentId: item.id, beforeId: null },
                                  `child-end-${item.id}`,
                                )}
                            </ul>
                          )}
                        </li>
                      </Fragment>
                    ))}
                    {editMode &&
                      renderDropZone({ parentId: null, beforeId: null }, 'top-end')}
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
