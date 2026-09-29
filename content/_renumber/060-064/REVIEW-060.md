# REVIEW 060 (Livre 60, 10–20 May 1876, Rome) — final plan

Built by `tools/fix_060.py` from `common/plan-060.json` (log: `final/fix-060.log`). Dry run accepted (rc 0).
The only warnings are en footnotes [^1]/[^2] that move from the dropped 060.0884 to 060.0881, where they are
referenced, and the heading change on 060.0156.

## Summary counts

| | |
|---|---|
| Entries | 10 (the new one is 1876-05-14.md, split from 1876-05-13.md at docx ¶232) |
| Old paragraphs carried | 882 |
| New paragraphs | 85 (common had 86; ¶1045 removed) |
| Dropped | 2 (060.0012, 060.0884) |
| set_french | 17 (each has an `_rsr`) |
| Kinds | margin 37, editorial 23, rayé 1 (no letter, clipping or cover) |

## Withdrawn cover pages

- **Livre 60 title page**, docx ¶68–69, Mon Journal t.8 p.21. common08 already withdrew it (common/withdrawn-060.json):
  «Gloriae cupiditate / H[is] G[race] t[he] D[uke] o[f] H[amilton]» (unnumbered in the docx) · «Livre 60e» ·
  «depuis le mercredi 10 mai 1876 / jusqu'au samedi 20 mai 1876 / Rome, hôtel de la Ville».
  Marie's own note (docx ¶70–71, 1882: «[Le] livre 59 est égaré ! ! …» + «[en travers] *retrouvé*») stays as 2 `margin`
  paragraphs after 060.0001, placed by title08.py.
- **Livre 61 title page, first half**, Mon Journal t.8 p.87. _original filed this at the end of 060:
  - docx ¶1044 «Gloriae cupiditate» = **060.0884**, dropped with the withdrawn reason.
  - docx ¶1045 «H[is] G[race] t[he] D[uke] o[f] H[amilton]» (OCR «Gfrace … off] Hfamilton]») was a new paragraph. **Removed.**
  - The rest (¶1046–1049) is in 061; see REVIEW-061.

## Drops

- 060.0012 «## ROME, MERCREDI 10 MAI 1876 - JEUDI 11 MAI 1876»: the printed page's running header, not manuscript text.
- 060.0884: see Withdrawn cover pages.

## Splits and moves

- Kept the draft's new entry **1876-05-14.md**: the docx has the date line «Dimanche 14 mai 1876» at ¶232 (p.34), and
  _original had put it inside 1876-05-13.md as the cluster 060.0156 «## Dimanche 14 mai 1876». That heading is raised to
  `#` with `set_french`. The translations keep their own `##` heading, so a translator can raise it after --write (cosmetic).
- The first entry keeps the old file name 1876-05-10.md, although the date line covers two days («Mercredi 10 mai 1876 - jeudi 11 mai 1876»).
- There are no cross-carnet moves.

## Kinds (with sources)

