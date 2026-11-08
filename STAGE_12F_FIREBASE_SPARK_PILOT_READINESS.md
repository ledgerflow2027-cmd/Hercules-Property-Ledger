# Stage 12F — Firebase Spark Pilot Readiness and Go/No-Go

**Status:** Readiness checklist and decision gate only — no pilot has been provisioned or started.  
**Approved budget ceiling:** USD 0, strictly.  
**Firebase plan:** Spark only.  
**Preferred Firestore location:** Doha, `me-central1` (subject to live confirmation before database creation).  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`, branch `main`.  
**Current live prototype:** https://ledgerflow2027-cmd.github.io/Hercules-Property-Ledger/

## 1. Purpose and owner decision

Stage 12F consolidates the design from Stages 12A–12E into a preflight checklist for a possible Firebase Spark pilot.

The owner's binding instructions are:
- Keep total spend at USD 0.
- Use Firebase Spark only.
- Never link a billing account.
- Never activate Blaze, paid services, paid extensions, or paid infrastructure.
- Prefer Firestore in Doha (`me-central1`).
- Keep UAE and Pakistan accounting books separate.
- Ask before account creation, project provisioning, database creation, Authentication setup, Security Rules deployment, live code changes, exports, or imports.

**This document does not grant permission to perform any of those actions.** It defines the checks and approvals required before a future pilot. A pilot may be deferred indefinitely if any mandatory check cannot be met on Spark at USD 0.

## 2. Current baseline

| Area | Current verified/planned position |
|---|---|
| App hosting | GitHub Pages static prototype |
| Live URL | https://ledgerflow2027-cmd.github.io/Hercules-Property-Ledger/ |
| Browser data | localStorage prototype records and demonstration records |
| Cloud backend | Not provisioned |
| Firebase account | Owner has not yet been asked to create one |
| Firebase project | Not created |
| Firestore database | Not created |
| Preferred database location | Doha, `me-central1`; must be reconfirmed in the Firebase console before creation |
| Authentication | Email/password design only; not enabled |
| Security Rules | Designed but not deployed |
| Emulator tests | Planned; not yet executed |
| Data migration | Not approved or started |
| Cloud document storage | Excluded from Spark-only plan |
| Cloud Functions | Excluded from Spark-only plan |
| Trusted server-side accounting | Not implemented |
| Production financial records | Not available; current vouchers and reports remain local prototype data |

## 3. Mandatory no-cost guardrails

Before any account or project setup, verify and record:

1. Firebase project is on Spark, not Blaze.
2. No billing account is linked to the Google Cloud project.
3. No billing profile or payment method is added as part of this project setup.
4. No paid product, extension, API, storage bucket, function, backup, or third-party service is activated.
5. No action is taken that automatically upgrades the project.
6. The project owner understands that free quotas are limited and service may stop or become unavailable when a Spark quota is exhausted.
7. A quota limit or feature restriction must cause a pause and owner discussion — never an automatic paid upgrade.
8. Recheck official Firebase pricing, Spark eligibility, product requirements, and quota limits on the day of provisioning. Do not rely on an old quota snapshot.
9. If a mandatory security or product requirement cannot be met without a paid feature, the pilot is a **NO-GO** under the current budget decision.

Official references to recheck immediately before setup:
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firestore pricing: https://firebase.google.com/docs/firestore/pricing
- Firestore locations: https://firebase.google.com/docs/firestore/locations
- Firebase Authentication: https://firebase.google.com/docs/auth
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Emulator Suite: https://firebase.google.com/docs/emulator-suite

## 4. Location and country separation gate

Before creating a database:

- Confirm that `me-central1` is still selectable for the intended Firestore database in the console.
- Confirm the selected location is Doha, Qatar, and record that choice in the project notes.
- Understand that Doha hosting does not constitute UAE or Pakistan data residency.
- Do not claim regulatory compliance or local data residency based solely on this region.
- Obtain any needed privacy, legal, and data-residency review before storing real personal, tenant, identity, or financial information.
- Preserve the strict book boundary:
  - UAE: `AE_AED`, currency `AED`.
  - Pakistan: `PK_PKR`, currency `PKR`.
- No shared collection, query, report, or write may accidentally cross the two books.
- Consolidated management reporting, if ever approved, must be a separate read-only layer with explicit FX rates and conversion disclosures. It must not merge statutory/source books or silently convert records.

If the desired location is unavailable or the owner is not comfortable with the location/privacy implications, stop before database creation.

## 5. Account creation and owner-controlled setup

The owner has asked to receive the official signup URL when an account is needed. The account is not needed to complete this readiness document.

When, and only when, the owner separately authorises account setup:
1. Share the official Firebase Console link: https://console.firebase.google.com/
2. Guide the owner through signing in with their chosen Google account.
3. Ask the owner to confirm the account is theirs and that they are comfortable using it for this project.
4. Create no project until the owner confirms the exact project name and the Spark-only settings.
5. Do not ask for or receive the owner's password, one-time codes, recovery codes, or other authentication secrets.
6. The owner should complete account authentication directly in Google's interface.
7. Confirm that no billing account is linked and no payment method is requested or added.
8. If the console requires billing or suggests a paid upgrade for a required action, stop and report the blocker.

The user does not need to create an account merely to continue planning. Do not ask them to create one repeatedly before the actual setup step.

## 6. Project and database creation gate

Project creation is a separate approval from account creation. Before it:
- Owner explicitly approves the Firebase project name and project creation.
- Project billing plan is verified as Spark.
- Billing account remains unlinked.
- Project region and Firestore location are rechecked.
- Doha `me-central1` is confirmed before database creation; database location cannot be changed after creation.
- No real customer or tenant data is used in setup.
- The owner understands the project and database creation action is not itself permission to integrate the live app or migrate data.

Do not create a Firestore database until the owner explicitly approves the database creation after seeing the final region confirmation.

## 7. Authentication pilot gate

Only after a separately approved project exists:

- Use Firebase Authentication email/password as the only initial method.
- Verify email confirmation, password reset, sign-in, sign-out, and session expiry behaviour.
- Do not use SMS/phone OTP under the Spark-only budget.
- Do not use social providers unless separately reviewed for cost, security, and explicit owner approval.
- Never store passwords, reset tokens, ID tokens, refresh tokens, PINs, or biometric material in application localStorage or Firestore.
- Apply least privilege and protect account recovery.
- Do not enable public registration into an organisation by default.
- Do not allow arbitrary users to create memberships or self-assign owner role.

## 8. Organisation bootstrap and security gate

Before any live record can be written:
- Implement and test the single-owner bootstrap from Stage 12B.
- Prove that the initial owner claim can happen once only and cannot be raced or repeated.
- If the rules cannot safely enforce bootstrap without a trusted server component, do not improvise with open client rules; defer the pilot.
- Require authenticated identity and an active membership check for every organisation-scoped operation.
- Start with one owner only; no invitations, staff accounts, or delegated roles.
- Deploy only a reviewed, tested, deny-by-default ruleset.
- Never deploy broad rules such as `allow read, write: if request.auth != null`.
- Rules must validate allowed fields, types, immutable fields, country/book identity, and relationships.
- Run all relevant Emulator Suite tests before deployment.
- Security Rules are not query filters; client queries must be scoped to the authorised organisation and book.

## 9. Emulator-first acceptance gate

Before connecting the production GitHub Pages app, run and retain evidence for:

- Anonymous reads/writes are denied.
- Authenticated non-members are denied.
- Cross-organisation reads and writes are denied.
- Self-join and self-promotion are denied.
- Owner bootstrap is single-use and race-safe.
- UAE/Pakistan cross-book access is denied.
- AED/PKR mismatches are denied.
- Invalid or unknown fields and malformed amounts are rejected.
- Client writes to posted journals, balances, allocations, trusted audit events, and period closes are denied.
- Journal drafts remain unposted.
- Queries are bounded and paginated.
- Repeated migration batches are idempotent.
- Quota/error handling never triggers billing or paid upgrade.
- Local source data remains unchanged.

Any failed test involving authentication, isolation, privilege, money, accounting integrity, or data loss is a NO-GO.

## 10. Pilot scope — if later approved

The first pilot should use synthetic records and a dedicated test organisation only. It should be narrow:

1. Email/password authentication.
2. Single-owner organisation membership.
3. Read/write a small set of synthetic property, tenant, and vendor records.
4. Read/write source receipt and payment voucher records as unposted source records.
5. Country-scoped reads and writes for `AE_AED` and `PK_PKR`.
6. Bounded query and quota monitoring.
7. Clear error handling and a visible distinction between local preview and cloud-saved data.

Do not include:
- Real tenant/customer personal data.
- Identity documents, private photos, or file uploads.
- Cloud Storage or base64 document blobs.
- Cloud Functions.
- Trusted posted accounting journals, server balances, allocations, or period close.
- Production migration of existing localStorage records.
- Staff invitations or multi-user administration.
- PIN or native biometric unlock.
- Any paid feature.

A Spark-only client integration must not claim server-trusted accounting. Without an approved trusted server-side posting mechanism, official ledger posting and authoritative financial statements remain disabled.

## 11. Migration go/no-go

A pilot does not imply permission to migrate real data. Migration requires a separate approval and must follow Stage 12E:

- Owner-controlled export and backup.
- Record-count and data-quality preview.
- Real/demo separation.
- UAE and Pakistan classification.
- Currency and relationship validation.
- Exact manifest approval.
- Idempotent/resumable batches.
- Reconciliation by country and record type.
- No destructive local cleanup.
- Owner review of variances and spot checks.

If any record cannot be classified or reconciled, quarantine it for review. Do not silently omit it or force it into a country book.

## 12. Operational limits and stop conditions

Stop the pilot and ask the owner before proceeding if:
- Firebase requests billing information or an upgrade.
- The selected region is unavailable or changes.
- A required feature is not included in Spark.
- A quota is exhausted or usage approaches a limit that could interrupt the pilot.
- Authentication, organisation bootstrap, or rules cannot be made secure without paid services.
- Emulator tests fail.
- Data is exposed across organisations or country books.
- Financial records or totals do not reconcile.
- The owner has not explicitly approved the next action.

Do not switch providers, plans, regions, or data-handling methods without owner approval.

## 13. Final go/no-go checklist

| Gate | Required evidence | Current status |
|---|---|---|
| Strict $0 / Spark only | Owner's explicit decision | Approved |
| No billing / no paid products | Project-level verification | Not applicable yet; no project |
| Firebase account | Owner account created | Not yet requested |
| Project creation | Separate owner approval | Not authorised |
| Doha region | Live console confirmation | Pending |
| Firestore database | Separate owner approval | Not authorised |
| Authentication | Approved method and tests | Design only |
| Owner bootstrap | Emulator proof | Pending |
| Security Rules | Reviewed and emulator-tested | Design only |
| Emulator acceptance | All critical tests pass | Pending |
| Synthetic pilot | Explicit owner approval | Not authorised |
| Real-data export/import | Separate manifest approval | Not authorised |
| Production app integration | Separate implementation approval | Not authorised |
| Trusted accounting | Secure server-side posting capability | Not available in current Spark-only scope |
| Secure file uploads | Private storage capability within budget | Not available in current Spark-only scope |

**Decision today: NO-GO for provisioning or live integration. GO for continuing design and planning only.**

This is not a failure: the remaining gates are deliberate safeguards. The project should proceed only as far as the approved free plan can support securely.

## 14. Stage 12F completion and next phase

Stage 12F readiness documentation is complete when committed and verified in GitHub.

No account, project, database, Auth provider, ruleset, index, migration, or application code is created by this document.

After Stage 12F, Stage 12 (backend planning) has a complete design set:
- 12A — Firebase Spark architecture.
- 12B — Authentication and organisation access.
- 12C — Firestore data model.
- 12D — Security Rules and data protection.
- 12E — Migration and integration strategy.
- 12F — Pilot readiness and go/no-go.

**Next project phase:** Stage 13 — Quality Assurance planning and test matrix. Live application changes or Firebase provisioning still require explicit approval.