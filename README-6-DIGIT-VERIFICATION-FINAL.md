# STEADFAST — 6-DIGIT VERIFICATION — NO FIREBASE CLOUD FUNCTIONS

This version removes the Firebase Cloud Functions dependency so the STEADFAST project does **not** require a Firebase Blaze upgrade just to run customer registration/verification.

## Customer flow

1. Customer opens Create Account.
2. Google reCAPTCHA v2 checkbox is completed.
3. The STEADFAST Gmail Bridge verifies the reCAPTCHA server-side.
4. Firebase Authentication creates the email/password account directly from the browser.
5. Firestore stores the customer profile and username alias.
6. The Gmail Bridge generates a fresh random 6-digit code and sends the branded STEADFAST email.
7. Customer enters the 6-digit code in the Store modal.
8. The Gmail Bridge verifies the code and securely marks `customerProfiles/{uid}.emailVerified = true`.
9. Firestore Rules use that profile verification state to gate purchases and eligible reviews.

The Firebase built-in verification-link email is not used by this flow.

## Important architecture change

There is **no Firebase Cloud Functions deployment** in this package. `firebase.json` contains Firestore and Storage rules only. The Store calls the existing Apps Script Web App through a small JSONP bridge. The Apps Script runs as the owner, validates Firebase ID tokens, verifies reCAPTCHA, generates/stores the verification code state, sends Gmail, and writes the verified profile field through the Firestore REST API.

Google documents JSONP support for Apps Script Content Service and notes that the response should contain only non-sensitive data; this bridge returns only status/error information.

## Apps Script — REQUIRED

Use the included:

`STEADFAST-GMAIL-BRIDGE.gs`

Also use the included manifest:

`appsscript.json`

### 1. Replace the Apps Script code

Replace the existing Apps Script source with the included `STEADFAST-GMAIL-BRIDGE.gs`.

If the Apps Script editor does not currently show the manifest file, enable **Project Settings → Show "appsscript.json" manifest file in editor**, then replace its contents with the included `appsscript.json`.

### 2. Add the reCAPTCHA secret as a Script Property

In Apps Script:

**Project Settings → Script Properties → Add script property**

Name:

`RECAPTCHA_SECRET_KEY`

Value: the **reCAPTCHA v2 Checkbox secret key** for the STEADFAST site.

Do not paste the secret into `store.js`, GitHub, or any public file. If the old secret was previously exposed, rotate it in Google reCAPTCHA before saving the replacement here.

### 3. Authorize the bridge

Save the script. Run:

`authorizeAndTest`

Approve the Gmail and external-request permissions when Google asks.

The script also needs Firestore REST access. The included manifest requests the `datastore` scope. The Google account executing the Web App must have access to the `steadfast-1d0e6` Firebase project.

### 4. Deploy/update the Web App

Deploy → Manage deployments → edit the existing Web App.

Use:

- Execute as: **Me**
- Who has access: **Anyone**

Keep the existing `/exec` URL.

### 5. Test the Gmail bridge

Run:

`testVerificationCodeEmail`

This sends the fixed test code `123456` to the admin email. This is only a Gmail delivery test; customer codes are generated randomly by the bridge.

## Firebase deployment

You only need to deploy Firestore Rules (and Storage Rules if you intentionally changed them). **Do not run `firebase deploy --only functions`.**

From the project root:

```bash
firebase login
firebase use steadfast-1d0e6
firebase deploy --only firestore:rules
```

## Cloudflare / GitHub

Push the revised website files to the GitHub repository connected to Cloudflare Pages. No Firebase Functions build is required.

After Cloudflare finishes, hard-refresh the Store:

`https://steadfast-cliffjandee.pages.dev/store.html?auth=login`

Use `Ctrl + Shift + R`.

## Verification behavior

- Every resend generates a **new random 6-digit code**.
- A previous code becomes invalid when a new one is issued.
- Codes expire after 10 minutes.
- Maximum 5 incorrect attempts per issued code.
- Resend has a short 15-second server-side anti-spam cooldown.
- The code is stored as a SHA-256 hash in Apps Script Properties, not as plain text.
- Only the server-side Apps Script can set `customerProfiles/{uid}.emailVerified` because the Firestore customer update rules explicitly block customers from changing verification fields.

## Expected success

After a correct code:

**Congratulations! Your email is verified.**

**Your email has been successfully verified. You can now purchase products on this page and submit eligible buyer reviews.**
