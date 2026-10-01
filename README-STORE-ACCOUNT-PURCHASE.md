# STEADFAST Store Account & Purchase

Customer accounts use Firebase Email/Password Authentication. Customer registration uses the Store reCAPTCHA v2 checkbox, then creates the Firebase account directly from the browser.

Email verification is handled by the STEADFAST Gmail Bridge using a random 6-digit code. The server-side bridge stores the code hash, sends the branded email, and sets `customerProfiles/{uid}.emailVerified` only after a correct code.

Firestore Rules use that verified profile field to gate Store orders, checkout, and verified-buyer reviews. Customers cannot write the verification fields themselves.

No Firebase Cloud Functions are required for this customer flow.
