# Web audit: reader experience and content rendering (2026-09-25)

**Scope:** live site https://bashkirtseff.org (version 0.2.0-eab1772f5), driven with agent-browser at 1440×900 and 390×844 (iPhone 14 emulation). Where needed, findings were checked against `content/` and `src/frontend/src` to tell content defects apart from rendering defects. This was a report-only pass: nothing was modified.

**Screenshots:** `/tmp/claude-1000/-home-krr-bashkirtseff/b9feb4af-4102-4275-8101-365f3e93d604/scratchpad/ux/` (referred to as `ux/` below).
**Sample:** 32 entry pages across cz/uk/en/fr/original, carnets 001–106, including cz/018, cz/095, cz/100, cz/102 (cross-year) and 000 (preface). Also year pages, carnet pages, glossary, filter, menu, settings, the report flow, offline, 404, /es.

What works well: no horizontal scroll at 390px on any sampled page. Footnote popovers open and close with Esc. The skip link and focus rings show clearly (2px solid). Theme and font settings apply instantly and persist. When the menu closes, focus returns to its toggle. Dark theme has no text-contrast failures. No broken images, no `%%`, `[//]:` or `[^n]` leaks in the translated text, and no empty paragraphs anywhere in the sample.

---

## HIGH

### H1. Literal markdown asterisks in the French original panel
- **URL:** https://bashkirtseff.org/cz/018/1874-03-29/ → flip paragraph 10: "Ce matin \*je me suis plainte à maman\* [de] Lambertye…"
- **Screenshot:** `ux/08b-flip-original-panel.png`
- **Scale:** 15 of the 25 sampled translation pages had asterisks in the French panel (cz/010, 018, 034, 071; uk/002, 015, 060; en/005, 040, 104…). There are **4,474 source lines in 1,742 `_original` files** with `*italic*` markup.
- **Cause:** rendering. `components/reading/FlipParagraph.vue:84` outputs `{{ originalText }}` as plain text, while the translation side renders HTML. Footnote refs are stripped correctly, but italics are not converted.
- **Fix:** run `originalText` through the same inline-markdown renderer as the front face (italics only, escaped), and bind with `v-html`. At minimum, convert `*x*` to `<em>`.

### H2. French panel missing entirely for about 196 entries
- **URLs:** https://bashkirtseff.org/uk/030/1875-03-27/ (29 paragraphs, 0 with an original), https://bashkirtseff.org/cz/059/1876-04-27/ (52 paragraphs, 0 with an original). The same entry in cz/en (`/cz/030/1875-03-27/`) has all 29 paragraphs with the French panel.
- **Affected carnets:** cz 059, 093 (55 entries); uk 030, 070, 100, 103 (114 entries); en 050, 053, 100 (27 entries). These translation files have no embedded `%% French %%` lines (probably stripped by a polish or sync pass), and the panel reads only the embedded copy.
- **Fix, both parts:** (a) rendering: when there is no embedded French, fall back to the `_original` paragraph with the same `XXX.YYYY` ID. The IDs match, as verified for 030. (b) content: re-run `just sync` for those carnets, then run the visible-text diff and splicescan per the stale-embedded-French memory.

### H3. Czech UI strings leak onto English, Ukrainian and French pages
This was tested with `ui-language=en` on /en/ pages.
- **Carnet calendar is always Czech:** "Leden / Únor, PO ÚT ST ČT PÁ SO NE" on https://bashkirtseff.org/en/001/ (`ux/05-en-001.png`). The cause is `CalendarWidget.vue:46` `CZECH_MONTHS`. Fix: `Intl.DateTimeFormat(dateLocale,{month:'long'})` plus localized weekday initials.
- **Flip button labels are hardcoded Czech:** `FlipParagraph.vue:69,87` use `'Zobrazit originál: '` / `'Zobrazit překlad: '` and the language titles "Francouzsky" / "Anglicky". Every flip button on every page announces Czech. Fix: `t('paragraph.showOriginal', {langs})`.
- **Paragraph menu labels stay Czech after hydration:** "1 souvisejících položek 000.0001", "Možnosti odstavce" on https://bashkirtseff.org/en/000/ and /en/001/1873-01-11/. The ContentLanguageSwitcher globe label also stays Czech: "Originál (vícejazyčný)". These islands seem to render before `initLocaleFromStorage()` runs and never re-render. The Czech plural is also wrong: "1 souvisejících položek" should be "1 související položka". Needs vue-i18n-style plural forms.
- **Skip link:** `BaseLayout.astro:201` is Czech in the server-rendered HTML. It is only patched when `localStorage['ui-language']` is set, so first-time visitors to /home/en/ get "Přeskočit na obsah" (confirmed on first load). Fix: render with `t('a11y.skipToContent')` for the page's own locale.
- **Header nav flashes Czech on every non-Czech page load** ("Překlad / Originál / Glosář / O projektu") until hydration: `ux/02-start-reading.png`, taken about 1.5 s after navigation on /en/000/. Fix: render the header in the page's `lang.uiLocale` instead of always `cs`.

