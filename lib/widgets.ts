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
