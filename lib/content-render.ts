import 'server-only';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { prisma } from './prisma';
import { firstAttachmentBlobId } from './media';
import { mediaUrl } from './media-url';

/**
 * Server-side port of the Rails decorators + widget templates that generate the
 * cached `pages.content` HTML from the section/wrapper/widget composition.
 * Called when the admin publishes a page.
 */

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

type Json = Record<string, unknown>;

async function renderWidget(
  widgetId: bigint,
  name: string,
  json: Json,
  pageLanguage: string,
): Promise<string> {
  switch (name) {
    case 'headline': {
      const size = (json.size as string) || 'h2';
      if (json.style === 'with_icon') {
        return `<div class="section-title text-${esc(json.align)}">
  <${size} class="title with_icon">${esc(json.label)}</${size}>
  <span class="icon"><i class="${esc(json.icon)}"></i></span>
</div>`;
      }
      return `<${size}>${esc(json.label)}</${size}>`;
    }
    case 'text':
      return `<div class="text text-${esc(json.align)} ${esc(json.style)}">
  <p class="lead">${esc(json.text)}</p>
</div>`;
    case 'wysiwyg':
      return unescapeHtml(String(json.html ?? ''));
    case 'divide':
      return `<div class="divide${esc(json.size)}"></div>`;
    case 'image': {
      const blobId = await firstAttachmentBlobId('Widget', widgetId, 'attachments');
      if (!blobId) return '';
      return `<img src="${mediaUrl(blobId)}" alt="${esc(json.alt)}" class="img-responsive">`;
    }
    case 'gallery': {
      const galleryId = Number(json.gallery_id);
      const columns = Number(json.columns) || 3;
      if (!galleryId) return '';
      const items = await prisma.gallery_items.findMany({
        where: { gallery_id: BigInt(galleryId) },
        orderBy: { position: 'asc' },
      });
      const colClass = Math.round(12 / columns);
      let html = '<div class="gallery">\n  <div class="images">\n';
      for (let i = 0; i < items.length; i += columns) {
        const group = items.slice(i, i + columns);
        html += '    <div class="row no-gutters">\n';
        for (const item of group) {
          const blobId = await firstAttachmentBlobId('GalleryItem', item.id, 'image');
          const src = blobId ? mediaUrl(blobId) : '';
          html += `      <div class="bs-column col-md-${colClass}">
        <div class="gallery-item">
          <a href="${src}" title="${esc(item.label)}" class="image-link">
            <img src="${src}" alt="${esc(item.label)}" class="image img-responsive">
          </a>
        </div>
      </div>\n`;
        }
        html += '    </div>\n';
      }
      html += '  </div>\n</div>';
      return html;
    }
    case 'map': {
      const t = json.maptype === 'satellite' ? 'k' : '';
      return `<div class="map">
  <iframe width="100%" height="450" src="https://maps.google.com/maps?width=100%&amp;height=450&amp;hl=${esc(pageLanguage)}&amp;q=${encodeURIComponent(String(json.address ?? ''))}&amp;ie=UTF8&amp;t=${t}&amp;z=${esc(json.zoom)}&amp;iwloc=B&amp;output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
</div>`;
    }
    case 'yt_video':
      return `<div class="youtube-video align-${esc(json.align)}">
  <iframe width="${esc(json.width)}" height="${esc(json.height)}" src="${esc(json.url)}" frameborder="0" allowfullscreen></iframe>
</div>`;
    case 'icon_bucket': {
      let svg = '';
      try {
        const p = path.join(process.cwd(), 'public/assets/icons/svg', `${json.icon}.svg`);
        svg = fs.readFileSync(p, 'utf8');
      } catch {
        svg = '';
      }
      const openLink = json.link ? `<a href="${esc(json.link)}" title="${esc(json.headline)}">` : '';
      const closeLink = json.link ? '</a>' : '';
      return `<div class="col-services">
  ${openLink}
    <div class="icon">${svg}</div>
  ${closeLink}
  <div class="text">
    <h5 class="upper">${esc(json.headline)}</h5>
    <p>${esc(json.text)}</p>
  </div>
</div>`;
    }
    case 'steps': {
      const steps = (json.steps as Json[]) || [];
      let html = '<div class="steps">\n  <span class="timeline-border"></span>\n';
      steps.forEach((step, i) => {
        html += `  <div class="step ${i % 2 === 0 ? 'even' : ''}">
    <div class="icon-border"><i class="${esc(step.icon)}"></i></div>
    <h5 class="upper">${esc(step.title)}</h5>
    <p>${esc(step.text)}</p>
  </div>\n`;
      });
      html += '</div>';
      return html;
    }
    case 'testimonials': {
      const items = (json.testimonials as Json[]) || [];
      let html = `<div class="testimonials parallax">
  <div class="container inner text-center">
    <div class="section-title text-center bm20">
      <h2>${esc(json.title)}</h2>
      <span class="icon"><i class="icon-quote"></i></span>
    </div>
    <div id="testimonials" class="tab-container">\n`;
      items.forEach((t, i) => {
        html += `      <div id="tst${i}">${esc(t.text)}<span class="author">${esc(t.author)}</span></div>\n`;
      });
      html += '      <ul class="etabs">\n';
      items.forEach((_t, i) => {
        html += `        <li class="tab"><a href="#tst${i}">${i}</a></li>\n`;
      });
      html += '      </ul>\n    </div>\n  </div>\n</div>';
      return html;
    }
    case 'owl_portfolio': {
      const galleryId = Number(json.gallery_id);
      if (!galleryId) return '';
      const items = await prisma.gallery_items.findMany({
        where: { gallery_id: BigInt(galleryId) },
        orderBy: { position: 'asc' },
      });
      let html = '<div class="owl-portfolio owlcarousel carousel-th">\n';
      for (const item of items) {
        const blobId = await firstAttachmentBlobId('GalleryItem', item.id, 'image');
        const src = blobId ? mediaUrl(blobId) : '';
        const label = (item.label_i18n as Json)?.[pageLanguage] ?? item.label;
        const desc = (item.description_i18n as Json)?.[pageLanguage] ?? item.description;
        html += `  <div class="item">
    <figure class="icon-overlay medium icn-link"><img src="${src}" alt="${esc(item.label)}"></figure>
    <div class="image-caption">
      <h3>${esc(label)}</h3>
      <span class="meta">${esc(desc)}</span>
    </div>
  </div>\n`;
      }
      html += '</div>';
      return html;
    }
    case 'contact_form':
      return `<div class="contact-form-widget">
  <div class="success-message">${esc(json.success_message)}</div>
  <div class="error-message">Formulář se neodeslal.</div>
  <form action="/poslat-formular" method="post" class="contact-form needs-validation" data-remote="true" novalidate>
    ${json.target_email ? `<input type="hidden" name="target_email" value="${esc(json.target_email)}">` : ''}
    <div class="form-group">
      <label for="name">${esc(json.label_name || 'Vaše jméno')}</label>
      <input type="text" name="name" class="form-control" required>
    </div>
    <div class="form-group">
      <label for="email">${esc(json.label_email || 'Váš e-mail')}</label>
      <input type="email" name="email" class="form-control" required>
    </div>
    <div class="form-group">
      <label for="text">${esc(json.label_text || 'Váš text')}</label>
      <textarea name="text" class="form-control"></textarea>
    </div>
    <input type="submit" name="commit" value="Odeslat" class="btn btn-primary">
  </form>
</div>`;
    default:
      return '';
  }
}

