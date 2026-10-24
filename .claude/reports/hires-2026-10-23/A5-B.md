# A5-B: sharp-scan source fixes carried into cz, uk, en and fr, carnets 038–044 (2026-10-24)

Package B-A5 of BRIEF-B. Trees: **cz, uk, en, fr**, carnets 038–044. Source: A5.md (_original commit a546efc4d7). The lead had already run `just sync C L --footnotes`. I followed A4-B-cz, A4-B-uk, A1-B-en and A4-B-fr. No git state was changed, and en 031–037 was not touched.

The accent-only commit 2803078c21 (for example «tète» → «tête») landed while I worked. I left the embedded French alone, as the lead asked. The lead will sync it.

## Method (all trees)

- **Visible text and footnote definitions** were patched by a spec script. Each fragment had to match exactly once in its paragraph's visible text.
- **Comment lines** were written with the Edit tool only. That covers every TR/FRE comment, plus the fr embedded refs.
- **A checker** confirmed four things for every r-label in each tree:
  - one ref in the visible text, placed right after `==`;
  - exactly one localized definition;
  - no English r-definition;
  - an even `==` count.

  It found 0 problems in all four trees.
- **Definitions placement.** Sync had put the definitions at the end of each file. They now sit after their own paragraph.
- **Comparison with the backup.** Against the before-state backup:
  - cz, uk and en lost no comment lines;
  - fr changed only the 20 embedded lines that got a ref.
- **Labels.** `_original` 038–044 has **32 r-labels in 29 paragraphs**. A5 says "34 runs in 31", but its own impact list has 29 paragraphs. 038.0151, 039.0060 and 039.0161 each have r1 and r2.

## cz: 35 paragraphs changed (35 TR comments)

- **Russian marks (29 paragraphs):**
  - 038: 0051, 0052, 0151, 0218, 0228
  - 039: 0060, 0064, 0139, 0155, 0161, 0163, 0209, 0210, 0216, 0221, 0241, 0252, 0254, 0255, 0257, 0258, 0262
  - 040: 0038, 0040, 0052, 0059, 0062
  - 041: 0205, 0208

  In each, the star italics were removed and the run marked. The end-of-line refs left by sync were moved to the runs.
