# A4-B-en — sharp-scan source fixes carried into en 031–037 (2026-10-24)

Package B-A4-en of BRIEF-B. Tree: **en** only. Source: A4.md (_original commit 9297e472e4). I followed the approach of A1-B-en, and of A4-B-cz / A4-B-uk for these carnets. The lead had already run `just sync C en --footnotes`. No git state was changed.

## Result

- **98 paragraphs changed.** Each has one comment `TR: source fix (sharp scan 2026-10-23): …` on its own line after the text.
  - 82 are r-labelled paragraphs.
  - 5 are word or italics changes: 032.0203, 032.0205, 033.0325, 033.0362, 036.0102.
  - 11 are Saëtone spellings.
- **All 89 r-labels in `_original` 031–037 were checked (84 paragraphs).** After the fix, every one of them passes a script check:
  - the English rendering of the run is wrapped in `==…==`;
  - the reference sits straight after the closing `==`;
  - each label has exactly one standard en definition, placed after its paragraph;
  - the embedded French matches `_original`;
  - no `==` count is odd and no stray r-reference is left.
- **037.0499 and 037.0500 were already correct** (CON 2026-10-03) and were not touched.
- **Sync leftovers cleaned up.**
  - 81 definitions that sync had appended at the ends of files were moved to their paragraphs.
  - Every mechanical end-of-line reference was moved to the end of its run.
  - 8 definitions were missing and have been added: 032.0002.r1, 0103.r1, 0273.r1, 0412.r1/r2, 034.0021.r1, 0276.r1 and 037.0206.r1. This also resolves the 4 sync WARNs in `sync/A4-en.txt` for this tree.
- **Star debris removed.**
  - Italics were taken off every run except where the print sets them.
  - At 032.0103 and 0105 the `**bold**` became the print's italics: `==*Thy Resurrection, O Lord*==` and `==*matins*==`.
  - In the confession (032.0071–0093) the double quotes that stood in for the stars were replaced by the source's dialogue dashes. The quotes around the liturgical words at 032.0109 were also dropped.
  - Dialogue dashes were added where the source has them: 032.0041–0044, 0199, 0200, and 035.0161–0163.
- **Speech tags inside the run, as in the print:** 032.0199 and 0200.
- **Method.** Visible lines and footnote-definition lines were patched by a checked spec script (each fragment had to match exactly once, and every label had to be wrapped exactly once). Every comment line was written with the Edit tool, anchored at the end of its text line.

## Word changes

| pid | en change |
|---|---|
| 032.0203 | "The Sapogenikoffs' life at present, which is our life too, is an Iliad…" → "The Sapogenikoffs' life at present is an idyll; our own life is an Iliad more terrible and bloody than Homer's." The 2026-09-29 TR/RED notes on the broken reading are obsolete. They were left in place, and the new comment says so. |
| 032.0204 | No change needed. "I shall write on it my motto" already matches «écrirai». |
| 032.0205 | The 66 restored words are translated and "[Sketch]" is gone: "I shall add nothing at all; these are only jokes. You can see what I have added: I want three roses (the rose is my flower) in [words blacked out: place of] three feathers, but in place of *Ich diene*[^032.0205.1] I really cannot see what to put. I thought of putting *volo*[^032.0205.2], but that is too presumptuous for a little girl like me, and besides I would rather have a more pious motto — God might be angry. I have added my two dreams…" |
| 032.0205 notes | Two new notes. [^032.0205.1] reads "In German in the original, in Marie's spelling: *Ich diene* (correctly *Ich dien*, "I serve"), the motto under the Prince of Wales's three-feather badge." This follows the TM row "Ich dien" (a motto, kept in italics, cf. 024/1874-09-23). [^032.0205.2] reads "Latin: "I will"." This follows the motto default, because she offers *volo* as her motto. Both match cz and uk. |
| 031.0062 | ==to divine== is now the run. *yes for the duke* stays italic, with the full stop moved outside the italics. |
| 031.0063 | "on pain of a forfeit" changed from quotes to italics, following the print's *sous peine d'amende*. |
| 033.0325 | "whom *I* lead" → "whom I lead". |
| 033.0362 | "I had just *grown up*", following the print's *devenir*. |
| 036.0102 | "Olga openly teases *us*." |
| 033.0190 | Fix inside the run. «commencèrent à faire asseoir» is causative, so "began settling one another into seats" → "began making everyone sit down". This is the same fix as cz flag 1. |
| Saëtone ×11 (033.0088, 0091, 0179; 034.0304, 0408; 035.0327; 036.0066, 0067, 0071; 037.0346, 0425) | "Saetone" → "Saëtone". The TM rule is that names follow the French at each occurrence. No "Saetone" is left in en visible text in 031–037. The older RED D-35 notes in these paragraphs still mention "Saetone"; they are stale but were left as they are. |
| 032.0073, 033.0314, 0320, 0352, 0355, 0356, 0361, 0367 | No change needed. The en already reads: dialogue (now dashed), Galula, "he is punished", "to him", "on the contrary", "yesterday evening", "the shadows on my plaster casts", "little thing", and "You are blushing … who went by?". The old TR note on «piètre» at 033.0356 is stale and was left in place. |
| A4's no-impact list | Not touched. |

## en notes changed

- **032.0002 [^1]:** the claim "In Russian in the original:" was dropped. The note now only glosses *plachtchanitsa* (the whole phrase is the Russian run).
- **034.0276 [^25]:** «In French in the original: *caillebotte*» was wrong, so it was removed. ==curds== now carries only the r-note.
- **037.0206 [^1]:** the French quotation and "In Russian in the original" were dropped. The note now only glosses the proverb.
- **034.0021 [^5]:** reworded. It now says the title is the French one for the Russian song, not Marie's own.
- **Kept beside the r-note as glosses:** 032.0103 [^2] (the hymn), 032.0273 [^1] (*botvinia*, which stays in Russian italics because Marie comments on the word itself), and 032.0412 [^1] (the family saying).

## Flags for RED / lead

1. **Titles highlighted.** Three titles now carry `==…==` because the source marks them as Russian runs, although `content/CLAUDE.md` says titles are never highlighted: 034.0021 and 034.0114 ==*Down Our Mother Volga*==, and the hymn at 032.0103. This is the same open question as cz flag 2 and uk flag 1. Also, 034.0021 [^5] still gives the original (Russian) title, which the titles ruling discourages.
2. **032.0205 "in [words blacked out: place of] three feathers".** The sentence depends on the blacked-out words, as in the French. Please check that it reads acceptably. cz and uk made the same choice.
3. **032.0087:** Marie's aside "*explain that, Father*, I thought, *and extricate yourself…*" keeps an older TR italics choice for her thought. The source has no italics there. Left as it was.
4. **035.0163:** the 2026-09-29 TR/RED notes below the paragraph cite pids "0164–0166" from before the rebuild. They are confirmed by the print: the passage is Russian.
5. **No new TM terms.** *Ich diene* follows the existing "Ich dien" row and *volo* the motto default. It may be worth adding 032.0205 to the "Ich dien" row's occurrence list (it currently says "024/1874-09-23 only").

## Gates (en)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 031 | empty | PASS (0 fail, 0 warn) |
| 032 | empty | PASS (0 fail, 0 warn) |
| 033 | empty | PASS (0 fail, 0 warn) |
| 034 | empty | PASS (0 fail, 0 warn) |
| 035 | empty | PASS (0 fail, 0 warn) |
| 036 | empty | PASS (0 fail, 0 warn) |
| 037 | empty | PASS (0 fail, 0 warn) |

`just check-comments en`: OK.
