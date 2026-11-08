# Propledger 2027 — Stage 12C Firestore Data Layer Design

**Status:** Data architecture documented; no Firebase project/database or live integration authorised.  
**Prepared:** 9 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Owner decisions and non-negotiable limits

- Firebase Spark (no-cost) only; budget strictly USD 0.
- Do not link a billing account, enable Blaze, or activate paid services.
- Preferred Firestore region: Doha, `me-central1`; database location is immutable once created.
- UAE and Pakistan accounting books stay separate: UAE = `AE` / `AED`; Pakistan = `PK` / `PKR`.
- The current GitHub Pages app remains the prototype. Its localStorage records are not production cloud data.
- This is schema and data-layer planning only. No project, database, collection, index, rules deployment, data migration, or live application code change is authorised by this document.

## 2. Proposed Firestore hierarchy

Use an organisation boundary first, then a country book boundary. Keep all operational and accounting records under their owning book so cross-country queries are not accidental.

```
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
    postedJournals/{journalId}       # server-trusted path only; not client writable
    accounts/{accountId}
    allocations/{allocationId}
    activity/{activityId}
    periodCloses/{periodId}          # trusted server path only
```

Canonical book IDs should be fixed values such as `AE_AED` and `PK_PKR`, not user-entered names. A book document must contain the matching immutable `countryCode` and `functionalCurrency`. Rules must verify that the requested book ID, country and currency agree.

The organisation and membership structure is specified in Stage 12B. Every record below inherits its organisation and book scope from its path; clients must not be allowed to move records between organisations or books by changing a field.

## 3. Core document shapes

All IDs are Firestore-generated/random opaque IDs. Do not use email addresses, phone numbers, passport/Emirates ID/CNIC numbers, names, or sequential voucher numbers as document IDs.

### Organisation and book

`organizations/{orgId}`:
- `name`: string, required, length-limited.
- `createdBy`: Auth UID, immutable.
- `createdAt`: server timestamp.
- `status`: controlled enum.

`organizations/{orgId}/books/{bookId}`:
- `countryCode`: exactly `AE` or `PK`.
- `functionalCurrency`: exactly `AED` for AE or `PKR` for PK.
- `bookName`: display label.
- `financialYearStartMonth`: integer 1–12.
- `createdAt`: server timestamp.
- `status`: controlled enum.

Do not silently permit additional countries or currencies. A future country requires an explicit architecture and compliance review.

### Properties

`properties/{propertyId}`:
- `name`, `propertyType`, `address` and permitted address components.
- `countryCode`, `bookCurrency` matching the parent book.
- `unitCount` (non-negative integer), `status`.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Optional safe descriptive metadata.

Do not place tenant identity documents, title deeds, private agreements, or image bytes in this document.

### Tenants

`tenants/{tenantId}`:
- `displayName`, optional permitted contact fields, `status`.
- Optional property/unit relationship IDs, validated against the same book.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Sensitive identity numbers and identity document contents are out of scope for the Spark-only initial data layer. Do not store them as unprotected ordinary fields.

### Vendors

`vendors/{vendorId}`:
- `displayName`, `category`, optional business contact fields, `status`.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Do not store vendor identity documents or private attachments in Firestore.

### Rent invoices and receipts

`rentInvoices/{invoiceId}`:
- `propertyId`, `tenantId`, `invoiceNumber`, `issueDate`, `dueDate`.
- `amountMinor`: positive integer in the book's currency minor unit.
- `currency`: must equal parent book functional currency.
- `status`: controlled lifecycle such as draft/issued/void; no client-settled status based solely on a UI calculation.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

`receipts/{receiptId}`:
- `voucherNumber`, `receiptDate`, `propertyId`, `tenantId`.
- `amountMinor`: positive integer.
- `currency`: must match the parent book.
- `paymentMethod`, optional `reference`, `description`.
- `sourceStatus`: initially source-record/draft until trusted posting exists.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

A receipt source record is not proof of cash received or a posted ledger entry. Do not update invoice balances or financial statements based on client-side arithmetic.

### Vendor bills and payments

`vendorBills/{billId}`:
- `vendorId`, optional `propertyId`, `billNumber`, `billDate`, `dueDate`.
- `amountMinor`: positive integer.
- `currency`: parent book currency.
- `status`: controlled source-document lifecycle.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

`payments/{paymentId}`:
- `voucherNumber`, `paymentDate`, `vendorId`, optional `propertyId`.
- `amountMinor`: positive integer.
- `currency`: parent book currency.
- `paymentMethod`, optional `reference`, `description`.
- `sourceStatus`: source-record/draft until trusted posting exists.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

### Chart of accounts and journal drafts

`accounts/{accountId}`:
- `code`, `name`, `accountType`, `normalBalance`, `isSystem`, `isActive`.
- Unique account code within one book; validate uniqueness in a trusted workflow or a carefully constrained transaction.
- Account definitions are book-specific. Never share a live balance between AE and PK books.

`journalDrafts/{journalId}`:
- `journalDate`, `description`, `currency`, `status: "Draft"`.
- `lines`: bounded array of account ID, debitMinor, creditMinor and line description.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Validate each line and require positive amounts on one side only; total debits must equal total credits before marking a draft as balanced.
- Keep drafts separate from any authoritative posted-journal collection.

The client must never write to `postedJournals`, account balances, allocations, period-close records, or audit events that claim trusted posting. Spark-only browser code cannot provide a trusted accounting posting boundary.

## 4. Money, dates, and identifiers

