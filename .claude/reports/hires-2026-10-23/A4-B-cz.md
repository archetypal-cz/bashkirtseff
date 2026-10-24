# A4-B-cz — sharp-scan source fixes carried into cz 031–037 (2026-10-24)

Package B-A4-cz of BRIEF-B. Tree: **cz** only. Source: A4.md (_original commit 9297e472e4). I followed the approach of A1-B-cz and A4-B-uk. No git state was changed.

## Result

- **89 paragraphs changed.** Each has one comment `TR: source fix (sharp scan 2026-10-23): …` on its own line after the text. By carnet: 031: 22, 032: 37, 033: 11, 034: 6, 035: 5, 036: 4, 037: 4.
  - 84 of them are the r-labelled paragraphs.
  - The other 5 are word changes: 032.0203, 032.0205, 033.0325, 033.0356, 036.0102.
- **All 89 r-labels in `_original` 031–037 were checked.** In each cz paragraph:
  - the Czech rendering of the run is wrapped in `==…==`;
  - the reference sits straight after the closing `==`;
  - there is exactly one definition, `Pozn. překl.: V originále rusky; do francouzštiny přeložil vydavatel.`, placed after the paragraph.
- **Sync leftovers cleaned up.**
  - The 85 English definitions that sync had appended at the ends of files were replaced by localized ones after each paragraph.
  - All mechanical end-of-line references were moved to the end of their runs.
  - 4 definitions were missing because sync skipped them, and have been added: 032.0002.r1, 032.0103.r1, 032.0273.r1 and 034.0021.r1.
- **Script check: 0 problems.** It found no English definition, no cz-only r-label, and no odd `==` count. In every r-labelled paragraph the embedded French matches `_original`.
- **Star debris removed.**
  - The italics inside the runs are gone.
  - The `**bold**` at 032.0103 and 032.0105 was replaced by the italics the print really has: `==*Vzkříšení tvé, Pane*==` and `==*jitřní*==`.
- **Speech tags inside the run, as in the print:** at 032.0199 and 0200 the mark crosses the closing quote (A1-B-cz precedent 020.0006).
- Visible lines and footnote lines were patched by a spec script. Comment lines were written with the Edit tool only.

## Word changes

| pid | cz change |
|---|---|
| 032.0203 | „Život Sapogenikoffových je teď – to je náš život – Iliada…“ → „Život Sapogenikoffových je teď idyla, kdežto ten náš je Iliada strašnější a krvavější než ta Homérova.“ The 2026-09-29 TR note about the garbled clause is now obsolete. It was left in place, and the new comment says so. |
| 032.0204 | No change needed: „napíšu do něj své heslo“ already matches «écrirai». |
| 032.0205 | The 66 restored words are translated, and «[Náčrt]» is gone: „Nepřidám vůbec nic, to jsou jen žerty. Je vidět, co jsem přidala: chci mít tři růže (růže je má květina) [Začerněná slova: místo] tří per, ale místo *Ich diene*[^32.205.1] opravdu nevím, co tam dát; pomýšlela jsem na *volo*[^32.205.2], ale to je příliš troufalé pro takové malé děvče, jako jsem já, a pak bych raději měla nějaké zbožnější heslo, Bůh by se mohl rozhněvat. Přidala jsem…“ |
| 032.0205 notes | Two new cz notes: 32.205.1 „Německy „sloužím“ (správně *Ich dien*), heslo prince z Walesu pod jeho třemi pštrosími pery.“ and 32.205.2 „Latinsky „chci“.“ *Ich diene* follows TM A-01 (Garter-type motto: original in italics, translation in a footnote). *volo* follows the TM motto row, because Marie offers it as her motto. The wording matches cz 024.68.1 (*ich dien*). |
| 031.0062 | Run marked ==věštit==. The italic now ends before the full stop: *ano i pro vévodu*. |
| 031.0063 | „pod pokutou“ changed from quotes to italics (*sous peine d'amende*). |
| 033.0325 | The emphatic „*já*“ was dropped, because «je» is no longer italic: „kterým namlouvám“. |
| 033.0356 | «plâtre»: „kvůli stínohrám“ → „kvůli stínům na sádrovém modelu“. |
| 036.0102 | „Olga nás otevřeně škádlí“ → „Olga otevřeně škádlí *nás*“. |
| 032.0073, 033.0314, 0320, 0352, 0355, 0361, 0362, 0367 | No change needed. The cz already has the dialogue quotes, Galulu/Galulo, „je potrestán“, „ba naopak“, „Včera večer“, „mašinka“, „právě jsem *dospěla*“ and „Červenáte se … kdo to šel kolem?“. |
| Saëtone ×11 (033.0088, 0091, 0179; 034.0304, 0408; 035.0327; 036.0066, 0067, 0071; 037.0346, 0425) | No change needed. All of them already read Saëtone/Saëtona/Saëtonem. No „Saetone“ is left in cz visible text 031–037. |
| A4's no-impact list | Not touched. |

## Flags for RED / lead

1. **033.0190: fix inside a run.** «commencèrent à faire asseoir» is causative (they made the others sit down, as in a circus). „se začali usazovat“ became „==začali ostatní usazovat…==“. This goes beyond a pure mark, but it was a meaning error inside the run.
2. **Titles highlighted.** Three titles now carry `==…==` because the source marks them as Russian runs, although cz titles are otherwise never highlighted:
   - 034.0021 „==Podél naší matičky Volhy==“
   - 034.0114 „==Podél naší matičky==“
   - 032.0103, the hymn „==*Vzkříšení tvé, Pane*==“

   This is the same open question as uk (A4-B-uk flag 1).
3. **032.0205 „[Začerněná slova: místo] tří per“.** The visible sentence depends on the blacked-out word. It is kept faithful per owner A-07, and uk does the same. Please check that it reads acceptably.
4. **Existing cz gloss notes kept beside the r-note.** None of them claims a language, so they were not changed:
   - 32.02.1 (plaščanice)
   - 32.103.1 (the hymn)
   - 32.273.1 (botvinja; the sync WARN for this paragraph is resolved this way)
   - 34.21.1 (the Volga song)
5. **033.0296, not changed (out of scope).** The aunt says „Podívejte, přišel celý v bílém“, using vy-forms to Marie, whom she addresses with ty. The French «Voilà qu'il est venu» has no imperative. Possible fix: „Hle, přišel celý v bílém“.
6. **Blank line between notes.** In 032.0002 a blank line now separates the r-definition from the existing 32.02.1 definition. It renders fine.
7. **New TM terms** (not written to the TM): *Ich diene* → italics + footnote „Německy „sloužím““ (A-01); *volo* → italics + footnote „Latinsky „chci““ (motto row).

The sync WEAK lines in `sync/A4-cz.txt` (031.0173, 034.0081, 034.0126, 034.0312, 034.0508, 035.0038) are outside the r-labels. Each pairs a source note with the cz note on the same topic, and they were left as they are.

## Gates (cz)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 031 | empty | PASS (0 fail, 0 warn) |
| 032 | empty | PASS (0 fail, 0 warn) |
| 033 | empty | PASS (0 fail, 0 warn) |
| 034 | empty | PASS (0 fail, 0 warn) |
| 035 | empty | PASS (0 fail, 0 warn) |
| 036 | empty | PASS (0 fail, 0 warn) |
| 037 | empty | PASS (0 fail, 0 warn) |

The 037 footnote-glue sidecar lists 2 candidates, 037.0006 (37.06.1) and 037.0237. I did not edit either block. `just check-comments cz`: OK.