async function renderPart(wrapperId: bigint, part: string, pageLanguage: string): Promise<string> {
  const items = await prisma.wrapper_widgets.findMany({
    where: { wrapper_id: wrapperId, part },
    orderBy: { position: 'asc' },
    include: { widgets: true },
  });
  let html = '';
  for (const item of items) {
    const w = item.widgets;
    let json: Json = {};
    try {
      json = w.json ? JSON.parse(w.json) : {};
    } catch {
      json = {};
    }
    html += await renderWidget(w.id, w.name ?? '', json, pageLanguage);
  }
  return html;
}

async function renderWrapper(
  wrapper: { id: bigint; name: string },
  pageLanguage: string,
): Promise<string> {
  switch (wrapper.name) {
    case 'two_columns':
      return `<div class="row">
  <div class="col-md-6">${await renderPart(wrapper.id, 'left_column', pageLanguage)}</div>
  <div class="col-md-6">${await renderPart(wrapper.id, 'right_column', pageLanguage)}</div>
</div>`;
    case 'three_columns':
      return `<div class="row">
  <div class="col-md-4">${await renderPart(wrapper.id, 'left_column', pageLanguage)}</div>
  <div class="col-md-4">${await renderPart(wrapper.id, 'center_column', pageLanguage)}</div>
  <div class="col-md-4">${await renderPart(wrapper.id, 'right_column', pageLanguage)}</div>
</div>`;
    case 'container_fluid':
    case 'one_column':
    default:
      return await renderPart(wrapper.id, 'column', pageLanguage);
  }
}

async function renderSection(
  section: { id: bigint; name: string; css_classes: string[] },
  pageLanguage: string,
): Promise<string> {
  const wrappers = await prisma.wrappers.findMany({
    where: { section_id: section.id },
    orderBy: { position: 'asc' },
  });
  let inner = '';
  for (const wrapper of wrappers) {
    inner += await renderWrapper(wrapper, pageLanguage);
  }
  const cls = (section.css_classes ?? []).join(' ');
  if (section.name === 'container_inner') {
    return `<section class="${cls}">
  <div class="container inner">
    ${inner}
  </div>
</section>`;
  }
  return `<section class="${cls}">
  ${inner}
</section>`;
}

/** Regenerates and persists page.content from the section composition. */
export async function renderPageContent(pageId: bigint): Promise<string> {
  const page = await prisma.pages.findUnique({ where: { id: pageId } });
  if (!page) return '';
  const sections = await prisma.sections.findMany({
    where: { page_id: pageId },
    orderBy: { position: 'asc' },
  });
  let html = '';
  for (const section of sections) {
    html += await renderSection(section, page.language);
  }
  return html;
}

export async function publishPageContent(pageId: bigint): Promise<void> {
  const content = await renderPageContent(pageId);
  await prisma.pages.update({
    where: { id: pageId },
    data: { content, updated_at: new Date() },
  });
}
