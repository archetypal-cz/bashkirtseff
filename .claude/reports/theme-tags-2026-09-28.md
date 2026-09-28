# Theme tags: weather, clothing, shopping, church, money, property (2026-09-28)

Agent: theme-tags (Opus 5.5), for team-lead. Commits (not pushed):
`19fad8a12` glossary entries, `fd378fba1` pilot on carnet 014, `f58187d50` propagate-tag fix, `18d28f17f` first version of this report, then one commit for the owner's revision (OWNERSHIP → PROPERTY, whose-money qualifiers, see §2b), which also updates this report.

## 1. How theme tags work today

**Storage.** A theme is an ordinary glossary entry in `content/_original/_glossary/culture/themes/`. It is applied **per paragraph**, as a tag comment line under the paragraph ID, exactly like people and places:

```
%% 014.0284 %%
%% [#Weather](../_glossary/culture/themes/WEATHER.md) %%
```

Themes are **not** stored in frontmatter (`entities:` holds people and places only). Translation trees carry the same line with the `../../_original/_glossary/` prefix.

**How the existing themes were applied.** 16 of the 20 themes were tagged by `src/scripts/theme-tagger.ts` (`just theme-tag`), a French **keyword-regex** tagger (FOURTH_WALL, META_DIARY, MUSIC_THEME, READING, RELIGION, THEATER_THEME, ART_PRACTICE, LOVE, PHILOSOPHY, EMOTIONS, POLITICS, HEALTH, DEATH, MORTALITY, DISEASES). MARRIAGE came from a separate pass (`7ddd46bfb`). This favours recall over precision: LOVE sits on 3,818 paragraphs. **FOOD, FASHION, TRAVEL and ANIMALS were written on 2026-02-10 but never added to the tagger's `THEMES` list**, so before this pilot they tagged 0 paragraphs (the only link to FASHION came from THEATER_THEME.md).

**Frontend.**
- `src/frontend/src/lib/filter-index-builder.ts` reads the inline tags with a regex on `/_glossary/culture/themes/X.md`. The theme ids are whatever `.md` files sit in `culture/themes/`, so a new file becomes a theme automatically. Themes are aggregated **per entry** (`record.th`). The picker lists a theme once it appears in 2 or more entries (`MIN_TAG_COUNT`).
- The display name is built from the **file id** (`formatDisplayName`: `FASHION` → "Fashion"), not from the glossary `name:`, and it is **not localized**: Czech readers also see "Fashion" and "Weather". There are no theme strings in `i18n/locales/*.json`.
- "Show in diary" (`pages/[lang]/glossary/[id].astro`) maps any `culture/themes/*` entry to the `themes` filter category. `EntryContent.vue` then highlights the matching paragraphs using the **paragraph's own glossary tags in that language's file**. Tags therefore have to be propagated into every translation tree, or the paragraph highlight is empty in that language.
- There is only one glossary tree (`content/_original/_glossary`; `getGlossaryPath` would read `content/{lang}/_glossary`, but none exists). The **new entries need no cz/uk/en/fr counterparts**, which is consistent with the existing themes.
- Check: building the filter index with the pilot in place lists FASHION 20 entries, WEATHER 11, SHOPPING 9, CHURCH 5, MONEY 5, PROPERTY 3, MONEY_OTHERS 3, MONEY_FAMILY 2, PROPERTY_FAMILY 2, PROPERTY_OTHERS 2 (entry counts; 093 included).

**Propagation tooling.**
- `just propagate-tag --target culture/themes/X.md --display X [--apply]` (`propagate_glossary_tag.py`) is the **scoped** tool. It handles one target, adds lines and never removes them, and localizes the path per tree. It has no carnet filter, but it only touches paragraphs whose source carries the tag, so while the new themes exist only in the pilot carnet it cannot reach outside it. I used it.
- `just tag-sync LANG CARNET` (`tag_sync.py`) copies **every** tag that is missing from a translation paragraph. That is the "union of all tags" pattern the memory note warns against. It is safe only when the translation carnet is otherwise already in sync. Don't use it for theme rollouts.
- **Fixed (`f58187d50`).** propagate-tag inserted its line between the ID and a `%% kind: clipping|letter … %%` marker, breaking the rule that the marker sits directly under the ID. It now skips that line. Tested on a synthetic clipping. This matters for 659 kind-marked paragraphs corpus-wide.
- `glossary-tagger.ts` (alias scanner) also scans theme aliases. The new aliases are English display names only ("Weather", "Money", "Church", "Clothing"…), so they can match only Marie's rare English, and those matches still go to AI evaluation. I deliberately gave them no French cue words as aliases, which would turn the scanner into keyword spam.

## 2. Definitions (glossary entries, commit `19fad8a12`)

