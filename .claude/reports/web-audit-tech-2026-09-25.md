# Technical web audit — bashkirtseff.org (2026-09-25)

Scope: AstroJS PWA in `src/frontend`, live site https://bashkirtseff.org, CI/deploy.
Report only. No source files were changed and nothing was committed. Raw evidence
(logs, sitemap dump, sample results) is in the session scratchpad under `webaudit/`.

**Deployed commit:** `eab1772f5` (from live `/data/offline-manifest.json`), which is
`origin/main` HEAD. Live matches main. The last deploy was 2026-09-07 17:45Z, and nothing
has been pushed to main since.

## Summary table

| # | Sev | Finding |
|---|-----|---------|
| 1 | **High** | Every trailing-slash redirect is an absolute `http://` URL, so there are 2 hops (301→http, 308→https). About 70% of internal links hit it |
| 2 | **High** | No security headers reach clients: no HSTS, X-Frame-Options, nosniff, CSP or Referrer-Policy (nginx `add_header` inheritance) |
| 3 | **High** | `https://www.bashkirtseff.org` resolves but serves a **self-signed certificate** |
| 4 | Med | hreflang alternates point at non-canonical, redirecting URLs (no trailing slash). Glossary pages have no hreflang |
| 5 | Med | Weak, duplicated `<title>`/description on entry pages. First entry of each carnet is titled "Notebook No. 1" |
| 6 | Med | A11y gate workflow has **never run** (it triggers on PRs only, and the project pushes straight to main) |
| 7 | Med | Heavy assets: 4.0 MB + 1.7 MB JPEGs on `/*/marie`, 579 KB PWA icon in precache, 2.2 MB glossary index HTML |
| 8 | Med | Deploy concurrency `cancel-in-progress` kills in-flight remote `docker compose up --build` (5 cancelled runs on 09-06/07) |
| 9 | Low | `/es/`, `/home/` and `/_astro/` return **403** (directory without index) instead of 404/redirect |
| 10 | Low | Manifest served as `application/octet-stream`. Stale `/manifest.json` nginx block. Duplicate `Cache-Control` headers. No brotli |
| 11 | Low | Sitemap: `/admin/` (noindex page) listed, no `<lastmod>`. Root `/` is noindex JS redirect, `start_url` goes through it |
| 12 | Low | Typecheck: `tsc` on frontend has 3 errors in `astro.config.mjs`. `.astro`/`.vue` files are never typechecked (`@astrojs/check` not installed) |
| 13 | Low | `npm audit --omit=dev`: 12 advisories (1 critical `astro`, 9 high). All build-time only for a static site |
| 14 | Low | CI deprecations: tailscale `authkey`, Node 20 actions, `--keep-storage`. Build log clipped at 2 MiB, so build warnings are invisible |
| 15 | Info | Deploy server disk 92% (32 GB free) |

What passed: shared tests (51/51), frontend vitest (32/32), shared `tsc` clean. The
sitemap (35,890 URLs) validates and 275/275 sampled URLs return 200. Internal-link sample
had 0 broken links on live. HTTP→HTTPS is a 308. TLS 1.3 only, LE cert valid to
2026-12-08. The PWA SW and all 109 precache entries resolve. Real 404 status is served
for missing paths. gzip is on for HTML/JS/CSS/JSON. Hashed `_astro` assets have 1-year
immutable caching.

---

## Findings in detail

### 1. HIGH — Trailing-slash redirects downgrade to http:// (double hop)

Evidence:
```
$ curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' https://bashkirtseff.org/cz/001/1873-01-11
301 -> http://bashkirtseff.org/cz/001/1873-01-11/
$ curl -sI http://bashkirtseff.org/ → HTTP/1.1 308 Permanent Redirect, Location: https://bashkirtseff.org/
$ curl -sL -w 'hops=%{num_redirects}' https://bashkirtseff.org/cz/001/1873-01-11 → hops=2
$ curl -sL -w 'hops=%{num_redirects}' https://bashkirtseff.org/glossary → hops=3
```
Same for `/cz/000`, `/cz/glossary/NICE`, `/cz/carnets`, `/home/cs`, etc.

