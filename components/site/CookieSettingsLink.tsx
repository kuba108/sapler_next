'use client';

import { openConsentSettings } from '@/lib/consent';

const LABEL: Record<string, string> = {
  cs: 'Nastavení cookies',
  de: 'Cookie-Einstellungen',
  en: 'Cookie settings',
};

export default function CookieSettingsLink({ lang }: { lang: string }) {
  return (
    <a onClick={openConsentSettings} style={{ cursor: 'pointer' }}>
      {LABEL[lang] ?? LABEL.cs}
    </a>
  );
}
