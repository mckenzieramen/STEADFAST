# STEADFAST V48 — Customer Login + Custom Gmail Verification

## Customer sign-in
- Sign in asks only for **Username / Email** and **Password**.
- Optional **Remember me** uses Firebase local persistence when checked and session persistence when unchecked.
- Username is resolved through `customerUsernames/{username}`.
- A verified email is required before the customer can purchase or review.
- Successful sign-in shows a STEADFAST success popup: **You can now purchase digital products.**

## Create account
Fields are exactly:
1. First Name
2. Last Name
3. Email
4. Username
5. Password
6. Confirm password
7. I'm not a robot

After registration, the browser creates the Firebase account and customer profile, then calls the Cloud Function `sendCustomerVerificationEmail`.

## Custom HTML verification email
Firebase's built-in email template editor is not used for the branded email because this project currently reports that template updates are unavailable. Instead:

1. Firebase Admin SDK generates the real verification action link.
2. The Cloud Function sends that link to the existing STEADFAST Gmail Bridge.
3. `STEADFAST-GMAIL-BRIDGE.gs` sends the branded HTML email with the **VERIFY MY EMAIL →** button.
4. The button points to the real Firebase verification action link.

### Gmail Bridge deployment
Keep the existing Apps Script Web App deployment and update its code with the `STEADFAST-GMAIL-BRIDGE.gs` from this package.

The Cloud Function reads `STEADFAST_GMAIL_BRIDGE_URL` from `functions/.env`.

### Cloud Function deployment
```bash
firebase login
firebase use steadfast-1d0e6
cd functions
npm install
cd ..
firebase deploy --only functions:sendCustomerVerificationEmail
```

The Firebase project must be configured for Cloud Functions deployment/billing according to Firebase's current requirements.

## Firestore
Use the included `firestore.rules`. The existing Admin identity remains the email-based Admin:
`yahhclffjnd@gmail.com`

## Testing order
1. Open Store.
2. Click Create account.
3. Fill the registration fields.
4. Submit and confirm the custom HTML email arrives in Gmail.
5. Click **VERIFY MY EMAIL →**.
6. Return to Store.
7. Sign in using either username or email + password.
8. Confirm the success popup appears.
9. Confirm Buy works only for verified customers.
