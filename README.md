# UniUni Tracking Page

Standalone package tracking page for [uniuni.com/tracking/](https://www.uniuni.com/tracking/) and [uniuni.com/fr/suivi/](https://www.uniuni.com/fr/suivi/). Built as a static site (Next.js `output: 'export'`) served by Nginx on AWS EKS behind CloudFront, completely decoupled from the main WordPress infrastructure.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
```

Copy `.env.local` from a teammate or 1Password — the app won't call any APIs without it.

Required env variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DELIVERY_API` | Main tracking API |
| `NEXT_PUBLIC_DISPATCH_API` | Dispatch / map API |
| `NEXT_PUBLIC_DRIVER_APP_CA` / `_US` | Driver app API (notices, POD) |
| `NEXT_PUBLIC_EDD_API_URL` + `_KEY` | Estimated delivery date |
| `NEXT_PUBLIC_TRACKING_API_KEY` | Auth key for tracking API |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (optional) |
| `NEXT_PUBLIC_HUBSPOT_ID` | HubSpot (optional) |
| `NEXT_PUBLIC_INTERCOM_APP_ID` | Intercom widget (optional) |

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
└── globals.css    Tailwind v4 theme tokens

components/
├── layout/        Structural shell: SharedLayout, Header, Footer
├── sections/      Page content blocks: FAQ, CustomerSupport, TrackingHero, CookieBanner
├── tracking/      Tracking feature: input, results, modals
├── scripts/       Third-party script injections: Analytics (GTM), Intercom, Clarity
├── icons/         SVG icon components
└── ui/            Generic reusable primitives

lib/
├── api/           API call functions
├── context/       TrackingContext — shared state for deep components
├── hooks/         useTracking, usePod
├── i18n/          Translation JSON files
├── types/         Shared TypeScript types
└── utils/         formatTime, validation, etc.

docs/
└── ARCHITECTURE.md   Explains SSG, i18n strategy, hydration decisions
```

## Component tree

Page load renders the following tree. Components without `"use client"` are Server Components (no interactivity, no hooks). The tracking feature subtree is entirely Client Components.

```
app/(en)/tracking/page.tsx          ← Server Component
└── TrackingHero                    ← locale prop (en | fr)
    └── TrackingApp                 ← owns all tracking state via useTracking + usePod
        │
        ├── [TrackingProvider]      ← React Context, provides: eddMap · onViewPod · onDownloadPod · onOpenPiecesView
        │
        ├── TrackingInput           props: locale · value · onChange · onTrack · alert flags
        │
        ├── TrackingResults         props: validResults · invalidTnos · exportRows · openDetails · piecesView · resultsRef · onToggleDetail · onClosePiecesView
        │   └── ParcelCard (×N)     props: result · index · isFirst · isOpen · collapsible · onToggle
        │       └── ResultCard      props: result · index
        │                           context: eddMap (looks up own tno) · onViewPod
        │
        ├── ZipModal                props: open · errorMessage · onVerify · onClose
        └── PodModal                props: pod · validResults · onClose · onPrev · onNext · onDownloadCurrent · onDownloadAll
```

### Props vs Context

| What | How | Why |
|------|-----|-----|
| `eddMap` | Context | ResultCard is 4 levels deep; intermediate components don't use it |
| `onViewPod` | Context | Same — defined in TrackingApp, called in ResultCard button |
| `onDownloadPod` | Context | Same |
| `onOpenPiecesView` | Context | Defined in TrackingApp, called in ParcelCard; TrackingResults doesn't use it |
| `openDetails` / `onToggleDetail` | Props (TrackingResults → ParcelCard) | TrackingResults transforms them: extracts per-card `isOpen` and creates `onToggle` closure — not pass-through |
| `locale` | Prop (page → TrackingHero → TrackingApp → TrackingInput) | Manual JSON lookup avoids hydration mismatch with SSR; only TrackingInput needs it |
| Everything else | Props (1 level) | Direct parent → child, no drilling |

## Adding a translation key

1. Add the key to `lib/i18n/locales/en.json` and `fr.json`
2. For **above-fold components** (Header, Footer, FAQ, TrackingInput): access via `t['yourKey']` — the locale prop is already threaded through
3. For **interactive components** (ResultCard, modals, etc.): use `useTranslation()` as usual

## Routes

| URL | Page |
|---|---|
| `/` | English tracking page (redirects to `/tracking/` in production) |
| `/tracking/` | English tracking page |
| `/fr/suivi/` | French tracking page |
