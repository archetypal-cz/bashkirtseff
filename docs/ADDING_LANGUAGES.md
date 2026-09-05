# Adding a New Language

This guide covers the two independent language systems in the project and how to add a new language to either or both.

## Two Independent Systems

The project has **two separate language concerns** that are completely independent:

| System | Purpose | Affects |
|--------|---------|---------|
| **GUI Locale** | UI labels, buttons, navigation text | How the website *looks* |
| **Diary Translation** | Translated diary content | What the user *reads* |

A GUI locale can exist without any diary content (e.g., a Ukrainian speaker reading the Czech translation). A diary translation can exist without a dedicated GUI locale (it will use the closest available locale for UI text).

## System 1: GUI Locale (i18n)

GUI locales control all interface text: navigation, buttons, labels, tooltips, filter UI, etc.

### Files involved

| File | Purpose |
|------|---------|
| `src/frontend/src/i18n/locales/{code}.json` | Translation strings (295 keys) |
| `src/frontend/src/i18n/index.ts` | `SupportedLocale` type, locale registry |
| `src/frontend/src/i18n/astro.ts` | Server-side i18n (same type/registry) |

### Steps to add a GUI locale

1. **Copy an existing locale file** as a starting point:
   ```bash
   cp src/frontend/src/i18n/locales/en.json src/frontend/src/i18n/locales/de.json
   ```

2. **Translate all 295 keys** in the new JSON file.

3. **Register the locale** in `src/frontend/src/i18n/index.ts`:
   ```typescript
   // Add import
   import de from './locales/de.json';

   // Add to type
   export type SupportedLocale = 'cs' | 'fr' | 'en' | 'uk' | 'de';

   // Add to supported list
   export const SUPPORTED_LOCALES: SupportedLocale[] = ['cs', 'uk', 'en', 'fr', 'de'];

   // Add display name
   export const LOCALE_NAMES: Record<SupportedLocale, string> = {
     // ...existing...
     de: 'Deutsch'
   };

   // Add to messages
   const messages: Record<SupportedLocale, typeof cs> = { cs, uk, en, fr, de };

   // Add to localeToContentPath mapping
   // (only if the URL path differs from the ISO code)
   ```

4. **Mirror the changes** in `src/frontend/src/i18n/astro.ts` (same imports, type, messages).

5. **Verify completeness**:
   ```bash
   just i18n-diff
   ```
   This compares all locale files against `cs.json` (the reference) and reports missing keys.

### Checking locale completeness

```bash
# Show all missing keys across all locales
just i18n-diff

# Example output:
# de.json: 12 missing key(s)
#   - home.heroQuoteTranslation
#   - diary.notebook
#   ...
```

## System 2: Diary Translation Content

Diary translations are the actual translated diary entries that readers browse.

### Files involved

| File | Purpose |
|------|---------|
| `content/{code}/` | Translated diary entries by carnet |
| `src/frontend/src/lib/diary-lang-config.ts` | `DIARY_LANGUAGES` routing registry |
| `src/frontend/src/i18n/index.ts` | `activeTranslations` set in `getTranslationHref()` |

### Steps to add a diary translation

1. **Create the content directory**:
   ```bash
   mkdir -p content/de/001
   ```

2. **Add translated entry files** following the standard format (see `content/CLAUDE.md`). Each entry file has YAML frontmatter + paragraph clusters with translation comments.

3. **Enable the language route** in `src/frontend/src/lib/diary-lang-config.ts`:
   ```typescript
   export const DIARY_LANGUAGES: DiaryLanguageConfig[] = [
     // ...existing languages...
     {
       urlPath: 'de',          // URL: /de/001/1873-01-11
       contentPath: 'de',      // content/de/
       uiLocale: 'de',         // GUI locale to use (must be a SupportedLocale)
       dateLocale: 'de-DE',    // Intl.DateTimeFormat locale
       contentLangAttr: 'de',  // HTML lang attribute
       isTranslation: true,    // enables flip-to-original, progress tracking
     },
   ];
   ```

