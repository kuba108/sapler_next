import type { ResolvedPage } from '@/lib/pages';
import { pageLocales } from '@/lib/pages';

export default async function LanguageSwitcher({
  page,
}: {
  page: NonNullable<ResolvedPage>;
}) {
  const locales = await pageLocales(page);
  if (locales.length === 0) return null;
  return (
    <ul className="language-switcher">
      {locales.map((loc) => (
        <li key={loc.language}>
          <a href={`/${loc.permalink}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/icons/flags/${loc.language}.png`} alt={loc.language} />
          </a>
        </li>
      ))}
    </ul>
  );
}
