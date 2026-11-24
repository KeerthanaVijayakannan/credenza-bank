# Functional requirements status

This status is intentionally strict: a screen is not marked complete unless its underlying API exists and the action can be processed server-side.

| Area | Requirement | Current status | Evidence / dependency |
|---|---|---|---|
| Customer | Firebase test-user sign-in | Integrated | Existing SharedBank `/banks/P647/sign-in` API |
| Customer | Dashboard and account balances | Integrated | Existing SharedBank `/banks/P647/dashboard` API |
| Customer | Internal transfer | Integrated | Existing SharedBank `/banks/P647/transfers` API |
| Customer | Interbank transfer | Integrated | Shared bank directory + same transfer API with destination IFSC/account number |
| Customer | Transfer activity/status | Integrated | Dashboard transfer activity response |
| Customer | Beneficiary CRUD | Missing | Bank-owned beneficiary API required |
| Customer | Registration/profile/KYC submission | Missing | Bank-owned registration and KYC API required |
| Customer | Loan application | Missing | Bank-owned loan API required |
| Customer | Portfolio | Missing | Bank-owned portfolio API required |
| Customer | In-app/email notifications | Missing | Notification outbox and email provider integration required |
| Admin | Admin sign-in and role authorization | Missing | Admin identity/role and protected Admin API required |
| Admin | Customer management | Missing | Admin customer/account endpoints required |
| Admin | KYC approve/hold/reject | Missing | KYC workflow endpoint and audit trail required |
| Admin | One-time ₹1,000 opening deposit | Missing | Server-side idempotent ledger operation required after approval |
| Admin | Transfer-limit management | Partial | SharedBank engine checks limits; Admin management API/UI not supplied |
| Admin | Transaction monitoring/audit logs | Missing | Admin reporting and audit endpoints required |
| Infrastructure | Credenza bank-owned Firebase project/config | Recorded locally | Project `credenza-bank`, Firestore `asia-south1`, repo `keerthanavijayakannan/credenza-bank`, and supplied synthetic test-account config; no cloud changes made |
| Infrastructure | Shared bank directory and IFSC registry | Preserved/read-only from portal | Existing central SharedBank Worker |
| Security | Paise precision and idempotent transfer request | Integrated at transfer boundary | Frontend sends integer paise and Idempotency-Key; Worker must enforce it |

## Next implementation boundary

The provided bank-owner patch includes the shared transfer engine and Firestore helper modules, but does not include the deployed central Worker router or a bank-specific application backend for registration, KYC, Admin, beneficiaries, loans, portfolio and notifications. Those capabilities must be implemented against the individual Credenza Firebase project and authenticated Admin/customer identities. Do not add browser-side balance mutation or mock Admin actions as substitutes.
