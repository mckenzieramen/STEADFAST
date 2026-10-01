# STEADFAST 6-Digit Email Verification

Customer registration uses a one-time 6-digit verification code sent through the STEADFAST Gmail Bridge. Codes expire after 10 minutes and are limited to 5 incorrect attempts. Resend is throttled to about once per minute.

The Firebase Function calls the Apps Script Web App using a signed GET request. This avoids the redirect behavior of Apps Script Web Apps for server-side POST requests.

After replacing the Apps Script code, deploy/update the existing Web App. Then deploy Firebase Functions and the website.
