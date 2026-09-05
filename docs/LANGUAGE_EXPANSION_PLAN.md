# Language Expansion Plan — pt-BR, zh-Hans, ja, vi, ar

Status: proposal, 2026-09-05. Builds on `docs/ADDING_LANGUAGES.md` (Parts 1–3) and the `es` pilot kit (`content/es/CLAUDE.md`). Scope: what has to change so a language the maintainer cannot read can be onboarded, translated and quality-gated by agents. Principle throughout: **one machine-readable language profile drives every tool; per-language knowledge lives in agent-authored files, not in code.**

Line refs are as of 2026-09-05; grep the identifier if they drift.

## 0. Where we stand (facts the plan rests on)

| Fact | Consequence |
|------|-------------|
| ~40 hard-coded language lists (see `docs/ADDING_LANGUAGES.md` §3.4); nothing fails loudly for an unknown code | Collapse to one registry before the first non-Latin language (§3.1) |
| Hooks assume 2-letter dirs: `validate-write.ts:43`, `hooks/lib/config.ts:79,88`, `hooks/lib/report.ts:64` (`[a-z]{2}`) | Keep 2-letter dir codes (`pt`, `zh`, `ja`, `vi`, `ar`); BCP-47 tag lives in the profile; relax regex anyway (§3.1) |
| Metrics: `statistics.ts:376` splits words on whitespace, `:396-419` splits sentences on `.!?…` with FR/CZ/EN abbreviation list | CJK word_count ≈ 1 per paragraph, sentence_count ≈ 1; vi counts syllables; ar terminators `؟` missed (§3.2) |
| `verify-carnet.ts:67` `CYRILLIC_LANGS` set; Latin-in-Cyrillic only; no inverse, no other scripts; no typography check | Generalize to profile-driven expected/forbidden script + typography linter (§3.3) |
| `glossary-tagger.ts:241-250` uses ASCII `\b`, no `u` flag; scans `_original` only. `GlossarySearch.vue:55` same `\b` | Not blocking (French source), but any target-text matching must use Unicode-aware boundaries or plain substring (§3.5) |
| Glossary frontmatter has one English `name` + French/English `aliases`; no per-language name field. TM is prose, unparsed | Names for a new language have nowhere machine-readable to live → onomastics table (§3.4) |
| Frontend: no `dir` in `DiaryLanguageConfig`, no `dir` attr emitted, no CJK/Arabic webfont, `hyphens: auto` unconditional, no `word-break`/`overflow-wrap`, no plural machinery in either i18n path, `cs-CZ`/`en-US` locale fallbacks in two Vue islands | RTL/CJK checklist (§3.7); plurals needed before ar (6 forms) and already wrong for cz/uk |
| Skills already delegate per-language rules to `content/{lang}/CLAUDE.md` (translator, opus-editor, editor, vox, fablelous); LAN `TRAP:` notes are language-neutral by design | Roles mostly survive unchanged (§4); the kit file is the unit of onboarding (§5) |
| `translator/SKILL.md:245-281,333` carries Czech/English examples and a per-language diacritic list in the generic body | Move to kit files; skill reads the profile instead |
| Human cannot read zh/ja/vi/ar | QA must not depend on the human: back-translation audit + typography/onomastics gates are mandatory, not optional (§3.6, §4) |
| STEWARDSHIP preserve-and-frame (`docs/STEWARDSHIP.md:150`) and "no sanitizing" (`:44-52`) bind every language | No market adaptation; frame with footnotes (§2) |
| No written policy on "Russian" vs "Ukrainian" labelling; README says Ukrainian-born, glossary says "Russian (Ukrainian-born)"; uk corpus has Башкирцева/Башкірцева drift (256 vs 74) | Write the rule once (§2.3) and enforce it via the onomastics table |

## 1. Language dimension matrix

Dir code = content path and URL segment; `tag` = BCP-47 used for `lang=`/`hreflang`/Intl. Baseline rows first.

