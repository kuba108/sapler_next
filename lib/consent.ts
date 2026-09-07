/**
 * Client-side cookie consent storage (GDPR).
 *
 * Consent is stored in a plain cookie (not localStorage) so a future
 * server-rendered decision — e.g. skipping third-party script tags entirely
 * for a rejecting visitor — can read it via `next/headers` `cookies()`
 * without a client round-trip. Categories mirror Google's Consent Mode v2
 * signals (`analytics_storage`, `ad_storage`/`ad_user_data`/`ad_personalization`)
 * so `GoogleAnalytics.tsx` can map them directly.
 */

export type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = ConsentChoice & {
  necessary: true;
  decidedAt: string;
};

export const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE_DAYS = 180;

export const CONSENT_CHANGED_EVENT = 'sapler:consent-changed';
export const OPEN_CONSENT_SETTINGS_EVENT = 'sapler:open-consent-settings';

function readRawCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Reads the visitor's stored choice, or null if they haven't decided yet. */
export function getConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;
  const raw = readRawCookie(CONSENT_COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'analytics' in parsed &&
      'marketing' in parsed
    ) {
      const p = parsed as Record<string, unknown>;
      return {
        necessary: true,
        analytics: p.analytics === true,
        marketing: p.marketing === true,
        decidedAt: typeof p.decidedAt === 'string' ? p.decidedAt : '',
      };
    }
  } catch {
    // malformed cookie value — treat as undecided
  }
  return null;
}

/** Persists the visitor's choice and notifies listeners (e.g. the GA loader). */
export function setConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = { necessary: true, ...choice, decidedAt: new Date().toISOString() };
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_COOKIE_MAX_AGE_DAYS);
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent<ConsentRecord>(CONSENT_CHANGED_EVENT, { detail: record }));
  return record;
}

/** Re-opens the consent banner from anywhere on the site (e.g. a footer link). */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT));
}
