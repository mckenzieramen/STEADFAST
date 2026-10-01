/**
 * STEADFAST Gmail Bridge — FINAL 6-Digit Verification
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

6-DIGIT VERIFICATION:
- Verification emails are sent to the customer's registered email address.
- The website never uses Firebase's generic verification-link email.
- Firebase calls this Web App's signed GET endpoint to send the code.
- Run testVerificationCodeEmail() after updating the Web App.
 */

const ADMIN_EMAIL = 'yahhclffjnd@gmail.com';
const BRAND_NAME = 'STEADFAST by Cliff Jandee Medrano';
const DISCOUNT_TEXT = 'Exclusive offer: UP TO 75% OFF your website project, subject to final scope, review, and eligibility.';
const FIREBASE_PROJECT_ID = 'steadfast-1d0e6';
const FIREBASE_API_KEY = 'AIzaSyD13MXR0ZQSjPJBxQKYPmsMKjl4yzU2hSs';
const VERIFICATION_PROPERTY_PREFIX = 'STEADFAST_VERIFY_';

function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').trim();
    const prefix = safeJsonpPrefix_(p.prefix);
    let result;

    if (action === 'health' || !action) {
      result = { ok: true, service: 'STEADFAST Gmail Bridge', status: 'ready', adminEmail: ADMIN_EMAIL };
    } else if (action === 'verifyRecaptcha') {
      result = verifyRecaptcha_(String(p.recaptchaToken || '').trim());
    } else if (action === 'sendVerificationCode') {
      result = sendCustomerVerificationCode_(p);
    } else if (action === 'verifyVerificationCode') {
      result = verifyCustomerVerificationCode_(p);
    } else {
      result = { ok: false, error: 'Unknown action.' };
    }

    return prefix ? jsonp_(prefix, result) : json_(result);
  } catch (err) {
    console.error(err);
    const result = { ok: false, error: String(err && err.message || err) };
    const prefix = safeJsonpPrefix_(e && e.parameter ? e.parameter.prefix : '');
    return prefix ? jsonp_(prefix, result) : json_(result);
  }
}

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').trim();

    if (action === 'sendQuoteEmail') return sendQuoteEmail_(p);
    if (action === 'sendEmail') return sendAdminEmail_(p);
    if (action === 'paymentSubmitted') return sendPaymentSubmittedEmail_(p);
    if (action === 'paymentVerified') return sendPaymentVerifiedEmail_(p);
    if (action === 'paymentFailed') return sendPaymentFailedEmail_(p);
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



function safeJsonpPrefix_(value) {
  const prefix = String(value || '').trim();
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(prefix) ? prefix : '';
}

function jsonp_(prefix, obj) {
  return ContentService
    .createTextOutput(prefix + '(' + JSON.stringify(obj) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function verifyRecaptcha_(token) {
  if (!token) throw new Error('Please complete the reCAPTCHA verification.');
  const secret = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET_KEY');
  if (!secret) throw new Error('The reCAPTCHA server secret is not configured in the STEADFAST Gmail Bridge.');
  const response = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    payload: { secret: secret, response: token },
    muteHttpExceptions: true
  });
  const body = JSON.parse(response.getContentText() || '{}');
  if (!body.success) {
    const codes = Array.isArray(body['error-codes']) ? body['error-codes'].join(', ') : '';
    throw new Error('reCAPTCHA verification was rejected by Google.' + (codes ? ' ' + codes : ''));
  }
  return { ok: true, human: true };
}

function lookupFirebaseUser_(idToken) {
  if (!idToken) throw new Error('Your sign-in session is missing. Please sign in again.');
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(FIREBASE_API_KEY);
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }),
    muteHttpExceptions: true
  });
  const body = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() !== 200 || !Array.isArray(body.users) || !body.users[0]) {
    throw new Error('Your sign-in session is no longer valid. Please sign in again.');
  }
  return body.users[0];
}

function makeVerificationCode_() {
  const seed = Utilities.getUuid() + ':' + new Date().getTime() + ':' + Math.random();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed, Utilities.Charset.UTF_8);
  let value = 0;
  for (let i = 0; i < 4; i++) value = (value * 256 + (bytes[i] & 0xff)) >>> 0;
  return String(value % 1000000).padStart(6, '0');
}

