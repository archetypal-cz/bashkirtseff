# Carnet 094

## 094 (Livre 94, tome14.docx ¶3044–3750) — plan review notes

Coverage: every docx paragraph ¶3048–3750 is in the plan, per day. The only misses are page-break fragments already inside old clusters («fièvre...» ¶3059, «malheureux.» ¶3133, «souffert...» ¶3536). ¶3751+ is the index.

### Livre boundaries / cross-carnet
- **090.0477–0529 → 094: confirmed.** They sit under Livre 94 ¶3646–3726. Their dates match the docx date lines: 18 Apr ¶3646, 20 ¶3671, 22 ¶3681, 23 ¶3694, 24 ¶3706, 25 ¶3708. The empty days around them also match: 13–17 Apr ¶3641–3645, 19 ¶3670, 26 ¶3727, 28 ¶3738. There is no date line for 21 April and there is no entry for it. I removed `frontmatter_from: 1882-04-12.md` from the entries whose first paragraph comes from 090, so they keep the 090 files' own frontmatter.
- **094/095 boundary is correct.** Tome14 ends with «Samedi 29 avril 1882» (¶3739–3750), and tome15 Livre 95 opens «depuis le dimanche 30 avril 1882» (¶44–48). 094's 1882-04-27 and 1882-04-29 (the ex-095 entries) belong in 094. 095 has nothing earlier than 30 April, except the 095 plan's 1882-03-19/03-20 entries, which are the known «19/20 mars» = 19/20 mai misprint (tome15 ¶140–141). That is for the 095 owner.

### Decisions
- **094.0007 is not a letter**: kind removed. ¶3089 is ordinary diary text. The match with ¶801 («Madame Gavini est venue avec la Randouin.», Dec 1880) is only a shared opening, not repeated text.
- **094.0156 completion removed (bogus)**: ¶3434 = 0156 + 0157. **0157 «not found» is resolved**: it is the second half of ¶3434 and sits in the right place.
- **10/11 Dec (¶3127 «Samedi 10», ¶3128 «Dimanche 11 décembe 1881», p.262)**: 0015 (heading 10 Dec + the 11 Dec text) gets `set_french` «[Aucun texte…]». New entry **1881-12-11** holds new ¶3129 and ¶3130 (docx text), then 0016.
- **15 Dec repeated (¶3148 and ¶3161)**: both date lines are printed on p.264–265. One entry 1881-12-15: new ¶3149–3160, then 0019, whose own heading line «# Jeudi 15 décembre 1881» is the manuscript's second date line. 0019 `set_french` removes the trailing «Vendreid 16 décembre 1881» line, and there is a new empty entry **1881-12-16**. OCR fixes against p.264–265: «coq-à- l’âne»→«coq-à-l’âne», «n‘ai»→«n’ai», «désap pointé»→«désappointé». The print ends ¶3155 at «envoyé à Berlin...» and sets «Dieu me pardonne je vous donne des nouvelles du monde et de la ville.» as its own paragraph, so it is now two new paragraphs.
- **13 Jan «- 1er janvier» (¶3280)**: removed the bogus new paragraph. The Julian date belongs to the heading, but 0063 carries its own heading «# Vendredi 13 janvier 1882», which the plan cannot change. FLAG: after the rebuild, make the heading «Vendredi 13 janvier 1882 - 1er janvier» by hand. The same goes for **9 Apr «- Pâques»** (¶3614): the new paragraph is removed and 0247's heading should become «Dimanche 9 avril 1882 - Pâques».
- **17/18 Jan**: the draft put «Mercedi 18 janvier 1882» as text in 17 Jan. Now 1882-01-17 is empty (¶3312) and there is a new empty **1882-01-18** (¶3313).
- **Dropped 094.0108** (heading-only «# Mercredi, 25 janvier 1882 / Jeudi 26 janvier 1882») and **094.0138** («# Samedi, 11 fevrier 1882 / Dimanche 12 fevrier 1882»). 1882-01-25 and 1882-02-11 get new «[Aucun texte…]» paragraphs. 01-26 and 02-12 get their heading from the plan. **Lead: please confirm these drops.**
- **3/4 Feb**: 0125's heading line is «# Vendredi, 3 fevrier 1882 / Samedi 4 fevrier 1882» and its text is 4 Feb. I kept the draft layout: an empty 02-03 entry, and 0125 in 02-04. FLAG: trim that heading to «Samedi 4 février 1882» by hand.
- **14/15 Feb**: the draft had turned «Merecredi 15 février 1882» (¶3441) into a text paragraph and put 0160 (15 Feb) into 02-14. The 1882-02-15 entry is restored with 0160.
- **18/19 Feb**: the draft had turned «Dimanche 19 fvrier 1882» (¶3463) into text. There is a new entry **1882-02-19** with 0174–0179 (confetti battle, church «ce matin»: Sunday).
- **20 Mar letter to Julian** (¶3549–3550, small indented type, p.299): 0215 and 0216 are `letter`, source «Lettre de Marie à Rodolphe Julian, Nice, 20 mars 1882», with `set_french` `> `-quoted (old text verbatim, footnote markers kept). «Du reste voici le brouillon. [manque]» is printed in normal type after the letter, so it is split from 0216 into a new paragraph (print reading «brouillon.»).
- The 1182 dates are printed so (p.284, p.299). The headings keep «Mercredi 1er février 1182» and «Mardi 21 mars 1182». Files are 1882-02-01 and 1882-03-21.

### Headings kept as printed (Marie's or the edition's slips)
«Dimanche 11 décembe 1881», «Vendreid 16 décembre 1881», «Mercedi 18 janvier 1882», «Dimanche 19 fvrier 1882», the two 1182s. «Merecredi 15 février» is only in the plan field; 0160 keeps its own «Mercredi 15 fevrier».

### Kinds / inline notes
- ¶3099 «[Dans la marge: Bojidar est venu…]» sits inside the old multi-paragraph 0010 and is left inline, like the 093 cases.

### Withdrawn cover pages
- Livre 94 title (¶3044–3047, p.257) is the dropped 093.0141 (see notes-093). withdrawn-covers.json has only «Livre 94ème»; complete it with the full title page.
