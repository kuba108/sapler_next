'use client';

import { useEffect, useState } from 'react';

const TEXT: Record<string, { body: string; accept: string }> = {
  cs: {
    body: "K poskytnutí našeho webu používáme cookies. Kliknutím na 'Přijmout' dáváte souhlas k používání cookies na našem webu.",
    accept: 'Přijmout',
  },
  de: {
    body: 'Wir verwenden Cookies, um Ihnen unsere Website zur Verfügung zu stellen. Wenn Sie auf "Akzeptieren" klicken, stimmen Sie der Verwendung von Cookies auf unserer Website zu.',
    accept: 'Akzeptieren',
  },
  en: {
    body: 'We use cookies so we can provide you with our website. By clicking the "Accept" button, you agree to allow the use of cookies on our website.',
    accept: 'Accept',
  },
};

export default function CookieBanner({ lang }: { lang: string }) {
  const [visible, setVisible] = useState(false);
  const t = TEXT[lang] ?? TEXT.cs;

  useEffect(() => {
    const approved = document.cookie
      .split('; ')
      .find((c) => c.startsWith('__cappr='))
      ?.split('=')[1];
    setVisible(approved !== 'Accepted');
  }, []);

  function accept() {
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);
    document.cookie = `__cappr=Accepted; expires=${exp.toUTCString()}; path=/`;
    setVisible(false);
  }

  return (
    <div id="cookie-info" className={`content${visible ? ' in' : ''}`}>
      <p>
        {t.body}{' '}
        <a className="btn btn-small btn-warning" onClick={accept} style={{ cursor: 'pointer' }}>
          {t.accept}
        </a>
      </p>
    </div>
  );
}
