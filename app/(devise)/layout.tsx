import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sapler.cz',
};

export default function DeviseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
        />
        <link href="/assets/devise.css" rel="stylesheet" />
      </head>
      <body className="devise">
        {children}
        <div className="full-page-background" />
      </body>
    </html>
  );
}
