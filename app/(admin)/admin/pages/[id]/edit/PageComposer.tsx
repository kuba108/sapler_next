'use client';

import { Fragment, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SECTION_TYPES, WRAPPER_TYPES, WIDGET_TYPES, WRAPPER_PARTS } from '@/lib/widgets';
import WidgetEditor, { type WidgetData } from './WidgetEditor';
import {
  moveSection,
  moveWrapper,
  moveWidget,
  wrapperIds,
  partWidgetIds,
  widgetSource,
  wrapperSection,
} from './tree-ops';
import {
  addSection,
  updateSection,
  deleteSection,
  addWrapper,
  deleteWrapper,
  addWidget,
  deleteWrapperWidget,
  publishPage,
  reorderSections,
  reorderWrappers,
  reorderWrapperWidgets,
} from '../../actions';

export type WrapperData = {
  id: string;
  name: string;
  parts: Record<string, WidgetData[]>;
};

export type SectionData = {
  id: string;
  name: string;
  description: string;
  cssClasses: string[];
  wrappers: WrapperData[];
};

type Drag =
  | { kind: 'section'; id: string }
  | { kind: 'wrapper'; id: string }
  | { kind: 'widget'; id: string }
  | null;

function widgetTargetKey(wrapperId: string, part: string, beforeId: string | null) {
  return `widget:${wrapperId}:${part}:${beforeId ?? 'end'}`;
}

function WidgetDropPlaceholder({ height }: { height: number }) {
  return (
    <div
      className="widget-drop-placeholder"
      style={{ height: `${Math.max(42, height)}px` }}
      aria-hidden="true"
    >
      <span>Widget bude vložen sem</span>
    </div>
  );
}

function signature(sections: SectionData[]): string {
  return sections
    .map(
      (s) =>
        s.id +
        '[' +
        s.cssClasses.join('.') +
        '|' +
        s.description +
        ']' +
        ':' +
        s.wrappers
          .map(
            (w) =>
              w.id +
              '(' +
              Object.entries(w.parts)
                .map(([p, ws]) => p + '=' + ws.map((x) => x.wrapperWidgetId).join('-'))
                .join('|') +
              ')',
          )
          .join(','),
    )
    .join(';');
}