Scale: a link sample over 682 built pages (27,109 internal links) found **19,047 links
(70%) without a trailing slash**. These include every prev/next entry link
(`/cz/NNN/YYYY-MM-DD`), carnet links, `/cs/about`, `/cs/marie`, `/original`, `/cz`,
`/original/glossary`. Every click therefore costs 2 extra round trips and briefly goes
over plain HTTP, and there is no HSTS to protect it (see #2). The root JS redirect goes to
`/home/en` (no slash), so first-time visitors get JS redirect → 301 http → 308 https.

Cause: the container nginx sits behind Nginx Proxy Manager and sees `$scheme=http`. Its
automatic directory redirect (`try_files $uri/`) emits an absolute URL with that scheme.

Fix (either or both):
- `src/frontend/nginx.conf`: add `absolute_redirect off;` in the `server` block, so
  `Location` becomes relative (`/cz/001/1873-01-11/`) and the scheme is preserved.
  Optionally also `port_in_redirect off;`.
- Emit slash-terminated URLs in the app. Set `trailingSlash: 'always'` in
  `astro.config.mjs` and fix link builders (entry nav, `glossaryUrl()`, hreflang,
  `/home/${l}`, root redirect script), so internal navigation never redirects.

### 2. HIGH — Security headers from nginx.conf never reach clients

Evidence (`curl -sI` on `/`, an entry page, a `_astro` CSS file, `/sw.js`, `/robots.txt`):
only `cache-control`, `expires`, `content-type`, `last-modified` and `server: web` are
returned. There is **no** `Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` or `Permissions-Policy`.

Cause: `src/frontend/nginx.conf` sets the security headers at `server` level, but every
`location` (`/`, static-asset regex, `/sw.js`, `/manifest.json`) has its own `add_header
Cache-Control …`. In nginx, any `add_header` in a location **discards all inherited
server-level `add_header`s**. The HSTS logic depends on `X-Forwarded-Proto`, which is also
lost for the same reason. NPM isn't adding any either.

Fix: move the header set into a snippet (e.g. `security-headers.conf`) and `include` it in
every location that uses `add_header`. On nginx ≥1.29 you can use `add_header_inherit
merge;`. Alternatively set them in NPM's "Advanced" config for the host. Recommended set:
`Strict-Transport-Security: max-age=31536000; includeSubDomains` (set it unconditionally;
the site is HTTPS-only), `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a report-only CSP
first (inline scripts exist, plus `pythia.kerray.cz` analytics and `auth.bashkirtseff.org`).
Drop `X-XSS-Protection`, which is deprecated.

### 3. HIGH — www subdomain serves a self-signed certificate

```
$ dig +short www.bashkirtseff.org → 5.180.255.245
$ curl -sv https://www.bashkirtseff.org/ → SSL certificate problem: self-signed certificate
$ openssl … -ext subjectAltName → DNS:bashkirtseff.org   (apex only)
```
Anyone typing `www.` gets a browser security interstitial.
Fix: in NPM, add `www.bashkirtseff.org` as a separate proxy host (or a redirection host) with
its own LE cert and 301 to `https://bashkirtseff.org$request_uri`. Or add it as a SAN to
the existing cert. If www isn't wanted, remove the DNS record.

### 4. MED — hreflang/canonical inconsistency; glossary lacks hreflang

Entry page `/cz/001/1873-01-11/`:
```
<link rel="canonical" href="https://bashkirtseff.org/cz/001/1873-01-11/">
<link rel="alternate" hreflang="cs" href="https://bashkirtseff.org/cz/001/1873-01-11">   ← no slash → 301 → http
<link rel="alternate" hreflang="fr" href="…/original/001/1873-01-11">
<link rel="alternate" hreflang="fr-FR" href="…/fr/001/1873-01-11">
<link rel="alternate" hreflang="x-default" href="…/original/001/1873-01-11">
```
The same pattern appears on year, carnet, language-index and `/home/*` pages. Google
requires hreflang targets to be the canonical, 200-status URL. Redirecting targets are
ignored and reported as "alternate page with redirect". Also, `fr` (original 1870s
French) vs `fr-FR` (modern edition) is ambiguous. Both are French for Google, so pick
one as the `fr` alternate. The modern edition is probably the better target for French
readers. The glossary entry pages (`/cz/glossary/NICE/`, 16.6k URLs) emit no alternates.

Fix: `src/layouts/BaseLayout.astro:70-74`, where `resolvedAlternates` is built. Normalise
hrefs to end with `/`, or fix at the callers (`[entry].astro:101-119`,
`home/[lang].astro:85-86`, year/carnet pages). Add alternates for glossary pages.
Reconsider `fr` vs `fr-FR`.

### 5. MED — Titles/descriptions weak and partly duplicated

```
/cz/001/1873-01-12/ <title>Neděle 12. ledna 1873 — Sešit 001</title>
                    description="Záznam z deníku z Neděle 12. ledna 1873 (sešit 001). Neděle 12. ledna 1873…"
/cz/001/1873-01-11/ <title>Sešit č. 1 — Sešit 001</title>          ← first entry uses the carnet heading
/en/001/1873-01-11/ <title>Notebook No. 1 — Notebook 001</title>
```
- The description just repeats the heading, so there is no text snippet for search and
  social previews. The Czech template is also ungrammatical ("z deníku z Neděle…").
- The first entry of each carnet gets the carnet heading ("Sešit č. 1") instead of the date.
  Its title nearly duplicates the carnet page title.
- The marque "Marie Bashkirtseff" is absent from entry titles.

Fix: build the entry title from the entry date (not the first `#` heading), e.g.
"11. ledna 1873 — Deník Marie Bashkirtseffové". Use the first ~150 characters of the first
content paragraph as the description. Fix the i18n template phrasing.

### 6. MED — A11y gate never runs

`.github/workflows/a11y.yml` triggers on `pull_request` and `workflow_dispatch` only.
`gh run list --workflow "A11y gate"` returns **no runs at all**, and every recent commit is
a direct push to `main`. So the documented regression gate (docs/A11Y_PLAN.md WS-H) protects
nothing. Fix: add a weekly `schedule:` trigger and/or `push` on `src/frontend/**`. Or run it
manually after frontend changes (`gh workflow run "A11y gate"`).

### 7. MED — Heavy assets / pages

| Resource | Size | Where |
|---|---|---|
| `/images/marie/in-the-studio.jpg` | **4.17 MB** (1998×1638 JPEG) | `src/pages/[lang]/marie.astro:97` |
| `/images/marie/the-meeting.jpg` | **1.72 MB** | `marie.astro:86` |
| `/images/marie/works/*.jpg` | 9 files × 390–490 KB | marie/works |
| `icons/icon-512.png` | **579 KB** (precached by SW on first visit) | manifest |
| `icons/icon-maskable-512.png` | 318 KB (precached) | manifest |
| `/{lang}/glossary/` index | **2.2 MB HTML**, 423 KB gzip, 5 copies | glossary index |
| `/{lang}/060/1876-05-19/` | 640–890 KB HTML | longest entry |
| `/data/filter-index.json` | 912 KB raw / 190 KB gzip | filter island |
| SW precache total | 2.73 MB, 109 files | `sw.js` |

The images are `loading="lazy"`, but the `/marie` page still pulls about 6 MB on scroll.
The icons alone are about 900 KB of the 2.7 MB precache that every installing visitor
downloads.

Fix: re-encode the photos to ≤1600 px WebP/AVIF at q≈75 (expect about 200–400 KB each)
and use Astro `<Image>`/`<Picture>` with `srcset`. Run `oxipng`/`pngquant` on the icons
(a 512 px icon should be ≤60 KB). Paginate the glossary index by letter (letter pages
already exist, e.g. `/original/glossary/m/`), or ship the index as JSON plus client
render. Consider excluding 512 px icons from `globPatterns`.

A typical entry page is fine: 51 KB HTML raw / **15 KB gzip** + 24.5 KB of direct CSS/JS
(gzip), with more island JS loaded after. About 60% of the entry HTML is chrome (13.5 KB
inline scripts, 8.5 KB island props, 4.8 KB inline SVG). That is repeated across 35.9k
pages, so the build is about 2.0 GB of HTML. Moving the inline scripts into a hashed
external file would cut both page weight and image size.

### 8. MED — Deploy cancellation can interrupt a remote build

`deploy.yml` uses `concurrency: cancel-in-progress: true`. When pushes land close
together, the runner is cancelled mid-`ssh … docker compose up -d --build` (runs
34143041056, 34142198979, 34142094945, 34131090517 on 2026-09-07 were cancelled after 1–2
min). Killing the SSH session may leave a half-finished build or a stale container. The
next run normally recovers, but a cancel during `git reset --hard` or while the container
is being recreated is not safe. Fix: `cancel-in-progress: false` (queue), or run the remote
command under `nohup`/`flock`. Each deploy takes about 4–5 min (astro build 163 s on the
server).

### 9. LOW — 403 on directory paths without index

```
/es/ → 403   (dist/es/ holds about/, marie/, privacy/ for the staged Spanish UI)
/home/ → 403
/_astro/ → 403
```
Fix: in nginx.conf, change `try_files $uri $uri/ $uri.html =404` to try `$uri/index.html`
explicitly instead of `$uri/`. Or add `location = /es/ { return 302 /home/es/; }` and
`location = /home/ { return 302 /; }`. A 403 looks like a permissions error to users and
crawlers.

### 10. LOW — MIME/caching details

- `/manifest.webmanifest` → `content-type: application/octet-stream`. Add `types {
  application/manifest+json webmanifest; }` in nginx.conf. The `location =
  /manifest.json` block is dead (that file no longer exists, per frontend CLAUDE.md), so
  point it at `/manifest.webmanifest` with short caching.
- Every response carries **two** `Cache-Control` headers (`max-age=3600` from `expires` plus
  `public, must-revalidate`). Drop `expires` and set a single `Cache-Control`.
- HTML is cached `max-age=3600` with must-revalidate. That is fine, but `/sw.js` is served
  `no-cache` plus `no-store`, and `workbox-*.js` gets 1-year immutable. That is OK because it
  is content-hashed.
- No brotli. gzip_types misses `image/svg+xml` and `application/manifest+json`. Minor.

### 11. LOW — Sitemap / indexing hygiene

- `sitemap-index.xml` → `sitemap-0.xml`: 35,890 URLs, 2.46 MB, no duplicates, all end in
  `/`. It covers 5 langs × 3,835 diary URLs, 5 × 3,324 glossary URLs, and 5 × 12 year pages.
- `/admin/` is listed but is `noindex, nofollow`. Add `/admin` to the `excluded` list in
  `astro.config.mjs:131-135`.
- No `<lastmod>`. Adding the entry file's git/frontmatter date helps recrawl prioritisation.
- `/` is a `noindex` JS language redirect to `/home/{lang}` (no slash, see #1). Consider
  a server-side 302 based on `Accept-Language`, or at least redirect to `/home/{lang}/`.
  The manifest `start_url: "/?source=pwa"` also goes through this JS redirect. Consider
  the manifest settings `id: "/"`, `lang` per locale, and dropping
  `orientation: "portrait-primary"`, which locks tablets and landscape readers.
- `/cz/001/1873-01-11/index.html` also returns 200 (duplicate URL). Canonical covers it.

### 12. LOW — Typecheck coverage

- `npx tsc --noEmit -p src/shared` → clean.
- `npx tsc --noEmit -p src/frontend` → 3 errors, all `TS7031` implicit-any on the
  integration hook destructuring in `astro.config.mjs:30,58`. Fix: type the hooks with
  `/** @param {import('astro').AstroIntegration…} */`, or exclude the config from checkJs.
- `@astrojs/check` is not installed, so **no `.astro` or `.vue` file is ever
  typechecked**, and there is no lint recipe (no eslint/prettier in the repo). Add
  `astro check` (plus `vue-tsc`) as `just fe-check`, and run it in CI.

### 13. LOW — Dependency advisories

`npm audit --omit=dev`: 12 advisories (critical: `astro`, about `astro/hono` checkOrigin
bypass, which applies only to SSR middleware. High: brace-expansion, browserslist,
fast-uri, js-yaml, nanoid, postcss, sharp/libvips, smol-toml, svgo. Moderate: devalue,
baseline-browser-mapping). The site is static output, so none of these is exposed at
runtime. Run `npm audit fix` / bump Astro in a routine maintenance PR.

### 14. LOW — CI hygiene

Deploy log warnings: tailscale `authkey` input deprecated (use an OAuth client),
`actions/checkout@v4` on Node 20 (bump to v5), and docker `--keep-storage` renamed to
`--reserved-space`. The GitHub log hits its **2 MiB limit during the route listing**, so
any Astro warnings emitted later in the build (and the final page count and timing) are
invisible. Fix: pipe the remote build through `grep -vE '^\s*#?[0-9.]*\s*[├└]─'` or set
Astro's `--silent`-ish logging, keeping warnings.

### 15. INFO — Capacity

Deploy host `/` is at 92% (341 G used of 392 G, 32 G free per the deploy log). Each deploy
prunes images and keeps an 8 GB builder cache, so this looks stable, but it is worth
watching. The local dev host (`uvm`) has 1.8 GB RAM, 3 cores, 4.5 GB free disk and a load
of about 13. That rules out a full local `astro build` (the Dockerfile sets a 4 GB heap
and dist is about 2.2 GB), so it was **not run here**. Build facts were taken from the CI
deploy log instead.

---

## Level 1 — code/build results

| Check | Command | Result |
|---|---|---|
| Shared unit tests | `just test-shared` | **51/51 pass**, 41 s wall |
| Frontend unit tests | `cd src/frontend && npx vitest run` | **2 files, 32/32 pass** |
| Shared typecheck | `npx tsc --noEmit -p src/shared` | clean |
| Frontend typecheck | `npx tsc --noEmit -p src/frontend` | 3 × TS7031 in `astro.config.mjs` |
| `.astro`/`.vue` check | — | not available (`@astrojs/check` absent) |
| Lint | — | no lint tooling in repo |
| Production build | CI deploy run 34148870277 (commit eab1772f5) | `astro build` 163 s. Filter index 3,671 entries / 1,906 tags. Warnings beyond route list not visible (log clipped) |
| Output | local `src/frontend/dist` (older build a390b1b61, 2026-09-07) | **35,890 HTML pages**, 41,150 files, 2.2 GB (HTML 2.0 GB, median page 41 KB, p95 117 KB), `_astro` 1.7 MB, `api` 13 MB, `data` 8.4 MB, `images` 11 MB |

No `just` recipe exists for typecheck/lint/frontend tests. `just test-shared` is the only
test recipe. Suggest adding `fe-test` (vitest) and `fe-check` (astro check).

## Level 2 — live HTTP results (selected)

| URL | Status |
|---|---|
| `/` | 200 (noindex JS redirect to /home/{lang}) |
| `/cz/` `/uk/` `/en/` `/fr/` `/original/` | 200 |
| `/cz/1873/` `/cz/001/` `/cz/000/` `/cz/001/1873-01-11/` | 200 |
| `/cz/001/1873-01-11` (no slash) | 301 → **http://**…/ → 308 → https |
| `/glossary/NICE` | 301 → /original/glossary/NICE → 301 http …/ → 308 (3 hops) |
| `/cz/glossary/` | 200, 2.2 MB |
| `/es/`, `/home/`, `/_astro/` | **403** |
| `/nonexistent-xyz`, `/cz/999/` | 404 (real 404 page) |
| `/robots.txt` | 200 text/plain, `Allow: /`, points at sitemap-index |
| `/sitemap-index.xml` → `/sitemap-0.xml` | 200, 35,890 URLs |
| `/manifest.webmanifest` | 200 but `application/octet-stream` |
| `/sw.js` | 200 no-store. 109 precache entries all 200 |
| `http://bashkirtseff.org/` | 308 → https |
| `https://www.bashkirtseff.org/` | **TLS failure (self-signed)** |
| IPv6 (AAAA `2a0e:6a81:a:120::`) | not verifiable, audit host has no IPv6 route |

Sitemap sample: 275 URLs (all 45 non-diary/non-glossary URLs, 120 random diary, 60 random
glossary, plus year pages) → **275 × 200** (one timed out once, then 200 on retry).
Internal link sample (682 dist pages, 6,024 unique targets): 1 target missing in the older
local dist (`/uk/glossary/ANDRE_THEURIET`), and it is **200 on live**. Net result: no
broken links found.

Latency: measured TTFB averaged about 1.3 s, but the breakdown shows TLS handshake
dominating (0.4–1.1 s) on an overloaded audit host. Reference sites (github.com,
cloudflare.com) showed similar handshake times. Server processing after TLS is about
50–100 ms. This is **not a server problem**, but re-measure from an unloaded client.

## Level 4 — performance

Lighthouse 12 (mobile, headless Chromium from the Playwright cache) was attempted on
`/cz/001/1873-01-11/`, `/home/en/` and `/cz/glossary/`. All three **timed out at 400 s**
on the overloaded host (load ≈13, 1.8 GB RAM). The orphaned Chrome processes were killed.
The PageSpeed Insights API returned 429 (shared anonymous daily quota exhausted). No lab
scores are available. Recommendation: run the existing `A11y gate` workflow by dispatch
and add a Lighthouse CI step there, or run
`npx lighthouse https://bashkirtseff.org/cz/001/1873-01-11/ --form-factor=mobile` from a
workstation.

Static weight analysis (above) is the substitute. The entry page is light (about 40 KB
gzip for HTML plus direct CSS/JS). The outliers are the `/marie` imagery, the glossary
index DOM (2.2 MB HTML means a very large DOM, which likely fails Lighthouse "excessive DOM
size" and hurts INP on mobile), and the 2.7 MB PWA precache.

## Suggested fix order

1. nginx.conf: `absolute_redirect off;`, security headers via include in every location,
   manifest MIME, drop duplicate Cache-Control, and 403→404/redirect. One file, one deploy.
   This fixes #1, #2, #9 and #10.
2. NPM: www host plus cert (#3).
3. Trailing-slash URLs in link builders and hreflang (#1, #4), then titles/descriptions (#5).
4. Image and icon re-encode (#7). Enable a11y gate on push/schedule (#6). Deploy
   concurrency (#8).
5. Maintenance: `astro check`, config types, `npm audit fix`, CI deprecations (#12–#14).
