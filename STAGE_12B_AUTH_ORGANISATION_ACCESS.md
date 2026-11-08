# Propledger 2027 — Stage 12B Authentication and Organisation Access Design

**Status:** Design approved for documentation only; no Firebase project or live authentication integration is authorised.  
**Prepared:** 9 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Owner-approved boundaries

- Firebase Spark only; strict budget USD 0.
- Do not link a billing account or activate Blaze or any paid service.
- Preferred Firestore region: Doha, `me-central1`.
- UAE and Pakistan remain separate accounting books (AED and PKR respectively).
- This stage is design and repository documentation only. Do not create a Firebase project, database, Auth users, or migrate prototype data.
- Existing GitHub Pages app and its localStorage preview remain unchanged.

## 2. Initial identity model

Use Firebase Authentication email/password only for the first release.

Required user journeys:
1. Owner creates an account using email and password.
2. The app requests email verification and clearly indicates when the address is not verified.
3. User can sign in and sign out.
4. User can request a password-reset email.
5. Authenticated session state is restored safely on reload and cleared on sign-out.
6. The app must show a useful error for invalid credentials, disabled accounts, network failures, and unverified email.

Do not implement phone/SMS OTP, paid identity providers, or custom server authentication in the Spark-only scope. Do not store passwords, password-reset tokens, or verification secrets in Firestore or localStorage. Firebase Auth owns credential handling.

Email verification is an account-quality check, not a substitute for organisation authorisation. Security Rules must still enforce membership for every organisation record.

## 3. Initial organisation model

Start with one organisation owned by the registering user. Do not add staff invitations, public join links, or user-managed role changes in this stage.

Proposed records:

```
organizations/{orgId}
  createdBy: <auth uid>
  name: <organisation name>
  createdAt: <server timestamp>
  status: "active"
  members/{uid}
    uid: <same auth uid>
    role: "owner"
    status: "active"
    createdAt: <server timestamp>
  books/{bookId}
    countryCode: "AE" | "PK"
    currency: "AED" | "PKR"
```

The organisation ID should be a randomly generated Firestore document ID, not an email address or other personal identifier. The Auth UID is the stable identity key. Do not use a user-supplied organisation ID.

The UAE and Pakistan books are distinct records under the organisation. Country and functional currency must be set from approved book configuration, not accepted as arbitrary client-supplied values on every financial record.

## 4. Secure first-owner bootstrap — mandatory gate

Creating the organisation and its first owner membership is a sensitive bootstrap operation. A simple client-side sequence of two independent writes is not acceptable: it could leave an orphan organisation or permit an unsafe membership state.

Candidate Spark-compatible approach for emulator validation:
- Create the organisation document and its creator's owner-membership document in one atomic Firestore transaction/batch.
- Security Rules must validate the complete post-write state using Firestore Rules document lookups and `getAfter()`.
- The organisation create must require `request.auth.uid == request.resource.data.createdBy`.
- The matching member create must require the path UID and stored UID to equal the authenticated UID, role exactly `owner`, and active status.
- The member create must be accepted only when the organisation is also being created in the same atomic operation and its `createdBy` matches the caller.
- A caller must not be able to add themselves to an existing organisation, create a second owner for an existing organisation, or change their role after creation.
- Deny client updates to `createdBy`, role, UID, and other protected membership fields.
- Validate allowed fields and types; reject unknown privilege-bearing fields.

This is a **design candidate, not yet a proven implementation**. Firestore Rules have document-access and expression limits. Implement the bootstrap only if emulator tests demonstrate that the exact rules enforce the above constraints. If the proof fails, defer organisation creation until a secure provisioning mechanism is available. Do not relax the rules to make onboarding work.

## 5. Authorisation policy

Default deny. For every organisation-scoped read or write:
- Require an authenticated user.
- Require an active membership document at `organizations/{orgId}/members/{request.auth.uid}`.
- Require the appropriate role for the operation.
- Initially, permit only the owner role for organisation administration and all data access.
- Prevent users from reading another organisation by guessing or changing an org ID.
- Prevent client-side creation or modification of membership roles.
- Prevent self-promotion, membership spoofing, and writes to a different user's member path.
- Protect immutable identifiers, ownership fields, country, currency, journal status, audit metadata, and server-controlled fields.
- Validate field allowlists, types, value ranges, and parent-child organisation consistency.
- Never rely on hidden UI controls as security.

No broad rule such as `allow read, write: if request.auth != null` is acceptable. Do not ship permissive test rules.

## 6. Account and session handling

- Keep Firebase Auth as the only credential store.
- Do not persist ID tokens or passwords manually in application storage.
- Use the Firebase SDK's supported session management.
- On sign-out, clear in-memory organisation selection and user-specific cached data.
- Do not show private app records while authentication or membership state is unresolved.
- Require reauthentication for sensitive account changes where Firebase supports it.
- Provide an account deletion path in a later production-readiness stage; do not promise complete deletion until associated Firestore records and any retained records are handled consistently.

## 7. Emulator security test matrix

Before connecting a real project, write and run automated tests in the Firebase Emulator Suite.

