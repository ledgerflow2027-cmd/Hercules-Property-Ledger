# Propledger 2027 — Stage 12A Cloud Provider Evaluation

**Prepared:** 8 November 2026  
**Status:** Research and recommendation for owner approval only  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Executive recommendation

**Preferred candidate for a controlled proof-of-concept: Microsoft Azure, with UAE North as the first region to evaluate.**

This is a provisional technical recommendation, not permission to create an Azure subscription, deploy resources, enter payment details, migrate records, or begin production processing.

Why Azure is currently the strongest candidate:
- Microsoft lists UAE North and UAE Central as Azure regions.
- Azure SQL Database's current regional feature table lists UAE North, including availability-zone support for relevant database tiers.
- Azure Functions is listed in current regional product availability information for UAE North.
- Managed relational storage fits Propledger's separate UAE and Pakistan accounting books, transactions, audit records and controlled reporting.

Before approval, Microsoft must confirm exact availability, redundancy, backup, identity, storage, support and contractual terms for every proposed service and SKU. A region being listed does not mean every feature is available there.

## 2. Evaluation criteria

The platform must support:
1. Separate UAE and Pakistan books, with AED and PKR functional currencies.
2. Organisation-level and user-level data isolation.
3. Server-side validation and atomic accounting journal posting.
4. Secure authentication, session controls and recovery.
5. Private document storage for agreements and supporting records.
6. Auditable changes, backups and tested recovery.
7. A mobile application and future Android release.
8. Transparent operating costs and an upgrade path.
9. A documented data-location and cross-border processing position.

Country books and data-hosting jurisdiction are different concepts. Separate accounting books do not by themselves satisfy a legal data-residency requirement.

## 3. Provider comparison

| Option | Regional position relevant to Propledger | Strengths | Main concerns | Assessment |
|---|---|---|---|---|
| Microsoft Azure | UAE North and UAE Central are listed; Azure SQL Database lists UAE North | Managed SQL, regional infrastructure, broad identity/security/monitoring portfolio | More configuration and operational design than a simple backend platform; service-by-service regional checks required | **Preferred candidate for proof-of-concept** |
| AWS | UAE region exists as `me-central-1` | Broad service portfolio; RDS, S3, Cognito, Lambda and other building blocks | AWS Health information retrieved 8 Nov 2026 reports a serious ongoing UAE-region disruption and recommends migration/remote recovery; do not place the only production copy there while this warning remains unresolved | **Do not select as sole UAE production region at present** |
| Supabase | Published regions include Mumbai and Singapore, but no UAE or Pakistan region | Fast PostgreSQL-based development; integrated database, Auth and Storage; simpler early implementation | Primary data region is outside UAE; its residency FAQ says certain operational/support/telemetry and CDN processing may occur outside the selected region | **Good developer experience, weaker fit if UAE-local hosting is required** |
| Google Cloud | Middle East regions listed include Doha and Dammam; no UAE region identified in the reviewed region list | Strong managed cloud platform and regional options in the Gulf | No UAE region in the reviewed list; cross-border/data-location review needed | **Not first choice for UAE-hosted primary data** |

### Important current AWS risk

AWS Health information retrieved during this evaluation contains notices describing a serious disruption in the Middle East (UAE) `me-central-1` region. The notices say some resources/data were inaccessible and recommend migrating accessible resources and restoring from remote backups. This may change; check the live AWS Health Dashboard and obtain written AWS confirmation before reconsidering AWS UAE.

A UAE region being geographically local is not enough if the current service status and recovery position are uncertain.

## 4. Preferred Azure architecture to validate

This is a design proposal only. Do not provision it until the owner approves the provider, budget and legal/data-location approach.

| Capability | Azure service candidate | Intended use |
|---|---|---|
| API / application backend | Azure Functions or Azure App Service | Authenticated server-side business logic and APIs |
| Relational database | Azure SQL Database | Organisations, properties, tenants, vendors, vouchers, journals, allocations, audit events |
| Private files | Azure Blob Storage | Agreements, identity documents and supporting files in private containers |
| Secrets and keys | Azure Key Vault | Application secrets and key management |
| Identity | Microsoft Entra External ID or another approved identity service | Registration, login, recovery and external user identity |
| Monitoring | Azure Monitor / Application Insights | Logs, metrics, errors and operational alerts |
| Backup and recovery | Azure SQL backup capabilities plus separately protected recovery copies | Restore testing and disaster recovery |

### Proposed deployment region

- First region to evaluate: **UAE North**.
- Evaluate UAE Central as a paired/secondary region only after checking each service's regional support, recovery design, cost and contractual data-location implications.
- Azure SQL Database currently lists UAE North with availability-zone support. Zone support must still be checked against the selected service tier and SKU.
- Do not assume every identity, logging, support, CDN or backup operation stays within UAE solely because the database is deployed in UAE North.

## 5. UAE and Pakistan data considerations

### UAE

The UAE Federal Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) establishes requirements for personal-data processing, security and cross-border transfers. The official UAE government summary describes cross-border transfer requirements.

Before production, obtain a UAE legal/privacy review covering:
- What personal data Propledger collects.
- Lawful processing basis, notices and consent where applicable.
- Controller/processor roles and contracts.
- Cross-border access, support, backups and subprocessors.
- Retention, deletion, data-subject requests and breach response.
- Whether any special free-zone or sector-specific regime applies to the customer.

