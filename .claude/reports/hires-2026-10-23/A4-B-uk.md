# A4-B-uk — sharp-scan source fixes carried into uk 031–037 (2026-10-24)

Package B-A4-uk of BRIEF-B. Tree: **uk** only. Source: A4.md (_original commit 9297e472e4). I followed the approach of A23-B-uk. No git state was changed.

## Result

- **90 paragraphs changed.** Each has one comment `TR: source fix (sharp scan 2026-10-23): …` on its own line after the text. By carnet: 031: 22, 032: 37, 033: 12, 034: 6, 035: 5, 036: 4, 037: 4.
- **All 89 r-labels in `_original` 031–037 were checked** (84 paragraphs). In each uk paragraph:
  - the Ukrainian rendering of the run is wrapped in `==…==`;
  - the reference sits straight after the closing `==`;
  - there is exactly one definition, `В оригіналі російською; французький переклад видавця.`
- **Sync leftovers cleaned up:**
  - 81 English definitions added by sync were localized.
  - Every mechanical end-of-line reference was moved to the end of its run.
  - 8 definitions were missing and have been added: 032.0002.r1, 0103.r1, 0273.r1, 0412.r1/r2, 034.0021.r1, 0276.r1 and 037.0206.r1.
- **A script check finds 0 problems** across these paragraphs: no missing or extra references, no duplicate or English definitions, no odd `==` count, and the embedded French matches `_original` in every r-labelled paragraph.
- **Star debris removed.** This covers the italics, the `**bold**` (032.0103, 0105), stray single stars (033.0426/0427, 036.0105/0106), and the «…» quotes that the old source had in place of the stars in the confession, 032.0071–0093. 032.0089 «Ох, дурень.» is outside the stars and was left unchanged. Italics that the print really has were kept inside the run: 032.0103 `==*Воскресіння Твоє, Господи*==` and 032.0105 `==*утрені*==`.
- **Speech tags inside the run, as in the print:** 032.0199 and 0200.
- **Dialogue dashes added where the source has them and uk lacked them:** 032.0041–0044, 0199, 0200, 035.0161–0163.
- Paragraphs that already had uk `==…==` highlights and only needed the note (031.0008, 0024–0034, 0058–0060) got the comment «existing uk highlight kept».

## Word changes

| pid | uk change |
|---|---|
| 032.0203 | «Життя Сапоженікових тепер — це й наше життя, це Іліада…» → «Життя Сапоженікових тепер — ідилія, а наше життя — це Іліада, страшніша й кривавіша за Гомерову.» The RED note's literal reading of the damaged source is now obsolete. |
| 032.0205 | The 66 restored words are translated: «Нічого я не додаватиму, це все жарти. Видно, що я додала: хочу мати три троянди (троянда — моя квітка) [Зачорнено: замість] трьох пер, але замість *Ich diene*[^32.0205.1] я справді не знаю, що вписати; думала вписати *volo*[^32.0205.2], але це надто самовпевнено для такої малої, як я, та й волію мати девіз побожніший — Бог міг би розгніватися. …» «[Малюнок]» is removed. The two new uk notes are: *Ich diene* (her spelling; *Ich dien*) = «служу», the Prince of Wales's motto under the three feathers; *Volo* = лат. «хочу». *Ich diene* follows the TM ruling A-01 (original in italics, translation in the footnote), and *volo* is treated the same way. |
| 032.0204 | No change needed: the uk «і впишу свій девіз» already matches «écrirai». |
| 031.0063 | «під загрозою кари» changed from quotes to italics, following the print's *sous peine d'amende*. |
| 031.0062 | *так і для герцога* was already italic. Only the run mark was added. |
| 033.0325 | Italics on «*я*» removed. |
| 033.0356 | «задля малярських тіней» → «заради тіней на гіпсі» (plâtre, was «piètre»). |
| 033.0367 | «— ви паленієте» → «— Ви паленієте». The question «хто це пройшов?» already fitted. |
| 034.0114 | `*Dormi pure,*` → `*Dormi pure*,`, as in the print. |
| 036.0102 | «дражнить *нас*» put in italics. |
| 033.0314, 0320, 0352, 0355, 0361, 0362 | No change needed. The uk text already has Ґалула / «він покараний» / «йому», «а навпаки», «учора ввечері», «штучка», and «щойно *стала* дорослою». |
| Saëtone ×11 (033.0088, 0091, 0179; 034.0304, 0408; 035.0327; 036.0066, 0067, 0071; 037.0346, 0425) | No change needed. Every one already reads «Саетоне» (TM). |
| No-impact list in A4 | Not touched. |

## uk notes changed

- **32.0002.1** «plachtchanitsa»: the «російською (латиницею)» claim was dropped and the note now carries only the gloss «Плащаниця (у Марі *plachtchanitsa*) — …».
- **32.0103.1**: it claimed «В оригіналі французькою». It is now only the gloss «Православний великодній спів (…)».
- **32.0273.1** «botvinia»: reduced to its gloss.
- **32.0412.2**: the «По-російськи в оригіналі» claim was dropped and the name gloss kept. **32.0412.1** (the puzzling family phrase) is unchanged.
- **34.04.6** song note: «Марі занотувала її французьким перекладом» was dropped, because she wrote it in Russian.
- **Kept beside the r-note:** 34.11.5 (кисляк) and 037.206.1 (the proverb).

## Flags for RED / lead

1. **Song titles highlighted.** 034.0021 and 034.0114 «Вниз по матінці (по Волзі)» are song titles, and the hymn at 032.0103 is a title too. I marked all three with `==…==` because the source marks them, although titles are otherwise never highlighted. This is the same open question as 023.0122 in A23-B-uk.
2. **032.0205 «[Зачорнено: замість] трьох пер».** The visible sentence depends on the blacked-out word, as in the French («à [Mots noircis: défaut de] trois plumes»). Please check that it reads acceptably.
3. **Sync WARNs outside the r-labels, checked and left as they are:**
   - 034.0123.1 and 035.0086.1: the uk tree already has its own translation of the note (34.06.4, 035.86.1).
   - 034.0593.1/.2: uk 34.22.8 already covers both singers in one note.
4. **New TM terms** (not written to the TM): *Ich diene* → kept in italics with a footnote (A-01); *volo* → kept in italics with a footnote «лат. «хочу»».

## Gates (uk)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 031 | empty | PASS (0 fail, 0 warn) |
| 032 | empty | PASS (0 fail, 0 warn) |
| 033 | empty | PASS (0 fail, 0 warn) |
| 034 | empty | PASS (0 fail, 0 warn) |
| 035 | empty | PASS (0 fail, 0 warn) |
| 036 | empty | PASS (0 fail, 0 warn) |
| 037 | empty | PASS (0 fail, 0 warn) |

`just check-comments uk`: OK.
