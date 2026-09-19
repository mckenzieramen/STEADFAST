# STEADFAST Gmail — one-time setup

This version uses **Google Apps Script + GmailApp** so your existing Gmail account can send the quotation notification and customer replies without putting a Gmail password in the website.

## Account used for now
`yahhclffjnd@gmail.com`

## 1. Create the Apps Script
1. Sign in to Google with `yahhclffjnd@gmail.com`.
2. Open Google Apps Script and create a new project.
3. Open `STEADFAST-GMAIL-BRIDGE.gs` from this package.
4. Replace the default code with the file contents and Save.

## 2. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy.
6. Google will ask you to authorize the script to send email from the Gmail account. Approve it.
7. Copy the generated **Web app URL** ending in `/exec`.

## 3. Paste the URL into STEADFAST
Open `email-config.js` and change:

```js
endpoint: '',
```

to:

```js
endpoint: 'YOUR_APPS_SCRIPT_WEB_APP_URL',
```

Do not paste a Gmail password, client secret, or refresh token into the website.

## What it does
- Customer submits a quotation → quotation is saved in Firestore.
- Gmail sends a notification to `yahhclffjnd@gmail.com`.
- Gmail sends a confirmation to the customer.
- Admin can select **Email** beside a quotation and send a message through the same Gmail account.

Google documents Gmail API sending and OAuth separately; this bridge instead uses the Google-authorized Apps Script runtime so the Gmail authorization stays on Google's side.
