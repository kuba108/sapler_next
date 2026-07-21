import { appConfig } from '@/lib/app-config';
import { menuHtml } from '@/lib/menus';

export default async function Header({ lang }: { lang: string }) {
  const mainMenu = await menuHtml('main_menu', lang);
  return (
    <div className="yamm navbar basic default">
      <div className="navbar-header">
        <div className="container">
          <div className="basic-wrapper">
            <a
              className="btn responsive-menu pull-right"
              data-toggle="collapse"
              data-target=".navbar-collapse"
            >
              <i className="icon-menu-1" />
            </a>
            <a className="navbar-brand" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appConfig.logoPath}
                data-at2x={appConfig.logo2xPath}
                alt={appConfig.companyName}
              />
            </a>
          </div>
          <div
            className="collapse navbar-collapse pull-right"
            dangerouslySetInnerHTML={{ __html: mainMenu }}
          />
        </div>
      </div>
    </div>
  );
}
