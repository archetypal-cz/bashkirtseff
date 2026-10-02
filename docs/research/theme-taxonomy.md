# Theme taxonomy and tag audit for the split wave: proposal

For KRR. Drafted 2026-10-02 (read-only research; no repo edits). Inputs: `content/_original/_glossary/culture/themes/`, the 2026-09-28 pilot (`.claude/reports/theme-tags-2026-09-28.md`, carnet 014), `src/scripts/theme-tagger.ts`, `propagate_glossary_tag.py`, `tag_sync.py`, `src/frontend/src/lib/filter-index-builder.ts`, and the glossary-tagger skill. All counts are from `_original` at HEAD `884759f17`.

---

## 1. Current state

### 1.1 Usage

The corpus has 54,635 paragraph IDs; 51,827 of them carry visible text. 39,401 have no theme tag at all. Themes per tagged paragraph: 1 = 10,924, 2 = 3,052, 3 = 870, 4+ = 388 (one paragraph has 12).

| Theme (file id) | Paragraphs | How it was tagged |
|---|---|---|
| LOVE | 4,027 | keyword regex (`theme-tagger.ts`) |
| RELIGION | 2,977 | regex |
| ART_PRACTICE | 2,971 | regex |
| EMOTIONS | 2,011 | regex |
| HEALTH | 1,526 | regex |
| POLITICS | 1,328 | regex |
| MORTALITY | 1,248 | regex |
| THEATER_THEME | 1,202 | regex |
| MUSIC_THEME | 1,098 | regex |
| READING | 976 | regex |
| MARRIAGE | 845 | separate pass (`7ddd46bfb`) |
| PHILOSOPHY | 486 | regex |
| META_DIARY | 278 | regex |
| DEATH | 262 | regex |
| FASHION | 54 | pilot, 014 only |
| DISEASES | 49 | regex |
| FOURTH_WALL | 43 | regex |
| WEATHER / SHOPPING / CHURCH | 15 / 13 / 6 | pilot, 014 only |
| MONEY / PROPERTY (+4 qualifiers) | 5 / 5 (2–3 each) | pilot, 014 + 093.0025 |
| FOOD, TRAVEL, ANIMALS | **0** | entries written 2026-02-10 but never added to the tagger |

### 1.2 Problems

1. **The legacy themes are keyword hits, not themes.** I took a random sample of 6 tagged paragraphs per theme. It is small and only indicative, but the pattern is clear:
   - LOVE ≈ 2/6 correct. Hits on «cœur» (103.0177), «par cœur» (054.0183), «comme je n'aime pas» (016.0278), and a church visit (005.0215).
   - RELIGION ≈ 2/6. Hits on «ma foi» (082.0250) and «sans qu'on prie» (069.0471).
   - HEALTH ≈ 1/6. Hits on «souffre de la présence de Bruschetti» (055.0019).
   - POLITICS ≈ 1/6. It fires on the name Cassagnac (095.0021, 064.0216), which is a person tag, not a theme.
   - MORTALITY ≈ 2/6. Hits on «je fis la morte» (088.0220).
   - PHILOSOPHY ≈ 2/6. Hits on «existence assommante» (084.0437).
   - EMOTIONS ≈ 2–3/6.
   - ART_PRACTICE ≈ 5–6/6 is the one solid legacy theme.

   Precision on the big themes is likely below 50 %, and these are the tags readers see first in the filter.
2. **Overlaps with no rule:**
   - DEATH/MORTALITY: only 46 of the 262 DEATH paragraphs also carry MORTALITY.
   - DISEASES is a subset of HEALTH in its definition, but only 16 of its 49 paragraphs also carry HEALTH.
   - CHURCH/RELIGION: RELIGION's text still claims "church attendance".
   - MARRIAGE/LOVE: the LOVE regex includes «mariage», «épouser» and «fiancé», giving 390 overlaps.
   - FASHION's definition also claims "personal appearance".
   - POLITICS's definition claims "women's rights".
   - MUSIC/THEATER: opera falls under both.