| Dim | cz / uk / en / fr / es (baseline) | pt (pt-BR) | zh (zh-Hans) | ja | vi | ar (MSA) |
|-----|------|------|------|------|------|------|
| Script, direction | Latin / Cyrillic, LTR | Latin, LTR | Han (simplified), LTR | Han + kana, LTR (no vertical) | Latin + stacked diacritics, LTR | Arabic, **RTL**, cursive joining |
| Segmentation | whitespace | whitespace | none; `Intl.Segmenter` word-ish | none; `Intl.Segmenter` | whitespace = **syllables**, words are multi-syllable | whitespace; clitics attached (و، ب، ل) |
| Metrics mode | `token` | `token` | `char` (count Han/kana, ignore punctuation) + segmenter word count as secondary | `char` | `syllable` (flag as such; ratio vs FR ≈ 1.6–2.0) | `token` after stripping tashkeel/tatweel |
| Sentence terminators | `.!?…` | same | `。！？…` (full-width) | `。！？…` | `.!?…` | `.!؟…` |
| Name rendering | keep Latin; uk transliterates | keep Latin originals; Russian names via Portuguese transliteration (Nikolai, Tchaikovsky-style spellings fading; prefer ISO-ish modern press forms) | phonetic Han; **Xinhua per-source-language tables** (French vs Russian names use different tables) | katakana; French names by French phonology, Russian by Russian; ・ separator; ー long vowels | **keep Latin originals** (modern publisher norm); Russian/Ukrainian names in the same Latin transliteration as `en` (reuse en table) | Arabic script phonetic; established Egyptian/Lebanese renderings for French names; ة/ه, ڤ vs ف for /v/ decisions |
| Marie's own name | "Marie Bashkirtseff" fixed (es rule); uk Марі Башкирцева (locked) | Marie Bashkirtseff | check reception first (a Chinese edition of the censored diary exists — verify title form); else transliterate the French form | マリー・バシュキルツェフ (established in ja literature on her; verify) | Marie Bashkirtseff | ماري باشكيرتسيف (verify against Arabic art-history usage) |
| Address / register | tu/vous → tú/usted, ty/vy, ти/ви | tu/vous → você (default Brazilian), **tu** only if pilot decides period flavour; vous → o senhor/a senhora; children→parents "a senhora" in 19th c. | no T/V; formality via 您 vs 你, titles, sentence-final particles; 19th-c. aristocratic register via elevated wenyan-tinged lexicon, sparingly | **keigo** (丁寧語/尊敬語/謙譲語) mapped per relation; Marie's diary narration in である/だ or です・ます — house decision; quoted speech carries the keigo level | **kinship pronouns**: first-person diary of a girl → con/cháu/em/tôi per addressee; Maman = mẹ/má; grandparents ông/bà; suitors anh/em. The single biggest trap; needs an address map per carnet | no T/V; formality via titles (سيدتي), gendered 2sg/2pl, **dual**; narration in literary MSA, dialogue also MSA (no dialect) |
| Quotes / dialogue | « » / „ “ / — | “ ” inner ‘ ’; dialogue with travessão — | “ ” outer, ‘ ’ inner; titles 《 》; **full-width** ，。：；！？（） | 「 」 outer, 『 』 inner + book titles; full-width punctuation; no spaces | “ ” ; dialogue dash – common in novels; ellipsis … | « » outer (literary print), “ ” inner; `،` comma, `؛` semicolon, `؟` question mark |
| Emphasis / foreign words | italics | italics | **no italics**: Latin original in parentheses or 着重号; foreign titles 《 》 | **no italics**: 傍点 (`text-emphasis`), or 「 」 | italics acceptable | **no italics**: « » or bold weight; never letter-spacing |
| Numerals | Western | Western | Western in prose (Han for idiomatic small numbers, 十几岁) | Western half-width; Han for idioms | Western; decimal comma, thousands dot | **decision**: Western `0-9` (Maghreb/Levant press) vs Eastern `٠-٩` (Egypt/Gulf) — profile switch `numerals: latn\|arab` |
| Date heading (Sat 11 Jan 1873) | sábado 11 de enero de 1873 | sábado, 11 de janeiro de 1873 | 1873年1月11日，星期六 | 1873年1月11日（土曜日） | Thứ Bảy, ngày 11 tháng Một năm 1873 (tháng Giêng = literary Jan; pick one) | السبت 11 يناير 1873 — month names differ by region (يناير vs كانون الثاني); pick يناير series, glossary lists both |
| Fonts / layout | Literata (Latin+Cyr), self-hosted | Literata OK | system CJK stack (PingFang SC, Microsoft YaHei, Noto Serif CJK SC); line-height 1.9; `text-align: justify`; `hyphens: none`; `line-break: strict` | system (Hiragino Mincho, Yu Mincho, Noto Serif CJK JP); same | Literata covers Vietnamese; **Old Standard TT display font lacks stacked marks → fallback**; `hyphens: manual` | `dir="rtl"`, logical CSS props, Noto Naskh Arabic self-hosted (~200 KB), font-size +10%, line-height 1.9, no `letter-spacing`, no `hyphens` |
| Code-switch marker | `==highlight==` + footnote "In English in the original" | idem, "Em inglês no original" | idem, 「原文为英语」 | idem, 「原文は英語」 | idem, "Nguyên văn tiếng Anh" | idem, «بالإنجليزية في الأصل» |
| Footnote labels | N. de la T. / A. / E. | N. da T. / N. da A. / N. do E. | 译注 / 原注 / 编注 | 訳注 / 原注 / 編注 | ND / TG / BT | (المترجم) / (المؤلفة) / (المحرر) |
| House-style anchor (research target) | — | Companhia das Letras / Editora 34 classics; Acordo Ortográfico 1990 | 上海译文 / 人民文学 / 译林 foreign-classics series | 岩波文庫 / 光文社古典新訳文庫 | Nhã Nam / NXB Văn học translated classics | دار الآداب, المركز القومي للترجمة, دار التنوير |
| Model quality (LLM literary) | high | high | high | high | medium | medium |
| Tooling delta vs es | 0 | 0 | metrics, script check, typography, fonts, emphasis CSS | reuses zh delta + keigo address map | address map, NFC + tone-mark normalizer, hyphenation off | all of zh-class + RTL layout + plurals + numerals |

