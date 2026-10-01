const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2/options');
const crypto = require('crypto');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

const BRIDGE_URL = 'https://script.google.com/macros/s/AKfycbzit8ibUWLvji0-hM_PEAe9hLdahzRMp6FXTkTkK3LWUHOmv0I_0iddRCP55ypgmFQEGw/exec';
const CONTINUE_URL = 'https://steadfast-cliffjandee.pages.dev/store.html?verified=1';
const recaptchaSecret = defineSecret('RECAPTCHA_SECRET_KEY');

function makeVerificationCode_() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashVerificationCode_(uid, code) {
  return crypto.createHash('sha256').update(`${uid}:${code}`).digest('hex');
}

async function sendVerificationCode_(uid, email, firstName, lastName) {
  const db = admin.firestore();
  const registrationRef = db.doc(`customerRegistrations/${uid}`);
  const snap = await registrationRef.get();
  const existing = snap.exists ? snap.data() : {};
  const nowMs = Date.now();
  const sentAt = existing.verificationCodeSentAt;
  if (sentAt && typeof sentAt.toMillis === 'function' && nowMs - sentAt.toMillis() < 60000) {
    throw new HttpsError('resource-exhausted', 'A verification code was sent recently. Please wait about a minute before requesting another code.');
  }

  const code = makeVerificationCode_();
  const codeHash = hashVerificationCode_(uid, code);
  const expiresAt = admin.firestore.Timestamp.fromMillis(nowMs + 10 * 60 * 1000);

  await registrationRef.set({
    verificationCodeHash: codeHash,
    verificationCodeExpiresAt: expiresAt,
    verificationCodeSentAt: admin.firestore.FieldValue.serverTimestamp(),
    verificationCodeAttempts: 0,
    verificationEmailSent: false,
    verificationEmailError: '',
    status: 'pending_verification',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const body = new URLSearchParams({
    action: 'sendVerificationCode',
    customerEmail: email,
    firstName,
    lastName,
    verificationCode: code
  }).toString();

  const response = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  });
  const raw = await response.text();
  let bridgeResult;
  try { bridgeResult = JSON.parse(raw); }
  catch (_) { bridgeResult = { ok: false, error: raw || 'The Gmail Bridge returned an invalid response.' }; }

  if (!response.ok || !bridgeResult.ok) {
    await registrationRef.set({
      verificationEmailSent: false,
      verificationEmailError: String(bridgeResult.error || 'The STEADFAST verification email could not be sent.'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    throw new HttpsError('internal', 'The STEADFAST verification email could not be sent.');
  }

  await registrationRef.set({
    verificationEmailSent: true,
    verificationEmailError: '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { ok: true, sent: true };
}

exports.sendCustomerVerificationEmail = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in to request a verification code.');
  if (!BRIDGE_URL) throw new HttpsError('failed-precondition', 'STEADFAST Gmail Bridge URL is not configured.');

  const uid = String(request.auth.uid || '').trim();
  const email = String(request.auth.token.email || '').trim().toLowerCase();
  if (!email || !uid) throw new HttpsError('invalid-argument', 'Customer account information is incomplete.');

  const user = await admin.auth().getUser(uid);
  if (user.email !== email) throw new HttpsError('permission-denied', 'The signed-in account does not match the customer email.');
  if (user.emailVerified) return { ok: true, alreadyVerified: true };

  const profileSnap = await admin.firestore().doc(`customerProfiles/${uid}`).get();
  const profile = profileSnap.exists ? profileSnap.data() : {};
  const firstName = String(request.data?.firstName || profile.firstName || user.displayName?.split(' ')[0] || 'there').trim();
  const lastName = String(request.data?.lastName || profile.lastName || '').trim();
  return await sendVerificationCode_(uid, email, firstName, lastName);
});

exports.verifyCustomerEmailCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in before entering your verification code.');
  const uid = String(request.auth.uid || '').trim();
  const code = String(request.data?.code || '').trim();
  if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Enter the 6-digit verification code from your email.');

  const user = await admin.auth().getUser(uid);
  if (user.emailVerified) return { ok: true, verified: true, alreadyVerified: true };

  const db = admin.firestore();
  const registrationRef = db.doc(`customerRegistrations/${uid}`);
  const snap = await registrationRef.get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Your verification request could not be found. Please request a new code.');
  const data = snap.data() || {};
  const expiresAt = data.verificationCodeExpiresAt;
  const attempts = Number(data.verificationCodeAttempts || 0);
  if (attempts >= 5) throw new HttpsError('resource-exhausted', 'Too many incorrect verification attempts. Request a new code and try again.');
  if (!expiresAt || typeof expiresAt.toMillis !== 'function' || expiresAt.toMillis() < Date.now()) {
    throw new HttpsError('deadline-exceeded', 'This verification code has expired. Request a new code.');
  }

  const expectedHash = String(data.verificationCodeHash || '');
  const actualHash = hashVerificationCode_(uid, code);
  if (!expectedHash || actualHash !== expectedHash) {
    await registrationRef.set({
      verificationCodeAttempts: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    throw new HttpsError('invalid-argument', 'That verification code is incorrect. Please check the email and try again.');
  }

  await admin.auth().updateUser(uid, { emailVerified: true });
  await registrationRef.set({
    status: 'verified',
    verificationEmailSent: true,
    verificationCodeHash: admin.firestore.FieldValue.delete(),
    verificationCodeExpiresAt: admin.firestore.FieldValue.delete(),
    verificationCodeSentAt: admin.firestore.FieldValue.delete(),
    verificationCodeAttempts: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await db.doc(`customerProfiles/${uid}`).set({ emailVerified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true, verified: true };
});


exports.saveCustomerProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to save a customer profile.');
  }

  const uid = String(request.auth.uid || '').trim();
  const authEmail = String(request.auth.token.email || '').trim().toLowerCase();
  const firstName = String(request.data?.firstName || '').trim();
  const lastName = String(request.data?.lastName || '').trim();
  const email = String(request.data?.email || '').trim().toLowerCase();
  const username = String(request.data?.username || '').trim().toLowerCase();

  if (!uid || !authEmail) {
    throw new HttpsError('invalid-argument', 'Customer authentication information is incomplete.');
  }

  if (!firstName || !lastName) {
    throw new HttpsError('invalid-argument', 'First name and last name are required.');
  }

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid customer email is required.');
  }

  if (email !== authEmail) {
    throw new HttpsError('permission-denied', 'The customer email does not match the signed-in account.');
  }

  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/i.test(username)) {
    throw new HttpsError('invalid-argument', 'Invalid username. Use 3–32 letters, numbers, dots, underscores or hyphens.');
  }

  const db = admin.firestore();
  const profileRef = db.doc(`customerProfiles/${uid}`);
  const aliasRef = db.doc(`customerUsernames/${username}`);

  try {
    await db.runTransaction(async (tx) => {
      const aliasSnap = await tx.get(aliasRef);

      if (aliasSnap.exists) {
        const existing = aliasSnap.data() || {};
        if (String(existing.uid || '') !== uid) {
          throw new HttpsError('already-exists', 'That username is already taken. Please choose another.');
        }
      }

      tx.set(profileRef, {
        uid,
        firstName,
        lastName,
        email,
        username,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(aliasRef, {
        uid,
        email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('saveCustomerProfile failed:', error);
    throw new HttpsError('internal', 'Your account was created, but the customer profile could not be saved. Please try again.');
  }

  return { ok: true, uid, username };
});



exports.registerCustomer = onRequest({ secrets: [recaptchaSecret] }, async (req, res) => {
  const origin = String(req.get('origin') || '');
  const allowedOrigins = new Set([
    'https://steadfast-cliffjandee.pages.dev',
    'https://steadfast-cliffjandee.pages.dev/'
  ]);
  const allowOrigin = allowedOrigins.has(origin) ? origin : 'https://steadfast-cliffjandee.pages.dev';

  res.set('Access-Control-Allow-Origin', allowOrigin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, code: 'method-not-allowed', message: 'POST required.' });
  }

  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const username = String(data.username || '').trim().toLowerCase();
  const password = String(data.password || '');
  const token = String(data.recaptchaToken || '').trim();

  const fail = (status, code, message) => res.status(status).json({ ok: false, code, message });

  if (!firstName || !lastName || !email || !username || !password || !token) {
    return fail(400, 'invalid-argument', 'First Name, Last Name, Email, Username, Password, and reCAPTCHA verification are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(400, 'invalid-argument', 'Please enter a valid email address.');
  }
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return fail(400, 'invalid-argument', 'Username must be 3–24 characters using letters, numbers, dot, underscore or hyphen.');
  }
  if (password.length < 6) {
    return fail(400, 'invalid-argument', 'Password must be at least 6 characters.');
  }

  const secret = String(recaptchaSecret.value() || '').trim();
  if (!secret) {
    return fail(500, 'failed-precondition', 'The STEADFAST reCAPTCHA server key is not configured.');
  }

  let captcha;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ secret, response: token })
    });
    captcha = await response.json();
  } catch (error) {
    console.error('registerCustomer reCAPTCHA request failed:', error);
    return fail(503, 'unavailable', 'The reCAPTCHA verification service could not be reached. Please try again.');
  }

  if (!captcha.success) {
    const codes = Array.isArray(captcha['error-codes']) ? captcha['error-codes'] : [];
    console.error('registerCustomer reCAPTCHA failed:', codes, captcha);
    const code = codes[0] || 'unknown-error';
    const messages = {
      'timeout-or-duplicate': 'The reCAPTCHA verification expired or was already used. Please check “I’m not a robot” again and submit immediately.',
      'invalid-input-secret': 'The reCAPTCHA server secret is invalid. Update RECAPTCHA_SECRET_KEY in Firebase Functions.',
      'invalid-input-response': 'The reCAPTCHA response was invalid. Please check “I’m not a robot” again.',
      'bad-request': 'Google rejected the reCAPTCHA verification request. Please try again.'
    };
    return fail(403, 'permission-denied', messages[code] || `Google reCAPTCHA verification failed (${code}).`);
  }

  if (captcha.hostname && captcha.hostname !== 'steadfast-cliffjandee.pages.dev') {
    return fail(403, 'permission-denied', `reCAPTCHA hostname mismatch: ${captcha.hostname}`);
  }

  const db = admin.firestore();
  const usernameRef = db.doc(`customerUsernames/${username}`);
  const usernameSnap = await usernameRef.get();
  if (usernameSnap.exists) {
    return fail(409, 'already-exists', 'That username is already taken. Please choose another username.');
  }

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim()
    });
  } catch (error) {
    if (error && error.code === 'auth/email-already-exists') {
      return fail(409, 'already-exists', 'That email already has a STEADFAST customer account. Please use Sign in.');
    }
    console.error('registerCustomer createUser failed:', error);
    return fail(500, 'internal', 'The STEADFAST account could not be created. Please try again.');
  }

  const profileRef = db.doc(`customerProfiles/${userRecord.uid}`);
  const registrationRef = db.doc(`customerRegistrations/${userRecord.uid}`);

  // Save the account and profile first. Email delivery must never delete a successfully created account.
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async tx => {
      const latestAlias = await tx.get(usernameRef);
      if (latestAlias.exists && String(latestAlias.data()?.uid || '') !== userRecord.uid) {
        throw new Error('USERNAME_TAKEN_AFTER_CREATE');
      }
      tx.set(profileRef, {
        uid: userRecord.uid,
        firstName,
        lastName,
        email,
        username,
        createdAt: now,
        updatedAt: now
      }, { merge: true });
      tx.set(usernameRef, {
        email,
        uid: userRecord.uid,
        createdAt: now,
        updatedAt: now
      }, { merge: true });
      tx.set(registrationRef, {
        uid: userRecord.uid,
        email,
        username,
        firstName,
        lastName,
        status: 'pending_verification',
        verificationEmailSent: false,
        updatedAt: now
      }, { merge: true });
    });
  } catch (error) {
    console.error('registerCustomer profile storage failed:', error);
    try { await db.recursiveDelete(profileRef); } catch (_) {}
    try { await db.recursiveDelete(usernameRef); } catch (_) {}
    try { await db.recursiveDelete(registrationRef); } catch (_) {}
    try { await admin.auth().deleteUser(userRecord.uid); } catch (_) {}
    if (String(error?.message || '') === 'USERNAME_TAKEN_AFTER_CREATE') {
      return fail(409, 'already-exists', 'That username is already taken. Please choose another username.');
    }
    return fail(500, 'internal', 'Your account could not be saved. Please try again.');
  }

  let verificationSent = false;
  let verificationError = '';
  try {
    const result = await sendVerificationCode_(userRecord.uid, email, firstName, lastName);
    verificationSent = Boolean(result?.sent || result?.ok);
  } catch (error) {
    verificationError = String(error?.message || 'The verification email could not be sent.');
    console.error('registerCustomer verification code email failed:', error);
  }

  try {
    await registrationRef.set({
      verificationEmailSent: verificationSent,
      verificationEmailError: verificationSent ? '' : verificationError,
      status: verificationSent ? 'pending_verification' : 'created_email_pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('registerCustomer registration status update failed:', error);
  }

  return res.status(200).json({
    ok: true,
    email,
    username,
    verificationSent,
    message: verificationSent
      ? 'Account created successfully. Please verify your email before signing in.'
      : 'Account created and saved, but the verification email could not be sent yet.'
  });
});

exports.verifyCustomerHuman = onCall({ secrets: [recaptchaSecret] }, async (request) => {
  const token = String(request.data?.token || '').trim();
  const secret = String(recaptchaSecret.value() || '').trim();

  if (!token) {
    throw new HttpsError('invalid-argument', 'reCAPTCHA token is required.');
  }
  if (!secret) {
    throw new HttpsError('failed-precondition', 'The STEADFAST reCAPTCHA server key is not configured.');
  }

  let result;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ secret, response: token })
    });
    result = await response.json();
  } catch (error) {
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
