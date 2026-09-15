# Build Log — silverplaymain

## 2026-09-16 (b) — Uniform product cards, smaller corner discount seal

### Cards were not uniform
`.card` was `display: block`, so each tile was only as tall as its own content. A tile
with a compare-at price carries an extra strikethrough line, and one with a rating
carries another — so neighbours in the same row ended at different heights and their
Buy buttons sat at different y positions.

Fixed by making the card stretch to its grid row and pushing the button to the bottom:
`.card` → flex column, `height: 100%`; `.card__frame` and `.card__body` →
`flex: 1 1 auto`; `.card__buy` → `margin-top: auto`, with `.card__price` carrying a
`margin-bottom` so there is always a gap above the button whether the card is full or
sparse.

`.card--heritage .card__buy` had its own fixed `margin-top: 1rem`, which overrode the
auto and left the heritage variant's buttons 8px out of line — caught in testing and
also switched to `auto`.

### Discount seal
`.seal__inner` is 2.75rem, sized for the product page. On a tile that is a medallion
competing with the photograph. The badge is now scoped down to **2rem (2.25rem ≥1024px)**
with proportionally smaller type, a lighter shadow, and tucked to `.5rem` from the
corner. Scoped to `.card__badge`, so the product page and quick-view seals keep their
original size.

### Verification (real theme.css)
| | 375px | 1280px |
|---|---|---|
| gilt cards, same width | yes (166) | yes (294) |
| gilt cards, same height | yes (353) | yes (491) |
| Buy buttons aligned | yes | yes |
| heritage same height / aligned | — | yes (507) / yes |

Tested with a deliberately mixed grid — sale + strikethrough, no-sale, sold-out, rating
row, long and short titles — which is what produced the ragged heights originally.
Badge measures 35px (27% of the image) at 375px and 40px (15%) at 1280px, against 44px
before.

---

## 2026-09-16 — Responsive pass: 7 mobile fixes

### 1. Mobile menu was invisible — a selector that never matched
The markup is `nav.mobile-nav__list > ul > li > a`, but the CSS targeted
`.mobile-nav__list > li > a`. `li` is a **grandchild**, so the rule never applied and
every link fell back to browser defaults — 16px dark-blue text on a near-black panel.
Nothing was broken in the JS; the links were simply unreadable. Selectors now match the
real nesting, the `ul` carries the flex column, and the list is padded clear of the
close button. Verified: 9 links, 27.2px display type, `rgb(242,232,208)`.

### 2. Filter pills wrapped inside a pill-shaped container
`.tabs__inner` had `flex-wrap: wrap` plus `border-radius: 999px`, so a second row turned
the capsule into a blob with "Pendants" stranded underneath. Now a single non-wrapping
row that scrolls horizontally, with tighter padding on small screens and centring
restored at ≥640px. Snap alignment is `start`, not `center` — `center` made the browser
snap on load and clip "New Arrivals" (caught in testing).

### 3. Rope ran out when the notes scrolled
`.line__rope` was `inset-inline: 0` inside the scroll container, so it spanned the
**visible** width while `.line__row` is `width: max-content` and scrolls — past the first
screen the notes hung from nothing. Added `.line__track` (`width: max-content;
min-width: 100%`) wrapping rope and row together. Verified at 375px: rope 944px = full
track width, content genuinely wider than the 375px viewport.

### 4. FAQ number and arrow floated mid-answer
`.faq__btn` was `align-items: center`, so opening a row re-centred the number and the
toggle against the **whole expanded answer** instead of the question. Now
`align-items: flex-start` with a small top offset on the number and a slightly smaller
toggle. Verified: number top 902px vs question top 902px, toggle 900px.

### 5–7. Mobile action bar + header reflow
New `.mbar` — a sticky bottom bar below 1024px: **Offers / Wishlist / Search / Bag**.
It reuses the existing `data-search-open` and `data-cart-open` hooks rather than
duplicating behaviour, and its badge carries `data-cart-count`, which `theme.js` already
updates via `$$(...).forEach`, so both badges stay in sync with no JS change.
`env(safe-area-inset-bottom)` keeps it clear of the iOS home indicator, and `body` gains
matching bottom padding so the bar never covers the end of the page or the drawers.

