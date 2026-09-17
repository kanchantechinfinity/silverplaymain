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
| hero | `about-hero-soul-of-silver.jpg` (1370×1092) | `Screenshot_2026-05-20_at_1.11.35_PM` |
| founder | `founder-dalljiet-kaur.jpg` | `Dalljiet_Kaur_in_Silver` — already byte-identical, untouched |
| craft | `about-craft-karigars.jpg` (1448×1086) | `ChatGPT_Image_Jun_20_2026_06_07_08_PM` |
| values | `about-values-slow-making.jpg` (1080×1600) | `Rajsi_SP_Website_41ccae1d…` |
| closing | `about-closing-wear-your-story.jpg` (1080×1600) | `10_bd25934c…` |

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
`about-hero-soul-of-silver.jpg` is literally a **screenshot** (original filename
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

## Scroll-reveal engine — read before debugging "blank" pages
`theme.css:221` hides `[data-reveal]` / `[data-stagger]` / `[data-split]` at `opacity:0`
until `theme.js` adds `.is-in`. **A page that scrolls to full height but shows nothing is
almost always this, not missing data.** Check `getComputedStyle(el).opacity` first.
- `IntersectionObserver.intersectionRatio` is visible area ÷ **the element's own area**,
  so an element taller than ~6.7 viewports can never reach a 0.15 threshold. The engine
  now observes at `threshold: [0, 0.15]` and reveals anything taller than ~90vh as soon
  as it enters. Do not put the bare 0.15 threshold back.
- `layout/theme.liquid`'s inline script has a watchdog: 1.2s after `load`, if
  `window.__spRevealReady` is unset, it reveals everything. `initReveal()` sets that flag.
  This is the only thing standing between a `theme.js` failure and a blank storefront.
- The store has **two blogs**: nav JOURNAL points at `/blogs/news` (empty); articles are
  in `/blogs/journal`. Menu fix, not code.

## Banners / responsive art
- Desktop vs mobile artwork is done with `<picture>` + `media="(max-width: 767px)"` in
  `cinematic-hero.liquid` and `sections/banner.liquid`. Mobile falls back to the desktop
  image when empty. Do not reimplement this with CSS backgrounds or JS — the phone would
  fetch both crops.
- `cinematic-hero` has a **Hero media** select: `video` (default) or `image`. In image
  mode the `<video>` is not rendered at all.
- `sections/banner.liquid` is a reusable promo banner with a preset, used on the homepage
  after `fresh_edit`. Heights are separate per breakpoint via `--banner-h` / `--banner-h-m`.

## Product cards
- `.card` is a **flex column at `height: 100%`**, with `.card__frame` / `.card__body` at
  `flex: 1 1 auto` and `.card__buy` at `margin-top: auto`. That is what keeps tiles equal
  height when some have a compare-at price or a rating row and others don't. Don't put a
  fixed `margin-top` back on `.card__buy` — that is exactly what knocked the heritage
  variant 8px out of line.
- `.card__price` carries `margin-bottom` to guarantee the gap above the button, since the
  button's own margin is now `auto`.
- The discount/sold-out `seal` is full size on the product page; on tiles it is scoped
  down via `.card__badge` (2rem, 2.25rem ≥1024px). Change `.card__badge`, never `.seal`,
  or the PDP badge shrinks too.

## Responsive / mobile
- Below 1024px the header is **logo left + menu toggle right**; the icon cluster moves to
  `.mbar`, a sticky bottom bar (Offers / Wishlist / Search / Bag) in `header.liquid`.
  It reuses `data-search-open` / `data-cart-open`, and its `data-cart-count` badge is kept
  in sync automatically because theme.js updates *every* match.
- `body` carries bottom padding below 1024px so `.mbar` never covers page end or drawers.
- The logo's base rule is `position: absolute; left: 50%`. Any attempt to reorder it with
  flex `order` **must** reset it to `position: static` first, or nothing happens.
- `.mobile-nav__list` is `nav > ul > li > a` — selectors must not assume `li` is a direct
  child. A `> li` selector silently leaves every link unstyled and unreadable.
- `.tabs__inner`: below 640px the capsule is **dropped** and pills wrap with their own
  borders; at ≥640px the single capsule returns. Two earlier attempts failed — wrapping
  inside the capsule looks like a blob, and scrolling the rail hides tabs.
- `.line__rope` must live inside `.line__track` (`width: max-content`) so it spans the
  scrolled width, not the visible width.
- `.faq__btn` is `align-items: flex-start` — `center` drags the number and arrow into the
  middle of an expanded answer.

## Images / performance
- **Shopify CDN auto-serves WebP** by `Accept` header (verified: a 2388 KB PNG arrives as
  228 KB WebP). Raw file sizes overstate delivery ~10× — measure with a browser UA/Accept
  before claiming a byte win. What the CDN does *not* fix is **dimensions**.
- On raw `cdn.shopify.com` image URLs, the **`_NNNx` filename suffix resizes; `?width=` is
  ignored**. Verified both. `snippets/stone-image.liquid` hardcodes 24 stone URLs at
  `_3840x`; `stone-explorer.liquid` rewrites that per use (`_400x` grid, `_920x` panel).
- `.stones__panel` is `display: none` when inactive, so only the active panel's image
  loads — don't assume all 24 panels download.
- **Photographs in `assets/` must be JPEG, never PNG.** The theme shipped 31.6 MB of
  photographic PNGs (a 600×600 tile was 1.78 MB); re-encoding to progressive JPEG cut
  images to 5.68 MB (−82%) with no dimension change. Only `logo-full.png` and
  `logo-mark.png` have real transparency and must stay PNG.
- Check PSNR against the original before accepting a conversion: aim >37 dB, re-encode
  at q92 if lower. q82 was too aggressive for flat/graphic-heavy tiles.
- `heritage-bg` is rendered by **10 sections**, so its fallback asset is on nearly every
  page — keep it small.
- `.meganav` hides with `opacity: 0`, not `display: none`, so anything inside it still
  loads. Its promo video needs `preload="none"` or it costs 1.29 MB on every page load.
- **Still open:** theme assets go out via `asset_url` = original size, no WebP. Moving to
  `image_url: width:` / `asset_img_url` + `srcset` is the next big win, but needs
  verifying against a real store first — a wrong filter breaks every image.

## Product page (PDP)
- The reference PDP gallery is a **crossfade stage + thumb rail**, not a scrolling image
  column — the theme already matches it structurally. Don't "fix" it into a scroller.
- `.pdp__media` is `position: sticky; top: 8rem` at ≥768px with `.pdp__grid`
  `align-items: start` — verified pinning at 128px. The pin is only *visible* when the
  buy-box column is taller than the gallery.
- `initGallery()` supports thumbnail click, horizontal swipe/drag (40px threshold,
  horizontal-dominant only) and Left/Right arrows. `touch-action: pan-y` on the stage
  preserves vertical page scroll.

## Measuring scroll behaviour in this theme — two traps
- `html { scroll-behavior: smooth }`: `window.scrollTo()` is **not** synchronous. Set
  `document.documentElement.style.scrollBehavior='auto'` and wait two rAFs before
  reading positions, or every sample comes back at the old scroll offset.
- `body { overflow-x: hidden }` is present but **does not** break sticky here, because
  `html` declares no `overflow`, so the value propagates to the viewport. Don't chase it.

## Search
- Search is a **drawer**, not a page-first flow: `snippets/search-drawer.liquid`, mounted
  in `layout/theme.liquid`, opened by `[data-search-open]` on the header icon.
- It intentionally reuses the cart drawer's shell (`cart-drawer__head` / `__foot`) and the
  same `.is-open` mechanics, so restyling one should usually restyle the other.
- Results come from `/search/suggest.json` (`initSearchDrawer()` in theme.js), debounced
  220ms, `AbortController` cancels in-flight requests, prices via the theme's `money()`.
- `/search` still exists and is the no-JS fallback — the trigger keeps its `href`. Do not
  replace it with a button.
- **`money(cents)` always divides its input by 100** (`theme.js:15`). `suggest.json`'s
  `product.price` is a **decimal rupee string** (`"24999.00"`), not cents — feeding it
  straight in (or via `parseInt`) silently shows prices ~100x too low. Always
  `Math.round(parseFloat(p.price) * 100)` before calling `money()` on anything sourced
  from the predictive-search endpoint. Fixed 2026-09-17 in `initSearchDrawer`'s `render()`.

## Mega nav / dropdown hover behaviour
- Reference behaviour (matched to vamas.in): hover opens, moving the cursor from the
  trigger into the panel keeps it open, click also opens (never toggles closed on a
  second click), and it closes ~200ms after the cursor leaves both trigger and panel —
  outside click or Escape close it immediately.
- **Plain CSS `:hover` has no grace period.** It unmatches the instant the pointer
  leaves the item's own rendered box, which happens when crossing the real-world gap
  between the trigger link and the panel below it — closing the menu before the cursor
  arrives, even though the panel is a DOM descendant (CSS `:hover` containment doesn't
  help once the cursor is genuinely outside the box mid-transit). Fix: drive **both**
  hover and click through the same JS `is-open` class + `mouseenter`/`mouseleave` timer,
  don't rely on `:hover` alone for anything gap-tolerant. `assets/theme.js:158-201`.

## Deploy pipeline — GitHub ⇄ Shopify sync (⚠ read before debugging "my fix didn't work")
- Two independent directions exist: Shopify admin "Edit code" edits **auto-commit back
  to GitHub** (`shopify[bot]`, this direction has stayed reliable), and pushes to
  `main` are **supposed to** auto-deploy to the live theme via a GitHub webhook — this
  direction stalled silently for an extended stretch on 2026-09-17 (confirmed: live
  `theme.js`/`theme.css` byte-identical across several real pushed commits).
- **If the user reports "I did the change / nothing changed" after a real code fix,
  suspect the sync before suspecting the code.** Check: Shopify Admin → Online Store →
  Themes → "⋯" → Edit code → open the file directly and search for a distinctive new
  string; or GitHub repo Settings → Webhooks for failed deliveries; or just
  disconnect/reconnect the theme's GitHub connection in Admin to force a fresh pull.
- **CDN-fetch verification is unreliable** — even `fetch(url + '?cb=' + Date.now(),
  {cache:'no-store'})` against the *unversioned* asset path
  (`/cdn/shop/t/<n>/assets/theme.css`, no `?v=` fingerprint) has returned stale/frozen
  content repeatedly in this project. Don't trust byte-length/string checks against that
  URL as the final word — a live screenshot or the Admin code editor is ground truth.

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
