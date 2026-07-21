import Header from './Header';
import Footer from './Footer';
import CookieBanner from './CookieBanner';

export default function SiteShell({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <div className="body-wrapper">
      <Header lang={lang} />

      {children}

      <Footer lang={lang} />

      <CookieBanner lang={lang} />

      {/* blueimp gallery overlay markup (unchanged from Slowave template) */}
      <div id="blueimp-gallery" className="blueimp-gallery blueimp-gallery-controls">
        <div className="slides" />
        <h3 className="title" />
        <a className="prev">‹</a>
        <a className="next">›</a>
        <a className="close">×</a>
        <a className="play-pause" />
        <ol className="indicator" />
      </div>
    </div>
  );
}
