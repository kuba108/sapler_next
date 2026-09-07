'use client';

import { useEffect, useState } from 'react';
import {
  getConsent,
  setConsent,
  type ConsentChoice,
  OPEN_CONSENT_SETTINGS_EVENT,
} from '@/lib/consent';

type Copy = {
  title: string;
  body: string;
  necessary: string;
  analytics: string;
  marketing: string;
  rejectAll: string;
  acceptAll: string;
  hideDetails: string;
  showDetails: string;
  applySelected: string;
};

const TEXT: Record<string, Copy> = {
  cs: {
    title: 'Používáme soubory cookies',
    body: 'Slouží k měření návštěvnosti a přizpůsobení obsahu (Google Analytics). Můžete je kdykoliv odmítnout.',
    necessary: 'Nezbytné (nutné pro fungování webu)',
    analytics: 'Analytické cookies (Google Analytics)',
    marketing: 'Marketingové a personalizační cookies',
    rejectAll: 'Odmítnout vše',
    acceptAll: 'Přijmout vše',
    hideDetails: 'Skrýt volby',
    showDetails: 'Nastavit volby',
    applySelected: 'Použít vybrané',
  },
  de: {
    title: 'Wir verwenden Cookies',
    body: 'Sie dienen der Besuchermessung und Inhaltsanpassung (Google Analytics). Sie können sie jederzeit ablehnen.',
    necessary: 'Notwendig (für die Funktion der Website erforderlich)',
    analytics: 'Analyse-Cookies (Google Analytics)',
    marketing: 'Marketing- und Personalisierungs-Cookies',
    rejectAll: 'Alle ablehnen',
    acceptAll: 'Alle akzeptieren',
    hideDetails: 'Optionen ausblenden',
    showDetails: 'Optionen anzeigen',
    applySelected: 'Auswahl übernehmen',
  },
  en: {
    title: 'We use cookies',
    body: 'They help us measure traffic and tailor content (Google Analytics). You can decline them at any time.',
    necessary: 'Necessary (required for the site to work)',
    analytics: 'Analytics cookies (Google Analytics)',
    marketing: 'Marketing and personalization cookies',
    rejectAll: 'Reject all',
    acceptAll: 'Accept all',
    hideDetails: 'Hide options',
    showDetails: 'Customize',
    applySelected: 'Apply selected',
  },
};

function Toggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="cookie-consent-row">
      <label htmlFor={id} className="cookie-consent-row-label">
        {label}
      </label>
      <label className={`cookie-consent-switch${disabled ? ' is-disabled' : ''}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="cookie-consent-slider" />
      </label>
    </div>
  );
}

export default function CookieConsent({ lang }: { lang: string }) {
  const t = TEXT[lang] ?? TEXT.cs;
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>({ analytics: false, marketing: false });

  useEffect(() => {
    setVisible(getConsent() === null);

    function reopen() {
      setChoice({ analytics: false, marketing: false });
      setExpanded(false);
      setVisible(true);
    }
    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, reopen);
  }, []);

  function decide(next: ConsentChoice) {
    setConsent(next);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-modal="false" aria-label={t.title}>
      <div className="cookie-consent-card">
        <h2 className="cookie-consent-title">{t.title}</h2>
        <p className="cookie-consent-body">{t.body}</p>

        {expanded && (
          <div className="cookie-consent-categories">
            <Toggle id="cc-necessary" label={t.necessary} checked disabled />
            <Toggle
              id="cc-analytics"
              label={t.analytics}
              checked={choice.analytics}
              onChange={(checked) => setChoice((c) => ({ ...c, analytics: checked }))}
            />
            <Toggle
              id="cc-marketing"
              label={t.marketing}
              checked={choice.marketing}
              onChange={(checked) => setChoice((c) => ({ ...c, marketing: checked }))}
            />
          </div>
        )}

        <div className="cookie-consent-actions">
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--ghost"
            onClick={() => decide({ analytics: false, marketing: false })}
          >
            {t.rejectAll}
          </button>
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--ghost"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t.hideDetails : t.showDetails}
          </button>
          {expanded && (
            <button
              type="button"
              className="cookie-consent-btn cookie-consent-btn--ghost"
              onClick={() => decide(choice)}
            >
              {t.applySelected}
            </button>
          )}
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-btn--dark"
            onClick={() => decide({ analytics: true, marketing: true })}
          >
            {t.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