export default function PageComposer({
  pageId,
  sections: initialSections,
  galleries,
}: {
  pageId: string;
  sections: SectionData[];
  galleries: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [publishMsg, setPublishMsg] = useState('');
  const [sections, setSections] = useState(initialSections);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggingWidget, setDraggingWidget] = useState<{ id: string; height: number } | null>(null);
  const [settingsSectionId, setSettingsSectionId] = useState<string | null>(null);

  // Mirror the drag payload in a ref so drop handlers read the latest value
  // regardless of React's re-render timing (avoids stale-closure misses).
  const dragRef = useRef<Drag>(null);
  function setDrag(next: Drag) {
    dragRef.current = next;
    if (next?.kind !== 'widget') setDraggingWidget(null);
  }

  // Resync when the server sends a new tree (after add/delete/refresh).
  const lastSig = useRef(signature(initialSections));
  useEffect(() => {
    const sig = signature(initialSections);
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      setSections(initialSections);
    }
  }, [initialSections]);

  function commit(next: SectionData[]) {
    setSections(next);
    lastSig.current = signature(next);
  }

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function publish() {
    startTransition(async () => {
      const res = await publishPage(pageId);
      setPublishMsg(res.msg);
      setTimeout(() => setPublishMsg(''), 3000);
      router.refresh();
    });
  }

  function saveAllWidgets() {
    window.dispatchEvent(new Event('page-composer:save-all-widgets'));
  }

  /* --------------------------- Drag & drop --------------------------- */

  function onDropSection(targetSectionId: string) {
    const d = dragRef.current;
    if (d?.kind !== 'section') return;
    const next = moveSection(sections, d.id, targetSectionId);
    commit(next);
    reorderSections(pageId, next.map((s) => s.id));
    setDrag(null);
    setDropTarget(null);
  }

  function onDropWrapper(targetSectionId: string, targetWrapperId: string | null) {
    const d = dragRef.current;
    if (d?.kind !== 'wrapper') return;
    const sourceSectionId = wrapperSection(sections, d.id);
    const next = moveWrapper(sections, d.id, targetSectionId, targetWrapperId);
    commit(next);
    const target = next.find((s) => s.id === targetSectionId);
    if (target) reorderWrappers(targetSectionId, wrapperIds(target));
    if (sourceSectionId && sourceSectionId !== targetSectionId) {
      const src = next.find((s) => s.id === sourceSectionId);
      if (src) reorderWrappers(sourceSectionId, wrapperIds(src));
    }
    setDrag(null);
    setDropTarget(null);
  }

  function onDropWidget(
    targetWrapperId: string,
    targetPart: string,
    targetWwId: string | null,
  ) {
    const d = dragRef.current;
    if (d?.kind !== 'widget') return;
    if (d.id === targetWwId) {
      setDrag(null);
      setDropTarget(null);
      return;
    }
    const source = widgetSource(sections, d.id);
    const next = moveWidget(sections, d.id, targetWrapperId, targetPart, targetWwId);
    commit(next);
    reorderWrapperWidgets(targetWrapperId, targetPart, partWidgetIds(next, targetWrapperId, targetPart));
    if (source && (source.wrapperId !== targetWrapperId || source.part !== targetPart)) {
      reorderWrapperWidgets(
        source.wrapperId,
        source.part,
        partWidgetIds(next, source.wrapperId, source.part),
      );
    }
    setDrag(null);
    setDropTarget(null);
  }

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  return (
    <>
      <div className="top-panel page-composer-toolbar">
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <div className="dropdown d-inline-block">
                <button className="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown">
                  Přidat sekci
                </button>
                <div className="dropdown-menu">
                  {SECTION_TYPES.map((s) => (
                    <button key={s.name} className="dropdown-item" onClick={() => run(() => addSection(pageId, s.name))}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <span className="ml-2 text-muted">
                <small>Tip: položky lze přetahovat (drag &amp; drop)</small>
              </span>
            </div>
            <div className="float-right">
              <div className="btn-group">
                <button type="button" className="btn btn-success" onClick={saveAllWidgets} disabled={pending}>
                  <span className="fa fa-save" /> Uložit vše
                </button>
                <button className="btn btn-success btn-fill" onClick={publish} disabled={pending}>
                  Uložit změny na stránce
                </button>
              </div>
              {publishMsg && <span className="ml-2">{publishMsg}</span>}
            </div>
          </div>
        </div>
      </div>

      <div id="sections" className="section-list page-composer">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`${section.name} section clearfix${dropTarget === `sec:${section.id}` ? ' drop-target' : ''}`}
            onDragOver={(e) => {
              if (dragRef.current?.kind === 'section') {
                allowDrop(e);
                setDropTarget(`sec:${section.id}`);
              }
            }}
            onDragLeave={() => dropTarget === `sec:${section.id}` && setDropTarget(null)}
            onDrop={() => onDropSection(section.id)}
          >
            <div className="section-header">
              <div className="pull-left">
                <div className="dropdown">
                  <button className="section-btn" data-toggle="dropdown" aria-label="Přidat sloupce">
                    <span className="fa fa-plus" />
                  </button>
                  <div className="dropdown-menu">
                    {WRAPPER_TYPES.map((w) => (
                      <button key={w.name} className="dropdown-item" onClick={() => run(() => addWrapper(section.id, w.name))}>
                        Přidat {w.label.toLocaleLowerCase('cs')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="btn-group">
                <button
                  className="section-btn drag-placeholder"
                  draggable
                  onDragStart={() => setDrag({ kind: 'section', id: section.id })}
                  onDragEnd={() => {
                    setDrag(null);
                    setDropTarget(null);
                  }}
                  title="Přetáhnout sekci"
                >
                  <span className="fa fa-bars" />
                </button>
                <button className="section-btn" onClick={() => setSettingsSectionId(section.id)} title="Nastavení sekce">
                  <span className="fa fa-cog" />
                </button>
              </div>
              <div className="pull-right">
                <button
                  className="section-btn remove-btn"
                  onClick={() => {
                    if (confirm('Smazat sekci?')) run(() => deleteSection(section.id));
                  }}
                  aria-label="Smazat sekci"
                >
                  <span className="fa fa-times" />
                </button>
              </div>
            </div>

            <div
              className={`section-body${dropTarget === `secbody:${section.id}` ? ' drop-target' : ''}`}
              onDragOver={(e) => {
                if (dragRef.current?.kind === 'wrapper') {
                  allowDrop(e);
                  setDropTarget(`secbody:${section.id}`);
                }
              }}
              onDrop={(e) => {
                if (dragRef.current?.kind === 'wrapper') {
                  e.stopPropagation();
                  onDropWrapper(section.id, null);
                }
              }}
            >
              <div className="wrapper-list">
                {section.wrappers.map((wrapper) => {
                  const parts = WRAPPER_PARTS[wrapper.name] ?? ['column'];
                  return (
                    <div
                      key={wrapper.id}
                      className={`${wrapper.name}-wrapper wrapper-card${dropTarget === `wrap:${wrapper.id}` ? ' drop-target' : ''}`}
                      onDragOver={(e) => {
                        if (dragRef.current?.kind === 'wrapper') {
                          allowDrop(e);
                          e.stopPropagation();
                          setDropTarget(`wrap:${wrapper.id}`);
                        }
                      }}
                      onDrop={(e) => {
                        if (dragRef.current?.kind === 'wrapper') {
                          e.stopPropagation();
                          onDropWrapper(section.id, wrapper.id);
                        }
                      }}
                    >
                      <div className={parts.length > 1 ? 'row' : undefined}>
                        {parts.map((part, partIndex) => {
                          const widgets = wrapper.parts[part] ?? [];
                          const endTarget = widgetTargetKey(wrapper.id, part, null);

                          return (
                            <div key={part} className={parts.length > 1 ? `col-md-${12 / parts.length}` : undefined}>
                            <div className={`${part} wrapper-column clearfix`}>
                              <div
                                className="widget-wrapper"
                                onDragOver={(e) => {
                                  if (dragRef.current?.kind === 'widget') {
                                    allowDrop(e);
                                    e.stopPropagation();
                                    if (e.target === e.currentTarget) setDropTarget(endTarget);
                                  }
                                }}
                                onDrop={(e) => {
                                  if (dragRef.current?.kind === 'widget') {
                                    e.stopPropagation();
                                    const prefix = `widget:${wrapper.id}:${part}:`;
                                    const encodedTarget = dropTarget?.startsWith(prefix)
                                      ? dropTarget.slice(prefix.length)
                                      : 'end';
                                    onDropWidget(
                                      wrapper.id,
                                      part,
                                      encodedTarget === 'end' ? null : encodedTarget,
                                    );
                                  }
                                }}
                              >
                                {widgets.map((widget, widgetIndex) => {
                                  const beforeTarget = widgetTargetKey(wrapper.id, part, widget.wrapperWidgetId);
                                  return (
                                    <Fragment key={widget.wrapperWidgetId}>
                                      {dropTarget === beforeTarget && draggingWidget && (
                                        <WidgetDropPlaceholder height={draggingWidget.height} />
                                      )}
                                      <WidgetEditor
                                    widget={widget}
                                    galleries={galleries}
                                    onDelete={(id) => run(() => deleteWrapperWidget(id))}
                                    isDragging={draggingWidget?.id === widget.wrapperWidgetId}
                                    onDragStart={(height) => {
                                      setDraggingWidget({ id: widget.wrapperWidgetId, height });
                                      setDrag({ kind: 'widget', id: widget.wrapperWidgetId });
                                    }}
                                    onDragEnd={() => {
                                      setDrag(null);
                                      setDropTarget(null);
                                    }}
                                    onDragOver={(e) => {
                                      if (dragRef.current?.kind === 'widget') {
                                        allowDrop(e);
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const beforeId = e.clientY < rect.top + rect.height / 2
                                          ? widget.wrapperWidgetId
                                          : widgets[widgetIndex + 1]?.wrapperWidgetId ?? null;
                                        setDropTarget(
                                          beforeId === dragRef.current.id
                                            ? null
                                            : widgetTargetKey(wrapper.id, part, beforeId),
                                        );
                                      }
                                    }}
                                    onDrop={(e) => {
                                      if (dragRef.current?.kind === 'widget') {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const beforeId = e.clientY < rect.top + rect.height / 2
                                          ? widget.wrapperWidgetId
                                          : widgets[widgetIndex + 1]?.wrapperWidgetId ?? null;
                                        if (beforeId !== dragRef.current.id) {
                                          onDropWidget(wrapper.id, part, beforeId);
                                        }
                                      }
                                    }}
                                      />
                                    </Fragment>
                                  );
                                })}
                                {dropTarget === endTarget && draggingWidget && (
                                  <WidgetDropPlaceholder height={draggingWidget.height} />
                                )}
                              </div>

                              <div className="pull-left">
                                <div className="dropdown">
                                  <button className="btn btn-success dropdown-toggle" data-toggle="dropdown">
                                    Přidat widget
                                  </button>
                                  <div className="dropdown-menu">
                                    {WIDGET_TYPES.map((wt) => (
                                      <button
                                        key={wt.name}
                                        className="dropdown-item"
                                        onClick={() => run(() => addWidget(wrapper.id, wt.name, part))}
                                      >
                                        {wt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {partIndex === parts.length - 1 && (
                                <div className="pull-right">
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => {
                                      if (confirm('Smazat sloupce?')) run(() => deleteWrapper(wrapper.id));
                                    }}
                                  >
                                    Odstranit
                                  </button>
                                </div>
                              )}
                            </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        className="drag-placeholder"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDrag({ kind: 'wrapper', id: wrapper.id });
                        }}
                        onDragEnd={() => {
                          setDrag(null);
                          setDropTarget(null);
                        }}
                        title="Přetáhnout sloupce"
                      >
                        <span className="fa fa-bars" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {section.wrappers.length === 0 && (
                <p className="text-muted mb-0">
                  <em>Sekce nemá žádné sloupce. Přidejte je tlačítkem plus.</em>
                </p>
              )}
            </div>

            {settingsSectionId === section.id && (
              <SectionSettings
                section={section}
                pending={pending}
                onClose={() => setSettingsSectionId(null)}
                onSave={(cssClasses, description) => {
                  run(() => updateSection(section.id, cssClasses.join(' '), description));
                  setSettingsSectionId(null);
                }}
              />
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-muted">
            <em>Stránka nemá žádné sekce. Přidejte sekci tlačítkem „Přidat sekci“.</em>
          </p>
        )}
      </div>
    </>
  );
}

function SectionSettings({
  section,
  pending,
  onClose,
  onSave,
}: {
  section: SectionData;
  pending: boolean;
  onClose: () => void;
  onSave: (cssClasses: string[], description: string) => void;
}) {
  const [cssClasses, setCssClasses] = useState(section.cssClasses);
  const [description, setDescription] = useState(section.description);

  function toggle(value: string) {
    setCssClasses((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <div className="composer-modal" role="dialog" aria-modal="true" aria-label="Nastavení sekce">
      <div className="composer-modal-backdrop" onClick={onClose} />
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Nastavení sekce</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Zavřít">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Vlastnosti</label>
              {[
                ['Světlý styl', 'dark-wrapper'],
                ['Tmavý styl', 'black-wrapper'],
              ].map(([label, value], index) => (
                <div className="custom-control custom-checkbox" key={value}>
                  <input
                    type="checkbox"
                    id={`section-${section.id}-css-${index}`}
                    className="custom-control-input"
                    checked={cssClasses.includes(value)}
                    onChange={() => toggle(value)}
                  />
                  <label className="custom-control-label" htmlFor={`section-${section.id}-css-${index}`}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
            <div className="form-group mt-4 mb-2">
              <label htmlFor={`section-${section.id}-description`}>Popis</label>
              <input
                id={`section-${section.id}-description`}
                className="form-control"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={onClose}>Zrušit</button>
            <button type="button" className="btn btn-success" disabled={pending} onClick={() => onSave(cssClasses, description)}>
              Uložit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
