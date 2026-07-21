'use client';

import { useEffect, useRef } from 'react';
import Quill from 'quill';

/**
 * Thin React wrapper around Quill 2 (snow theme) for the WYSIWYG widget.
 * Emits HTML on every change via `onChange`. Uncontrolled after mount — the
 * initial `value` seeds the editor; further external changes are ignored to
 * avoid fighting the user's cursor.
 */
export default function QuillEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host || quillRef.current) return;

    // React development mode intentionally mounts effects twice. Quill adds
    // both the toolbar and editor DOM to the host, so always clear any DOM left
    // by an earlier initialization before creating the next instance.
    host.replaceChildren();

    const editorEl = document.createElement('div');
    host.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'blockquote'],
          ['clean'],
        ],
      },
    });

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    const handleTextChange = () => {
      onChangeRef.current(quill.getSemanticHTML());
    };

    quill.on('text-change', handleTextChange);

    quillRef.current = quill;
    host.dataset.quillInitialized = 'true';

    return () => {
      quill.off('text-change', handleTextChange);
      quillRef.current = null;
      delete host.dataset.quillInitialized;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="quill-wrapper" />;
}
