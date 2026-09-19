/**
 * STEADFAST Gmail Bridge
 *
 * Deploy this Apps Script as a Web App.
 * Execute as: Me
 * Who has access: Anyone
 *
 * The website sends ordinary form-encoded POST data here. GmailApp sends
 * the message from the Google account that owns/deploys this script.
 */

const ADMIN_EMAIL = 'yahhclffjnd@gmail.com';
const BRAND_NAME = 'STEADFAST by Cliff Jandee Medrano';

function doGet() {
  return json_({ ok: true, service: 'STEADFAST Gmail Bridge', adminEmail: ADMIN_EMAIL });
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').trim();

    if (action === 'sendQuoteEmail') {
      return sendQuoteEmail_(p);
    }

    if (action === 'sendEmail') {
      return sendAdminEmail_(p);
    }

    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function sendQuoteEmail_(p) {
  const customerEmail = String(p.customerEmail || '').trim();
  const customerName = String(p.customerName || 'there').trim();
  const websiteType = String(p.websiteType || 'Website').trim();
  const estimate = String(p.estimate || '').trim();
  const currency = String(p.currency || '').trim();
  const country = String(p.country || '').trim();
  const requirements = String(p.requirements || '').trim();
  const nextStep = String(p.nextStep || 'Email discussion').trim();
  const addons = String(p.addons || '').trim();
  const quoteId = String(p.quoteId || '').trim();

  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) {
    throw new Error('Invalid customer email.');
  }

  const customerSubject = 'We received your STEADFAST website quotation';
  const customerBody = [
    `Hello ${customerName},`,
    '',
    'Thank you for submitting your website quotation request to STEADFAST.',
    '',
    'We have received your requirements and will review them before confirming the final scope and price.',
    '',
    'WEBSITE PROJECT',
    `Website type: ${websiteType}`,
    `Estimated starting point: ${estimate} ${currency}`,
    country ? `Country / market: ${country}` : '',
    nextStep ? `Preferred next step: ${nextStep}` : '',
    '',
    'HUGE DISCOUNT AVAILABLE',
    'Your project may qualify for UP TO 50% OFF, subject to final review and eligibility.',
    '',
    requirements ? `Project requirements:\n${requirements}` : '',
    addons ? `Selected add-ons:\n${addons}` : '',
    '',
    'You can reply directly to this email if you would like to continue the conversation or request a meeting.',
    '',
    'Thank you,',
    'Cliff Jandee Medrano',
    BRAND_NAME
  ].filter(Boolean).join('\n');

  GmailApp.sendEmail(customerEmail, customerSubject, customerBody, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL
  });

  const adminSubject = `New Website Quotation — ${customerName}`;
  const adminBody = [
    'A new STEADFAST website quotation was submitted.',
    '',
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Website: ${websiteType}`,
    `Estimate: ${estimate} ${currency}`,
    `Country: ${country}`,
    `Next step: ${nextStep}`,
    `Quote ID: ${quoteId}`,
    '',
    'Requirements:',
    requirements || '—',
    '',
    'Selected add-ons:',
    addons || 'None'
  ].join('\n');

  GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminBody, {
    name: BRAND_NAME,
    replyTo: customerEmail
  });

  return json_({ ok: true, action: 'sendQuoteEmail' });
}

function sendAdminEmail_(p) {
  const to = String(p.to || '').trim();
  const subject = String(p.subject || 'STEADFAST Website Quotation').trim();
  const body = String(p.body || '').trim();

  if (!/^\S+@\S+\.\S+$/.test(to)) throw new Error('Invalid recipient email.');
  if (!subject || !body) throw new Error('Subject and message are required.');

  GmailApp.sendEmail(to, subject, body, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL
  });

  return json_({ ok: true, action: 'sendEmail', to: to });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
