# PROPLEGDER — MASTER STANDING INSTRUCTIONS

Last consolidated: 13 November 2026

These rules govern future Propledger development unless the owner explicitly changes them.

## 1. Source of truth and GitHub workflow
- The GitHub repository `ledgerflow2027-cmd/Hercules-Property-Ledger` is the canonical project source.
- All approved, successful application source and documentation changes must be saved to the `main` branch.
- Do not silently switch repositories or use a disconnected replacement project.
- After every successful stage, update the source and handoff on GitHub, verify the commit and changed files, and report the links.
- Record test results, known limitations, deployment status and the next step in the handoff.
- A GitHub commit is not proof of live deployment; verify the published app separately.

## 2. Mandatory daily backups and recovery checkpoints
- At the end of each day in which successful modifications are made, preserve a recoverable backup of that day's last known-good project state.
- Before beginning a new modification, preserve or confirm the last known-good checkpoint.
- Keep dated backup branches or equivalent full-repository snapshots, preserving Git history and tracked project files.
- All approved successful source changes must also be present on `main`.
- If a new modification fails testing or damages existing behaviour, stop and restore the last verified successful checkpoint. Record the rollback in the handoff.
- Never label untested or failed work as a successful checkpoint.
- Verify backup branch/commit existence and record its exact name and SHA.
- A repository backup covers committed project files and Git history only. It does not automatically back up live database records, user uploads, browser/device-only data, authentication records, secrets or external storage. Back those up separately using secure, verified exports. Never commit passwords, API keys, access tokens or private tenant/owner documents to a public repository.

## 3. Mobile-first trilingual experience
- Support English, Arabic and Urdu throughout the interface.
- Arabic and Urdu must use right-to-left direction and suitable alignment; English uses left-to-right.
- Use professional, readable, simple typography. Preferred Arabic font: Noto Sans Arabic. Preferred Urdu font: Noto Nastaliq Urdu, with sensible local fallbacks.
- Translate as much user-facing text as possible: navigation, headings, buttons, forms, labels, dialogs, notifications, errors, confirmations, reports, empty states, dynamic content and modal windows.
- Language selection must persist and update the whole interface, including dynamically inserted content. Do not claim full localisation until screen-by-screen tests pass in all three languages.

## 4. Preserve financial and business data
- Protect existing properties, tenants, vendors, transactions, accounting history, documents, images and user records.
- Do not alter production data, database configuration, authentication, accounting calculations or financial records when addressing unrelated issues.
- Preserve double-entry accounting integrity, balanced entries, audit history and existing CRUD/report workflows.
- Never expose or commit private customer data or credentials.

## 5. Statement of Account (SOA) — protected design
- Preserve the approved SOA appearance and layout unless the owner explicitly requests a change.
- Keep the agreed navy-blue title bands, spacing, date positioning and visual hierarchy.
- PDF export must reproduce the approved SOA presentation.
- WhatsApp sharing must attach the actual generated PDF, not substitute plain text.
- Preserve the agreed selection limit and workflow unless explicitly changed.
- Do not change SOA or accounting behaviour while fixing unrelated issues.

## 6. Existing application functionality
- Preserve property, tenant, vendor, account/ledger, rent, reporting, document and profile workflows.
- Maintain mobile responsiveness and existing supported offline/local-first behaviour.
- Keep cloud synchronisation and authentication intact unless the requested task specifically concerns them.
- Do not remove features or redesign approved screens without explicit permission.

## 7. Testing and stage acceptance
Before marking a stage successful, run and record relevant checks, including as applicable:
- English, Arabic and Urdu switching, full-screen translation and RTL/LTR behaviour.
- Mobile layout, responsive overflow and Safari/WebKit behaviour.
- Navigation, dialogs, forms, dynamic content and error/empty states.
- Accounting calculations, ledger integrity and existing records.
- SOA preview, PDF output and sharing.
- Data persistence and backup/restore checks.
- Build and automated browser tests.
- Android/Capacitor sync and installation when that platform is affected.

Source inspection alone is not proof of runtime behaviour. Clearly distinguish tests passed, tests not run, known issues and live deployment verification.

## 8. Controlled changes
- Make the smallest change that fixes the requested issue.
- Do not touch unrelated features, approved layouts, financial logic, stored data or production configuration.
- Preserve backups before risky work; test the change and relevant regressions before accepting it.
- If a change fails, revert to the last successful checkpoint rather than improvising over a broken state.

## 9. Communication and handoff
- Be honest and precise; never claim success without evidence.
- Handle technical limitations where possible rather than repeatedly asking the owner to perform complex manual steps.
- Do not ask the owner to repeat details already present in the repository or project history.
- Each stage handoff must state scope, files changed, tests and results, commit SHA, backup checkpoint, deployment status, remaining issues and next step.
- Provide direct GitHub or download links only when their destinations have been verified.

## 10. Mandatory end-of-stage sequence
1. Complete the requested change.
2. Run relevant tests.
3. If tests pass, save successful source to GitHub `main`.
4. Update the handoff document on `main`.
5. Create/retain the dated known-good repository backup checkpoint.
6. Verify the commit, source, handoff and backup references.
7. Verify live deployment separately where applicable.
8. Report exact results and links.

If any step cannot be completed, say so explicitly; do not imply the workflow finished.
