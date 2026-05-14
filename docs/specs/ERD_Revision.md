---
title: UniUni Tracking Portal — Standalone Frontend
status: Draft
authors: [Steven Yang]
required_reviewers: [Ali, Jason]
additional_reviewer: TBD
created: 2026-05-12
last_updated: 2026-05-12
last_reviewed: 2026-05-12
review_cadence: quarterly
linked_epic: "https://unirequest.atlassian.net/wiki/spaces/TD/pages/2537488387"
---

# Engineering Design Document — Tier 1

---

## 1. Introduction

We are replacing the WordPress/Elementor/Shortcoder tracking page at `www.uniuni.com/tracking/` with a standalone Next.js 16 static-export application served at the same URL via nginx proxy routing. The driver is peak-season tracking traffic degrading the main marketing site — isolation to a dedicated ECS cluster eliminates the shared failure mode. The chosen approach is a pure client-side SSG app: no new backend, all tracking data fetched via the existing `delivery-api.uniuni.ca` after user input. The biggest tradeoff is that the portal is now engineering-owned for all content and pixel changes, removing Marketing's self-serve CMS access permanently.

---

## 2. Context and Goals ★

### What's the problem?

During peak season, tracking queries on `www.uniuni.com` consumed disproportionate server resources, degrading performance across all pages of the main marketing site. The existing implementation is a WordPress/Elementor page using a Shortcoder plugin to embed a React component — a legacy stack that cannot support high-concurrency requirements or be independently scaled.

### Goals

- Eliminate peak-season tracking load impact on `www.uniuni.com` by isolating all tracking traffic to a dedicated ECS cluster
- Preserve URL continuity (`/tracking/`, `/fr/suivi/`) with zero SEO regression
- Preserve all existing analytics, pixel, and SEO configuration identically
- Ship EDD display and a new UI/UX design as part of the migration
- Engineering delivery: **May 22, 2026**

### Non-goals

- No new backend tracking API — consume existing `delivery-api.uniuni.ca` unchanged
- No changes to the main `www.uniuni.com` WordPress site
- No server-side rendering or user accounts — pure static frontend
- No new Freshdesk/Intercom account configuration changes

---

## 3. Requirements ★

### Functional

| ID | Requirement |
| --- | --- |
| F-01 | Single and batch package tracking (up to 25 tracking numbers, comma or newline separated) |
| F-02 | Status timeline: chronological events with timestamp, status label, location |
| F-03 | EDD (Estimated Delivery Date) display — fetched from `prm-api.uniuni.com` in parallel with tracking query |
| F-04 | Invalid tracking number error state |
| F-05 | URL deep-link: `?no=` query param pre-fills and auto-submits on page load |
| F-06 | POD (Proof of Delivery): postal code verification modal → view/download delivery photos |
| F-07 | Excel export (single result and bulk batch) + copy-to-clipboard |
| F-08 | ZIP download for bulk POD images |
| F-09 | Helpdesk ticket submission form → Freshdesk via `map.cluster.uniexpress.org/business/ticket` |
| F-10 | Intercom chatbot embed (App ID: `l054jq87`) |
| F-11 | GTM, GA4, Facebook Pixel, Clarity, HubSpot integrations |
| F-12 | Full SEO: title, meta description, canonical, robots, hreflang (EN/FR), OG, Twitter Card |
| F-13 | Bilingual: English (`/tracking/`) and French (`/fr/suivi/`) at launch |
| F-14 | Multi-result accordion: each result a collapsible card, first auto-expanded |
| F-15 | Warehouse notice display for relevant shipments |
| F-16 | Multi-piece shipment (ticket) view with piece-level drilldown |

### Non-functional

| Target | Value |
| --- | --- |
| LCP (initial page load) | < 2s |
| Single tracking query rendered | < 3s |
| Batch query (25 items) rendered | < 5s |
| Availability SLO | 99.9% uptime |
| RPO / RTO | No stateful data — RPO N/A; RTO < 15 min (redeploy static build) |
| Data volume (Year 1) | No data stored; all queries are stateless client-side API calls |

### Compliance