function hashVerificationCode_(uid, code) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(uid) + ':' + String(code),
    Utilities.Charset.UTF_8
  );
  return digest.map(function(b) {
    const v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function sendCustomerVerificationCode_(p) {
  const user = lookupFirebaseUser_(String(p.idToken || '').trim());
  const uid = String(user.localId || '').trim();
  const customerEmail = String(user.email || '').trim().toLowerCase();
  if (!uid || !/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('The signed-in customer account has no valid email address.');
  if (user.emailVerified === true) return { ok: true, sent: false, alreadyVerified: true };

  const props = PropertiesService.getScriptProperties();
  const key = VERIFICATION_PROPERTY_PREFIX + uid;
  const now = Date.now();
  let state = {};
  try { state = JSON.parse(props.getProperty(key) || '{}'); } catch (_) { state = {}; }
  if (state.sentAt && now - Number(state.sentAt) < 15000) {
    throw new Error('A verification code was just sent. Please wait a few seconds before requesting another one.');
  }

  const code = makeVerificationCode_();
  state = {
    codeHash: hashVerificationCode_(uid, code),
    expiresAt: now + 10 * 60 * 1000,
    sentAt: now,
    attempts: 0,
    email: customerEmail
  };
  props.setProperty(key, JSON.stringify(state));

  try {
    sendVerificationEmail_({
      customerEmail: customerEmail,
      firstName: String(p.firstName || user.displayName || 'there').trim().split(' ')[0],
      lastName: String(p.lastName || '').trim(),
      verificationCode: code
    });
  } catch (err) {
    props.deleteProperty(key);
    throw err;
  }

  return { ok: true, sent: true };
}

function verifyCustomerVerificationCode_(p) {
  const user = lookupFirebaseUser_(String(p.idToken || '').trim());
  const uid = String(user.localId || '').trim();
  const email = String(user.email || '').trim().toLowerCase();
  if (!uid || !email) throw new Error('The signed-in customer account is incomplete.');
  if (user.emailVerified === true) return { ok: true, verified: true, alreadyVerified: true };

  const code = String(p.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw new Error('Enter the complete 6-digit verification code.');

  const props = PropertiesService.getScriptProperties();
  const key = VERIFICATION_PROPERTY_PREFIX + uid;
  let state = {};
  try { state = JSON.parse(props.getProperty(key) || '{}'); } catch (_) { state = {}; }
  if (!state.codeHash) throw new Error('No active verification code was found. Please request a new code.');
  if (Date.now() > Number(state.expiresAt || 0)) {
    props.deleteProperty(key);
    throw new Error('This verification code has expired. Please request a new code.');
  }
  if (Number(state.attempts || 0) >= 5) {
    props.deleteProperty(key);
    throw new Error('Too many incorrect verification attempts. Please request a new code.');
  }

  if (hashVerificationCode_(uid, code) !== String(state.codeHash)) {
    state.attempts = Number(state.attempts || 0) + 1;
    props.setProperty(key, JSON.stringify(state));
    const remaining = Math.max(0, 5 - state.attempts);
    throw new Error(remaining ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many incorrect verification attempts. Please request a new code.');
  }

  markCustomerProfileVerified_(uid);
  props.deleteProperty(key);
  return { ok: true, verified: true };
}

function markCustomerProfileVerified_(uid) {
  const token = ScriptApp.getOAuthToken();
  const url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(FIREBASE_PROJECT_ID) + '/databases/(default)/documents/customerProfiles/' + encodeURIComponent(uid) + '?updateMask.fieldPaths=emailVerified&updateMask.fieldPaths=verifiedAt&updateMask.fieldPaths=updatedAt';
  const now = new Date().toISOString();
  const payload = {
    fields: {
      emailVerified: { booleanValue: true },
      verifiedAt: { timestampValue: now },
      updatedAt: { timestampValue: now }
    }
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    console.error(response.getContentText());
    throw new Error('The email code was correct, but STEADFAST could not save the verification status. Please try again.');
  }
}

function sendVerificationEmail_(p) {
  const customerEmail = String(p.customerEmail || '').trim();
  const firstName = String(p.firstName || 'there').trim();
  const lastName = String(p.lastName || '').trim();
  const verificationCode = String(p.verificationCode || '').trim();

  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Invalid customer email.');
  if (!/^\d{6}$/.test(verificationCode)) throw new Error('Invalid verification code.');

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'there';
  const subject = 'Your STEADFAST verification code';
  const text = [
    `Hello ${displayName},`,
    '',
    'Thank you for creating your STEADFAST customer account.',
    '',
    'Use the verification code below to verify your email address:',
    '',
    verificationCode,
    '',
    'This code expires in 10 minutes and can only be used once.',
    '',
    'If you did not create this account, you can safely ignore this email.',
    '',
    'Thank you,',
    'Cliff Jandee Medrano',
    BRAND_NAME
  ].join('\n');

  const html = buildCustomerVerificationHtml_(firstName, verificationCode);
  GmailApp.sendEmail(customerEmail, subject, text, {
    name: BRAND_NAME,
    replyTo: ADMIN_EMAIL,
    htmlBody: html
  });

  return json_({ ok: true, action: 'sendVerificationCode', customerEmail });
}

function testVerificationCodeEmail() {
  const code = '123456';
  const p = {
    customerEmail: ADMIN_EMAIL,
    firstName: 'Cliff',
    lastName: 'Jandee Medrano',
    verificationCode: code
  };
  const result = sendVerificationEmail_(p);
  console.log(result);
  return '6-digit test email sent to ' + ADMIN_EMAIL + '. Test code: ' + code;
}

function buildCustomerVerificationHtml_(firstName, verificationCode) {
  const esc = htmlEscape_;
  const safeName = esc(firstName || 'there');
  const safeCode = esc(verificationCode);
  const logoUrl = 'https://steadfast-cliffjandee.pages.dev/assets/steadfast-mark.png';

  return `<!doctype html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your STEADFAST verification code</title></head>
<body style="margin:0;background:#f4f1fa;font-family:Arial,Helvetica,sans-serif;color:#17151d;line-height:1.6;">
  <div style="max-width:680px;margin:0 auto;padding:30px 14px;">
    <div style="background:#ffffff;border:1px solid #e7e1f2;border-radius:22px;overflow:hidden;">
      <div style="background:#0e0c13;padding:28px 30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;"><img src="${logoUrl}" width="52" height="52" alt="STEADFAST" style="display:block;border:0;border-radius:14px;"></td>
          <td style="padding-left:14px;vertical-align:middle;"><div style="font-size:18px;font-weight:800;letter-spacing:1.4px;color:#ffffff;">STEADFAST</div><div style="font-size:10px;letter-spacing:1.5px;color:#bca7ff;margin-top:3px;">BY CLIFF JANDEE MEDRANO</div></td>
        </tr></table>
      </div>
      <div style="padding:38px 32px 34px;">
        <div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#7a43ff;margin-bottom:10px;">STEADFAST CUSTOMER</div>
        <h1 style="margin:0;font-size:32px;line-height:1.12;color:#15131b;">Verify your email.</h1>
        <p style="font-size:16px;color:#5e586b;margin:20px 0 0;">Hello ${safeName},</p>
        <p style="font-size:16px;color:#5e586b;margin:10px 0 0;">Thank you for creating your STEADFAST customer account. Enter the verification code below to confirm that this email address belongs to you.</p>
        <div style="text-align:center;margin:30px 0;">
          <div style="display:inline-block;background:#f8f6fc;border:2px solid #8b3dff;border-radius:16px;padding:18px 30px;min-width:210px;">
            <div style="font-size:11px;letter-spacing:2px;font-weight:800;color:#7a43ff;margin-bottom:8px;">YOUR VERIFICATION CODE</div>
            <div style="font-size:38px;line-height:1.1;font-weight:900;letter-spacing:8px;color:#17131f;">${safeCode}</div>
          </div>
        </div>
        <div style="background:#f8f6fc;border:1px solid #e9e3f5;border-radius:14px;padding:18px 20px;margin-top:10px;">
          <div style="font-size:12px;font-weight:800;color:#6e667d;letter-spacing:.5px;">CODE EXPIRATION</div>
          <p style="font-size:14px;color:#5e586b;margin:8px 0 0;">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
        </div>
        <p style="font-size:13px;color:#8a8394;margin:24px 0 0;">If you did not create a STEADFAST account, you can safely ignore this email.</p>
        <p style="font-size:15px;color:#4d4758;margin:28px 0 0;">Thank you,<br><strong>Cliff Jandee Medrano</strong><br>STEADFAST by Cliff Jandee Medrano</p>
      </div>
      <div style="border-top:1px solid #ece7f3;padding:20px 30px;background:#fbfaff;text-align:center;"><div style="font-size:11px;color:#8a8394;">STEADFAST • Digital Experiences &amp; Works</div><div style="font-size:10px;color:#aaa2b4;margin-top:5px;">© 2026 STEADFAST</div></div>
    </div>
  </div>
</body></html>`;
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
  const accessUsername = String(p.accessUsername || '').trim();
  const accessPassword = String(p.accessPassword || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Invalid customer email.');
  const subject = `Payment Verified — ${productName} is Ready`;
  const text = `Hello ${customerName},\n\nYour payment for ${productName} has been verified.\nAmount: ${amount} ${currency}\nOrder: ${orderId}\n\nAccess your product: ${unlockUrl || 'Open your STEADFAST order page to unlock your purchase.'}\n${accessUsername ? `\nUsername: ${accessUsername}` : ''}${accessPassword ? `\nPassword: ${accessPassword}` : ''}\n\nThank you,\n${BRAND_NAME}`;
  const html = buildPaymentVerifiedHtml_(customerName, productName, amount, currency, orderId, unlockUrl, accessUsername, accessPassword);
  GmailApp.sendEmail(customerEmail, subject, text, {name: BRAND_NAME, replyTo: ADMIN_EMAIL, htmlBody: html});
  return json_({ok:true, action:'paymentVerified'});
}

function sendPaymentFailedEmail_(p) {
  const customerEmail = String(p.customerEmail || '').trim();
  const customerName = String(p.customerName || 'there').trim();
  const productName = String(p.productName || 'your product').trim();
  const amount = String(p.amount || '0');
  const currency = String(p.currency || 'PHP');
  const orderId = String(p.orderId || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(customerEmail)) throw new Error('Invalid customer email.');
  const subject = `Payment Not Approved — ${productName}`;
  const text = `Hello ${customerName},\n\nYour payment proof for ${productName} was not approved.\nAmount: ${amount} ${currency}\nOrder: ${orderId}\n\nYour product remains locked. Please return to the STEADFAST Store and start a new payment if you would like to try again.\n\nThank you,\n${BRAND_NAME}`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f7;padding:30px;color:#171717"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:32px"><h1 style="margin-top:0">Payment not approved</h1><p>Hello ${htmlEscape_(customerName)},</p><p>We could not approve the payment proof for <b>${htmlEscape_(productName)}</b>.</p><div style="padding:18px;background:#f4f4f5;border-radius:12px"><b>${htmlEscape_(amount)} ${htmlEscape_(currency)}</b><br><small>Order: ${htmlEscape_(orderId)}</small></div><p>Your product remains locked. You can return to the STEADFAST Store and try again.</p><p>Thank you,<br><b>${htmlEscape_(BRAND_NAME)}</b></p></div></body></html>`;
  GmailApp.sendEmail(customerEmail, subject, text, {name: BRAND_NAME, replyTo: ADMIN_EMAIL, htmlBody: html});
  return json_({ok:true, action:'paymentFailed'});
}

function buildPaymentSubmittedHtml_(name, product, amount, currency, orderId) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f7;padding:30px;color:#171717"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:32px"><h1 style="margin-top:0">Payment proof received ✓</h1><p>Hello ${htmlEscape_(name)},</p><p>We received your payment proof for <b>${htmlEscape_(product)}</b>.</p><div style="padding:18px;background:#f4f4f5;border-radius:12px"><b>${htmlEscape_(amount)} ${htmlEscape_(currency)}</b><br><small>Order: ${htmlEscape_(orderId)}</small></div><p>Your payment is now being verified. We will email you again once it is confirmed and your product is unlocked.</p><p>Thank you,<br><b>${htmlEscape_(BRAND_NAME)}</b></p></div></body></html>`;
}
function buildPaymentVerifiedHtml_(name, product, amount, currency, orderId, unlockUrl, accessUsername, accessPassword) {
  const credentials = (accessUsername || accessPassword) ? `<div style="padding:18px;background:#f7f3ff;border:1px solid #e5d9ff;border-radius:12px;margin:18px 0"><b>Product access</b>${accessUsername ? `<br>Username: ${htmlEscape_(accessUsername)}` : ''}${accessPassword ? `<br>Password: ${htmlEscape_(accessPassword)}` : ''}</div>` : '';
  const button = unlockUrl ? `<p><a href="${htmlEscape_(unlockUrl)}" style="display:inline-block;background:#111;color:#fff;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700">Unlock / Access Product →</a></p>` : '';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5f5f7;padding:30px;color:#171717"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;padding:32px"><h1 style="margin-top:0">Payment verified ✓</h1><p>Hello ${htmlEscape_(name)},</p><p>Your payment for <b>${htmlEscape_(product)}</b> has been verified.</p><div style="padding:18px;background:#f4f4f5;border-radius:12px"><b>${htmlEscape_(amount)} ${htmlEscape_(currency)}</b><br><small>Order: ${htmlEscape_(orderId)}</small></div>${credentials}${button}<p>Thank you for your purchase.</p><p>${htmlEscape_(BRAND_NAME)}</p></div></body></html>`;
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
