import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail, type ContactFormData } from '@/lib/mailer';
import { checkContactRateLimit, getClientIp } from '@/lib/contact-rate-limit';

const STATUS_PARAM = 'formular';

/** Redirects back to the page the form was submitted from, with a status flag. */
function redirectWithStatus(req: NextRequest, status: 'uspech' | 'chyba') {
  let target = new URL('/', req.url);
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === req.nextUrl.origin) target = refererUrl;
    } catch {
      // malformed referer — fall back to "/"
    }
  }
  target.searchParams.set(STATUS_PARAM, status);
  return NextResponse.redirect(target, { status: 303 });
}

/**
 * Plain (non-AJAX) form POST target for the contact_form widget — a normal
 * browser navigation, so the response is always a redirect back to the
 * originating page. The client picks up `?formular=uspech|chyba` on load and
 * shows the matching message (see ContactForm.init in application.js).
 */
export async function POST(req: NextRequest) {
  try {
    let data: ContactFormData;
    let honeypot = '';
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      data = body;
      honeypot = body.website ?? '';
    } else {
      const form = await req.formData();
      data = {
        name: form.get('name')?.toString(),
        email: form.get('email')?.toString(),
        text: form.get('text')?.toString(),
        target_email: form.get('target_email')?.toString(),
      };
      honeypot = form.get('website')?.toString() ?? '';
    }

    // Honeypot: a hidden field real visitors never see or fill. A bot that
    // fills it gets a fake success so it doesn't adapt, but nothing is sent.
    if (honeypot) return redirectWithStatus(req, 'uspech');

    const allowed = await checkContactRateLimit(getClientIp(req.headers));
    if (!allowed) return redirectWithStatus(req, 'chyba');

    await sendContactEmail(data);
    return redirectWithStatus(req, 'uspech');
  } catch (e) {
    console.error('contact form error', e);
    return redirectWithStatus(req, 'chyba');
  }
}
