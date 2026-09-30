const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2/options');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

const BRIDGE_URL = process.env.STEADFAST_GMAIL_BRIDGE_URL || '';
const CONTINUE_URL = 'https://steadfast-cliffjandee.pages.dev/store.html?verified=1';
const recaptchaSecret = defineSecret('RECAPTCHA_SECRET_KEY');

exports.sendCustomerVerificationEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to request a verification email.');
  }

  if (!BRIDGE_URL) {
    throw new HttpsError('failed-precondition', 'STEADFAST Gmail Bridge URL is not configured.');
  }

  const email = String(request.auth.token.email || '').trim().toLowerCase();
  const uid = String(request.auth.uid || '').trim();
  if (!email || !uid) {
    throw new HttpsError('invalid-argument', 'Customer account information is incomplete.');
  }

  const profileSnap = await admin.firestore().doc(`customerProfiles/${uid}`).get();
  const profile = profileSnap.exists ? profileSnap.data() : {};
  const firstName = String(request.data?.firstName || profile.firstName || '').trim();
  const lastName = String(request.data?.lastName || profile.lastName || '').trim();

  const user = await admin.auth().getUser(uid);
  if (user.email !== email) {
    throw new HttpsError('permission-denied', 'The signed-in account does not match the customer email.');
  }

  if (user.emailVerified) {
    return { ok: true, alreadyVerified: true };
  }

  const verificationUrl = await admin.auth().generateEmailVerificationLink(email, {
    url: CONTINUE_URL,
    handleCodeInApp: false
  });

  const body = new URLSearchParams({
    action: 'sendVerificationEmail',
    customerEmail: email,
    firstName,
    lastName,
    verificationUrl
  }).toString();

  const response = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  });

  const raw = await response.text();
  let bridgeResult;
  try {
    bridgeResult = JSON.parse(raw);
  } catch (_) {
    bridgeResult = { ok: false, error: raw || 'The Gmail Bridge returned an invalid response.' };
  }

  if (!response.ok || !bridgeResult.ok) {
    console.error('Gmail Bridge verification email failed:', response.status, bridgeResult);
    throw new HttpsError('internal', 'The STEADFAST verification email could not be sent.');
  }

  return { ok: true, sent: true };
});


exports.verifyCustomerHuman = onCall({ secrets: [recaptchaSecret] }, async (request) => {
  const token = String(request.data?.token || '').trim();

  if (!token) {
    throw new HttpsError('invalid-argument', 'reCAPTCHA token is required.');
  }

  let secret = '';
  try {
    secret = String(recaptchaSecret.value() || '').trim();
  } catch (error) {
    console.error('RECAPTCHA_SECRET_KEY could not be loaded:', error);
    throw new HttpsError(
      'failed-precondition',
      'The STEADFAST reCAPTCHA server key is not configured in Firebase Functions. Configure RECAPTCHA_SECRET_KEY and redeploy the function.'
    );
  }

  if (!secret) {
    throw new HttpsError(
      'failed-precondition',
      'The STEADFAST reCAPTCHA server key is not configured in Firebase Functions. Configure RECAPTCHA_SECRET_KEY and redeploy the function.'
    );
  }

  let result;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ secret, response: token })
    });
    const raw = await response.text();
    try {
      result = JSON.parse(raw || '{}');
    } catch (_) {
      console.error('Unexpected response from Google reCAPTCHA:', response.status, raw);
      throw new HttpsError('unavailable', 'Google reCAPTCHA returned an unexpected response. Please try again.');
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('reCAPTCHA Google verification request failed:', error);
    throw new HttpsError('unavailable', 'The reCAPTCHA verification service could not be reached. Please try again.');
  }

  if (!result.success) {
    const codes = Array.isArray(result['error-codes']) ? result['error-codes'] : [];
    console.error('reCAPTCHA verification failed:', codes.length ? codes : result);
    const code = codes[0] || 'unknown-error';
    const messages = {
      'timeout-or-duplicate': 'The reCAPTCHA verification expired or was already used. Please check “I’m not a robot” again and submit immediately.',
      'invalid-input-secret': 'The reCAPTCHA server secret is invalid. Update RECAPTCHA_SECRET_KEY in Firebase Functions.',
      'invalid-input-response': 'The reCAPTCHA response was invalid. Please check “I’m not a robot” again.',
      'bad-request': 'Google rejected the reCAPTCHA verification request. Please try again.'
    };
    throw new HttpsError('permission-denied', messages[code] || `Google reCAPTCHA verification failed (${code}).`);
  }

  if (result.hostname && result.hostname !== 'steadfast-cliffjandee.pages.dev') {
    console.error('Unexpected reCAPTCHA hostname:', result.hostname);
    throw new HttpsError('permission-denied', `reCAPTCHA hostname mismatch: ${result.hostname}`);
  }

  return { ok: true };
});
