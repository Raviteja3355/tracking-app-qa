# UniUni Tracking Portal — Engineering Requirements Document

> Source: https://unirequest.atlassian.net/wiki/spaces/TD/pages/2538799107/UniUni+Tracking+Portal+Engineering+Requirements+Document

## Document Info

|  |  |
| --- | --- |
| **Product** | UniUni Tracking Portal |
| **Version** | 1.3 |
| **Date** | 2026-05-12 |
| **Status** | Draft |
| **Author** | Steven Yang |
| **Related PRD** | [UniUni Tracking Portal PRD](https://unirequest.atlassian.net/wiki/spaces/TD/pages/2537488387) |

---

## 1. Overview

This document defines the engineering implementation plan for the UniUni Tracking Portal. The portal replaces the existing WordPress/Elementor/Shortcoder tracking page at `www.uniuni.com/tracking/` with a standalone, independently-deployed frontend application served at the same URLs via nginx proxy routing.

**Key constraints:**

* Same domain and URL paths (`/tracking/` and `/fr/suivi/`) — SEO continuity required
* All existing marketing tools, analytics, and SEO configuration must be preserved exactly
* Pure frontend — no new backend API; consume existing `delivery-api.uniuni.ca`
* Bilingual: English (`/tracking/`) and French (`/fr/suivi/`) must both launch simultaneously
* Engineering delivery deadline: **May 22, 2026**

---

## 2. Tech Stack

| Layer | Decision | Rationale |
| --- | --- | --- |
| Framework | **Next.js (App Router)** | Built-in `generateMetadata` for SSG-time SEO tags; file-based routing cleanly supports dual-language paths |
| Render Mode | **SSG (**`output: 'export'`) | Tracking results are fetched client-side after user input — no SSR needed. Produces pure static files deployed to ECS/CDN cluster with no Node.js server required |
| Language | **TypeScript** | Type safety for `delivery-api` response shapes and component contracts |
| Styling | TBD — Tailwind CSS recommended | Utility-first; 900px responsive breakpoint straightforward to implement |
| HTTP | **Native** `fetch` | Sufficient for client-side API calls; no extra dependency |
| Excel Export | `xlsx` | Client-side `.xlsx` generation without any server involvement |
| i18n | **Manual dual-route** | Two page files sharing the same components; `locale` passed as prop; no third-party library needed for 2 languages |

---

## 3. Feature Implementation & Delivery Plan

### Milestones

| Milestone | Date | Status |
| --- | --- | --- |
| Infrastructure cluster deployment | Week of May 5, 2026 | ✅ Completed |
| UI/UX design assets + multi-result revision | End of week May 16, 2026 | 🔄 In Progress |
| Frontend engineering delivery | May 22, 2026 | Planned |

Work is split into two phases. **Phase 1** (May 12–16) covers all design-independent work and begins immediately. **Phase 2** (May 16–22) covers all UI implementation and is blocked until design assets are delivered.

---

### 3.1 Package Tracking

| PRD ID | Feature | Priority | Engineering Implementation | Dependencies | Target Date |
| --- | --- | --- | --- | --- | --- |
| F-01 | Single Query | P0 | Single text input → on submit, call `delivery-api` → render Status Timeline component | `delivery-api` response schema | May 13–17 |
| F-02 | Batch Query | P0 | Textarea accepts up to 25 tracking numbers (comma or line-break separated) → `Promise.all` concurrent requests → render multi-result list | F-21 layout, design assets | May 13–18 |
| F-03 | Status Timeline | P0 | Chronological list component: each event renders timestamp, status label, location. Sorted descending by timestamp | Design assets | May 16–17 |
| F-04 | EDD Display | P1 — New | Read EDD field from `delivery-api` response. If present, display prominently above timeline. No client-side calculation | `delivery-api` must return EDD field | May 16–17 |
| F-05 | Invalid Tracking Number | P0 | If `delivery-api` returns no result, render an inline error state within that result card | Design assets for error state UI | May 13–17 |
| F-06 | URL Deep Link | P0 — Retain | On page init, read `?no=` query param via `useSearchParams` → populate input state → auto-trigger submit | — | May 13–14 |
| F-07 | POD (Proof of Delivery) | P0 — Retain | After postal code verification passes, render POD photos in a modal/section. Support image download via anchor `download` attribute | F-08, design assets | May 18–19 |
| F-08 | Postal Code Verification | P0 — Retain | Before rendering POD: show modal prompting for destination postal code → compare user input against postal code field in `delivery-api` response → client-side only, no additional API call | `delivery-api` must return postal code field | May 18–19 |
| F-09 | Export & Bulk Download | P1 — Retain | (1) Copy to clipboard via `navigator.clipboard.writeText()`. (2) Single result Excel via `xlsx` library. (3) Bulk Excel: merge all batch results into one `.xlsx` and trigger browser download. No compression required | `xlsx` library | May 19–20 |

### 3.2 Helpdesk & Support

| PRD ID | Feature | Priority | Engineering Implementation | Dependencies | Target Date |
| --- | --- | --- | --- | --- | --- |
| F-10 | Helpdesk Page | P1 — Retain | Dedicated route or page section with a support ticket submission form. Form fields and submission endpoint TBD — pending Product confirmation | Submission endpoint TBD | May 20–21 |
| F-11 | Intercom Chatbot | P0 | Embed Intercom script in root layout via `<Script strategy="afterInteractive">`. No account configuration changes required | App ID: `l054jq87` | May 15–16 |

### 3.3 Analytics, SEO & Third-Party Integrations

| PRD ID | Feature | Priority | Engineering Implementation | Dependencies | Target Date |
| --- | --- | --- | --- | --- | --- |
| F-12 | Google Tag Manager | P0 — Retain | GTM snippet loaded via `<Script strategy="afterInteractive">` in root layout. Acts as container for GA4, Pixel, Clarity, HubSpot | Container: `GTM-563V498` | May 15–16 |
| F-13 | Google Analytics 4 | P0 — Retain | Configured as GTM tag. Must preserve `link_attribution: true` and `anonymize_ip: true` | GTM, Marketing validation | May 15–16 |
| F-14 | Facebook Pixel | P0 — Retain | Configured as GTM tag. Fire `PageView` event on page load | GTM, Marketing validation | May 15–16 |
| F-15 | Microsoft Clarity | P1 — Retain | Configured as GTM tag | GTM, Tag ID: `vmm8h2ip9q` | May 15–16 |
| F-16 | HubSpot | P1 — Retain | Configured via GTM tag or direct `<Script>`. Content type must be set to `standard-page` | App ID: `49003739` | May 15–16 |
| F-17 | SEO Meta Tags | P0 — Retain | Implemented via `generateMetadata` in each page file — rendered at SSG build time into static HTML. Title, meta description, canonical URL, robots directives per PRD Section 6 | — | May 14–15 |
| F-18 | hreflang | P0 — Retain | Declared in `generateMetadata` for both pages: EN → `https://www.uniuni.com/tracking/`, FR → `https://www.uniuni.com/fr/suivi/` | — | May 14–15 |
| F-19 | Open Graph / Twitter Card | P1 — Retain | OG and Twitter Card meta tags in `generateMetadata`. OG image: `https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif`, Twitter Card type: `summary_large_image` | — | May 14–15 |

### 3.4 UI / UX

| PRD ID | Feature | Priority | Engineering Implementation | Dependencies | Target Date |
| --- | --- | --- | --- | --- | --- |
| F-20 | New UI Design | P0 | Build component library based on design assets from Design team. No migration of existing WordPress/Elementor styles | ⚠️ Design assets due end of week May 16 | May 16–22 |
| F-21 | Multi-result Layout | P0 | Scrollable result list with one card per tracking number. Each card shows summary status and an expandable/inline timeline | ⚠️ Design revision due end of week May 16 | May 17–18 |
| F-22 | Responsive Design | P0 | Two breakpoints: desktop ≥ 900px, mobile < 900px. Implemented using Tailwind `md:` prefix with custom 900px breakpoint in `tailwind.config.ts` | Design assets | May 17–18 |
| F-23 | Bilingual Support | P1 | Dual-route: `app/tracking/page.tsx` (EN) and `app/fr/suivi/page.tsx` (FR). Shared components receive `locale` prop; strings from `locales/en.json` / `locales/fr.json`. French version must ship at launch | `locales/fr.json` translation strings | May 20–21 |

---

## 4. SEO Configuration

Implemented at build time via `generateMetadata` — present in static HTML, fully crawlable without JavaScript.

### English — `app/tracking/page.tsx`

| Field | Value |
| --- | --- |
| `<title>` | UniUni • Package Tracking |
| Meta description | Track your package instantly with UniUni's package tracker. Enter your tracking number now for real-time updates and delivery status. |
| Canonical | `https://www.uniuni.com/tracking/` |
| Robots | `follow, index, max-snippet:-1, max-image-preview:large` |
| hreflang EN | `https://www.uniuni.com/tracking/` |
| hreflang FR | `https://www.uniuni.com/fr/suivi/` |
| OG image | `https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif` |
| Twitter Card | `summary_large_image` |

### French — `app/fr/suivi/page.tsx`

Same structure with French title and description. Canonical URL: `https://www.uniuni.com/fr/suivi/`.

---

## 5. Non-Functional Requirements

### 5.1 Performance (PRD 5.1)

| Metric | Target | Engineering Approach |
| --- | --- | --- |
| LCP — initial page load | < 2s | SSG static HTML served from CDN; all analytics scripts loaded `afterInteractive` to avoid render-blocking |
| Single query rendered | < 3s | Direct `delivery-api` call with 5s request timeout |
| Batch query — 25 items rendered | < 5s | `Promise.all` concurrent requests; do not call sequentially |

### 5.2 Scalability (PRD 5.2)

Static files served from an independent ECS frontend cluster. Horizontal scaling is handled at the infrastructure level — no application-layer changes required. Traffic spikes on `/tracking/` have zero impact on `www.uniuni.com`.

### 5.3 Reliability (PRD 5.3)

Target: **99.9% uptime**. Achieved through CDN distribution and the independent cluster — no shared single point of failure with the main WordPress site.

### 5.4 Security (PRD 5.4)

| Requirement | Implementation |
| --- | --- |
| All traffic over HTTPS | Inherited from `www.uniuni.com` TLS certificate via nginx proxy |
| No sensitive user data stored on frontend | Only tracking numbers written to `localStorage` — no PII persisted |
| POD gated by postal code verification | Postal code comparison enforced in component logic before any POD photo is rendered |

### 5.5 Maintainability (PRD 5.5)

Independent CI/CD pipeline. Deployments have no dependency on the WordPress site release cycle.

---

## 6. Infrastructure & Deployment

| Item | Detail |
| --- | --- |
| Build command | `next build` → `output: 'export'` → generates `out/` static directory |
| Hosting | ECS frontend cluster — provisioned week of May 5, 2026 ✅ |
| Domain | `www.uniuni.com` — shared with main site, traffic separated via nginx proxy |
| Proxy routing | DevOps configures nginx: `/tracking/*` and `/fr/suivi/*` → new cluster; `/_next/static/*` → cluster or CDN |
| HTTPS | Inherited from main site TLS certificate |
| Static assets | `assetPrefix` in `next.config.ts` to be configured once CDN URL is confirmed by DevOps |
| Deployments | Independent pipeline; no coordination with WordPress required |

---

## 7. Assumptions & Dependencies

| # | Assumption | If Not Met |
| --- | --- | --- |
| A-01 | `delivery-api.uniuni.ca` is unchanged and reachable from the new cluster | All tracking features blocked |
| A-02 | Design assets including multi-result revision delivered by end of week May 16 | Phase 2 delayed — May 22 deadline at risk |
| A-03 | Marketing team validates GTM / GA4 / Pixel / Clarity / HubSpot after frontend delivery | Analytics go-live delayed post-launch |
| A-04 | French version (`/fr/suivi/`) ships simultaneously with English | Launch scope reduced |
| A-05 | Intercom account configuration unchanged — embed script only required | F-11 blocked |

---

## 8. Engineering Risks

The following risks are raised by Engineering and require acknowledgement or resolution from stakeholders before or during development.

* **R-01 — Homepage tracking entry point still runs on WordPress** _(Severity: High — Owner: Product / DevOps — Resolve before launch)_  
  The main `www.uniuni.com` homepage contains a tracking input. If that input still processes queries on the WordPress stack — rather than simply redirecting to the new portal — peak-season load on the main site is not meaningfully reduced. The root cause of the performance problem is only solved if the homepage entry point becomes a pure redirect with no server-side tracking logic. Needs confirmation from Product / DevOps on how the homepage will be re-wired.
* **R-02 — Long-term maintenance cost of a standalone Next.js portal** _(Severity: Medium — Owner: Product / Engineering — Resolve before launch)_  
  The current WordPress setup allows Marketing to independently manage content, tags, and pixels via GTM and the CMS without engineering involvement. Moving to a standalone Next.js project means any content change, new marketing pixel, or copy update requires a code change, PR review, and deployment. This introduces ongoing hidden engineering cost that is not reflected in the current project scope or resourcing plan. Stakeholders should be aware this is a permanent operational trade-off, not a one-time migration cost.
* **R-03 — No CDN edge nodes configured — LCP target at risk** _(Severity: High — Owner: DevOps — Resolve before go-live)_  
  The PRD requires LCP < 2s. The current infrastructure plan deploys static files to an ECS cluster without confirmed CDN edge node distribution. Without geographic edge caching, users outside the cluster's region will experience latency that makes the LCP target unachievable, particularly during peak traffic. This is an infrastructure gap independent of the frontend implementation. CDN `assetPrefix` and edge node configuration must be confirmed before go-live.

---

## 9. Package Dependencies

| Package | Purpose |
| --- | --- |
| `next` | Framework — SSG, App Router, `generateMetadata` |
| `react` / `react-dom` | UI rendering |
| `typescript` | Type safety |
| `xlsx` | Client-side Excel file generation (F-09) |
| `tailwindcss` _(TBD)_ | Responsive styling (F-22) |
