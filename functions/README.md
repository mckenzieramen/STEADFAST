# STEADFAST custom customer verification email

This function generates the real Firebase email-verification action link with the Firebase Admin SDK, then sends that link through the existing STEADFAST Gmail Bridge as a branded HTML email.

## Deploy

From the project root:

```bash
firebase login
firebase use steadfast-1d0e6
cd functions
npm install
cd ..
firebase deploy --only functions:sendCustomerVerificationEmail
```

The included `functions/.env` contains the existing STEADFAST Gmail Bridge web-app URL. If that bridge URL changes, update the environment file before deploying.

## Gmail Bridge

Update `STEADFAST-GMAIL-BRIDGE.gs` in the existing Apps Script project, save it, and deploy a new web-app version. The bridge now supports the `sendVerificationEmail` action and sends the branded HTML verification email from the authorized STEADFAST Gmail account.

## Firebase Console

Make sure `https://steadfast-cliffjandee.pages.dev` is an authorized Firebase Authentication domain and that Email/Password sign-in is enabled.