| Test | Expected result |
|---|---|
| Unauthenticated read of organisation | Denied |
| Unauthenticated write to any organisation record | Denied |
| Authenticated non-member reads organisation data | Denied |
| Owner reads own organisation | Allowed |
| Owner accesses another organisation | Denied |
| First owner creates organisation and own owner membership atomically | Allowed only if all bootstrap invariants pass |
| User adds self to an existing organisation | Denied |
| User creates a second owner membership | Denied |
| User changes own role to owner/admin | Denied |
| User writes membership for another UID | Denied |
| Member changes organisation creator | Denied |
| Client changes protected country/currency configuration | Denied except through a specifically authorised setup flow |
| Cross-book query/write violates country or currency rules | Denied |
| User signs out and tries to reuse cached private screen | Private data hidden |
| Email is unverified | App shows verification gate; Rules still enforce membership |

Add positive tests for legitimate owner operations and negative tests for malformed fields, unexpected properties, oversized values, and mismatched organisation IDs.

## 8. Spark-only implementation limits

- No Cloud Functions or custom trusted server in the approved Spark-only architecture.
- No SMS OTP.
- No Firebase Storage for private documents under this plan.
- Do not put identity documents, tenancy agreements, or other private files into Firestore as base64 blobs.
- Do not expose service-account credentials, Admin SDK credentials, or private keys in browser code.
- Firebase web configuration/API key is not a secret; Security Rules and Auth are the actual access controls.
- No client-trusted accounting posting, balance mutation, period close, or privileged audit operation. Journal drafts may remain drafts; authoritative posting requires a trusted server-side path.

## 9. Acceptance criteria and exit gate

Stage 12B design is complete. Implementation may begin only after the owner separately authorises Firebase project setup and the following are satisfied:
1. Firebase pricing and Spark limits are rechecked against current official documentation.
2. The owner confirms the Google account to use; no credentials are shared in chat.
3. Project setup is performed without linking billing or enabling paid services.
4. Doha is selected before creating the Firestore database; the location is immutable.
5. Email/password Auth is enabled without SMS.
6. Security Rules and bootstrap transaction pass the Emulator Suite test matrix.
7. Rules are reviewed for deny-by-default behaviour and cross-organisation isolation.
8. A safe rollback and test-data plan exists before any production data is introduced.

If any requirement cannot be met for USD 0, stop and report the limitation. Do not silently substitute a paid service or weaker security.

## 10. Current status

- Stage 12A Firebase Spark architecture plan: documented.
- Stage 12B authentication and organisation access design: documented in this file.
- Firebase account signup: user action, not yet confirmed.
- Firebase project/database: not created.
- Billing account: not linked.
- Paid services: not activated.
- Authentication integration: not implemented.
- Production data migration: not started.
- Live GitHub Pages application: unchanged.

## 11. Owner-requested welcome page, PIN unlock, and biometrics

The owner has requested the following first-screen experience. Treat this as a product requirement for the authentication implementation; it is not yet live.

### Welcome / landing screen
- Display the product name **Propledger 2027**.
- Offer language selection: English, Arabic, and Urdu.
- Show a concise introduction explaining that the app helps property owners organise properties, tenants, rent receipts, expenses, vendors, and financial records.
- Use welcoming, trustworthy product copy without unsupported claims (for example, do not claim bank-grade security, automatic cloud backup, or fully automated accounting unless implemented).
- Support Arabic and Urdu right-to-left layout, including navigation, form alignment, and validation messages.
- Remember the selected language on the device, with a visible way to change it later.

### First login and PIN setup
- First-time account access uses Firebase email/password authentication and email verification as described above.
- After successful first login, offer the user the option to create a local device-unlock PIN. Recommended default: six digits, with clear guidance that the PIN is for unlocking the app on that device, not a replacement for the account password.
- Never store the PIN itself, a reversible representation, or a plain hash in localStorage, Firestore, logs, analytics, or application preferences.
- A secure PIN verifier / device credential must use the platform's protected storage and appropriate rate limiting. If the target environment cannot provide secure storage and retry protection, do not offer a locally saved PIN.
- Provide a recovery route through the account's verified email/password sign-in; do not claim that a forgotten local PIN can be recovered from the PIN itself.
- PIN setup must be optional where the platform cannot safely support it.

### Face ID / fingerprint unlock
- Offer biometric unlock only after the first successful account login and explicit user opt-in.
- On supported native Android/iOS builds, use the operating system's biometric prompt and platform-protected Keychain/Keystore-backed credential mechanism. Do not collect or store biometric images, fingerprints, or face templates.
- Keep PIN fallback available when biometrics are unavailable, declined, or fail.
- Require full account authentication again after sign-out, device credential reset, app data removal, or other invalidation events as appropriate.
- If biometrics are unavailable, explain this and retain the secure account-login route.

### Platform boundary and release sequencing
- The current GitHub Pages app is a browser-based prototype. It must not simulate Face ID/fingerprint or describe a browser-stored PIN as secure device authentication.
- Browser WebAuthn/passkeys are a separate standards-based option and must not be misrepresented as native Face ID/fingerprint integration.
- Native biometric and secure local PIN functionality belongs in the Android/iOS packaging and device-security implementation stage, after the authentication backend and security review.
- No PIN, biometric, or authentication code is to be added to the live prototype until the owner separately approves implementation and the security design is validated.
- These requirements do not authorise Firebase project creation, billing linkage, paid services, or data migration.