Each entry has the house layout (frontmatter, `GLO_` IDs, description, **Tagging Criteria**, Common French Cues, Notable Patterns, RSR note):

| Tag (display) | File | Tag it when | Don't tag |
|---|---|---|---|
| Weather | `WEATHER.md` | The actual weather that day or night is noted, or weather changes the plans | Figurative (*orage* of feelings, *le temps* = time), general remarks about a climate, pasted clippings |
| Fashion (= **clothing**) | `FASHION.md` (existing; added the `Clothing` alias and criteria) | What she or others wear, a dress or hat described, the outfit note "(robe brune, bien)", a fitting or order at the dressmaker's, judging someone's toilette | A bare "je m'habille"; *toilette* meaning washing (see `daily_life/TOILETTE.md`) |
| Shopping | `SHOPPING.md` (name "Shopping & Errands") | A purchase or order, going to shops, errands, fittings | A dress only worn; a price with no buying; figurative *acheter* |
| Church | `CHURCH.md` (name "Church Attendance") | She or the family actually attended (mass, vespers, Orthodox liturgy, Te Deum, confession or communion, a priest's service at home, praying inside a church) | Prayer at home, faith or doubt (those are RELIGION), a church as a monument, church in a simile, a plan that didn't happen |
| Money | `MONEY.md` | Cash, prices, sums, spending, debts, allowances, gambling stakes, wealth or poverty stated as money | Figurative value; a purchase with no money in view |
| Property | `PROPERTY.md` (name "Property & Investments"; was OWNERSHIP) | Estates, land, houses, inheritance and wills, dowry, shares and capital, lawsuits over property | Everyday belongings; a rented room or villa only as an address |
| Money: family / others | `MONEY_FAMILY.md`, `MONEY_OTHERS.md` | Qualifier: whose money (Marie's or her family's vs someone else's or in general); always together with Money | — |
| Property: family / others | `PROPERTY_FAMILY.md`, `PROPERTY_OTHERS.md` | Qualifier: whose property; always together with Property | — |

**CLOTHING: I made it an alias, not a new entry.** FASHION ("Fashion & Dress") already defined exactly this theme and had 0 uses, so a second entry would only have split it. **Decision for KRR:** the filter shows "Fashion", because names come from the file id. If "Clothing" should be the visible label, renaming `FASHION.md` → `CLOTHING.md` is cheap now: 97 pilot lines plus 1 glossary link. After a corpus-wide pass it would not be.

**MONEY / OWNERSHIP plan: not found** (superseded by the owner's input, §2b). I searched docs/, .claude/reports/, issues_plan.md, the WORKPLAN files, `git log --all` (all branches plus the stash), the memory directory, and every Claude session transcript for this project. None contains an earlier plan. The only hit is KRR's message in this session ("…beside the money and ownership tags we planned recently"). If the plan exists, it is outside the repo (the Obsidian vault or another conversation). The first definitions were therefore my proposal; KRR has since given the definitions in §2b.

## 2b. Owner revision: PROPERTY and the "whose" dimension

KRR's input, which replaces the proposal:
- **MONEY** covers talk about cash, prices, spending, debts, allowances and gambling.
- **PROPERTY** replaces OWNERSHIP and covers investments, estates, land, houses, inheritance, dowry, shares.
- Both get a second dimension: **whose** money or property it is, own/family vs others/in general.

I chose the id `PROPERTY` (display "Property & Investments"). `OWNERSHIP.md` was renamed to `PROPERTY.md` and redefined, and everyday possessions dropped out of scope.

**How the whose-dimension is encoded: qualifier tags as their own theme files, carried alongside the parent tag.**

```
%% 093.0025 %%
%% [#Money](../_glossary/culture/themes/MONEY.md) %%
%% [#Money_family](../_glossary/culture/themes/MONEY_FAMILY.md) %%
%% [#Property](../_glossary/culture/themes/PROPERTY.md) %%
%% [#Property_family](../_glossary/culture/themes/PROPERTY_FAMILY.md) %%
```

The rule: every Money paragraph gets `Money` plus `Money_family` and/or `Money_others`; the same for Property. That makes four new files: `MONEY_FAMILY`, `MONEY_OTHERS`, `PROPERTY_FAMILY`, `PROPERTY_OTHERS`.

Why this and not the alternatives (checked against the code):
- **A qualifier inside the link, e.g. `MONEY.md#family`: rejected.** `filter-index-builder.ts` extracts the id with `/culture\/themes\/([^)]+)\.md\)/`, which requires `.md)`. An anchor would stop the paragraph from being indexed at all. The paragraph parser (`content.ts` `extractGlossaryTags`) uses the same `.md\)` ending, so the paragraph highlight would miss it too. Supporting it needs changes in the builder, the parser, the filter store and the glossary page.
- **Leaf sub-tags only (no parent line): rejected.** The filter store ORs tags *within* a category (`stores/filter.ts`), so "all money" would still work by picking both leaves. But the glossary page's "Show in diary" button filters by the page's own id, so MONEY.md would find nothing. It would also need a code change.
- **A generic qualifier tag (`FAMILY` / `OTHERS`) combined with Money: rejected.** Both would sit in the same `themes` category and be ORed, so "Money AND family" cannot be expressed.
- **Parent + qualifier as separate files: chosen.** It needs **no frontend change**. Each file becomes a selectable theme automatically. "Money" alone shows every money paragraph, "Money Family" narrows to one side, and "Show in diary" works on all six glossary pages. Paragraph highlighting matches by tag id in every tree. The cost is one extra comment line per tagged paragraph.
- **Cosmetic limits.**
  - The filter shows the ids as "Money Family" / "Property Others", since `formatDisplayName` works from the file id, not the `name:` field.
  - The picker lists a qualifier only once 2 entries carry it (`MIN_TAG_COUNT`). All four already qualify.
  - Showing the qualifiers nested under their parent would be a small frontend improvement (for example a `sub` value for themes). It is not needed for the filter to work.

**What changed in the pilot.**
- Removed the 5 Ownership lines in all five 014 trees.
- **Property** on 014.0064, 0109, 0162, 0163: family = 0109 (papa's will); others = 0064, 0162, 0163 (Hamilton's stable sale, Lady Mary as an heiress).
- **Money qualifiers**: family = 0141 (maman at the Monaco tables); others = 0189, 0272, 0322 (Hamilton's wealth, the princess's 100-franc tree, "un richissime duc").
- **093.0025**, requested in a reader report via triage, now carries Money, Money_family, Property and Property_family. This is in `_original`, cz, en and fr. **uk/093 was left untouched** because that range is owned by the uk rebuild/cloud work; the uk tree needs these 4 lines once that work lands (`just propagate-tag … --langs uk` for the four targets).

**Gates after the revision.**
- 014: `verify-carnet` PASS in all five trees (the 23 id-alignment warnings in cz/uk/en already existed); `splicescan` empty; `check-links` OK.
- 093 (`_original`, cz, en, fr): `verify-carnet` PASS, `splicescan` empty, `check-links` OK.
- `glossary-missing`: 0.

## 3. Pilot: carnet 014 (Nice, 10 Dec 1873 – 1 Jan 1874)

I chose 014 because it is small (354 paragraph IDs), daily-life rich, and outside every rebuild range. I read all 331 visible paragraphs myself and assigned the tags by judgement, one line per tag after the existing tag block. Then I propagated with propagate-tag, one target at a time, into cz/uk/en/fr (es has no 014).

| Tag | Paragraphs | Entries |
|---|---|---|
| Fashion | 54 | 20 |
| Weather | 15 | 11 |
| Shopping | 13 | 9 |
| Church | 6 | 5 |
| Money | 4 | 4 |
| Property | 4 | 3 |
| **Total (first version)** | **97 tags on 70 paragraphs** (21 % of visible paragraphs) | |

First version: exactly +97 / −0 lines in each of `_original`, cz, uk, en and fr. The revision removed the 5 Ownership lines and added 12 (Property ×4, the four qualifiers ×8) in every tree; the Money/Property qualifiers are itemised in §2b.

**Gates.** Results are identical to the pre-pilot baseline. `verify-carnet` PASS in all five trees (the 23 warnings in cz/uk/en already existed: the missing 014.0354 id-alignment). `splicescan` is empty in all five. `check-links` is OK in every tree (e.g. `_original` 639 → 736 links). `glossary-missing`: 0.

### Examples (3 per tag)

- **Weather.** 014.0181 "La journée à Nice était grise, presque pluvieuse, à Monaco très claire." · 014.0262 "Il pleuvait beaucoup ce matin mais vers midi un soleil charmant." · 014.0308 "Il fait terriblement froid, si froid que mon nez était rouge."
- **Fashion.** 014.0197 the Galve ladies' "jaquette grise, jupe unie, tunique, jaquette deux rangs de boutons" · 014.0237 Gioia's "bottines jaunes" · 014.0196 "Je n'ai pas mis de corset pour voir…"
- **Shopping.** 014.0113 the expedition to Manby's: "j'ai commandé un conspirator un bleu foncé" · 014.0122 "j'entre chez Delbecchi et j'achète une plume en or" · 014.0284 "je courai chercher un éventail, j'en veux un ancien chinois ou Louis XV"
- **Church.** 014.0078 "Nous allons à l'église à pied (robe brune, bien)" · 014.0139 "Maman et Dina étaient à l'église, c'est notre Saint Nicolas" · 014.0226 "Je reviens de l'église anglaise où j'étais avec Dina et Hitchcock"
- **Money.** 014.0141 the Monaco gaming room: "elle jouait pièces après pièces" · 014.0272 the Christmas tree "qu'elle a pris au London House pour cent francs" · 014.0189 "Je m'imaginais que le duc de Hamilton était ruiné lorsqu'il était plus riche que jamais"
- **Property.** 014.0109 papa "parle de testament… maman et ma tante n'auront rien" (family) · 014.0163 "La vente de l'écurie du duc a eu lieu" (others) · 014.0162 Lady Mary Montagu, "une des plus riches… héritières du Royaume Uni" (others) · outside the pilot, 093.0025 "la fameuse vente d'un bien de Russie qui doit me donner un capital de six cent mille francs" (family; Money too)

### Precision self-check

On a second pass I rate about 85 of the 97 tags clear-cut. About 12 are defensible but borderline:
- Fashion 0325 (only "chez Monier") and 0328 ("salement habillés")
- Shopping 0251 and 0302 (food ordered or fetched at London House)
- Weather 0285 (the wind ruffles Gioia)
- Money 0189 and 0322 (wealth remarks, not sums)
- Property 0064/0163 (the sale of Hamilton's racing stable, treated as the sale of an asset). The first version's Ownership tags on 0003 ("appartenant à moi") and 0242 (a hired landau) were dropped when the owner narrowed the scope to property and investments.

Estimated precision is **about 88 % strict, about 100 % lenient**.

Deliberately left untagged (recall trade-offs):
- 0149 "plus changeante que le temps. Le matin, beau, l'après-midi tempête…": reads as a mood simile.
- 0056, 0114–0115: weather and wedding jewels inside pasted English clippings.
- 0125: a "parure" given as a present.
- 0160: the Galves' "toilettes" mentioned in passing.
- 0264: the "mauvais temps" in her sketch of a typical Nice season, not that day.
- 0312: Raynaud et Bussi, where the kind of shop is unknown.
- 0169: the gold pen valued for being gold.

Clippings are the main open policy question. Should a pasted clipping carry theme tags? I said no, to keep the tags about Marie's own notes.

## 4. Proposed corpus-wide pass

**Scale.** 47,841 paragraph IDs, about 9.8 M characters of visible French (about 2.8 M tokens). 014 is about 1/100 of that.

**Method, per carnet.**
1. Dump the visible text by paragraph ID (clippings excluded, or flagged if KRR wants them tagged).
2. One reader subagent per carnet, or per ~150 k characters for the big carnets (Sonnet is adequate; Opus for the dense later carnets). It gets the six Tagging Criteria sections verbatim and returns JSON `{TAG: [ids]}`, with a `family`/`others` verdict for each Money and Property paragraph, no keyword pre-filter. Reading everything costs little more and avoids the regex-recall bias of `theme-tagger.ts`.
3. An adversarial check of the positives only (about 20 % of paragraphs): a second agent sees each tagged paragraph plus its criteria and may veto. That should push strict precision above 90 %.
4. Apply to `_original` with a small scoped script (the pilot's `apply_themes.py` logic: after the ID, the kind marker and the tag block, additive only). It is worth adding as `src/scripts/apply_theme_tags.py` + a `just` recipe before the wave.
5. Propagate with `just propagate-tag` per tag. Because it is corpus-wide, scope the rollout by running a batch of carnets, propagating, gating, and committing per tome. Never use `tag-sync` for this.
6. Gates per carnet and tree: `verify-carnet`, `splicescan`, `check-links`; then `glossary-missing` 0.

**Cost estimate.** Roughly 3 M input tokens for reading, +25–30 % for the veto pass, plus per-agent overhead of about 20 k × ~130 agents. That gives **about 6–7 M input tokens** and well under 1 M output tokens. At 8–10 agents in parallel that is about half a day wall-clock. **Expected yield is about 6,000–13,000 tags.** The pilot rate is 0.27 tags per paragraph, but Fashion is densest in the Nice 1873–74 carnets and should thin out in the atelier years, while Money and Property should rise in the Russia and estate carnets (1876, 077–080).

**Ordering.**
- The carnets being rebuilt must go through their rebuild waves first: 031–044, 062 and 065–074, plus the uk 082–097 work.
- `rebuild-carnet` moves tag lines with their clusters, so tags would survive it, but tagging a carnet whose paragraph set is still changing wastes the read.
- Start with the Nice carnets 001–030 (highest Fashion and Weather density, a good second calibration), then 045–061 and 075–106, and the rebuild ranges last.

**Before the wave, decide:**
1. FASHION vs a renamed CLOTHING label.
2. Whether pasted clippings get theme tags.
3. Whether theme display names should be localized in the filter. Today they are English for every language, which the new everyday themes make more visible.
