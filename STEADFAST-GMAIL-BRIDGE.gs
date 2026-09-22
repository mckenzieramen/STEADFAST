/**
 * STEADFAST Gmail Bridge — V5
 *
 * Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * IMPORTANT:
 * 1. Run authorizeAndTest() once manually from Apps Script while signed in as
 *    yahhclffjnd@gmail.com. Approve Gmail permission.
 * 2. Deploy/update the Web App after saving changes.
 *
 * The website never receives or stores the Gmail password.
 */

const ADMIN_EMAIL = 'yahhclffjnd@gmail.com';
const BRAND_NAME = 'STEADFAST by Cliff Jandee Medrano';
const DISCOUNT_TEXT = 'Exclusive offer: UP TO 75% OFF your website project, subject to final scope, review, and eligibility.';

function doGet(e) {
  return json_({
    ok: true,
    service: 'STEADFAST Gmail Bridge',
    status: 'ready',
    adminEmail: ADMIN_EMAIL
  });
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').trim();

    if (action === 'sendQuoteEmail') return sendQuoteEmail_(p);
    if (action === 'sendEmail') return sendAdminEmail_(p);
    if (action === 'paymentSubmitted') return sendPaymentSubmittedEmail_(p);
    if (action === 'paymentVerified') return sendPaymentVerifiedEmail_(p);
    if (action === 'health') return json_({ ok: true, service: 'STEADFAST Gmail Bridge', status: 'ready' });

    return json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/**
 * Run this function ONCE manually in Apps Script.
 * It forces the Gmail authorization prompt and sends a test email to the admin.
 */
function authorizeAndTest() {
  const subject = 'STEADFAST Gmail Bridge — Connection Test';
  const body = [
    'Hello Cliff,',
    '',
    'This is a connection test from the STEADFAST Gmail Bridge.',
    '',
    'If you received this email, Gmail sending is authorized and working.',
    '',
    'STEADFAST by Cliff Jandee Medrano'
  ].join('\n');

  GmailApp.sendEmail(ADMIN_EMAIL, subject, body, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL
  });

  return 'Test email sent to ' + ADMIN_EMAIL;
}

function sendQuoteEmail_(p) {
  console.log('STEADFAST quote notification received for ' + String(p.customerEmail || ''));
  const customerEmail = String(p.customerEmail || '').trim();
  const customerName = String(p.customerName || 'there').trim();
  const websiteType = String(p.websiteType || 'Website').trim();
  const scope = String(p.scope || '').trim();
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

  // ----- CUSTOMER AUTOMATIC CONFIRMATION -----
  const customerSubject = 'Your STEADFAST Website Quotation — Summary & 75% Offer';

  const customerText = [
    `Hello ${customerName},`,
    '',
    'Thank you for submitting your website quotation request to STEADFAST.',
    '',
    'We have received your quotation and saved it for review. Here is a summary of the information you submitted:',
    '',
    'QUOTATION SUMMARY',
    `Website type: ${websiteType}`,
    scope ? `Project scope: ${scope}` : '',
    `Estimated starting point: ${estimate} ${currency}`,
    country ? `Country / market: ${country}` : '',
    nextStep ? `Preferred next step: ${nextStep}` : '',
    '',
    'SELECTED ADD-ONS',
    addons || 'None selected',
    '',
    'PROJECT REQUIREMENTS',
    requirements || 'No additional requirements were provided.',
    '',
    'EXCLUSIVE STEADFAST OFFER',
    DISCOUNT_TEXT,
    '',
    'The discount is an offer for eligible projects and will be confirmed after reviewing the final scope and requirements.',
    '',
    'NEXT STEP',
    'You can simply reply to this email if you would like to continue by email or schedule a meeting.',
    '',
    `Reference: ${quoteId || 'Pending'}`,
    '',
    'Thank you,',
    'Cliff Jandee Medrano',
    BRAND_NAME
  ].filter(Boolean).join('\n');

  const customerHtml = buildCustomerQuoteHtml_(p, customerName, websiteType, scope, estimate, currency, country, nextStep, addons, requirements, quoteId);

  GmailApp.sendEmail(customerEmail, customerSubject, customerText, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL,
    htmlBody: customerHtml
  });

  // ----- ADMIN NOTIFICATION -----
  const adminSubject = `New Website Quotation — ${customerName}`;
  const adminText = [
    'A new STEADFAST website quotation was submitted.',
    '',
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    `Website: ${websiteType}`,
    `Scope: ${scope || '—'}`,
    `Estimate: ${estimate} ${currency}`,
    `Country: ${country || '—'}`,
    `Next step: ${nextStep}`,
    `Quote ID: ${quoteId || '—'}`,
    '',
    'Requirements:',
    requirements || '—',
    '',
    'Selected add-ons:',
    addons || 'None',
    '',
    'Customer was automatically sent the quotation summary and the current 75% promotional offer.'
  ].join('\n');

  GmailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminText, {
    name: BRAND_NAME,
    replyTo: customerEmail
  });

  return json_({
    ok: true,
    action: 'sendQuoteEmail',
    customerEmail: customerEmail,
    adminEmail: ADMIN_EMAIL,
    message: 'Customer confirmation and admin notification sent.'
  });
}