### H4. The French "Complete!" badge is misleading, and unedited FR entries render raw
- **URL:** https://bashkirtseff.org/en/ (`ux/03-en-years.png`) shows "FR French Complete!". Only **207 of 3,846** `content/fr` files have `edition_complete: true`. 3,533 are `false`, and they show the commented French original through a fallback.
- **Cause:** `pages/[lang]/index.astro:66-81` computes `isComplete` from file count, not from approval or edition status.
- **Symptoms on unedited FR pages:** the H1 is a raw ISO date, "1879-05-26", on https://bashkirtseff.org/fr/085/1879-05-26/ and https://bashkirtseff.org/fr/102/1883-11-11/. On https://bashkirtseff.org/fr/025/1874-11-07/ the heading merges with the body ("Samedi, 7 novembre 1874 Il était convenu hier au s…").
- **Fix:** base the badge on `edition_complete` / `conductor_approved`, and show a percentage when incomplete. Give FR pages without an edition a proper date heading, plus a "modernised edition in progress — showing original" notice.

### H5. cz/100/1883-07-13: most of the French is missing, and the entry renders as one wall of text
- **URL:** https://bashkirtseff.org/cz/100/1883-07-13/ (`ux/17-cz100-single-paragraph.png`)
- `_original/100/1883-07-13.md` has only the first 146 characters of French ("Des comptes à régler… Sale individu, va !"). The cz translation has 10 lines (5,230 characters) under the same single paragraph ID, rendered as one paragraph with no visible date heading (the date is glued into the text, and the H1 is `sr-only`). en/100 and uk/100 lack embedded French too (see H2).
- **This is a content defect.** The `_original` entry looks truncated relative to the manuscript, or the translation came from Kernberger text that was never added to the source. Restore the full French from the manuscript and split it into paragraph IDs, as was done for cz/018.

---

## MEDIUM

### M1. AI-written English topic subtitles inside Marie's date headings (carnets 065–066)
- **URL:** https://bashkirtseff.org/cz/066/1876-09-29/ with H1 "Pátek, 29. září 1876 (17. září) — žerty a rodinné vztahy" (`ux/m-cz_066_1876-09-29.png`).
- **Source:** `_original/066/1876-09-29.md:24` reads `# Vendredi, 29 septembre 1876 (17 septembre) - Practical Jokes and Family Dynamics`. 37 `_original` entries (8 in 065, 29 in 066) carry these subtitles, and they have been translated into every language, so readers see them as Marie's words.
- **Fix:** strip the subtitles from `_original`, re-sync, and fix the translated headings (about 33 in cz/uk/en).

### M2. Empty entries show a placeholder and a raw heading in the French panel, with no explanation
- **URL:** https://bashkirtseff.org/cz/106/1884-10-08/ (`ux/18-cz106-empty-entry.png`). The page shows only the date. Flipping it shows `# Mercredi 8 octobre 1884\n[Entry not found in raw carnet]`.
- There are 24 `_original` files containing "[Entry not found in raw carnet]", and 67 with `empty_in_source: true`.
- **Fix:** when `empty_in_source`, render a localized note ("This date appears in the manuscript without text") and suppress the flip. Never render `#` or bracketed workflow text in the panel.

