# STEADFAST Store / Customer Account Flow

- Customer accounts use Firebase Email/Password Authentication.
- A customer must sign in before buying a Store product.
- A product order stores the buyer UID.
- Admin confirmation of `Paid` automatically:
  1. decrements product stock by one,
  2. creates/updates a published `portfolioProjects/purchased-{productId}` project from the purchased product,
  3. grants `customerAccess/{uid}_{productId}`,
  4. triggers the payment-verified HTML email.
- Only customers with a paid `customerAccess` grant can submit a review for that product.
- CRM Integration has been removed from the Admin navigation and section.

## Firebase
Enable **Authentication > Sign-in method > Email/Password**. Publish the included `firestore.rules`.
