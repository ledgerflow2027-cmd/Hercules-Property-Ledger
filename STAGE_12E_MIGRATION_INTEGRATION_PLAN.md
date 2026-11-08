# Stage 12E — Migration and Prototype Integration Plan

**Status:** Architecture and migration plan only — not implemented.  
**Budget:** USD 0, Firebase Spark only.  
**Firestore location preference:** Doha, `me-central1`.  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`, branch `main`.  
**Live prototype:** https://ledgerflow2027-cmd.github.io/Hercules-Property-Ledger/

## 1. Owner-approved constraints and scope

- Firebase Spark only; hard budget ceiling is USD 0.
- Do not link a billing account, upgrade to Blaze, activate paid products, or enable a paid service.
- Doha (`me-central1`) remains the requested Firestore location, subject to a final location/availability check before any database is created. A Doha database is in Qatar; it is not UAE or Pakistan data residency.
- UAE and Pakistan books remain separate: `AE_AED` (AED) and `PK_PKR` (PKR).
- The current GitHub Pages application remains the live prototype. It continues to use browser-local data.
- This document authorises planning only. It does not authorise Firebase project creation, database creation, Authentication enablement, Security Rules deployment, live-code changes, data export/import, migration, or deletion.
- No migration or integration work may begin against real user records until the owner gives separate, explicit approval for that exact activity.

## 2. Current prototype inventory

The current `index.html` was inspected on `main`. The following localStorage keys or key constants were identified:

| Key | Current purpose / migration treatment |
|---|---|
| `propledger.properties` | Property records; candidate for property migration after record-level inspection and country validation. |
| `propledger.vendors` | Vendor records; candidate after country and relationship validation. |
| `propledger.receipts` | Local receipt voucher source records; migrate as source records only, not as posted accounting entries. |
| `propledger.payments` | Local payment voucher source records; migrate as source records only, not as posted accounting entries. |
| `propledger.accountingSetup` | Country-specific chart/setup and financial-year configuration; inspect actual nested shape before mapping. |
| `propledger.journalDrafts` | Unposted journal drafts; migrate only as drafts, preserving country and draft status. |
| `propledger.postedJournals` | Read by the prototype's GL/TB reporting path; contents may include demonstration or locally seeded records. Do not treat as trusted server-posted journals. Exclude from production posted-journal migration unless individually reviewed and explicitly approved; default is to keep them as clearly marked demo/local data. |
| `propledger.journalDraftAudit` | Local journal draft audit/history object; inspect structure and provenance. It is not a trusted server audit log. Do not promote it to one. |
| `propledger.rentInvoices` | Referenced by the current app; actual saved-record shape and whether meaningful user records exist must be inspected before any migration. |
| `propledger.vendorBills` | Referenced by the current app; actual saved-record shape and whether meaningful user records exist must be inspected before any migration. |
| `propledger.language`, `propledger.country`, `propledger.started` | Device/UI preferences and onboarding state; do not import as financial or organisation records. Re-establish preferences on the target device after sign-in. |
| `propledger.companyLogoPreview`, `propledger.founderPhoto`, `propledger.profilePreview` | Local image previews may be stored as data URLs. Do not migrate these or any private images to Firestore. Spark-only plan has no approved private file-storage path. |

The current code also contains a demo-data version marker (`propledger.demoData.v2`) used to manage demonstration seed data. It is application/device state, not a business record. Demo records must be identified by their explicit demo markers/IDs and excluded from a real-data import unless the owner specifically requests a separate demo environment.

This inventory is a code-level key inventory, not proof that the user's device contains any particular records. The code contains both local prototype records and demonstration data. Actual localStorage contents are on the user's device and have not been read by this planning step.

## 3. Pre-migration discovery and consent gate

Before any export or import:

1. Ask the owner to approve a one-time, read-only local-data inventory/export workflow.
2. On the owner's device, produce a preview only: record counts by key, country, currency, demo marker, and record type. Do not upload anything.
3. Show malformed JSON, unknown record shapes, duplicate IDs, duplicate voucher references, missing properties, orphan tenant/vendor references, country mismatches, currency mismatches, invalid or non-positive amounts, invalid dates, and oversized image/data fields.
4. Distinguish real owner-entered records from seeded sample/demo records. Ambiguous records remain excluded pending owner review.
5. Show the proposed import manifest and counts/totals separately for UAE/AED and Pakistan/PKR.
6. Obtain explicit owner approval of the exact manifest before any cloud write.
7. If the owner declines or does not approve, stop. Keep the live prototype and all local data unchanged.

No background or automatic import is permitted.

## 4. Owner-controlled backup and preservation

- Before migration, offer a machine-readable export (for example JSON) that the owner can save to a location they control.
- Include a manifest with export time, app/schema version, record counts, country split, and file hashes where feasible.
- Do not send identity-document contents, photos, or other private files to Firestore. Current document pickers often retain only filenames; those filenames do not mean the underlying file is available for migration.
- Never delete, overwrite, clear, or silently transform the original localStorage records as part of migration.
- Preserve the original export and local data until the owner has reviewed reconciliation and explicitly authorises any later cleanup.
- Do not store secrets, passwords, PINs, biometric material, or session tokens in the export.

## 5. Authentication and organisation bootstrap sequence

When separately approved and after the Firebase project is deliberately created on Spark:

1. Enable only the approved Firebase Authentication email/password method.
2. Implement registration/sign-in, email verification, password reset, session handling, and sign-out.
3. Do not implement phone/SMS OTP under the strict Spark budget.
4. Create the initial owner organisation only through the secure bootstrap procedure designed in Stage 12B.
5. Prove the first-owner bootstrap and membership rules in the Firebase Emulator Suite before any live use. If a secure one-time bootstrap cannot be proven, stop; do not weaken rules or allow arbitrary self-join.
6. Initially allow one owner account only. Do not add invitations, staff roles, or multi-user administration in this phase.
7. PIN and Face ID/fingerprint are separate later device-security work. Never migrate an existing PIN or biometric data. Do not store PINs or PIN hashes in localStorage or Firestore. Native biometric prompts belong in the Android/iOS packaging stage and must use OS-protected facilities.

## 6. Data-access adapter and staged integration

- Introduce a small repository/data-access layer between the UI and storage. UI screens should not directly assume that localStorage is the permanent database.
- Keep the current local adapter as the default until an approved Firebase adapter passes emulator tests.
- Add a deliberate environment/configuration switch. No silent fallback that writes different copies to local and cloud without clear status.
- In an initial pilot, use a non-production test organisation and synthetic test records only.
- Route every record through the selected country book: UAE records to `AE_AED`, Pakistan records to `PK_PKR`.
- Reject a property, tenant, vendor, voucher, invoice, bill, journal draft, or reference that crosses country-book boundaries.
- Preserve the source record ID as a migration mapping key, while assigning Firestore document IDs according to the approved data model.
- Use server timestamps for cloud-created/updated metadata; preserve original business dates separately.
- Use bounded, paginated reads and avoid unbounded real-time listeners to protect Spark quotas.

## 7. Normalisation and validation rules

- Inspect the actual source record before mapping; do not infer fields from UI labels.
- Store authoritative money as integer minor units (for example, fils or paisa) with an explicit currency code. Never use floating-point values as authoritative stored money.
- Verify currency against the book: AED only in `AE_AED`; PKR only in `PK_PKR`.
- Preserve date-only business dates separately from Firestore timestamps.
- Preserve voucher numbers as source references, but do not claim they are globally unique, gap-free, or server-authoritative. Trusted numbering requires a secure transactional design.
- Validate required fields, allowed field names/types, maximum lengths, and all referenced document relationships.
- Do not migrate base64/data-URL images, identity documents, private attachments, PINs, biometric data, session tokens, or secrets.

## 8. Idempotent, resumable migration design

If and only if approved:

1. Freeze the approved source export as the migration input; do not read a changing localStorage set midway through a run.
2. Generate a migration manifest and stable source-to-target mapping for each source record.
3. Use a deterministic import marker/source ID so retrying a batch cannot create duplicate target records.
4. Process bounded batches below Firestore transaction/write limits; record per-batch progress without exposing private data in logs.
5. Resume from the last verified batch after an interruption.
6. Treat validation failures as quarantined records for owner review; never silently discard them.
7. Keep the source export and original local data unchanged throughout.
8. Do not import prototype journal records into trusted posted journals, account balances, allocations, or period-close records.

## 9. Reconciliation and acceptance gate

After a test or approved migration, produce a reconciliation report with separate UAE and Pakistan sections:

- Source count, accepted count, rejected/quarantined count, and destination count by record type.
- Source and destination totals by currency for receipt and payment source records, calculated with integer minor units.
- Counts of duplicate, orphaned, invalid, and excluded demo records.
- Country/book and currency consistency checks.
- Relationship checks for properties, tenants, vendors, receipts, payments, invoices, bills, and journal drafts.
- Idempotency check: rerunning the same approved manifest produces no duplicate records and no unexpected changes.
- Spot-check a sample of source and destination records with the owner.
- Any unexplained count or amount difference blocks completion. Do not label the migration complete until all variances are resolved or explicitly accepted in writing by the owner.

These checks reconcile source records only. They do not turn receipts/payments into posted accounting entries or certify financial statements.

## 10. Rollback and incident handling

- The first response to a failed pilot is to stop writes and preserve logs/manifest, not to delete source data.
- Keep the local source and owner-held export intact.
- Use a dedicated test organisation for pilot rollback; remove only clearly identified test records after review.
- For a production migration, prepare a documented reverse/containment plan before the first write. Any cloud deletion requires a separate owner approval.
- If authentication, membership isolation, data leakage, cross-book access, or accounting integrity tests fail, disable the pilot and do not proceed to production.
- Spark quota exhaustion can make affected services unavailable until quota resets; do not add billing or upgrade automatically to recover.

## 11. Spark-only service boundaries

The plan must remain within Spark and USD 0:

- Firestore is the planned database, subject to current free quota and final location confirmation.
- Cloud Functions are not part of this Spark-only design.
- Firebase Cloud Storage is not part of this Spark-only design; do not upload private files or identity documents.
- Do not enable paid backups, point-in-time recovery, or other paid database features.
- Do not enable phone/SMS authentication.
- Do not link billing or auto-upgrade. If a requested capability cannot be delivered safely on Spark, defer it and explain the limitation rather than activating a paid service.
- Recheck official Firebase plan, quota, region, and feature requirements immediately before any future provisioning because terms can change.

## 12. Emulator-first test plan

Before any live cloud pilot, demonstrate:

1. Unauthenticated access is denied.
2. A user cannot read another organisation's records.
3. A user cannot join an organisation by guessing its ID.
4. A user cannot self-promote or create privileged membership.
5. Owner bootstrap can occur only once and atomically.
6. UAE users/book context cannot read or write Pakistan book records, and vice versa, except any separately approved reporting path.
7. AED/PKR currency mismatches are rejected.
8. Unknown fields, malformed types, invalid amounts, and invalid relationships are rejected.
9. Client writes to posted journals, balances, allocations, trusted audit events, and period closes are denied.
10. A retry of the same migration batch is idempotent.
11. A partial migration can resume without duplicate or lost records.
12. Demo records are excluded from the real-data manifest.
13. A failed or rejected record remains visible in the quarantine report.
14. Read/write usage remains within the approved Spark quota budget.
15. No operation links billing, upgrades the project, or invokes a paid service.
16. Local source data remains unchanged after export, pilot, failure, and rollback.

## 13. Landing page and device security dependencies

The owner-requested welcome page requirements remain in scope for a later approved implementation:
- Language selector: English, Arabic, Urdu.
- Short, positive Propledger 2027 introduction.
- First sign-in with email/password.
- Optional device PIN only if it can be stored and verified safely using platform-protected facilities, with rate limiting and recovery.
- Optional Face ID/fingerprint only after the first successful sign-in, through the native operating-system biometric prompt.
- PIN fallback and account recovery must remain available.
- Browser-only prototype must not claim native biometric or secure PIN functionality.

Do not migrate language preference as organisation data; it is a device preference. Do not migrate PIN or biometric material.

## 14. Acceptance criteria and exit decision

Stage 12E is complete as a planning document when the owner can review:
- Current localStorage key inventory and what is excluded.
- Consent, backup, preview, and no-loss migration workflow.
- UAE/Pakistan separation and integer-money normalisation.
- Idempotent/resumable migration, reconciliation, and rollback design.
- Emulator-first security gates and Spark-only service boundaries.
- Explicit approval gates before any provisioning, code integration, export, or import.

**Stage 12E planning is complete when this document is committed and verified.** Actual integration and migration remain unstarted.

## 15. Current status and next stage

- Stage 12D security design has passed its GitHub Actions deployment workflow.
- Stage 12E is documentation/planning only.
- No Firebase account, project, database, Authentication provider, Security Rules, index, or cloud record has been created.
- No local device data has been accessed or exported.
- No live `index.html` changes are included in this stage.
- No browser interaction test is applicable to this documentation-only commit.
- Next: **Stage 12F — Spark pilot readiness and go/no-go checklist**, still subject to the owner's strict USD 0 and explicit approval gates.