| Domain | In scope? | Notes |
| --- | --- | --- |
| SOC 2 Type II controls touched | N | Pure frontend; no data persistence; no auth system |
| ISO 27001 controls touched | N | Same rationale |
| DOJ DSP / Bulk Data Rule — US person PII accessible to China-based systems | N | Tracking numbers are shipment identifiers, not US person PII. No data is stored or transmitted to China-based systems. The app is read-only, calling Canadian-hosted APIs. |
| PIPEDA / GDPR | N | No user PII collected or stored. Tracking numbers written to `localStorage` only for UX convenience; no server persistence. |
| Customer contractual obligations | N | No customer-specific data handling changes in this migration |

---

## 4. Proposed Design ★

### Architecture

```
Browser
  │
  ├─ Static HTML/CSS/JS (served from ECS cluster via nginx)
  │    next build → output: 'export' → /out/ static directory
  │
  ├─ nginx proxy on www.uniuni.com
  │    /tracking/*     → ECS tracking cluster
  │    /fr/suivi/*     → ECS tracking cluster
  │    /_next/static/* → ECS tracking cluster (or CDN)
  │    all other paths → WordPress main site
  │
  └─ Client-side API calls (browser → external APIs)
       delivery-api.uniuni.ca     — tracking data + territories
       prm-api.uniuni.com         — EDD data
       map.cluster.uniexpress.org — Freshdesk ticket submission
```

### Components

| Component | Responsibility | Technology |
| --- | --- | --- |
| `app/layout.tsx` | Root HTML shell, Poppins font, Intercom script, providers | Next.js App Router |
| `app/page.tsx` | English tracking page (`/tracking/`), `generateMetadata` for SEO | Next.js SSG page |
| `app/providers.tsx` | TanStack Query client wrapper | `@tanstack/react-query` |
| `components/tracking/TrackingInput.tsx` | Search bar, submit, deep-link `?no=` init | React |
| `lib/hooks/useTracking.ts` | All tracking state — query, results, EDD map, modal states | TanStack Query `useMutation` |
| `components/tracking/results/TrackingResults.tsx` | Result list, invalid TNOs, bulk export, ZipModal, PiecesView | React |
| `components/tracking/results/ParcelCard.tsx` | Single-result accordion card (header + collapse), warehouse notices | React |
| `components/tracking/results/ResultCard.tsx` | Card content: EDD, progress tracker, tracking history, POD trigger | React |
| `components/tracking/ZipModal.tsx` | Postal code verification → POD view/download | React |
| `components/layout/CustomerSupport.tsx` | Helpdesk ticket form → Freshdesk API | React + axios |
| `components/layout/FAQ.tsx` | Accordion FAQ section | React |
| `lib/api/tracking.ts` | `fetchTracking()` — GET `delivery-api.uniuni.ca/cargo/trackinguniuninew` | axios |
| `lib/api/edd.ts` | `fetchEdd()` — POST `prm-api.uniuni.com/version2/orders/edd_information` | axios |
| `lib/api/pod.ts` | `fetchPodImages()` — GET POD photo URLs | axios |
| `lib/api/notice.ts` | `fetchWarehouseNotices()` — GET warehouse-level notices | axios |

### Key flows

**Flow 1 — User submits tracking numbers**

```
User types TNOs → TrackingInput.onSubmit
  → useTracking.track(input)
    → useMutation.mutate(rawInput)
      → Promise.all([fetchTracking(ids), fetchEdd(tnoArray)])
        ← TrackingResponse + EddMap
      → setValidResults, setInvalidTnos, setEddMap
      → setOpenDetails({ [firstResult.tno]: true })  // auto-expand first
      → scroll to results ref
  → TrackingResults renders ParcelCard[] for each valid result
  → ParcelCard[0] renders ResultCard (expanded)
```

**Flow 2 — POD view (postal code verification)**

```
User clicks "View Delivery Confirmation"
  → onViewPod(tno, index) → openZipModal(index, 'view')
  → ZipModal renders postal code input
  → User submits ZIP → fetchPodImages(tno, zipCode)
    ← image URLs
  → renders POD photo carousel/viewer
```

**Flow 3 — Helpdesk ticket submission**

```
User fills CustomerSupport form → handleSend()
  → validates required fields
  → axios.post(TICKET_API, FormData | JSON body)
    ← { status: 'SUCCESS' }
  → clearForm() + success modal
```

### API contracts

