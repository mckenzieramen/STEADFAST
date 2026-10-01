STEADFAST V51 — SIGN-IN DISPLAY FIX

Changed file ONLY:
- styles.css

Why:
The existing form already correctly hides registration-only fields with the HTML hidden attribute, but the page stylesheet's label display rules were overriding the browser's hidden behavior. This made Email, Username, and Confirm Password appear on the Sign In tab.

Replace only the existing styles.css with this file.

Expected Sign In:
- Username / Email
- Password
- Sign in

No Email field, Username field, Confirm Password, Remember Me, or other registration fields should appear.
