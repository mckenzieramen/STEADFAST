# STEADFAST V47 — Custom HTML Customer Verification Email

## What changed

The customer verification email is no longer intended to be the generic Firebase email.

The flow is:

1. Customer creates a STEADFAST account in the Store.
2. Firebase Authentication creates the customer account.
3. The website calls `sendCustomerVerificationEmail`.
4. The Firebase Admin SDK generates the real verification action link securely on the server.
5. The Cloud Function sends that link to the existing STEADFAST Gmail Bridge.
6. The Gmail Bridge sends the branded HTML email from the authorized STEADFAST Gmail account.
7. Customer clicks **VERIFY MY EMAIL** in Gmail.
8. Firebase verifies the address and returns the customer to the STEADFAST Store.
9. Customer can sign in with username or email + password.

## One-time setup

### 1. Update the existing Apps Script

Open the existing `STEADFAST-GMAIL-BRIDGE.gs`, replace it with the revised file in this project, save it, then deploy a **new Web App version**.

Keep:

- Execute as: Me
- Who has access: Anyone

Run `authorizeAndTest()` once if Apps Script asks for Gmail authorization.

### 2. Deploy the Firebase Function

The included function is in `/functions`.

From the project root:

```bash
firebase login
firebase use steadfast-1d0e6
cd functions
npm install
cd ..
firebase deploy --only functions:sendCustomerVerificationEmail
```

The project must be on Firebase's Blaze plan to deploy Cloud Functions. Cloud Functions has a no-cost usage tier, but a billing account is required for the service.

### 3. Firebase Authentication

Make sure:

- Email/Password provider is enabled.
- `steadfast-cliffjandee.pages.dev` is an authorized domain.

### 4. Do NOT call `sendEmailVerification()` from the browser

The V47 browser flow intentionally does not use Firebase's built-in client email sender. The custom HTML email is sent through the STEADFAST Gmail Bridge after the server generates the legitimate Firebase verification link.
