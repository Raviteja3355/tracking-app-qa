# SEO Audit — Tracking Portal

Source of truth for live tags: `curl -sL https://www.uniuni.com/tracking/` (fetched 2026-05-12).  
FR page: `curl -sL https://www.uniuni.com/fr/suivi/` (fetched 2026-05-12).

---

## EN Page (`/tracking/`) — Implementation Status

| Tag | Live WordPress | Current Implementation | Status |
|---|---|---|---|
| `<html lang>` | `en-CA` | `en-CA` | ✅ |
| `<title>` | `UniUni • Package Tracking` | `UniUni • Package Tracking` | ✅ |
| `meta description` | Track your package instantly… | same | ✅ |
| `link canonical` | `https://www.uniuni.com/tracking/` | `https://www.uniuni.com/tracking/` | ✅ |
| `meta robots` | `follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large` | same | ✅ |
| `link hreflang en` | `https://www.uniuni.com/tracking/` | same | ✅ |
| `link hreflang fr` | `https://www.uniuni.com/fr/suivi/` | same | ✅ |
| `og:locale` | `en_US` | `en_US` | ✅ |
| `og:type` | `article` | `article` | ✅ |
| `og:title` | `UniUni • Package Tracking` | same | ✅ |
| `og:description` | Track your package instantly… | same | ✅ |
| `og:url` | `https://www.uniuni.com/tracking/` | same | ✅ |
| `og:site_name` | `UniUni` | `UniUni` | ✅ |
| `og:image` | `https://cdn.uniuni.com/.../kid1.gif` | same | ✅ |
| `og:image:secure_url` | same as og:image | same | ✅ |
| `og:image:width` | `950` | `950` | ✅ |
| `og:image:height` | `644` | `644` | ✅ |
| `og:image:alt` | `UniUni – Kid with UniUni Package Delivery Tightly Cropped - Animated` | same | ✅ |
| `og:image:type` | `image/gif` | `image/gif` | ✅ |
| `og:updated_time` | `2026-04-13T17:55:14+00:00` | — | ⚠️ Skip — dynamic, WordPress-managed |
| `twitter:card` | `summary_large_image` | same | ✅ |
| `twitter:title` | `UniUni • Package Tracking` | same | ✅ |
| `twitter:description` | Track your package instantly… | same | ✅ |
| `twitter:image` | `https://cdn.uniuni.com/.../kid1.gif` | same | ✅ |
| `twitter:label1/data1` | `Time to read / 2 minutes` | — | ⚠️ Skip — WordPress/Yoast auto-generated |
| `meta theme-color` | `#FF9E46` | `#FF9E46` | ✅ |
| `meta msapplication-TileImage` | `.../270x270.png` | same | ✅ |
| `<html prefix="og:...">` | present | — | ⚠️ Skip — not required by OGP validators |

---

## FR Page (`/fr/suivi/`) — Implementation Status

| Tag | Live WordPress | Current Implementation | Status |
|---|---|---|---|
| `<html lang>` | `fr-CA` | `fr-CA` | ✅ |
| `<title>` | `UniUni • Suivi` | `UniUni • Suivi` | ✅ |
| `meta description` | Suivez votre package instantanément… | same | ✅ |
| `link canonical` | `https://www.uniuni.com/fr/suivi/` | same | ✅ |
| `meta robots` | `follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large` | same | ✅ |
| `link hreflang en` | `https://www.uniuni.com/tracking/` | same | ✅ |
| `link hreflang fr` | `https://www.uniuni.com/fr/suivi/` | same | ✅ |
| `og:locale` | `fr_CA` | `fr_CA` | ✅ |
| `og:type` | `article` | `article` | ✅ |
| `og:title` | `UniUni • Suivi` | same | ✅ |
| `og:description` | Suivez votre package… | same | ✅ |
| `og:url` | `https://www.uniuni.com/fr/suivi/` | same | ✅ |
| `og:image + all sub-fields` | same as EN | same | ✅ |
| `twitter:card/title/description/image` | FR variants | same | ✅ |
| `meta theme-color` | `#FF9E46` | `#FF9E46` | ✅ |
| `meta msapplication-TileImage` | `.../270x270.png` | same | ✅ |

---

## Implementation Notes

- Route split into two Next.js route groups:
  - `app/(en)/layout.tsx` → EN root layout (`lang="en-CA"`)
  - `app/(fr)/layout.tsx` → FR root layout (`lang="fr-CA"`)
- `themeColor` set via Next.js `Viewport` export (not `Metadata`) per App Router convention
- `msapplication-TileImage` set via `metadata.other` (no native Next.js field)
- `og:updated_time` intentionally omitted — it's a WordPress post modified date, has no equivalent in a static Next.js build

---

## How to Verify

### 1. Local — View Page Source

Start the dev server (`npm run dev`), then:

```
curl -s http://localhost:3000/tracking/ | grep -E "(<title|<meta |<link rel=|og:|twitter:)" | head -40
curl -s http://localhost:3000/fr/suivi/ | grep -E "(<title|<meta |<link rel=|og:|twitter:)" | head -40
```

Compare output line-by-line with the tables above.

### 2. Local — Browser DevTools

Open `http://localhost:3000/tracking/` → Right-click → **View Page Source** → `Ctrl+F` for `og:` or `robots`.

### 3. Production — diff against live WordPress

After deployment, run this diff to confirm the new portal matches the old one:

```bash
# EN
diff \
  <(curl -sL https://www.uniuni.com/tracking/ | grep -E "(<title|<meta |<link rel=.canonical|hreflang|og:|twitter:)") \
  <(curl -sL https://YOUR_NEW_PORTAL/tracking/ | grep -E "(<title|<meta |<link rel=.canonical|hreflang|og:|twitter:)")

# FR
diff \
  <(curl -sL https://www.uniuni.com/fr/suivi/ | grep -E "(<title|<meta |<link rel=.canonical|hreflang|og:|twitter:)") \
  <(curl -sL https://YOUR_NEW_PORTAL/fr/suivi/ | grep -E "(<title|<meta |<link rel=.canonical|hreflang|og:|twitter:)")
```

Zero diff = 100% match (excluding the 3 skipped WordPress-only tags).

### 4. Social sharing preview

Use these tools to preview how the page appears when shared:

| Tool | URL |
|---|---|
| Facebook / Meta | https://developers.facebook.com/tools/debug/ |
| Twitter / X Card | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| General OGP | https://www.opengraph.xyz/ |

Paste in the deployed URL and verify title, description, image all appear correctly.

### 5. Google Search Console

After go-live, submit both URLs in GSC → URL Inspection → check that canonical, hreflang, and indexing signals are read correctly by Googlebot.
