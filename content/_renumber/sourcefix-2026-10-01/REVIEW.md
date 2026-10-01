# Source-fix rebuild batch, 2026-10-01 (fix-source)

Commits: 7e9be77b2 (_original + maps), 90bcbfc64 cz, dd9a4c811 uk, 06a73d4e2 en, 04f6e91c8 fr. Plans: `content/_renumber/{030,066,067,070}/plan-2026-10-01-sourcefix.json`; ID maps `content/_renumber/{030,066,067,070}-2026-10-01.json`. Validated in a clean worktree first (renumber-check, verify-carnet, splicescan for _original/cz/uk/en/fr, check-comments: all PASS).

| Carnet | Change | Evidence |
|---|---|---|
| 030 | 030.0455 split: Marie's sentence ending «(suite au prochain livre).» stays 0455; the masquerade costume description becomes new paragraph 030.0456, `kind: other` («Note de Marie à la fin du Livre 30»); 0456–0458 → 0457–0459 | tome04.docx ¶5084 / ¶5085 + ¶5088 (printed page number ¶5086 left out; the unclosed «(» is as printed) |
| 066 | 066.0721 split: date heading «Dimanche 8 octobre 1876 (26 septembre)» stays 0721 (no kind); «[Deux lignes cancellées]» becomes 066.0722 `kind: rayé`; later IDs +1 | tome09.docx ¶1600 / ¶1601 |
| 067 | heading/struck splits at old 0335, 0606, 0758, 0769 (new heading IDs 0335, 0607, 0760, 0772; struck lines +1 each); old 067.1124 dropped (duplicate «[Quatre lignes cancellées]»; kept as 1123) | tome09.docx ¶2047, ¶2327, ¶2483, ¶2494; ¶2978 (t.9 p.197 prints it once) |
| 070 | old 070.0859 dropped: page-break remnant «res !», the word «noires !» is complete in 0858 | tome10.docx ¶2281–2282 |

Post-write fixes (scripted): the `kind: rayé` marker removed from the new heading-only paragraphs in every tree; in cz/uk/en the existing translation of each struck line moved from the heading paragraph into the new paragraph (replacing its TODO), and the tool's SOURCE CHANGED note replaced by an «ED: split resolved mechanically» note; in fr the duplicated visible struck line removed from the heading paragraph.

Approval flags reset by the tool on: 030/1875-04-02, 066/1876-10-08 (uk also 10-07), 067/1876-10-28, 11-02, 11-06, 11-07, 11-26, 070/1877-04-23 (uk, en). Drivers told (RED+CON; 030.0456 needs TR).

Not done:
- 063.0017 («[annotation ]», `kind: editorial`) is KEPT: the scan (Mon Journal t.8 p.252) prints the label «[ANNOTATION ]» on its own line before Marie's annotation, so it is the edition's label as printed, not an extraction artefact.
- 062.0832: Marie's own printed footnote (t.8 p.243) stays quoted in source footnote [^1]; making it a margin paragraph is optional and was not done.

## Page-break joins, 078–080 (80f2fefcf + 6cb472cd8 2441c74b4 ca3c14ce9 b627bf42e)

94 paragraph pairs where the transcription split one print paragraph at a page break (078: 22, 079: 35, 080: 37). Candidates: paragraph N ends without terminal punctuation and N+1 starts lowercase (`pagebreak/candidates.py`). Each pair checked on the Tome 11 scan (`pagebreak/scancheck.py`: N's last words end page p and N+1's first words open the first body line of page p+1 flush-left, no indent) — 91 automatically, 3 by looking at the scan image (080.0169/0170, 080.0228/0229, 080.0242/0243: continuous mid-page). Full list with scan pages: `pagebreak/checked_078-080.json`; plans `pagebreak/plan-pb-*.json`.
Applied with rebuild-carnet (N gets the joined French, N+1 dropped; hyphenated word halves joined without the hyphen), then `pagebreak/postfix.py`: in cz/uk/en/fr the translation of N+1 is appended to N's translation (nothing dropped — `pagebreak/textcheck.py` confirms the visible text of every tree is unchanged apart from the joins), N+1's tags, notes and footnote definitions move to N, the tool's SOURCE CHANGED note is replaced by «ED: paragraphs merged at a page break — check the seam», and approval flags are restored (pure joins). 69 entries per tree carry seam notes (`~/rebuild-state/plan-sourcefix/pagebreak/seam-entries-078-080.txt`); drivers asked for a Sonnet RED seam pass, CON only where RED changes something.

## Small batch, 078/079/081–083 (906f6f526 + 8ad75ed4e 0560b2278 9d1f0461a 702e32d47)

| Carnet | Change | Evidence |
|---|---|---|
| 078 | 078.0268 split: «# Vendredi 22 février 1878» stays (no kind); the opening line of Marcuard's letter becomes 078.0269 `kind: letter` (translations moved mechanically) | tome11.docx |
| 079 | dropped 079.0083 and 079.0124 (empty once the editors' «Ibid., p. 227 / 230-231» was removed), 079.0239 (held only «Ibid., pp. 239-240»; its RSR note moved to 0236), 079.0240 joined to 079.0236 (one print paragraph around the reference; translations joined, seam note) | tome11.docx; Mon Journal t.11 |
| 081 | dropped 081.0233 (spelling-normalised duplicate of 0232); 0432/0433 boundary moved: «A table, … tant, etc.» belongs to ¶609 (0432), 0433 = ¶610 «Il n'y a rien que je ne fasse…» (translations get SOURCE CHANGED) | tome12.docx ¶359–360, ¶609–610 |
| 082 | 0337/0338 swapped into print order (Antonsky line ¶1263 before the second «C'est triste…» ¶1264) | tome12.docx |
| 083 | dropped 083.0519 («Ibid. p. 581», editors'); 083.0515 kind clipping → editorial (it is the editors' footnote 1 on p.188) | tome12.docx ¶2100, ¶2104 |

Flags reset by the tool: 078/1878-02-22; 079/1878-03-24, 03-27 (079/04-05 restored: pure join); 081/1878-07-03, 07-18; 082/1878-09-09; 083/1878-12-31 — drivers asked for RED+CON.

## Paragraph joins, batch 2: 003–084 (59bfb38e6 + c1606c511 f93f250de 9e730247d beefa7497)

Survey of the whole corpus (`pagebreak/survey.txt`): 249 candidates outside 078–080; tomes 6–16 checked on the scans (`scancheck.py`), tomes 1–5 on the docx (`docxcheck.py`: PAGEBREAK-DOCX = the halves sit either side of a printed page number; SAMEPARA = both halves are one docx paragraph). Applied here: 111 joins in 003, 004, 005, 015, 016, 018, 019, 021, 031, 033, 039, 043, 044, 054, 055, 065, 077, 084 (`pagebreak/checked_batch2.json`, `ok: true`). Not joined: pairs with different paragraph kinds or a quoted letter line (e.g. 077.0264 signature → narrative), the address block 050.0701, ADJACENT-DOCX/INDENT/NOTFOUND cases, and the chain 016.0405–0407 (only 0405+0406 joined). Same post-fix as 078–080, plus `fnfix.py` (footnote references/definitions reconciled after label rewrites) and one manual fix (uk 019/1874-05-12: the moved «Amour-propre» note kept as [^019.189.1m]). Visible text of every tree checked unchanged apart from the joins (`textcheck.py`); no RSR/LAN/TR/RED/CON/FAB note lost.
Still to do when the drivers have committed them: 091, 092, 093, 094, 097, 099, 102.
