# STEADFAST — NO-BLAZE DEPLOYMENT

This package intentionally does **not** use Firebase Cloud Functions. Do not upgrade Firebase to Blaze for this customer verification flow.

## Deploy order

1. Update and authorize `STEADFAST-GMAIL-BRIDGE.gs` in Google Apps Script.
2. Add `RECAPTCHA_SECRET_KEY` to Apps Script Script Properties.
3. Deploy/update the Apps Script Web App as **Execute as Me / Anyone** and keep the existing `/exec` URL.
4. Test `testVerificationCodeEmail`.
5. From the project root, deploy only Firestore Rules:

```bash
firebase login
firebase use steadfast-1d0e6
firebase deploy --only firestore:rules
```

6. Push the website files to the GitHub repository connected to Cloudflare Pages.

There is **no** `firebase deploy --only functions` step in this package.
