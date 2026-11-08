# Propledger 2027 — Stage 12D Security Rules, Data Protection and Accounting Boundaries

**Status:** Security design and test specification only; no rules deployed and no Firebase project/database authorised.  
**Prepared:** 9 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Owner-approved boundaries

- Firebase Spark only; strict budget USD 0.
- No billing account, Blaze upgrade, paid services, or surprise paid dependencies.
- Preferred Firestore location: Doha (`me-central1`).
- UAE and Pakistan books remain separate (`AE_AED` and `PK_PKR`).
- GitHub Pages app remains the current prototype; localStorage is not secure cloud storage.
- This is design documentation only. No Firebase project, Firestore database, Security Rules, indexes, Auth settings, storage bucket, migration, or live code change is authorised here.

## 2. Security posture

Use deny-by-default rules. Grant access only after proving:
1. The request is authenticated.
2. The caller has an active membership in the exact organisation path.
3. The requested operation is allowed for the caller's role.
4. The document belongs to the correct organisation and book.
5. The incoming fields, types, values, and relationships satisfy the schema.
6. The operation does not alter protected identity, ownership, country, currency, posting, or audit fields.

Security Rules are an enforcement boundary, not a UI feature. Hiding a menu item, using an obscure document ID, or checking membership only in JavaScript is not authorisation.

## 3. Organisation membership and role controls

Initial scope is a single owner per organisation:
- Auth UID must match the membership document path and stored UID.
- The initial owner membership may only be created atomically with its organisation, using a carefully tested `getAfter()` rule if supported by the final rule design.
- A user cannot add themselves to an existing organisation.
- A user cannot create a second owner, assign another person a role, change their own role, or modify immutable membership fields.
- No staff invitations, public join links, or client-side role administration in this phase.
- If first-owner bootstrap cannot be proven safe within Firestore Rules limits, defer it. Do not create a weaker fallback.

Every organisation-scoped read and write must check active membership. A member of Org A must not gain access to Org B by guessing or substituting an ID.

## 4. Country-book isolation

Allowed book identity pairs are fixed:
- `AE_AED` → `countryCode: "AE"`, `functionalCurrency: "AED"`.
- `PK_PKR` → `countryCode: "PK"`, `functionalCurrency: "PKR"`.

Rules and trusted schema validation must reject:
- A Pakistan record under the UAE book path, or vice versa.
- A currency that does not match the book.
- A record moved between book paths by client update.
- A reference to a property, tenant, vendor, invoice, or account in another book.
- A cross-organisation reference, even if the referenced ID exists.

Do not treat a client-supplied `countryCode`, `orgId`, or `currency` field as proof of ownership. The canonical path and parent book configuration are authoritative.

## 5. Field-level write controls

For every collection, explicitly allow only known fields and types. Reject unknown fields to prevent privilege-bearing or unreviewed data from being smuggled into documents.

Immutable or server-controlled fields include:
- Organisation creator and organisation status transitions.
- Member UID, role, membership status, and organisation association.
- Book ID, country code, and functional currency.
- Creator identity and creation timestamp.
- Trusted updater identity and server-managed timestamps.
- Journal posting status and posting metadata.
- Account balances, allocation status, period-close status, and audit event integrity fields.

Client writes must not be able to impersonate another UID by supplying `createdBy`, `updatedBy`, `actorUid`, or equivalent fields. Where a client-editable source record needs metadata, the rule must bind identity to `request.auth.uid` and protect immutable fields with `diff().affectedKeys()` checks.

Validate:
- Required fields, types, and bounded string lengths.
- Enumerated status and payment-method values.
- Positive integer minor-unit amounts within safe bounds.
- Date and timestamp types.
- Bounded arrays and nested objects.
- Parent-child references within the same organisation and book.
- Document size and any application-specific limits.

Do not assume Firestore Rules can replace full accounting validation. Complex journal balancing, allocation, unique numbering, or multi-document invariants may exceed what is safe or practical in client rules.

## 6. Financial record boundaries

The initial Spark-only model permits, after rules and emulator proof:
- Owner-managed property, tenant, vendor source records.
- Receipt/payment source records, explicitly identified as unposted.
- Journal drafts, clearly marked `Draft`.
- Read-only preview reports derived from clearly labelled source data.

The client must be denied writes to:
- `postedJournals`.
- Authoritative account balances.
- Invoice settlement balances or trusted allocation records.
- Period-close locks and final close records.
- Trusted immutable financial audit events.
- Any status or metadata that claims an authoritative accounting posting has occurred.

A balanced journal draft is not a posted journal. A receipt or payment voucher is not proof of settlement. Client-side totals and dashboards are not official financial statements. These boundaries remain until a trusted server-side posting mechanism is explicitly approved and available.

## 7. Firestore Rules design sketch — not deployable production rules