With the icon cluster hidden below 1024px, the top bar is now **logo left, menu toggle
right**. That needed more than `order`: the base rule positions the logo
`absolute; left: 50%`, so it sat outside flex flow and `order` did nothing — the mobile
block returns it to `position: static` first.

### Verification (375×812, real theme.css/theme.js)
Menu 9 links visible · pills one row, first fully visible · rope spans full track · FAQ
number/arrow aligned to question · bar pinned to viewport bottom with badge · logo at
35px, burger right at 341px.

**Desktop regression at 1280px:** bottom bar hidden, header actions visible, logo static,
body padding 0, tabs centred, burger and mobile nav hidden. No desktop change.

---

## 2026-09-15 (b) — Stone guide: 3840px images for 400px slots

Rebased onto seven incoming commits from `kanchan12285` (cinematic hero, scroll deck,
and `snippets/stone-image.liquid`). Conflicts in `scroll-deck.liquid` and
`stone-explorer.liquid` were theirs-substantive vs mine-mechanical, so their versions
were taken and the asset renames + `decoding="async"` re-applied on top. Both sides
verified intact afterwards.

### The stone guide problem
`snippets/stone-image.liquid` hardcodes 24 stone photos as raw Shopify CDN URLs, all
ending **`_3840x`** — 3840-pixel-wide masters. The same URL feeds both the **400px
thumbnail grid** and the **920px detail panel**. Because these are raw URL strings, they
bypass the `image_url: width:` resizing that the theme-editor images beside them get.

### Measured, including a trap
Shopify honours the `_NNNx` suffix on these URLs but **ignores `?width=`** — tested both:
`&width=400` returned the full 2388 KB, the suffix returned 268 KB. Using the documented
`width` param would have silently done nothing.

Also measured with a real browser `Accept` header, which changes the picture: the CDN
auto-converts to WebP, so raw PNG byte counts overstate delivery by ~10×.

| variant | as PNG | what a browser gets |
|---|---|---|
| `_3840x` (was) | 2388 KB | 228 KB |
| `_920x` (panel) | 1355 KB | 159 KB |
| `_400x` (thumb) | 268 KB | **44 KB** |

All 24 URLs verified to return 200 at both new sizes.

### Fix
`stone-explorer.liquid` now rewrites the suffix per use — `_400x` for the thumbnail grid,
`_920x` for the detail panel — via `replace`, covering both `_3840x` and the one
`_1080x` URL.

Inactive panels are `display: none`, so only the active panel's image loads. Real page
cost: **24 thumbs + 1 panel ≈ 5.7 MB → ≈ 1.2 MB (−79%)**.

---

## 2026-09-15 — Site speed: 82% off image weight

**Reported:** stone guide images, and the whole site, load slowly.

### Root cause
`assets/` was **36.65 MB**, of which **31.64 MB was images** — and every one of the
heavy files was a **photograph saved as PNG**. PNG is lossless and has no business
holding photography: `meganav-rakhi.png` was 1.78 MB for a 600×600 tile.

Checked all 23 PNGs for real transparency: only the two logos had any. The other 21
were fully opaque, so nothing was gained by the format — only weight.

Worse, `heritage-mandala-corner.png` (2.23 MB) is the `heritage-bg` fallback for four
homepage sections, and **10 sections** render `heritage-bg` in total, so the heaviest
files were on the most-visited pages.

### What was done
1. **Re-encoded 20 opaque PNGs as progressive JPEG.** Dimensions unchanged, so there is
   no loss of sharpness from downscaling — only the format changed.
2. **Deleted `heritage-peacock-garden.png` (2.75 MB)** — orphaned, zero references
   anywhere in the repo since `b5afb9e` reverted the Shop By Occasion background. It is
   still in git history if it is ever wanted back.
