# STEADFAST Admin — Premium Support Ticketing

The Admin workspace now includes a premium support-ticket interface built around the existing Firestore `quotations` documents and Gmail bridge.

## Ticket workflow

- Ticket statuses: Open, Pending, On Hold, Solved
- Ticket numbers are assigned sequentially as `ST-001`, `ST-002`, and so on.
- Existing website quotations become tickets automatically when the Admin dashboard loads.
- Customer quotation requirements appear as the first conversation message.
- Admin replies are sent through the existing Google Apps Script Gmail bridge and stored in the quotation document as `ticketMessages`.
- Internal notes are stored in `ticketMessages` with `type: "note"` and in `ticketAnnotations`; they are not emailed.
- Optional pre-send annotations can be added before sending a customer reply.
- The ticket list and conversation each scroll independently so the workspace does not expand the page.
- The right rail shows customer profile and quotation details.

## Firestore note

The existing Admin-only quotation update rule must continue to allow the authorized admin to update quotation documents. The ticketing UI adds these Admin-managed fields:

- `ticketNumber`
- `ticketStatus`
- `ticketSubject`
- `ticketMessages`
- `ticketAnnotations`
- `ticketUpdatedAt`
- `lastAdminReply`
- `lastReplyAt`

No customer-facing quotation create rule needs to be changed just to display this UI; these fields are written after the quote is created by the authorized Admin.
