# Tome 07 rebuild plans: review (053–059, 2026-09-28)

Plans: `final/plan-053.json` … `final/plan-059.json`. They are built by `fix07.py` from the drafts in `draft07/` (`just rebuild-draft-plan 053 … 059`). Every correction is scripted, and the log is in `final/fix07.log`.
Source: `content/_raw/tome07.docx`, ¶44–4952. Scan: `content/_raw/scans/Tome7.pdf`.
**Page offset:** the printed page equals the PDF page (checked on p.180, 214, 238 and 253). The offset for tome 9 does not apply here.
**Run:** the seven plans must go in one multi-carnet run, `just rebuild-carnets final/plan-053.json … final/plan-059.json`, because paragraphs move between 055→056, 056→057 and 057→058.

## Summary

| Carnet | Entries | Carried | Moved in | Moved out | New | Dropped | set_french | Kinds set by the plan |
|---|---|---|---|---|---|---|---|---|
| 053 | 19 | 492 | 0 | 0 | 2 | 0 | 2 | margin 2 new + 3 old, rayé 3 old |
| 054 | 18 | 660 | 0 | 0 | 14 | 0 | 0 | margin 1 new + 5 old, editorial 2 new, rayé 1 new + 2 old |
| 055 | 27 | 1174 | 0 | 31 | 76 | 4 | 9 | margin 5 old, rayé 2 new + 6 old |
| 056 | 14 | 512 | 31 | 76 | 68 | 1 | 0 | margin 2 new + 8 old, rayé 2 old |
| 057 | 5 | 132 | 76 | 10 | 39 | 0 | 1 | margin 3 old, editorial 1 new |
| 058 | 7 | 208 | 10 | 0 | 61 | 0 | 2 | margin 4 new + 2 old |
| 059 | 20 | 591 | 0 | 0 | 374 | 9 | 0 | margin 10 new + 9 old, other 15 old |

The totals come from the dry run in `final/dry07.out`.

**Letters are left untouched.** Commit 1660b922e (kind-marker, already on main) marked 99 letter paragraphs in 053–056 with researched sources. The plans set no kind on those paragraphs, so the existing markers stay. The draft's own letter guesses were removed. They were dialogue lines opening with «— Ma chère», «Mademoiselle, …» or «Monsieur, dis-je…»: 054.0231 0265 0287 0481 0560, 055.0085 0517 0727 0967, 056.0022 0085, 059.0368, and new ¶4090 and ¶4466.

## 1. Cross-carnet moves

The draft proposed each move below. The Livre title pages and their «depuis … jusqu'au» dates decide whether it stands.

| Move | Verdict | Why |
|---|---|---|
| 055.1179–1209 → 056 | **accepted** | Livre 56 covers «depuis le lundi 27 mars» (¶2662). The day continues after the title page as «Lundi 27 mars 1876 (suite)» (¶2664). The new entry 056/1876-03-27.md gets the heading «Lundi 27 mars 1876 (suite)». |
| 055.1176–1177 → 053 | **rejected; dropped** | These are the motto and title-page lines of Livre 56 (see §3). The draft matched them to the same lines repeated on the Livre 54 title page. |
| 056.0513–0589 → 057 | **accepted** (0567 dropped) | Livre 57 covers «depuis le dimanche 9 avril». The date line «Dimanche 9 avril 1876 - suite» (¶3357) follows the title page. The new entry 057/1876-04-09.md gets that heading. |
| 057.0133–0142 → 058 | **accepted** | Livre 58 covers «depuis le jeudi 13 avril». The date line «Jeudi 13 avril 1876 - suite» (¶3628) follows the title page. 057.0133 was a «[Suite]» placeholder for that line. It becomes the heading through `set_french` «# Jeudi 13 avril 1876 - suite» and moves with the rest. |
| 054.0501 → 057 | **rejected** | 054.0501 is docx ¶1163 (26 Feb). The draft matched it to the short line «Ça ne vaut pas la peine.» (¶3476, 10 Apr). ¶3476 and ¶3478 are inserted in 057 as new paragraphs. |

## 2. Per-carnet decisions

