STEADFAST customer auth — changed files only

Changed:
- store.html — removes Remember me; uses one Username / Email field on Sign In; adds real Google reCAPTCHA v2 checkbox on Create account.
- store.js — removes Remember Me persistence logic; verifies reCAPTCHA token before creating an account.
- styles.css — removes Remember Me styling and adds captcha styling.
- firestore.rules — allows the newly authenticated customer to create their own username alias and profile before email verification; purchase/review rules remain verification-gated.
- functions/index.js — adds server-side verifyCustomerHuman callable function and preserves custom verification email function.

REQUIRED ONE-TIME CAPTCHA CONFIGURATION:
1. Create a Google reCAPTCHA v2 Checkbox site key for your STEADFAST domain.
2. Put the site key in store.html / window.STEADFAST_RECAPTCHA_SITE_KEY (replace the placeholder).
3. Put the matching secret key in functions/.env as:
   RECAPTCHA_SECRET_KEY=YOUR_SECRET_KEY
4. Deploy the function and publish firestore.rules.

Do not commit a real reCAPTCHA secret key to GitHub.
