# content/ — Diary Content

This directory contains all diary content: French originals and translations.

## Structure

```
content/
├── _original/           # French source materials
│   ├── 000/             # Carnet 000 (Marie's preface, May 1884)
│   ├── 001/-106/        # Carnets 001-106 (diary entries)
│   ├── _glossary/       # Entity definitions
│   ├── _carnets/        # Carnet metadata
│   ├── _summary/        # Book summaries
│   └── _workflow/       # Machine state (JSON)
│
├── cz/                  # Czech translations
│   ├── CLAUDE.md        # Czech-specific guidance
│   ├── PROGRESS.md      # Overall Czech status
│   ├── 000/-106/        # Translated entries
│
├── uk/                  # Ukrainian translations
│   ├── CLAUDE.md        # Ukrainian-specific guidance
│   ├── PROGRESS.md      # Overall Ukrainian status
│   └── 000/-106/        # Translated entries
│
├── en/                  # English translations
│   ├── CLAUDE.md        # English-specific guidance
│   ├── PROGRESS.md      # Overall English status
│   └── 000/-106/        # Translated entries
│
├── fr/                  # French modern edition
│   ├── CLAUDE.md        # French edition guidance
│   ├── PROGRESS.md      # Overall French status
│   └── 000/-106/        # Edited entries
│
└── es/                  # Spanish translations (pilot: carnet 001, slice 1 done 2026-09-05)
    ├── CLAUDE.md        # Spanish-specific guidance
    ├── PROGRESS.md      # Overall Spanish status
    ├── TranslationMemory.md
    └── 001/             # Translated entries (further carnets scaffolded as the pilot expands)
```

## Entry File Format

Every entry follows this structure:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
entities:
  people: [Howard_family, Maman]
  places: [Nice, Promenade_des_Anglais]
workflow:
  research_complete: true
  linguistic_annotation_complete: true
---

%% 001.0001 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
%% 2025-12-07T16:00:00 RSR: First entry of the diary... %%
%% 2025-12-07T17:00:00 LAN: "superbe" - radiant/glorious weather, not "superb" in the modern sense %%
Samedi 11 janvier 1873. Il fait un temps superbe...

%% 001.0002 %%
Next paragraph...
```

## Paragraph IDs

Format: `%% XXX.YYYY %%`

- `XXX` = 3-digit carnet number (001-106)
- `YYYY` = 4-digit sequential paragraph number

**Critical**: IDs are sequential across the ENTIRE carnet, never resetting between entries.

## Clippings, letters, struck and marginal text, drawings

`_original` holds everything Marie put in her notebooks (owner decision 2026-09-27). A pasted newspaper clipping, a copied letter, a whole struck-out paragraph or a marginal note is its own paragraph with a kind marker directly under its ID, the same line in every tree:

```markdown
%% 068.0456 %%
%% kind: clipping source="Le Figaro, 12 février 1877" %%
%% [#Press_clipping](../_glossary/culture/newspapers/PRESS_CLIPPING.md) %%
> Hier soir, à l'Opéra, …
```

Kinds: `clipping`, `letter` (both quoted with `> `), `rayé`, `margin`, `cover` (text on the notebook's cover or front pages, in the carnet's cover entry `<first-entry-date>-cover.md`, which sorts before the first dated entry), `editorial` (the editors' bracketed notes on the physical manuscript), `other`. Words struck inside a paragraph stay inline as `[Rayé: …]`. Drawings from the scans are listed in the entry's frontmatter under `drawings:` (images in `src/frontend/public/images/marie/drawings/<carnet>/`). Full convention: `docs/REBUILD_CARNET.md`, "Paragraph kinds" and "Drawings".

Passages Marie wrote in Russian (the printed edition gives the editor's French translation between ★ and *) are marked `==passage==[^CCC.NNNN.rK]` with the footnote «Written in Russian in the manuscript; French translation by the editor.», localized in each tree (cz `Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.`, uk `В оригіналі російською; французький переклад видавця.`, fr `En russe dans le manuscrit ; traduction française de l'éditeur.`). Extent comes from the tome docx (★ opens, * closes). Never keep ★ in text (owner ruling 2026-09-29).

### Foreign-language passages: everything translated (owner ruling 2026-10-03)

**Applies to cz, uk, en** (supersedes the cz ruling of 2026-09-29 and the en rule "keep English as-is"). "When reading Czech, we're simply reading Czech": every passage Marie wrote in a language other than the reading language — English, Italian, Latin, Russian, German, and in en also French phrases — is **translated in the running text**; her original wording goes into a footnote. Mark the translated run with `==…==` (as for Russian above), so the reader still sees where she switched languages:

```markdown
cz:  …byl ==podplacen==[^09.05.1] a celá věc…
     [^09.05.1]: Pozn. překl.: V originále anglicky: „bribed“.
uk:  …був ==підкуплений==[^09.05.1]…
     [^09.05.1]: В оригіналі англійською: «bribed».
en:  …it was ==the height of fashion==[^12]…
     [^12]: In French in the original: *le dernier cri*.
```

- The footnote quotes Marie's original exactly (her spelling and mistakes included; not corrected — `_original` is the reference).
- Whole paragraphs/entries in a foreign language keep the existing run note (`Pozn. překl.: V originále anglicky (tento a N následujících odstavců).` / `In English in the original.`); for those the original is available via the original-text toggle, no need to copy it into the footnote.
- Marie's English stays English in **en** (it is already the reading language) — keep the `==…==` + "In English in the original" note there.
- **French left untranslated in a translation** (owner ruling 2026-10-03, reverses en *Bigre!* 2026-09-30): Marie's French tics and phrases kept in French (*Bigre!*, *Pardi!*, *comme il faut*, *Ventre Saint-Gris*, *Mort de ma vie*) are translated too, marked `==…==`, French in the footnote (`Pozn. překl.: V originále francouzsky: „Bigre!“` / `В оригіналі французькою: «…».` / `In French in the original: *Bigre!*`). A tic repeated within one entry: footnote only its first occurrence in that entry; keep one consistent rendering per tree (record it in the TM).
- Editorial marks attached to a foreign run (`[sic]`, `(sic)`) move into the footnote with the original. Transcription slips in `_original` (*Dco juvante*): quote as in `_original` and add the intended form (`tak v textu; zřejmě Deo`).
- Metalinguistic runs (Marie discusses the foreign word itself — grammar, her own mistake, a pun) stay foreign, in italics, with an explanatory footnote.
- Footnote marker sits right after the closing `==`, before punctuation: `==…==[^n],`. Footnote definitions follow the file's existing placement (after the paragraph's last comment line, or at the end of the file) — never inside a `%%` comment or between a text line and its trailing comments.
- Exceptions: words fully naturalised in the reading language (cz *flirt*, *toaleta*; en *chic*, *ennui*), proper names, titles of works, and quotations whose point is the foreign wording (e.g. a pun) — keep and explain in the footnote if needed.
- An existing footnote that already holds the translation becomes the footnote holding the original; never leave both a foreign run in text and a translation footnote.


