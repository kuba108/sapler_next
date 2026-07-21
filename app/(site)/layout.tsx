import type { Metadata } from 'next';
import Script from 'next/script';
import { appConfig } from '@/lib/app-config';

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
        <link
          href="https://fonts.googleapis.com/css?family=Raleway:400,300,500,600,700,800,900"
          rel="stylesheet"
          type="text/css"
        />
        <link href="/style/type/fontello.css" rel="stylesheet" />
        <link href="/style/type/picons.css" rel="stylesheet" />
        <link href="/style/type/budicons.css" rel="stylesheet" />
        <link href="/assets/application.css" rel="stylesheet" />
      </head>
      <body className="full-layout">
        {children}
        <Script src="/assets/application.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