function sendPaymentSubmittedEmail_(p) {
  const customerEmail = String(p.customerEmail || '').trim();
  const customerName = String(p.customerName || 'there').trim();
  const productName = String(p.productName || 'your product').trim();
  const amount = String(p.amount || '0');
  const currency = String(p.currency || 'PHP');
  const orderId = String(p.orderId || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Invalid customer email.');
  const subject = `STEADFAST Payment Received for Verification — ${productName}`;
  const text = `Hello ${customerName},\n\nWe received your payment proof for ${productName}.\nAmount: ${amount} ${currency}\nOrder: ${orderId}\n\nYour payment is now being verified. We will email you again once the payment is confirmed and your product is unlocked.\n\nThank you,\n${BRAND_NAME}`;
  const html = buildPaymentSubmittedHtml_(customerName, productName, amount, currency, orderId);
  GmailApp.sendEmail(customerEmail, subject, text, {name: BRAND_NAME, replyTo: ADMIN_EMAIL, htmlBody: html});
  GmailApp.sendEmail(ADMIN_EMAIL, `Payment Proof Submitted — ${productName}`, `Customer: ${customerName}\nEmail: ${customerEmail}\nProduct: ${productName}\nAmount: ${amount} ${currency}\nOrder: ${orderId}`, {name: BRAND_NAME, replyTo: customerEmail});
  return json_({ok:true, action:'paymentSubmitted'});
}

function sendPaymentVerifiedEmail_(p) {
  const customerEmail = String(p.customerEmail || '').trim();
  const customerName = String(p.customerName || 'there').trim();
  const productName = String(p.productName || 'your product').trim();
  const amount = String(p.amount || '0');
  const currency = String(p.currency || 'PHP');
  const orderId = String(p.orderId || '').trim();
  const unlockUrl = String(p.unlockUrl || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Invalid customer email.');
  const subject = `Payment Verified — ${productName} is Ready`;
  const text = `Hello ${customerName},\n\nYour payment for ${productName} has been verified.\nAmount: ${amount} ${currency}\nOrder: ${orderId}\n\nAccess your product: ${unlockUrl || 'Open your STEADFAST order page to unlock your purchase.'}\n\nThank you,\n${BRAND_NAME}`;
  const html = buildPaymentVerifiedHtml_(customerName, productName, amount, currency, orderId, unlockUrl);
  GmailApp.sendEmail(customerEmail, subject, text, {name: BRAND_NAME, replyTo: ADMIN_EMAIL, htmlBody: html});
  return json_({ok:true, action:'paymentVerified'});
}

function buildPaymentSubmittedHtml_(name, product, amount, currency, orderId) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f7;padding:30px;color:#171717"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:32px"><h1 style="margin-top:0">Payment proof received ✓</h1><p>Hello ${htmlEscape_(name)},</p><p>We received your payment proof for <b>${htmlEscape_(product)}</b>.</p><div style="padding:18px;background:#f4f4f5;border-radius:12px"><b>${htmlEscape_(amount)} ${htmlEscape_(currency)}</b><br><small>Order: ${htmlEscape_(orderId)}</small></div><p>Your payment is now being verified. We will email you again once it is confirmed and your product is unlocked.</p><p>Thank you,<br><b>${htmlEscape_(BRAND_NAME)}</b></p></div></body></html>`;
}
function buildPaymentVerifiedHtml_(name, product, amount, currency, orderId, unlockUrl) {
  const button = unlockUrl ? `<p><a href="${htmlEscape_(unlockUrl)}" style="display:inline-block;background:#111;color:#fff;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700">Unlock / Access Product →</a></p>` : '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f7;padding:30px;color:#171717"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:32px"><h1 style="margin-top:0">Payment verified ✓</h1><p>Hello ${htmlEscape_(name)},</p><p>Your payment for <b>${htmlEscape_(product)}</b> has been verified.</p><div style="padding:18px;background:#f4f4f5;border-radius:12px"><b>${htmlEscape_(amount)} ${htmlEscape_(currency)}</b><br><small>Order: ${htmlEscape_(orderId)}</small></div>${button}<p>Thank you for your purchase.</p><p>${htmlEscape_(BRAND_NAME)}</p></div></body></html>`;
}

function sendAdminEmail_(p) {
  const to = String(p.to || '').trim();
  const subject = String(p.subject || 'Regarding your STEADFAST website quotation').trim();
  const body = String(p.body || '').trim();

  if (!/^\S+@\S+\.\S+$/.test(to)) throw new Error('Invalid recipient email.');
  if (!subject || !body) throw new Error('Subject and message are required.');

  GmailApp.sendEmail(to, subject, body, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL
  });

  return json_({ ok: true, action: 'sendEmail', to: to });
}

