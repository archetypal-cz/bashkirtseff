# WORKPLAN 2026-11-10 — works glossary, tier 2 (A-60)

Owner (chat 2026-11-10): tier 2 GO, tier 3 = selection (~100 works with PD images / full texts) — this plan covers tier 2 only. Supervised by the ED session of 2026-11-10 (evening).

Scope: 111 works mentioned exactly twice in the diary (`works-final.json` filtered to 2 mentions, minus the 9 Marie-own works done in tier 1) = 222 paragraphs. Inventory + batches: `.claude/reports/works-glossary-2026-10-10/tier2/`. Brief: `RESEARCH-BRIEF-TIER2.md` there.

| Layer | What | Who | Gate | Status |
| --- | --- | --- | --- | --- |
| 1 | research + entries (9 Sonnet batches: 2 art, 2 stage, 2 opera/music, 3 literature) with images and full_text | 9 background agents | lead: frontmatter parses, no process notes, image sizes, `check-links-repo`, report JSONs complete | running |
| 2 | fold superseded stubs (report `supersedes`) into the new entries | lead (`glossary-merge`, dry-run first) | 0 broken links, only %% lines + glossary files in diary diff | pending |
| 3 | tag the 222 mentions (+ `extra_mentions`) in `_original`, judged against the French; `propagate-tag --target … --apply` per work to cz/uk/en/fr; `entities-sync --apply --strict --carnet …` | Sonnet reviewers + lead | diary diffs = tag-line additions only; `check-links-repo` 0; splicescan unchanged vs HEAD | pending |
| 4 | ledger A-60 (tier 2 part), memory, this plan | lead | — | pending |

Commits: one per layer, pushed after layer 3. Tier 3 selection follows as its own run (not in this plan).

## Log
- 2026-11-10 — batches built (`tier2/batch-01…09`), brief written, 9 agents launched.
- 2026-11-10 11:20 — batches 04, 05, 06, 07 reported. Lead-pass checklist so far: (a) DUPLICATE: batch 04 `culture/music/LE_ROSSIGNOL_CHE_VOLA` vs batch 05 `culture/music/ROSSIGNOU_CHE_VOLA` — same Niçois song, merge; (b) POLIUTO_DONIZETTI: 1848 première / 1838 ban uncited — cite or soften; (c) MABEL_VAUGHAN «The project did not read the book» — reword; (d) layer 3 judgement calls: 030.0341 Stabat (Pergolesi tag doubtful), 005.0023/006.0245 Lamplighter→Mabel Vaughan, 031.0131 Grand-papa≠papa, 059.0193 Romeo (manual tag, no bare alias), 063.0443 Rienzi = novel; (e) unidentified: Mrs Bodgers novel, Herbagère, Volga song, Vivre seul ici-bas, Si j'étais reine.
- 2026-11-10 11:25 — batch 01 reported (9 new art entries, 6 images). Layer-3/source flags: 043.0191 VENUS_DE_MILO → VENUS_DE_MEDICIS; VENUS_DE_MILO.md stale RSR note «Medici Venus has no entry» → remove; 103.0046/103.0178 «Aurore» is Bouguereau's (LAN says Cabanel) → RSR note; 103.0046 wrong tag culture/literature/COROT → check; GRETCHEN_VON_MAX supersedes people/mentioned/GRETCHEN.md (check the stub's other refs first — «Gretchen» may also be the character).
- 2026-11-10 11:30 — batch 08 reported (6 new lit entries, 5 enriched, 32 links; W245 unnamed Turgenev novel skipped — TOURGUENIEFF covers it). Flags: merge people/mentioned/EUGENE_ROUGON → SON_EXCELLENCE_EUGENE_ROUGON (086.0534/0559); culture/theater/HONORINE is an actress — novella mentions need manual tags, alias collision; DE_L_AMOUR_STENDHAL edited by batches 07 and 08 (check it parses); Bible 103.0399 «jamais lue» vs 1875–76 readings left as doubt.
- 2026-11-10 11:33 — batch 09 reported (10 art entries incl. splits MOISE_MICHEL_ANGE, PORTRAIT_VICTOR_HUGO_BONNAT; 6 images, Pensieroso CC BY 2.0 — credit must name Richard Mortel). Flags: JOHN_SINGER_SARGENT.md links Madame X to PORTRAIT_MME_X (Marie's pastel) → fix link; BONNAT.md empty template stub → leave (not a work); 103.0551 not the Sargent portrait (inventory error).
- 2026-11-10 11:40 — batch 03 reported (14 entries, 4 images; 2 images blocked by Commons 429: Ristori as Mary Stuart, Nadar Bernhardt as Lady Macbeth — lead retries). Flags: 073.0154 «Les Horaces» likely David's painting, tagged to HORACES stub; 086.0629/098.0386 Hamlet = the play, retag from HAMLET_THOMAS; supersedes HORACES, OTHELLO, LES_MIRABEAU, IMPROMPTU_DE_VERSAILLES.