3. **Uneven granularity.** LOVE sits on 4,027 paragraphs and FOURTH_WALL on 43. Major subjects have no theme at all: ambition and fame, family quarrels, society and social exclusion, the condition of women, studies, appearance and beauty.
4. **Display names come from the file id** (`formatDisplayName`), so readers see "Music Theme", "Theater Theme", "Money Family" and "Meta Diary". They are English in every language; the `name:` field is ignored.
5. **The trees drift from the source.** LOVE lines: `_original` 4,084, cz 3,974, uk 4,088, en 2,990, fr 4,098. en lacks about a quarter of the theme tags. uk and fr carry more than the source, i.e. stale lines on paragraphs that have since moved. Our propagation tools only **add** (`propagate-tag`, `tag-sync`), so nothing ever removes a theme line from a tree.
6. **Multi-tag lines.** 1,049 theme links share a line with other tags, e.g. `%% [#Love](…LOVE.md) [#Italian](…ITALIAN.md) [#French](…) %%`. Any removal tool has to edit tokens, not delete whole lines.
7. **Hard-coded counts.** Seven theme entries state numbers like "~1,498 references" that are already stale. Drop them.
8. **Stray entries.**
   - `people/mentioned/FEMINISM.md` is a misfiled concept stub (1 use).
   - `just theme-tag` is still live and would re-add the regex false positives on its next run.

---

## 2. Proposed taxonomy (35 themes + 4 qualifiers = 39 files)

**Actions.** KEEP means keep the theme but replace its tagging criteria. NEW means create the entry. RETIRE means remove the theme. Every theme is re-judged per paragraph in the wave; no tag survives just because a keyword put it there.

**The bar for every theme:** the paragraph is substantively *about* it. A reader who picked that theme in the filter should be glad to land on this paragraph. A passing word never qualifies.

### A. Inner life and ideas

