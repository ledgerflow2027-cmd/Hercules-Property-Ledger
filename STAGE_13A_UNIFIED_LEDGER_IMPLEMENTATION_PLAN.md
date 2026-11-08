# Stage 13A — Unified Ledger Application Implementation Plan

Status: approved architecture; implementation not yet complete.

## 1. Confirmed product decisions

- Propledger uses one organisation-wide ledger across all supported countries.
- Country is descriptive context for a property, tenant, vendor, address, identity-document type, and local compliance metadata. It must not partition the organisation's accounting ledger.
- The login/onboarding screen offers country, language, and display-currency choices.
- The selected display currency is a global presentation preference.
- Changing the display currency changes the currency label/symbol only. It does not convert, recalculate, rewrite, or otherwise change any stored amount.
- Reports and account screens must prominently state: **Amounts are shown in the selected display currency; no foreign-exchange conversion has been applied.**
- Firebase remains deferred. The current app is a local browser preview; no cloud migration or provisioning is authorized.

## 2. Important distinction

A single ledger does not mean that historic AED and PKR amounts become economically equivalent. Until real multi-currency accounting and exchange-rate handling are explicitly designed, this product will implement the user's requested label-only display mode and clearly disclose that it is not FX conversion. The application must not present mixed-currency totals as converted or comparable financial totals.

## 3. Implementation sequence

### 13A-1 — Global preferences and display layer
1. Add a currency selector to onboarding alongside country and language.
2. Persist country, language, and display currency as organisation/user interface preferences in local preview storage.
3. Apply the selected display currency consistently to dashboard account figures, voucher summaries, account statements, general ledger, trial balance, P&L, and SOA presentation.
4. Keep each transaction's entered amount and original currency metadata unchanged.
5. Add a visible no-conversion disclosure to financial summaries and reports.
6. Ensure changing country does not silently reset a manually selected display currency.

### 13A-2 — Remove country partitions from organisation data views
1. Show properties and vendors from all supported countries in the same organisation lists.
2. Allow receipt/payment workflows to select properties and associated parties across countries, while retaining each record's country metadata.
3. Remove country-specific dashboard and activity filters where they incorrectly hide organisation records.
4. Retain country-specific identity labels and address/context fields where they are genuinely needed.

### 13A-3 — One accounting ledger
1. Replace the two-country accounting setup with one organisation-level chart of accounts, journal sequence, financial year, and reporting scope.
2. Ensure journal queries no longer filter the organisation's posted entries by country.
3. Preserve source-country and original-currency metadata on transactions for audit/context; do not use those fields to split the ledger.
4. Define how transactions in different original currencies are treated before any converted financial totals are offered. Until then, label-only presentation must be disclosed and mixed-currency totals must not be described as converted.
5. Keep audit history, reversals, and period controls within the single organisation ledger.

### 13A-4 — Regression checks
- Switching country does not hide properties, tenants, vendors, receipts, payments, or posted journals.
- Switching display currency does not change any stored numeric amount.
- Switching display currency updates all relevant displayed labels consistently.
- Reports visibly disclose that no FX conversion has occurred.
- Country-specific ID labels remain correct for UAE and Pakistan records.
- Existing local records remain untouched unless a separately approved migration is performed.

## 4. Data safety and migration boundary

- Do not read, export, rewrite, merge, or migrate the user's browser localStorage as part of this planning document.
- Do not delete the existing UAE/Pakistan demo or user records.
- Do not combine historical AED and PKR values into a purportedly converted balance.
- No Firebase project creation, billing linkage, Blaze upgrade, cloud upload, or production migration.
- Firebase Spark and the strict $0 budget remain mandatory.

## 5. Current implementation status

The current HTML prototype still contains country-based filters and separate accounting-book logic. Therefore, the unified-ledger architecture is **not yet implemented in the live app**. This document records the controlled implementation sequence; each code milestone must be committed, deployed, source-verified, and browser-tested before it is marked complete.