4. **Add to `activeTranslations`** in `src/frontend/src/i18n/index.ts`:
   ```typescript
   const activeTranslations = new Set(['cz', 'en', 'de']);
   ```
   This set controls the GUI language switcher's "Read translation" link. Without it, users who select German as their GUI language would be redirected to `/cz`.

5. **Pages are generated automatically** — `getStaticPaths()` in all `[lang]` pages iterates `DIARY_LANGUAGES` and discovers content via `getCarnets()` / `getCarnetEntries()`.

### Content directory structure

```
content/de/
├── 001/
│   ├── 1873-01-11.md
│   ├── 1873-01-12.md
│   └── ...
├── 002/
│   └── ...
├── CLAUDE.md          # Optional: language-specific notes
├── PROGRESS.md        # Optional: translation progress tracking
└── TranslationMemory.md  # Optional: translation memory/glossary
```

## URL path vs ISO locale code

There is an intentional split between URL paths and ISO locale codes:

| Language | ISO Code (GUI) | URL Path (Content) | Why different? |
|----------|---------------|-------------------|----------------|
| Czech | `cs` | `cz` | `/cz/` was established first; changing would break links |
| French | `fr` | `original` or `fr` | Original text lives at `/original/`, modernized at `/fr/` |
| English | `en` | `en` | Same |
| Ukrainian | `uk` | `uk` | Same |
| Spanish | `es` | `es` | Same (content tree bootstrapped 2026-09-05; frontend route pending) |

The mapping functions `localeToContentPath()` and `contentPathToLocale()` in `src/frontend/src/i18n/index.ts` handle conversions. The only current exception is Czech (`cs` <-> `cz`).

When adding a new language, keep the URL path and ISO code the same unless there's a strong reason not to.

## Partial translations

A diary translation doesn't need to be complete to be enabled. The system handles partial content gracefully:

- Only carnets with actual entry files are listed
- The LanguageSwitcher on entry pages shows which languages are available for each entry
- Year/carnet index pages only show entries that exist

You can start with a single carnet and grow from there.

## Checklist

### Adding GUI locale only (no diary content)
- [ ] Create `src/frontend/src/i18n/locales/{code}.json`
- [ ] Register in `index.ts` and `astro.ts`
- [ ] Run `just i18n-diff` to verify completeness

### Adding diary translation (with existing GUI locale)
- [ ] Create `content/{code}/` with translated entries
- [ ] Add config to `DIARY_LANGUAGES` in `diary-lang-config.ts`
- [ ] Add to `activeTranslations` set in `i18n/index.ts`
- [ ] Verify with `just fe-dev` — browse to `/{code}/`

### Adding both
- [ ] Do both checklists above
- [ ] Ensure `uiLocale` in `DIARY_LANGUAGES` matches the GUI locale code

---

# Part 3 — Content tree and agent pipeline

Parts 1 and 2 above make a language *visible*. This part makes it *translatable*: the content tree the agents write into, the per-language style guide the skills read, and the closed language lists scattered through code, scripts and docs that silently exclude a new code until extended. Worked example throughout: Spanish, `es` (bootstrapped 2026-09-05).

The frontend's "System 2" note that `CLAUDE.md`/`PROGRESS.md`/`TranslationMemory.md` are optional is true for *rendering*. For the *agent pipeline* they are required.

## 3.1 Create the three tree files

```
content/{lang}/
├── CLAUDE.md            # style guide + workflow; REQUIRED by translator/editor/opus-editor/vox/fablelous
├── PROGRESS.md          # language-level status (template: docs/templates/LANGUAGE_PROGRESS.md)
└── TranslationMemory.md # terminology; seed policy rows, grow per carnet
```

