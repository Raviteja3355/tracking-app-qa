# SEO Audit — Tracking Portal

Comparison of: live WordPress page → PRD requirements → current Next.js implementation.

Source of truth for live tags: `curl -sL https://www.uniuni.com/tracking/` (fetched 2026-05-12).

---

## EN Page (`/tracking/`)

| Tag | Live WordPress | PRD Requirement | Current Implementation | Status |
|---|---|---|---|---|
| `<html lang>` | `en-CA` | — | `en` | ❌ Wrong locale |
| `<html prefix>` | `og: https://ogp.me/ns#` | — | missing | ⚠️ Low priority |
| `<title>` | `UniUni • Package Tracking` | `UniUni • Package Tracking` | `UniUni • Package Tracking` | ✅ |
| `meta description` | Track your package instantly… | Track your package instantly… | ✅ same | ✅ |
| `link canonical` | `https://www.uniuni.com/tracking/` | `https://www.uniuni.com/tracking/` | `https://www.uniuni.com/tracking/` | ✅ |
| `meta robots` | `follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large` | `follow, index, max-snippet:-1, max-image-preview:large` | missing `max-video-preview:-1` | ❌ |
| `link hreflang en` | `https://www.uniuni.com/tracking/` | `https://www.uniuni.com/tracking/` | ✅ | ✅ |
| `link hreflang fr` | `https://www.uniuni.com/fr/suivi/` | `https://www.uniuni.com/fr/suivi/` | ✅ | ✅ |
| `og:locale` | `en_US` | — | missing | ❌ |
| `og:type` | `article` | — | missing | ❌ |
| `og:title` | `UniUni • Package Tracking` | — | ✅ | ✅ |
| `og:description` | Track your package instantly… | — | ✅ | ✅ |
| `og:url` | `https://www.uniuni.com/tracking/` | — | missing | ❌ |
| `og:site_name` | `UniUni` | — | ✅ | ✅ |
| `og:image` (URL) | `https://cdn.uniuni.com/wp-content/uploads/2023/06/kid1.gif` | same | ✅ | ✅ |
| `og:image:secure_url` | same as above | — | missing | ❌ |
| `og:image:width` | `950` | — | missing | ❌ |
| `og:image:height` | `644` | — | missing | ❌ |
| `og:image:alt` | `UniUni – Kid with UniUni Package Delivery Tightly Cropped - Animated` | — | missing | ❌ |
| `og:image:type` | `image/gif` | — | missing | ❌ |
| `og:updated_time` | `2026-04-13T17:55:14+00:00` | — | missing | ⚠️ Skip (dynamic, WP-generated) |
| `twitter:card` | `summary_large_image` | — | ✅ | ✅ |
| `twitter:title` | `UniUni • Package Tracking` | — | ✅ | ✅ |
| `twitter:description` | Track your package instantly… | — | ✅ | ✅ |
| `twitter:image` | `https://cdn.uniuni.com/.../kid1.gif` | — | ✅ | ✅ |
| `twitter:label1` | `Time to read` | — | missing | ⚠️ Skip (WP auto-generated) |
| `twitter:data1` | `2 minutes` | — | missing | ⚠️ Skip (WP auto-generated) |
| `meta theme-color` | `#FF9E46` | — | missing | ❌ |
| `meta msapplication-TileImage` | `.../270x270.png` | — | missing | ❌ |

---

## FR Page (`/fr/suivi/`)

Not fetched yet. Assumed to mirror EN with:
- `<html lang="fr-CA">`
- `og:locale` → `fr_CA`
- Possibly French title/description (TBD — fetch to confirm)

**Problem:** Next.js root layout (`app/layout.tsx`) renders the `<html>` tag for all routes.
Nested layouts cannot override it. To get `lang="fr-CA"` on the FR page, a separate root-level
layout is needed at `app/fr/layout.tsx`.

---

## Summary — What Needs to Be Done

### High priority (affects SEO)
1. `<html lang="en-CA">` — fix in `app/layout.tsx`
2. `meta robots` — add `max-video-preview:-1`
3. `og:locale` — add `en_US`
4. `og:type` — add `article`
5. `og:url` — add explicit URL
6. `og:image` full spec — add `width`, `height`, `alt`, `type`, `secure_url`
7. `meta theme-color` — add `#FF9E46`

### Medium priority (social sharing / completeness)
8. `meta msapplication-TileImage` — add favicon tile
9. FR page metadata — separate layout at `app/fr/layout.tsx` with `lang="fr-CA"` and FR og:locale

### Skip (WordPress auto-generated, not reproducible)
- `og:updated_time` — dynamic, WordPress-managed
- `twitter:label1` / `twitter:data1` — auto-injected by WordPress Yoast/SEOPress
- `<html prefix="og: ...">` — OGP namespace declaration; not required by validators

---

## Files to Edit

| File | Change |
|---|---|
| `app/layout.tsx` | Fix `lang`, robots, og:locale/type/url/image details, theme-color, msapplication-TileImage |
| `app/fr/layout.tsx` | New file — FR root layout with `lang="fr-CA"` and FR metadata |
