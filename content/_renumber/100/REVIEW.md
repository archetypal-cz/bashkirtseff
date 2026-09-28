# Carnet 100

## Notes: plan-100 (Livre 100, tome15.docx ¶3411–4167, 27 May – 7 Aug 1883)

Plan rebuilt by `build100.py` in the work dir (it reads the draft and `_original`). Result: 73 entries (one per manuscript day, 27 May – 7 Aug, none missing), 202 old paragraphs carried, 135 new, 15 dropped.

### Draft defects fixed
- **All five completions were bogus** (0040, 0059, 0148, 0171, 0205): the "missing" words sit in the next old cluster (0041, 0060, 0147/0148, 0172, 0204/0205), because `_original` splits docx paragraphs by sentence. Removed.
- **Two duplicate new paragraphs removed**: ¶4067 (3 Aug, already in 0120/0121) and ¶4098 (5 Aug, already in 0146/0147). The matcher missed them because those old lines have no accents.
- **"Not found" 100 paragraphs** (0060, 0120, 0121, 0143, 0146, 0147, 0151, 0163, 0172, 0198, 0199, 0204, 0212–0217): all are in the docx, under the right day. They are accent-stripped fragments. I checked every docx paragraph of Livre 100 against the final plan with 3-grams: nothing is missing except the cover lines. The only old text not in the docx is `---` at the end of 0001 (a separator artefact, left alone).
- **Multi-day clusters split** (point 4). Each old cluster keeps only its own day's lines, copied verbatim with `set_french` (accent-stripped text is kept as it is). The other days' text is new, from the docx, one paragraph per manuscript paragraph, with the RSR note «Moved out of 100.00NN…». Clusters split this way:
  - 0009: 6 June kept; 7 and 9 June become new text; 8 June is empty.
  - 0010: 10 June kept; 11, 12, 13, 15 and 16 June become new text; 14 June is empty.
  - 0084: 1 July kept; 3 July becomes new text; 2 July is empty.
  - 0089: 8 July kept; 9 and 10 July become new text.
  - 0091: 11 July kept; 12 July becomes new text.
  - 0094: 15 July kept; 16 and 17 July become new text.
  - 0101: 22 July kept; 23 and 24 July become new text.
  - 0097 (18 July) and 0108 (29 July) keep their `#` heading but get `set_french` «[Aucun texte - date seule mentionnée]»: both days are empty in the manuscript, and their text belongs to 19 and 30 July.
  - 0019 (20 June): its only other line was the plain line «Jeudi 21 juin 1883», so it also becomes «[Aucun texte…]».
- **Trailing plain-text date lines** removed with `set_french`, and the next entry gets `heading`: 0014, 0018, 0035, 0051, 0055, 0060, 0081, 0085.
- **Pointer stubs** (point 5). In 0012 (13 June), 0090, 0095, 0096, 0098, 0102, 0103 and 0109, the pointer line now holds the day's first manuscript paragraph (`set_french`); the rest of the day is new.
  - 2 Aug and 7 Aug are different: the day's text was already in separate old clusters (0113–0115 and 0179–0206), filed under the previous day. Those clusters move into their own day's entry, which gets a `heading`.
  - **Drops proposed**: the pointer stubs 0116 and 0208, and the plain duplicate date-line clusters 0112, 0132, 0177 and 0178. Reusing a stub here would have meant dropping a real text cluster, together with its translations, instead of a pointer.
- **0083** («[Aucun texte…]») stays in 30 June, which is really empty (¶3783→¶3784). 2 July gets its own new empty entry.
- **1–4 June restored**: 1 June ¶3480–3481; 3 June ¶3497–3502; 4 June ¶3504–3506.
  - The 3 June heading is now «Dimanche 3 juin 1883 - Grand Prix», because «- Grand Prix» is part of the date line. The draft had made it a text line.
  - The ID-less stub files 1883-06-01.md and 1883-06-04.md are in `drop_files`, and each of their entries uses its stub file as `frontmatter_from`.
- **100.0209–0217 (old 1883-08-08.md) dropped**: they duplicate 099.0091–0097 (Sunday 8 April 1883, docx ¶2667–2673) line for line. I kept the 099 set, which has accents, the docx paragraph structure and the footnote. The old 100/1883-08-08.md file disappears: all its paragraphs are dropped, so its URL goes to the carnet index. It could be redirected to 099/1883-04-08 by hand. cz loses a CON verdict note (tool warning; the entry is a duplicate).

### Dates
- ¶3659 «Samedi 18 juin 1883»: it falls between Sunday 17 and Tuesday 19 June, so the day is **Monday 18 June**. The print (p.287) has «Samedi»; that is Marie's slip or the edition's. The file is 1883-06-18.md and the heading keeps «Samedi 18 juin 1883».
- The docx «Vendredi 1 5 juinl 883» is the heading «Vendredi 15 juin 1883».
- Every other heading's weekday matches the calendar.

### Kinds
- 0058 is a **letter**: «Lettre de Marie à Alice (passage copié de sa réponse), 27 juin 1883». It is `> `-quoted; docx ¶3741–3743 use the letter style.
- ¶3810 «1- Rollinat poète macabre…» is **margin**. It is Marie's own note to «Rollinat¹» in ¶3799 (3 July), set in small type at the foot of p.298. It was filed in 0085 (4 July) only because of the printed page, so it moves to 3 July, after the paragraph it annotates. The only footnote-style note in tomes 14–15 is this one, and it reads as Marie's: I did not treat it as an edition footnote.
- Whole-line struck text inside clusters («[Rayé: Le sculpteur…]» in 0002, «[Rayé: Jamais je n'ai vu…]» in 0042) is left inline, in the established `[Rayé: …]` form.
- Labels: «[Raye: » → «[Rayé: » in 0002, 0129 and 0130 via `set_french`. That is the only change to those clusters.
- The candidate kinds `other` on the stubs were already removed in the cleaned draft. None are set.

### OCR fixes in new text (checked on the scan)
- Rejoined words that the OCR split with «- »: «Jules- Jules», «permettez- moi», «viendra-t- il», «expliquez- les».
- «cris- talisations» → «cristalisations» (the print breaks the word as «cris-/talisations»; the old text had «cristallisations»).
- «dìrma» → «d’Irma».
- «*mor.*» → «*moi.*».
- «Rollinat1» → «Rollinat¹».
- Kept as printed, after checking: «ving-neuf», «content !!» (docx «I!»), «C’et une insanité», «réuglièrement», «Les Canrobert à dejeuner», «telchoc» (old text, not new).

### Leftovers for the lead
- Filled stub clusters keep their old RSR note about the placeholder or pointer.
- 0097 and 0108 (now empty days) keep their theme tags, and 18 July keeps `kernberger_covered`.
- The new paragraphs have no tags. The glossary tagger should run on 100 after the apply.
- Translations: the split clusters carry `SOURCE CHANGED` notes; flags are reset in 53 entries per tree.
