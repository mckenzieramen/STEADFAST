# STEADFAST Customer Portal

Added a customer portal at `account.html` using the existing Firebase Auth + Firestore NO-BLAZE architecture.

Features: Overview, My Orders, My Products, Profile, Support, Store/Home navigation, sign out, and responsive mobile navigation.

No Firebase Functions or Blaze billing added.

Firestore rules were updated only so a verified customer can query their own `storeOrders` collection by `customerUid`; the existing ownership condition remains enforced.