3. **Deferred two autoplaying videos.** `.meganav` is hidden with `opacity: 0`, not
   `display: none`, so its promo video sat in the render tree and pulled **1.29 MB on
   every page load** for a panel most visitors never open. Both bundled videos now carry
   `preload="none"`, and the Effortless Elegance video gained a `poster` (it had none).
4. **`decoding="async"` on all 56 lazy images** across 27 files, so image decode stops
   competing with the main thread.

### Results
| | before | after | |
|---|---|---|---|
| `assets/` total | 36.65 MB | **10.69 MB** | −71% |
| images only | 31.64 MB | **5.68 MB** | −**82%** |
| video (unchanged, now deferred) | 4.87 MB | 4.87 MB | — |

Worst offenders: `meganav-rakhi` 1.78 MB → 104 KB, `heritage-mandala-corner`
2.23 MB → 284 KB, `about-craft-karigars` 2.03 MB → 195 KB.

### Quality verified, not assumed
Measured PSNR of every converted file against the original PNG from git. Seven came in
under 37 dB, so those were **re-encoded at q92** rather than shipped: all now sit at
37.6–45.2 dB (>40 dB is visually indistinguishable; >35 dB is good). The most
aggressively compressed file, `meganav-rakhi`, was also inspected by eye — gradients
smooth, engraved logo crisp, no artefacts.

All 32 asset references across `.liquid` and `.json` were rewritten and then verified to
resolve to a file that exists on disk.

### Not done — deliberately
Theme-asset images are still served through `asset_url`, which returns the **original
file at full size with no resizing** — 22 references do this and none use a resizing
filter. (Correction to an earlier draft of this entry: Shopify's CDN *does* negotiate
WebP by `Accept` header, verified below, so raw byte counts overstate what browsers
actually download. Dimension is still un-negotiated, which is the part that matters.) Routing them through Shopify's image CDN
(`image_url: width:` / `asset_img_url`) plus `srcset` would cut delivered bytes again,
especially on mobile. I did not ship it because the exact filter behaviour for theme
assets cannot be verified without a store, and getting it wrong breaks every image on
the site. Worth doing as a follow-up against a live preview.

---

## 2026-09-13 (f) — Product gallery: swipe / drag / keyboard ("image scroll")

### What the reference actually does
Read the DOM of the reference PDP. Its gallery is **structurally identical to the
theme's already**: `flex flex-col gap-4 sm:flex-row-reverse sm:gap-5` →
`aspect-square w-full … p-[3px] sm:flex-1` → stage → `absolute inset-0` slides. It is a
crossfade stage with a thumbnail rail, not a scrolling column of images. Its media
column sits in a `md:sticky md:top-32` wrapper.

### Sticky was already correct — measured, not assumed
`theme.css` already had `.pdp__grid { align-items: start }` and
`.pdp__media { position: sticky; top: 8rem }` at ≥768px, i.e. the same as `md:top-32`.
Reproduced the real PDP structure against the real `theme.css` / `theme.js`: the media
column sits at 173px at scroll 0 then **pins at exactly 128px** through every scroll
position. No change was needed and none was made.

Two traps hit while measuring, both worth remembering:
- `html { scroll-behavior: smooth }` means `window.scrollTo()` does **not** apply
  synchronously — a first run reported the column "never moving" because all six
  samples were actually taken at scroll 0. Set `scrollBehavior='auto'` and wait two
  animation frames before measuring.
- `body { overflow-x: hidden }` looks like the classic sticky killer, but `html` here has
  no `overflow` of its own, so the value propagates to the viewport and body does not
  become a scroll container. It is **not** a problem in this theme.

### The real gap: no way to scroll through the images
`initGallery()` bound **thumbnail clicks only** — no swipe, no drag, no keyboard. On a
phone the sole way to change image was tapping a 4rem thumbnail. Added to
`initGallery()`, following the existing `initDragRails()` pointer convention:
- horizontal pointer drag past 40px steps one slide, clamped at both ends;
- the gesture is ignored unless it is **more horizontal than vertical**, so vertical page
  scrolling and the sticky column are never hijacked;
