# Pending Blockers & Open Items

Issues that are blocking completion or require external input before they can be resolved.
Last updated: 2026-05-12.

---

## 🔴 P0 — Blockers (cannot ship without)

### B-01 · Intercom App ID not set
- **What:** `NEXT_PUBLIC_INTERCOM_APP_ID` is empty in `.env.local`. Intercom widget silently does nothing.
- **Owner:** Engineering / DevOps
- **Action:** Fill in the App ID (`l054jq87` per PRD) in the production environment variables.

### B-02 · GTM container has jQuery-dependent tags
- **What:** GTM container `GTM-563V498` contains WordPress/Elementor tags that call `jQuery`, crashing in the React environment. GTM is currently disabled.
- **Owner:** Marketing
- **Action:** In GTM dashboard, pause or scope WordPress-only tags to `Page Hostname = www.uniuni.com`. Once done, re-enable GTM in `Analytics.tsx`.

### B-03 · CustomerSupport form — contact reasons, incident options, CF field mapping all wrong
- **What:** Three interconnected issues documented in `KNOWN_ISSUES.md` (issues 1–3). Tickets sent to Freshdesk have incorrect `type`, wrong `custom_fields`, and wrong priority.
- **Owner:** Product / Ops
- **Action:** Decide Option A (align with shortcoder) or Option B (redesign). See `KNOWN_ISSUES.md` for full details.

---

## 🟡 P1 — Important (degrade experience or data quality)

### I-01 · Package weight field missing from tracking API response
- **What:** The tracking result API does not return a `weight` field. The UI cannot display package weight even if design requires it.
- **Owner:** Backend
- **Action:** Confirm with backend team whether weight data is available and can be added to the response payload.

### I-02 · Analytics tags unverified after GTM fix
- **What:** Once B-02 is resolved and GTM is re-enabled, these need to be verified end-to-end:
  - GA4 `G-QF1ELHQT9Y` (`link_attribution: true`, `anonymize_ip: true`)
  - Facebook Pixel `1136060545393230` — PageView firing
  - Microsoft Clarity `vmm8h2ip9q`
  - HubSpot Portal `49003739`
- **Owner:** Marketing / Engineering
- **Action:** Use Tag Assistant, Meta Pixel Helper, and Clarity Dashboard to verify after deployment. See `ANALYTICS_AUDIT.md` §6 for verification steps.

### I-03 · Live site extra tags not in PRD — confirm scope
- **What:** Three tags are firing on the live site but not mentioned in the PRD:
  - Google Ads `AW-16823200896`
  - LinkedIn Insight Tag `pid=8416905`
  - LeadFeeder / Dealfront `lftracker_v1_lAxoEaKXg0A8OYGd`
- **Owner:** Marketing
- **Action:** Confirm whether these are needed on the standalone portal. If yes, add to `Analytics.tsx`.

---

## 🟠 Design gaps (need design input)

### D-01 · Error toasts — no design spec
- **What:** The design file does not include specs for error states (API timeout, invalid tracking number, network error, form submission failure, etc.). Current error handling uses ad-hoc inline messages.
- **Owner:** Design
- **Action:** Provide toast / error component spec (copy, color, duration, position).

### D-02 · Tracking status → 4-step progress bar mapping missing
- **What:** The design shows a 4-step progress indicator (e.g. Order Received → In Transit → Out for Delivery → Delivered), but there is no mapping document from the ~30+ raw API status codes to these 4 steps.
- **Owner:** Design / Product
- **Action:** Provide the status code → step mapping table.

### D-03 · Bulk export UI not in design
- **What:** PRD F-09 requires bulk Excel export for batch queries, but the design file has no spec for this feature (button placement, loading state, filename format).
- **Owner:** Design
- **Action:** Provide UI spec, or confirm whether F-09 is descoped.

---

## ⚪ Low priority / confirmed deferred

### L-01 · CustomerSupport — vendor field (SHEIN / TEMU / TikTok) not implemented
- See `KNOWN_ISSUES.md` issue 5. Likely intentionally dropped. Confirm with product.

### L-02 · react-query hydration warning (`__ssr__` className)
- SSR marker injected by react-query during build-time prerender. Cosmetic only, no user impact. Deferred.

### L-03 · URL deep link `?no=` query parameter (PRD F-06)
- Pre-fill and auto-submit tracking number from URL param. Not yet implemented.
- **Owner:** Engineering
