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



exports.registerCustomer = onCall({ secrets: [recaptchaSecret] }, async (request) => {
  const data = request.data || {};
  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const username = String(data.username || '').trim().toLowerCase();
  const password = String(data.password || '');
  const token = String(data.recaptchaToken || '').trim();

  if (!firstName || !lastName || !email || !username || !password || !token) {
    throw new HttpsError(
      'invalid-argument',
      'First Name, Last Name, Email, Username, Password, and reCAPTCHA verification are required.'
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Please enter a valid email address.');
  }

  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    throw new HttpsError(
      'invalid-argument',
      'Username must be 3–24 characters using letters, numbers, dot, underscore or hyphen.'
    );
  }

  if (password.length < 6) {
    throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.');
  }

  // The secret is a Firebase Functions secret. It must NEVER be sent to the browser.
  const secret = String(recaptchaSecret.value() || '').trim();
  if (!secret) {
    throw new HttpsError(
      'failed-precondition',
      'The STEADFAST reCAPTCHA server key is not configured in Firebase Functions.'
    );
  }

  // Verify the one-time v2 checkbox token with Google.
  let captcha;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ secret, response: token })
    });

    const raw = await response.text();

    try {
      captcha = JSON.parse(raw);
    } catch (_) {
      console.error('Google reCAPTCHA returned non-JSON:', response.status, raw);
      throw new HttpsError(
        'unavailable',
        'Google reCAPTCHA returned an unexpected response. Please try again.'
      );
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('registerCustomer reCAPTCHA request failed:', error);
    throw new HttpsError(
      'unavailable',
      'The reCAPTCHA verification service could not be reached. Please try again.'
    );
  }

  if (!captcha.success) {
    const codes = Array.isArray(captcha['error-codes']) ? captcha['error-codes'] : [];
    console.error('registerCustomer reCAPTCHA failed:', codes, captcha);

    const code = codes[0] || 'unknown-error';
    const messages = {
      'timeout-or-duplicate':
        'The reCAPTCHA verification expired or was already used. Please check “I’m not a robot” again and submit immediately.',
      'invalid-input-secret':
        'The Firebase reCAPTCHA server secret is invalid. Update RECAPTCHA_SECRET_KEY in Firebase Functions.',
      'invalid-input-response':
        'The reCAPTCHA response was invalid. Please check “I’m not a robot” again.',
      'bad-request':
        'Google rejected the reCAPTCHA verification request. Please try again.'
    };

    throw new HttpsError(
      'permission-denied',
      messages[code] || `Google reCAPTCHA verification failed (${code}).`
    );
  }

  if (captcha.hostname && captcha.hostname !== 'steadfast-cliffjandee.pages.dev') {
    throw new HttpsError(
      'permission-denied',
      `reCAPTCHA hostname mismatch: ${captcha.hostname}`
    );
  }

  const db = admin.firestore();
  const usernameRef = db.doc(`customerUsernames/${username}`);

  // Check username before creating the Auth account.
  const usernameSnap = await usernameRef.get();
  if (usernameSnap.exists) {
    throw new HttpsError(
      'already-exists',
      'That username is already taken. Please choose another username.'
    );
  }

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim()
    });
  } catch (error) {
    if (error?.code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        'That email already has a STEADFAST customer account. Please use Sign in.'
      );
    }

    console.error('registerCustomer createUser failed:', error);
    throw new HttpsError(
      'internal',
      error?.message || 'The STEADFAST account could not be created. Please try again.'
    );
  }

  const profileRef = db.doc(`customerProfiles/${userRecord.uid}`);

  // Save the account profile and username first. Admin SDK writes bypass Firestore
  // client rules, so customer registration cannot fail with "Missing or insufficient permissions".
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      tx.set(profileRef, {
        uid: userRecord.uid,
        firstName,
        lastName,
        email,
        username,
        createdAt: now,
        updatedAt: now
      });

      tx.set(usernameRef, {
        email,
        uid: userRecord.uid,
        createdAt: now,
        updatedAt: now
      });
    });
  } catch (error) {
    console.error('registerCustomer profile save failed:', error);

    // Roll back the Auth account because the permanent profile could not be saved.
    try {
      await admin.auth().deleteUser(userRecord.uid);
    } catch (rollbackError) {
      console.error('registerCustomer Auth rollback failed:', rollbackError);
    }

    throw new HttpsError(
      'internal',
      'The account could not be saved to the STEADFAST customer database. Please try again.'
    );
  }

  // Generate the real Firebase verification link.
  let verificationUrl;
  try {
    verificationUrl = await admin.auth().generateEmailVerificationLink(email, {
      url: CONTINUE_URL,
      handleCodeInApp: false
    });
  } catch (error) {
    console.error('registerCustomer verification link generation failed:', error);

    // The account/profile are already valid. Do not delete them just because mail generation failed.
    return {
      ok: true,
      email,
      username,
      emailSent: false,
      emailError:
        error?.message ||
        'The account was created, but the verification link could not be generated yet.'
    };
  }

  // Send the branded email through the existing Gmail Bridge.
  if (!BRIDGE_URL) {
    console.error('registerCustomer: STEADFAST_GMAIL_BRIDGE_URL is not configured.');
    return {
      ok: true,
      email,
      username,
      emailSent: false,
      emailError:
        'STEADFAST_GMAIL_BRIDGE_URL is not configured in Firebase Functions. The account was created successfully.'
    };
  }

  try {
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
      bridgeResult = {
        ok: false,
        error: raw || 'The Gmail Bridge returned an invalid response.'
      };
    }

    if (!response.ok || !bridgeResult.ok) {
      console.error(
        'Gmail Bridge verification email failed:',
        response.status,
        bridgeResult
      );

      return {
        ok: true,
        email,
        username,
        emailSent: false,
        emailError:
          bridgeResult.error ||
          `The Gmail Bridge returned HTTP ${response.status}. The account was created successfully.`
      };
    }
  } catch (error) {
    console.error('registerCustomer Gmail Bridge request failed:', error);

    return {
      ok: true,
      email,
      username,
      emailSent: false,
      emailError:
        error?.message ||
        'The account was created, but the verification email service could not be reached.'
    };
  }

  return {
    ok: true,
    email,
    username,
    emailSent: true
  };
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
