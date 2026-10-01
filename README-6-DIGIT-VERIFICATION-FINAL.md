# STEADFAST — FINAL 6-Digit Email Verification

This package replaces the old Firebase email-verification-link flow with a 6-digit code flow.

## Customer flow

1. Customer creates an account.
2. reCAPTCHA v2 is checked server-side.
3. Firebase creates the account and customer profile.
4. Firebase generates a one-time 6-digit code.
5. The code is sent to the **customer's registered email address** through the STEADFAST Gmail Bridge.
6. The Store page opens a verification modal:
   - Enter your 6-digit verification code
   - Verify Email
   - Resend Verification Code
7. Correct code marks the Firebase Auth account as `emailVerified`.
8. The success message says the customer can now purchase products on the page.
9. No verification-link email is used.

## Why this version is different

The Firebase Function no longer sends the verification-code request as a POST to the Apps Script Web App. It uses a signed GET request because Apps Script Web Apps can redirect POST requests. The Firebase Function now also returns a useful `unavailable` error containing the Bridge error instead of hiding a Bridge failure behind a generic `internal` error.

## Google Apps Script — REQUIRED

Use the included:

`STEADFAST-GMAIL-BRIDGE.gs`

Replace the old Apps Script source with this file.

Then:

1. Save.
2. Deploy → Manage deployments.
3. Edit the existing Web App deployment.
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Deploy/update the existing Web App.

Keep the existing `/exec` URL.

Then run the Apps Script function:

`testVerificationCodeEmail`

It sends a test code `123456` to the bridge owner's admin email.

## Firebase deployment

From the project root:

```bash
firebase login
firebase use steadfast-1d0e6
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
firebase deploy --only functions
```

Do not put the reCAPTCHA secret in GitHub.

## Website deployment

Upload/push the root website files to the GitHub repository connected to Cloudflare Pages.

After Cloudflare finishes deploying, use:

`https://steadfast-cliffjandee.pages.dev/store.html?auth=login`

Hard refresh with:

`Ctrl + Shift + R`

## Expected UI

The old UI:

- Verify your email first
- verification link
- VERIFY MY EMAIL

is not part of this final flow.

The new UI is:

**Enter your 6-digit verification code.**

`[  _ _ _ _ _ _ ]`

**Verify Email**

**Resend Verification Code**

After a correct code:

**Congratulations! Your email is verified.**

**Your email has been successfully verified. You can now purchase products on this page and submit eligible buyer reviews.**

## Notes

- Codes expire after 10 minutes.
- Maximum 5 incorrect attempts.
- Resend is throttled to about once per minute.
- The verification code is stored as a SHA-256 hash in Firestore, not as plain text.
- Gmail spam placement is controlled by Gmail and cannot be guaranteed by code.