- The common plan (common08) has 21 `[annotation]` markers → `editorial`. The italic runs after them → `margin` «Annotation de Marie».
- Three old clusters hold the marker and the text together → `margin`: 060.0123, 060.0181 and 060.0185. Left as they are.
- I resolved the **CHECK** items this way:
  - ¶145 «no italic run»: the annotation is **060.0071**, which the fuzzy matcher had given as «Je suis agaçante.». The
    print (p.27) has «*1881. Je suis agaçante.*». `set_french` restores the text, and 060.0071 becomes `margin` «Annotation de Marie, 1881».
  - ¶968 «no italic run»: the annotation is **060.0811**, printed in italics on p.81 with «Je vous aime» in roman.
    I repaired its italic markup with `set_french` and set `margin` «Annotation de Marie».
  - ¶1039 «no italic run»: the annotation is **060.0880**, printed in italics on p.85, with «remarquable», «d'incroyable»
    and «moitié» ×2 in roman. I repaired the italic markup, fixed «c 'est» with `set_french`, and set `margin` «Annotation de Marie».
  - The **inline marker in 060.0572** is kept inside the paragraph, as printed on p.70: «…il voulut me baiser
    [annotation] *Ce n'est pas un homme, ça ! C'est une femme galante que cet Antonelli !* la main mais…». Splitting it
    would cut the sentence. `set_french` normalises the marker and fixes the OCR («1»→«!», «n 'est»).
- Other kinds:
  - 060.0003 «*Car enfin c'était avouer… des idiots !*» → `margin` «Annotation de Marie». It is printed entirely in italics
    on p.21 and is a retrospective comment with no `[annotation]` label. I repaired the italic markup.
  - 060.0004 «[en travers de la page] *Le Bon Dieu … 1881.*» → `margin` «Annotation de Marie, 1881». The OCR «Le Bon. Dieu» is fixed.
  - 060.0151 «[en travers de la page] Par des coups de poing ?» → `margin`, with no source.
  - New ¶388 «[en travers de la page]» (a standalone label) → `editorial`, the same treatment as the `[annotation]` labels.
    The text written across the page, **060.0308** «*Ça paraît impossible. J'étais bête et enfant…*», → `margin` «Annotation de Marie».
- The new ¶524 «[UNE LIGNE ET DEMIE CANCELLÉE]» stays `rayé`.
- The draft's `letter` guess on **060.0535** («— Monsieur, je vous préviens…») was dialogue, so I removed it.

## set_french list

- 060.0002, 0033, 0073, 0250, 0346, 0365, 0504, 0514, 0751, 0780: OCR fixes (below).
- 060.0003, 0004, 0071, 0811, 0880: kind or annotation fixes (above).
- 060.0572: OCR fixes and the inline marker.
- 060.0156: heading level.

## OCR/typo fixes

The printed page was checked for each fix.

Old text:
- 0002 «Tchemichoff»→«Tchernichoff» (p.21; the tag is already TCHERNICHOFF)
- 0033 «Qn»→«On» (p.25)
- 0073 «monde 1 I !»→«monde ! ! !» (p.28; the paragraph is printed in **bold**, which is not rendered and only noted here)
- 0250 «com 'è»→«com'è» (p.46)
- 0346 «Monsieur 1»→«Monsieur !» (p.52)
- 0365 «Oui 1»→«Oui !» (p.53)
- 0504 «qu 'est» (p.63)
- 0514 «n 'avoir» (p.67)
- 0572 «voulez 1» and «n 'est» (p.70)
- 0751 «n 'avais» (p.78)
- 0780 «jusqu 'à» (p.79)
- 0880 «c 'est» (p.85)
- 0004 «Le Bon. Dieu» (p.22)

New text (a note is added to the rsr):
- ¶600 «c'est de ' l'insensibilité»→«c'est de l'insensibilité» (p.63)
- ¶610 «Hé I Je»→«Hé ! Je» (p.64)

The print has «Larderel» on p.27, but «Larderei» is kept, per the convention.

## Kept but flagged

- **060.0881–0883** («Jusqu'à Gênes nous voyageons…», «Et une autre dépêche à Nice…», «Papier, Maria, cardinal,
  cigarettes.») are also printed in italics on p.85, after the same [annotation] label as 060.0880. The content is
  present-tense travel narrative from 20–21 May, plus the last-page word list. That reads like diary text written at
  the time, not a later annotation. They are kept as diary text with no kind (the conservative default) and keep their italics.
- The short dialogue lines the drafter reported as «not found in the docx» are all present: 060.0100, 0216, 0218, 0292,
  0329, 0406, 0534, 0551, 0587, 0778 and 0866 are at docx ¶175, 295, 297, 372, 719, 488, 683, 701… The matcher missed
  them because the docx has no dashes. All are kept in place. The two «— Après ?» (0533/0534, ¶682–683) are printed twice.
- Draft «uncertain alignment» 061.0067 ↔ docx ¶611 «C'est tout ce qu'il me faut.»: this is a spurious short match. ¶611 is
  rightly new text in 060.
- The first-entry and 1876-05-12 headings keep the old _original style («Vendredi, 12 mai 1876» with a comma). The
  printed heading on p.27 has the typo «1976», and the plan's `heading` field already has 1876.

## Drawings

None seen on the pages I viewed (p.21, 22, 27, 28, 63, 64, 70, 81, 85). `final/drawings-060.json` = [].

## Open questions for the owner (conservative default chosen)

1. Are 060.0881–0883 (italic on p.85) a later annotation or diary text? Default: diary text, no kind.
2. 060.0003 is an italic paragraph with no [annotation] label. Default: `margin` «Annotation de Marie», because the
   edition prints Marie's later notes in italics.

## After --write (applier)

- Turn the `_rsr` keys on the 17 `set_french` paragraphs into RSR comments.
- Translations of 060.0156 (now the first paragraph of 1876-05-14.md) still use a `##` heading. Raise it to `#` if wanted (cosmetic).
- The en footnotes [^1]/[^2] were in the dropped 060.0884 and move to 060.0881. Check that they render in 1876-05-20.md.
