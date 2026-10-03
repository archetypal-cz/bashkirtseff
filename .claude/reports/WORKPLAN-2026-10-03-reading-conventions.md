# WORKPLAN 2026-10-03 — reading-conventions wave (cz / uk / en)

Owner (KRR) rulings 2026-10-03 — canonical text in `content/CLAUDE.md` → "Foreign-language passages", `content/cz/CLAUDE.md` → "Cizojazyčné pasáže" + "Přímá řeč", `content/en/CLAUDE.md`, `content/uk/CLAUDE.md`.

## What changes

| Tree | A. Foreign passages | B. Dialogue |
|---|---|---|
| cz | Marie's English/Italian/Latin/Russian/German runs (now `==English==` + Czech in footnote, ~1.4k runs) → `==Czech translation==[^n]`, footnote `Pozn. překl.: V originále anglicky: „original“.` Same for untranslated foreign phrases in *italics*. | dash-led dialogue (`— `/`– `, ~7.2k lines) → Czech „…“ with the attribution outside: `„Dejte ho mně,“ řekne Audiffer.` |
| uk | same as cz (`==…==` ~2.4k runs) → Ukrainian in text, footnote `В оригіналі англійською: «…».` | unchanged |
| en | Marie's English stays. French/Italian/Latin/Russian/German phrases left in *italics* → English in text, `==…==`, footnote `In French in the original: *…*.` | unchanged |

**C (cz only) — outfit notes:** Marie's toilette notes "(robe …, chapeau … *bien*)" → „*sluší mi to*“ (keep her italics); "pas mal" → „ujde to“; "très bien" → „*náramně mi to sluší*“. Owner report 015.0056 (2026-10-03), done in 015; ~84 other cz files carry the old bare „dobře“.

Not in scope: whole foreign-language paragraphs/entries that are already translated with a run note (`V originále anglicky (tento a N…)`, `In English in the original.`) — leave them. Titles of works, proper names, naturalised loanwords, puns.

## Worker brief (per carnet, per tree — one agent per carnet per tree)

1. Read `.claude/skills/_shared/editing_rules.md`, the tree's `content/<lang>/CLAUDE.md` sections above, `content/CLAUDE.md` "Foreign-language passages".
2. For each entry file in `content/<lang>/NNN/`: compare with `content/_original/NNN/` (the reference — the embedded `%% French %%` copy may be stale).
   - A: find every foreign-language run in the visible text (`==…==`, untranslated *italic* phrases, leftover English/Italian/Latin). Translate in Marie's voice, keep `==…==` around the translation, put the exact original (from `_original`) in the footnote. Reuse the existing footnote ID where one exists (convert "meaning" note → "original" note); new footnotes follow the file's existing ID scheme. Never leave a foreign run + translation note.
   - B (cz only): convert dash dialogue to „…“; judge where speech ends and narration begins; punctuation of the speech inside the quotes; nested quotes ‚…‘; dashes used as parenthetical/em-dash punctuation (` – ` mid-sentence) stay. Closing quote is “ (U+201C).
   - Edit only visible text and footnotes. Never touch `%% … %%` comment lines or paragraph IDs (splice-safe — editing_rules §).
3. Add one comment per changed entry, e.g. `%% 2026-10-03T14:00:00 TR: Reading-conventions wave (KRR 2026-10-03): foreign runs translated in text, originals to footnotes; dialogue to „…“. %%`
4. Gates: `just verify-carnet <lang> NNN` PASS, `just splicescan <lang> NNN` prints nothing. Self-check: `grep -c` of paragraph IDs unchanged; for cz no remaining `^(—|–) ` dialogue lines unless justified (list them).
5. Don't commit; no `git checkout/restore/stash`. Report: counts (runs converted, dialogue lines converted, footnotes added/changed), doubtful cases.

Review (RED-lite, separate agent): spot-check every converted footnote against `_original`, read dialogue conversions for punctuation, verify gates; fix directly.

## Models
Workers: Sonnet 5.5 (mechanical-with-judgment TR). Reviewer per batch: Opus. Pilot (carnet 034): Opus workers.

## Rulings after pilot (KRR 2026-10-03)
- French tics left in translations (*Bigre*, *Pardi*, *comme il faut*…) → translated, `==…==`, French in footnote; first occurrence per entry footnoted. Reverses en *Bigre* ruling.
- cz: ALL direct speech with attribution goes in „…“, dash or not.
- cz Hamlet: „To je, oč tu běží“.
- Footnote marker `==…==[^n],`; [sic] → footnote; metalinguistic runs stay foreign + footnote; TMs updated before wave.

## ED defaults (owner may veto)
- Only text still LEFT in a foreign language gets converted+highlighted; tics already translated earlier (en "Pardi" → "Of course!") stay as they are, no retro-highlight.
- "One rendering per tree" applies to interjection tics (Bigre → en "By Jove!"); phrases like *comme il faut* may vary by context.
- Ordinary French words earlier kept in italics (*panier*, *caillebotte*) → translated + ==…== + "In French in the original" (consistent with owner's "highlight too").
- Pending owner: en *Mardi!* → "Zounds!"; Euax footnote (LAN says Greek/Evoe — needs RSR check before cz/uk copy it).

## Status
- [x] Pilot 034 cz / uk / en (Opus) → rulings above
- [ ] 034 review + apply rulings (Opus), commit — en APPROVED 0.94
- [ ] TM supersede notes cz/uk/en
- [ ] cz 000–106
- [ ] uk 000–106
- [ ] en 000–106
