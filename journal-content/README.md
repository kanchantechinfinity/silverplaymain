# Journal content pack

The five real Journal articles from the reference site
(`https://silverplayproject.vercel.app/journal`), extracted with their tags, dates,
excerpts, body HTML and hero images.

## Why this folder exists

The Journal page renders empty **not because of a theme bug** — `sections/main-blog.liquid`,
`sections/main-article.liquid` and the `.journal__grid` / `.jcard` styles are all complete
and already match the reference design. It is empty because **the store's blog has no
articles**.

Blog posts in Shopify are **store data, not theme files**. The theme repo only syncs
`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/` and `templates/`.
So articles cannot be created by a `git push` — they have to be loaded into the store.
Shopify ignores this folder when syncing the theme.

## Two things the store needs

1. **Rename the blog.** The store's blog is currently titled **News** (the Shopify
   default), which is why the page header reads "News" instead of "Journal".
   *Online Store → Blog posts → Manage blogs → News → rename to `Journal`.*
   `main-blog.liquid` prints `blog.title`, so the heading follows automatically.
2. **Create the five articles** — one of the routes below.

## Contents

| Path | What it is |
|---|---|
| `articles.json` | All five articles as structured data — handle, title, tag, date, author, excerpt, body HTML |
| `html/<handle>.html` | Body HTML for one article, ready to paste into the Shopify editor's `<>` view |
| `images/<handle>.png` | Hero image for that article, full resolution |
| `matrixify-blog-posts.csv` | Bulk-import sheet in Matrixify format |

## Route A — Matrixify (bulk, recommended)

1. Install the **Matrixify** app (the free tier covers five posts).
2. Upload `images/` to *Content → Files* first, then replace the `Image Src` column in
   the CSV with the resulting Shopify CDN URLs — Matrixify cannot read local paths.
3. *Matrixify → Import → upload `matrixify-blog-posts.csv` → Dry run → Import.*

The sheet uses `Command: MERGE` keyed on `Handle`, so re-importing updates rather than
duplicates. `Blog: Handle` is `journal` — change it if the blog keeps a different handle.

## Route B — Admin API script

Repeatable, and the fastest way to seed the second store later. Needs a custom app in
*Settings → Apps → Develop apps* with `write_content` scope, then its Admin API access
token. Ask and I'll write the script against `articles.json`.

## Route C — By hand

Five articles, roughly ten minutes. For each entry in `articles.json`:

*Online Store → Blog posts → Add blog post*
- **Title** → `title`
- **Content** → open the `<>` (HTML) view and paste `html/<handle>.html`
- **Excerpt** → *Add excerpt*, paste `excerpt`
- **Featured image** → upload `images/<handle>.png`
- **Tags** → `tag` (exactly as written — the archive's filter chips are built from
  `blog.all_tags`, so the spelling has to match across posts)
- **Author** → `Silver Play`
- **Blog** → `Journal`
- **Published date** → `date`
- **Search engine listing → URL handle** → `handle` (keeps the reference site's URLs)

## After importing

- `/blogs/journal` shows the 3-column grid with filter chips built from the tags.
- The homepage **Journal Arc** section fills in automatically — it already falls back to
  the first blog that has articles, so it works even if the handle differs.
- Article pages render via `templates/article.json` → `sections/main-article.liquid`.
