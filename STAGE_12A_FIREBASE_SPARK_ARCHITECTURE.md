# Propledger 2027 — Firebase Spark Architecture Plan

**Owner decision:** Approved  
**Prepared:** 8 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Approved decisions and hard constraints

| Item | Owner-approved decision |
|---|---|
| Backend platform | Firebase |
| Pricing plan | Spark (no-cost) only |
| Cloud Firestore region | Doha, `me-central1` |
| Budget | Strictly USD 0 |
| Billing account | Must not be linked |
| Paid services | Must not be activated |
| Existing live app | Keep GitHub Pages prototype unchanged during planning |
| Existing data | Do not migrate or overwrite local sample data without a separate approval |

This approval authorises architecture planning only. It does not authorise creating a Firebase project, provisioning a database, accepting terms, linking billing, changing the live application, or migrating data.

## 2. Important Firebase Spark constraints

The current Firebase documentation states:

- Spark is the no-cost plan and does not require payment information for most Firebase services.
- Cloud Firestore has a no-cost quota: 1 GiB stored data, 50,000 document reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB/month outbound transfer.
- The Firestore free quota applies to one database per project.
- If a paid-tier product's Spark quota is exceeded, that product is shut off for the remainder of the applicable period; the project does not automatically charge for the overage.
- Linking a Cloud Billing account can automatically upgrade the project to Blaze.
- Cloud Storage for Firebase requires Blaze; it is unavailable on Spark, including default buckets.
- Cloud Functions and other paid-tier Google Cloud services are excluded from this strictly Spark-only plan.
- Firestore backups, point-in-time recovery, restore and clone operations do not have free usage.

Sources:
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

**Hard control:** Do not link a billing account, enter payment details, enable Blaze, create Cloud Storage buckets, deploy Cloud Functions, or enable paid Google Cloud services. If a Firebase console workflow requests billing to continue, stop and do not proceed.

## 3. Firestore region — Doha

Approved database location: `me-central1` (Doha, Qatar).

Google's Firestore location documentation lists `me-central1` as Doha and `me-central2` as Dammam. It also states that a database's location cannot be changed after provisioning.

Before creating the database, re-check the console's displayed region and confirm it explicitly says Doha / `me-central1`. Do not click Create until the owner has reviewed that final confirmation.

A Doha database is not UAE-hosted or Pakistan-hosted. Country-separated accounting books are not the same thing as country-specific data residency. Obtain appropriate UAE and Pakistan privacy/legal advice before placing real customer personal data in the database.

Source:
- https://firebase.google.com/docs/firestore/locations

## 4. Spark-only service design

| Capability | Proposed service | Spark decision |
|---|---|---|
| User sign-in | Firebase Authentication, email/password initially | Use supported no-cost authentication methods |
| Main database | Cloud Firestore Standard, regional `me-central1` | Use within free quotas |
| Web hosting | Keep existing GitHub Pages initially | No hosting migration required for the first database milestone |
| Android crash reporting | Firebase Crashlytics, later | No-cost product; add only during Android QA |
| Push notifications | Firebase Cloud Messaging, later | No-cost product; not part of first database milestone |
| Abuse protection | Firebase App Check, later | Evaluate provider/limits before enabling; no paid dependency |
| Private file uploads | None in Spark phase | Cloud Storage for Firebase requires Blaze; do not activate |
| Trusted server-side code | None in Spark phase | Cloud Functions excluded; no server-side posting or privileged operations |
| Backups / point-in-time recovery | Manual export/recovery plan only | Firestore managed backup/PITR/restore features are not free |

Firebase Authentication supports multiple no-cost methods, but phone/SMS authentication has separate charges. Start with email/password; do not use SMS sign-in in the zero-budget phase.

## 5. Application architecture

### Front end

- Keep the current Propledger web app on GitHub Pages initially.
- Add Firebase Web SDK only after a separate implementation approval.
- Firebase client configuration is not a secret; security must be enforced through Authentication and Firestore Security Rules.
- Never put service-account credentials, Admin SDK keys or privileged secrets in `index.html`, browser JavaScript or GitHub.
- Continue to show clear connection and offline/error states.

### Authentication

