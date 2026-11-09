# Stage 12G — Unified Ledger, Country and Currency Preferences

**Status:** Owner-approved product decision; architecture clarification only.  
**Prepared:** 9 November 2026  
**Repository:** `ledgerflow2027-cmd/Hercules-Property-Ledger`  
**Branch:** `main`

## 1. Decision that supersedes earlier designs

This document records the owner's latest decision and supersedes all conflicting references in Stages 12A, 12B, 12D, 12E and 12F that describe separate UAE/Pakistan books, country-specific book IDs, functional currencies, cross-book isolation, or AED/PKR-only selection.

The approved model is **one unified full-stack ledger per organisation** for all properties, tenants, vendors, receipts, payments, accounts, journal drafts and (only when a trusted posting service exists) posted journals.

Country is a profile and operational setting, not an accounting partition. Currency is a display preference, not a conversion engine.

Stage 12C is the canonical data model and must be read together with this decision.

## 2. Country selector — exactly 10 initial choices

Provide a drop-down menu with these initial options:

| Country | ISO country code |
|---|---|
| United Arab Emirates | AE |
| Saudi Arabia | SA |
| Qatar | QA |
| Kuwait | KW |
| Bahrain | BH |
| Oman | OM |
| Pakistan | PK |
| India | IN |
| United Kingdom | GB |
| United States | US |

The six GCC options are UAE, Saudi Arabia, Qatar, Kuwait, Bahrain and Oman. Country selection can control relevant labels, address formats, identity-field options and regional presentation. It must not create a separate ledger, account set or balance partition.

## 3. Currency selector — exactly 10 initial choices

Provide an independent currency drop-down:

| Currency | ISO code | Display symbol |
|---|---|---|
| UAE dirham | AED | د.إ |
| Saudi riyal | SAR | ر.س |
| Qatari riyal | QAR | ر.ق |
| Kuwaiti dinar | KWD | د.ك |
| Bahraini dinar | BHD | .د.ب |
| Omani rial | OMR | ر.ع. |
| Pakistani rupee | PKR | ₨ |
| Indian rupee | INR | ₹ |
| British pound | GBP | £ |
| US dollar | USD | $ |

Store the ISO code and use a controlled catalogue for the display symbol. Do not rely on a symbol alone to identify a currency. The country and currency selectors are independent: changing the country must not silently change the selected currency, and changing the currency must not change the country.

## 4. Currency behaviour — display only

- There is no currency conversion, exchange-rate lookup, FX gain/loss, or automatic multiplication/division.
- Selecting a different currency changes only the displayed label/symbol/code.
- Stored numeric amounts remain unchanged.
- Existing vouchers, balances, account entries and report values must not be recalculated or rewritten when the display preference changes.
- Do not describe symbol-relabelled amounts as converted, economically equivalent, statutory, tax-ready, or authoritative multi-currency statements.
- Financial reports and relevant voucher previews must visibly disclose: **"Display currency: [CODE]. Amounts are not converted; changing this setting changes the label only."**
- If a future requirement needs genuine multi-currency accounting, it requires a separate explicit product decision and architecture review.

## 5. Unified data and security implications

- Keep one organisation-level ledger namespace.
- Do not create `books/{bookId}`, `AE_AED`, `PK_PKR`, country-specific account balances, or country-specific journal paths.
- Properties, tenants, vendors and relevant source transactions may carry country metadata for operational display and filtering.
- Country filters must never exclude records from organisation-wide ledger totals.
- Security Rules must enforce organisation membership and record ownership; they must not enforce country-book separation.
- Validate `countryCode` and `displayCurrency` against the approved catalogues.
- The selected display currency must not be treated as proof of a transaction's actual economic currency. The current product intentionally uses one selected display label for the ledger and does not support mixed-currency accounting.
- Retain all Spark/$0 constraints: no billing account, no Blaze, no paid services, and no Firebase provisioning or migration without separate owner approval.

## 6. Required implementation and test updates

Before any cloud integration:
1. Remove legacy country-book selectors, country-specific book IDs and cross-book code paths from the application and architecture.
2. Add the 10-country and 10-currency independent drop-downs to Settings.
3. Persist the country and display-currency preferences without altering financial records.
4. Centralise formatting so dashboard, properties, tenants, vendors, vouchers and reports use the selected display currency.
5. Add the non-conversion notice to financial reports and voucher previews.
6. Test all 10 country choices and all 10 currency choices.
7. Prove that changing country or display currency never changes stored numeric amounts, creates a second ledger, changes journal data, or removes records from organisation-wide totals.
8. Update security-rule and migration test specifications to remove country-book isolation tests and replace them with allowed-country/currency catalogue validation and unified-ledger integrity tests.
9. Keep all cloud work documentation-only until separately authorised. Do not create Firebase resources or migrate local data.

## 7. Current implementation status and next work

- The unified-ledger data model is documented in Stage 12C.
- This decision adds the approved 10-country and 10-currency catalogues.
- The live prototype still requires code review and implementation; architecture documentation does not mean the selectors are live.
- Earlier Stage 12 documents contain historical separate-book language. This Stage 12G decision and revised Stage 12C take precedence wherever those documents conflict.
- Firebase remains unprovisioned. Spark only and USD 0 remain binding.
- No browser test is applicable to this documentation-only decision.

**Next implementation phase:** revise the remaining security, authentication, migration and pilot-readiness documents to remove obsolete separate-book assumptions, then implement and test the selectors in the application under a separately tracked UI milestone.