Model them on `content/en/` (closest workflow template) and `content/uk/` (traps checklist idea). Do **not** copy the `fr` tree: its entries carry no frontmatter and it has no TM.

**`CLAUDE.md` must contain a heading whose text includes `Editor / review traps`** (e.g. `## Editor / review traps (Spanish)`). The `editor` and `opus-editor` skills tell agents to read that section by name; `vox` and `fablelous` also delegate to `content/{lang}/CLAUDE.md`. Recommended layout, as in cz/en/es: workflow part in English (structure, file format, phases, flags), style guide in the target language, then the traps table and the two review prompts (pass 1 text-only, pass 2 with-comments).

Skills that read `content/{lang}/CLAUDE.md` and need no edit: `translator`, `opus-editor`, `editor`, `vox`, `fablelous`.

## 3.2 Frontmatter and body shape

Follow the cz/uk/en shape. Minimal set written by the scaffold and the pipeline:

```yaml
date, entry_id, carnet, location,
marie_age: {years, months, days},
metrics: {paragraph_count, word_count, sentence_count_original, sentence_count_translated, has_original, has_translation},
entities: {people, places},
translation_complete, opus_reviewed, editor_approved, conductor_approved,
redaction_passes: [ ... ]   # optional FAB/VOX
```

Body per paragraph: `%% NNN.PPPP %%`, glossary tags, RSR/LAN comments, verbatim French in `%% … %%`, then target text, then TR/OPS/RED/CON comments. Glossary links from a translation use `../../_original/_glossary/…`. Footnotes `[^NNN.PPPP.n]` are identical across trees; new footnotes are created source-side in `_original` and propagated with `just sync`.

## 3.3 Scaffold, sync, verify

```bash
just scaffold 001 -l es --dry-run   # preview: files, TODO paragraph counts, no writes
just scaffold 001 -l es             # create content/es/001/*.md (TODO_PLACEHOLDER bodies)
just sync 001 es                    # re-copy RSR/LAN after _original changes (tree must exist)
just verify-carnet es 001           # IDs, %% balance, frontmatter (exits 2 if dir missing)
just check-comments es              # comment structure (tree NAME, not a path)
just check-links es 001             # relative .md links resolve
/project-status bootstrap es        # PROGRESS.md / per-carnet READMEs from docs/templates
```

`scaffold` accepts any language code; nothing validates it against a registry. `sync`, `verify-carnet`, `check-links` refuse a missing tree with a clear message.

**Known scaffold/verify mismatches (found in the es pilot, 2026-09-05)** — expect these on a fresh scaffold until fixed:

1. **Frontmatter**: `scaffold` writes `status: translation_pending`, but `verify-carnet` requires the `translation_complete` key, so every freshly scaffolded file fails the frontmatter check until TR edits it. Fix one side: have the scaffold write `translation_complete / opus_reviewed / editor_approved / conductor_approved: false` (also closes the WATCHLIST "missing `conductor_approved`" gap), or have `verify-carnet` accept `status` on placeholder files (`src/shared/src/utils/scaffold.ts`, `src/scripts/verify-carnet.ts`).
2. **Multi-line `%%` block**: a multi-line source paragraph (e.g. 001.0001, a markdown heading plus "Carnet N° 1") is copied as a two-line French block, which `check-comments` flags as "multi-line %% block (interior leaks as visible text)". en/cz/uk drop the date-heading line and keep a single line. The scaffold should join the lines with a space or drop leading heading lines; until then, fix by hand in the first entry.
3. **`just check-comments` takes tree names** (`es`, `cz en`), not paths. `content/es` is silently wrong.
4. **Footnote definitions without references**: the scaffold copies `[^…]:` definitions but the placeholder body has no in-text calls, so `verify-carnet` reports a footnote failure per placeholder file until TR wires them (44 failures across 17 untranslated files in the es pilot). Expected and noisy; read the verify output per file, or filter to the entries you have translated.

`check-comments` also cannot run from the translator/editor/conductor agent types (no Bash); the lead runs the gates between stages.