function buildCustomerQuoteHtml_(p, customerName, websiteType, scope, estimate, currency, country, nextStep, addons, requirements, quoteId) {
  const esc = htmlEscape_;
  const addonHtml = addons
    ? addons.split(/\n+/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')
    : '<li>None selected</li>';

  return `<!doctype html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#191722;line-height:1.6;">
  <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
    <div style="background:#fff;border:1px solid #e6e1f2;border-radius:18px;overflow:hidden;">
      <div style="padding:28px;background:#17131f;color:#fff;">
        <div style="font-size:12px;letter-spacing:2px;font-weight:700;color:#b9a2ff;">STEADFAST</div>
        <h1 style="margin:8px 0 0;font-size:24px;">Your Website Quotation</h1>
        <p style="margin:8px 0 0;color:#d8d2e2;">Thank you for your inquiry, ${esc(customerName)}.</p>
      </div>
      <div style="padding:28px;">
        <p>We received your quotation request. Here is the summary you submitted:</p>
        <div style="background:#faf9fd;border:1px solid #ebe7f4;border-radius:14px;padding:18px;margin:18px 0;">
          <p style="margin:0 0 8px;"><strong>Website type:</strong> ${esc(websiteType)}</p>
          ${scope ? `<p style="margin:0 0 8px;"><strong>Project scope:</strong> ${esc(scope)}</p>` : ''}
          <p style="margin:0 0 8px;"><strong>Estimated starting point:</strong> ${esc(estimate)} ${esc(currency)}</p>
          ${country ? `<p style="margin:0 0 8px;"><strong>Country / market:</strong> ${esc(country)}</p>` : ''}
          <p style="margin:0;"><strong>Preferred next step:</strong> ${esc(nextStep)}</p>
        </div>
        <h2 style="font-size:17px;margin:24px 0 8px;">Selected add-ons</h2>
        <ul style="padding-left:22px;">${addonHtml}</ul>
        <h2 style="font-size:17px;margin:24px 0 8px;">Project requirements</h2>
        <div style="white-space:pre-wrap;background:#faf9fd;border:1px solid #ebe7f4;border-radius:12px;padding:14px;">${esc(requirements || 'No additional requirements were provided.')}</div>
        <div style="margin:24px 0;padding:20px;border-radius:14px;background:#f0ebff;border:1px solid #d9ccff;">
          <div style="font-size:11px;letter-spacing:1.5px;font-weight:800;color:#6741d9;">EXCLUSIVE STEADFAST OFFER</div>
          <div style="font-size:24px;font-weight:800;margin:6px 0;">UP TO 75% OFF</div>
          <p style="margin:0;color:#4a435b;">This promotional offer is subject to final project scope, review, and eligibility.</p>
        </div>
        <p>If you would like to continue, simply reply to this email or request a meeting. We will be happy to discuss the project with you.</p>
        <p style="margin-bottom:0;">Thank you,<br><strong>Cliff Jandee Medrano</strong><br>${esc(BRAND_NAME)}</p>
        <p style="font-size:11px;color:#8b8499;margin-top:22px;">Quotation reference: ${esc(quoteId || 'Pending')}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function htmlEscape_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
