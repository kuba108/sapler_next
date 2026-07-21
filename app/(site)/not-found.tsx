import SiteShell from '@/components/site/SiteShell';

export default function NotFound() {
  return (
    <SiteShell lang="cs">
      <div className="offset" />
      <section>
        <div className="container inner">
          <div className="row">
            <div className="col-md-12">
              <h1 className="headline-crossed">Ups, stránka neexistuje</h1>
              <p>
                Bohužel se nám nepodařilo stránku najít a proto jste na stránce 404.
                Zkuste kliknout na nějaký odkaz v menu nebo pokračujte na{' '}
                <a href="/">úvodní stránku</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
