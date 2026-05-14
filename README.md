# UniUni Tracking Page

Standalone package tracking page for [uniuni.com/tracking/](https://www.uniuni.com/tracking/) and [uniuni.com/fr/suivi/](https://www.uniuni.com/fr/suivi/). Built as a static site (Next.js `output: 'export'`) served by Nginx on AWS EKS behind CloudFront, completely decoupled from the main WordPress infrastructure.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
```

Copy `.env.local` from a teammate or 1Password — the app won't call any APIs without it.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DELIVERY_API` | Main tracking API |
| `NEXT_PUBLIC_DISPATCH_API` | Dispatch / map API |
| `NEXT_PUBLIC_DRIVER_APP_CA` / `_US` | Driver app API (notices, POD) |
| `NEXT_PUBLIC_EDD_API_URL` + `_KEY` | Estimated delivery date |
| `NEXT_PUBLIC_TRACKING_API_KEY` | Auth key for tracking API |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (optional) |
| `NEXT_PUBLIC_GA4_ID` | GA4 Measurement ID — explicit gtag config (optional) |
| `NEXT_PUBLIC_HUBSPOT_ID` | HubSpot (optional) |
| `NEXT_PUBLIC_INTERCOM_APP_ID` | Intercom widget (optional) |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity (optional) |

## Build & deploy

```bash
npm run build     # outputs static files to out/
```

CI/CD (CircleCI) builds a Docker image and pushes to ECR. CloudFront routes `/tracking/*` and `/fr/suivi/*` to the EKS cluster. See [Confluence — Architecture Design](https://unirequest.atlassian.net/wiki/spaces/TD/pages/2406612995) for the full deployment diagram.

**Local Docker test:**

```bash
docker build -f Dockerfile.dev -t uniuni-tracking .
docker run -p 8080:80 uniuni-tracking
# open http://localhost:8080/tracking
```

> `Dockerfile.dev` bakes `.env.local` into the image at build time. Never use it for production.

## Project structure

```
app/
├── (en)/          English routes: / and /tracking/
├── (fr)/          French route: /fr/suivi/
└── globals.css    Tailwind v4 @theme tokens + keyframes

components/
├── layout/        Structural shell: SharedLayout, Header, Footer
├── sections/      Page content blocks: FAQ, CustomerSupport, TrackingHero
│   └── tracking/  Tracking feature: TrackingInput, TrackingResults, modals, result cards
├── marketing-tools/  Third-party scripts: Analytics (GTM + GA4), Intercom, Clarity
├── icons/         SVG icon components
└── ui/            Generic reusable primitives: CookieBanner, FormSelect

lib/
├── api/           API call functions (tracking, edd, pod, notice)
├── constants.ts   STATE_STEP_MAP, Links, Support, DateTime constants
├── context/       TrackingContext — global state for the entire tracking feature
├── hooks/         useTracking, usePod
├── i18n/          Translation JSON files (en / fr)
├── types/         Shared TypeScript types
└── utils/         formatTime, trackingStatus, validation, watermark

docs/
├── ARCHITECTURE.md      SSG, i18n strategy, hydration decisions, deployment pipeline
├── audits/              TRACKING_LOGIC_AUDIT, MARKETING_TOOLS_AUDIT, SEO_AUDIT
├── reference/           Shortcoder source HTML (PROD), shortcoder logic notes, static_page.html
├── specs/               PRD, ERD, ERD_Revision
└── worklog/             WORKLOG_2026-05-12.md (commits 1-31)
```

## Component tree

```
app/(en)/tracking/page.tsx             ← Server Component
└── SharedLayout
    └── TrackingHero (locale prop)
        └── TrackingProvider           ← React Context: owns ALL tracking state
            ├── TrackingInput          reads: inputValue · loading · alert flags
            │                          calls: setInputValue · handleTrack
            │
            ├── LoadingOverlay         reads: loading
            │
            ├── TrackingResults        reads: validResults · invalidTnos · openDetails · piecesView
            │   └── ParcelCard (×N)    reads: result · isOpen · collapsible
            │       └── ResultCard     reads context: eddMap · handleViewPod
            │
            ├── ZipModal               reads context: zipModal · handleZipVerify · closeZipModal
            └── PodModal               reads context: pod · navigate · downloadCurrent · downloadAll
```

### Props vs Context

| What | How | Why |
|------|-----|-----|
| `eddMap` | Context | ResultCard is 4 levels deep; intermediaries don't use it |
| `handleViewPod` | Context | Defined in TrackingProvider, called in ResultCard |
| `zipModal` / `pod` state + handlers | Context | Modals are siblings, not children, of the component that triggers them |
| `locale` | Prop (page → TrackingHero → TrackingProvider) | Baked into static HTML at build time; avoids hydration mismatch |
| `result`, `isOpen`, `collapsible` | Props (1 level) | Direct parent → child, no drilling |

## Adding a translation key

1. Add the key to `lib/i18n/locales/en.json` and `fr.json`
2. **Above-fold components** (Header, Footer, FAQ, TrackingInput): use `t['yourKey']` — translations are imported directly from JSON via the `locale` prop
3. **Interactive components** (ResultCard, modals, etc.): use `useTranslation()` as usual

## Routes

| URL | Page |
|---|---|
| `/` | English home (redirects to `/tracking/` in production) |
| `/tracking/` | English tracking page |
| `/fr/suivi/` | French tracking page |