Initial Spark phase:
- Email/password registration and sign-in.
- Email verification and password reset using supported Firebase Auth flows.
- Sign-out and session state.
- No phone OTP (SMS charges apply).
- No privileged account recovery or administrator actions from browser-only code.

### Organisation and membership

Initial no-cost scope is a single owner account per organisation.

A proposed owner bootstrap flow creates the organisation and initial owner membership under restrictive Firestore Security Rules, with the authenticated user's UID bound to the creator and owner membership. This flow must be tested against emulator rules before use.

Multi-user invitations, staff administration and privileged role changes are deferred. Do not trust a client-side role selector or client-supplied `isAdmin` field.

### Firestore data model

Use organisation-scoped paths so every business record belongs to an organisation.

Proposed top-level structure:

```text
organizations/{orgId}
  members/{uid}
  books/{bookId}
    properties/{propertyId}
    tenants/{tenantId}
    vendors/{vendorId}
    rentInvoices/{invoiceId}
    receipts/{receiptId}
    vendorBills/{billId}
    payments/{paymentId}
    journalDrafts/{journalId}
    activity/{activityId}
```

Each book has immutable country metadata:
- UAE book: `countryCode = "AE"`, `functionalCurrency = "AED"`.
- Pakistan book: `countryCode = "PK"`, `functionalCurrency = "PKR"`.

Each financial record stores its `orgId`, `bookId`, country, currency, creation/update timestamps and creator UID where applicable. The database must reject a record whose book, organisation or currency does not match the selected country book.

Do not create a single mixed-country ledger. Do not permit cross-book journal lines or silent currency conversions. Any future consolidated reporting must use explicit, separately recorded FX rates and conversion entries.

### Security Rules

Rules are a release blocker, not an optional enhancement.

Required controls:
- Deny access by default.
- Require authenticated users.
- Verify organisation membership on every read/write.
- Verify that a member can access only organisations to which their UID belongs.
- Initially permit only the owner role for write operations.
- Validate allowed fields, types, country codes, currencies, and immutable identifiers.
- Prevent client users from creating or editing posted journal records.
- Prevent users from changing their own role or adding themselves to another organisation.
- Restrict updates to permitted fields and protect ownership/audit metadata.
- Test both allowed and denied access paths with the Firebase Emulator Suite before deployment.

Do not deploy permissive rules such as `allow read, write: if request.auth != null` or rules that allow all authenticated users to read all organisation data.

## 6. Accounting boundaries during Spark phase

Firestore and Security Rules can protect access to records, but they are not a replacement for a trusted accounting server.

Permitted initial capabilities after implementation and tests:
- Store properties, tenants, vendors and source voucher records.
- Store rent invoices, receipts, vendor bills and payments as source records/drafts.
- Store journal drafts as unposted.
- Read country-specific records and calculate clearly labelled preview reports.
- Keep an audit-style activity trail for client-permitted changes, while clearly disclosing that client-generated activity is not a tamper-proof server audit.

Not permitted as production accounting:
- Client-side creation of trusted Posted journals.
- Client-side updates to authoritative account balances.
- Client-side allocation that changes receivable/payable balances.
- Official financial statements or locked period-close.
- Claims of tamper-proof audit or atomic server-side posting.

All journals remain drafts/unposted until a future approved trusted backend is available. A later server implementation must validate and post journals atomically, enforce idempotency and immutable posted records.

## 7. Document and image handling

Because Cloud Storage for Firebase requires Blaze:
- Do not enable Firebase Storage.
- Do not upload identity documents, tenancy contracts, receipts or sensitive files to Firestore documents.
- Do not embed private documents as base64 fields in Firestore.
- Keep the current emoji-only dashboard carousels.
- If users choose a profile image during the Spark phase, either keep the current device-only preview or defer cloud persistence; label it clearly as device-local.
- Do not use public third-party file links as a substitute for secure document storage.

Secure cloud document uploads are deferred until a separately approved zero-cost-compatible provider is found or the owner later approves a paid plan.

## 8. Free-tier usage protection