## 2. Cultural / political framing — operational rules

Global: STEWARDSHIP preserve-and-frame applies verbatim. No language gets a softened edition. If a rendering would be illegal or undeliverable in a market, we still publish the faithful text; distribution is not translation.

### 2.1 zh-Hans
- Standard for names: Xinhua transliteration tables (readers expect them). Standard ≠ ideology; use them.
- Vocabulary: no state-media set phrases or euphemism families. `自杀`, `妓女`, `情人`, `接吻`, `月经`, `酗酒` stay literal; never `不雅`, `不当行为`-style abstractions. Religion: Orthodox usage — 上帝, 基督, 东正教, 大斋期; not 天主 (Catholic-marked) unless Marie is in a Catholic setting.
- Ukraine: 乌克兰 for the land, 波尔塔瓦, 基辅 (Kyiv); "小俄罗斯" only inside quoted period usage with a footnote. "沙皇俄国 / 俄罗斯帝国" for the state.
- Sexuality/body: 19th-c. Chinese translation tradition of toning down is explicitly rejected; RED/CON check for omitted clauses (completeness gate, §3.6).

### 2.2 ar
- Register: literary MSA; dialogue in MSA too (house norm of literary publishers). Partial tashkeel only on first occurrence of names and on real ambiguities.
- Religion: Arabic **Christian** lexicon for Marie's faith — الله for God (shared usage), يسوع (not عيسى), المسيح, الكنيسة, القداس, الصوم الكبير, الأيقونة. Never Quranic phrasing for Christian prayer. Footnote Orthodox specifics on first use.
- Body, sexuality, alcohol, dancing, flirtation, menstruation, her gaze on men: rendered plainly; the framing footnote states period context, never apologises. Antisemitic period remarks: preserve-and-frame exactly as in other trees.
- No dialect, no regional month-name mixing inside one carnet.

