# WORKPLAN 2026-10-03 — reading-conventions wave (cz / uk / en)

Owner (KRR) rulings 2026-10-03 — canonical text in `content/CLAUDE.md` → "Foreign-language passages", `content/cz/CLAUDE.md` → "Cizojazyčné pasáže" + "Přímá řeč", `content/en/CLAUDE.md`, `content/uk/CLAUDE.md`.

## What changes

| Tree | A. Foreign passages | B. Dialogue |
|---|---|---|
| cz | Marie's English/Italian/Latin/Russian/German runs (now `==English==` + Czech in footnote, ~1.4k runs) → `==Czech translation==[^n]`, footnote `Pozn. překl.: V originále anglicky: „original“.` Same for untranslated foreign phrases in *italics*. | dash-led dialogue (`— `/`– `, ~7.2k lines) → Czech „…“ with the attribution outside: `„Dejte ho mně,“ řekne Audiffer.` |
| uk | same as cz (`==…==` ~2.4k runs) → Ukrainian in text, footnote `В оригіналі англійською: «…».` | unchanged |
| en | Marie's English stays. French/Italian/Latin/Russian/German phrases left in *italics* → English in text, `==…==`, footnote `In French in the original: *…*.` | unchanged |

**C (cz only) — outfit notes:** Marie's toilette notes "(robe …, chapeau … *bien*)" → „*sluší*“ (owner 2026-10-03 later: not „sluší mi to“; „pěkné!“ / „šik“ also fine); "pas mal" → „ujde to“; "très bien" → „*moc sluší*“. Owner report 015.0056 (2026-10-03), done in 015; ~84 other cz files carry the old bare „dobře“.

Not in scope: whole foreign-language paragraphs/entries that are already translated with a run note (`V originále anglicky (tento a N…)`, `In English in the original.`) — leave them. Titles of works, proper names, naturalised loanwords, puns.

## Worker brief (per carnet, per tree — one agent per carnet per tree)

1. Read `.claude/skills/_shared/editing_rules.md`, the tree's `content/<lang>/CLAUDE.md` sections above, `content/CLAUDE.md` "Foreign-language passages".
2. For each entry file in `content/<lang>/NNN/`: compare with `content/_original/NNN/` (the reference — the embedded `%% French %%` copy may be stale).
   - A: find every foreign-language run in the visible text (`==…==`, untranslated *italic* phrases, leftover English/Italian/Latin). Translate in Marie's voice, keep `==…==` around the translation, put the exact original (from `_original`) in the footnote. Reuse the existing footnote ID where one exists (convert "meaning" note → "original" note); new footnotes follow the file's existing ID scheme. Never leave a foreign run + translation note.
   - B (cz only): convert dash dialogue to „…“; judge where speech ends and narration begins; punctuation of the speech inside the quotes; nested quotes ‚…‘; dashes used as parenthetical/em-dash punctuation (` – ` mid-sentence) stay. Closing quote is “ (U+201C).
   - Edit only visible text and footnotes. Never touch `%% … %%` comment lines or paragraph IDs (splice-safe — editing_rules §).
3. Add one comment per changed entry, e.g. `%% 2026-10-03T14:00:00 TR: Reading-conventions wave (KRR 2026-10-03): foreign runs translated in text, originals to footnotes; dialogue to „…“. %%`
4. Gates: `just verify-carnet <lang> NNN` PASS, `just splicescan <lang> NNN` prints nothing. Self-check: `grep -c` of paragraph IDs unchanged; for cz no remaining `^(—|–) ` dialogue lines unless justified (list them).
5. Don't commit; no `git checkout/restore/stash`. Report: counts (runs converted, dialogue lines converted, footnotes added/changed), doubtful cases.

Review (RED-lite, separate agent): spot-check every converted footnote against `_original`, read dialogue conversions for punctuation, verify gates; fix directly.

## Models
Workers: Sonnet 5.5 (mechanical-with-judgment TR). Reviewer per batch: Opus. Pilot (carnet 034): Opus workers.

