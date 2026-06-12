# Canonical Paragraph Format Specification

**This is the authoritative reference for paragraph formatting in all Marie Bashkirtseff files.**

## Paragraph ID Format

The current standard ID is `%% CCC.PPPP %%` — 3-digit carnet number, dot, 4-digit zero-padded paragraph number, with spaces inside the markers:

```
%% 001.0020 %%
%% 081.0003 %%
```

IDs are sequential across the ENTIRE carnet (they never reset per entry).

**Legacy formats (caveat):** a few older/unmigrated files still carry 2-digit IDs (`%% 01.20 %%`) or the old `[//]: # (NN.XXXX)` comment style, and old-style `[//]: # (...)` research comments survive inside some otherwise-migrated files. When editing such a file, follow what the file actually uses for paragraph IDs — but all NEW annotations always use the `%% ... %%` comment format.

## Original Files (content/_original/)

### Correct Format:
```
%% CCC.PPPP %%
%% [#Tag1](../_glossary/category/TAG1.md) [#Tag2](../_glossary/category/TAG2.md) %%
%% YYYY-MM-DDThh:mm:ss LAN: linguistic annotation %%
%% YYYY-MM-DDThh:mm:ss RSR: research note %%
%% YYYY-MM-DDThh:mm:ss RED: editor note %%
%% YYYY-MM-DDThh:mm:ss CON: conductor note %%
Original French text here...

%% CCC.PPPP+1 %%
Next paragraph block...
```

### Critical Rules:
1. **NO blank lines within a paragraph block**
2. **ONE blank line between paragraph blocks**
3. Paragraph ID is ALWAYS the first line of the block
4. Order within block: ID → Tags → LAN → RSR → RED → CON → Text
5. ALL annotations come BEFORE text, never after
6. Spacing in ID: `%% CCC.PPPP %%` (spaces around number)
7. Glossary tags may span several `%%` lines (e.g. theme tags each on their own line) — all tag lines go between the ID and the annotations

### Example:
```
%% 001.0020 %%
%% [#Nice](../_glossary/places/cities/NICE.md) [#Duke_of_Hamilton](../_glossary/people/core/DUKE_OF_HAMILTON.md) %%
%% 2025-12-07T10:00:00 LAN: "promenade" - fashionable walk %%
%% 2025-12-07T16:00:00 RSR: Duke first mentioned, Marie age 12 %%
A la promenade, j'ai vu le duc de Hamilton.

%% 001.0021 %%
%% [#Boreel](../_glossary/people/recurring/BOREEL.md) %%
%% 2025-12-07T10:05:00 LAN: "ne m'amuse plus" - no longer entertains me %%
Boreel ne m'amuse plus.
```

## Translation Files (content/{lang}/)

**CRITICAL — glossary path depth**: translation files live one level deeper than originals, so every glossary tag must use `../../_original/_glossary/…`, NOT the source's `../_glossary/…`. Copy the source's tag lines verbatim and change ONLY the path prefix. Source-depth paths in translations have repeatedly produced 1,500+ broken links per carnet (invisible to a reading review — run `just verify-carnet {lang} {carnet}`).

### Correct Format:
```
%% CCC.PPPP %%
%% [#Tag1](../../_original/_glossary/category/TAG1.md) [#Tag2](../../_original/_glossary/category/TAG2.md) %%
%% YYYY-MM-DDThh:mm:ss LAN: linguistic note (copied from original) %%
%% Original French paragraph text — copied VERBATIM, never partially translated %%
%% YYYY-MM-DDThh:mm:ss TR: translation decision note %%
%% Previous translation version - if revising %%
Translated text in target language

%% CCC.PPPP+1 %%
%% [#tags] %%
%% annotations %%
%% Next French paragraph %%
Next translated paragraph
```

### Rules for Translation Files:
1. ID comes FIRST (same as original files)
2. Tags line(s) follow ID — same tag set as the source, only with the deeper `../../_original/_glossary/` path
3. Annotations (LAN copied from source, TR added by translator) are comment lines within the block
4. French text is IN COMMENT, copied verbatim from the source
5. Previous translation versions IN COMMENTS
6. Current translation is VISIBLE text at the end
7. Empty line between paragraph clusters

## Common Errors to Avoid

❌ **WRONG - Extra blank lines within block:**
```
%% 001.0020 %%

%% [#tags] %%

%% LAN comment %%

Text
```

❌ **WRONG - ID on same line as text:**
```
%% 001.0020 %% Text here
```

❌ **WRONG - Annotations after text:**
```
%% 001.0020 %%
Original text
%% RSR: comment %%
```

❌ **WRONG - No space in ID:**
```
%%001.0020%%
```

❌ **WRONG - Reviewer comment spliced into a body line (splits the paragraph, renderer may drop the tail):**
```
Translated text begins %% 2026-06-11T10:00:00 RED: fix %% and continues here
```

✅ **CORRECT - Consolidated block:**
```
%% 001.0020 %%
%% [#tags] %%
%% annotations %%
Text

%% 001.0021 %%
```