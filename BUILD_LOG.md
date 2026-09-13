# Build Log — silverplaymain

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