### Pakistan

The Pakistan Ministry of IT legislation page reviewed for this evaluation lists the Personal Data Protection Bill 2020 as a draft. A current legal review is still required before launch, including any subsequent legislation, rules, sector requirements and contractual obligations.

### Design rule

Keep UAE and Pakistan accounting books separate at the application and database layers:
- Separate country-book identifiers and functional currencies.
- No cross-book journal postings.
- Country-specific reports and numbering sequences.
- Explicitly authorised FX conversion only for any future consolidated reporting.
- Organisation-level access controls and audit history.

If legal advice or customer contracts require Pakistan-resident data storage, a UAE-only database may not be sufficient. That requirement must be resolved before selecting a single-region design.

## 6. Security and accounting requirements independent of provider

The selected provider must support:
- Server-side authentication and authorisation on every protected request.
- Organisation/tenant isolation enforced on the server and in database access policies.
- MFA and secure recovery options.
- Short-lived access tokens and secure session revocation.
- Encryption in transit and at rest.
- Private document containers; no public identity-document URLs.
- Malware, file-type and size checks for uploads.
- Secrets outside source code and browser storage.
- Append-only or tamper-evident accounting audit history.
- Atomic journal posting: either all lines post or none do.
- Idempotency protection against duplicate submissions.
- Immutable posted records with controlled reversal/correction workflows.
- Scheduled backups and demonstrated restore tests.
- Independent recovery copy and documented recovery objectives.
- Data export, retention and account deletion workflows.
- Alerts for unusual access, failed logins and operational failures.

The browser `localStorage` prototype must never be treated as the production system of record.

## 7. Cost model — what must be estimated

No responsible monthly price can be quoted until usage assumptions and selected service tiers are known.

The estimate must include:
- Database compute, storage, backups and high availability.
- API compute and outbound data transfer.
- Private document storage, requests and download bandwidth.
- Identity / monthly active users and MFA delivery.
- Monitoring, log ingestion and retention.
- Key management, security services and support plan.
- Backup copies and cross-region recovery.
- Development, test and production environments.
- Taxes, currency conversion and support.

Start with a small, controlled proof-of-concept and a spending alert/budget. Do not run a production financial workload on a free tier without reviewing its limits, backups, service guarantees and support.

## 8. Required owner inputs before provisioning

The following must be approved:
1. Provider: Azure, or request another comparison.
2. Hosting: UAE North primary, subject to service and legal checks.
3. Pakistan data-location requirement: UAE-hosted central service acceptable only if legal review confirms the arrangement, or a separate Pakistan-region deployment is required.
4. Expected first-year organisations and users.
5. Approximate file storage and monthly uploads.
6. Monthly cloud budget and preferred billing currency.
7. Identity preference: email/password plus MFA, phone OTP, or both.
8. Whether staff roles and multiple users per property organisation are required at first release.

## 9. Decision status

- Backend remains deferred.
- No cloud account or paid resource has been created.
- No live application code has been changed by this evaluation.
- No sample or customer data has been migrated.
- Azure is the preferred candidate for a proof-of-concept, not yet an approved production provider.
- AWS UAE is not recommended as the only production region while the surfaced incident warning remains unresolved.
- Supabase remains a possible faster prototype backend only if the owner accepts its available data regions and transfer model after legal review.

## 10. Sources reviewed

- Microsoft Azure regions: https://learn.microsoft.com/azure/reliability/regions-list
- Azure SQL Database regional feature availability: https://learn.microsoft.com/azure/azure-sql/database/region-availability
- Azure Availability Zones: https://learn.microsoft.com/azure/availability-zones/az-overview
- Azure data residency: https://azure.microsoft.com/en-us/explore/global-infrastructure/data-residency/
- AWS Regions and Availability Zones: https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html
- AWS UAE region announcement: https://aws.amazon.com/blogs/aws/now-open-aws-region-in-the-united-arab-emirates-uae/
- AWS Health Dashboard: https://health.aws.amazon.com/health/status
- Supabase available regions: https://supabase.com/docs/guides/platform/regions
- Supabase data residency FAQ: https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- UAE government data protection laws: https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws
- Pakistan Ministry of IT legislation: https://www.moitt.gov.pk/Legislations

**Next milestone after approval:** Stage 12B — identity and organisation access design. No provider provisioning or production migration should begin until the owner approves the outstanding items above.


---

## Owner decision update — 8 November 2026

The provisional Azure recommendation above has been superseded by the owner's explicit budget and platform decision:

- **Selected plan:** Firebase Spark, strictly USD 0.
- **Selected Firestore location:** Doha, `me-central1`.
- **Billing:** Do not link a billing account.
- **Paid services:** Do not activate.
- **Provider status:** Firebase is approved for architecture planning only; no project or database has been provisioned.

The controlling implementation plan is now [STAGE_12A_FIREBASE_SPARK_ARCHITECTURE.md](STAGE_12A_FIREBASE_SPARK_ARCHITECTURE.md).

The Azure comparison remains in this document as historical research, not as the current recommendation. The Firebase Spark plan's limitations—particularly no Firebase Cloud Storage, no Cloud Functions and no paid backup/PITR features—must be respected. Doha is not UAE or Pakistan data residency. Do not create the Firestore database until its location is confirmed as `me-central1` and the owner separately authorises provisioning.
