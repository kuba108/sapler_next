'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const PAGE_LOAD_EVENT = 'sapler:page-load';
const BEFORE_PAGE_LOAD_EVENT = 'sapler:before-page-load';

export default function LegacyPageLifecycle() {
  const pathname = usePathname();
  const initializedPath = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady || initializedPath.current === pathname) return;

    document.dispatchEvent(new Event(BEFORE_PAGE_LOAD_EVENT));
    initializedPath.current = pathname;

    const frame = requestAnimationFrame(() => {
      document.dispatchEvent(new Event(PAGE_LOAD_EVENT));
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, scriptReady]);

  return (
    <Script
      src="/assets/application.js?v=4"
      strategy="afterInteractive"
      onReady={() => setScriptReady(true)}
    />
  );
}
