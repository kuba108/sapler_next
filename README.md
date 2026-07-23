# Sapler — Next.js 16 port

Přepis původní Rails aplikace (Sapler.cz) do **Next.js 16.2.10** (App Router, React 19,
TypeScript). Zachovává **stejnou databázi** i **stejné S3 úložiště obrázků** — žádná
migrace dat není potřeba. Web i administrace vypadají shodně s originálem (šablona
**Slowave** pro web, **Light Bootstrap Dashboard** pro admin), ale bez jQuery — vše
je moderní React / Server Actions.

## Stack

| Oblast        | Řešení |
|---------------|--------|
| Framework     | Next.js 16.2.10 (App Router), React 19, TypeScript |
| Databáze      | PostgreSQL `sapler_development` přes **Prisma 7** (`@prisma/adapter-pg`) — introspektované schéma, beze změn |
| Obrázky       | AWS S3 (stejný bucket jako Rails), Active Storage kompatibilní |
| Maily         | **Resend** |
| Auth (admin)  | bcrypt (kompatibilní s Devise hesly) + `jose` JWT session cookie |
| Styly/JS webu | Zkompilovaná Slowave SCSS + vendor JS bundle (viz `scripts/build-assets.mjs`) |

## Rychlý start

```bash
cd new_sapler
npm install
cp .env.example .env      # a doplňte hodnoty (viz níže)
npm run assets            # zkompiluje Slowave/admin CSS+JS a zkopíruje obrázky/fonty
npx prisma generate
npm run dev               # http://localhost:3000
```

### Vytvoření admin účtu pro přihlášení

Původní hesla v DB jsou bcrypt (Devise) — pokud neznáte heslo, vytvořte si vlastní:

```bash
node --env-file=.env scripts/create-admin.mjs admin@local heslo123
```

Přihlášení je na `/admin/prihlaseni`.

## Proměnné prostředí (`.env`)

| Proměnná | Popis |
|----------|-------|
| `DATABASE_URL` | `postgresql://user@localhost:5432/sapler_development` |
| `APP_NAME` | `sapler` nebo `plastic_slovakia` (branding, logo, patička) |
| `SESSION_SECRET` | tajný klíč pro podpis admin session cookie |
| `S3_REGION`, `S3_BUCKET_NAME` | AWS S3 (stejný bucket jako Rails, `eu-central-1`) |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | S3 přístup |
| `S3_PUBLIC` | `true` = veřejné URL bucketu, jinak presignované URL |
| `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_FALLBACK_EMAIL` | odesílání formulářů přes Resend |

## Jak to funguje

### Databáze beze změn
Prisma schéma (`prisma/schema.prisma`) je introspektované 1:1 z existující DB
(`prisma db pull`). Tabulky, sloupce ani data se nemění. BigInt PK jsou serializovány
při přechodu na klienta (`lib/prisma.ts#serialize`).

### Obrázky ze S3 bez migrace
Uložený HTML obsah stránek obsahuje absolutní URL Active Storage
(`https://www.sapler.cz/rails/active_storage/blobs/redirect/<signed_id>/<soubor>`).

- `lib/content.ts` přepíše absolutní hostitele na relativní cestu.
- `app/rails/active_storage/[...path]/route.ts` dekóduje `blob_id` ze signed_id
  (Rails MessageVerifier + Marshal — `lib/active-storage.ts`), najde `key`
  v `active_storage_blobs` a přesměruje na S3.
- Admin náhledy jdou přes `app/media/[id]/route.ts` (`/media/<blob_id>`).
- Nové uploady (`lib/media.ts`) zapisují do S3 i do `active_storage_blobs` /
  `active_storage_attachments`, takže zůstávají kompatibilní i s Rails.

### Veřejný web
- `app/(site)/` — root layout se Slowave styly + JS.
- `app/(site)/page.tsx` (home) a `app/(site)/[permalink]/page.tsx` — dynamické
  stránky. Routing replikuje Rails `RouteService` (home page, 301 redirecty,
  `lib/pages.ts`).
- Layouty `home` / `products` / `default`, menu z cache (`menus.content`),
  přepínač jazyků, metadata (page → Setting fallback), cookie lišta.

### Administrace (bez jQuery)
- `app/(devise)/` — přihlašovací obrazovka (stejný vzhled jako Devise).
- `app/(admin)/` — dashboard shell (Light Bootstrap Dashboard), sidebar podle ACL.
- Moduly: **Stránky** (composer sekce→sloupce→widgety + publikace HTML),
  **Menu** (stromový builder + cache HTML), **Galerie** (upload na S3, řazení),
  **Recenze**, **Uživatelé** + **editor práv (ACL)**, **Nastavení**.
- ACL / oprávnění (`lib/acl.ts`, `lib/acl-schema.ts`) přesně kopírují Pundit policy
  strukturu (`acl.policies[model][action]`).
- Ochrana `/admin/*` přes `proxy.ts` (Next 16 „Proxy" = middleware).
- Bootstrap dropdowny bez jQuery: `components/admin/BootstrapBehaviors.tsx`.

### Publikace stránky
`lib/content-render.ts` je TypeScript port Rails dekorátorů + widget šablon.
Vygeneruje `pages.content` HTML z kompozice sekcí/wrapperů/widgetů (všech 13 typů
widgetů) — spouští se tlačítkem „Uložit změny na stránce" v editoru.

## Přenos assetů

`npm run assets` (`scripts/build-assets.mjs`):
- zkompiluje `application.scss` (Slowave) → `public/assets/application.css`
- zkompiluje admin `manifest.scss` → `public/assets/admin.css` a devise → `devise.css`
- poskládá vendor JS bundle (jQuery + Slowave pluginy) → `public/assets/application.js`
  a převede jeho Rails lifecycle na události řízené Next.js
- zkopíruje obrázky, fonty a dokumenty z původního Rails projektu

Skript čte původní Rails projekt z nadřazené složky (`--rails-root <cesta>` pro jinou).

## Poznámky

- `S3_*` a `RESEND_API_KEY` je nutné doplnit pro obrázky a formuláře (bez nich web
  běží, jen obrázky/maily ne).
- WYSIWYG widget aktuálně edituje HTML v textovém poli; integrace Quill editoru
  (načteného v admin layoutu) je připravená k doplnění.
- Ověřeno v `npm run dev`. Projekt používá „multiple root layouts" (samostatný
  shell pro web a admin), takže neexistuje kořenový `app/layout.tsx` — je to
  podporovaný vzor Next.js.
