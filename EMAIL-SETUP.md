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


## REQUIRED ONE-TIME GMAIL AUTHORIZATION

After updating the Apps Script source to the V5 bridge code, run the function `authorizeAndTest()` manually while signed in as `yahhclffjnd@gmail.com`. Approve the Gmail permission request. The function sends a connection-test email to the admin account.

Then update the Web App deployment to a new version using the same `/exec` deployment URL. The website already points to that URL.

## AUTOMATIC CUSTOMER EMAIL

When a website quotation is successfully written to Firestore, the website requests the Gmail bridge to send:

1. A customer confirmation containing the submitted quotation summary.
2. The current promotional offer of **UP TO 75% OFF**, subject to final scope/review/eligibility.
3. An admin notification to `yahhclffjnd@gmail.com`.

If the customer does not receive the email, first check the Apps Script **Executions** panel and Gmail **Sent** folder. Google Apps Script requires authorization before a script can use Gmail services.