### M3. Glossary pages expose workflow metadata and are English under `lang="cs"`
- **URL:** https://bashkirtseff.org/cz/glossary/COLLIGNON/ (`ux/12-glossary-entry.png`)
- The body is English on cs/uk/fr pages and `<html lang="cs" data-lock-lang>`, so screen readers read English with a Czech voice. Fix: wrap the body in `lang="en"`, or whatever language the glossary text is in.
- Internal labels are shown to readers: "people/mentioned", "Comprehensive", "Research Status: Comprehensive Last Updated… Diary Coverage… ~215 diary files", "Person". The glossary says "189 zmínek" while the filter says 101 entries.
- Raw IDs appear as display names: in the paragraph-menu related items ("Duke_of_Hamilton", "COLLIGNON", `ux/10-paragraph-menu.png`), and in filter facets ("Emile D Audiffret" with the apostrophe lost, "Duke Of Hamilton"). Filter subcategory chips are English in the cs UI ("Mentioned (66)", "Family", "Core", "Aristocracy"…).
- **Fix:** use the glossary `name` field for labels, localize the category labels, and hide the research block (or put it behind a "research notes" disclosure).

### M4. The preface (000) switcher and metadata are wrong
- **URL:** https://bashkirtseff.org/en/000/ (`ux/02-start-reading.png`)
- The globe/Original link is marked `lang-unavailable` ("Translation not yet available. Help us!") and points to `/about`, but `/original/000/` returns 200.
- "Mai 1884" is hardcoded in French on every language (`pages/[lang]/000/index.astro:127`).
- "PREFACE" appears as the H1 and again as an H2 directly below it.
- The home page lists "Notebook 000 · 1884 · 10 entries" while the page says "53 sections".
- "Start reading" on /home/en/ lands on the preface. That is fine, but consider offering "Begin with 11 January 1873" alongside it.

### M5. The report-a-problem flow jumps straight to Google
- **URL:** https://bashkirtseff.org/cz/001/1873-01-19/ → ··· → "Přihlaste se pro hlášení chyb". The browser goes immediately to accounts.google.com (`ux/11-report-flow.png` was captured after the redirect). The redirect was observed and the form was not submitted.
- There is no interstitial explaining why sign-in is needed or what is stored, and no non-Google alternative (email or anonymous report).
- **Fix:** open a small dialog first with an explanation and a privacy link, then offer "Continue with Google" or "Send by email" (mailto prefilled with the paragraph ID and URL).

### M6. Offline navigation to an uncached page gives a blank page
- **URL:** https://bashkirtseff.org/cz/044/ with offline mode on shows a blank page (`ux/23-offline-uncached.png`). Cached entries do load offline. The SW is `/sw.js` and the manifest is `/manifest.webmanifest`.
- `/offline` exists but is never served, because `navigateFallback` is null by design.
- **Fix:** as CLAUDE.md suggests, `injectManifest` plus a `setCatchHandler` limited to `request.mode==='navigate'` that returns the precached `/offline/`.

### M7. /es/ returns a bare nginx 403, and redirects downgrade to http
- https://bashkirtseff.org/es/ returns "403 Forbidden nginx/1.29.3" (`ux/19-es-403.png`), because the directory exists without an index.
- `/es/about`, `/glossary/NICE` and similar return 301s to `http://bashkirtseff.org/...`, which is an extra hop through the https upgrade.
- The ES pilot is exposed through `/home/es/` and "ES Español" in the language picker. The diary links fall back to /original correctly.
- **Fix:** `location = /es/ { return 302 /home/es/; }` (or a 404), plus `absolute_redirect off;` or `port_in_redirect off` with the scheme taken from `X-Forwarded-Proto`. The web-audit-tech agent may overlap on this one.

### M8. Wrong document language on /home/{lang}
- With `ui-language=cs`, visiting https://bashkirtseff.org/home/en/ or /home/es/ sets `<html lang="cs">` over English or Spanish content. The server-rendered value is correct. The pre-paint script in `BaseLayout.astro:189-194` overwrites it because these pages lack `lockLang`.
- **Fix:** add `lockLang` to the `/home/[locale]` pages.

