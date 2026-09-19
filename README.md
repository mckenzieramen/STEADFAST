STEADFAST ADMIN AUTH — INITIAL SECURE LOGIN BUILD

Authorized admin email configured in the frontend allowlist:
yahhclffjnd@gmail.com

Important:
1. Create/open the STEADFAST Firebase project.
2. Enable Authentication > Sign-in method > Google.
3. Register this web app in Firebase and copy its Web App config.
4. Replace the PASTE_FIREBASE_* placeholders in auth.js and dashboard.js.
5. Configure Firebase/Firestore security rules before storing live quotations or customer data.
6. Add the authorized email as an allowed admin in your backend/rules as well; the frontend allowlist is not sufficient by itself for production security.

The UI and JavaScript navigation are included. Gmail OAuth and Firestore data are intentionally not faked; they require the real Firebase project credentials and OAuth configuration.