- `touch-action: pan-y` on the stage keeps native vertical scrolling on touch;
- stage is focusable with Left/Right arrow support and a `:focus-visible` ring;
- images get `user-drag: none` so a drag doesn't start a native image drag.

### Verification
| Case | Result |
|---|---|
| swipe left ×2 from slide 0 | 0 → 1 → 2 |
| swipe left at last slide | clamped at 2 |
| swipe right | 2 → 1 |
| vertical swipe | no slide change |
| 20px drag (under threshold) | no slide change |
| ArrowRight / ArrowLeft | 1 → 2 → 1 |
| thumbnail click | slide and thumb both land on index 2 |
| sticky after the change | still pins at 128px |

**Ambiguity flagged:** "image scroll" could have meant the sticky pin instead. That was
measured as already working, so the swipe gap is the only real defect found. The live
store could not be checked — it is password protected.

---

## 2026-09-13 (e) — Search as a drawer, plus centring the search page

### Asked for
Search page content was left-aligned; then: make search a pop-up like the cart.

### Search drawer
New `snippets/search-drawer.liquid`, mounted in `layout/theme.liquid` next to the cart
drawer. Deliberately reuses the cart drawer's shell and mechanics so it feels like the
same component: fixed overlay, blurred scrim, right-hand panel sliding in on `.is-open`,
`cart-drawer__head` / `cart-drawer__foot` reused verbatim for the header and CTA.

- `initSearchDrawer()` in `theme.js`, registered in `boot()` right after `initCart()`.
- Live results from Shopify's `/search/suggest.json`, grouped Products / Collections /
  Journal / Pages, 5 each. Empty groups are omitted.
- 220ms debounce, queries under 2 characters reset to the hint, and in-flight requests
  are cancelled via `AbortController` so slow responses cannot overwrite newer ones.
- Prices run through the theme's existing `money()` helper, so they follow
  `shop.money_format` (verified: ₹2,899 with Indian digit grouping).
- Added to the existing global Escape handler alongside the cart drawer.
- All interpolated result fields are escaped before being written as HTML.

**Progressive enhancement:** the header trigger keeps `href="{{ routes.search_url }}"`
and only calls `preventDefault()` once the drawer takes over, and the form still posts to
`/search`. If `theme.js` fails, search degrades to the full page rather than breaking —
the same lesson as entry (d).

### Search page centring
`main-search.liquid` gained a `.search-page__head` wrapper; the heading block and the
form are now centred. Results stay left-aligned in their grid. The page remains the
no-JS fallback and a valid destination for `/search?q=`.

### Verification
Harness with the real `theme.css` / `theme.js` and a stubbed `/search/suggest.json`:
- Trigger click → panel slides 1280 → 840 (440px wide), `aria-hidden` false, body scroll
  locked, input focused, and no navigation (preventDefault held).
- Typing `gan` → correct suggest URL, three groups rendered, prices formatted ₹2,899 /
  ₹1,999, "see all" link updated to `/search?q=gan`, footer CTA shown.
- Single character → results reset to the hint, footer hidden again.
- Escape → drawer closes and body overflow is restored.

**Fixed during verification:** `.sresult__title` and `.sresult__meta` were inline spans,
so `margin-top` did nothing and the title ran into the price on one line. Both are now
`display: block`.

**Not verified:** the real `/search/suggest.json` response from the live store — the
endpoint was stubbed locally. Shape follows Shopify's documented
`resources.results.{products,collections,articles,pages}`.

---

## 2026-09-13 (d) — Fix content stuck invisible (scroll-reveal never firing)

**Symptom:** article page scrolled to full height but rendered almost nothing — content
present in the DOM, stuck at `opacity: 0`.

### Root cause class
`theme.css:221` hides every `[data-reveal]` / `[data-stagger]` / `[data-split]` at
`opacity: 0` and depends entirely on JS adding `.is-in`. Anything that stops that from
happening leaves a page with correct scroll height and no visible content. Two distinct
failures were found and fixed.

