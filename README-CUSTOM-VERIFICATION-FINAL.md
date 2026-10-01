# STEADFAST — Custom HTML Verification Email (Final Wiring)

This version wires the Store registration flow to the existing STEADFAST Gmail Bridge.

## Final customer flow

1. Customer completes First Name, Last Name, Email, Username, Password, Confirm Password, and reCAPTCHA.
2. `registerCustomer` verifies the reCAPTCHA token server-side.
3. Firebase Admin creates the Firebase Authentication account and customer profile/username records.
4. Firebase Admin generates the legitimate Firebase email-verification action link.
5. The function sends that link to the STEADFAST Gmail Bridge.
6. The Gmail Bridge sends the branded HTML STEADFAST email with the `VERIFY MY EMAIL →` button.
7. The customer verifies the address and returns to the Store.
8. Sign-in accepts either username or email plus password.
9. Unverified customers remain blocked from purchasing/reviews.
10. Resend uses the same branded Gmail Bridge instead of Firebase's generic browser email.

## One-time deployment

### A. Google Apps Script

Use the included `STEADFAST-GMAIL-BRIDGE.gs`. In Apps Script:

- Run `authorizeAndTest()` once while signed in as the Gmail account that owns the bridge.
- Approve Gmail permission if prompted.
- Deploy/update the Web App so the `/exec` URL points to the current code.
- Keep **Execute as: Me** and **Who has access: Anyone**.

The website/function is already wired to the existing bridge `/exec` URL from this project. If you create a different Web App deployment URL, update `BRIDGE_URL` in `firebase-functions/index.js` before deploying Firebase Functions.

### B. Firebase reCAPTCHA secret

Do **not** put the reCAPTCHA secret in GitHub. Configure it as a Firebase secret:

```bash
firebase login
firebase use steadfast-1d0e6
firebase functions:secrets:set RECAPTCHA_SECRET_KEY
```

Paste the reCAPTCHA v2 **Secret Key** only when Firebase CLI prompts for it.

### C. Deploy the Firebase Functions

From the project root:

```bash
cd firebase-functions
npm install
cd ..
firebase deploy --only functions:registerCustomer,functions:sendCustomerVerificationEmail
```

The project must meet Firebase's current Cloud Functions billing requirements.

### D. Firestore rules

Deploy the included rules if your Firebase console does not already contain the current version:

```bash
firebase deploy --only firestore:rules
```

## Important

- The Firebase built-in generic `sendEmailVerification()` browser call is no longer used by Store registration/resend.
- The real Firebase verification link is still generated server-side by Firebase Admin; the Gmail Bridge only delivers that link inside the branded HTML email.
- Gmail/Google spam filtering is controlled by Google, so no code can guarantee Inbox placement.
- Never commit the reCAPTCHA secret to GitHub.
