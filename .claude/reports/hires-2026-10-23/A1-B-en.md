# A1-B-en — sharp-scan source fixes carried into the en tree, carnets 015–020 (2026-10-24)

Package B-A1-en under BRIEF-B. Tree: **en only**. The source changes are in commit 46a61a4241 (report `A1.md`). The lead had already run `just sync C en --footnotes`, so the embedded French was current. That sync added r-definitions at the end of the files and mechanical refs at the end of the lines.

## What was done

All 339 en paragraphs in 015–020 that carry an r-label in `_original` were checked. This covers the 290 paragraphs in the A1 impact list and the 49 paragraphs whose marks were there before this pass. After the fix, all 339 are clean, each one checked against `_original`:

- every label's run is wrapped `==…==[^CCC.NNNN.rK]` around its English rendering, with the ref right after the closing `==`;
- each label has exactly one definition with the standard en text, on its own line after its paragraph (blank line before). Definitions that sync had put at the end of the file were moved there;
- no mechanical or stray r-refs are left.

**290 paragraphs changed**, each with one `TR: source fix (sharp scan 2026-10-23): …` comment on its own line after the text:

| carnet | pids changed |
|---|---|
| 015 | 42 |
| 016 | 42 |
| 017 | 75 |
| 018 | 46 |
| 019 | 37 |
| 020 | 48 |

The pid lists are the same as the A1 impact list. Every pid in it was handled; none was skipped.

Method: visible-text lines (no comment markers) and footnote-definition lines were patched by a checked script. The script required each fragment to match once, each label to be wrapped once, no stray labels, and an even `==` count. Every TR comment line was inserted with the Edit tool, anchored at the end of its text line.

## Changes beyond plain wrapping

- **Inherited italics and bold** were dropped from most runs: the old tree had set Russian runs in `*…*` or `**…**`. Italics stay inside a mark only where `_original` has them (e.g. `==*young goats*==`, `==*Te Deum*==`, `==*He* has not yet arrived…==`). Bold left over from star debris was made italic where the print sets italics (018.0024, 0196, 0231, 0260; 020.0179). Star debris was removed from the verse lines 018.0106–0112.
- **Word changes from the report:**
  - 015.0148: «pas en âge de»: "in no condition to" → "not old enough to".
  - 017.0192: «l'indulgence»; the English was unchanged.
  - 017.0429: "Vocha Danilovski" → "Liocha Danilovski". The `[#Vocha_Danilovski]` tag line was left for the glossary fix (A1 owner question 3).
  - 019.0128: «elle»; the English already had "she".
  - 019.0129: the en text had the nickname "the Unemployed One". It is now "the ==*employee*==", a description. I avoided "clerk" because 018.0304/0305 use *clerk* for Fiouloulou.
  - 018.0276 «Gênes» needs no English change (Genoa).
- **Old tree notes replaced by the r-footnote** (they only said the passage was Russian):
  - 019.0383 [^1];
  - 020.0006 [^2] (it had guessed the cry was Russian);
  - 020.0008 [^3];
  - 020.0120, 0144, 0219, 0418, 0434 [^1];
  - 020.0128 [^3], 0129 [^4];
  - 020.0160 [^3], 0161 [^4] [^6], 0170 [^9];
  - 020.0187 [^3], 0188 [^4];
  - 020.0220 [^2], 0221 [^3];
  - 020.0253 [^2], 0255 [^3], 0256 [^4], 0273 [^6], 0274 [^7];
  - 020.0383 [^2];
  - 020.0428 [^3] [^4], 0430 [^5];
  - 020.0488 [^2], 0495 [^3], 0497 [^4].
- **Notes kept beside the r-ref because they gloss the word:**
  - 015.0132 [^2] *paskha*;
  - 016.0368 [^4] *moujik*;
  - 017.0179 [^1] *koulibiaks*;
  - 020.0128 [^2] Lambertoun;
  - 020.0428 [^2] *zhuk*;
  - 020.0161 [^5], reworded to keep only "*Moussia*: Marie's Russian pet name."
- **Notes that wrongly said the run was French:**
  - 016.0045: [^2] «In French in the original: *le grand galop*» was removed, and the second «*grand galop*» is now translated ("my ==*full gallop*==").
  - 017.0321: [^2] «In French in the original: *tonton et tantine de baptême*…» was reworded to a gloss with no language claim.
- **Run extent fixed:**
  - 017.0449: the run is «de culture». The old italics sat on "that is watered"; the mark is now on "hothouse".
  - 017.0066: only the first sentence is Russian; the italics over the three sentences after it were dropped.
  - 019.0243: the mark now covers "Ah, rascal -- why do I not have as much?".
  - 020.0128: the mark is split as in the print: "==It's== a little romance -- ==well then, let him be in love==".
- **Russian inside Marie's English paragraphs** (018.0304 «clerk», 018.0312 «Sacha»): `==…==` cannot nest, so the English highlight is split around the Russian word. Both English parts keep [^1].

## Gates (en)

| carnet | splicescan | verify-carnet |
|---|---|---|
| 015 | empty | PASS (0 fail, 0 warn) |
| 016 | empty | PASS (0 fail, 0 warn) |
| 017 | empty | PASS (0 fail, 0 warn) |
| 018 | empty | PASS (0 fail, 0 warn) |
| 019 | empty | PASS (0 fail, 0 warn) |
| 020 | empty | PASS (0 fail, 0 warn) |

`just check-comments en`: OK.

## Not done / for the lead

1. **020.0275** «Comment peut-on se marier à cinquante-cinq ans ?»: en marks it Russian, `==*How can one marry at fifty-five?*==[^8]` with [^8] «Marie's exclamation in Russian.». `_original` leaves it unmarked (A1 owner question 2). I left it as found, pending the owner.
2. **020.0479** «introduced him to me»: en has `==*…*==[^1]` with [^1] «In Russian.». `_original` has no Russian mark there, so either the print has no stars or A1 missed the run. I left it as found; RSR should check it on p. ~254 of t.3.
3. **Glossary text outside this tree:**
   - `people/mentioned/BARREME.md` still cites «Inemployé».
   - the LAN note in `_original/019/1874-05-06.md` («"Inemployé" - the Unemployed One») is now superseded by the RSR NOTE there.
   - `VOCHA_DANILOVSKI` needs its rename (A1 question 3).
4. The two stale-embedded-French hits my checker reported (019.0077, 020.0295) were false alarms caused by the footnote refs; both are fine.

No git state was changed. No TranslationMemory terms were added: "employee" (019.0129) is a one-off description, not a nickname.
