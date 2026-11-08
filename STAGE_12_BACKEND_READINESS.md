# Propledger 2027 — Stage 12 Secure Cloud Backend Readiness Plan

**Status:** Provider-neutral preparation only; backend implementation is blocked pending owner approval.  
**Prepared:** 8 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Owner decisions already confirmed

- Backend provider: **deferred**. No vendor, cloud region, paid plan or integration is authorised yet.
- Accounting: UAE and Pakistan remain separate books.
- Functional currencies: AED for UAE books and PKR for Pakistan books.
- Initial country support: UAE and Pakistan.
- Current app: static GitHub Pages prototype in `index.html`.
- Current persistence: browser `localStorage`; it is device/browser-local prototype storage, not secure cloud storage or an authoritative ledger.

This document does not change those decisions and does not connect a backend.

## 2. Stage 12 goal

Move Propledger from a local-only prototype to a secure, multi-user cloud application while preserving the existing product workflows. Production accounting must only begin after the backend can enforce authorisation, country/entity isolation, atomic posting, audit history and recovery on the server.

## 3. Recommended implementation sequence

### 12A — Provider and hosting decision (BLOCKING GATE)

Before implementation, the owner must approve:

1. Backend/database vendor and plan.
2. Data hosting region(s), data residency and cross-border transfer approach for UAE and Pakistan.
3. Authentication method, MFA/passkeys and account recovery.
4. Private file/object storage and backup region.
5. Expected user count, storage, monthly budget and support requirements.
6. Contractual terms, subprocessors, retention, deletion and export.
7. Independent security and local legal/privacy review requirements.

**No provider will be selected or provisioned without explicit approval.**

### 12B — Identity and organisation access

After 12A approval:

- Sign-up, sign-in, sign-out and verified email/phone flows.
- MFA/passkeys where supported; secure recovery and session revocation.
- Organisations, memberships, legal entities and role-based permissions.
- Roles: owner, administrator, accountant, approver and read-only, with least privilege.
- Invite/revoke membership and audit every access change.
- Enforce authorisation on the server for every read and write.

### 12C — Database and tenant isolation

- Implement the approved relational schema from `ACCOUNTING_ARCHITECTURE.md`.
- Use UUID primary keys, fixed-precision decimal amounts and database constraints.
- Scope every business record to organisation and legal entity.
- Enforce row-level policies or equivalent server-side access checks; never trust client-supplied organisation/entity IDs.
- Keep UAE and Pakistan books separate; never add AED and PKR without an explicit, documented conversion.
- Use migrations, staging and production environments with separate credentials.
- No service-role or privileged secret in browser JavaScript.

### 12D — Private document storage

- Store identity documents, tenancy agreements and financial attachments in private object storage only.
- Use short-lived, scoped access links after server-side authorisation.
- Validate file type, size and malware scanning; record metadata and audit events.
- Define retention, deletion, backup and restore procedures.
- Never expose identity/financial documents through public repository paths or public static URLs.

### 12E — Server-side accounting and audit controls

- Move validation and journal posting to trusted server-side transactional code.
- Enforce balanced debit/credit totals, one entity/book currency, open periods, active accounts, idempotency and source linkage.
- Posted journals immutable; corrections by reversal and replacement.
- Record actor, timestamp, action, source and reason in an append-only audit trail.
- Add approval permissions, period locks, reconciliation and automated acceptance tests.
- Do not migrate local preview vouchers into official books without a reviewed, reconciled and owner-approved migration.

### 12F — Migration, backup and production readiness

- Design an opt-in migration from device-local preview data; preview first, validate counts/totals, then obtain owner confirmation.
- Automated backups, restore drills, recovery objectives and incident procedures.
- Data export and account deletion workflows.
- Logging and monitoring without leaking personal or financial data.
- Security review, penetration testing and independent UAE/Pakistan privacy/legal review.
- Production go-live checklist and rollback plan.

## 4. Non-negotiable security requirements

- Browser code is untrusted; all access control and accounting validation must be server-side.
- No passwords, access tokens, service keys or privileged secrets in `index.html`, Git history or client storage.
- No public bucket for identity documents or financial attachments.
- No cross-organisation data access; tests must attempt unauthorised reads and writes.
- No direct modification/deletion of posted accounting entries.
- No claims of cloud sync, secure multi-user access or production-grade accounting until verified in the deployed system.
- Use synthetic data in development and staging.
- Minimise collected personal data and define retention/deletion before launch.

## 5. Required acceptance tests before production

1. User A cannot read or modify User B's organisation data.
2. A user cannot access an entity outside their membership.
3. UAE user/book cannot post to Pakistan book and vice versa.
4. Unauthorised roles cannot approve, post, reverse or unlock periods.
5. Invalid or unbalanced journals fail atomically with no partial writes.
6. Duplicate requests cannot double-post.
7. Posted journals cannot be edited or deleted.
8. Closed periods reject postings.
9. Private files cannot be fetched without valid authorisation.
10. Revoked sessions and memberships immediately lose access.
11. Backup restore reproduces verified data and audit history.
12. Export and deletion workflows work and are auditable.
13. UAE/Pakistan separation, currency precision and timezone boundaries pass tests.
14. English, Arabic and Urdu workflows, including RTL, pass on mobile.
15. Security review findings are resolved before production.

## 6. Current stage status

| Work item | Status |
|---|---|
| Provider-neutral accounting schema | Complete (Stage 8A) |
| Separate country books | Prototype complete; local-only |
| Voucher and reporting screens | Prototype complete; not official ledger |
| Document previews | Prototype complete; not secure storage |
| Backend provider and region | **Awaiting owner decision** |
| Cloud authentication and database | Not started |
| Server-side posting and audit | Not started |
| Secure file storage | Not started |
| Migration, backup and recovery | Not started |
| Production security approval | Not started |

## 7. Exit criteria for Stage 12

Stage 12 is complete only when an owner-approved provider is deployed, authentication and organisation/entity permissions are verified, private file storage is secured, server-side accounting controls pass acceptance tests, backup/restore and export/deletion are proven, and security/privacy reviews are closed. A successful static-site deployment alone does not satisfy these criteria.

**Next action:** obtain the owner's explicit approval of a provider, hosting region and budget before creating cloud resources or entering credentials. Until then, keep the live app in clearly labelled local-preview mode.
