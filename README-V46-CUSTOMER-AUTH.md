# STEADFAST V46 — Customer Auth UI + Email Verification

## Customer sign-in
- Username OR Email
- Password
- Show/Hide password
- Verified email required

## Customer registration
- First Name
- Last Name
- Email
- Username
- Password
- Confirm Password
- “I'm not a robot” checkbox
- Verification email is sent after Firebase account creation.
- Customer must enter the 6-digit verification code before sign-in/purchase/review.

## Admin
Existing admin identity is preserved:
`yahhclffjnd@gmail.com`

## Important Firebase setting
Enable Authentication → Sign-in method → Email/Password.

Deploy the included `firestore.rules` to Firebase. The rules allow an authenticated but not-yet-verified customer to create only their own profile/username records so account registration can complete; purchases and reviews still require `email_verified == true`.

The “I'm not a robot” checkbox is a required UI confirmation. It is not a full Google reCAPTCHA challenge. A real reCAPTCHA can be added later if desired.

## V47 custom verification email

The customer verification email is now intended to be sent through the STEADFAST Gmail Bridge as a branded HTML email. The browser creates the Firebase customer account, then calls the `sendCustomerVerificationEmail` Cloud Function. The function uses the Firebase Admin SDK to generate the real verification action link and passes it to the Gmail Bridge. This avoids exposing Admin credentials in the browser and avoids using Firebase's generic verification-email template.