## 3.4 Closed language lists to extend

None of these fail loudly for an unknown code; they simply skip it. Extend every one when adding a language. (Line numbers as of 2026-09-05; grep the identifier if they have moved.)

**Shared library (`src/shared/src`)**

| File | What |
|------|------|
| `utils/glossary-merge.ts:17` | `TRANSLATION_DIRS = ['cz','uk','en','fr']` — primary list; consumed by `glossary-references.ts`, re-exported from `utils/index.ts` |
| `parser/frontmatter.ts:169-177` | `detectLanguage()` if/else chain over `/cz/ /en/ /uk/ /fr/`, else `'original'` |
| `constants/languages.ts:32-41` | `LANGUAGE_DIRS` registry (incomplete already; `LANGUAGE_TAGS.Spanish = 'es'` there is in-text tagging, not a target) |
| `utils/scaffold.ts:42` | default `targetLanguage: 'cz'` only — free-form, no change needed |

**Frontend (`src/frontend/src`)** — see Parts 1–2, plus the hardcodes the Part 2 steps do not mention:

| File | What |
|------|------|
| `lib/diary-lang-config.ts:35, 91-96` | `DIARY_LANGUAGES`, `HREFLANG_BY_URLPATH` |
| `i18n/index.ts:7-16, 43-44, 139, 145, 182, 202` | `SupportedLocale`, `SUPPORTED_LOCALES`, `LOCALE_NAMES`, locale→content map, `activeTranslations`, three `(cz\|original\|en\|uk\|fr)` regexes |
| `i18n/astro.ts:2-7, 62` | duplicate union + `supported` |
| `i18n/locales/*.json` | new `{lang}.json` + key `translation.{language}` in every locale file |
| `pages/data/i18n/[locale].json.ts`, `pages/data/this-day/[lang]/[date].json.ts:20` | `LOCALES`, `LANGUAGES` |
| `pages/[lang]/index.astro:56-59`, `pages/[lang]/000/index.astro:41`, `lib/content.ts:1372` | translation cards, `checkLang` loop, `translationDirs` |
| `pages/home/[lang].astro`, `pages/[lang]/{marie,about,privacy}.astro` | duplicated `localeToContent` maps + hardcoded `getStaticPaths` + `/cz/` fall-throughs (bug class seen in fb35b2869) |
| `pages/{index,about,privacy,marie,404}.astro`, `layouts/BaseLayout.astro:100,139,193` | client-side detection stubs, og:locale, JSON-LD `inLanguage` |
| `components/reading/{LanguageSwitcher,ContentLanguageSwitcher}.vue` | `ALL_LANGUAGES` |
| `components/layout/LocaleSwitcher.vue:62`, `components/glossary/GlossaryCategoryBrowser.vue:4-7` | regex; locale JSON imports |
| `astro.config.mjs:202,217,233` | PWA/Workbox `urlPattern` regexes |

**Scripts (`src/scripts`)**

| File | What |
|------|------|
| `project-status.ts:217` | `['cz','en','uk','fr']` |
| `fix-midline-paragraph-ids.ts:35` | `TRANSLATION_DIRS` |
| `check_links_repo.py:33`, `check_comment_structure.py:33`, `fix-inline-comments.py:29` | `TREES` |
| `propagate_glossary_tag.py:32` | `--langs` default |
| `glossary-dedup.ts:170`, `glossary-migrate-flat.ts:189` | `langDirs` |
| `hooks/bootstrap-readmes.ts:129` | language-name map (cz/en only) |
| `verify-carnet.ts:58` | `CYRILLIC_LANGS` — only for Cyrillic targets |

**Justfile** — `default_lang := "cz"` (line 8) and the `translate/review/conduct/pipeline` recipes default `lang="cz"`; the comment "ALL five trees" near `check-links-repo` and the help examples (~758-761) enumerate languages. No validation of the `lang` argument.

