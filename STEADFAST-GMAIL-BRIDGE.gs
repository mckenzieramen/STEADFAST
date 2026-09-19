/**
 * STEADFAST Gmail Bridge
 *
 * Deploy this file as a Google Apps Script Web App while signed in to the Gmail
 * account that should send STEADFAST mail (for now: yahhclffjnd@gmail.com).
 *
 * The website never receives your Gmail password or OAuth refresh token.
 * GmailApp uses the Google authorization granted to this Apps Script project.
 */
const ADMIN_EMAIL = 'yahhclffjnd@gmail.com';
const BRAND_NAME = 'STEADFAST by Cliff Jandee Medrano';

function doGet() {
  return json_({ ok: true, service: 'STEADFAST Gmail Bridge' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e?.postData?.contents || '{}');
    const action = payload.action || '';

    if (action === 'quoteReceived') {
      const q = payload.quote || {};
      const adminSubject = `New STEADFAST Website Quote — ${q.customerName || 'New customer'}`;
      const adminBody = [
        'A new website quotation was submitted on STEADFAST.', '',
        `Customer: ${q.customerName || ''}`,
        `Email: ${q.customerEmail || ''}`,
        `Phone: ${q.phone || ''}`,
        `Company: ${q.company || ''}`,
        `Website: ${q.service || ''}`,
        `Project size: ${q.scope || ''}`,
        `Estimate: ${q.estimate || ''}`,
        `Currency: ${q.currency || ''}`,
        `Country: ${q.country || ''}`,
        `Next step: ${q.preferredNextStep || ''}`, '',
        'Requirements:', q.requirements || '(none)', '',
        'Selected add-ons:', (q.addons || []).join('\n') || '(none)', '',
        'This notification was sent by the STEADFAST Gmail Bridge.'
      ].join('\n');
      GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminBody, { name: BRAND_NAME, replyTo: q.customerEmail || ADMIN_EMAIL });

      if (q.customerEmail) {
        const customerSubject = 'We received your STEADFAST website quotation';
        const customerBody = [
          `Hi ${q.customerName || 'there'},`, '',
          'Thank you for submitting your website quotation request to STEADFAST.', '',
          'We have received your requirements and will review them before confirming the final scope and price.', '',
          '🎉 HUGE DISCOUNT AVAILABLE',
          'Your project may qualify for UP TO 50% OFF, subject to final review and eligibility.', '',
          'You can reply directly to this email if you would like to continue the conversation or request a meeting.', '',
          'Thank you,',
          'Cliff Jandee Medrano',
          BRAND_NAME
        ].join('\n');
        GmailApp.sendEmail(q.customerEmail, customerSubject, customerBody, { name: BRAND_NAME, replyTo: ADMIN_EMAIL });
      }
      return json_({ ok: true, action });
    }

    if (action === 'sendEmail') {
      const to = String(payload.to || '').trim();
      const subject = String(payload.subject || '').trim();
      const body = String(payload.body || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(to) || !subject || !body) throw new Error('Missing or invalid email fields.');
      GmailApp.sendEmail(to, subject, body, { name: BRAND_NAME, replyTo: ADMIN_EMAIL });
      return json_({ ok: true, action, to });
    }

    throw new Error('Unknown action.');
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
