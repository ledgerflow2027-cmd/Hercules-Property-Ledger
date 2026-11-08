# Propledger 2027 — Stage 12C Revised Unified Ledger Data Model

**Status:** Revised architecture approved by the owner; documentation only. No Firebase project/database, cloud integration, security-rule deployment, data migration, or trusted posting is authorised by this document.  
**Prepared:** 9 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Confirmed product decisions and limits

- One unified, full-stack ledger for the owner's property business across all supported countries. Country must not create separate accounting books or segregate the ledger.
- The login/welcome screen must let the user choose **language, country/region, and display currency**.
- The selected display currency is a global presentation preference. Its sign/code is used consistently throughout dashboard totals, properties, tenants, vendors, receipts, payments, account balances, statements and reports.
- **No FX conversion is performed.** Changing the selected display currency changes the displayed currency label/sign only; stored numeric amounts remain unchanged.
- Country remains available as descriptive/operational metadata on the user profile, property, tenant, vendor and relevant transaction records. It is not a ledger partition key.
- Currency must be called **display currency**, not functional currency or transaction currency, in the UI and data model.
- Because the user has explicitly chosen symbol-only relabelling, displayed reports are not currency-converted financial statements and must carry a clear notice that values are shown using the selected display currency without FX conversion. Never imply that switching AED to PKR changes the underlying value.
- Firebase Spark only; budget strictly USD 0. Do not link a billing account, enable Blaze, or activate paid services.
- Preferred Firestore region remains Doha, `me-central1`; database location is immutable once created.
- Current GitHub Pages app remains a local prototype. LocalStorage data is not production cloud data. No local records have been read, migrated, or uploaded.
- No Firebase project, database, collections, indexes, security rules, migration, or live application code change is authorised by this document alone.

## 2. Unified Firestore hierarchy

Use one organisation boundary and one ledger namespace. Do not create country-specific book subcollections.

```
organizations/{orgId}
  members/{uid}
  preferences/{preferenceId}       # language, country, displayCurrency
  properties/{propertyId}
  tenants/{tenantId}
  vendors/{vendorId}
  rentInvoices/{invoiceId}
  receipts/{receiptId}
  vendorBills/{billId}
  payments/{paymentId}
  accounts/{accountId}
  allocations/{allocationId}
  journalDrafts/{journalId}
  postedJournals/{journalId}       # trusted posting boundary only
  activity/{activityId}
  periodCloses/{periodId}          # trusted server path only
```

All business records belong to the same organisation ledger regardless of country. Queries may filter by country for operational views, but country filters must never silently omit records from organisation-wide ledger balances or consolidated reports.

The organisation and membership structure is specified in Stage 12B. Every record inherits its organisation scope from its path. Clients must not move records between organisations by changing a field.

## 3. User preferences

`organizations/{orgId}/preferences/{preferenceId}` (or a single owner preference document):
- `language`: supported locale code, initially `en`, `ar`, or `ur`.
- `countryCode`: selected country/region, initially `AE` or `PK`; extensible without creating a new ledger.
- `displayCurrency`: selected ISO 4217 currency code, initially support at least `AED` and `PKR`; additional currencies require a validated currency catalogue and formatting tests.
- `updatedAt`, `updatedBy`.

The selected currency is a display preference only. Do not use it to rewrite amounts or create country books. Changing this preference must not mutate any financial source record or journal.

## 4. Core document shapes

All IDs are Firestore-generated/random opaque IDs. Do not use email addresses, phone numbers, passport/Emirates ID/CNIC numbers, names, or sequential voucher numbers as document IDs.

### Properties
- `name`, `propertyType`, `address` and permitted address components.
- `countryCode`: descriptive property location; not a book ID.
- `unitCount` (non-negative integer), `status`.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Optional safe descriptive metadata.

Do not place tenant identity documents, title deeds, private agreements, or image bytes in this document.

### Tenants
- `displayName`, optional permitted contact fields, `status`.
- Optional property/unit relationship IDs, validated against the same organisation.
- Optional `countryCode` for descriptive identity/contact context.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Sensitive identity numbers and identity document contents are out of scope for the Spark-only initial data layer. Do not store them as unprotected ordinary fields.

### Vendors
- `displayName`, `category`, optional business contact fields, `status`.
- Optional `countryCode` as descriptive metadata.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Do not store vendor identity documents or private attachments in Firestore.

### Rent invoices and receipts
Rent invoices:
- `propertyId`, `tenantId`, `invoiceNumber`, `issueDate`, `dueDate`.
- `amountMinor`: positive integer representing the entered numeric amount in the app's neutral amount scale.
- `status`: controlled lifecycle such as draft/issued/void.
- Optional `countryCode` copied as descriptive context only.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Receipts:
- `voucherNumber`, `receiptDate`, `propertyId`, `tenantId`.
- `amountMinor`: positive integer; never rewritten when display currency changes.
- `paymentMethod`, optional `reference`, `description`.
- `sourceStatus`: initially source-record/draft until trusted posting exists.
- Optional `countryCode` as descriptive context only.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

