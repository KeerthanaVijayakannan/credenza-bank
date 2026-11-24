# Credenza Bank — Customer Portal (SharedBank)

Credenza Bank is configured as bank `P647` with IFSC `KEER0P6L3VX` and its bank-owned Firebase project ID `credenza-bank`. This project preserves the existing React + Material UI + Vite stack and the existing SharedBank Worker integration. The customer portal has been redesigned while retaining the actual SharedBank sign-in, dashboard, directory and transfer API calls.

> **Environment notice:** The configured SharedBank network is a synthetic/test banking environment. Balances and transfers are test data, not real money. This portal does not connect to NEFT, RTGS, IMPS or live bank settlement rails.

## Included in this update

- Redesigned responsive customer sign-in and banking workspace.
- Customer overview with consolidated available balance and held balance.
- Account list with posted/available balance representation returned by the Worker.
- Dedicated transfer screen for same-bank and interbank transfers.
- Participating-bank selection from `/api/v1/directory/banks`.
- Interbank submission through `/api/v1/banks/P647/transfers` using destination IFSC, destination account number, integer paise and an idempotency key.
- Transfer history and status display, including pending, processing, completed, rejected and manual-review states.
- Participating bank directory view.
- Session-aware refresh, logout and Worker URL configuration.

## Bank-owned Firebase project

- Firebase project ID: `credenza-bank` (bank-specific project, not the central SharedBank project).
- Firestore location: `asia-south1`; GitHub repository: `keerthanavijayakannan/credenza-bank`.
- The supplied bank-owner settings are saved in local `bank-P647.json`. This file is excluded from Git because it contains test-account identifiers; do not publish it in a public repository.
- Bank ID: `P647`; IFSC: `KEER0P6L3VX`.
- The project ID is recorded as non-secret bank metadata. Firebase Admin credentials, service-account keys and HMAC secrets must remain server-side and must never be placed in `VITE_*` variables or committed to this repository.
- The existing portal authenticates through the SharedBank Worker. The supplied bank-owner configuration identifies the test customer and synthetic account, but it does not grant Google Cloud access or prove that Firebase Authentication, Firestore, IAM permissions, or Admin APIs are provisioned. Those still require authorized Google Cloud access.

## Existing SharedBank integration

The portal uses the configured Worker at `https://sharedbank-switch.e-commerce-sriramtpsiog.workers.dev` (or `VITE_X42_API_URL` if supplied at build time).

| Operation | API |
|---|---|
| Bank directory | `GET /api/v1/directory/banks` |
| Customer sign-in | `POST /api/v1/banks/P647/sign-in` |
| Customer dashboard | `GET /api/v1/banks/P647/dashboard` |
| Internal/interbank transfer | `POST /api/v1/banks/P647/transfers` |

The transfer body follows the SharedBank bank-owner patch contract: `fromAccountId`, `destinationIfsc`, `destinationAccountNumber`, `amountMinor`, and `currency: "INR"`. The frontend creates and retains an idempotency key for retry safety. The receiving bank must be active in the SharedBank directory and have its transfer configuration enabled. The Worker performs account ownership, balance, limit and receiver checks; the frontend does not update balances directly.

## Requirements status and important gaps

This ZIP is a customer-portal and SharedBank transfer UI enhancement, **not yet the complete Bank Management System assignment**.

The uploaded SharedBank Bank Owner Patch contains the shared network transfer engine and bank-owner onboarding utilities. It does **not** contain the deployed central Worker HTTP entry point or a bank-specific Admin/KYC/registration API. Therefore this update does not pretend to implement those missing server features.

| Requirement | Status in this ZIP |
|---|---|
| Existing Credenza bank identity and Worker URL | Preserved |
| Customer sign-in against SharedBank | Integrated; requires provisioned Firebase test user |
| Customer dashboard and accounts | Integrated with Worker dashboard response |
| Internal transfers | Integrated through SharedBank transfer endpoint |
| Interbank transfers | Integrated through SharedBank directory + transfer endpoint; requires active destination bank and account |
| Transfer history/status | Integrated from dashboard response |
| Admin login and Admin dashboard | Not implemented; no Admin API was supplied |
| Customer registration and KYC submission | Not implemented; no bank registration/KYC backend was supplied |
| Admin KYC approve/hold/reject and opening deposit | Not implemented; must be server-side and idempotent |
| Beneficiary CRUD | Not implemented; no beneficiary API was supplied |
| Transfer-limit administration | Worker enforces configured limits; Admin management API/UI is not supplied |
| Loans, portfolio, notifications/email, audit-log administration | Not implemented; bank-specific APIs and schema permissions are required |

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Sign in using a Firebase Email/Password customer account provisioned for Credenza Bank. A customer must have an active synthetic account attached to their Firebase UID to see an account balance or submit a transfer.

## Build

```bash
npm run build
npm run preview
```

## Worker URL override

Create a `.env` file only for local configuration if needed:

```env
VITE_X42_API_URL=https://your-sharedbank-worker.workers.dev
```

Do not place service-account JSON, Firebase Admin credentials, HMAC secrets, passwords or private keys in Vite environment variables. Vite variables are public in the browser bundle.

## Test interbank transfer

1. Confirm the Credenza bank is active in the central SharedBank directory.
2. Confirm the destination bank is listed as `ACTIVE` and enabled for the SharedBank transfer engine.
3. Confirm both source and destination test accounts exist, are active, and are attached to the correct Firebase customer UIDs.
4. Sign in to Credenza, open **Money transfer**, choose **To another bank**, select the receiving bank, enter the receiving test account number and amount, and submit.
5. Check the transaction status and both account dashboards. A pending or manual-review status must not be represented as a completed payment.

Never test against production/shared financial records. Use isolated synthetic accounts only.

## Admin/backend work still required

To complete the assignment, Credenza needs a bank-owned backend/API in its own Firebase project for customer registration, KYC, admin authentication and authorization, customer/account administration, beneficiary management, loans, portfolio, email outbox, audit logs and transfer-limit administration. The SharedBank central directory must remain read-only from the customer portal and must not be overwritten by this project. All financial balance changes must remain server-side, use integer paise, and create immutable debit/credit ledger records.

The Admin portal should be added only when the corresponding authenticated Admin endpoints exist; a browser-only Admin dashboard would be cosmetic and would not safely perform banking operations.
