# STEADFAST — Cloudflare Deployment Fix

This build preserves the STEADFAST customer email-verification requirement and the Firebase application flow.

## Cloudflare Pages
- The legacy top-level `functions/` folder was removed because Cloudflare Pages automatically treats a top-level `functions/` directory as Pages Functions.
- Firebase Cloud Functions remain in `firebase-functions/`.
- `firebase.json` continues to point Firebase to `firebase-functions`.
- Build command: blank
- Build output directory: blank
- Root directory: blank
- Framework preset: None

## Firebase
Deploy the Firebase functions/rules separately with Firebase CLI as usual. The application still requires email verification before purchasing/reviewing.

## Favicon
A clean STEADFAST black/purple favicon is included in `assets/` and linked across the HTML pages, including the admin pages.

## reCAPTCHA
The v2 checkbox remains required for registration. The widget lifecycle was adjusted to avoid unnecessary re-rendering when switching between Sign in and Create account. Google may still present an image challenge depending on its risk assessment; site code cannot force Google to never show that challenge.