A source receipt is not proof of cash received or a posted ledger entry. Do not update invoice balances or financial statements based on client-side arithmetic.

### Vendor bills and payments
Vendor bills:
- `vendorId`, optional `propertyId`, `billNumber`, `billDate`, `dueDate`.
- `amountMinor`: positive integer in the neutral amount scale.
- `status`: controlled source-document lifecycle.
- Optional `countryCode` as descriptive context only.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

Payments:
- `voucherNumber`, `paymentDate`, `vendorId`, optional `propertyId`.
- `amountMinor`: positive integer; never rewritten when display currency changes.
- `paymentMethod`, optional `reference`, `description`.
- `sourceStatus`: source-record/draft until trusted posting exists.
- Optional `countryCode` as descriptive context only.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.

### Accounts and journals
Accounts:
- `code`, `name`, `accountType`, `normalBalance`, `isSystem`, `isActive`.
- Unique account code across the single organisation ledger.
- Account definitions and balances are not duplicated by country.

Journal drafts:
- `journalDate`, `description`, `status: "Draft"`.
- `lines`: bounded array of account ID, debitMinor, creditMinor and line description.
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`.
- Validate each line and require positive amounts on one side only; total debits must equal total credits before marking a draft as balanced.
- Keep drafts separate from authoritative posted journals.

The client must never write to `postedJournals`, account balances, allocations, period-close records, or audit events that claim trusted posting. Spark-only browser code cannot provide a trusted accounting posting boundary.

## 5. Money display and accounting limitations

- Keep numeric amounts unchanged when the user changes the selected display currency.
- Render all account and report values using the one selected display currency sign/code. Prefer showing the ISO code alongside the symbol where ambiguity is possible.
- Do not run exchange-rate lookups, multiply/divide amounts, or apply FX rounding.
- Do not store a country-specific functional currency or create separate UAE/Pakistan book IDs.
- Since symbol-only relabelling does not convert economic value, every financial report must include a visible statement such as: **"Display currency: [CODE]. Amounts are not converted; changing this setting changes the label only."**
- Do not call these reports FX-converted, statutory, tax-ready, bank-reconciled, or authoritative financial statements.
- If future requirements need real multi-currency accounting, FX rates, realised/unrealised gains, or statutory reporting, that is a separate product decision and architecture revision. Do not infer or add it silently.
- Use integer minor units to avoid floating-point arithmetic, but define display precision per selected currency before expanding beyond two-decimal currencies.
- Generate voucher display numbers separately from document IDs. Uniqueness and gap-free numbering cannot safely be promised by a client-only implementation; defer authoritative numbering until a trusted mechanism exists.

## 6. Relationships, deletion and audit

- Store parent references as opaque IDs, but validate that referenced property, tenant, vendor, account and invoice records exist in the same organisation.
- Avoid cascading deletes from the client. Financial source records should normally be voided or reversed with an audit trail, not silently deleted.
- Preserve creator/updater metadata and immutable audit events through a trusted service before claiming an authoritative audit trail.

## 7. Security and privacy

- Deny access by default; scope all reads/writes to authenticated organisation membership.
- Validate field allowlists, types, sizes, relationships, amount bounds and state transitions.
- Never trust client-supplied role, owner UID, posting status, balance, voucher sequence or audit event.
- Sensitive identity documents and private attachments remain out of scope for the Spark-only initial data layer. Never put them in localStorage or public repository assets.
- Security-rule concepts in Stage 12D remain planning material until separately reviewed and deployed.

## 8. Migration and implementation sequence

1. Update the product UI to select language, country and display currency on the welcome/login page.
2. Replace country-book filters with one organisation-wide ledger; retain country only for descriptive and operational filtering.
3. Centralise currency formatting so every amount uses the selected display currency label without changing stored numbers.
4. Add clear non-conversion notices to financial reports and voucher previews.
5. Build automated tests proving that changing country or display currency does not change amounts, duplicate ledgers, or omit records from consolidated totals.
6. Design and review migration mapping for existing local/demo records. Do not read or migrate device localStorage without explicit approval.
7. Only after separate approval, evaluate Firebase Spark feasibility, security boundaries and emulator tests. No billing account; no Blaze; budget remains USD 0.

## 9. Current implementation status

- GitHub Pages is a static prototype using browser localStorage.
- The current code still contains country-specific filters, separate accounting setup objects, and AED/PKR-specific report formatting. This is legacy prototype behavior and does **not** yet satisfy the approved unified-ledger requirement.
- The login screen currently offers language and country but not a currency selector.
- No cloud sync, authenticated production database, trusted accounting posting, secure private document storage, or migration has been completed.
- This document revises the earlier Stage 12C separate-book proposal. The old country-book architecture is superseded by this unified-ledger decision.