**Tracking API**
- `GET https://delivery-api.uniuni.ca/cargo/trackinguniuninew?id={csv_tnos}&key={API_KEY}`
- Response: `{ status: 'SUCCESS', data: { valid_tno: TrackingResult[], invalid_tno: string } }`
- Auth: `key` query param from `NEXT_PUBLIC_TRACKING_API_KEY` env var
- Timeout: 30s

**EDD API**
- `POST https://prm-api.uniuni.com/version2/orders/edd_information`
- Body: `{ order_numbers: string[] }`
- Auth: Bearer token from `NEXT_PUBLIC_EDD_API_KEY` env var
- Response: `Record<string, EddData>` keyed by tracking number

**Freshdesk Ticket API**
- `POST https://map.cluster.uniexpress.org/business/ticket`
- Body: JSON or `multipart/form-data` (when attachment present)
- No client-side auth — proxy handles Freshdesk credentials server-side
- Response: `{ status: 'SUCCESS' }`

**Territories API**
- `GET https://delivery-api.uniuni.ca/cargo/territories?country={Canada|USA}`
- Response: `{ data: Array<{ state: string, cities: string[] }> }`
- Used by: CustomerSupport form province/city cascades

### Data model

All data is transient — fetched client-side per user request, held in React state, never persisted to any database or server.

| State | Type | PII? | Persistence |
| --- | --- | --- | --- |
| `validResults` | `TrackingResult[]` | No — shipment identifiers only | React state (in-memory) |
| `eddMap` | `Record<string, EddData>` | No | React state (in-memory) |
| `inputValue` | `string` | No | React state; tracking numbers only |
| Recent tracking numbers | `string` | No | `localStorage` (UX only, user-controllable) |

No schema migrations. No database.

### AWS services

| Service | Purpose | Region | Why this choice |
| --- | --- | --- | --- |
| ECS (Fargate or EC2) | Serve static files via nginx | ca-central-1 (assumed) | Already provisioned by DevOps week of May 5; matches existing UniUni infra region |
| CDN (CloudFront or equivalent) | Edge cache `/_next/static/*` assets | Global edge | Required to achieve LCP < 2s for geographically distributed users — confirmed needed per R-03 |

---

## 5. Key Decisions (ADRs) ★

### Decision 1: SSG (`output: 'export'`) over SSR

- **Decision:** Build a fully static site with Next.js `output: 'export'`. All tracking queries happen client-side after page load.
- **Alternatives considered:** SSR (Node.js server), ISR (incremental static regeneration)
- **Why this choice:** Tracking results are user-specific (entered at runtime) — there is nothing to server-render at build time. SSG produces pure static files that can be served from ECS/nginx or a CDN with no Node.js process, minimizing infra cost and operational surface.
- **Consequences:** No server-side request proxying; API keys for tracking/EDD are exposed as `NEXT_PUBLIC_` env vars (acceptable — read-only, rate-limited APIs with no user PII).
- **Status:** Accepted

### Decision 2: TanStack Query (`useMutation`) over raw `useState` + `useEffect`

- **Decision:** Use `@tanstack/react-query` for the tracking mutation (loading state, result caching, error handling).
- **Alternatives considered:** Raw `useState` + `fetch` in `useEffect`, SWR
- **Why this choice:** TanStack Query provides clean loading/error/data states with minimal boilerplate; `useMutation` maps naturally to the "user submits → fetch → render" pattern. The existing codebase already had this dependency chosen.
- **Consequences:** Requires `QueryClientProvider` wrapper (`app/providers.tsx`).
- **Status:** Accepted

### Decision 3: axios over native `fetch`

- **Decision:** Use axios for all API calls (tracking, EDD, POD, notices, ticket submission).
- **Alternatives considered:** Native `fetch` (original ERD spec)
- **Why this choice:** axios provides a shared `http` instance with a global 30s timeout, automatic JSON parsing, and cleaner error handling for the `multipart/form-data` ticket submission. The bundle size delta (~14 KB gzipped) is acceptable for the gains.
- **Consequences:** Additional dependency; behavior difference from original ERD spec.
- **Status:** Accepted (diverges from original ERD)

### Decision 4: i18next over manual dual-route

