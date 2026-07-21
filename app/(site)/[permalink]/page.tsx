import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { resolveRoute, pageMeta } from '@/lib/pages';
import { appConfig } from '@/lib/app-config';
import SiteShell from '@/components/site/SiteShell';
import PageView from '@/components/site/PageView';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ permalink: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { permalink } = await params;
  const res = await resolveRoute(decodeURIComponent(permalink));
  if (res.kind !== 'page') return { title: appConfig.tabTitle };
  const meta = await pageMeta(res.page);
  return {
    title: `${meta.title} | ${appConfig.tabTitle}`,
    description: meta.metaDescription,
    keywords: meta.metaKeywords,
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      type: 'website',
      url: meta.ogUrl,
      images: meta.ogImage ? [meta.ogImage] : undefined,
    },
  };
}

export default async function PermalinkPage({ params }: Props) {
  const { permalink } = await params;
  const res = await resolveRoute(decodeURIComponent(permalink));
  if (res.kind === 'redirect') permanentRedirect(`/${res.permalink}`);
  if (res.kind !== 'page') notFound();

  return (
    <SiteShell lang={res.page.language}>
      <PageView page={res.page} />
    </SiteShell>
  );
}
