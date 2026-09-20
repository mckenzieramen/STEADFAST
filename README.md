
## V26 — Firebase Admin Auth Restore Fix
- Replaced dashboard auth bootstrap with explicit Firebase `initializeAuth` persistence using IndexedDB/local browser persistence.
- Prevents the admin header from staying indefinitely on “Checking account / Authenticating…”.
- Added an 8-second bounded auth-restore timeout with automatic return to Admin Login if Firebase cannot restore a session.
- Admin login uses the same persistent-auth initialization so the session survives navigation to the dashboard.
- Preserved V25 support-ticket layout, conversation width, status/merge controls, quote flow, and one-click logout behavior.

# STEADFAST — by Cliff Jandee Medrano

Premium portfolio/service website focused on **Web Solutions**, with separate **Admin Support** and **Customer Service** service routes.

## Routes
- `index.html` — Home, services, smart quote builder, contact
- `about.html` — Cliff's profile, experience, tools, faith & purpose
- `web-solutions.html` — primary web development/service page
- `admin-support.html` — dedicated admin support service page
- `customer-service.html` — dedicated customer service page
- `project.html` — McKenzie Ramen House case study
- `reviews.html` — reviews
- `404.html` — not found page

## Smart Quote Builder
- Detects visitor country/currency through IP geolocation (`ipapi.co`)
- Converts the USD starting-price model using a public FX endpoint (`open.er-api.com`)
- Formats estimates with the visitor's currency through `Intl.NumberFormat`
- Includes a manual currency override
- Falls back gracefully if geolocation or FX services are unavailable
- Saves the latest quote in local browser storage

No precise device location is requested or stored by the quote builder.

## STEADFAST Admin — Google Login
The complete package now includes an `/admin/` area with Google Sign-In and an authorized-email gate.

Authorized account currently configured:
`yahhclffjnd@gmail.com`

Before deployment, replace the Firebase placeholders in `admin/auth.js` and `admin/dashboard.js`, enable Google Authentication in Firebase, and add the deployed domain to Firebase Authentication Authorized Domains.


## Gmail quotation automation
The quotation workflow uses the STEADFAST Gmail Bridge Apps Script. The customer receives an automatic quotation summary and a promotional UP TO 75% OFF offer after a successful quotation submission, while the admin receives a notification at yahhclffjnd@gmail.com. The Apps Script owner must authorize Gmail once by running authorizeAndTest().


## V22 — Admin session initialization fix
- Reworked the Admin Dashboard Firebase session bootstrap so it explicitly restores browser-local persistence and waits for the initial Firebase auth state before loading quotations.
- Prevents the header from remaining indefinitely on “Checking account… / Authenticating…”.
- Added a 15-second authentication watchdog so a blocked/stale Firebase session returns to the Admin sign-in page instead of hanging forever.
- Added a small runtime error fallback in `admin/dashboard.html` so module/Firebase loading failures are visible instead of looking like an endless authentication state.
- Preserves the V21 public quotation Gmail-first flow and all previous ticket/dashboard features.


## V23 — Admin Logout Fix
- Sign out now has an independent Firebase logout handler in the dashboard HTML.
- Clicking Sign out immediately starts logout with no confirmation.
- Firebase sign-out is attempted before redirect, with a 3-second safety timeout so the UI cannot remain stuck.
- Session storage is cleared and the user is redirected to the admin login page with a logged-out marker.
- Existing V22 authentication, quotations, ticketing, merge, Gmail, and public quote fixes are preserved.


## V24 fixes
- Fixed accidental nested Support Tickets list-panel markup that could break the conversation workspace layout.
- Moved ticket status / Merge control beside Send Reply in the composer footer.
- Expanded conversation feed width to use the available center workspace.
- Hardened Firebase auth observer initialization to avoid a possible callback initialization race that could surface as Dashboard script error.


## V25 Fixes
- Support workspace gives more horizontal space to the conversation panel by narrowing the ticket rail and profile rail.
- Conversation feed uses the full available conversation width instead of a centered 900px cap.
- Open/status control remains beside Send Reply.
- Removed the duplicate Firebase logout module and the V24 auth race.
- Dashboard auth now listens immediately with Firebase onAuthStateChanged and only starts Firestore after the authorized admin is confirmed.
- Logout is available as a non-blocking redirect fallback; the login page consumes the loggedOut flag and clears the Firebase session.