- Use one Firestore database only.
- Avoid unbounded real-time listeners and repeated full-collection reads.
- Use pagination and query limits.
- Avoid loading full transaction history on every dashboard render.
- Do not store large images or document blobs in Firestore.
- Monitor Firestore usage in Firebase Console.
- Test with the 5-property/5-tenant/5-vendor prototype data first.
- Explain that exceeding a Spark quota can cause service interruption until quota resets.
- Do not add billing alerts as a substitute for the zero-billing rule; the project must remain unlinked from billing.

## 9. Prototype migration policy

Existing sample data is stored in browser localStorage on each device. It must not be silently imported or deleted.

A future migration utility should:
1. Read the current local sample data without changing it.
2. Show a preview of record counts by country and collection.
3. Validate AED/PKR and country-book separation.
4. Detect duplicate IDs and invalid references.
5. Ask the owner to explicitly approve an import.
6. Import in bounded batches within free quotas.
7. Verify counts and totals after import.
8. Keep the original local data untouched until the owner separately approves cleanup.

No migration is authorised in this planning stage.

## 10. Staged implementation plan

### 12A — Platform and architecture decision
**Approved in principle:** Firebase Spark, Firestore Doha.  
**Still not provisioned:** Firebase project and Firestore database.

### 12B — Authentication and organisation access
- Firebase project setup only after owner authorises console actions.
- Email/password authentication.
- Owner organisation bootstrap.
- Membership schema and restrictive rules.
- Emulator tests for unauthorised access.

### 12C — Firestore data layer
- Create one default Firestore database in Doha `me-central1`.
- Add country-separated book structure.
- Implement CRUD for properties, tenants, vendors and source vouchers.
- Add pagination, indexes and bounded reads.
- No sensitive document uploads.

### 12D — Security and accounting boundaries
- Complete rules test matrix.
- Verify organisation isolation.
- Keep journal drafts unposted.
- Verify country and currency invariants.
- Security review before real personal data.

### 12E — Migration and prototype integration
- Preview localStorage import.
- Owner-approved import only.
- Verify counts and country separation.
- Keep original local data as a fallback.
- Label preview accounting accurately.

### 12F — Spark pilot and review
- Test free quotas and service interruption behaviour.
- Validate authentication, data access and mobile UX.
- Document backup limitations and manual export process.
- Do not claim production-grade backup/recovery or financial posting.

## 11. Explicit exclusions and future decision gates

The following remain out of scope until the owner approves a new budget/provider decision:
- Firebase Blaze or any linked Cloud Billing account.
- Firebase Cloud Storage.
- Cloud Functions.
- Cloud Run, SQL Connect or other paid Google Cloud services.
- Paid SMS/phone verification.
- Managed Firestore backups, PITR and paid restore features.
- Secure cloud document uploads.
- Trusted server-side accounting and production posting.
- Multi-user invitations and privileged staff management unless a safe Spark-compatible design is proven.

A future paid or alternative-backend decision must be made before Propledger is represented as a secure production financial system.

## 12. Acceptance criteria before any live integration

1. Owner confirms a Firebase project may be created under Spark with no billing account.
2. Firestore creation screen confirms Doha `me-central1`; owner approves before final creation.
3. Firebase Authentication uses only approved no-cost methods.
4. Security rules deny unauthenticated and cross-organisation access.
5. A user cannot read or write another organisation's data by changing document IDs.
6. A user cannot promote themselves to owner/admin.
7. UAE book records cannot be written into Pakistan book paths or vice versa.
8. Currency mismatch writes are rejected.
9. Posted journals cannot be created or changed from the client.
10. No Firebase Storage bucket, Cloud Function or paid resource is provisioned.
11. Existing local data remains unchanged until separately approved import.
12. Usage stays within Spark quotas in representative tests.

## 13. Official documentation reviewed

- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Cloud Firestore pricing and free quotas: https://firebase.google.com/docs/firestore/pricing
- Cloud Firestore locations: https://firebase.google.com/docs/firestore/locations
- Cloud Storage billing requirement: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- Firebase Authentication: https://firebase.google.com/docs/auth
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Emulator Suite: https://firebase.google.com/docs/emulator-suite
- Firebase App Check: https://firebase.google.com/docs/app-check

**Current status:** Architecture planned; no Firebase project or database created, no billing account linked, no paid services activated, no application code changed and no user data migrated.