- **Particular cases:**
  - **038.0151:** Worth now stands outside the two runs: „==Opravdu, tady se zřídka vidí šaty od==[r1] Wortha, ==takže na vás upírají oči==[r2],“. I kept the quotation marks, because cz sets direct speech in „…“ (KRR 2026-10-03).
  - **038.0218:** «patouchi» is marked. Sync had skipped the r1 note (its WARN), so I added it by hand. The pun note 38.218.1 and the gloss 38.218.2 stay.
  - **039.0252–0258** (Walitsky's verses): the stray stars are removed and the standard r-note is used, as in the source.
  - **040.0062:** r1 was added beside 40.62.1. That note had said Marie added the bracketed gloss. It now says the editor did.
- **Word and italics changes:**
  - 038.0272: full stop moved outside the italics. The Czech already meant «mal».
  - 040.0148: *zhanobil* and the first *naštěstí* are now italic.
  - 043.0090: the italics on „nic“ were removed (the italic «je» was false).
  - 044.0032: the closing «!» moved outside the italics.
  - 044.0161: the bracket is now roman.
  - 044.0245: full stop moved outside the italics. The cz already had the aunt's words in quotation marks.
- **No change needed:** 043.0238 and 044.0225.

## uk: 35 paragraphs changed (35 TR comments)

- **Russian marks:** the same 29 paragraphs as cz.
- **Particular cases:**
  - **038.0051:** the existing uk mark carried the label 38.51.1 with the correct uk text. It was relabelled to the source's 038.0051.r1 and the old definition deleted.
  - **038.0151:** Worth is outside the runs. The guillemets were dropped, because the print has no quotation marks and the uk line already opens with a dash.
  - **038.0218:** «==погаси==[r1]-лампі[38.218.1]». The r1 note was added (sync WARN). Note 38.218.1 had said the word was «записане латинкою»; that claim was dropped, because the stars mean it was written in Cyrillic.
  - **039.0064:** the mark covered only «Маріє Степанівно». It now covers the whole sentence, which is the run. 39.64.1 was reduced to a gloss on the name.
  - **039.0139:** r1 was added beside the existing gloss 39.139.1. This resolves the sync WARN.
  - **039.0216:** r1 was added beside the existing gloss 39.216.1.
  - **039.0161 and 039.0163:** the italics wrapping the guillemets were removed. In the letter, which is already a `>` quotation, the guillemets were removed too.
  - **039.0252–0258:** nothing was added beyond the source's standard mark, as instructed.
  - **040.0038:** r1 was added beside the gloss 40.0038.1.
  - **040.0062:** 40.0062.1 had said «пояснення подане самою Марі». It now says the editor added the explanation.
- **Word and italics changes:**
  - 038.0272: italics/full stop.
  - 040.0148: *збезчестив* and *на щастя* are now italic.
  - 043.0090: «я» is no longer italic.
  - 044.0032: «о! *…*!».
  - **044.0161:** the bracket was `==*…*==`. It is now roman and unmarked. Note 044.161.1 had said Marie wrote the placeholder. It now says the editors of Mon Journal put the bracket in place of her proverb.
  - **044.0245:** dialogue dashes added: «— Він робить це навмисне, — каже мені тітка… — Він залицяється…».

## en: 34 paragraphs changed (34 TR comments), plus 1 ref moved

- **Russian marks:** the same 29 paragraphs.
- **Old notes reworded.** The r-note now carries the language, so these notes keep only their gloss:
  - 038.0051 [^2] → "*Moussia*: Marie's Russian pet name.";
  - 038.0218 [^1] patouchi gloss;
  - 039.0064 [^39.64.1] patronymic;
  - 039.0155 [^39.155.1]: it had said "French proverb" and now reads "A Russian proverb, *Нашла коса на камень*…" (this resolves the sync WARN);
  - 039.0209 [^39.209.1];
  - 040.0062 [^040.0062.1]: "transliterated" dropped; the gloss is described as the editor's.
- **Kept beside r1 as glosses:** 039.0139 [^39.139.1] (resolves the sync WARN) and 039.0216 [^39.216.1].
- **038.0151:** the quotation marks were removed and Worth placed outside the runs. «si bien que» had been mistranslated as "and so well that". Inside the run it is now "so that everyone fixes their eyes on you".
- **038.0272:** «mai» was an OCR slip, so the [sic] footnote [^5] was removed.
- **Italics and punctuation:**
  - 040.0038: quotes and italics removed from the saying.
  - 040.0148: *ruined*.
  - 044.0032: «oh! *…*!».
  - 044.0161: the bracket is roman.
  - 044.0245: dialogue dash restored.
- **Verse lines 039.0252–0258:** each en line-end dash now stands after the ref.
- **038.0120:** the only non-r source note sync added to en (Marot). Its end-of-line ref was moved after "Marot" and the definition placed after the paragraph. There is no comment, as in the fr precedent.
- **No change needed:** 043.0090, 043.0238 and 044.0225.

## fr

- **Definitions:** all 32 r-labels have exactly one fr definition, «En russe dans le manuscrit ; traduction française de l'éditeur.», placed after its paragraph.
- **Visible fr text changed in 4 paragraphs**, each with one FRE comment:
  - **038.0051:** «- ==Marie, demande lui donc…,==[r1] me dit Machenka.» The stray star was removed. FRE's «Marie» for Moussia is kept inside the mark.
  - **038.0218:** «pris au ==patouchi==[r1][^038.0218.1] lampe». The refs were moved from the end of the line.
  - **038.0228:** «==Et pas d'Audiffret==[r1] - me dit Machenka.»
  - **039.0064:** the doubled «: :» and the stray star were removed. FRE's «Marie Stépanovna» is kept inside the mark.
- **No visible fr text (definition only):** 038.0052, 0151; 039.0060, 0139, 0155, 0161, 0163, 0209, 0210, 0216, 0221, 0241, 0252–0258, 0262; 040.0038, 0040, 0052, 0059, 0062; 041.0205, 0208. The fr text of 038.0272, 040.0148, 043.0090, 043.0238 and 044.* is also not visible. Those paragraphs render `_original`, so fr needed no edit.
- **Orphan source notes:** verify-carnet had failed on 20 definitions with no ref. Each ref was inserted with the Edit tool into the embedded copy, at the source position (these paragraphs have no visible text):
  - 038: 0120.1, 0152.1, 0265.1
  - 039: 0024.1, 0058.1, 0140.1, 0156.1, 0194.1
  - 040: 0102.1, 0111.1, 0150.1, 0184.1
  - 041: 0020.1, 0023.1, 0045.1, 0137.1, 0144.1, 0150.1
  - 043: 0210.1
  - 044: 0059.1
- **Mechanical end-of-line refs moved** to the source position in fr visible text, without a comment: 038.0238.1, 038.0274.1, 039.0236.1, 043.0116.1, 043.0207.1. 038.0202.1 was already in place.
- **Sync-carried English notes:** all 28 were translated into French and placed after their paragraphs. A check finds 0 English source notes left in fr 038–044. In 039.0236.1 the note now opens «Dans le manuscrit, en latin : *vox faucibus exit*…», because FRE had translated the Latin in the visible text.
- **Sync WARNs 039.0097 and 039.0099** («tree uses that label for another note»): false alarms. fr 39.097.1 and 39.099.1 are already the French translations of those source notes, so nothing was done.

## Flags for RED / REV / lead

1. **038.0218 «patouchi»** (A5 owner question 3). It is now marked in every tree, beside its gloss. If the owner prefers it unmarked as a metalinguistic word, remove r1 in all five trees.
2. **039.0252–0258.** The verses carry the standard "Russian" note in all trees, pending A5 owner question 1 (Ukrainian).
3. **044.0161.** The bracket is roman and unmarked in all trees, per A5 question 2. In uk I removed the `==…==` that marked the bracket and corrected note 044.161.1. If the owner picks option B, the italic translation of the proverb gets the mark instead.
4. **uk dialogue.** I removed the guillemets in 038.0151 and in the 039.0163 letter, and added dashes in 044.0245, all to follow the print. The uk dialogue style itself is unchanged, since uk uses dashes. Please check.
5. **Pre-existing fr text issues I did not touch** (out of scope):
   - 043.0116 «Le portes saintes» should probably be «Les Portes saintes».
   - 043.0207 «On donne le L'Enfant prodigue »» has lost its opening «.
6. **en 039.0064 «a daughter just like her»** for «une aussi grande fille» ("such a grown-up daughter") is outside this pass. I left it.
7. **New TM terms:** none.

## Gates

| carnet | cz | uk | en | fr |
|---|---|---|---|---|
| 038 | splicescan empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 039 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 040 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 041 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 042 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 043 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |
| 044 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 | empty, PASS 0/0 |

Before this pass, fr 038, 039, 040, 041, 043 and 044 FAILED on orphan footnotes; they now PASS. `just check-comments` reports OK for cz, uk, en and fr.

The backup, spec scripts and checker are in the session scratchpad, `A5B/`.
