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
