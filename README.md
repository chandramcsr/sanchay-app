# Sanchay App

Server-authoritative rebuild of Sanchay's finance data model — Next.js
frontend, [sanchay-api](https://github.com/chandramcsr/sanchay-api)
(`server-authoritative` branch) as the backend.

Not a replacement for `ledger-app` (yet) — this covers accounts,
transactions, and budgets as a vertical slice. `ledger-app` keeps
working as its own local-first app in the meantime; `sanchay-api`'s
existing routes (auth, sync, shared expenses, health, legal) are
untouched by this work.

## Auth

Clerk, not sanchay-api's own JWT system. sanchay-api's *new* routes
(accounts/transactions/budgets) verify Clerk-issued tokens directly;
its existing routes keep using their own JWT, unchanged. Two auth
mechanisms on one backend, deliberately — this is additive.

## Setup

```
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Needs, at minimum:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` (from your Clerk dashboard)
- `NEXT_PUBLIC_API_URL` (sanchay-api's server-authoritative deployment)