| ID · display | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| LOVE · Love | Romantic love, desire, flirtation, jealousy, heartbreak: hers and other people's | Feelings for or about a lover or suitor; a flirtation scene; reflection on love | «cœur» / «par cœur», «j'aime» about things, love of art, family affection | 072.0596, 047.0443 | KEEP, re-judge (expect −50 %) |
| MARRIAGE · Marriage | Marriage as an institution and a plan: matches, *partis*, dowry talk, "vieille fille" | A marriage considered, arranged or refused; marriage judged | A love scene with no marriage in view | 056.0066, 081.0293, 052.0325 | KEEP |
| EMOTIONS · Self-Analysis *(display rename)* | Marie examining her own moods, character and contradictions | Emotion **as the subject**: analysing why she feels something, how she changes | An emotion merely expressed ("je suis furieuse"), others' tears | 041.0247, 072.0088 | KEEP, narrow hard |
| AMBITION · Ambition & Fame | The hunger for glory, greatness and a name; fear of obscurity | «gloire», «être quelqu'un», wanting to be célèbre, the ranking of herself against the great | Someone else described as famous | 094.0363, 052.0098, 101.0158 | **NEW** |
| APPEARANCE · Beauty & Appearance | Her face, body, figure and beauty as she sees or is told it; judging others' looks | The mirror, «je suis jolie / laide», the body examined | Clothes (that is FASHION); a model's head in the studio (ART_PRACTICE) | 036.0147, 076.0466, 084.0082 | **NEW** (takes this scope out of FASHION) |
| MORTALITY · Mortality | Her own death: fear, wish or premonition of dying young, time running out | «je mourrai», «à quoi bon vivre», the sense of a short life | Hyperbole («mourir d'ennui», «faire la morte»), others' deaths (DEATH) | 088.0504, 101.0158 | KEEP, narrow hard |
| PHILOSOPHY · Philosophy | Reflection on life, fate, truth, morality, human nature | A general proposition argued or weighed | The word «existence» alone | 055.0893, 062.0480 | KEEP, narrow |
| RELIGION · Faith & Prayer | God, prayer, vows, bargaining with God, faith and doubt, religious argument | Praying, a vow, blaming or thanking God, doubt | «mon Dieu!», «ma foi», «prier» = to ask; attendance alone (CHURCH) | 011.0124, 005.0045 | KEEP, narrow; drop "attendance" from its text |
| DREAMS · Dreams | Night dreams recorded or interpreted | «j'ai rêvé que…», «cette nuit j'ai vu en rêve» | Daydreams, «je rêve de gloire» | 034.0071, 096.0076, 007.0370 | **NEW** (optional) |
| SUPERSTITION · Omens & Superstition | Omens, signs, fortune-tellers, cards, bibliomancy, name numerology | A sign read, a fortune told, a superstition admitted | Church ritual (RELIGION) | 042.0002, 080.0615, 055.1108, 056.0399 | **NEW** (optional) |

### B. Writing the diary

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| META_DIARY · The Diary | The diary as object and act: why she writes, rereading, gaps, the text's fate | «ce journal», «j'écris», notes on what she wrote | «journal» = a newspaper | 041.0247, 046.0081, 017.0489 | KEEP |
| FOURTH_WALL · Addressing the Reader | Marie speaking to her future readers or editor | «chers lecteurs», instructions to an editor, «vous» clearly meaning readers | A rhetorical «vous» that is ambiguous | 058.0001, 100.0246, 063.0751 | KEEP |

### C. Body and death

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| HEALTH · Health & Illness | Illness, symptoms, doctors, cures, deafness, tuberculosis: hers or others' | A symptom, a diagnosis, a doctor, a cure or treatment | «souffrir» of a person, «malade» of boredom | 094.0004, 087.0251, 104.0596 | KEEP, re-judge; **absorbs DISEASES** |
| DEATH · Death & Mourning | Actual deaths, funerals, mourning: of others and of public figures | A death reported or felt, a funeral seen, mourning dress | Her own death imagined (MORTALITY), hyperbole | 033.0050, 053.0063 | KEEP |
| ~~DISEASES~~ | | | | | **RETIRE** → HEALTH (49 paragraphs) |

### D. People and society

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| FAMILY · Family Life | Relations inside the household and the wider family: scenes, quarrels, affection, the father question | A scene, a quarrel, a judgement on a relative, family politics | A relative merely present ("avec maman") | 092.0223, 069.0263, 047.0053 | **NEW** |
| SOCIETY · Society & Reputation | Social life as a subject: balls, receptions, salons, rank, reputation, gossip, being received or snubbed | A soirée or ball described; standing, gossip or exclusion discussed | A bare list of who called | 056.0466, 067.1188, 034.0084 | **NEW** |
| WOMEN · Women's Condition | What women may or may not do; feminism, *La Citoyenne*, being a woman artist | «si j'étais homme», women barred from something, the Pauline Orell articles | A woman merely described | 090.0302, 020.0118, 080.0169 | **NEW** (moves out of POLITICS; merge the FEMINISM stub into it) |
| EDUCATION · Studies & Lessons | Lessons, teachers, governesses, study plans, Latin, exams | A lesson, a plan of study, a teacher judged | Art training (ART_PRACTICE), singing lessons (MUSIC) | 005.0145, 027.0130, 065.0328 | **NEW** |

### E. Arts and books

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| ART_PRACTICE · Her Art | Marie's own drawing, painting and sculpture; the atelier, models, her Salon entries | Her work, the studio, models, concours, her submissions | Others' pictures (ART_WORLD) | 098.0318, 092.0384, 075.0189 | KEEP (the best legacy theme) |
| ART_WORLD · Art World | Others' art: museums, galleries, exhibitions, the Salon as a show, painters, critics | A visit, a picture judged, an artist discussed | Her own work (ART_PRACTICE) | 102.0117, 064.0292, 096.0079 | **NEW** |
| MUSIC_THEME · Music | Her voice and singing, the piano, concerts, music heard and judged | Singing, losing her voice, a concert, the music of an opera | A night at the opera with no word on the music (THEATER) | 034.0631, 028.0163, 074.0435 | KEEP, fix display |
| THEATER_THEME · Theatre & Opera | Performances attended, plays and actors, the theatre as a venue | A performance, a play judged, the box and the house | Theatrical metaphors | 043.0268, 041.0237, 043.0203 | KEEP, narrow; fix display |
| READING · Reading | Books read, authors, literary judgements | A book named or discussed, a reading habit | Bibliomancy (SUPERSTITION, 056.0399), newspapers as news | 023.0285, 074.0181, 081.0342 | KEEP |

### F. Public life

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| POLITICS · Politics | Politics and public affairs: parties, the Chamber, elections, war, the Empire and the Republic, political opinions | A political event or opinion | A politician (Cassagnac, Gambetta) named in a social or love context: the person tag covers that | 085.0085, 080.0169 | KEEP, narrow hard |

### G. Daily life

| ID | Definition | Tag when | Don't tag | Examples | Action |
|---|---|---|---|---|---|
| WEATHER · Weather | The actual weather that day or night | Rain, cold, sea state, a plan changed by weather | Figurative weather; climate in general | 014.0262, 014.0308, 069.0216 | KEEP (pilot criteria) |
| FASHION · Clothing & Fashion *(display)* | What she and others wear; the outfit notes; dressmakers | «(robe brune, bien)», a toilette described or judged, a fitting | Body and beauty (APPEARANCE) | 032.0121, 014.0228, 014.0197 | KEEP, drop "appearance" |
| SHOPPING · Shopping & Errands | Buying, ordering, shops, errands | A purchase or order, going to shops | «courses» = horse races (059.0945) | 014.0113, 014.0122, 030.0200 | KEEP |
| CHURCH · Church Attendance | Actually going to a service | Mass, vespers, liturgy, confession, praying inside a church | Faith alone (RELIGION) | 014.0078, 099.0230, 004.0024 | KEEP |
| FOOD · Food & Eating | Eating as a subject: appetite, diet, weight, a meal described, fasting | The milk cure, «engraisser», a supper described | Routine «nous dînons» | 104.0596, 104.0248, 065.0389 | ACTIVATE (0 uses now) |
| TRAVEL · Travel | Journeys between places: departures, trains, crossings, arrivals, hotels on arrival | A trip under way or begun | A drive or walk in town | 040.0010, 043.0223, 064.0469 | ACTIVATE |
| ANIMALS · Animals | Pets (her dogs), horses as creatures she loves | A pet, a lost dog, love of horses | «cocotte» (a kept woman), a horse that only pulls a carriage | 078.0393, 057.0025, 009.0199 | ACTIVATE (optional) |
| SPORT · Sport & Riding | Riding, skating, sea-bathing, croquet, races watched | She or others ride, skate, swim; a race meeting | An «amazone» (riding habit) only as a garment | 068.0210, 022.0433, 089.0265 | **NEW** (optional) |
| NATURE · Nature & Landscape | Landscape, sea, gardens and the countryside, described or felt | A view described, nature felt | Weather (WEATHER); a painted landscape (ART_PRACTICE) | 064.0331, 005.0076, 033.0117 | **NEW** (optional) |

### H. Money and property (the owner's 2026-09-28 definitions; unchanged)

| ID | Definition | Examples |
|---|---|---|
| MONEY · Money | Cash, prices, spending, debts, allowances, gambling stakes, being rich or poor stated as money | 065.0737, 008.0124, 014.0272, 089.0531 |
| ↳ MONEY_FAMILY / MONEY_OTHERS | Qualifier: whose money. **At least one is required** with every MONEY tag. | family: 065.0737 (her croquet losses), 008.0124 (her allowance); others: 089.0531, 014.0272 |
| PROPERTY · Property & Investments | Estates, land, houses owned, inheritance, wills, dowry, capital, lawsuits over property | 065.0696, 093.0025, 067.0284, 014.0163 |
| ↳ PROPERTY_FAMILY / PROPERTY_OTHERS | Qualifier: whose property. At least one is required. | family: 065.0696 (papa mortgages his lands), 067.0284 (the family lawsuit); others: 014.0163 |

Gambling stays inside MONEY. It doesn't need a theme of its own.

**Summary of actions.**
- **NEW (11):** AMBITION, APPEARANCE, DREAMS, SUPERSTITION, FAMILY, SOCIETY, WOMEN, EDUCATION, ART_WORLD, SPORT, NATURE. FOOD, TRAVEL and ANIMALS are activated rather than created.
- **RETIRE (1):** DISEASES, which becomes HEALTH.
- **Display renames** (via `name:`): EMOTIONS → Self-Analysis, MUSIC_THEME → Music, THEATER_THEME → Theatre & Opera, META_DIARY → The Diary, FASHION → Clothing & Fashion.
- **Merge** the FEMINISM stub into WOMEN.
- **Optional tier:** drop DREAMS, SUPERSTITION, ANIMALS, SPORT and NATURE if the owner wants about 30 themes.

---

## 3. Tagging guide for the Sonnet tagger

**Themes**

1. **Precision over recall.** Tag only when the paragraph is substantially about the theme. When in doubt, leave it out. A missing tag costs a reader one paragraph; a wrong one discredits the whole filter.
2. **At most 3 themes per paragraph.** Qualifiers don't count, so MONEY + MONEY_FAMILY is one. Most paragraphs get 0 or 1. Expect an average of about 0.4–0.6 per paragraph with text.
3. **No keyword triggers.** Judge the meaning. Known false friends:
   - «cœur», «par cœur»
   - «ma foi», «prier» meaning to ask, «mon Dieu»
   - «mourir de…», «faire la morte»
   - «existence», «le temps» meaning time
   - «courses» (races or errands), «cocotte», «glace» (a mirror or ice), «journal» (a newspaper or the diary), «amazone» (a garment)
   - «passion» for art
   - a politician's name with no politics in the paragraph
4. **Judge the paragraph itself.** Neighbouring paragraphs may be read to understand who «il» is or what the scene is, but the theme has to be present in this paragraph. Footnotes, RSR, LAN and other comments are never evidence.
5. **Re-judge existing theme tags; don't inherit them.** For each paragraph, return the full theme set it should have. The tool computes the adds and removes. Each removal and each borderline add gets a reason of 10 words or fewer.
6. **The qualifier rule:** MONEY needs MONEY_FAMILY and/or MONEY_OTHERS, and PROPERTY likewise. The checker rejects a qualifier that appears without its parent.
7. **Kinds.**
   - Rayé, margin and «other» text is Marie's own, so tag it normally.
   - Letters she wrote or received: tag them normally.
   - Printed clippings: no themes, per the pilot's default (see owner question 4).
   - Empty «[Aucun texte…]» days: no tags.
8. **Split paragraphs.** Judge each new piece on its own; themes are not copied from the parent cluster. If a piece is a single line of dialogue or a fragment, it usually gets 0 themes.

**Entity tags (people, places, culture)**

9. **Tag where the entity is mentioned or meant in this paragraph.** "Meant" covers a name, a title, a nickname or an epithet («le duc», «l'Ange», «A.»), and a pronoun when the paragraph is clearly about that person. The entry's location is no reason to tag the city on every paragraph; that is what the frontmatter `location:` and `entities:` are for.
10. **Check the referent before keeping a tag.** The collision names include Alexandre (five referents in 072–074), Paul (her brother, Cassagnac or Antonelli), «le duc», and Pietro / A. Read the paragraph's RSR note. A tag pointing at the wrong person is worse than no tag.
11. **Split clusters.** Each entity tag moves to every piece that mentions or means the entity. If a tag matches no piece, it goes to the piece the RSR note ties it to; failing that, it is dropped and logged in the audit report (not in content).
12. **Folded comment-only IDs** (451, carnets 001–044 and 072). Their tags summarise the entry, so they must **not** land as a block on the entry's last paragraph. Redistribute each tag per rule 11, or drop it when no paragraph mentions the entity; the frontmatter `entities:` keeps it at entry level.
13. **Language tags** (`culture/languages/*`) are kept only where that language actually appears in the paragraph's text.
14. **Retarget known stubs** to their canonical entries (the list in the glossary-tagger skill: CERCLE, ITALIE, EMILE_D_AUDIFFRET, …).
15. **Never create glossary entries in the audit.** Log "missing entity" candidates for the glossary role.

**Output per chunk:** JSON `{para_id: {themes: [...], entities_add: [...], entities_remove: [{id, reason}], notes}}`.

---

## 4. Approach and cost

**How tags travel today.**
- Tags live in `_original` as `%% [#X](../_glossary/…) %%` lines. The trees carry the same tags with paths rewritten for their depth.
- `just propagate-tag --target culture/themes/X.md --display X --apply` copies one tag from source to trees. It is additive and skips the kind marker (fixed in `f58187d50`).
- `just tag-sync LANG CARNET` copies every missing tag line. It is additive too, and was used to repair uk drift in `895237620`.
- **Nothing removes a tag from the trees.**

**Tooling (BUILT 2026-10-02):** `just tag-audit-dump`, `just tag-audit-apply`, `just tag-reconcile`; `just theme-tag` is disabled. Usage in `.claude/skills/glossary-tagger/SKILL.md`. `split_parent` in the dump is not implemented (always null). Original specification, for reference:
- `src/scripts/apply_tag_audit.py`, with `just tag-audit-apply CARNET --decisions F [--write]`. It applies the per-paragraph decisions to `_original`:
  - edits tokens, so multi-tag lines work;
  - inserts after the ID, the kind marker and the existing tag block;
  - checks the qualifier rule, the 3-theme cap and that each target exists.
- `just tag-reconcile LANG CARNET [--scope themes|all] [--write]`. It sets each tree paragraph's tag set **equal** to the source's: themes always, entity tags only for audited carnets.
  - It removes as well as adds; it never touches visible text; dry-run by default with counts.
  - This also fixes the existing drift (en is about −25 %; uk and fr carry stale extras).
- Dump script: per carnet, a JSON list of `{id, visible French, kind, current tags, RSR note, split parent}`.
- Disable `just theme-tag` (the regex tagger), so nobody re-adds false positives.

**Glossary prep, one commit before the wave:**
- 11 new theme entries in the house layout (Tagging Criteria and Common French Cues, as in the pilot).
- Rewritten criteria for the KEEP themes, with the hard-coded counts removed.
- DISEASES → HEALTH via `just glossary-merge`, and FEMINISM → WOMEN.
- Frontend (frontend-dev):
  - the filter shows the glossary `name:` instead of the file id;
  - the 39 theme names are localised in the 5 locale files;
  - optionally, the qualifiers are shown under their parent.

**Per batch (one per tome, in step with the split wave):**
1. The split rebuild lands and its gates pass, as now.
2. Dump `_original` for the batch's carnets. Sonnet taggers work in chunks of about 60–80k characters of French, 4–6 agents in parallel, each given §2 and §3 verbatim.
3. Mechanical check of the decisions: known ids, the qualifier rule, the cap, and entity paths that exist.
4. **Opus spot-check:**
   - sample: 5 % of the changed paragraphs (at least 40 per tome), plus every paragraph with 3 themes, plus every entity-tag removal on a person entry;
   - verdict per item, agree or disagree with a reason;
   - pass: at least 90 % agreement on adds and at least 95 % on entity removals; otherwise the chunk is re-run with the corrected guidance.
5. Apply to `_original`. Gates: `just glossary-missing` (0), `check-links`, `verify-carnet _original`, `splicescan`. Commit `_original`.
6. **Trees last:** run `tag-reconcile` only after the drivers have committed the batch's translations (one writer per file). Then `sync-verify` (visible text unchanged), `verify-carnet`, `splicescan` and `check-links` per tree, and one commit per tree.

**Cost** (token volume; I haven't priced it):

| Item | Input | Output |
|---|---|---|
| Visible French | about 3.2 M tokens (the pilot's 2.8 M plus restored text) | |
| Tag lines and RSR notes | about 1.5 M | |
| Guide × about 150 chunks | about 1.5 M | |
| Agent overhead | about 3 M | |
| **Sonnet total** | **about 9–10 M** | **about 1 M** (decision JSON) |
| **Opus spot-check** (about 3–4k paragraphs) | **about 1.5 M** | about 0.2 M |

Wall-clock is about 1–2 hours of agent time per tome. The wave sets the pace.

**Expected outcome:**
- Legacy themes drop about 40–50 % (false positives out).
- The new and daily-life themes add about 10–14k tags.
- That gives about 22–27k theme tags in total, against 19.4k today, but credible ones.
- Entity tags are corrected only where they are wrong; no bulk churn.

**Ordering.**
- Pilot first: re-run 014 (already hand-tagged) plus one atelier carnet such as 075 as calibration. That covers both Nice daily life and art years.
- Then follow the wave, tome by tome.

---

## 5. Questions for the owner

1. **Re-judge the legacy themes** (removing the regex false positives, likely about half of LOVE, RELIGION, HEALTH and POLITICS)? Or only add the new themes? I recommend re-judging; it is the same read.
2. **Approve the 11 new themes.** Which of the optional five (DREAMS, SUPERSTITION, ANIMALS, SPORT, NATURE) should be dropped?
3. **Display:** show the glossary `name:` and localise it per language (a small frontend task)? Keep the file id FASHION with "Clothing & Fashion" as the label?
4. **Clippings:** no theme tags (the pilot default)? Letters get tags like diary text?
5. **Is a cap of 3 themes per paragraph OK?**
6. **EMOTIONS:** narrow it to "Self-Analysis", as proposed, or keep the broad "Emotions"?
7. **Entity tags on a pronoun or epithet only** («le duc», «il») when the paragraph is clearly about that person: confirm that this counts as "meant".

## Owner decisions (KRR, 2026-10-02)

1. **Re-judge the legacy themes:** all existing theme tags are re-judged in the audit, and regex false positives are removed.
2. **Approve all new themes:** all 11 new ones (including DREAMS, SUPERSTITION, SPORT and NATURE), the postponed set (weather, clothing, shopping, church, money and property with qualifiers), and starting FOOD, TRAVEL and ANIMALS. 35 themes in total, plus 4 money/property qualifiers.
3. **Display and scope details, as proposed:**
   - localised theme names in the filter, taken from the glossary `name:`;
   - no theme tags on clippings; letters are tagged like diary text;
   - at most 3 themes per paragraph;
   - EMOTIONS is narrowed to "Self-Analysis".
4. **Entity tags:** a pronoun or epithet («le duc», «il») counts as "meant" when the referent is unambiguous.

Execution: in the paragraph-split wave, carnet by carnet. Prerequisites:
- a script that applies the audit decisions to `_original`;
- a tree tag-sync that can also REMOVE tags;
- the frontend localised names.
