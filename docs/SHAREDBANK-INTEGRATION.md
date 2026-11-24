# Credenza ↔ SharedBank integration notes

## Verified from the supplied bank-owner patch

The patch's `support/worker/src/network.mjs` implements the transfer engine (`X42_CLOUDFLARE_V1`). It resolves destination IFSC through the central `ifsc_registry`, checks the destination bank's `ACTIVE` state and `x42.enabled` configuration, verifies the source account belongs to the authenticated customer, verifies an active destination account, checks integer-paise amounts, and creates an idempotent transfer job. For interbank transfers, the engine uses reservation, destination credit and source reservation settlement phases. Failures can enter `MANUAL_REVIEW` rather than being falsely marked completed.

The patch's `bank-ledger.mjs` enforces available balance as `postedBalanceMinor - heldMinor`, stores integer paise, checks per-transfer and daily limits, and writes ledger entries. This app must not bypass these server-side controls.

## Credenza bank-owned Firebase project

- Project ID: `credenza-bank`
- Bank ID: `P647`
- Bank IFSC: `KEER0P6L3VX`
- Firestore location: `asia-south1`
- GitHub repository: `keerthanavijayakannan/credenza-bank`
- Brand color: `#204abe`
- Bank-owner config: `bank-P647.json` (local file; excluded from Git because it contains test-account identifiers)

This is the individual bank project. It is separate from the central SharedBank project (`sharedbank-connect`). Do not point customer data writes at the central project. The portal must continue to call the existing SharedBank Worker for directory and transfer operations. The supplied owner configuration has now been recorded locally. No project provisioning, IAM changes, database writes or deployment were run.

## Frontend contract preserved

- Bank identity: `P647` / `Credenza Bank` / `KEER0P6L3VX`.
- Shared Worker URL: `https://sharedbank-switch.e-commerce-sriramtpsiog.workers.dev`.
- Directory: `GET /api/v1/directory/banks`.
- Sign-in: `POST /api/v1/banks/P647/sign-in`.
- Dashboard: `GET /api/v1/banks/P647/dashboard`.
- Transfer: `POST /api/v1/banks/P647/transfers` with `Idempotency-Key` header.

## Important boundary

The owner patch is not the central Worker deployment source. It contains support modules and onboarding/configuration tools, but not the deployed central HTTP router. This repository therefore consumes the existing shared Worker and does not modify central bank/IFSC records or deploy changes to shared infrastructure.
