# Canonical Paragraph Format Specification

**This is the authoritative reference for paragraph formatting in all Marie Bashkirtseff files.**

## Original Files (content/_original/)

### Correct Format:
```
%% BB.PPP %%
%% [#Tag1](../_glossary/category/TAG1.md) [#Tag2](../_glossary/category/TAG2.md) %%
%% YYYY-MM-DDThh:mm:ss LAN: linguistic annotation %%
%% YYYY-MM-DDThh:mm:ss RSR: research note %%
%% YYYY-MM-DDThh:mm:ss RED: editor note %%
%% YYYY-MM-DDThh:mm:ss CON: conductor note %%
Original French text here...

%% BB.PPP+1 %%
Next paragraph block...
```

### Critical Rules:
1. **NO blank lines within a paragraph block**
2. **ONE blank line between paragraph blocks**
3. Paragraph ID is ALWAYS the first line of the block
4. Order within block: ID → Tags → LAN → RSR → RED → CON → Text
5. ALL annotations come BEFORE text, never after
6. Spacing in ID: `%% BB.PPP %%` (spaces around number)

### Example:
```
%% 01.20 %%
%% [#Nice](../_glossary/places/cities/NICE.md) [#Duke_of_Hamilton](../_glossary/people/core/DUKE_OF_HAMILTON.md) %%
%% 2025-12-07T10:00:00 LAN: "promenade" - fashionable walk %%
%% 2025-12-07T16:00:00 RSR: Duke first mentioned, Marie age 12 %%
A la promenade, j'ai vu le duc de Hamilton.

%% 01.21 %%
%% [#Boreel](../_glossary/people/recurring/BOREEL.md) %%
%% 2025-12-07T10:05:00 LAN: "ne m'amuse plus" - no longer entertains me %%
Boreel ne m'amuse plus.
```

## Translation Files (content/{lang}/)

### Correct Format:
```
%% BB.PPP %%
%% [#Tag1](../_glossary/category/TAG1.md) [#Tag2](../_glossary/category/TAG2.md) %%
%% YYYY-MM-DDThh:mm:ss LAN: linguistic note %%
%% YYYY-MM-DDThh:mm:ss TR: translation decision note %%
%% Original French paragraph text %%
%% Previous translation version 1 - if exists %%
%% Previous translation version 2 - if exists %%
Translated text in target language

%% BB.PPP+1 %%
%% [#tags] %%
%% annotations %%
%% Next French paragraph %%
Next translated paragraph
```

### Rules for Translation Files:
1. ID comes FIRST (same as original files)
2. Tags line follows ID
3. All annotations (LAN, TR) follow tags
4. French text is IN COMMENT
5. Previous translation versions IN COMMENTS
6. Current translation is VISIBLE text at the end
7. Empty line between paragraph clusters

## Common Errors to Avoid

❌ **WRONG - Extra blank lines within block:**
```
%% 01.20 %%

%% [#tags] %%

%% LAN comment %%

Text
```

❌ **WRONG - ID on same line as text:**
```
%% 01.20 %% Text here
```

❌ **WRONG - Annotations after text:**
```
%% 01.20 %%
Original text
%% RSR: comment %%
```

❌ **WRONG - No space in ID:**
```
%%01.20%%
```

✅ **CORRECT - Consolidated block:**
```
%% 01.20 %%
%% [#tags] %%
%% annotations %%
Text

%% 01.21 %%
```