**1. Tall elements could never reveal (real bug, confirmed).**
`IntersectionObserver`'s `intersectionRatio` is *visible area ÷ the element's own area*,
so an element taller than ~6.7 viewports can never reach the `threshold: 0.15` the engine
used. Measured: a 7684px body in a 900px viewport has a **maximum possible ratio of
0.117** — mathematically unable to trigger. A long-form article is exactly this shape.
Fixed by observing at `threshold: [0, 0.15]` and revealing an element as soon as it
enters when it is taller than ~90% of the viewport, keeping the 15% trigger for
normal-sized elements.

**2. No failsafe if `theme.js` never boots.**
404, parse error, or a blocking app script and the whole page stays blank. Added a
watchdog to the inline script in `layout/theme.liquid`, which runs independently of
`theme.js`: on `load`, after 1.2s, if `window.__spRevealReady` is not set, add `.is-in`
to every reveal target. `initReveal()` sets that flag, so when the engine works the
watchdog does nothing and scroll-reveal is untouched.

### Verification
- **theme.js deliberately 404'd** → `revealEngineBooted: false`, and title, excerpt and
  body all reach `opacity: 1`. Previously all three stayed invisible.
- **7684px element, real theme.js** → `couldEverHit015: false`, now `is-in`, opacity 1.
- **Regression** — same element below the fold at scroll 0 stays `opacity: 0`: no
  premature reveal, scroll-reveal still behaves as designed.

### Corrected earlier in this session
I first proposed the threshold as the cause of the reported blank page, then my own test
(a 1759px body, max ratio 0.512) disproved it for normal-length articles and I said so.
The bug is real but only bites past ~6000px; whether it is *this* store's cause depends
on the article's rendered height, which I cannot measure — the store is password
protected. The failsafe covers the remaining possibilities either way.

### Also confirmed (store-side, no code change)
Two blogs exist. The nav's JOURNAL item points at `/blogs/news`, which is empty, while
articles live in `/blogs/journal`. Fix in Content → Menus → Main menu.

---

## 2026-09-13 (c) — Journal: diagnosed empty page, extracted the five real articles

**Status:** content pack committed. **Articles are NOT yet in the store** — that step
needs a store-side import (see `journal-content/README.md`).

### Finding: not a theme bug
`sections/main-blog.liquid` and `sections/main-article.liquid` are already complete and
already match the reference design — 3-column `.journal__grid`, `.jcard` with tag badge,
date, title, clamped excerpt and read-more, tag chips built from `blog.all_tags`,
pagination, and an article template with hero, standfirst, RTE body and related posts.
All the CSS exists. **No theme change was needed and none was made.**

The page is empty because the dev store's blog contains **zero articles**. Shopify blog
posts are store data, not theme files — the repo only syncs assets/config/layout/
locales/sections/snippets/templates — so a `git push` cannot create them.

Also found: the store's blog is still titled **News** (Shopify's default), which is why
the header reads "News". `main-blog.liquid` prints `blog.title`, so renaming the blog to
`Journal` in admin fixes the heading with no code change.

### Extracted from the reference
Five articles from `silverplayproject.vercel.app/journal`. Their images are served from
`silverplay.in/cdn/shop/articles/…`, so these exist as real articles on the production
store — only the dev store lacks them.

| Date | Tag | Title |
|---|---|---|
| 2026-08-10 | 925 Silver | Raksha Bandhan Silver Gifts 2026: Rakhis, Pendants & More |
| 2026-06-13 | Gifting | How to Wear Meaning: Choosing Stones for Love, Calm & Courage |
| 2026-06-13 | Behind-the-Scenes | Inside the Jaipur Atelier: A Day With Our Karigars |
| 2026-06-13 | Origins | A Map of Stones: Where Your Jewellery Was Born |
| 2026-06-13 | Care | The Quiet Power of 925 Silver: Why Our Grandmothers Were Right |

### Added — `journal-content/` (ignored by Shopify theme sync)
- `articles.json` — handle, title, tag, date, author, excerpt, body HTML
- `html/<handle>.html` — paste-ready body HTML per article
- `images/<handle>.png` — five hero images at full resolution (14 MB total)
- `matrixify-blog-posts.csv` — bulk import sheet, `Command: MERGE` keyed on handle
- `README.md` — three import routes (Matrixify / Admin API / manual) plus the blog rename

