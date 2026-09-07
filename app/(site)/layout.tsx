import type { Metadata } from 'next';
import { appConfig } from '@/lib/app-config';
import LegacyPageLifecycle from '@/components/site/LegacyPageLifecycle';

export const metadata: Metadata = {
  title: appConfig.tabTitle,
};

export default function SiteRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        {/*
          Google Consent Mode v2 bootstrap. Must run before gtag.js (loaded
          later by GoogleAnalytics.tsx, only once analytics consent is
          granted) so Google always sees an explicit default. Also re-applies
          a returning visitor's stored choice immediately, before React
          hydrates, to avoid a flash of the "denied" default.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
(function () {
  try {
    var match = document.cookie.match(/(?:^|; )cookie_consent=([^;]*)/);
    if (!match) return;
    var consent = JSON.parse(decodeURIComponent(match[1]));
    gtag('consent', 'update', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied'
    });
  } catch (e) {}
})();
`.trim(),
          }}
        />
        <link rel="icon" href="/assets/template/favicon.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css?family=Raleway:400,300,500,600,700,800,900"
          rel="stylesheet"
          type="text/css"
        />
        <link href="/style/type/fontello.css" rel="stylesheet" />
        <link href="/style/type/picons.css" rel="stylesheet" />
        <link href="/style/type/budicons.css" rel="stylesheet" />
        <link href="/assets/application.css" rel="stylesheet" />
        <link href="/assets/site-overrides.css" rel="stylesheet" />
        <style>{`
          .navbar-nav > .dropdown:hover > .dropdown-menu,
          .navbar-nav > .dropdown:focus-within > .dropdown-menu {
            display: block;
          }
        `}</style>
      </head>
      <body className="full-layout">
        {children}
        <LegacyPageLifecycle />
      </body>
    </html>
  );
}