## Rulings after pilot (KRR 2026-10-03)
- French tics left in translations (*Bigre*, *Pardi*, *comme il faut*…) → translated, `==…==`, French in footnote; first occurrence per entry footnoted. Reverses en *Bigre* ruling.
- cz: ALL direct speech with attribution goes in „…“, dash or not.
- cz Hamlet: „To je, oč tu běží“.
- Footnote marker `==…==[^n],`; [sic] → footnote; metalinguistic runs stay foreign + footnote; TMs updated before wave.

## ED defaults (owner may veto)
- Only text still LEFT in a foreign language gets converted+highlighted; tics already translated earlier (en "Pardi" → "Of course!") stay as they are, no retro-highlight.
- "One rendering per tree" applies to interjection tics (Bigre → en "By Jove!"); phrases like *comme il faut* may vary by context.
- Ordinary French words earlier kept in italics (*panier*, *caillebotte*) → translated + ==…== + "In French in the original" (consistent with owner's "highlight too").
- Long foreign runs inside a French paragraph (several sentences, > ~60 words): footnote says only „V originále anglicky.“ (original via the original-text toggle); shorter runs quote the original. Owner may want always-quote.
- Naturalised words in uk/cz use the target-language spelling (кольдкрем, прима-донна), not Latin script.
- Visible [sic] after translated words → footnote (with Marie's French). ~163 en files; handled carnet by carnet in the wave.
- Pending owner: en *Mardi!* → "Zounds!"; Euax footnote (LAN says Greek/Evoe — needs RSR check before cz/uk copy it).

## Status
- [x] Pilot 034 cz / uk / en (Opus) → rulings above
- [x] 034 review + apply rulings (Opus CON): cz 0.93, uk 0.94, en 0.94 — committed 921d470d4f, 99f0db13f5
- [x] TM supersede notes cz/uk/en (921d470d4f) — many invented renderings, owner veto pending
- [ ] cz 000–106
- [ ] uk 000–106
- [ ] en 000–106

## Wave log
COMMITTED (pushed 2026-10-04): uk 000–106 COMPLETE + follow-up sweep; en 000–106 COMPLETE (main pass); cz 000–036, 040–042; all trees 034.
IN FLIGHT: en 085–087, 091–106; cz 037–039, 043–066.
NEXT: cz 021+, uk 037+, en 046+. Then: titles touch-up for batches before the titles ruling (cz 000–002, uk 000–008, en 000–008); en Marie's-English verbatim pass for en 000–003, 005–008, 034; names sweeps (uk Hitchcock/Galignani/London House/plobster/Ange; en accents); stray * Russian markers scan.
Brief: .claude/reports/wave-2026-10-03-worker-brief.md. Batches of 3 carnets per tree; Sonnet worker → Opus CON-review → verify → commit per tree-batch.
- RULED 2026-10-03: titles → established target-language title when one exists (original in footnote), else original title in italics + gloss. Already-committed batches (000–005, 034) need a titles touch-up pass later.
- RULED 2026-10-03: table d'hôte naturalised, stays.
- 002 03-07 `*…♦` markers: owner says probably not Russian; he'll obtain PDF scans — parked.
- Owner item: en 004/05-04 Marie's English "lauded" (prob. 'laughed at') was silently corrected to "derided" by an earlier pass — restore her word + note?
- RULED 2026-10-03: Marie's English kept verbatim ("lauded"), meaning discussed in footnote; silently normalised English to be restored when found (reviewers: compare Marie's English runs with _original).
- TODO sweep: en Marie's-English verbatim restoration — earlier passes normalised her English (004 had ~60 phrases). Done: 004. Batch reviewers check from 009 on (3b); needs a dedicated pass over en 000–003, 005–008, 034 (and any batch whose reviewer didn't diff her English). Scan-noise (1→I, I→!) stays corrected.
- TODO: stray single * Russian-passage markers spanning paragraphs (cz 006/06-29, 07-11; likely other trees/carnets) create accidental italics — tree-wide scan + convert to ==…== with Russian-passage footnote after extent check vs tome docx (RSR).
- Owner item (uk names): Hitchcock spelled Гітчкок 39× / Гічкок 64× / Хічкок 2× — pick one + sweep; Galignani ×3 spellings.
- Owner item: mottoes (Honni soit qui mal y pense, ich dien) kept in original italics + footnote (current en TM) — or translate?
- TODO (en names): accents stripped from names in en (Laferriere, Remy, Saetone, Fortune for Fortuné, Champs-Elysees…) — tree-wide names pass.
- Research item (with owner's PDF scans): ~10 **bold** runs in _original 016–032 match docx asterisk-italic runs without ★ — possibly missed Russian-passage markers; check scans before adding Russian notes tree-wide.
- TODO uk names: London House Latin per TM (016 «Лондон-Хаус», 031 «Лондон-Гаусі» need sweep) — bundle with Hitchcock/Galignani ruling.
- uk 'plobster': ED default = Marie's coinage, lowercase ==плобстер== + footnote (TM majority + 034); 023 (committed) has capitalised Плобстери — fix in names sweep. uk 025 'Ange' in Latin script vs 024 Анж — names sweep.
- TODO uk: 32 visible [Закреслено:] → [Викреслено:] sweep; SOUCAP glossary entry misfiled (person/joke, not hotel) — RSR.
- RESEARCH (RSR, source-side): tome docx marks Russian passages with asterisk pairs; many such lines in _original lack the Russian-passage note (e.g. 037/07-17, 07-19, 038.0051–52, 038/08-09, 039/08-15, 039 father/son letters tome05 ¶4148–52, 039/08-22). Systematic docx-vs-_original scan → add notes in _original → just sync cz/uk/en. Ties in with the stray-* and bold-runs items.
- Owner item: Niçois oaths (Sacrediou, San Biou de Biou, Coquine de Biou, Cap de Biou) — en translates (Great heavens / Heavens above), uk keeps Niçois in italics when Marie flags 'comme disent les Niçois' (metalinguistic) but has Кап-де-Біу highlighted. Need one rule.
- RESEARCH: *Dormi pure* (048/11-01, also 034) — RSR/LAN say Bellini/La sonnambula; probably Scuderi's song. Fix source notes + footnotes.
- uk sweep: ==джентльмен== in committed 022/1874-08-03, 031/1875-04-08 (wrong case → джентльмена), 038/1875-08-04 → plain (ruling CON 3604c8fbd0). Source LAN fixes: _original 045/10-01 non-sens (not English), 045/09-30 Charogne (not Russian).
- cz polish candidate: 020/06-07 Moreno accent joke flattened („To je dáma, která byla do mě zamilována“) — render as accent parody like uk.
- Motto sweep (pending owner confirmation of 'mottoes stay original italics + footnote'): uk 036 ==Сміливо й любовно==, uk 063/070 ==З жадоби слави== still translated in text.
- RSR: _original/050/1875-12-04 [^2] false Tacitus/Septimius Severus claim → fix + sync.
- en sweep: old moujik/muzhik forms in committed 007/1873-07-13, 014/1873-12-22, 018/1874-04-14, 024/1874-10-23 → TM (==peasant(s)==).
- uk names sweep: San Giovanni in Laterano half-Italian (060/05-13), via di Roma, via di Ripetta Latin script.
- Mottoes: uk 026 + 059 translate *Honni soit* (highlighted) while en keeps it French — owner ruling needed (already listed).
- RSR source fixes: _original/063/1876-07-09 [^10] false 'In English in the original'; _original/055/1876-03-17 [^4] + LAN non-sens; _original/045 LAN non-sens & Charogne; _original/053.0204 'Misera me' labelled Latin (Italian).
- en sweep: barcaccia plain italics in committed 055/1876-03-10, 03-22, 057/1876-04-10, 04-12 → ==club box== (TM).
- uk sweep: gentlemen-riders forms (018/1874-04-23, 084/1879-02-23) → TM form.
- RSR source fix: _original/078/1878-02-17 [^1] 'In Swedish in the original' — nothing Swedish in text.
- cz names: 026/11-19 „Détroit des Mouches“ vs 015–016 „Úžina much“.
- Owner: verify Czech titles „Dinorah“ (Le pardon de Ploërmel) and „Lombarďané na první křížové výpravě“.
- Owner item: *le Skating* — uk ruled ordinary noun ==ковзанка== (070–072 CON); alternative venue name «Скейтинг». uk leftovers: 069 ==Skating== (×8, batch 067–069), 075/1877-10-29 «Скейтинг», 087/1879-12-23 ==skating==. en: treats as venue? check consistency.
- uk sweep: CHARLES acrostic lines (021/07-12, 023/08-08) highlighted in uk — per rule 'Marie's own French verse is not a code-switch' → remove ==, keep footnote.
- DIVERGENCE: Skating — en rules venue name (no ==, "the Skating"); uk rules ordinary noun ==ковзанка==. Owner to decide (listed).
- en sweep: 'my emperor' capitalisation unify in 074–083 (Emperor ×9 / emperor ×6).
- RSR source fixes: _original/086/1879-08-19 [^engverse] false 'In English'; _original/086/1879-08-23 [^chic] odd.
- RSR source fixes: _original/092/1881-07-04 [^4] and 093/1881-08-23 [^2] call 'I!' English (it's '!!'); 092/1881-07-17 [^3] Ave note check.
- 'I!' = OCR slip for '!!' (RSR 093/09-24): fix _original 092/1881-07-04 [^4], 092/1881-07-23 [^2], 093/1881-08-23 [^2]; en + cz 092/07-04, 093/08-23 still treat it as English → fix in their waves.
- cz sweep: ==gentleman== / ==jezdci-džentlmeni== in committed cz/022, 072–073 → plain naturalised „džentlmen“ (as uk ruling + cz 028).
- RSR source fix: _original/100/1883-07-28 [^1] calls non-sens English.
- Owner Q: drop 'original French title' footnotes for titles with an established target-language form when the original is French (keep only for Italian/English/etc.)?
- Owner Q (en): Kurhaus at Soden = the family's hotel name ('Soden, Kurhaus') → names rule vs TM 'the spa house'.
- en sweeps: 'Monsieur le comte' (070–072 ×58) vs 'Monsieur the Count' (069) — pick; plobster plain in 058–059 vs highlighted elsewhere; bédouin 'Bedouin wrap' (070) vs 'cloak'; gettatura 'a curse' (070–072) vs 'the evil eye' (068).
- Owner Q: lazzaroni — translate ('street idler') or naturalised English?
- RSR: _original/099/1883-04-18 'In English' footnote moved by backfill from 'life' to paragraph end; tome15 shows all French — check manuscript/Kernberger; en/uk/cz differ.
- Owner Q: starovoï — староста (village elder) vs становой (district police officer; Marie's own gloss 'fonctionnaire de la police' in 102.0637).
- cz TM: conflicting rows 'robe Archiduc' (šaty Arcivévoda 032 vs šaty Archiduc 033; corpus 7:2) → retire Archiduc row.
- en check: American spellings found in en 093 (color/theater/-ize/gray/gotten) — scan other en carnets for US spelling (EN ruling: British).
- en sweeps: *Nom d'un chien* → ==Botheration!== (084 Hang it all, 091/103 Good heavens, 093 By the name of a dog, 100 damn it); *La Dame aux camélias* French in 082–084 vs *The Lady of the Camellias* elsewhere.
- RSR source fixes: _original 085/05-29 chaperon, 086/08-29 break wrongly 'English'; 085/05-19 'TR:' prefix in footnote.
- en names: 'le père Julian' → père Julian ×17 / old Julian ×13 / Father Julian ×6 — pick one + sweep (owner/EN ruling).
- cz/uk 098/01-13: *À la porte* is the play performed at the ball, not the Porte-Saint-Martin theatre — fix (uk 097–099 already treated as play title; check cz).
- en sweep: *cimaise* → ==the line== (TM ruling 097–099); 104 italic cimaise; 088 'picture rail', 092 'eye level'.
- en sweep: *Idem* → 'Ditto.' in 096/1882-08-03, 102/1883-12-15 ('Same.'); Bethlehem shepherds painting title variants in 103.
