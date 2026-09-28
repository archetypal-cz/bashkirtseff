# Theme tags: weather, clothing, shopping, church, money, ownership (2026-09-28)

Agent: theme-tags (Opus 5.5), for team-lead. Commits (not pushed):
`19fad8a12` glossary entries, `fd378fba1` pilot on carnet 014, `f58187d50` propagate-tag fix, plus this report.

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
- Check: building the filter index with the pilot in place lists FASHION 20 entries, WEATHER 11, SHOPPING 9, CHURCH 5, OWNERSHIP 4, MONEY 4.

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
| Money | `MONEY.md` | Prices, sums, payments, debts, allowances, gambling stakes, wealth or poverty stated as money | Figurative value; a purchase with no money in view |
| Ownership | `OWNERSHIP.md` (name "Ownership & Property") | Estates, villas bought or rented, leases, inheritance and wills, a possession that matters because it is owned, given, sold or lost | Every passing "ma chambre" or "mon piano" |

**CLOTHING: I made it an alias, not a new entry.** FASHION ("Fashion & Dress") already defined exactly this theme and had 0 uses, so a second entry would only have split it. **Decision for KRR:** the filter shows "Fashion", because names come from the file id. If "Clothing" should be the visible label, renaming `FASHION.md` → `CLOTHING.md` is cheap now: 97 pilot lines plus 1 glossary link. After a corpus-wide pass it would not be.

**MONEY / OWNERSHIP plan: not found.** I searched docs/, .claude/reports/, issues_plan.md, the WORKPLAN files, `git log --all` (all branches plus the stash), the memory directory, and every Claude session transcript for this project. None contains an earlier plan. The only hit is KRR's message in this session ("…beside the money and ownership tags we planned recently"). If the plan exists, it is outside the repo (the Obsidian vault or another conversation). The definitions above are therefore my proposal.

## 3. Pilot: carnet 014 (Nice, 10 Dec 1873 – 1 Jan 1874)

I chose 014 because it is small (354 paragraph IDs), daily-life rich, and outside every rebuild range. I read all 331 visible paragraphs myself and assigned the tags by judgement, one line per tag after the existing tag block. Then I propagated with propagate-tag, one target at a time, into cz/uk/en/fr (es has no 014).

| Tag | Paragraphs | Entries |
|---|---|---|
| Fashion | 54 | 20 |
| Weather | 15 | 11 |
| Shopping | 13 | 9 |
| Church | 6 | 5 |
| Ownership | 5 | 4 |
| Money | 4 | 4 |
| **Total** | **97 tags on 70 paragraphs** (21 % of visible paragraphs) | |

The diff is exactly +97 / −0 lines in each of `_original`, cz, uk, en and fr.

**Gates.** Results are identical to the pre-pilot baseline. `verify-carnet` PASS in all five trees (the 23 warnings in cz/uk/en already existed: the missing 014.0354 id-alignment). `splicescan` is empty in all five. `check-links` is OK in every tree (e.g. `_original` 639 → 736 links). `glossary-missing`: 0.

### Examples (3 per tag)

- **Weather.** 014.0181 "La journée à Nice était grise, presque pluvieuse, à Monaco très claire." · 014.0262 "Il pleuvait beaucoup ce matin mais vers midi un soleil charmant." · 014.0308 "Il fait terriblement froid, si froid que mon nez était rouge."
- **Fashion.** 014.0197 the Galve ladies' "jaquette grise, jupe unie, tunique, jaquette deux rangs de boutons" · 014.0237 Gioia's "bottines jaunes" · 014.0196 "Je n'ai pas mis de corset pour voir…"
- **Shopping.** 014.0113 the expedition to Manby's: "j'ai commandé un conspirator un bleu foncé" · 014.0122 "j'entre chez Delbecchi et j'achète une plume en or" · 014.0284 "je courai chercher un éventail, j'en veux un ancien chinois ou Louis XV"
- **Church.** 014.0078 "Nous allons à l'église à pied (robe brune, bien)" · 014.0139 "Maman et Dina étaient à l'église, c'est notre Saint Nicolas" · 014.0226 "Je reviens de l'église anglaise où j'étais avec Dina et Hitchcock"
- **Money.** 014.0141 the Monaco gaming room: "elle jouait pièces après pièces" · 014.0272 the Christmas tree "qu'elle a pris au London House pour cent francs" · 014.0189 "Je m'imaginais que le duc de Hamilton était ruiné lorsqu'il était plus riche que jamais"
- **Ownership.** 014.0109 papa "parle de testament… maman et ma tante n'auront rien" · 014.0163 "La vente de l'écurie du duc a eu lieu" · 014.0242 Gioia "se promène en landau loué, ça lui va si peu après sa voiture"

### Precision self-check

On a second pass I rate about 85 of the 97 tags clear-cut. About 12 are defensible but borderline:
- Fashion 0325 (only "chez Monier") and 0328 ("salement habillés")
- Shopping 0251 and 0302 (food ordered or fetched at London House)
- Weather 0285 (the wind ruffles Gioia)
- Money 0189 and 0322 (wealth remarks, not sums)
- Ownership 0003 ("Mon journal… appartenant à moi") and 0064/0163 (the sale of Hamilton's stable, i.e. someone else's property)

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
2. One reader subagent per carnet, or per ~150 k characters for the big carnets (Sonnet is adequate; Opus for the dense later carnets). It gets the six Tagging Criteria sections verbatim and returns JSON `{TAG: [ids]}`, no keyword pre-filter. Reading everything costs little more and avoids the regex-recall bias of `theme-tagger.ts`.
3. An adversarial check of the positives only (about 20 % of paragraphs): a second agent sees each tagged paragraph plus its criteria and may veto. That should push strict precision above 90 %.
4. Apply to `_original` with a small scoped script (the pilot's `apply_themes.py` logic: after the ID, the kind marker and the tag block, additive only). It is worth adding as `src/scripts/apply_theme_tags.py` + a `just` recipe before the wave.
5. Propagate with `just propagate-tag` per tag. Because it is corpus-wide, scope the rollout by running a batch of carnets, propagating, gating, and committing per tome. Never use `tag-sync` for this.
6. Gates per carnet and tree: `verify-carnet`, `splicescan`, `check-links`; then `glossary-missing` 0.

**Cost estimate.** Roughly 3 M input tokens for reading, +25–30 % for the veto pass, plus per-agent overhead of about 20 k × ~130 agents. That gives **about 6–7 M input tokens** and well under 1 M output tokens. At 8–10 agents in parallel that is about half a day wall-clock. **Expected yield is about 6,000–13,000 tags.** The pilot rate is 0.27 tags per paragraph, but Fashion is densest in the Nice 1873–74 carnets and should thin out in the atelier years, while Money and Ownership should rise in the Russia and estate carnets (1876, 077–080).

**Ordering.**
- The carnets being rebuilt must go through their rebuild waves first: 031–044, 062 and 065–074, plus the uk 082–097 work.
- `rebuild-carnet` moves tag lines with their clusters, so tags would survive it, but tagging a carnet whose paragraph set is still changing wastes the read.
- Start with the Nice carnets 001–030 (highest Fashion and Weather density, a good second calibration), then 045–061 and 075–106, and the rebuild ranges last.

**Before the wave, decide:**
1. FASHION vs a renamed CLOTHING label.
2. Whether pasted clippings get theme tags.
3. Whether theme display names should be localized in the filter. Today they are English for every language, which the new everyday themes make more visible.