## Carnet rebuild / renumbering

IDs are stable: every tree, reader reports, footnote labels, glossary citations and URLs point at them. **No agent renumbers IDs by hand**, and a structural fix that seems to need a shifted ID is reported to the lead.

The one exception (owner decision, 2026-09-27) is a **carnet rebuild** for carnets whose `_original` has missing manuscript paragraphs or paragraphs in the wrong day's file. A plan (JSON) lists every entry file in reading order and the paragraphs it holds; `just rebuild-carnet CCC plan.json --write` moves each paragraph cluster into place in `_original` and every translation tree, inserts the missing French (translations get `TODO`), renumbers the carnet `CCC.0001..N`, resets approval flags of entries whose paragraph set changed, rewrites every reference in the repo, and commits a map under `content/_renumber/` (old→new IDs, SQL for reader reports, URL redirects). `just renumber-check CCC` verifies the result. Spec and plan format: `docs/REBUILD_CARNET.md`.

## Comment Types

All annotations use: `%% YYYY-MM-DDThh:mm:ss CODE: Text %%`

| Code | Role                 | Purpose                                   |
| ---- | -------------------- | ----------------------------------------- |
| RSR  | Researcher           | Historical context, entity identification |
| LAN  | Linguistic Annotator | Translation guidance, idioms              |
| TR   | Translator           | Translation decisions, alternatives       |
| OPS  | Opus Editor          | Language expert review notes              |
| RED  | Editor               | Quality issues, suggestions               |
| CON  | Conductor            | Final approval notes                      |
| FAB  | Fablelous            | Word-level expressiveness polish          |
| VOX  | Voice of the Reader  | Opposing reader-side review               |
| ED   | Executive Director   | Orchestration notes, lead fixes           |
| KRR  | Owner                | Owner's own notes and rulings             |
| GEM  | Gemini (retired 2026-07-08) | Legacy review notes in older entries |
| PPX  | Perplexity (retired) | Legacy notes in older entries             |

## Glossary Links

Format: `%% [#Display_Name](../_glossary/category/FILENAME.md) %%`

- Filenames: CAPITAL_ASCII (uppercase, underscores, no accents)
- Categories: `people/`, `places/`, `culture/` (each with subcategories; languages live under `culture/languages/` — see `_original/_glossary/_categories.yaml`)
- Always use relative paths from entry location

## Progress Tracking

Each carnet has a `README.md` tracking:

- Completion status by phase
- Active TODOs
- Changelog with timestamps

See `/docs/INFRASTRUCTURE.md` for full progress tracking documentation.

## Working with Content

### To research, translate or review

Use the skills (`/researcher`, `/translator`, `/editor`, …) or `/executive-director` for a whole carnet. The headless `just research` / `just translate` / `just pipeline` recipes are obsolete. Gates: `just verify-carnet {lang} {carnet}` and `just splicescan {lang} {carnet}`.

### To check progress

```bash
/project-status cz 001    # Carnet 001 Czech status
```

## Related Documentation

- `/_original/CLAUDE.md` - French source specifics
- `/cz/CLAUDE.md` - Czech translation specifics
- `/uk/CLAUDE.md` - Ukrainian translation specifics
- `/en/CLAUDE.md` - English translation specifics
- `/fr/CLAUDE.md` - French modern edition specifics
- `/es/CLAUDE.md` - Spanish translation specifics (pilot)
- `/.claude/skills/glossary/SKILL.md` - Glossary system
- `/docs/FRONTMATTER.md` - Detailed frontmatter spec
