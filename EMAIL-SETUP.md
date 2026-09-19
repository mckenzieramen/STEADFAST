# STEADFAST Email + Live Conversation Setup

## Current architecture
Customer quote -> Firestore `quotations` -> automated confirmation email -> customer replies -> your Gmail.

The website and Admin Dashboard are already wired for Firestore quotations. Email delivery requires a real authorized email provider configuration. No Gmail password is stored in the site.

## Gmail live inbox phase
For true Gmail-to-Admin live synchronization, use Gmail API OAuth plus Cloud Pub/Sub. Gmail's official push system sends mailbox-change notifications to a backend; the backend then uses `history.list` / `threads.get` to sync new messages into Firestore. Gmail threads can preserve the same conversation when `threadId`, matching Subject, and RFC 2822 `References` / `In-Reply-To` headers are used.

This phase requires a Google Cloud OAuth client and a backend deployment. Do not paste a Gmail password or OAuth refresh token into frontend files.