- **Decision:** Use `i18next` + `react-i18next` for bilingual support instead of the manually-managed `locales/en.json` / `locales/fr.json` prop-passing approach described in the original ERD.
- **Alternatives considered:** Manual dual-route with `locale` prop (original ERD plan), `next-intl`
- **Why this choice:** i18next is the team's existing standard; avoids duplicating component trees; scales to additional locales without routing changes.
- **Consequences:** Adds two dependencies; locale detection and switching logic in `lib/i18n/`.
- **Status:** Accepted (diverges from original ERD)

### Decision 5: GTM removed from initial deployment

- **Decision:** GTM container `GTM-563V498` is not loaded in the current build. Analytics scripts (GA4, Pixel, Clarity, HubSpot) are pending direct implementation.
- **Alternatives considered:** Keep GTM, debug the jQuery conflict
- **Why this choice:** The GTM container includes a custom tag that calls `jQuery(...)` — jQuery is not loaded on the new portal, causing an uncaught `ReferenceError` that breaks page execution. The conflicting GTM tag must be identified and removed/fixed by the Marketing team before the container can be re-enabled.
- **Consequences:** Analytics data gap from launch until GTM is fixed. **Blocker for go-live** — Marketing must audit the GTM container before launch.
- **Status:** Accepted as temporary mitigation; must be resolved before GA

---

## 6. Cross-Cutting Concerns ★

### Security

- **Authentication and authorization:** None required — the portal is a public read-only page. No user login.
- **Secrets management:** Two API keys (`NEXT_PUBLIC_TRACKING_API_KEY`, `NEXT_PUBLIC_EDD_API_KEY`) are embedded in the client bundle as `NEXT_PUBLIC_` env vars. Both keys access read-only, rate-limited APIs with no PII — exposure risk is accepted. The Freshdesk API credentials are never exposed to the browser (handled by the `map.cluster.uniexpress.org` proxy).
- **Encryption at rest and in transit:** All API calls over HTTPS. No data persisted at rest on this application (only transient `localStorage` for tracking number UX, no PII).
- **Network exposure:** The ECS cluster is behind nginx on `www.uniuni.com`. The `/tracking/*` path is proxied; the cluster does not need a public IP of its own.
- **Top 3 threats and mitigations:**
  1. *API key scraping from bundle* → Keys are read-only/rate-limited; low blast radius. Mitigation: rate limiting on `delivery-api`.
  2. *Ticket form spam / abuse* → Freshdesk-side rate limiting; `map.cluster.uniexpress.org` proxy adds a server-side control layer.
  3. *XSS via tracking result data* → All API response data rendered via React (JSX, not `dangerouslySetInnerHTML`); safe by default.

### Data residency and cross-border

- **Where data lives:** No data is stored. All API responses are transient in browser memory.
- **Who can access it:** End user's browser only. No data sent to China-based systems.
- **DSP implications:** N/A — no US person PII flows through this application.
- **Replication and backup:** N/A — no stateful data.

### Reliability

- **Failure modes and blast radius:** If `delivery-api.uniuni.ca` is down, tracking queries return an error state in the UI. The main `www.uniuni.com` site is completely unaffected (isolated cluster). If the ECS cluster is down, only `/tracking/` and `/fr/suivi/` are affected.
- **Retries and idempotency:** No automatic retries currently. TanStack Query `useMutation` does not retry by default. Tracking API is idempotent (GET). Ticket submission is not retried on failure — user is shown an error modal.
- **DR posture:** Static build artifact can be redeployed in < 15 minutes from CI. No database restore required.

### Observability

- **Key metrics:** Page load time (LCP), tracking API p95 latency, EDD API p95 latency, ticket submission success rate, client-side JS error rate.
- **Dashboards and alerts:** Not yet configured — **open action item for DevOps before go-live.**
- **Logging:** Client-side errors not currently forwarded to a log aggregator. Browser errors only visible via Microsoft Clarity session replay (once GTM is re-enabled).
- **SLO burn-rate alerting:** Not configured. Required before launch per Definition of Done.

### Cost

| Scenario | Estimated Monthly AWS Cost |
| --- | --- |
| At launch | ~$50–150/month (ECS Fargate, minimal compute — static files served by nginx) |
| At 10x scale | ~$200–500/month; CDN edge caching absorbs most traffic growth |