Body text was captured verbatim from the rendered article pages; typographic quotes and
dashes were normalised to HTML entities for the Shopify editor.

### Not done
Creating the articles in the store — needs either the Matrixify app, an Admin API token,
or manual entry. Awaiting the user's choice of route.

---

## 2026-09-13 (b) — About images: portable assets, founder-style height match, face-safe framing

**Repo:** `kanchantechinfinity/silverplaymain` — follows on from entry (a) below.

### Asked for
1. Keep images in the theme so it can be reused in another store.
2. Image height should match the container beside it — the way the founder section does.
3. Place every image so the face stays visible.
4. No other theme changes.

### 1. Portability — already satisfied
All four images are bundled under `assets/` and referenced with `asset_url`. Nothing
points at a Shopify CDN URL or a store-specific uploaded file, so the theme carries its
own About imagery into any store. Founder's photo was already a local asset.

### 2. Height matching — copied the founder mechanism verbatim
The founder section (commit `bf1f7b5`) fixed this with an **absolute-fill img**:
an `<img>` in normal flow with `height:100%` has an intrinsic ratio, so its height and
its container's height define each other — the feedback loop that collapsed the box.
`position:absolute; inset:0` removes the img from flow, so the container height comes
only from the flex/grid row.

`assets/theme.css`, 2 lines changed, scoped to `.split-row` (used **only** by
`text-with-image`, used **only** by the About page):
- `.split-row > [data-reveal]` → `align-self:stretch; display:flex` (≥768px)
- `.split-row__media` → `height:auto` instead of `height:100%`
- `.split-row__media img` → `position:absolute; inset:0`

Measured: media height − text height = **0px** on all three rows, matching founder.

### 3. Face-safe framing — new `image_focus` setting
Added an `image_focus` string setting to `about-hero.liquid` and `text-with-image.liquid`,
emitted as `style="object-position:…"`. Set per section in `templates/page.about.json`:

| Section | Focus | Subject kept in frame |
|---|---|---|
| hero | `50% 8%` | both faces |
| craft | `70% 36%` | hands + engraved piece — **this image contains no face** |
| values | `28% 10%` | model's face (top-left) |
| closing | `50% 26%` | man's and woman's faces |

### Verification
Served the repo and rendered a harness with the real `theme.css`, founder section
included as the reference, at 1280×900:
- Media/text height delta **0px** on craft, values, closing — identical to founder.
- Computed the exact source-pixel crop window from box size + `object-position` and
  asserted each face box falls inside it, across 6 box shapes (desktop actual, very
  short, short, long text, mobile 4:5, tablet): **23/24 pass**.
- The 1 miss is `craft` at a 4:1 box where the subject region is taller than the crop
  window — geometrically impossible, and the real copy is far too long to produce it.
- Visually confirmed all four images; harness and temp launch entry removed.

**Not verified:** live Liquid rendering in a real Shopify store.

### ⚠ Flagged, not changed
`about-hero-soul-of-silver.png` is a **screenshot of a British Library archival photo**
(original name `Screenshot_2026-05-20_at_1.11.35_PM`) and still carries the red
*British Library* badge plus two browser UI buttons bottom-right. `50% 8%` crops them
out at typical desktop sizes but they reappear on tall/narrow viewports. Left as-is
because the brief was to use the reference images exactly — recommend cropping the
asset and confirming reuse rights before this goes live in another store.

---

## 2026-09-13 (a) — About page: use the exact Vercel reference images

**Repo:** `kanchantechinfinity/silverplaymain` @ `bf1f7b5` (main)
**Status:** working tree only — **not committed, not pushed**

### Problem
All three `text-with-image` rows on the About page (craft / values / closing)
shared one hardcoded fallback, `stock-lifestyle-1.jpg`, so they rendered the same
photo. The hero fell back to `manuscript-panels.jpg`, also not the reference image.

