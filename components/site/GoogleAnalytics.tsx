'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getConsent, CONSENT_CHANGED_EVENT, type ConsentRecord } from '@/lib/consent';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(record: ConsentRecord) {
  window.gtag?.('consent', 'update', {
    analytics_storage: record.analytics ? 'granted' : 'denied',
    ad_storage: record.marketing ? 'granted' : 'denied',
    ad_user_data: record.marketing ? 'granted' : 'denied',
    ad_personalization: record.marketing ? 'granted' : 'denied',
  });
}

/**
 * Loads gtag.js only once analytics consent is granted, and keeps Google's
 * own Consent Mode signals (set up by the inline bootstrap script in the
 * root layout `<head>`) in sync as the visitor changes their choice.
 *
 * Inert until `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set — see .env.
 */
export default function GoogleAnalytics() {
  const [analyticsGranted, setAnalyticsGranted] = useState(false);

  useEffect(() => {
    setAnalyticsGranted(getConsent()?.analytics === true);

    function handleChange(event: Event) {
      const record = (event as CustomEvent<ConsentRecord>).detail;
      updateGoogleConsent(record);
      setAnalyticsGranted(record.analytics);
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handleChange);
  }, []);

  if (!GA_MEASUREMENT_ID || !analyticsGranted) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-config" strategy="afterInteractive">
        {`window.gtag = window.gtag || function(){(window.dataLayer=window.dataLayer||[]).push(arguments);};
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
