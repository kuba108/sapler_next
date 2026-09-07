/**
 * Decodes HTML entities in the `wysiwyg` widget's stored `html` value.
 *
 * Migrated Rails data stores that field HTML-entity-escaped (e.g. `&lt;p&gt;`
 * instead of `<p>`) — the original site rendering re-decoded it at publish
 * time. Widgets saved going forward via the Quill editor already emit raw
 * HTML with no entities, so this is a safe no-op on new data (order matters:
 * `&amp;` must decode last, or `&amp;lt;` would wrongly become `<`).
 */
export function unescapeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Parses a `widgets.json` value.
 *
 * The migrated Rails data is double JSON-encoded: the stored text is itself
 * a JSON string literal containing the widget's JSON (e.g. `"\"{\\\"size\\\":...}\""`),
 * so a single `JSON.parse` yields a string instead of an object. Parse again
 * in that case. Widgets saved going forward via the admin editor are written
 * with a single encoding (see `updateWidgetJson` in admin/pages/actions.ts),
 * so this stays correct for both legacy and new data.
 */
export function parseWidgetJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    let value: unknown = JSON.parse(raw);
    if (typeof value === 'string') {
      value = JSON.parse(value);
    }
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const PREVIEW_MAX_LENGTH = 40;

/** Short preview snippet of a widget's own content, shown in its collapsed header. */
export function widgetPreviewText(name: string, json: Record<string, unknown>): string {
  const str = (key: string): string => (typeof json[key] === 'string' ? (json[key] as string) : '');

  const text = (() => {
    switch (name) {
      case 'headline':
        return str('label');
      case 'text':
        return str('text');
      case 'wysiwyg':
        return stripHtml(unescapeHtmlEntities(str('html')));
      case 'icon_bucket':
        return str('headline') || str('text');
      case 'image':
        return str('alt');
      case 'divide':
        return str('size') ? `Mezera ${str('size')} px` : '';
      case 'gallery':
      case 'owl_portfolio':
        return str('gallery_id') ? `Galerie #${str('gallery_id')}` : '';
      case 'map':
        return str('address');
      case 'yt_video':
        return str('url');
      case 'testimonials':
        return str('title');
      case 'steps': {
        const steps = Array.isArray(json.steps) ? (json.steps as Record<string, unknown>[]) : [];
        return typeof steps[0]?.title === 'string' ? steps[0].title : '';
      }
      case 'contact_form':
        return str('target_email');
      default:
        return '';
    }
  })();

  return text.length > PREVIEW_MAX_LENGTH ? `${text.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…` : text;
}

/** Widget type metadata (labels from config/locales/models.cs.yml). */
export const WIDGET_TYPES: { name: string; label: string }[] = [
  { name: 'headline', label: 'Nadpis' },
  { name: 'text', label: 'Text' },
  { name: 'wysiwyg', label: 'HTML widget' },
  { name: 'image', label: 'Obrázek' },
  { name: 'gallery', label: 'Galerie' },
  { name: 'yt_video', label: 'YouTube video' },
  { name: 'icon_bucket', label: 'Blok s ikonou' },
  { name: 'steps', label: 'Časová osa' },
  { name: 'testimonials', label: 'Reference' },
  { name: 'owl_portfolio', label: 'Portfolio' },
  { name: 'contact_form', label: 'Kontaktní formulář' },
  { name: 'divide', label: 'Oddělovač' },
  { name: 'map', label: 'Mapa' },
];

export const WIDGET_LABELS: Record<string, string> = Object.fromEntries(
  WIDGET_TYPES.map((w) => [w.name, w.label]),
);

export const WRAPPER_TYPES: { name: string; label: string }[] = [
  { name: 'one_column', label: 'Jeden sloupec' },
  { name: 'two_columns', label: 'Dva sloupce' },
  { name: 'three_columns', label: 'Tři sloupce' },
];

export const SECTION_TYPES: { name: string; label: string }[] = [
  { name: 'basic', label: 'Základní sekce' },
  { name: 'container_inner', label: 'Kontainerová sekce' },
];

/** Column parts for each wrapper type. */
export const WRAPPER_PARTS: Record<string, string[]> = {
  one_column: ['column'],
  container_fluid: ['column'],
  two_columns: ['left_column', 'right_column'],
  three_columns: ['left_column', 'center_column', 'right_column'],
};

/** Default JSON for a freshly-created widget (matches json/*.json.erb with empty params). */
export function defaultWidgetJson(name: string): Record<string, unknown> {
  switch (name) {
    case 'headline':
      return { size: 'h2', align: 'left', style: '', label: '', icon: '' };
    case 'text':
      return { align: 'left', style: '', text: '' };
    case 'wysiwyg':
      return { html: '' };
    case 'divide':
      return { size: '20' };
    case 'image':
      return { alt: '', image: '' };
    case 'gallery':
      return { gallery_id: '', columns: '3' };
    case 'map':
      return { maptype: 'roadmap', language: 'cs', zoom: '14', address: '' };
    case 'yt_video':
      return { url: '', width: '560', height: '315', align: 'center' };
    case 'icon_bucket':
      return { headline: '', text: '', icon: '', link: '' };
    case 'steps':
      return { steps: [] };
    case 'testimonials':
      return {
        title: 'What think',
        icon: 'icon-quote',
        testimonials: [
          { text: 'Přání zákazníka 1', author: 'Kuba' },
          { text: 'Přání zákazníka 2', author: 'Tomas' },
          { text: 'Přání zákazníka 3', author: 'Jan' },
          { text: 'Přání zákazníka 4', author: 'Franta' },
        ],
      };
    case 'owl_portfolio':
      return { gallery_id: '' };
    case 'contact_form':
      return {
        target_email: '',
        success_message: '',
        label_name: '',
        label_email: '',
        label_text: '',
      };
    default:
      return {};
  }
}
