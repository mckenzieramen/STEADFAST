# STEADFAST Registration CORS Fix

Registration now uses an explicit HTTPS Cloud Function endpoint with CORS handling.

Firebase Functions source: `firebase-functions/`

Deploy from the project root:

```bash
firebase deploy --only functions:registerCustomer
```

If the Firebase CLI asks for authentication, run `firebase login` first.

After the function deploy succeeds, push the website files to GitHub so Cloudflare Pages can deploy the updated `store.js`.

Do not restore the old top-level `functions/` directory; Cloudflare Pages detects that directory as a Pages Functions folder.