**Skills and agents (`.claude/`)**

| File | What |
|------|------|
| `skills/opus-editor/SKILL.md:11` | "Czech (cz), Ukrainian (uk), English (en), French modern edition (fr)" |
| `skills/report-triage/SKILL.md:48,72` | "all five versions (_original + cz/uk/en/fr)" |
| `skills/glossary/SKILL.md:266` | `content/{cz,en,uk,fr}/` brace expansion |
| `skills/workflow-architect/SKILL.md:235` | "across cz/uk/en/fr" |
| `skills/executive-director/SKILL.md:488` | per-language quality plateaus (new language has no baseline until its pilot report) |
| `skills/frontend-dev/SKILL.md` | many enumerations (:15,20,53,69-70,104,164,177,229,287,339) + its own "Add a new content language" at :298 |
| `agents/{translator,conductor,editor}.md` | legacy Czech-hardcoded descriptions ("cz/uk/en/fr") |
| `WORKER_CONFIG.yaml.template:8-10` | already anticipates `es` |

**Docs and reports**

| File | What |
|------|------|
| `CLAUDE.md:13`, `README.md:17,186`, `src/frontend/CLAUDE.md:118,256-257` | target-language lists |
| `content/CLAUDE.md` | tree diagram + Related Documentation list |
| `content/Style.md` "Language-Specific Guidelines" | list of per-language guides |
| `.claude/reports/WATCHLIST.md` | add a `### {Language}-Specific` section once the first run report exists (Ukrainian's is at ~:174) |
| `.claude/reports/README.md:25-55` | report naming `YYYY-MM-DD-{lang}-{carnets}.md`, frontmatter `target_language: {lang}` required |

## 3.5 Pilot before wave

Do not schedule a wave on a fresh language. Pick one small early carnet with RSR+LAN complete and cz/uk/en conductor-approved (001 qualifies), scaffold it, run TR → OPS → RED → CON on a first slice of ~5 entries, run the three checks from 3.3, file a run report, and let the human settle the language's open style decisions (for Spanish: `vosotros` vs `ustedes`, Russian-name transliteration, UI-locale timing) before carnet 002. The pilot plan template lives in `content/es/PROGRESS.md`.

## 3.6 Consolidated checklist — content tree and pipeline

- [ ] `content/{lang}/CLAUDE.md` with `## Editor / review traps ({Language})`, style guide, review prompts
- [ ] `content/{lang}/PROGRESS.md` (all zeros + pilot plan) and `content/{lang}/TranslationMemory.md` (policy seed rows)
- [ ] `just scaffold NNN -l {lang} --dry-run` shows the expected file count, no errors
- [ ] Shared: `TRANSLATION_DIRS`, `detectLanguage()`, `LANGUAGE_DIRS`
- [ ] Scripts: `project-status.ts`, `fix-midline-paragraph-ids.ts`, the three Python `TREES`, `propagate_glossary_tag.py`, `glossary-dedup.ts`, `glossary-migrate-flat.ts`, `hooks/bootstrap-readmes.ts`
- [ ] Justfile comments/help examples; decide whether `default_lang` stays `cz`
- [ ] Skills: `opus-editor`, `report-triage`, `glossary`, `workflow-architect`, `executive-director` plateaus, `frontend-dev`; legacy `.claude/agents/*.md`
- [ ] Docs: root `CLAUDE.md`, `README.md`, `content/CLAUDE.md`, `content/Style.md`, `src/frontend/CLAUDE.md`
- [ ] Frontend: Parts 1–2 plus the extra hardcodes table in 3.4
- [ ] `/project-status bootstrap {lang}` runs; `just verify-carnet {lang} NNN`, `just check-comments {lang}`, `just check-links {lang} NNN` pass on the pilot carnet
- [ ] Pilot run report filed; `WATCHLIST.md` section created; quality baseline handed to executive-director