### 053
- **Title-page note ¶46** («Je jure devant Dieu que la plupart des phrases tragiques…», small type on the Livre 53 title page) is a `margin` paragraph. It is the first paragraph of 1876-01-24, before 053.0001, whose cluster holds the date heading. This is the docx order. The entry has no plan `heading`, so the tool warns.
- **053.0235** held the heading «Lundi 31 janvier 1876» and a whole marginal note in one cluster. It is split: `set_french` keeps the heading, and a new `margin` paragraph (¶339) holds «[En travers: Je fais trois quarts d'heure de peinture deux fois par semaine]».
- **053.0004:** the OCR «d'Audiffret.J» is fixed to «.]» with `set_french` (inside the letter).
- **Drawing on p.38:** see Drawings.

### 054
- **Title-page note ¶635** («[En travers: Antonelli était si bien aimé de moi…]») is `margin`, first in 1876-02-12.
- **13 Feb.** The draft had matched the letter signature 054.0059 to the struck draft ¶694, and had re-created ¶695–696 as new text. Fixed, in this order:
  - 0052;
  - «[Bas de page enlevé]» (¶692, `editorial`);
  - «[Rayé: Monseigneur, pensez aux malheureux … Les cireurs de bottes de la ville de Nice]» (¶693–694, `rayé`);
  - 0053–0059, then 0060.
- **16 Feb:** «[Bas de page enlevé]» ¶820 is `editorial`.
- **054.0116 «Traduction: [Où est ton âme ?…»** is left plain. It is the French translation of the letter in Niçois. Marie's or the editors'? See the questions.

### 055
- **055.0681** («Ai-je dit que nous avons quitté notre appartement…») stays under 14 Mar (¶2082). The draft had pulled it to 1 Mar because the title page repeats a line from it («depuis le 14 mars, Hôtel de la ville», ¶1361).
- **055.0708, a completion:** `set_french` adds «Comme vous pouvez voir cet Antonelli était à mettre à la porte. [Une ligne et demie cancellée]» (¶2110). The printed p.145 sets this in the same paragraph and the same type, so it is not a margin note.
- **055.1170: the draft's completion is withdrawn.** 1170 and 1171 together are docx ¶2654. The completion would have duplicated 1171.
- **The letter to her father (055.1166–1174)** is re-set as printed through `set_french`:
  - the bold `**…**` from the extraction is removed;
  - «Komi, Hôtel da te VUIi, io min.» becomes «Rome, Hôtel de la Ville, 10 mars.»;
  - «Cher pire» becomes «Cher père»; «celte» becomes «cette»; «dr» becomes «de»; «A ma lettre» becomes «à ma lettre».
  - Footnote markers are kept. **Follow-up:** `[^4]` («appears to be a cipher…») is now wrong and must be rewritten by RSR in `_original` and in the trees. The date reads «10» in the scan but could be 16 or 18 (see the questions).
- **¶1837**, the OCR garbage «inayc. jcuui *v* mars IO4OJ», is read from the printed p.128 as «[Rayé: Jeudi 9 mars 1876]» (`rayé`). The top line of the page is partly cut in the scan.
- **Joined new paragraphs are split.** The draft had joined them because of the OCR «I» for «!»: ¶1853/1854, ¶2350/2351 and ¶2360/2361.
- **Drawings on p.178 and p.180:** see Drawings.

### 056
- **1876-03-27 (from 055):** the heading «Lundi 27 mars 1876 (suite)» goes into 055.1180. Next comes the Livre 56 title-page note 055.1179 («Je voudrais qu'on supprime ces répétitions…»), as `margin`. It follows the first text paragraph so that the heading does not land inside a margin paragraph.
- **Removed new texts** that were page-break halves of old paragraphs: ¶3051 (056.0337), ¶3073 (056.0358) and ¶3183 (056.0437). ¶3319 was OCR noise.
- **¶3160 «NULLE PART !» and ¶3161** stay plain text. The draft had called ¶3161 a clipping «under a capitals title».
- **056.0567 «------------------------» is dropped.** It is the Markdown underline of the raw conversion: docx ¶3413 «Je ne peux plus écrire !» is a Heading #2 line, which the print sets large, and the print has no rule.
- **056.0568** «[Annotation: (1881. …)]» becomes `margin`.

### 057
- **1876-04-09 (from 056):** the heading is «Dimanche 9 avril 1876 - suite».
- **057.0132 is completed** from the printed p.253: «…ce n'est pas des tempêtes que je suis lasse, c'est des déceptions. Et qui ne le serait pas ? !». The docx cut it at «c'est», before the drawing.
- **¶3612** «[Manque p. 66 mais probablement par erreur de numérotation]» is `editorial`.
- **Drawing on p.253:** see Drawings.

### 058
- **1876-04-13:** it opens with the Livre 58 title-page notes ¶3626 («J'autorise un éditeur intelligent à supprimer…») and ¶3627 («J'ai biffé les répétitions…»), both `margin`. Then comes 057.0133 as the heading «# Jeudi 13 avril 1876 - suite», then 057.0134–0142.
- **058.0053:** `set_french` makes the heading «# Dimanche 16 avril 1876 - Pâques», as in the manuscript (¶3705). The tool warns that the old embedded heading was not found in the trees, so a new embedded copy is inserted and the translated heading still needs «Pâques».
- **¶3905:** «(En travers: Oh ! que c'est bête.]» becomes «[En travers: …]» and `margin`.
- **¶3696/3697** are split.

### 059
- **Title page:**
  - «[En travers: Et la preuve que cet Antonelli…]», 059.0002–0003, is `margin`, since the note runs over two clusters. It comes first, then the heading cluster 059.0001, then 059.0012. This is the docx order, with no plan heading.
  - **The name list 059.0004–0011 is dropped** («- 1 Belmonte … - 8 Angelini»; the numbers are the extraction's own). See §3 and the questions.
- **Draft misalignments fixed.** The first three are old paragraphs the draft matched to a second occurrence of the same words:
  - 059.0050 (Toledo) goes back to 21 Apr after 0049 (¶4012); ¶3981 «Il est si beau et si pâle.» is new text under 20 Apr.
  - 059.0104 goes back to 25 Apr (¶4266); ¶4153 «- Mais le cardinal a une fille n'est-ce pas ?» is new text under 23 Apr.
  - 059.0387 goes back to 4 May (¶4725); ¶4486 «Pensez quelquefois à moi, dit-il en pâlissant…» is new text under 27 Apr.
  - ¶4665 and ¶4826 are removed as page-break halves of 0341 and 0480. ¶4562 is removed as page-top noise; its text is in 0250.
  - ¶4151/4152 and ¶4511/4512 are split.
- **059.0097 is dropped.** «[Note de l'éd. : ici un dessin des cœurs…]» is not the edition's note: commit c06a46bf7 put it in place of the broken image link Tome7-15. The drawing (p.304) is now linked in the frontmatter after 059.0098.
- **¶4256 / ¶4258 are two paragraphs.** The print jumps from p.303 «…de briser là ?» to p.304 «dégourdit, qui me fait bouillir le sang…», which sits beside the drawing. ¶4258 is kept verbatim with an RSR note.
- **Annotations:** «[Annotation: 1881. …]» ¶3999, ¶4355 and 059.0191 become `margin` (Marie's later annotations).
- **The A.T.E. documents** are `other`: 059.0331–0340 «Règlements de la société A.T.E., rédigés par Marie» and 059.0342–0346 «Brevet de nomination de Plowden». They are documents Marie composed and copied into the notebook, and the print sets them indented. They are not letters, and not diary prose. They stay plain text, not quoted.
- **No split is needed for 059.0050.** Its «span» over 20 and 21 Apr was the ¶3981 mismatch.

### OCR clean-up of new text (all carnets)
- The rules applied:
  - «I» becomes «!» at the end of a sentence or before a capital («Ah I» → «Ah !»);
  - «II» becomes «!!»; «malheureuse I II y» becomes «… ! Il y»; «pas 1» becomes «pas !»;
  - stray «•», «■» and «।» are removed;
  - «dit- il» becomes «dit-il» (hyphen plus pronoun); «honnê- teté» becomes «honnêteté»; «Walit- sky» becomes «Walitsky».
- Every change is listed in `fix07.log` (lines starting «OCR»).
- Left as printed and flagged: «cette fichue- musique» (¶4005), «la colère- Je» (¶4225) and «le feu- z...Zucchini» (¶4062).
- New text keeps the docx's typographic apostrophe «’», while old text has «'». Normalise it later if you want one style.
- **Typesetting typos of the printed edition corrected** (owner policy KRR 2026-09-28; `fix_typos.py`, log `final/fix_typos.log`; each new paragraph's RSR note cites the page):
  - 055 ¶2347: «calvacade» → «cavalcade», «en tète à tête» → «en tête à tête»;
  - 059: «les tètes» → «les têtes» (¶3976), «D’ail'eurs» → «D’ailleurs» (¶3989), «valencienes» → «valenciennes» (¶4063), «cancannier» → «cancanier» (¶4128), «toute prète» → «toute prête» (¶4250), «sécria-t-il» → «s’écria-t-il» (¶4350), «désagrable» → «désagréable» (¶4479), «embellisements» → «embellissements» (¶4532), «humilé» → «humilié» (¶4690).
  - Checked and left (real words, grammar or Marie's own forms, `typos.txt`): «cleub» (Marie mimics Antonelli), zuchini, torlonienne, cocodesque, encanaillerait, excommunie, rassemblai, écrivisse, griserai, sophistiquons, dérisions, blasphémons, retro.

## 3. Withdrawn cover pages (for when the manuscript is available)

> **Update.** Title-notes pass 2026-09-29 (`_renumber/titlenotes-2026-09-29/`, owner policy: Marie's own notes on title/flyleaf pages go in as `margin`/`other` at the carnet's first entry; the formal title lines stay withdrawn; the carnet was renumbered): the Livre 59 name list «Belmonte … Angelini» (¶3925–3932) is now **059.0004** (`other`, one paragraph, after the heading of 1876-04-20); its cz/uk/en translations were taken from old 059.0004–0011. This answers §6 Q2 below with the alternative.

Owner decision KRR 2026-09-28: no cover entries. The texts are given as printed; the page is Mon Journal t.7, and the docx paragraph follows it. The notes in Marie's voice on these pages are kept as `margin` paragraphs (see §2).

- **Livre 53**, p.5, ¶42–45:
  ```
  Gloriae Cupiditate
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 53ème
  depuis le lundi 24 janvier 1876
  jusqu'au 10 février 1876
  Rome, hôtel de Londres, place d'Espagne.
  ```
- **Livre 54**, p.53, ¶631–634:
  ```
  Gloriae Cupiditas
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 54ème
  depuis le samedi 12 février 1876
  jusqu'au mardi 29 février 1876
  Hôtel de Londres, 12, Rome
  ```
- **Livre 55**, p.101, ¶1356–1361. The OCR reads «2.1 mars»; the date is 27 March (the Livre 56 title page starts «lundi 27 mars»).
  ```
  Gloriae Cupiditate
  H[is] G[race] t[he] D[uke] o[f] Hamilton
  Livre 55ème
  depuis le mercredi 1er mars 1876
  jusqu'au lundi 27 mars 1876
  Hôtel de Londres, Rome
  depuis le 14 mars, Hôtel de la ville, via del Babuino.
  ```
- **Livre 56**, p.181, ¶2659–2662. This was old 055.1175–1178, now dropped:
  ```
  Gloriae Cupiditas
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 56ème
  depuis le lundi 27 mars 1876
  jusqu'au dimanche 9 avril 1876
  Hôtel de la Ville, via del Babuino, Rome
  ```
- **Livre 57**, p.235, ¶3351–3356:
  ```
  Gloriae Cupiditate
  H[is] G[race] t[he] D[uke] o[f] Hamilton
  Livre 57ème
  depuis le dimanche 9 avril 1876
  jusqu'au jeudi 13 avril 1876
  Hôtel de la Ville, via del Babuino, Rome
  N.B. Depuis le jeudi 13 avril, Naples, hôtel de la Ville
  ```
- **Livre 58**, p.255, ¶3621–3625:
  ```
  Gloriae Cupiditate
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 58ème
  depuis le jeudi 13 avril 1876
  jusqu'au mercredi 19 avril 1876
  Naples, hôtel de la Ville
  ```
- **Livre 59**, p.279, ¶3920–3922 and ¶3925–3932. The name list was old 059.0004–0011, now dropped:
  ```
  H[is] G[race] t[he] D[uke] o[f] H[amilton]
  Livre 59ème
  depuis le jeudi 20 avril 1876
  jusqu'au mardi 9 mai 1876
  Naples, hôtel de la Ville
  depuis le dimanche 23 avril, à Rome
  depuis le 28 avril à Nice
  Belmonte
  Pandola
  Odescalchi
  Pizzardi
  Zucchini
  Cesaro
  Antonelli
  Angelini
  ```

**«Carnet 059 was misplaced»** (CARNET-REFERENCE.md) refers to Marie's note of 1882 on the **Livre 60** title page (tome08 ¶70): «[Le] livre 59 est égaré !! … il manque du 19 avril au 10 mai». Later, «[en travers] retrouvé» was added. It belongs to 060's planner. 059's missing ~48k characters were an extraction gap, and they are restored here (374 new paragraphs).

## 4. Drawings

The files are in `drawings/CCC/` in the scratch dir, and `final/drawings-07.json` lists them. Each was cut at 600 dpi, is grey WebP, has a long side of 1600 px or less, and is under 120 KB. The anchor IDs below are old IDs: map them through the rebuild `id_map`. The entry files are the new names.

| Carnet / entry | After | Printed page (= PDF page) | What |
|---|---|---|---|
| 053 / 1876-02-04 | 053.0361 | p.38 | sketch of the A.T.E. insignia: column, magpie, key, heart (the text describes it) |
| 055 / 1876-03-26 | 055.1138 | p.178 | framed sketch of her hairstyle («J'étais coiffée autrement…») |
| 055 / 1876-03-27 | 055.1164 | p.180 | scribbles: «1876» ×6, «1870-71», «1866» in ovals (docx ¶2648, a picture slot) |
| 057 / 1876-04-13 | 057.0132 | p.253 | bearded head and a swan (docx ¶3617) |
| 059 / 1876-04-25 | 059.0098 | p.304 | the A.T.E. hearts, Marie's with the key and a member's («en voici le portrait fidèle»; docx ¶4257/4259) |

Pages checked and left out:
- p.234 is a blank page.
- p.254 and p.303 show only the drawings of the facing pages through the paper.
- p.1 and p.3 are the edition's cover and title.
- p.369 is back matter.

## 5. Dry-run warnings (all accepted)

- **«first paragraph has no date heading»** for 053/1876-01-24, 054/1876-02-12, 058/1876-04-13 and 059/1876-04-20. These entries open with a title-page note and then the date heading, deliberately in docx order.
- **Footnote labels renamed on collision** (`[^1b]`, `[^2b]`) in _original and en 055/1876-03-22, 03-24, 03-26 and 056/1876-04-01. Some en footnotes move to the cluster that uses them.
- **«old embedded French not found — new copy inserted»**:
  - 055.1166 and 055.1171 in en and fr (their embeds carry the old bold/OCR form);
  - 058.0053 in cz, uk, en and fr (the heading embed).
  - Check in `verify-carnet` that no stale duplicate embed is left.

## 6. Questions for the owner

1. **Title-page notes in Marie's voice** are kept as `margin` paragraphs at the head of the first entry:
   - 053 ¶46;
   - 054 ¶635;
   - 056: 055.1179;
   - 058 ¶3626–3627;
   - 059: 059.0002–0003.

   The rest of the title pages is withdrawn. Is that right, or should these go too?
2. **The 059 title-page name list** (Belmonte … Angelini, old 059.0004–0011, which have translations) is dropped with the cover. Alternatively, keep it as one `other` paragraph («liste de noms sur la page de titre»).
3. **The date of the letter to her father** (055.1166): the scan reads «10 mars», but the family moved to the Hôtel de la Ville only on 14 Mar, and the 18 Mar entry announces «une lettre à Monsieur mon père, dont voici la copie». Keep «10», or mark it «1[?] mars»?
4. **054.0116 «Traduction: […]»**: whose translation of the Niçois letter is it, Marie's or the editors'? If it is the editors', it would become `editorial`.
5. **The A.T.E. rules and nomination** (059.0331–0346) are planned as `other`. Would you rather have them as plain diary text?
6. **056.0567 and 059.0097 are dropped** as extraction artefacts, and **057.0133 «[Suite]»** is reused as the 13 Apr (suite) heading. Confirm.

## 7. Follow-ups after the write

- The drawings go into the frontmatter (§4).
- RSR rewrites footnote `[^4]` on 055.1166.
- glossary-tagger and LAN run on the new paragraphs.
- Translation trees:
  - the new paragraphs are `TODO`;
  - the SOURCE CHANGED notes need work on 053.0235, 053.0004, 055.0708, 055.1166–1174, 057.0132, 057.0133 (heading) and 058.0053 (add «- Pâques»);
  - the translated headings need moving for the date lines whose paragraphs the draft relocated.
