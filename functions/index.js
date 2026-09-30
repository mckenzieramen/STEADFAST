const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2/options');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

const BRIDGE_URL = process.env.STEADFAST_GMAIL_BRIDGE_URL || '';
const CONTINUE_URL = 'https://steadfast-cliffjandee.pages.dev/store.html?verified=1';

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
