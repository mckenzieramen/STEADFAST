# STEADFAST 6-Digit Email Verification

Customer registration now uses a one-time 6-digit verification code sent through the STEADFAST Gmail Bridge. Codes expire after 10 minutes and are limited to 5 incorrect attempts. Resend is throttled to about once per minute.

Deploy Firebase Functions after extracting this project. The Google Apps Script bridge must remain deployed as the existing Web App.