- **Top cost drivers:** ECS compute, data transfer out. CDN caching is critical to keep transfer costs flat at scale.
- **No RDS, no Lambda, no S3 writes** — cost profile is simple.

### Operational readiness

- **Runbooks:** Not yet written — open action item before launch.
- **On-call impact:** Minimal. Application has no stateful components to page on. Primary on-call concern is `delivery-api.uniuni.ca` availability (owned by backend team, not this portal).
- **Deployment strategy:** Replace-in-place (`next build` → copy `out/` to cluster). No canary currently planned for v1.
- **Rollback plan:** nginx proxy config can be reverted to point `/tracking/*` back to WordPress in < 5 minutes. The WordPress page is not decommissioned at launch — kept as fallback.

---

## 7. Testing and Rollout ★

### Testing

| Type | Coverage | Owner |
| --- | --- | --- |
| TypeScript type checking | All components and API response shapes | Engineering (CI) |
| Manual functional testing | All P0 features: single/batch tracking, EDD, POD, deep-link, invalid TNO, ticket form | Engineering |
| Cross-browser | Chrome, Safari, Firefox (desktop + mobile) | Engineering |
| Responsive layout | 900px breakpoint (desktop/mobile) | Engineering |
| Analytics UAT | GTM, GA4, Pixel, Clarity, HubSpot event firing | Marketing team |
| Load testing | Simulate peak-season batch queries (25 TNOs × concurrent users) | DevOps — before go-live |
| No automated unit/integration tests currently planned for v1 | | |

### Rollout phases

| Phase | Description | Gating criteria | Target date |
| --- | --- | --- | --- |
| Internal / shadow | Deploy to ECS cluster; test via direct cluster URL (not yet proxied) | All P0 features pass manual QA | May 19–21, 2026 |
| Canary (10%) | nginx routes 10% of `/tracking/` traffic to new cluster | Error rate < 0.5% for 30 min; LCP < 2s | May 21–22, 2026 |
| GA | 100% traffic cutover via nginx | Analytics validated by Marketing; GTM jQuery conflict resolved | May 22, 2026 |

### Rollback triggers

- Client-side JS error rate > 2% sustained for 5 minutes
- Tracking API success rate drops below 95% (indicating proxy or routing issue)
- LCP > 4s for 10 minutes at canary stage
- GTM jQuery `ReferenceError` not resolved → delay GA, hold at canary

### Definition of Done

- [ ] All P0 functional requirements passing in manual QA
- [ ] LCP < 2s verified (requires CDN configured — see R-03)
- [ ] Batch query (25 items) < 5s verified
- [ ] GTM jQuery conflict resolved; GA4, Pixel, Clarity, HubSpot firing confirmed by Marketing
- [ ] SEO meta tags, canonical, hreflang verified in production HTML source
- [ ] Freshdesk ticket submission verified end-to-end
- [ ] Runbooks written and linked
- [ ] Dashboards and error-rate alerts live in observability tool
- [ ] Rollback procedure rehearsed (nginx revert to WordPress)
- [ ] French version (`/fr/suivi/`) verified in staging

---

## 8. Risks and Open Questions ★

| Risk or question | Likelihood / Impact | Mitigation or owner | Resolve by |
| --- | --- | --- | --- |
| R-01 — GTM container has jQuery dependency; cannot be loaded without breaking the page | High / High — analytics gap from day 1 | Marketing must audit GTM container `GTM-563V498` and remove/fix the jQuery-dependent tag before go-live | May 19, 2026 |
| R-02 — No CDN edge nodes configured; LCP target at risk | High / High — may miss < 2s LCP for non-CA users | DevOps must configure CloudFront (or equivalent) and set `assetPrefix` in `next.config.ts` before GA | May 19, 2026 |
| R-03 — Homepage tracking input on WordPress still processes queries server-side | Medium / High — peak load isolation goal partially defeated | Product / DevOps must confirm homepage input becomes a pure redirect to `/tracking/` | Before peak season |
| R-04 — Design assets and multi-result UI revision delayed past May 16 | Medium / High — Phase 2 blocked, May 22 deadline at risk | Engineering to complete all design-independent work (SEO, analytics, API integrations) in Phase 1; escalate to Design lead if assets are not delivered by May 16 | May 16, 2026 |
| R-05 — `NEXT_PUBLIC_` API keys in client bundle | Low / Low — read-only, rate-limited APIs | Accepted. If keys are rotated for any reason, a rebuild + redeploy is required | Ongoing |
| R-06 — Long-term Marketing self-serve capability lost | Low / Medium — hidden ongoing engineering cost | Stakeholders formally acknowledged this trade-off (R-02 from original ERD). No mitigation planned for v1 | Acknowledged |
| R-07 — French translation strings not delivered on time | Medium / Medium — bilingual launch at risk | Engineering can ship English-only and add French as a fast-follow if strings are delayed | May 22, 2026 |
| Open Q-01 — Which `xlsx` export format is expected for batch results? | — | Clarify with Product: one sheet per TNO vs. flat rows. Currently implemented as flat rows. | May 16, 2026 |
| Open Q-02 — Are there additional Freshdesk custom fields required for the US market? | — | Verify `cf_usa` field mappings with Support team | May 16, 2026 |

