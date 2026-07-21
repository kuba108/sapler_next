import type { ResolvedPage } from '@/lib/pages';
import { rewriteContent } from '@/lib/content';
import { menuHtml } from '@/lib/menus';
import LanguageSwitcher from './LanguageSwitcher';
import HomeSlider from './HomeSlider';

function PageTitle({ page }: { page: NonNullable<ResolvedPage> }) {
  return (
    <>
      <div className="offset" />
      <div className="light-wrapper page-title">
        <div className="container inner">
          <div className="pull-left">
            <h1>{page.title}</h1>
          </div>
          <div className="pull-right">
            <LanguageSwitcher page={page} />
          </div>
        </div>
      </div>
    </>
  );
}

export default async function PageView({ page }: { page: NonNullable<ResolvedPage> }) {
  const content = rewriteContent(page.content);

  if (page.layout === 'home') {
    return (
      <>
        <PageTitle page={page} />
        <HomeSlider />
        <div id="main-content" dangerouslySetInnerHTML={{ __html: content }} />
      </>
    );
  }

  if (page.layout === 'products') {
    const categories = await menuHtml('product_categories_menu', page.language);
    return (
      <>
        <PageTitle page={page} />
        <div className="dark-wrapper">
          <div className="container inner">
            <div className="row classic-blog">
              <aside className="col-sm-4 sidebar left-sidebar">
                <div
                  className="sidebox widget"
                  dangerouslySetInnerHTML={{ __html: categories }}
                />
              </aside>
              <div
                className="col-sm-8 content lp30"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // default layout
  return (
    <>
      <PageTitle page={page} />
      <div id="main-content" dangerouslySetInnerHTML={{ __html: content }} />
    </>
  );
}
