## Applied (2026-09-28): what changed after the notes below were written

The per-carnet notes below were written against the first plans. Before apply, `adjust_v2.py` turned
them into the committed `plan.json` files (via `final2/`), for two changes:

- **Headings through `set_french`** (tool change d08a2fb03). The heading edits these notes list as
  "post-apply hand edit" or "a plan cannot edit a heading" are now done in the plans: 091.0434
  «Jeudi 14 avril 1881» (print «1181»); 094.0063 «Vendredi 13 janvier 1882 - 1er janvier»;
  094.0247 «Dimanche 9 avril 1882 - Pâques»; 094.0125 trimmed to «Samedi 4 février 1882»;
  096.0209 «Mercredi 6 septembre 1882» (print «septembe»); 095.0255's stray «Jeudi 13 juillet 1882»
  heading removed. Each carries an RSR note.
- **Typesetting typos corrected** (owner policy, 2026-09-28). An obvious typo of the printed Mon
  Journal is corrected, and an RSR note cites the page. Marie's own spellings stay. Of the 23
  OCR suspects checked against the scan, 19 are corrected: «Ls», «qautre», «quanrante»,
  «Remaquez», «conditons», «comence», «bougeoises», «aceptées», «avns», «séprarée», «ains»,
  «embrase», «cinquantre», «étangère», «Expostions», «faie», «amité», «réuglièrement»,
  «ving-neuf». Heading slips are corrected too: «Dimande», «décembe», «Vendreid», «Mercedi»,
  «fvrier» and «1182». Four are kept as Marie's or as uncertain: «raffraichissements»,
  «complait», «traîter/traîte» and «l'élatine». Where the notes below say "kept as printed" for one
  of the corrected items, that no longer holds.

Other steps around `rebuild-carnets --write` (scripts in `content/_renumber/090/`):

- `fix_pre.py`:
  - gives en/098 the stub IDs it lacked;
  - splits the fr tree's multi-line embedded-French blocks into one `%%` line per line (the tool
    refuses `set_french` on such a block).
- `fix_pre2.py`:
  - removes the duplicated embedded French in uk/093 and en 099.0392;
  - realigns en 092.0133/0134 with _original's page-break split.
- `fix_post.py`:
  - moves footnote definitions that the reorder separated from their markers (092 Œdipe roi,
    093 Fontarabie);
  - drops the Gloriae Cupiditas note of the withdrawn Livre 100 title page;
  - strips footnote markers from the fr edition's new 099 letter text;
  - repairs two glossary citations (NAPLES, LOUISE_BRESLAU);
  - adds RSR notes for corrected old paragraphs;
  - adds three drawings (`drawings:` frontmatter): 095 1882-06-08, 096 1882-08-29 and
    098 1883-01-16.
