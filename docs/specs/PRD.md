# UniUni Tracking Portal — Product Requirements Document

> Source: https://unirequest.atlassian.net/wiki/spaces/TD/pages/2537488387/UniUni+Tracking+Portal

### Document Info

|  |  |
| --- | --- |
| **Product** | UniUni Tracking Portal |
| **Version** | 1.0 |
| **Date** | 2026-05-11 |
| **Status** | Draft |
| **Author** | Peter Pan |
| **Stakeholders** | Marketing, Engineering, Infrastructure |

### 1. Background & Problem Statement

During last year's peak season, the tracking query feature on http://uniuni.com experienced a significant surge in traffic. This high volume degraded overall website performance, affecting all visitors to the main marketing site.

Two core problems were identified:

* **Traffic overload:** Peak-season tracking queries consumed disproportionate server resources on the main website, causing slowdowns across all pages.
* **Legacy tech stack:** The existing tracking implementation relies on an outdated technology stack (WordPress/Elementor shortcode) that cannot support high-performance, high-concurrency query requirements.

As a result, Marketing and IT have aligned on building a new, independent Tracking Portal — a dedicated application that isolates tracking traffic from the main website and provides a scalable, performant foundation for future growth.

### 2. Objectives

* Decouple tracking traffic from http://uniuni.com to eliminate performance impact on the main marketing site.
* Provide a fast, reliable package tracking experience for end users during both normal and peak periods.
* Establish an independent, scalable infrastructure for the Tracking Portal that can be maintained and extended separately from the main website.
* Preserve all existing tracking functionality, analytics instrumentation (event tracking), and SEO configuration currently on http://uniuni.com/tracking/.
* Introduce improvements including Estimated Delivery Date (EDD) display and a refreshed UI/UX design.

### 3. Scope

#### 3.1 In Scope

* A brand-new, standalone Tracking Portal — independent of http://uniuni.com.
* Dedicated infrastructure cluster (separately provisioned from the main website).
* Package tracking: single and batch queries (up to 25 tracking numbers).
* EDD (Estimated Delivery Date) display.
* Bulk Excel export of tracking results for batch queries.
* Helpdesk ticket submission page.
* Intercom chatbot integration.
* Analytics event tracking, SEO meta tags, and third-party pixel configuration (migrated from existing tracking page — see Section 6).
* New UI/UX design (not a migration of the WordPress design).
* The French-language version must be available at launch.

#### 3.2 Out of Scope

* Any changes to the existing http://uniuni.com main website.
* New backend tracking API.

#### 4.1 Package Tracking

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| F-01 | Single Query | User enters one tracking number and retrieves full shipment status timeline. | P0 |
| F-02 | Batch Query | User enters up to 25 tracking numbers (comma or line-break separated) and retrieves status for all. | P0 |
| F-03 | Status Timeline | Display a chronological list of tracking events: timestamp, status label, location. | P0 |
| F-04 | EDD Display | Show Estimated Delivery Date when available from the API response. | P1 — New feature |
| F-05 | Invalid Tracking Number | Display a clear error state when a tracking number returns no result. | P0 |
| F-06 | URL Deep Link | Support `?no=` query parameter to pre-fill and auto-submit a tracking number. | P0 — Retain |
| F-07 | POD (Proof of Delivery) | Allow users to view and download delivery confirmation photos. | P0 — Retain |
| F-08 | Postal Code Verification | Prompt for destination postal code before showing POD photos. | P0 — Retain |
| F-09 | Export & Bulk Download | Allow copy-to-clipboard, Excel export of individual tracking results, and bulk Excel export of all tracking results for batch queries. No compression required. | P1 — Retain |

#### 4.2 Helpdesk & Support

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| F-10 | Helpdesk Page | Dedicated page or section for submitting a support ticket related to a shipment. | P1 — Retain |
| F-11 | Intercom Chatbot | Embed Intercom widget (App ID: l054jq87) as the primary customer service channel. | P0 |

