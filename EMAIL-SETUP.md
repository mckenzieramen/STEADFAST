# STEADFAST Custom Verification Email Setup

The Store registration flow uses the Firebase `registerCustomer` HTTPS function. That function creates the Firebase account/profile, generates the real Firebase verification link, and sends it to the STEADFAST Gmail Bridge. The Gmail Bridge sends the branded HTML email.

## 1. Google Apps Script

Use `STEADFAST-GMAIL-BRIDGE.gs` in the STEADFAST Gmail Bridge Apps Script project.

Deploy it as a Web App:
- Execute as: Me
- Who has access: Anyone

After changing the Apps Script code, create a new deployment or update the existing Web App deployment. Copy the Web App URL.

## 2. Firebase Functions bridge URL

From the `firebase-functions` directory, create `.env` with:

`STEADFAST_GMAIL_BRIDGE_URL="YOUR_APPS_SCRIPT_WEB_APP_URL"`

Do not commit `.env` to GitHub.

## 3. reCAPTCHA secret

Keep the v2 Checkbox secret in Firebase Functions Secret Manager as `RECAPTCHA_SECRET_KEY`. Do not put the secret in the website or GitHub.

## 4. Deploy Functions

```bash
cd firebase-functions
npm install
cd ..
firebase deploy --only functions:registerCustomer,functions:sendCustomerVerificationEmail
```

## 5. Deploy the static website

Deploy the updated `store.js` and the rest of the project to GitHub/Cloudflare Pages.

## Expected flow

Create Account -> reCAPTCHA -> Firebase `registerCustomer` -> Firebase creates account/profile -> Firebase generates verification link -> Gmail Bridge -> branded STEADFAST HTML email -> VERIFY MY EMAIL -> Firebase verifies -> return to STEADFAST -> sign in.
