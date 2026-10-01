# STEADFAST Admin — Google Login

## Folder
Put the `admin` folder beside your main `index.html`:

STEADFAST/
├── index.html
├── styles.css
├── script.js
├── assets/
└── admin/
    ├── index.html
    ├── styles.css
    ├── auth.js
    ├── dashboard.html
    ├── dashboard.css
    └── dashboard.js

## 1. Create/configure Firebase
In Firebase Console:
- Create/select your STEADFAST Firebase project.
- Add a Web App.
- Copy its Firebase configuration into BOTH:
  - `admin/auth.js`
  - `admin/dashboard.js`
- Enable Authentication > Sign-in method > Google.

## 2. Authorized account
The current authorized email is:

yahhclffjnd@gmail.com

If you use another work Gmail later, replace the email in BOTH JavaScript files.

## 3. Authorized domains
In Firebase Authentication > Settings > Authorized domains, add the exact domain where STEADFAST is hosted.

For GitHub Pages, this may be:
mckenzieramen.github.io

For a custom domain, add that exact domain too.

## 4. Open Admin
After deployment:

/admin/

Example:
https://YOUR-DOMAIN.com/admin/

## Important security note
The email allowlist in these files is the first access gate. For production Firestore data, also protect Firestore with Firebase Security Rules and/or Firebase custom admin claims. Do not place Gmail passwords, Firebase service-account keys, or other private credentials in frontend files.

## Gmail
For sending mail from a work Gmail account, use Google OAuth / Gmail API or an approved email service. Do not put the Gmail password in this website.

## Current state
The dashboard UI is ready, but the quotation/lead/CRM/Gmail data sections are intentionally placeholders until the real Firebase database and OAuth/API connections are configured.