The following is a conceptual pattern, not a complete or tested `firestore.rules` file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isActiveMember(orgId) {
      return signedIn()
        && exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid))
        && get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.status == "active";
    }

    match /organizations/{orgId} {
      allow read: if isActiveMember(orgId);
      // Organisation create/update/delete requires separately proven
      // bootstrap and ownership rules. Default deny until then.

      match /members/{uid} {
        allow read: if isActiveMember(orgId) && uid == request.auth.uid;
        // Membership writes are denied to clients by default after
        // bootstrap. No self-join, self-promotion, or role changes.
      }

      match /books/{bookId}/{document=**} {
        allow read: if isActiveMember(orgId)
          && bookId in ["AE_AED", "PK_PKR"];
        // Writes must be declared per collection and validated
        // field-by-field. No broad recursive write grant.
      }
    }
  }
}
```

This sketch intentionally does not grant general writes. The final rules must use explicit matches for each collection and operation. It must also account for book configuration, path-to-document consistency, rule access-call limits, query constraints, and atomic-write semantics. Do not paste this sketch into a live project.

## 8. Private documents and file handling

Under the approved Spark-only plan, Firebase Cloud Storage is not available for this architecture. Therefore:
- Do not create a Storage bucket or enable Blaze to obtain one.
- Do not store private identity documents, tenancy agreements, passports, Emirates IDs, CNICs, title deeds, or document images as base64 fields in Firestore.
- Do not use public GitHub repository assets or public URLs for private user documents.
- Do not claim a filename saved in the prototype means the document itself is securely uploaded.
- Keep document attachment and secure upload functionality deferred until an approved $0-compatible secure storage design is proven or the owner explicitly changes the budget decision.

## 9. Authentication, PIN, and biometric protection

- Firebase Auth email/password is the first account authentication method; no SMS OTP in the Spark-only plan.
- Email verification does not replace membership checks in Security Rules.
- Never store account passwords, PINs, raw biometric data, refresh tokens, or private credentials in Firestore or ordinary localStorage.
- Device PIN and Face ID/fingerprint are native-app device-unlock requirements for later Android/iOS packaging, using platform-protected storage and operating-system biometric prompts.
- The current browser prototype must not simulate native biometrics or describe a browser-stored PIN as secure device authentication.
- Account sign-out, device reset, app data deletion, and credential changes must invalidate local unlock state as appropriate.

## 10. Emulator test suite — mandatory before any deployment

Use Firebase Emulator Suite with automated rules tests. Include at minimum:

### Identity and organisation
1. Unauthenticated read and write are denied.
2. Authenticated non-member cannot read or write an organisation.
3. Active owner can read their own organisation.
4. Owner of Org A cannot read or write Org B.
5. First owner bootstrap succeeds only as one atomic operation satisfying all invariants, or is denied.
6. User cannot join an existing organisation by creating their own member document.
7. User cannot self-promote, create a second owner, or write another UID's membership.
8. Member cannot change immutable organisation creator or membership fields.

### Country and book isolation
9. AE user/book operations with AED succeed where otherwise authorised.
10. PK user/book operations with PKR succeed where otherwise authorised.
11. AE/PK mismatch, AED/PKR mismatch, unknown country, or unknown book is denied.
12. Cross-book and cross-organisation foreign references are denied.
13. A client cannot move a document to another book by changing path or protected fields.

### Data integrity and accounting
14. Unknown fields, wrong types, oversized strings, malformed nested data, and invalid enum values are denied.
15. Negative, fractional, zero where prohibited, and out-of-range amounts are denied.
16. Client cannot spoof creator/updater/actor identity or timestamps.
17. Client cannot write posted journals, balances, allocations, period close, or trusted audit records.
18. Journal draft lines are bounded and structurally valid; do not rely on Rules alone for complex balancing.
19. Queries that do not constrain access to the caller's authorised organisation/book fail safely.
20. Deletes and edits respect retention/correction policy.

### Operational behaviour
21. Pagination is bounded and does not leak other organisations' data.
22. Sign-out clears visible private cached data.
23. Offline, timeout, and quota errors do not silently report a successful save.
24. A quota-exhausted or unavailable service state is clearly shown without switching to paid services.

Test both allowed and denied paths. Rules are not filters: the query must itself prove that every returned document is authorised. A passing UI test does not substitute for Rules Emulator tests.

## 11. Release and incident safeguards

Before production data:
- Review rules and schemas independently.
- Keep rules and tests in version control.
- Use a separate non-production test dataset/project if permitted within the free plan and current quota.
- Review Firebase usage and stop nonessential requests before the free quota is exhausted.
- Document a manual export/recovery procedure that does not imply managed backups are free.
- Define incident response for lost device, compromised email account, accidental disclosure, and owner lockout.
- Never put service-account keys or Admin SDK credentials in browser code, repository files, or client build artifacts.

## 12. Stage 12D exit criteria

Stage 12D design is complete when:
1. Every collection has explicit read/write policy.
2. Organisation membership and country-book isolation are covered by automated tests.
3. Client writes to trusted accounting paths are denied.
4. Private document storage is clearly deferred under Spark.
5. Auth, PIN, and biometric boundaries are documented.
6. Rules pass the Emulator Suite test matrix before any real project deployment.
7. No paid plan or billing account is required for the approved implementation scope.

If any requirement cannot be met safely on Spark, stop and report the blocker. Do not weaken rules or silently activate a paid service.

## 13. Current status

- Stage 12A Firebase Spark architecture: documented.
- Stage 12B authentication, organisation access, welcome page, PIN and biometrics: documented.
- Stage 12C Firestore data model: documented.
- Stage 12D Security Rules and data-protection design: documented in this file.
- Firebase account signup: not confirmed.
- Firebase project/database: not created.
- Billing account: not linked.
- Paid services: not activated.
- Security Rules / Emulator tests: not implemented or deployed.
- Live GitHub Pages app: unchanged.
- Browser testing: not performed; documentation-only milestone.
