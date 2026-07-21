import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail, type ContactFormData } from '@/lib/mailer';

/**
 * Port of Rails MailsController#send_contact_form.
 * Accepts form-encoded or JSON body, returns the same JSON contract.
 */
export async function POST(req: NextRequest) {
  try {
    let data: ContactFormData;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await req.json();
    } else {
      const form = await req.formData();
      data = {
        name: form.get('name')?.toString(),
        email: form.get('email')?.toString(),
        text: form.get('text')?.toString(),
        target_email: form.get('target_email')?.toString(),
      };
    }

    await sendContactEmail(data);

    return NextResponse.json({
      result: 'success',
      id: 'contact_form_sent',
      msg: 'Formulář byl úspěšně odeslán.',
    });
  } catch (e) {
    console.error('contact form error', e);
    return NextResponse.json(
      {
        result: 'error',
        id: 'contact_form_sent',
        msg: 'Omlouváme se, formulář se nepovedlo odeslat. Zkuste to prosím znovu nebo nás kontaktujte jinou formou.',
      },
      { status: 422 },
    );
  }
}