### Source
`https://silverplayproject.vercel.app/about` — read the DOM and matched each `<img>`
to its slot by `alt` text. Images are served from `silverplay.in/cdn/shop/files/...`;
pulled each master with the `_3840x` size suffix.

| Slot | alt | Asset added |
|---|---|---|
| hero | The Soul of Indian Silver | `about-hero-soul-of-silver.png` (1370×1092, 1.9 MB) |
| founder | Dalljiet Kaur | — already byte-identical (md5 `4c482632…`), untouched |
| craft | The Karigars of India | `about-craft-karigars.png` (1448×1086, 2.1 MB) |
| values | Slow Making, Honest Materials | `about-values-slow-making.png` (1080×1600, 1.9 MB) |
| closing | Wear Your Story | `about-closing-wear-your-story.png` (1080×1600, 2.0 MB) |

### Changes
- `assets/` — 4 new PNGs (exact bytes from the CDN, no re-encoding).
- `sections/text-with-image.liquid` — new `image_asset` text setting; media resolves
  `image_picker` → `image_asset` → `stock-lifestyle-1.jpg`. Existing behaviour is
  unchanged when `image_asset` is empty.
- `sections/about-hero.liquid` — same `image_asset` setting, defaulting to the new
  hero asset; declared intrinsic size corrected to 1370×1092.
- `templates/page.about.json` — `image_asset` set on hero, craft, values, closing.

Follows the existing `occasion-card` / `heritage-bg` convention of naming a local
asset in a string setting. No piped filter inside an `if` condition (known Liquid trap).

### Verification
No Shopify CLI installed, so the Liquid can't be rendered locally. Instead served the
repo over HTTP and rendered a throwaway harness using the real `assets/theme.css`
class names, at a 1280×900 viewport:
- All 4 images load at their true natural resolution (`naturalWidth > 0`).
- `object-fit: cover` crops the landscape masters (hero, craft) into their boxes
  cleanly — no squash, no letterbox.
- Each row shows a **distinct** photo; `split-row--reverse` correctly puts the
  values image on the left, craft and closing on the right.
- Harness, temp downloads and the temporary launch.json entry were removed afterwards.

**Not verified:** live Liquid rendering in a real Shopify store.

### Notes / follow-ups
- `manuscript-panels.jpg` (213 KB) is now unreferenced — left in place, safe to delete.
- `assets/` is now ~37 MB against Shopify's 50 MB theme-zip limit. If more full-res
  PNGs get added, consider JPEG for the non-transparent photographic ones.

---

## 2026-09-13 — Connect repo + read full history

**Repo:** `kanchantechinfinity/silverplaymain` @ `bf1f7b5` (main)
**Status:** clone only — no code changes, nothing committed or pushed

### Done
- Resolved the repo URL. `kanchantechinfinity/silverplay` does not exist; probing
  the account found `silverplaymain`, `silverplaycollectionpage`, `silverplayproject`.
  Target confirmed as **silverplaymain**.
- Cloned to `C:\Users\kanch\OneDrive\Desktop\silverplay\silverplaymain`.
  Clean tree, `main` tracking `origin/main`, up to date.
- Read all 47 commits (2026-09-09 → 2026-09-11) with per-commit file stats.
- Surveyed structure: 37 sections, 18 snippets, JSON templates, `theme.css`
  (1305 lines), `theme.js` (839 lines), ~30 assets + 3 MP4s.
- Extracted the homepage section order from `templates/index.json`.
- Wrote `memory.md` — architecture map plus the recurring Liquid/CSS gotchas
  the commit history documents (sticky vs overflow:hidden, grid height chains,
  filter-in-if, intrinsic-ratio image loop, Journal Arc track height formula).

### Notes
- Working directory for this project is now `…\silverplay\silverplaymain`.
- `gh` CLI is not installed; git HTTPS credentials for `kanchantechinfinity` work.
- `memory.md` / `BUILD_LOG.md` are untracked and not in `.gitignore` — they will
  show up in `git status` until committed or ignored.

### Next
Awaiting change requests from the user.