### M9. The glossary "Show in diary" filter persists and silently trims later reading
- After clicking "Zobrazit v deníku" on COLLIGNON, the filter stays active across all navigation. Entries then show "11 odstavců vynecháno", and footnoted paragraphs are hidden while their notes stay visible (`ux/14-menu.png`, `ux/13-filter.png`).
- The counts disagree: "Filtrováno: 101 z 3,671 záznamů" versus "3728 záznamů" on the same page. The number uses an English thousands separator in Czech (should be "3 671").
- **Fix:** show a persistent, dismissible filter pill near the entry header, use the same total everywhere, and format with `toLocaleString(dateLocale)`.

---

## LOW

- **L1. The paragraph toolbar is hard to find and hard to use.** The ··· and ✦ icons sit at `opacity:0.45` (about 2:1 non-text contrast in dark theme), with 24×24 targets. They are placed above each paragraph, so they read as belonging to the previous one (`ux/07-cz018-entry.png`). The flip icon gives no hint that it means "show French". Keyboard users tab through two stops per paragraph (the preface has over 100). Some buttons have a `title`-only name (accessible name is empty in `activeElement` checks). **Fix:** raise the opacity to 0.7 or more, place the icons in line with the paragraph's first line, use 32px or larger targets on touch, and use a roving tabindex or one toolbar per focused paragraph.
- **L2. Footnotes.** The superscript target is 9×26 px, below the 24px minimum. The notes list shows internal IDs ("01.24.1.", "18.41.1.", "100.92.1.") while the text shows "1". In cz/001/1873-01-19 the source ref is `[^01.25.1]` but the displayed label is `01.24.1`. The notes use a sans font while the body is serif. **Fix:** show the ordinal and pad the ref hit area.
- **L3. Age for 1884 shows "25–26 years old"** (`ux/04-en-1884.png`, and the year cards). Marie died in October 1884, before turning 26, so it should read "25".
- **L4. The first entry has no date heading.** https://bashkirtseff.org/en/001/1873-01-11/ has H1 "Notebook No. 1" and `<title>` "Notebook No. 1 — Notebook 001" (`ux/06b-en-entry-full.png`).
- **L5. The "Continue reading" CTA shows a raw paragraph ID** ("Pokračovat ve čtení 018.0042", on /cz/ and /home/es/). Use the date and carnet instead.
- **L6. Carnet and year page polish.** There is a trailing bullet in "3,132 words •". The "Download for offline" button uses a different font and wraps awkwardly (`ux/05-en-001.png`). The 1884 notebook grid reads column-first (102/103/104 | 105/106, `ux/04-en-1884.png`). The year page has no H2 for its notebook list.
- **L7. Font-scale robustness.** A stored `reading-font-scale` in the wrong unit (for example `"1"` instead of `"100"`) makes text 0.18px, so entries look blank. I hit this by accident. **Fix:** clamp the value to 50–300 when reading it.
- **L8. The menu drawer is not modal for assistive tech.** Background links stay in the accessibility tree while the drawer is open (`ux/15-reading-settings.png`). Add `aria-modal="true"` and `inert` on `<main>`. Esc and focus return already work.
- **L9. There is no newsletter signup anywhere on the site.** A grep for newsletter, listmonk and subscribe in `src/frontend` finds nothing, so the listmonk list has no on-site funnel. Consider a footer form, or a link to the listmonk subscription page.
- **L10. Czech quotation marks.** About 26k Czech quotations open with „ but close with an ASCII `"`, against about 4k correct „…“ pairs (for example cz/001/1873-01-19: „Nedělejte to, Marie, tak mě to dráždí."). This is a content-wide typographic inconsistency. It could be fixed mechanically but needs a TM ruling. The same entry spells the name as "Collignon" while cz/018 uses "Collignonová".
- **L11. No keyboard shortcuts for previous/next entry** (←/→ did nothing). This is optional.

---

## Suggested order of work
1. H1 and H3 (frontend-only, mechanical, affect every reader).
2. H2 fallback to `_original` in the renderer (immediately fixes the 196 entries), then content re-sync.
3. H4 badge logic, and M4 preface switcher (both one-liners).
4. Content tickets: H5 (cz/100/1883-07-13 source restore), M1 (strip 37 subtitles), M2 (24 placeholders).
5. M3 glossary display names and metadata, M5 report interstitial, M6 offline fallback.
