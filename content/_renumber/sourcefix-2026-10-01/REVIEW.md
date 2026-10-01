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
