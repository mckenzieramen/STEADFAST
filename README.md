# STEADFAST Website

Premium static website for **STEADFAST — by Cliff Jandee Medrano**.

## Included
- `index.html` — Home, Services, Portfolio, Quote Builder, About, Faith & Purpose, Contact
- `reviews.html` — Client Reviews, rating summary, star picker, review submission
- `styles.css` — responsive black/white/purple premium design
- `script.js` — mobile navigation, quote calculator, contact toast, local review storage

## Cloudflare Pages
Connect the GitHub `STEADFAST` repository to Cloudflare Pages and deploy from the `main` branch.

Current free Cloudflare Pages URL:
`https://steadfast-cliffjandee.pages.dev/`

## Important
The review form currently saves reviews to the browser using localStorage. It is ready to be connected to Firebase/Firestore later so reviews become shared across all visitors.


## Merge Notes
- The user's existing `index.html`, `reviews.html`, `styles.css`, and core site structure were retained as the working baseline.
- V2 support files were added: `404.html`, `robots.txt`, `sitemap.xml`, and `assets/favicon.svg`.
- `script.js` received only compatibility-safe enhancements; the existing quote calculator and review behavior were not replaced.
