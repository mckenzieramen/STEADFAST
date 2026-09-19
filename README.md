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

