# Firestore Rules — No-Blaze Customer Verification

The included `firestore.rules` gates Store purchases/reviews using the server-set `customerProfiles/{uid}.emailVerified` field.

Customers can create/update normal profile fields but cannot write the verification fields themselves. The STEADFAST Gmail Bridge updates the verification fields server-side after a correct 6-digit code.

Deploy only the Rules when ready:

```bash
firebase deploy --only firestore:rules
```

No Firebase Cloud Functions are required for this flow.
