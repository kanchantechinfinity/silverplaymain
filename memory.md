# memory.md — silverplaymain (Silver Play Shopify theme)

## Repo
- Remote: https://github.com/kanchantechinfinity/silverplaymain.git
- Local clone: `C:\Users\kanch\OneDrive\Desktop\silverplay\silverplaymain`
- Branch: `main` @ `bf1f7b5` (47 commits, 2026-09-09 → 2026-09-11)
- Authors: `kastle3003` (all human commits) + `shopify[bot]` (theme sync, 19b7cd7)
- Sibling repos in `Desktop\silverplay\` — do not mix:
  - `silverplaycollectionpage` (Ganpati landing page, GitHub Pages)
  - `silverplayproject` (separate)
  - parent `Desktop` is itself a repo → `kanchan12285/kanchan-profile`

## What this is
A **Shopify theme** (Liquid + JSON templates). No build step, no package.json.
Deployed via Shopify theme sync (`shopify[bot]` commits appear when edited in
Shopify admin / Edit Code). Design is a port of a **Vercel reference site** —
many commits say "match the Vercel reference exactly".

## Structure
| Dir | Contents |
|---|---|
| `layout/` | `theme.liquid` (Cinzel / Cinzel Decorative / Cormorant Garamond / Tiro Devanagari fonts, `window.SilverPlay` routes bootstrap), `password.liquid` |
| `sections/` | 37 sections — homepage, product, collection, blog, cart, account |
| `snippets/` | 18 partials — `product-card`, `mega-nav`, `collection-tile`, `occasion-card`, `heritage-bg`, `cart-drawer`, `facets`, `price`, `stars`, `seal` |
| `templates/` | JSON templates + `customers/` liquid templates + `product.card.liquid`, `product.quickview.liquid` |
| `assets/` | `theme.css` (1305 lines), `theme.js` (839 lines), 3 MP4s, ~30 images (heavy — several >1.5 MB PNGs) |
| `config/` | `settings_schema.json`, `settings_data.json` |
| `locales/` | `en.default.json` |

## Homepage section order (`templates/index.json`)
1. `cinematic-hero` — scroll-scrubbed video (`silverplay-cinematic.mp4`) with chapter blocks (range_start/range_end)
2. `assurance-bar`
3. `fresh-edit`
4. `scroll-deck` — "Her Royal Simplicity" (dark mandala bg)
5. `featured-collection` — Best Sellers
6. `archive-treasure` — "Archive Silver Treasure", 6 tiles
7. `circle-picks`
8. `shop-by-occasion` — flexbox bento (was CSS grid)
9. `instagram-slider` — "As Seen & Loved"
10. `founder` — Dalljiet Kaur photo + bio
11. `edit-with-video` — "Effortless Elegance" (`effortless-elegance.mp4`)
12. `testimonials`
13. `journal-arc` — 3D sticky-scroll blog ring
14. `faq`

## Hard-won gotchas (from commit history — read before editing)
- **Liquid**: a piped filter expression is **not allowed inside an `if` condition** (135eb95) and **not allowed inside bracket-index** (bf1f7b5). Assign to a var first.
- **Founder photo height**: use an absolute-fill `<img>`; a normal img creates an intrinsic-ratio feedback loop that collapses/expands the box (7275fed, bf1f7b5).
- **CSS grid height chains fail here** — Shop By Occasion was switched to flexbox for the same reason (cb2bf14, 19c45a1).
- **`position:sticky` breaks under an ancestor with `overflow:hidden`** — `heritage-sec`'s overflow clipped the Journal Arc's 409vh track (9e32c77).
- **Journal Arc scroll track height** = `(article_count + 0.6) * 62vh` (cf061e6). Too tall ⇒ blank space; this was iterated 6+ times.
- **Blog handle may mismatch** — journal-arc auto-detects the correct blog (438e95a).
- **Scroll-reveal / `data-stagger` was deliberately removed** from all sections and all product grids (a3be0f3, ddb376c). Don't reintroduce.
- **Collection tiles rendering "invisible, not missing"** was a real bug class (b529dc0, 2748d0c) — check opacity/reveal CSS before assuming data is missing.
- Product page: **Buy Now and Add to Cart sit side by side, Buy Now first** (bf65518).
- Product cards have a **parchment "mat" padding around the image, straight edges, no deckle**, with the border wrapping image + title + price + button as one unit (0023def, e83b3ba).
- Assets are **bundled locally for portability** rather than hot-linked (3e18459 bundled the mega-nav promo video).

## About page (`templates/page.about.json`)
Order: `about-hero` → `founder` → `text-with-image` (craft) → `vision-cards` →
`text-with-image` (values) → `testimonials` → `text-with-image` (closing).

Images are **local theme assets**, not Shopify-uploaded files, selected per section
via an `image_asset` text setting (same convention as `occasion-card` / `heritage-bg`).
Precedence in both `about-hero.liquid` and `text-with-image.liquid`:
merchant `image_picker` → `image_asset` theme asset → hardcoded stock fallback.

| Section | Asset | Source on the Vercel reference |
|---|---|---|
| hero | `about-hero-soul-of-silver.png` (1370×1092) | `Screenshot_2026-05-20_at_1.11.35_PM` |
| founder | `founder-dalljiet-kaur.jpg` | `Dalljiet_Kaur_in_Silver` — already byte-identical, untouched |
| craft | `about-craft-karigars.png` (1448×1086) | `ChatGPT_Image_Jun_20_2026_06_07_08_PM` |
| values | `about-values-slow-making.png` (1080×1600) | `Rajsi_SP_Website_41ccae1d…` |
| closing | `about-closing-wear-your-story.png` (1080×1600) | `10_bd25934c…` |

**All About images are bundled theme assets** — nothing points at a Shopify CDN or a
store-specific file, so the theme drops into another store unchanged.

### Height matching (the founder pattern)
`.split-row__media` now uses the exact mechanism as `.founder__photo` (commit bf1f7b5):
the reveal wrapper is `align-self:stretch; display:flex`, the media box is
`height:auto`, and the `<img>` is `position:absolute; inset:0`. The absolute-fill img
contributes **no intrinsic height**, which is what breaks the ratio feedback loop —
a normal-flow `height:100%` img cannot resolve against a content-sized grid row.
Result: each image box is exactly as tall as the text column beside it.

### Focal points (`image_focus`)
`about-hero` and `text-with-image` take an `image_focus` string written straight into
`style="object-position:…"`, set per section in `page.about.json`:

| Section | Focus | Keeps in frame |
|---|---|---|
| hero | `50% 8%` | both faces; also crops most of the watermark (see below) |
| craft | `70% 36%` | the karigar's hands + the piece being engraved (**no face in this image**) |
| values | `28% 10%` | the model's face (top-left of the frame) |
| closing | `50% 26%` | the man's and woman's faces |

Verified geometrically against 6 box shapes (desktop, very short, short, long text,
mobile 4:5, tablet): 23/24 subject boxes stay fully in frame. The miss is `craft` at a
4:1 box, where the subject region is taller than the crop window — geometrically
impossible, and the real text is far too long to produce that shape.

### ⚠ Known issue — hero image provenance
`about-hero-soul-of-silver.png` is literally a **screenshot** (original filename
`Screenshot_2026-05-20_at_1.11.35_PM`) of a **British Library** archival photograph.
It still contains the red *British Library* badge and two browser UI buttons in the
bottom-right. `50% 8%` crops them out on typical desktop viewports, but on tall/narrow
viewports the full image is shown and they reappear. Proper fix is to crop the asset
(and check reuse rights). Inherited from the Vercel reference, not introduced here.

- Reference page: https://silverplayproject.vercel.app/about — its images are served
  from the **live Shopify CDN** (`silverplay.in/cdn/shop/files/...`). Append
  `_3840x` before the extension to pull the master; Shopify caps at the true size.
- `text-with-image.liquid` is used **only** by the About page, by three sections at
  once — which is why the shared hardcoded fallback made all three identical.
- Both image slots are `object-fit: cover`, so landscape masters (hero, craft) crop
  cleanly into portrait/wide boxes. `.about-hero__media img` also has
  `object-position: 50% 18%` and `opacity: .8` under a gradient scrim.
- `manuscript-panels.jpg` (213 KB) is now **orphaned** — was the old about-hero fallback.
- Assets folder is ~37 MB. Shopify's theme-zip limit is 50 MB — watch this when adding
  more full-res PNGs.

## Journal / blog
- **The theme side is complete** — `main-blog.liquid` (grid + tag chips + pagination),
  `main-article.liquid`, `.journal__grid` / `.jcard` CSS all already match the reference.
  If the Journal looks empty, it is **store data, not the theme**.
- Shopify blog posts are store data. The theme repo syncs only assets/config/layout/
  locales/sections/snippets/templates — **articles can never be created by a git push.**
- The dev store's blog is titled **News** (Shopify default). `main-blog.liquid` prints
  `blog.title`, so the "News" heading is fixed by renaming the blog in admin, not in code.
- Filter chips come from `blog.all_tags`, so tag spelling must match exactly across posts.
- `journal-arc` (homepage) already falls back to the first blog that has articles, so it
  survives a blog-handle mismatch.
- The five real articles live in `journal-content/` — JSON, paste-ready HTML, hero images
  and a Matrixify CSV, with three import routes in its README. Shopify ignores that folder.

## Local dev
- No Shopify CLI installed → the theme cannot be rendered locally as Liquid.
  To eyeball CSS/images, serve the repo statically and hand-write a harness page
  that uses the real `assets/theme.css` class names.
- `Desktop\silverplay\.claude\launch.json` has servers `silverplay-collection`
  (port 5173) and `silverplayproject` (port 3000 — **the Vercel reference site's
  source**, useful for exact side-by-side comparison).
- Preview tooling resolves `launch.json` from `Desktop\silverplay`, not from this repo.

## Conventions
- Reference for visual fidelity = the **Vercel site**; when in doubt, match it exactly.
- Real content over placeholders — several commits replaced stock/placeholder images and generic text with real brand photography and real imported collections (f524482, 35bc03f, fb0017a, fc6b833).
- Fixes are committed one concern at a time with a descriptive message naming the root cause.