### 2.3 Ukrainian vs Russian naming (every language)
1. Marie's self-description ("russe", "nous autres Russes") is translated as written; the glossary/about page carries the frame "born near Poltava, in today's Ukraine, then Russian Empire".
2. Places now in Ukraine: transliterate from the **Ukrainian** name (Kyiv, Kharkiv, Poltava, Havrontsi with Gavrontsi variant recorded), period Russian form in the glossary, never in body unless Marie's French form is itself the toponym in play.
3. Persons: transliterate from the form the person used (the Bashkirtseff/Babanine family wrote French forms → treat as French-source names in zh/ja/ar tables; Russian court figures from Russian; Ukrainian figures from Ukrainian).
4. Marie's name: the project brand form "Marie Bashkirtseff" in Latin scripts; in other scripts, the established literary form if a reception exists, else a transliteration of the French form. Recorded as row 1 of every onomastics table, locked, checker-enforced.
5. About/marketing text may say "Ukrainian-born"; body text never editorialises either way. Write this as `docs/NAMING_POLICY.md` (owned by the onboarding skill's research phase; 30 lines).

## 3. Generic tooling proposals

### 3.1 Language profile registry — `content/{lang}/_lang.yaml` → generated `src/shared/src/generated/languages.ts` (size **M**)
Per-language YAML (agent-authored by `/language-onboarding`), compiled by `just lang-registry` into one TS module consumed by shared, frontend and scripts; Python scripts read the YAML via `src/scripts/lib/`. `_original` gets a profile too (`role: source`).

```yaml
code: zh            # dir + URL segment
tag: zh-Hans        # BCP-47: html lang, hreflang, Intl
name: {native: 简体中文, en: Chinese (Simplified)}
active: false       # frontend routes on/off (replaces activeTranslations)
direction: ltr      # ltr | rtl
script: {expected: [Han], allowed: [Latin, Common], forbidden: [Cyrillic, Arabic, Hangul, Hiragana, Katakana]}   # Unicode Script names
metrics: {words: char, sentence_terminators: "。！？…"}     # token | char | syllable
typography:
  quotes: {outer: ["“","”"], inner: ["‘","’"], titles: ["《","》"]}
  dialogue: none                          # dash | none
  fullwidth_punct: true                   # ASCII ,.?!:; adjacent to Han → violation
  space_before_punct: false
  numerals: latn
  emphasis: text-emphasis                 # italic | text-emphasis | quotes | weight
  hyphenation: none
foreign_note: {en: 原文为英语, it: 原文为意大利语, ru: 原文为俄语, fr: 原文为法语, de: 原文为德语}
note_labels: {author: 原注, translator: 译注, editor: 编注}
date_heading: {weekday_names: [...], month_names: [...], pattern: "{y}年{m}月{d}日，{wd}"}
transliteration: {scheme: xinhua, table: _names.yaml, source_lang_aware: true}
address: {system: none|tv|keigo|kinship|gender-dual, map: _address.yaml}
ui: {locale: zh, date_locale: zh-CN, plural_rules: cldr}
review: {prompts_in: CLAUDE.md, traps_heading: "Editor / review traps"}
```

Replaces / feeds: `TRANSLATION_DIRS` (glossary-merge.ts:17), `detectLanguage()` (frontmatter.ts:169), `LANGUAGE_DIRS`, `DIARY_LANGUAGES` + `HREFLANG_BY_URLPATH`, `SupportedLocale`/`SUPPORTED_LOCALES`/`LOCALE_NAMES`, `activeTranslations`, the three i18n regexes, `LOCALES`/`LANGUAGES` in `pages/data/**`, `ALL_LANGUAGES` in both switchers, Workbox `urlPattern`s (generated string), the Python `TREES`, `project-status.ts:217`, `CYRILLIC_LANGS`, `bootstrap-readmes.ts:129` name map, hook `[a-z]{2}` regexes (relax to `[a-z]{2,3}(-[a-z]{2,4})?` now). Justfile: `default_lang` stays `cz`; add `just lang-list`, `just lang-check {lang}` (profile schema validation). One-off migration is an engineering task, not a skill; do it before the zh pilot.

### 3.2 Metrics by mode (size **S**)
`statistics.ts`: `countWords(text, mode)` — `token`: current; `syllable`: current but frontmatter key `word_count_mode: syllable`; `char`: count `\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}` code points, plus `Intl.Segmenter(tag,{granularity:'word'})` `isWordLike` count as `word_count_segmented`. `countSentences` takes terminators from the profile; abbreviation list becomes per-profile (`abbreviations:`). `verify-carnet` gains a soft `length-ratio` WARN (translated/original per mode, band from the profile after the pilot). Callers unchanged (`update-frontmatter.ts:126-138`).

### 3.3 Script + typography linter (size **M**) — new check group inside `verify-carnet.ts`, reusing `stripBenignSpans`
- `script`: token contains chars from a `forbidden` script → WARN; token mixes `expected` and Latin → WARN (generalizes `latin-in-cyr`); Latin run ≥ 2 words outside `==highlight==`/glossary/italics in a non-Latin tree → WARN "stranded source text" (catches untranslated French, the most likely agent failure in CJK/ar).
- `typography`: from the profile — wrong quote pair; ASCII punctuation adjacent to Han when `fullwidth_punct`; `?`/`,` where `؟`/`،` expected; space before `;:?!` when disallowed; digits in the wrong numeral system; `....`; dialogue dash mismatch; NFC normalization (Vietnamese has two encodings; require NFC and modern tone-mark placement `hoà`→`hòa` per house choice); Arabic tatweel/kashida present; letter-spacing-like spaced Arabic.
- `heading-date`: entry's first line parses against `date_heading` and equals frontmatter `date`.
`--strict` promotes to FAIL. Runs in the ED gate before RED (`docs/VERIFY_CARNET_GATE.md`).

### 3.4 Onomastics table + checker (size **M**) — `content/{lang}/_names.yaml`
Machine-readable companion to the prose TM (TM stays for idioms/style). Row per glossary id:
```yaml
- id: HOWARD_FAMILY
  source_lang: en          # drives the transliteration table in zh/ja/ar
  render: 霍华德一家
  variants: [霍华德]         # accepted surface forms (cz/uk: declined stems)
  status: proposed|confirmed|locked
  source: "Xinhua 世界人名翻译大辞典 s.v. Howard"   # citation, required
```
Checker (`verify-carnet` check `onomastics`): for every glossary tag in a translated paragraph, at least one of `render`/`variants` occurs in the paragraph text (plain substring, NFC — works for all scripts, no `\b`); glossary ids with tags in the carnet but no row → FAIL "name not in table". Also a reverse scan: known `render` strings of *other* languages' tables (e.g. Russian-form Cyrillic in uk, Latin "Nice" in zh) → WARN. Generated by `/transliteration-table` (§5.4); consumed by translator (loaded into context instead of grepping the TM) and by the frontend later for per-language glossary display names (fills the missing per-language `name` field without touching 3,290 glossary files).

### 3.5 Unicode-safe matching (size **S**)
`glossary-tagger.ts:241-250` and `GlossarySearch.vue:55`: replace `\b` with `(?<![\p{L}\p{M}\p{N}])…(?![\p{L}\p{M}\p{N}])` + `u` flag; normalize NFC on both sides; case-fold via `toLocaleLowerCase(tag)`. Add optional tone/diacritic folding for search in Latin trees (vi users search without tones). Do it now; it is a bug for Cyrillic edges already.

### 3.6 Back-translation audit gate (size **M**, process + one script) — for languages the human cannot read
- Sample: all paragraphs with glossary tags or `TRAP:` notes + random 20 % of the rest, min 40 per carnet.
- Auditor A (fresh Fable agent, **no French in context**) back-translates target → English, literal, with the target text quoted; auditor B (fresh agent) aligns back-translation with the French and classifies each paragraph: OK / meaning shift / omission / addition / register shift / name mismatch. Cross-vendor option: run auditor A as a read-only call via the Windmill LLM tools (`s-f_llm_basic__completion`, model from `list_models`) so the back-translation does not share the translator's blind spots; read-only use avoids the GEM-era corruption class.
- Output `.claude/reports/YYYY-MM-DD-{lang}-{carnet}-bta.md` + `BTA:` comments on flagged paragraphs; gate: 0 omissions, ≤ 1 meaning shift per 100 paragraphs, else back to RED. Script `src/scripts/bta-sample.ts` draws the sample deterministically (seeded by carnet) so reruns compare.
- Completeness sub-check (script, S): paragraph-level count of French clauses vs target sentence count per profile mode; flags ≥ 40 % drop (catches the silent-omission failure mode common in CJK output).

### 3.7 Frontend RTL/CJK checklist (size **L** for ar, **M** for CJK)
- Registry-driven `dir` on `<html>` and on `.prose-diary`; `[lang]` pages set `lang={tag}`; UI chrome mirrors via logical properties (`margin-inline-start`, `padding-inline`, `inset-inline`) — audit `global.css`, `branding.css`, layout components; the French `%%` quote toggle and footnote popovers must not assume left alignment.
- Bidi: paragraph with `dir=rtl` containing Latin names/numbers renders correctly by default; wrap `==highlight==` and glossary links in `<bdi>`; footnote markers `[^…]` render as LTR isolates.
- Fonts: per-`:lang()` font stacks in `branding.css`; CJK via system stacks (bundling Noto Serif CJK breaks the PWA precache budget); Arabic via `@fontsource/noto-naskh-arabic` (exclude from Workbox precache except the subset in use); verify Old Standard TT fallback for Vietnamese stacked marks.
- Typography per `:lang()`: line-height, `hyphens`, `line-break: strict`, `text-align`, `em` mapped to `text-emphasis`/weight instead of italics, `font-variant-numeric` off for non-Latin.
- Plurals: replace `{count}` regex `t()` (`astro.ts:27-30`) and vue-i18n usage with CLDR plural categories (`Intl.PluralRules`) — required for ar (6 forms), fixes cz/uk (3 forms).
- Dates/numbers: `dateLocale` from registry; remove `cs-CZ`/`en-US` fallbacks in `FilterOverlay.vue:287`, `UnifiedMenu.vue:143`; `numberingSystem` from profile `numerals`.
- `hreflang`, `og:locale`, JSON-LD `inLanguage`, webmanifest `lang`/`dir`: from registry. Visual regression: one screenshot per `[lang]` page type via `agent-browser` in the pilot.

### 3.8 Address map (size **S–M**, source-side, language-neutral)
LAN adds `%% ts LAN: ADDRESS: <speaker> → <addressee>: tu|vous, relation=<mother|grandmother|suitor|servant>, tone=<intimate|formal|mock-formal> %%` on dialogue paragraphs in `_original`. Each language's profile `address.map` (`_address.yaml`) maps relation × tone → pronoun/keigo/kinship form. Benefits es/pt today (tú/usted, você/senhora), is the only sane way to do vi kinship pronouns and ja keigo consistently, and gives ar gender/dual hints. Backfill 001 during the pilot; wave-backfill via a LAN sub-pass later.

## 4. Roles

| Role | Status for new languages | Note |
|------|------|------|
| researcher, linguistic-annotator | unchanged | LAN gains the `ADDRESS:` note type (§3.8) |
| translator | per-language addendum via kit; skill edit once | move cz/en examples (`SKILL.md:245-281`) and diacritic list (`:333`) into kit files; load `_names.yaml` + `_address.yaml`; read `foreign_note`/`note_labels` from profile |
| opus-editor, editor, conductor | unchanged | require the kit headings; `opus-editor/SKILL.md:11` list → "any language with a profile" |
| fablelous, vox | unchanged | cleanest; VOX is the "native reader" proxy — for zh/ja/vi/ar run VOX on 100 % of pilot entries |
| executive-director | addendum | gate order for non-Latin: verify-carnet strict (script/typography/onomastics) → RED → CON → BTA → VOX; plateau table pulls from the pilot report |
| glossary-tagger | unchanged now | Unicode fix §3.5 before any target-text tagging |
| project-status, report-triage, glossary, workflow-architect, frontend-dev | list edits → registry | one-time |

New roles (comment codes to add in `roles.ts` 3 maps, `content.ts:163`, `check_footnote_swallow.py:28`, root `CLAUDE.md:148`):

**onomast (ONM)** — transliteration steward. Trigger: before the first TR of a carnet in a language with `transliteration.scheme != none`, and whenever a glossary tag appears that has no `_names.yaml` row. Inputs: glossary entries tagged in the carnet, `source_lang` per entity, the language's `docs/languages/{lang}-conventions.md`, the scheme's reference (Xinhua tables, katakana conventions, Arabic press usage). Outputs: rows in `_names.yaml` with citation and `status: proposed`; a decisions memo for rows where sources disagree; `ONM:` comments only in `_names.yaml` review notes, never in entries. Gate: the onomastics checker passes with 0 missing rows before TR starts.

**cultural-consultant (CUL)** — sensitive-passage framing. Trigger: paragraphs carrying `TRAP: PRESERVE-AS-WRITTEN`, religion/sexuality/body/ethnic-remark lexicon (list in the kit), or Ukraine/Russia labelling. Runs after RED, before CON. Inputs: French, target text, STEWARDSHIP §2 rules, the kit's §2 rules. Outputs: `CUL:` comment per paragraph = "faithful, no action" or a concrete footnote text (framing only, never a rewording of Marie); flags softening as `CUL: SOFTENED` → returns to translator. Code `CUL`.

**back-translation auditor (BTA)** — §3.6. Trigger: after CON on every pilot carnet and on a 1-in-5 sample of wave carnets for languages the human cannot read. Inputs: deterministic sample, target text only (auditor A) / French + back-translation (auditor B). Outputs: report + `BTA:` comments; pass/fail against the threshold; feeds the ED plateau table with a `bta_divergence` number. Code `BTA`.

**Typography/script checker** — a script (§3.3), not a role. **Register mapper** — folded into LAN (`ADDRESS:`), not a role.

## 5. Meta-skills

### 5.1 `/language-onboarding {lang}` — research, then generate the kit
Preconditions: profile schema exists (§3.1); `docs/NAMING_POLICY.md` exists. Human input at start: dir code, BCP-47 tag, target variety (e.g. Brazil), one-line audience note.

**Phase A — research (parallel Explore/researcher agents with WebSearch, 6 fan-outs, each returns ≤ 60 lines with URLs; every factual claim cited; no copyrighted passages quoted, sources summarised):**
1. Bashkirtseff reception in the language: existing translations (which edition — censored 1887 or Kernberger-class), the name form used, reviews, scholarship, museum/exhibition mentions. Output: name form evidence + "do not consult/paraphrase" list.
2. Name transliteration systems: the standard(s), which one major literary publishers use, per-source-language rules (French vs Russian vs English vs Italian names), treatment of Ukrainian toponyms since 2022, honorific handling (Maman, madame/mademoiselle/monsieur, titles).
3. Comparable diaries/journals in that language — Anne Frank, Woolf's diaries, Kafka's diaries, Tolstoy's diaries, Anaïs Nin, Sei Shōnagon-adjacent for ja register debates, Gide/Green journals: how the best-received translations handled register, tu/vous, foreign phrases, footnotes, dates; what critics praised/attacked. Output: 5–8 house-style precedents with citations.
4. Publisher house styles: punctuation, quotes, dialogue, numerals, dates, footnote labels, italics substitutes, foreign-word policy; orthographic standard (AO1990, 现代汉语规范, 常用漢字, Vietnamese tone-mark placement, Arabic hamza/ta-marbuta norms).
5. Register system: T/V or keigo/kinship/gender mapping proposal for the 12 most frequent relations in carnets 001–010 (list supplied from glossary + `ADDRESS:` notes).
6. Frontend/typography facts: fonts, line-height norms, hyphenation, RTL/CJK rendering requirements, locale data (weekday/month names, plural categories, numbering system).

Writes `docs/languages/{lang}-conventions.md` (≤ 250 lines, sections = the six fan-outs, references list at the end) and `docs/languages/{lang}-decisions.md` (numbered choices needing human confirmation, each with recommended default + alternative + consequence, modelled on the es vosotros/ustedes item).

**Phase B — generate (one agent, reads Phase A outputs + `content/es/CLAUDE.md` as structural template):**
- `content/{lang}/_lang.yaml` (validated by `just lang-check`), `CLAUDE.md` (required headings: workflow, style guide in the target language, name policy, foreign passages, footnotes, `## Editor / review traps ({Language})`, `## Review criteria (OPS / RED)` with both prompts in the target language, comment types), `PROGRESS.md` (from template, pilot plan), `TranslationMemory.md` (policy seed rows), `_names.yaml` seeded via `/transliteration-table {lang} 001`, `_address.yaml`, UI locale `src/frontend/src/i18n/locales/{locale}.json` (all keys, machine-translated, marked `"_status": "draft"`), `translation.{language}` key in every other locale file, `WATCHLIST.md` `### {Language}-Specific` stub, `docs/ADDING_LANGUAGES.md` §3.4 checklist run (`just lang-registry` regenerates the lists).
- Validation checklist (skill must print it filled): profile validates; `just scaffold 001 -l {lang} --dry-run` OK; `verify-carnet {lang} 001` on the scaffold shows only TODO warnings; onomastics table has a row for every tag in 001; both review prompts present; decisions memo has ≥ 1 item per §1 row that is marked "decision"; every conventions claim has a URL; no quoted passages > 25 words from any source; `just check-links-repo` clean; nothing committed.

### 5.2 `/language-audit {lang}` — periodic drift check (also run by teamcouch after each wave)
Compares the kit against the live system: required headings present; profile fields vs schema version; TM/`_names.yaml` rows vs glossary ids actually tagged in translated carnets (missing/unused/conflicting); `Editor / review traps` vs WATCHLIST `{Language}-Specific` items (traps discovered in reports but absent from the kit); skill changes since the kit's `skills:` hash snapshot (from the last run report) that affect the kit; locale JSON missing keys; frontend registry vs profile (`active`, `dir`, fonts); onomastics checker and typography linter results over all approved carnets; corpus consistency scans like the Башкирцева/Башкірцева drift. Output: `.claude/reports/YYYY-MM-DD-{lang}-audit.md` with fix list; applies mechanical fixes itself, escalates policy ones.

### 5.3 `/pilot-run {lang} 001` — fixed pilot slice, baseline producer
Runs the protocol in §6 end to end as an ED sub-mode: scaffold → ONM gate → TR → OPS → RED → CUL → CON → verify strict → BTA → VOX → FAB (optional) → report. Produces `.claude/reports/YYYY-MM-DD-{lang}-001.md` with the baseline block (§6) and appends the plateau row to `executive-director/SKILL.md`. Refuses to start if `/language-onboarding` validation is incomplete.

### 5.4 `/transliteration-table {lang} {carnets…}` — name-table builder (used by ONM)
Mines glossary ids tagged in the given carnets (`glossary-references.ts`), infers `source_lang` (glossary `type`/category + aliases + RSR hints; asks when ambiguous), proposes `render` + `variants` per the scheme with a citation per row (dictionary entry, publisher usage, Wikipedia-in-language as *weak* evidence only), cross-checks against existing tables of sibling languages (ja ↔ zh source-language agreement; vi ↔ en Latin forms), writes `status: proposed`, and emits a conflicts memo. Idempotent; never overwrites `locked` rows.

### 5.5 `/lang-registry-migrate` (one-off, engineering) — collapses the ~40 lists into the generated module, adds the relaxed hook regex, and leaves a test (`src/shared/src/utils/languages.test.ts`) that fails if a raw language list reappears (grep-based guard in `just check`).

## 6. Sequencing and pilot protocol

Recommended order: **pt → zh → ja → vi → ar.**
- pt-BR: zero tooling delta after es, high model quality, largest low-risk audience win; validates the meta-skills on an easy case.
- zh-Hans before ja: both need the CJK tooling (§3.2–3.3, §3.7 CJK); zh has the simpler register problem, so the tooling is debugged without keigo noise; ja then reuses everything and adds keigo via the address map.
- vi: Latin script hides a hard problem (kinship pronouns, syllable metrics, NFC); medium model quality; do it after the address map has been proven on ja.
- ar last: only RTL language, needs plurals and layout work, medium model quality, and the numerals/month-name decisions.

Build before the first non-Latin pilot (zh): §3.1 registry + migrate, §3.2 metrics modes, §3.3 linter, §3.4 onomastics table + checker, §3.5 Unicode matching, §3.6 BTA script, §3.7 CJK subset (fonts, `:lang()` CSS, emphasis), §3.8 `ADDRESS:` notes for 001, roles ONM/CUL/BTA wired, meta-skills 5.1/5.3/5.4. Build before ar: §3.7 RTL subset + plurals.

**Pilot protocol (identical for every language, carnet 001):**
1. `/language-onboarding` complete; human signs the decisions memo (defaults apply if unanswered, recorded as such).
2. `/transliteration-table {lang} 001` → ONM review → all rows `confirmed`.
3. TR ×3 agents → OPS → RED → CUL → CON, each with `verify-carnet {lang} 001 --strict` clean at handoff.
4. BTA on the full carnet (pilot = 100 %, not a sample).
5. VOX on 100 %; FAB optional.
6. Report with the **baseline block**: conductor mean score; RED/OPS fix rate per entry; BTA divergence (shifts/100 ¶, omissions); typography violations at first strict run; onomastics missing rows at first TR; length ratio band (per metrics mode); VOX change rate; time per entry; WATCHLIST items opened.
7. Success criteria to schedule a wave: conductor ≥ 0.90; BTA 0 omissions and ≤ 1 shift/100 ¶; typography 0 at CON; onomastics 100 %; VOX change rate ≤ 15 %; decisions memo fully signed. Cross-language comparison table lives in `docs/languages/README.md` (one row per language, same columns).

**Effort (agent-hours are rough; H = human review minutes):**

| Item | Size | Agent h | H min |
|------|------|------|------|
| Registry + migrate (§3.1, 5.5) | M | 8 | 20 |
| Metrics modes + Unicode matching (§3.2, 3.5) | S | 3 | 5 |
| Script/typography linter + heading-date (§3.3) | M | 6 | 10 |
| Onomastics table + checker + `/transliteration-table` (§3.4, 5.4) | M | 8 | 15 |
| BTA script + role + report template (§3.6) | M | 5 | 10 |
| Address map notes for 001 + profile maps (§3.8) | S–M | 4 | 10 |
| Frontend CJK subset (§3.7) | M | 6 | 15 |
| Frontend RTL subset + plurals (§3.7) | L | 14 | 30 |
| Roles ONM/CUL/BTA + skill edits (§4) | S | 3 | 10 |
| `/language-onboarding` + `/language-audit` + `/pilot-run` skills (§5) | M | 10 | 20 |
| Per-language onboarding run (research + kit) | M | 4–6 each | 30 each (decisions memo) |
| Pilot carnet 001 per language | M | 6–10 each | 0–15 (baseline read) |

## 7. Open decisions for the human

1. Dir codes `pt`, `zh`, `ja`, `vi`, `ar` (2-letter, BCP-47 in profile) — confirm, or use `pt-br`/`zh-hans` dirs and take the regex churn now.
2. pt-BR default address: você/senhora (recommended) vs literary tu; and Maman kept as "Maman" (as en/es) vs "mamãe".
3. ja narration style: だ・である (recommended for a private diary) vs です・ます; keigo level for Marie → grandmother/Maman in quoted speech.
4. zh-Hans: God = 上帝 (recommended); quote style “ ” (mainland) confirmed; whether to keep Latin originals in parentheses on first mention of names (recommended: yes, footnote-free).
5. vi: keep Latin name originals (recommended) vs Vietnamised phonetics; tháng Một vs tháng Giêng; modern vs old tone-mark placement.
6. ar: Western vs Eastern Arabic-Indic numerals (recommended: Western); month-name series (recommended: يناير series); « » as outer quotes.
7. Marie's name in zh/ja/ar: adopt the established literary/museum form if research finds one, else transliterate the French form — confirm the rule before ONM locks row 1.
8. Naming policy §2.3 as `docs/NAMING_POLICY.md` — approve the five rules; also resolve the uk Башкирцева/Башкірцева drift (lock says и).
9. BTA cross-vendor back-translation via Windmill LLM tools (read-only) — allowed, or Fable-only?
10. Pilot gate numbers in §6 step 7 — accept as provisional until two languages have baselines.
11. Sequencing pt → zh → ja → vi → ar — accept, or promote by actual visitor share.
12. Plural machinery and `dir` support in the frontend before ar only, or now (it fixes cz/uk plurals today).
13. Community native-reader review for zh/ja/vi/ar (recruit via /r/bashkirtseff, reports through the existing paragraph-report tool) as an additional non-agent gate — yes/no.
