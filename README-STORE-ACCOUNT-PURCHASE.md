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

## Customer authentication isolation

The public Store and Reviews use a separate named Firebase client app (`steadfastCustomer`) for customer Authentication and Firestore access. The Admin portal continues using the default Firebase app. This prevents an Admin login in `/admin/` from automatically appearing as a customer login on the public Store/Reviews pages in the same browser.

Customers can independently create an account or sign in from the Store. The customer session is only used for customer purchasing/review permissions.
