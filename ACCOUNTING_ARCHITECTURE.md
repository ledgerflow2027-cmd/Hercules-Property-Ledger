# Propledger 2027 — Stage 8 Accounting Architecture & Implementation Plan

**Document status:** Approved architecture baseline  
**Prepared:** 8 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`  
**Current application entry point:** `index.html`

## 1. Decisions confirmed by the product owner

| Decision | Confirmed direction |
|---|---|
| Backend provider | Deferred. Do not select or integrate a provider in Stage 8A. |
| Accounting structure | Separate accounting books for the UAE and Pakistan. |
| Consolidation | Optional management consolidation may be added later, without merging statutory/local ledgers. |
| Existing app | Continue in this repository and preserve existing workflows. |
| Current storage | Browser localStorage is prototype-only and is not an authoritative accounting database. |

The backend decision remains deliberately open. The data model below is provider-neutral and is designed to map to a relational database when the provider is selected.

## 2. Stage 8 objective and scope

Build an auditable, multi-entity, multi-country double-entry accounting foundation that can support:

- UAE books with AED as the initial functional currency.
- Pakistan books with PKR as the initial functional currency.
- Separate country-level chart of accounts, accounting periods, journals and reports.
- Property, tenant, vendor and owner dimensions.
- Income and expense voucher workflows.
- General Ledger and Trial Balance.
- Accounts Receivable and Accounts Payable.
- Profit & Loss, Balance Sheet, Cash Flow and Statements of Account.
- Controlled posting, reversal, correction and audit history.

Stage 8 is not a tax-compliance certification. UAE and Pakistan tax treatments, VAT/sales tax, withholding, depreciation, statutory formats and accounting policies must be reviewed by qualified local professionals before production use.

## 3. Core accounting principles

1. **Double entry:** every posted journal must have total debits equal to total credits in its book currency.
2. **Draft is not posted:** saved vouchers and previews do not change ledger balances.
3. **Immutable posting:** posted journal lines are not silently edited or deleted. Correct errors through linked reversal and replacement/adjustment entries.
4. **Country isolation:** every accounting record belongs to one legal entity and one country book. UAE and Pakistan records cannot be mixed in a journal.
5. **Currency discipline:** every journal is denominated in one book currency. AED and PKR amounts are never summed directly.
6. **Foreign currency:** where enabled later, retain transaction currency, transaction amount, exchange rate, rate date/source and functional-currency equivalent. FX gains/losses require explicit journals.
7. **Dimensions:** journals may be tagged to property, tenant, vendor, unit, project or department, but dimensions do not replace the general ledger.
8. **Auditability:** record who created, approved, posted, reversed or changed each item, with timestamps and reason.
9. **Period control:** prevent posting into locked periods except through an authorised reopening process with an audit record.
10. **Server-side enforcement:** production validation and posting must run transactionally on a trusted backend. Browser JavaScript is not a security boundary.

## 4. Country book model

Each legal entity owns its own book:

- UAE entity: country = AE; functional currency = AED.
- Pakistan entity: country = PK; functional currency = PKR.

Each book has its own:
- Chart of Accounts.
- Financial year and accounting periods.
- Journal sequence.
- Opening balances.
- General Ledger and Trial Balance.
- Financial statements.
- Tax configuration, once reviewed and approved.

A future consolidated management report may translate each entity's statements into a selected presentation currency using documented rates and consolidation adjustments. It must preserve the original entity books and disclose the exchange-rate basis.

Do not assume every customer has only one legal entity per country. The data model allows multiple organisations and entities.

## 5. Provider-neutral data model

All primary records use stable IDs (UUIDs recommended), organisation/entity ownership and created/updated timestamps. Amounts use fixed-precision decimal types in the backend, never binary floating-point for accounting calculations.

### Organisation and access
- organisations: customer/company workspace.
- legal_entities: registered accounting entities; country, functional currency, timezone and reporting settings.
- users: authenticated identities, linked through memberships.
- memberships: user, organisation, entity scope and role.
- roles/permissions: owner, accountant, approver, read-only and other configurable roles.

### Master data
- properties: property records, linked to one legal entity.
- units: optional individual rentable units.
- tenants: tenant/customer master.
- vendors: supplier master.
- contacts: addresses and communication details.
- dimensions: reusable property, unit, department or project tags.

### Accounting setup
- accounts: account code, name, account type, normal balance, parent account, active status and control-account flags.
- accounting_periods: entity, start/end dates, open/closed/locked status.
- journal_sequences: entity and journal type numbering rules.
- tax_codes: only after local professional review; country/entity scoped.

### Transactions
- journal_entries: entity, journal number, date, description, source type/id, status, currency, posting metadata, reversal linkage.
- journal_lines: journal, account, debit, credit, description, property/unit/tenant/vendor dimensions.
- receipts: receipt voucher header and source metadata.
- payments: payment voucher header and source metadata.
- allocations: receipt/payment allocations to invoices or open items.
- invoices/bills: optional receivable/payable documents when that workflow is introduced.
- attachments: secure object-storage references and metadata; never public URLs for identity or financial documents.

### Controls and audit
- audit_events: actor, action, entity, record type/id, timestamp, reason and change metadata.
- approval_requests: approval state and approver history.
- idempotency_keys: prevent duplicate posting from retries.
- import_batches: controlled opening-balance and migration imports.

## 6. Suggested initial Chart of Accounts

These are starter account groups, not a final statutory chart. Codes and tax accounts must be configurable by entity and reviewed locally.

| Code range | Account group | Examples |
|---|---|---|
| 1000–1999 | Assets | Cash, bank, receivables, tenant deposits held, prepaid expenses, fixed assets, accumulated depreciation |
| 2000–2999 | Liabilities | Vendor payables, tenant advances, security deposits payable, accrued expenses, loans, tax payable |
| 3000–3999 | Equity | Owner capital, retained earnings, current-year result, drawings/distributions |
| 4000–4999 | Income | Rental income, service charge income, other property income |
| 5000–5999 | Direct/property costs | Repairs, maintenance, cleaning, utilities, property management costs |
| 6000–6999 | Operating expenses | Professional fees, insurance, marketing, office and administrative costs |
| 7000–7999 | Finance and other | Bank charges, interest, foreign exchange gains/losses, other income/expense |

Account code, name, type, normal balance and posting permissions must be configurable. Control accounts (receivables, payables, bank, deposits) should not accept arbitrary manual postings unless an authorised exception is designed.

## 7. Posting lifecycle

1. User creates a receipt/payment voucher.
2. Application validates required master records, country/entity, currency, date and positive amount.
3. Voucher is saved as **Draft** or **Awaiting approval**. No ledger impact.
4. An authorised user reviews the supporting details.
5. Posting service creates the journal header and all journal lines in one atomic database transaction.
6. Database/service verifies:
   - at least two valid lines;
   - debit total equals credit total;
   - one entity and one book currency;
   - active/postable accounts;
   - open accounting period;
   - valid dimensions and source reference;
   - no duplicate idempotency key or prior posting.
7. Journal becomes **Posted** and the source voucher is linked to it.
8. Audit event records actor, time and action.
9. Corrections use a reversal journal and, if needed, a replacement journal. Original entries remain visible.

### Illustrative postings (not tax advice)

**Rent received into bank**
- Debit: Bank
- Credit: Rental income or tenant receivable, depending on whether rent was previously invoiced/accrued.

**Property maintenance bill received but unpaid**
- Debit: Repairs and maintenance expense
- Credit: Vendor payable.

**Vendor bill paid**
- Debit: Vendor payable
- Credit: Bank.

**Tenant security deposit received**
- Debit: Bank
- Credit: Tenant security deposit liability.

The exact account treatment depends on the business model, contracts and applicable accounting policy.

## 8. Reporting definitions and controls

- **General Ledger:** posted journal lines by account, date, entity and permitted dimensions, with opening, movement and closing balances.
- **Trial Balance:** debit and credit balances for all accounts for a selected period; total debits must equal total credits.
- **Receivables:** open tenant/customer balances, with allocation and ageing logic.
- **Payables:** open vendor balances, with allocation and ageing logic.
- **Property SOA:** posted transactions allocated/tagged to a property, with clear rules for shared costs.
- **Tenant SOA:** tenant charges, receipts, credits and open balance.
- **Vendor SOA:** vendor bills, payments, credits and open balance.
- **Profit & Loss:** income and expenses for a period, sourced only from posted entries.
- **Balance Sheet:** assets, liabilities and equity as of a date.
- **Cash Flow:** classified cash/bank movements, reconciled to cash/bank ledger accounts.

Every report must display entity, country, currency, date range/as-of date, generation time and whether it includes draft items (default: no).

## 9. Security and backend decision gate

Backend provider selection is deferred by the owner. Until selected:
- do not claim cloud sync, secure multi-user access or production accounting;
- do not store identity documents or sensitive financial records in localStorage;
- do not treat local browser data as a reliable ledger;
- use synthetic/demo data only for any client-side prototype.

Before Stage 8B production posting, choose and approve:
- backend/database provider and region;
- authentication and MFA/passkey approach;
- organisation/entity row-level access controls;
- private file storage and signed access;
- backup, restore and retention;
- encryption, secrets and monitoring;
- data export and account deletion;
- data residency/legal review for UAE and Pakistan.

A relational database with atomic transactions and strong constraints is required. PostgreSQL is a suitable database technology, but the hosting/backend vendor remains undecided.

## 10. Stage 8 implementation milestones

### 8A — Architecture baseline (this document)
- Confirm country-separated book model.
- Define provider-neutral schema and accounting rules.
- Define starter chart and posting lifecycle.
- Record backend decision as deferred.
- Identify security and compliance gates.

### 8B — Chart of Accounts and entity accounting setup
- Define entity/book setup screens and configuration model.
- Seed configurable UAE and Pakistan starter account templates.
- Add account validation, hierarchy and active/postable controls.
- Define period and numbering configuration.
- Do not post real transactions without an approved backend.

### 8C — Journal engine
- Implement journal header/line model.
- Implement atomic balanced posting and idempotency.
- Add draft, approval, posted, reversed states.
- Add audit events and locked-period checks.
- Build automated accounting tests.

### 8D — General Ledger and Trial Balance
- Account ledger with opening/movement/closing.
- Period filters and entity/currency filters.
- Trial Balance with debit-credit equality validation.
- Exportable reports.

### 8E — Subledgers and allocations
- Tenant receivables and receipt allocations.
- Vendor payables and payment allocations.
- Property/tenant/vendor dimensions and statements.
- Reconcile subledger control totals to General Ledger.

### 8F — Financial statements and close
- Profit & Loss.
- Balance Sheet.
- Cash Flow.
- Period close/reopen with permissions and audit.
- Reversal/correction workflow.
- Financial statement cross-checks.

## 11. Acceptance test plan

Use synthetic, deterministic fixtures for each country. Test UAE and Pakistan separately.

1. A valid journal with equal debits and credits posts.
2. An unbalanced journal is rejected without partial writes.
3. A one-line journal is rejected.
4. Zero and negative voucher amounts are rejected where not valid.
5. AED journal cannot post to PKR book, and vice versa.
6. UAE user cannot read Pakistan entity records without explicit membership.
7. Closed/locked period rejects posting.
8. Duplicate request/retry cannot create duplicate journals.
9. Posted journal cannot be edited or deleted.
10. Reversal creates equal and opposite entries and retains original.
11. Trial Balance totals balance.
12. Receivable/payable subledger totals reconcile to control accounts.
13. Property, tenant and vendor statements agree with their underlying posted lines.
14. P&L includes only income/expense accounts and posted entries.
15. Balance Sheet balances under the configured accounting model.
16. Cash Flow reconciles to cash/bank movement.
17. Rounding and decimal precision are tested.
18. Cross-entity reports do not add AED and PKR without explicit conversion.
19. Audit events capture posting, approval, reversal and period changes.
20. Backup restoration and export/import are tested before production.

## 12. Stage 8 exit criteria

Stage 8 is complete only when:
- country-separated entity books are enforced;
- chart of accounts and accounting periods are configurable;
- posting is atomic, balanced and auditable;
- General Ledger and Trial Balance reconcile;
- receivable/payable subledgers reconcile to control accounts;
- financial statements are generated from posted entries only;
- UAE and Pakistan fixtures pass the acceptance suite;
- backend/security decisions required for production are approved and implemented;
- limitations and local accounting/tax review are documented.

A UI mock-up or localStorage calculation alone does not satisfy these criteria.

## 13. Dependencies and relationship to later stages

- Stage 9 document generation consumes approved voucher and ledger data.
- Stage 10 analytics consumes posted accounting data only.
- Stage 11 settings manages entity, language, currency and user preferences.
- Stage 12 secure backend is a prerequisite for real multi-user cloud operations. Its provider decision is currently deferred and must be resolved before production posting.
- Stage 13 QA validates accounting, security, localization and mobile behavior.
- Stages 14–17 package, test and publish the Android application on Google Play.

## 14. Current project baseline

At the time this architecture was recorded:
- Stages 1–6 were completed.
- Stage 7 payment voucher workflow was committed as `ffbd3c673c4753a4ed97dafdfa58c5ace3861fd8`.
- Stage 7 GitHub Actions run `42477776426` completed successfully.
- Main app remains `index.html`.
- Existing receipt and payment vouchers are local previews and are not posted journals.
- The app has no production backend or secure cloud database.

**Next implementation task:** Stage 8B — define the country/entity accounting setup and configurable starter Charts of Accounts, while keeping the backend provider undecided and avoiding any claim that local browser records are production accounting data.