- Store money as integer minor units (for example, fils for AED and paisa for PKR) with an explicit currency. Never use JavaScript floating-point values as authoritative money.
- Define and document rounding rules before implementing tax, FX, proration, or allocation calculations.
- Do not mix currencies in a single book. No automatic conversion between AED and PKR.
- Use Firestore timestamps for event times and an explicitly documented date-only representation for accounting dates. Keep timezone handling consistent and display dates in the user's chosen locale.
- Generate voucher display numbers separately from document IDs. Uniqueness and gap-free numbering cannot safely be promised by a client-only implementation; defer authoritative numbering until a trusted mechanism exists.
- Use server timestamps for authoritative creation/update metadata where supported by rules; never trust a client-supplied creator UID.

## 5. Relationships and deletion policy

- Store parent references as opaque IDs, but validate that referenced property, tenant, vendor, account and invoice records exist in the same organisation and book.
- Do not rely on a reference string alone to prove access or existence.
- Avoid cascading deletes from the client. Financial source records should normally be voided/corrected through an auditable workflow rather than erased.
- Define retention, legal hold, correction, and user-account deletion policies before production use.
- Do not create cross-book links for operational records. Consolidated reporting, if ever approved, must be a separate read-only reporting layer with explicit FX rates, dates, and disclosures.

## 6. Activity and audit trail

An `activity` item may record non-authoritative user-facing events such as a property profile being edited. Each event should include:
- `eventType`, `entityType`, `entityId`.
- `actorUid`, `occurredAt`.
- A minimal safe summary, avoiding sensitive personal data.

A client-generated activity list is not a tamper-proof audit log. Do not describe it as immutable or regulator-grade. Trusted financial audit events require a server-controlled writer, which is not included in the current Spark-only architecture.

## 7. Query, index, and Spark quota strategy

- Paginate collection reads using stable ordering and cursors; never load an entire organisation history by default.
- Filter by the active book and bounded date ranges.
- Avoid unbounded real-time listeners, repeated full-collection reads, and chatty per-row document lookups.
- Fetch only fields and documents needed by the current screen where practical.
- Use predictable document paths and bounded subcollections.
- Add only composite indexes required by actual tested queries. Keep an index manifest in source control once query patterns are implemented; do not invent or deploy indexes during this design-only stage.
- Track reads, writes, deletes, stored bytes, and outbound traffic against the current Spark quotas. Stop or degrade nonessential reads before approaching the free limit.
- Recheck official Firebase quotas and terms before provisioning; quotas and plan terms can change.

## 8. Security rules and validation handoff

Stage 12B defines the authentication, membership and organisation boundary. Stage 12C adds the following data-layer invariants to test in the Emulator Suite:
- Every record is accessible only through an authenticated active organisation member.
- A record path's org and book IDs are immutable.
- Book country and currency must be an allowed matching pair.
- Every linked property, tenant, vendor, invoice and account belongs to the same org/book.
- Amounts are integer minor units within safe bounds; dates and enums are validated.
- Clients cannot write trusted posting, balances, allocations, period closes, or immutable audit records.
- Client writes cannot spoof creator/updater identity or server timestamps.
- Unexpected fields and malformed nested journal lines are rejected.
- Queries are constrained to the caller's permitted organisation and book; rules are not filters.

Do not ship permissive rules to make queries pass. A query that cannot prove its access constraints must be redesigned.

## 9. Prototype migration boundary

Current localStorage keys include properties, tenants, vendors, receipts, payments, accounting setup, journal drafts and related preview state. These are prototype records, not verified production data.

If migration is approved in a later stage:
1. Inventory and export the local records without deleting the originals.
2. Show the owner a preview of record counts, countries, currencies, duplicates, missing links and invalid values.
3. Map records into the correct organisation and country book.
4. Convert money to integer minor units and validate every relationship.
5. Require explicit owner approval of the import preview.
6. Import in bounded batches with resumable progress and idempotency safeguards.
7. Reconcile source and destination counts and totals separately for AE/AED and PK/PKR.
8. Preserve an export/rollback copy until verification is complete.
9. Do not migrate sample/demo records as real financial records.

No migration is authorised by this plan.

## 10. Acceptance tests and exit criteria

Before any live integration:
1. UAE property/tenant/vendor records cannot be read or written through the Pakistan book path, and vice versa.
2. Wrong country/currency pair is denied.
3. Cross-organisation document references are denied.
4. A receipt cannot link to a tenant/property from another book.
5. A payment cannot link to a vendor from another book.
6. Invalid, fractional, negative, or out-of-range money values are rejected.
7. Unbalanced journal drafts cannot be marked balanced.
8. Client writes to posted journals, balances, allocations, period closes and trusted audit records are denied.
9. Pagination returns stable bounded pages without duplicate/missing records in the test dataset.
10. Unauthenticated and non-member reads/writes are denied.
11. Delete/correction workflows preserve the agreed audit and retention requirements.
12. Quota and offline/network failure behaviour is documented and tested.

Stage 12C is ready for emulator-backed implementation planning only when the schema, path constraints, and test cases are reviewed. It does not authorise Firebase setup or app integration.

## 11. Current status

- Stage 12A Firebase Spark architecture: documented.
- Stage 12B authentication and organisation access: documented, including welcome page, device PIN and biometric requirements.
- Stage 12C Firestore data model: documented in this file.
- Firebase account signup: not confirmed.
- Firebase project/database: not created.
- Billing account: not linked.
- Paid services: not activated.
- Security Rules / Emulator tests: not implemented.
- Live app and localStorage prototype: unchanged.
- Browser testing: not performed; this is a documentation-only milestone.
