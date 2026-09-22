# STEADFAST V30 — Store + Manual Payment Flow

- Store is separate from Home.
- Published products appear live via Firestore on store.html.
- Admin can upload multiple product preview images (up to 8) plus a live preview URL.
- Customer can open a preview gallery.
- Customer submits name/email and payment proof.
- Admin confirms Paid.
- Paid decrements stock once, and triggers HTML email with access link and optional credentials.
- Failed/rejected payment does not decrement stock.

Deploy the included firestore.rules/storage.rules and redeploy the Gmail bridge if using automated emails.