---

## 9. Appendix ◇

### Package dependencies (actual, as of 2026-05-12)

| Package | Version | Purpose | Delta from original ERD |
| --- | --- | --- | --- |
| `next` | 16.2.6 | Framework, SSG, App Router, `generateMetadata` | Updated from unspecified version |
| `react` / `react-dom` | 19.2.4 | UI rendering | Updated to React 19 |
| `typescript` | ^5 | Type safety | Unchanged |
| `@tanstack/react-query` | ^5.100 | Data fetching / mutation state | **New** — not in original ERD |
| `axios` | ^1.16 | HTTP client | **New** — original ERD specified native `fetch` |
| `i18next` + `react-i18next` | ^26 / ^17 | Bilingual support | **New** — original ERD planned manual dual-route |
| `jszip` | ^3.10 | ZIP generation for bulk POD download | **Changed** — original ERD specified `xlsx` for this use |
| `moment` | ^2.30 | Date formatting utilities | **New** — not in original ERD |
| `tailwindcss` | ^4 | Styling with `@theme` design tokens | **Changed** — original ERD said "TBD, Tailwind recommended" |

### Design token system (Tailwind 4 `@theme`)

Key tokens defined in `app/globals.css`:
- `--uni-orange: #FF8F1C`, `--uni-orange-dark: #FF6A13`
- `--uni-black: #101820`
- `--shadow-card: 4px 4px 10px 1px #D1E8E8`
- `--uni-input-border: #D9D9D9`

---

## 10. Living Document Maintenance ★

### Review cadence

Quarterly review by Steven Yang or nominated successor. Update `last_reviewed` in frontmatter even if no changes.

Triggered review when any of:
- Production incident traceable to this design
- `delivery-api.uniuni.ca` schema change
- GTM container changes affecting analytics
- AWS service deprecation (ECS, CDN)
- Cost variance > 25% from estimate
- A superseding design is created (e.g., server-side API proxy, auth layer)

### LLM-assisted refresh

This document is structured for LLM parsing (consistent headers, tables, YAML frontmatter). Suggested quarterly review workflow:

1. Provide this doc and the linked repo to Claude (or internal copilot).
2. Ask: *"Compare this design doc against the current implementation in [repo]. Flag drift in: components, API contracts, data model, package versions, cost estimates, and key decisions. Suggest specific edits."*
3. Review suggestions, accept accurate ones, commit with a changelog note.
4. Update `last_reviewed` and `last_updated`.

### Supersession

When a new design replaces parts of this one, mark the affected decision in Section 5 as `Superseded` with a link. Do not delete content.

### Change log

| Version | Date | Author | Summary |
| --- | --- | --- | --- |
| 0.1 | 2026-05-12 | Steven Yang | Initial revision — reflects actual implementation state as of May 12, 2026; supersedes ERD v1.3 |

---

## Reviewer Sign-Off

| Reviewer | Role | Status | Date |
| --- | --- | --- | --- |
| Ali | CTPO (required) | ☐ Approved ☐ Changes requested | |
| Jason | Required reviewer | ☐ Approved ☐ Changes requested | |
| TBD | Additional senior reviewer (nominated by Ali/Jason) | ☐ Approved ☐ Changes requested | |
