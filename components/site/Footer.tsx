import { appConfig } from '@/lib/app-config';
import { menuHtml } from '@/lib/menus';

/**
 * Faithful port of the Sapler footer from the localized Rails layouts
 * (application.{cs,de,en}.html.erb). Contact details are static marketing copy.
 */

const INTRO: Record<string, string> = {
  cs: 'Sapler a.s. je výrobně-obchodní organizací zaměřenou zejména na realizaci odnosných reklamních tašek s tiskem a jiných obalů.',
  de: 'Sapler a.s. ist eine Produktions- und Handelsorganisation, die sich hauptsächlich auf die Realisierung wiederverwendbarer Werbetaschen mit Druck- und sonstigen Verpackungen konzentriert.',
  en: 'Sapler a.s. is a production and commercial organization focused mainly on the realization of reusable advertising bags with printing and other packaging products.',
};

const DOCS: Record<string, { vop: string; pnd: string }> = {
  cs: {
    vop: 'Všeobecné obchodní podmínky (VOP)',
    pnd: 'Podniková norma dodavatele (PND)',
  },
  de: {
    vop: 'Allgemeine Geschäftsbedingungen (AGB)',
    pnd: 'Geschäftsstandard des Lieferanten (GSL)',
  },
  en: {
    vop: 'General Terms and Conditions (GTC)',
    pnd: "Supplier's business standard (SBS)",
  },
};

const CONTACT_CZ_TITLE: Record<string, string> = {
  cs: 'Kontakt CZ',
  de: 'Kontakt - Tschechische Republik',
  en: 'Contact - Czech republic',
};

const CONTACT_SK_TITLE: Record<string, string> = {
  cs: 'Kontakt SK',
  de: 'Kontakt - Slowakische Republik',
  en: 'Contact - Slovak republic',
};

function CzContact({ lang }: { lang: string }) {
  const country =
    lang === 'de' ? 'Tschechische Republik' : lang === 'en' ? 'Czech republic' : 'Česká republika';
  const email = lang === 'cs' ? 'info@sapler.cz' : 'jiri.sobek@sapler.cz';
  const lines: Record<string, string[]> = {
    cs: [
      'Obchodní oddělení: <strong>+420 597 070 345</strong> a <strong>597 070 367</strong>',
      'Obchodní oddělení - <strong>Fax: +420 596 368 001</strong>',
      'Nákupní oddělení: <strong>+420 596 313 984</strong>',
      'Personální a účetní oddělení: <strong>+420 597 070 366</strong>',
      'Expediční oddělení: <strong>+420 774 378 811</strong>',
      'Expediční oddělení - <strong>Fax: +420 596 313 522</strong>',
    ],
    de: [
      'Verkaufsabteilung: <strong>+420 597 070 345</strong>, <strong>+420 597 070 367</strong>',
      'Verkaufsabteilung - Fax: <strong>+420 596 368 001</strong>',
      'Einkaufsabteilung: <strong>+420 596 313 984</strong>',
      'Personal und Buchhaltungsabteilung: <strong>+420 597 070 366</strong>',
      'Versandabteilung: <strong>+420 774 378 811</strong>',
      'Versandabteilung - Fax: <strong>+420 596 313 522</strong>',
    ],
    en: [
      'Sales Department: <strong>+420 597 070 345</strong> or <strong>+420 597 070 367</strong>',
      'Sales Department - Fax: <strong>+420 596 368 001</strong>',
      'Purchasing Department: <strong>+420 596 313 984</strong>',
      'Personnel/Accounting Department: <strong>+420 597 070 366</strong>',
      'Dispatch Department: <strong>+420 774 378 811</strong>',
      'Dispatch Department - Fax: <strong>+420 596 313 522</strong>',
    ],
  };
  return (
    <div className="col-sm-4">
      <div className="widget">
        <h3 className="section-title widget-title upper">{CONTACT_CZ_TITLE[lang]}</h3>
        <address>
          Sapler a. s.<br />
          Sportovní 1829/7, Karviná, 735 06 {country}<br />
        </address>
        <ul>
          {(lines[lang] ?? lines.cs).map((l, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: l }} />
          ))}
          <li>
            Email:&nbsp;
            <strong>
              <a href={`mailto:${email}`}>{email}</a>
            </strong>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SkContact({ lang }: { lang: string }) {
  const country =
    lang === 'de' ? 'Slowakische Republik' : lang === 'en' ? 'Slovak republic' : 'Slovenská republika';
  const phoneLabel = lang === 'de' ? 'Telefonnummer' : lang === 'en' ? 'Telephone number' : 'Tel.';
  const mobileLabel = lang === 'de' ? 'Mobil' : lang === 'en' ? 'Mobile number' : 'Mobil';
  return (
    <div className="col-sm-4">
      <div className="widget">
        <h3 className="section-title widget-title upper">{CONTACT_SK_TITLE[lang]}</h3>
        <address>
          Plastic Slovakia s. r. o.<br />
          Mlynské Nivy 77, 821 05 Bratislava {country}<br />
        </address>
        <ul>
          <li>
            <strong>{phoneLabel}: +421 (0)2 534 179 19</strong>
          </li>
          <li>
            <strong>{mobileLabel}: 0911 222 116, 0911 222 165</strong>
          </li>
          <li>
            <strong>Fax: +421 (0)2 534 179 19</strong>
          </li>
          <li>
            Email:{' '}
            <strong>
              <a href="mailto:plasticslovakia@nextra.sk">plasticslovakia@nextra.sk</a>
            </strong>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default async function Footer({ lang }: { lang: string }) {
  const l = INTRO[lang] ? lang : 'cs';
  const footerMenu = await menuHtml('footer_menu', l);
  return (
    <footer className="black-wrapper">
      <div className="container inner">
        <div className="row">
          <div className="col-sm-4">
            <div className="widget">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appConfig.logoPath}
                data-at2x={appConfig.logo2xPath}
                alt={appConfig.companyName}
              />
              <div className="divide20" />
              <p>{INTRO[l]}</p>
              <hr />
              <ul>
                <li>
                  <a href="/documents/VOP_SAPLER_as.pdf" target="_blank" rel="noreferrer">
                    {DOCS[l].vop}
                  </a>
                </li>
                <li>
                  <a
                    href="/documents/PODNIKOVA_NORMA_Sapler_F_3.pdf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {DOCS[l].pnd}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <CzContact lang={l} />
          <SkContact lang={l} />
        </div>
      </div>

      <div className="sub-footer">
        <div className="container">
          <p className="pull-left">
            © {new Date().getFullYear()} {appConfig.companyName}
          </p>
          <div dangerouslySetInnerHTML={{ __html: footerMenu }} />
        </div>
      </div>
    </footer>
  );
}
