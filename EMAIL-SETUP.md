# STEADFAST Gmail Bridge — Current Setup

## Gmail account
The current sending/notification account is:

`yahhclffjnd@gmail.com`

## Current flow

Customer submits Website Quotation → Firestore → STEADFAST Gmail Bridge →
1. customer confirmation email
2. admin notification email to `yahhclffjnd@gmail.com`

Admin Dashboard → Email / Gmail → Gmail Bridge → customer.

## Web App URL

The deployed Web App URL is stored in `email-config.js`.

## Important

The Gmail password is never stored in the STEADFAST website. The Apps Script Web App executes as the Google account that owns/deploys the bridge and uses GmailApp to send mail. Google Apps Script web apps require a `doGet(e)` or `doPost(e)` function and are deployed from Deploy → New deployment → Web app.

If the Apps Script source is edited, create a new deployment version or update the existing deployment so the `/exec` URL uses the latest saved code.
