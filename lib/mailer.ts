import 'server-only';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type ContactFormData = {
  name?: string;
  email?: string;
  text?: string;
  target_email?: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Port of WebMailer#contact_email, sent through Resend. */
export async function sendContactEmail(data: ContactFormData): Promise<void> {
  if (!resend) throw new Error('RESEND_API_KEY is not configured');

  const name = escapeHtml(data.name ?? '');
  const email = escapeHtml(data.email ?? '');
  const text = escapeHtml(data.text ?? '').replace(/\n/g, '<br/>');

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      p { font-size: 14px; margin-bottom: 20px; }
      ul { margin-left: 0; padding: 0; }
      li { padding: 0; list-style: none; font-size: 14px; margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <h1>Formulář z web</h1>
    <p>Uživatel vyplnil na webu kontaktní formulář:</p>
    <ul>
      <li><strong>Vaše jméno:</strong> ${name}</li>
      <li><strong>E-mail:</strong> ${email}</li>
      <li><strong>Text:</strong><br/> ${text}</li>
    </ul>
  </body>
</html>`;

  const to = data.target_email || process.env.CONTACT_FALLBACK_EMAIL || 'info@sapler.cz';
  const from = process.env.RESEND_FROM || 'web@elegantniweb.cz';

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email || undefined,
    subject: 'Formulář z webu',
    html,
  });
  if (error) throw new Error(error.message);
}
