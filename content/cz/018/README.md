# Carnet 018 — Czech Translation

## Status

**2026-09-07**: 26 entries, carnet fully approved. Re-translated from the manuscript on 2026-09-06 (the earlier Czech followed a condensed non-manuscript French), RED pass complete the same week, CON pass complete 2026-09-07 — all 26 entries `editor_approved: true` and `conductor_approved: true`. 018.0244 (1874-04-14) was fully retranslated from the manuscript. The parked variant Czech was discarded per maintainer decision; it survives only in git history (a2a7ca002, d3876fa88, a9727f3ca, 9a3928bfe).

### Open for the maintainer

1. **Czech-ised vs. French-kept Russian surnames.** The corpus mixes both (Mačenka, Walitský, Azarevič, Zajčenko against Anitchkoff, Tutcheff, Apletcheieff, Tchernichoff) and neither dominates. CON aligned individual names inside 018 to whatever the rest of the corpus already used, but the general rule needs a decision. Recorded in `content/cz/TranslationMemory.md`.
2. **Mačenka outside 018.** The spelling is now locked on Mačenka, but cz/015 still reads Mašenka and cz/016 Machenka — two earlier FAB passes normalised in opposite directions. A separate sweep is owed.
3. **Manuscript star marks.** The transcription marks uncertain readings with ★ and stray asterisks. cz/018 keeps them in some entries (04-02, 04-19) and drops them in others (04-08, 04-10, 04-11). The source's own star/asterisk placement is frequently unpaired, so reproducing it faithfully would import garbage; leaving it silent loses a signal. Needs a policy, not a per-entry guess.
4. **"la vile multitude".** Now rendered "podlá lůza" at all three occurrences, including 018.0299 where Marie applies it to the stars. FAB had left this to the conductor; the varied earlier version is preserved verbatim in the CON comment on that block if the maintainer prefers it.
5. **Acrostics.** Both acrostic poems (28 and 29 March) are translated for sense, with a new translator's footnote supplying the hidden name. Verse-level re-creation was deliberately not attempted.

## Changelog

### 2026-09-07T20:45:00 @claude-CON
Full conductor pass, all 26 entries, block by block against `content/_original/018/` rather than the French embedded in the translation files. All 26 set `conductor_approved: true`; neighbouring carnets carry no score key in frontmatter, so per-entry scores live in the CON summary comment at the top of each file (range 0.90–0.93, carnet mean 0.92).

Fixes with the French grounds recorded in dated CON comments on each block. Meaning and completeness: 018.0190 retranslated (the whole sentence rested on a misreading of "C'est dans les yeux... mais on peut le dire plus simplement"); 018.0194 restored "A la vente" and corrected "Georges lui a présenté Paul" (Paul was introduced to Tutcheff, not to us); 018.0245 restored the dropped "sans la connaître", which is the entire joke; 018.0203 returned the white dress inside Marie's outfit parenthesis and "Plusieurs" to "several"; 018.0269 "brought to the carriage" is being led there, not being introduced; 018.0055 reads "prévenir" as prevent; 018.0097 tense; 018.0206 tense; 018.0196 impersonal "on"; 018.0037 "méprisable"; 018.0038 feminine "celles"; 018.0034 clitic placement.

Invented or missing text: nine letters L A M B E R T I E prepended to the 29 March acrostic were removed — unlike the 28 March poem, the manuscript has no separate initials there — and replaced with a translator's footnote; a matching footnote was added for the 28 March acrostic; footnotes were added for the orphaned `[sic]` at "Pauvré-moi" and bold/italic emphasis restored at 018.0127, 018.0175 and 018.0234; the two dashes of Marie's fantasy list at 018.0332/0333 were restored.

Consistency: names aligned to the corpus (Tutcheff, Apletcheieff, Walitský, Mačenka, Zajčenko, Huba for le Bec); plaščanice per TranslationMemory; four missing heading commas; "Bože můj" word order; "gronderie" as hubování. Two glossary tags removed for source parity (`#Duke_of_Hamilton` on 018.0195, `#Monte_Carlo` on 018.0270). Three English passages in 1874-04-19 converted to Czech-in-text with the English footnoted, per `content/cz/CLAUDE.md`. Two questions FAB had explicitly left to the conductor were decided: the self-quotation of Marie's verse at 018.0216 and the repeated "la vile multitude" at 018.0299.

Marked the four remaining stale annotations SUPERSEDED — a FAB note on 018.0317, a RED and a FAB note on 018.0318 (the invented moonlit tableau), a FAB note on 018.0327 (the invented Le Derby detail) — each quoting the discarded condensed text. Confirmed all four blocks now match the manuscript, including the three fabrication categories named in the 2026-09-05 audit. No manuscript-versus-embedded-French mismatch was found anywhere in the carnet: the embedded copies are current. No git commands run.

### 2026-09-07T17:50:00 @claude-RED
RED+CON carry-in pass over the restored manuscript text, all 26 entries, block by block against `content/_original/018/`. Fixed: 018.0244 (1874-04-14) fully retranslated from the manuscript — the condensed version had reversed event order and dropped Stiopa's line; 018.0219 (1874-04-12) "Než zjistím jeho jméno" → "kdo to je" (narrowed "qui il est" to "name"); five single-word/phrase English footnotes missing their required Czech gloss (1874-04-06, 04-07, 04-08, 04-17 ×2); footnote 18.278.1 (1874-04-19) still carried the pre-fix Czech wording after an in-text RED correction; corrupted `entry_id` frontmatter and a missing `#` markdown heading marker on all five files 1874-04-19 through 04-23 (introduced by the 2026-09-06 restoration, undetected until now). Marked 9 stale RED/GEM/FAB comments SUPERSEDED across six files (1874-04-11 ×3, 04-13, 04-15 ×2, 04-16, 04-19 ×2) — each quoted or argued from the condensed non-manuscript text against the manuscript. Verified against the 2026-09-05 audit's three fabrication categories (invented narration 018.0318, invented quotation 018.0269/0273, invented documentary detail 018.0327) — all confirmed correctly restored. Open for CON/TM: 018.0195 (1874-04-10) carries a `#Duke_of_Hamilton` tag absent from the source paragraph's tag line. No git commands run.

### 2026-09-07T15:00:00 @claude-ED
Discarded the 120 parked-variant comment lines (79 `Dřívější český text` wrappers + 41 `TR: ZACHOVÁNO` introducers), reset editor/conductor approvals on all 26 entries, added an ED reset note per file and an ED OPEN marker on 018.0244. No visible text changed.

### 2026-06-14T10:00:00 @claude-RED
Fluidity pass vs French originals: 9 GEM-splice repairs + one corrupted French-original line fixed (Czech text embedded in %% comment, 018.0154); meaning fixes ("Il nous faudrait" = peníze by se nám hodily ne "měli bychom", carcasses = trosky ne mrtvoly, réunions = večírky, douce = jemná), gender fixes (učesala — Allard is a woman, feminine plurals, sama sobě), calques (rend+adj, trouver+adj, mauvais sang), "in furia" footnoted. RED comments inline.