#### 4.3 Analytics, SEO & Third-Party Integrations

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| F-12 | Google Tag Manager | Implement GTM container: `GTM-563V498`. | P0 — Retain |
| F-13 | Google Analytics 4 | Implement GA4: `G-QF1ELHQT9Y`. Preserve `link_attribution: true` and `anonymize_ip: true`. | P0 — Retain |
| F-14 | Facebook Pixel | Implement Pixel ID: `1136060545393230`. Fire `PageView` on page load. | P0 — Retain |
| F-15 | Microsoft Clarity | Implement Clarity tag: `vmm8h2ip9q`. | P1 — Retain |
| F-16 | HubSpot | Implement HubSpot tracking: App ID `49003739`. Set content type as `standard-page`. | P1 — Retain |
| F-17 | SEO Meta Tags | `<title>` UniUni • Package Tracking, meta description, canonical URL, robots directives. | P0 — Retain |
| F-18 | hreflang | EN → `/tracking/`, FR → `/fr/suivi/`. | P0 — Retain |
| F-19 | Open Graph / Twitter Card | Implement OG and Twitter Card meta tags for social sharing preview. | P1 — Retain |

#### 4.4 UI / UX

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| F-20 | New UI Design | Implement new UI/UX design, independent of WordPress/Elementor. Design assets provided by design team. | P0 |
| F-21 | Multi-result Layout | UI must clearly present multiple tracking results in a scannable list. Design revision in progress. | P0 |
| F-22 | Responsive Design | Full support for desktop (≥900px) and mobile (<900px) viewports. | P0 |
| F-23 | Bilingual Support | Support English and French (fr-CA) language versions. | P1 |

### 5. Non-Functional Requirements

#### 5.1 Performance

* Page initial load time: < 2 seconds (LCP) under normal traffic conditions.
* Tracking API response rendered to user: < 3 seconds for a single query.
* Batch query (25 items) rendered: < 5 seconds.

#### 5.2 Scalability & Infrastructure

* The Tracking Portal must run on a dedicated infrastructure cluster, completely independent of http://uniuni.com hosting.
* The cluster must support horizontal scaling to handle peak-season traffic without degradation.
* Infrastructure provisioning was completed the week of May 5, 2026.

#### 5.3 Reliability

* Target availability: 99.9% uptime.

#### 5.4 Security

* All traffic served over HTTPS.
* No sensitive user data stored on the frontend.
* Postal code verification retained before exposing POD imagery.

#### 5.5 Maintainability

* The portal must be independently deployable.

### 6. Analytics & SEO Baseline (from Existing Tracking Page)

The following is the current configuration on http://uniuni.com/tracking/ and serves as the migration target for the new portal. All settings below must be implemented identically in the new portal.

#### 6.1 SEO Configuration

| Field | Value |
| --- | --- |
| Page Title | UniUni • Package Tracking |
| Meta Description | Track your package instantly with UniUni's package tracker. Enter your tracking number now for real-time updates and delivery status. |
| Canonical URL | https://www.uniuni.com/tracking/ |
| Robots | follow, index, max-snippet:-1, max-image-preview:large |
| hreflang EN | https://www.uniuni.com/tracking/ |
| hreflang FR | https://www.uniuni.com/fr/suivi/ |
| OG Image | https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif |

#### 6.2 Analytics & Tracking Tools

| Tool | Configuration |
| --- | --- |
| Google Tag Manager | Container ID: GTM-563V498 |
| Google Analytics 4 | Measurement ID: G-QF1ELHQT9Y · link_attribution: true · anonymize_ip: true |
| Facebook Pixel | Pixel ID: 1136060545393230 · Event: PageView |
| Microsoft Clarity | Tag ID: vmm8h2ip9q |
| HubSpot | App ID: 49003739 · Content Type: standard-page |
| Intercom | App ID: l054jq87 |

### 7. Delivery Plan

| Milestone | Owner | Target Date | Status |
| --- | --- | --- | --- |
| UI/UX design — multi-result tracking view revision | Design Team | Week of May 12, 2026 | In Progress |
| Infrastructure cluster deployment | IT / DevOps | Week of May 5, 2026 | ✅ Completed |
| New frontend implementation | Engineering | May 22, 2026 | Planned |

### 8. Assumptions & Dependencies

* The tracking API (delivery-api.uniuni.ca) remains unchanged and accessible from the new portal's infrastructure.
* Final UI/UX design assets (updated for multi-result view) will be delivered to Engineering by end of week May 12, 2026.
* GTM, GA4, Facebook Pixel, Clarity, and HubSpot configurations will be validated by the Marketing team after frontend delivery.
* The French-language version (/fr/suivi/) is in scope and must be available at launch.
* Intercom account configuration (App ID: l054jq87) requires no changes; only the embed script needs to be included.
