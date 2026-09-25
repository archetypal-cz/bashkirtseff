# Heading-date sweep — 2026-09-26

Scripted check of every `content/_original` entry (3,728 files, carnets 001–106) against the raw transcription `content/_raw/tomeNN.docx` (dumped with python-docx). Two passes:

1. **Heading vs file date.** The first `# ` heading is parsed (French weekday, day, month, year) and compared with the filename date (ranges like `1876-08-25-26` accepted) and with the real weekday of that date.
2. **Content vs raw.** Each entry's first text paragraphs are located in the raw tome (first 25–60 normalised letters, unique match only), and the nearest raw day heading above them is compared with the file date. This catches files whose heading and filename agree with each other but not with the text under them.

Scripts: `sweep.py`, `analyze.py`, `spans.py` in the session scratchpad (not committed). Raw headings are OCR text (`1 883`, `Jeud`, `Î1`); digits were rejoined before parsing.

## 1. Heading vs file date: 38 mismatches

| Carnet | File | Heading | Raw heading above the text | Verdict | Action |
|---|---|---|---|---|---|
| 006 | 1873-06-23 | Jeudi 23 juin 1873 | Jeudi 23 juin 1873 | Marie | weekday slip; RSR note added |
| 031 | 1875-04-17 | Lundi, 17 avril | Lundi 17 avril 1875 | Marie | weekday slip; RSR note added |
| 048 | 1875-10-27 | Dimanche, 27 octobre 1875 | Dimanche 27 octobre 1875 | Marie | weekday slip; RSR note added |
| 048 | 1875-11-07 | Samedi, 7 novembre 1875 | Samedi 6 novembre 1875 (suite) | pipeline | heading → «Samedi, 6 novembre 1875 (suite)» in all trees; file date wrong (content = 6 Nov), not renamed |
| 065 | 1876-08-25-26 | Lundi, 21 août 1876 (9 août) et Mardi, 22 août 1876 (10 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-08-27 | Mercredi, 27 août 1876 (15 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-08-28 | Jeudi, 28 août 1876 (16 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-08-29 | Vendredi, 29 août 1876 (17 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-08-30 | Samedi, 30 août 1876 (18 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-08-31 | Dimanche, 31 août 1876 (19 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-09-01 | Lundi, 1er septembre 1876 (20 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 065 | 1876-09-02 | Mardi, 2 septembre 1876 (21 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 066 | 1876-09-03 | Mercredi, 23 août 1876 (11 août) | et Mardi 22 août 1876 (10 août) | structural | see §3 |
| 066 | 1876-09-04 | Jeudi, 24 août 1876 (12 août) | Mercredi 23 août 1876 (11 août) | structural | see §3 |
| 066 | 1876-09-05 | Vendredi, 25 août 1876 (13 août) | Mercredi 23 août 1876 (11 août) | structural | see §3 |
| 066 | 1876-09-06 | Samedi, 26 août 1876 (14 août) | Mercredi 23 août 1876 (11 août) | structural | see §3 |
| 066 | 1876-09-07 | Dimanche, 27 août 1876 (15 août) | Mercredi 23 août 1876 (11 août) | structural | see §3 |
| 066 | 1876-09-08 | Lundi, 28 août 1876 (16 août) | Mercredi 23 août 1876 (11 août) | structural | see §3 |
| 066 | 1876-09-09 | Jeudi, 24 août 1876 (12 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 066 | 1876-09-10 | Vendredi, 25 août 1876 (13 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 066 | 1876-09-11 | Samedi, 26 août 1876 (14 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 066 | 1876-09-12 | Dimanche, 27 août 1876 (15 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 066 | 1876-09-13 | Lundi, 28 août 1876 (16 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 066 | 1876-09-14 | Mardi, 29 août 1876 (17 août) | (text not found in raw) | structural | see §3 |
| 066 | 1876-09-15 | Mercredi, 30 août 1876 (18 août) | Jeudi 24 août 1 876 (12 août) | structural | see §3 |
| 074 | 1877-09-11 | Mardi 10 septembre 1877 | Mardi 10 septembre 1877 | Marie | wrote «Mardi 10»; the Tuesday was the 11th; file follows weekday; RSR note added |
| 086 | 1879-09-05 | Jeudi, 4 septembre 1879/Vendredi, 5 septembre 1879 | Vendredi 5 septembre 1879 | faithful | empty 4 Sept merged into 5 Sept heading; raw has both headings; no action |
| 090 | 1880-12-21 | Mercredi, 21 décembre 1880 | Mercredi 21 décembre 1880 | Marie | weekday slip (already LAN-noted); RSR note added |
| 091 | 1881-02-12 | Vendredi, 11 février 1881 / Samedi 12 février 1881 | Samedi 12 février 1881 | faithful | empty 11 Feb merged; no action |
| 094 | 1882-01-26 | Mercredi, 25 janvier 1882 / Jeudi 26 janvier 1882 | Jeudi 26 janvier 1 882 | faithful | empty 25 Jan merged; no action |
| 094 | 1882-02-04 | Vendredi, 3 fevrier 1882 / Samedi 4 fevrier 1882 | Samedi 4 février 1882 | faithful | empty 3 Feb merged; no action |
| 094 | 1882-02-12 | Samedi, 11 fevrier 1882 / Dimanche 12 fevrier 1882 | Dimanche 12 février 1882 | faithful | empty 11 Feb merged; no action |
| 096 | 1882-09-06 | Mercredi 6 septembe 1882 | Mardi 5 septembre 1882 | faithful | «septembe» typo is in the raw; RSR note added |
| 102 | 1883-10-25 | Vendredi 26 octobre 1883 | (text not found in raw) | pipeline | empty day carried next day's heading → «Jeudi 25 octobre 1883», all trees |
| 102 | 1883-10-27 | Dimanche 28 octobre 1883 | (text not found in raw) | pipeline | → «Samedi 27 octobre 1883», all trees |
| 102 | 1883-10-31 | Jeudi 1er novembre 1883 | (text not found in raw) | pipeline | → «Mercredi 31 octobre 1883», all trees |
| 102 | 1883-11-12 | Samedi 12 novembre 1883 | Samedi 12 novembre 1883 | Marie | weekday slip; RSR note added |
| 102 | 1883-12-31 | Vendredi 31 décembre 1883 | Vendredi 31 décembre 1883 | Marie | weekday slip; RSR note added |

Fixed in `_original` and in the cz/uk/en/fr trees (headings only; en/048 footnote `[^dayerror]` removed because its claim was false): 048/1875-11-07, 102/1883-10-25, 102/1883-10-27, 102/1883-10-31, and 066/1876-09-10..13 + 09-15 (see §3). 102/1883-10-26 still carries the swallowed raw heading «Samedi 27 octobre 1883» as a text line at the end of 102.0027 in `_original` and the trees; not changed.

No-heading files (29, not checked in pass 1): 062/1876-06-18-19, 063/1876-07-04-05, 064/1876-08-15-16, 066/1876-10-09-11, 066/1876-10-12-13, 067/1876-10-18-19, 067/1876-10-21-22, 067/1876-10-25-26, 067/1876-10-27-29, 067/1876-11-01-continued, 067/1876-11-02-03, 067/1876-11-12-15, 067/1876-11-16-18, 067/1876-11-24-25, 067/1876-11-29-30-12-01, 067/1876-12-02-07, 067/1876-12-08-11, 068/1876-12-14-15, 068/1876-12-17-18, 068/1876-12-21-24, 068/1876-12-27-29, 068/1876-12-30-31, 068/1877-01-02-06, 068/1877-01-07-09, 068/1877-01-10-18, 068/1877-02-10-12, 068/1877-02-13-21, 068/1877-02-22-23, 101/1883-08-27-evening.

## 2. Content vs raw: 263 files whose text sits under a different raw day

Not fixed. Fixing them means moving paragraphs between files or renaming files in every tree, which is a structural job for the lead. The table is machine output; spot checks (005, 065/066, 102) confirmed it, but each row needs a human look before action.

- **whole-file-other-day** (148): no text of the file lies under the raw heading of its own date. Usually an off-by-one chain: a long raw entry was split, the tail got its own file with an invented heading, and every following day moved one file later (e.g. 005/1873-06-06..06-14: the text of raw «Vendredi 6 juin» sits in the file headed «Samedi 7 juin»; 027/1874-12-19 to 028/1875-01-20 is the same pattern over a month).
- **leading-spill** (115): the file starts with one or more paragraphs that the raw places at the end of the previous day, then continues with its own day. The heading is above the wrong paragraph.

| Carnet | whole-file | spill | Files (file ← raw headings of its text, paragraph counts) |
|---|---|---|---|
| 005 | 9 | 0 | 1873-06-06 ← Jeudi 5 juin 1873 ×5; 1873-06-07 ← Vendredi 6 juin 1873 ×7; 1873-06-08 ← Samedi 7 juin 1873 ×12; 1873-06-09 ← Dimanche 8 juin 1873 ×9; 1873-06-10 ← Lundi 9 juin 1873 ×7; 1873-06-11 ← Mardi 10 juin 1873 ×4; 1873-06-12 ← Mercredi 11 juin 1873 ×13; 1873-06-13 ← Jeudi 12 juin 1873 ×5; 1873-06-14 ← Vendredi 13 juin 1873 ×10 |
| 006 | 0 | 1 | 1873-06-16 ← Dimanche 15 juin 1873 ×1 + Lundi 16 juin 1873 ×10 |
| 008 | 1 | 0 | 1873-08-25 ← Dimanche 24 août 1873 ×23 |
| 010 | 0 | 3 | 1873-10-01 ← Mardi 30 septembre 1873 ×3 + Mercredi 1er octobre 1873 ×9; 1873-10-08 ← Mardi 7 octobre 1873 ×4 + Mercredi 8 octobre 1873 ×2; 1873-10-11 ← Vendredi 10 octobre 1873 ×4 + Samedi 11 octobre 1873 ×30 |
| 011 | 0 | 3 | 1873-10-15 ← Lundi 13 octobre 1873 (suite du livre n° 10) ×1 + Mercredi 15 octobre 1873 ×16; 1873-10-22 ← Mardi 21 octobre 1873 ×5 + Mercredi 22 octobre 1873 ×28 + Jeudi 23 octobre 1873 ×1; 1873-10-31 ← Jeudi 30 octobre 1873 ×4 + Vendredi 31 octobre 1873 ×16 |
| 013 | 1 | 2 | 1873-11-21 ← Jeudi 20 novembre 1873 ×2 + Vendredi 21 novembre 1873 ×14; 1873-11-23 ← Samedi 22 novembre 1873 ×6 + Dimanche 23 novembre 1873 ×19; 1873-11-26 ← Mercredi 26, jeudi 27 novembre 1873 ×29 |
| 014 | 0 | 2 | 1873-12-10 ← Mardi 9 décembre 1873 ×1 + Mercredi 10 décembre 1873 ×12; 1873-12-30 ← Lundi 29 décembre 1873 ×2 + Mardi 30 décembre 1873 ×12 |
| 015 | 1 | 0 | 1874-01-20 ← Mardi 21 janvier 1874 ×7 |
| 016 | 0 | 1 | 1874-02-03 ← Lundi 2 février!874 ×5 + Mardi 3 février 1874 ×7 |
| 018 | 2 | 0 | 1874-04-08 ← Mardi 7 avril 1874 ×12; 1874-04-20 ← Dimanche 19 avril 1874 ×5 + Mardi 21 avril 1874 ×1 |
| 019 | 1 | 0 | 1874-05-15 ← Jeudi 14 mai 1874 ×6 |
| 020 | 2 | 0 | 1874-06-02 ← Mercredi 3 juin 1874 ×3; 1874-06-23 ← Lundi 22 juin 1874 ×13 |
| 021 | 1 | 0 | 1874-07-19 ← Samedi 18 juillet 1874 ×5 |
| 023 | 1 | 0 | 1874-09-09 ← Mardi 8 septembre 1874 ×16 |
| 024 | 1 | 1 | 1874-09-17 ← Dimanche 13 septembre 1874 ×1 + Jeudi 17 septembre 1874 ×6; 1874-10-06 ← Lundi 5 octobre 1874 ×9 |
| 027 | 6 | 0 | 1874-12-19 ← Jeudi 18 décembre 1874 ×18; 1874-12-20 ← Samedi 19 décembre 1874 ×29; 1874-12-21 ← Dimanche 20 décembre 1874 ×1; 1874-12-22 ← Lundi 21 décembre 1874 ×3; 1874-12-23 ← Mardi 22 décembre 1874 ×1; 1874-12-24 ← Mercredi 23 décembre 1874 ×27 |
| 028 | 13 | 0 | 1874-12-25 ← Jeudi 24 décembre 1874 ×22; 1874-12-26 ← Vendredi 25 décembre 1874 ×27; 1874-12-27 ← Samedi 26 décembre 1874 ×3; 1874-12-28 ← Dimanche 27 décembre 1874 ×8; 1874-12-29 ← Lundi 28 décembre 1874 ×17; 1874-12-30 ← Mardi 29 décembre 1874 ×2; 1875-01-05 ← Mardi 6 janvier 1875 ×5; 1875-01-15 ← Jeudi 14 janvier 1875 ×1; 1875-01-16 ← Vendredi 15 janvier 1875 ×1; 1875-01-17 ← Samedi 16 janvier 1875 ×7; 1875-01-18 ← Dimanche 17 janvier 1875 ×15; 1875-01-19 ← Lundi 18 janvier 1875 ×9; 1875-01-20 ← Mardi 19 janvier 1875 ×9 |
| 029 | 2 | 0 | 1875-01-21 ← Mercredi 20 janvier 1875 ×14; 1875-01-22 ← Jeudi 21 janvier 1875 ×2 |
| 030 | 1 | 1 | 1875-02-19 ← Jeudi 18 février 1875 ×1 + Vendredi 19 février 1875 ×31; 1875-03-07 ← Mardi 16 mars 1875 ×7 |
| 031 | 0 | 1 | 1875-04-14 ← Mardi 13 avril 1875 ×6 + Mercredi 14 avril 1875 ×7 |
| 032 | 0 | 1 | 1875-04-23 ← Jeudi 22 avril 1875 ×1 + Vendredi 23 avril 1875 ×5 |
| 034 | 0 | 1 | 1875-06-07 ← Dimanche 6 juin 1875 ×1 + Lundi 7 juin 1875 ×42 |
| 038 | 1 | 0 | 1875-08-01 ← Samedi 31 juillet 1875 ×7 |
| 040 | 1 | 0 | 1875-08-27-28 ← Jeudi 26 août 1875 ×1 + Vendredi 27, samedi 28 août 1875 ×128 |
| 042 | 0 | 1 | 1875-09-08 ← Mardi 7 septembre 1875 ×2 + Mercredi 8 septembre 1875 ×18 |
| 048 | 1 | 0 | 1875-11-07 ← Samedi 6 novembre 1875 (suite) ×111 |
| 049 | 0 | 3 | 1875-11-09 ← Lundi 8 novembre 1875 ×1 + Mardi 9 novembre 1875 ×16; 1875-11-11 ← Mercredi 10 novembre 1875 ×22 + Jeudi 11 novembre 1875 ×35; 1875-11-13 ← Vendredi 12 novembre 1875 ×17 + Samedi 13 novembre 1875 ×16 |
| 050 | 0 | 1 | 1875-11-18 ← Mercredi 17 novembre 1875 ×3 + Jeudi 18 novembre 1875 ×11 |
| 055 | 0 | 4 | 1876-03-07 ← Lundi 6 mars 1876 ×60 + Mardi 7 mars 1876 ×7; 1876-03-23 ← Mercredi 22 mars 1876 ×13 + Jeudi 23 mars 1876 ×31; 1876-03-25 ← Vendredi 24 mars 1876 ×13 + Samedi 25 mars 1876 ×47; 1876-03-27 ← Dimanche 26 mars 1876 ×13 + Lundi 27 mars 1876 ×16 + Lundi 27 mars 1876 (suite) ×26 |
| 056 | 0 | 5 | 1876-03-28 ← Lundi 27 mars 1876 (suite) ×26 + Mardi 28 mars 1876 ×29; 1876-03-30 ← Mercredi 29 mars 1876 ×9 + Jeudi 30 mars 1876 ×63; 1876-03-31 ← Jeudi 30 mars 1876 ×43 + Vendredi 31 mars 1876 ×24; 1876-04-02 ← Samedi 1er avril 1876 ×18 + Dimanche 2 avril 1876 ×19; 1876-04-03 ← Dimanche 2 avril 1876 ×18 + Lundi 3 avril 1876 ×17 |
| 059 | 2 | 1 | 1876-04-20 ← Mercredi 19 avril 1876 ×2 + Jeudi 20 avril 1876 ×26; 1876-04-26 ← Mardi 25 avril 1876 ×56; 1876-04-27 ← Mercredi 26 avril 1876 ×45 |
| 061 | 0 | 1 | 1876-05-21-22 ← Samedi 20 mai 1876 ×1 + Dimanche 21 mai 1876 - lundi 22 mai 1876 ×32 |
| 062 | 0 | 8 | 1876-05-31 ← Mardi 30 mai 1876 ×9 + Mercredi 31 mai 1876 ×35; 1876-06-07 ← Mardi 6 juin 1876 ×10 + Mercredi 7 juin 1876 ×12; 1876-06-08 ← Mercredi 7 juin 1876 ×1 + Jeudi 8 juin 1876 ×6; 1876-06-18-19 ← Samedi 17 juin 1876 ×15 + Dimanche 18 juin 1876 - lundi 19 juin 1876 ×49; 1876-06-22 ← Mercredi 21 juin 1876 ×7 + Jeudi 22 juin 1876 ×30; 1876-06-24 ← Vendredi 23 juin 1876 ×10 + Samedi 24 juin 1876 ×19; 1876-06-27 ← Lundi 26 juin 1876 ×14 + Mardi 27 juin 1876 ×7; 1876-06-28 ← Mardi 27 juin 1876 ×6 + Mercredi 28 juin 1876 ×9 |
| 063 | 0 | 2 | 1876-07-06 ← Mardi 4 juillet 1876 - mercredi 5 juillet 1876 ×1 + Jeudi 6 juillet 1876 ×17; 1876-07-12 ← Mardi 11 juillet 1876 ×1 + Mercredi 12 juillet 1876 ×32 |
| 064 | 0 | 6 | 1876-07-20 ← Mercredi 19 juillet 1876 ×16 + Jeudi 20 juillet 1876 ×13; 1876-07-23 ← Samedi 22 juillet 1876 ×1 + Dimanche 23 juillet 1876 ×17; 1876-07-25 ← Lundi 24 juillet 1876 ×38 + Mardi 25 juillet 1876 ×24; 1876-07-26-27 ← Mardi 25 juillet 1876 ×4 + Mercredi 26 juillet 1876 - jeudi 27 juillet 1876 ×14; 1876-07-30 ← Samedi 29 juillet 1876 ×1 + Dimanche 30 juillet 1876 ×11; 1876-08-01 ← Lundi 31 juillet 1876 ×2 + Mardi 1er août 1876 ×7 |
| 065 | 13 | 0 | 1876-08-19 ← Vendredi 18 août 1876 (6 août) ×2; 1876-08-21 ← Dimanche 20 août 1876 (8 août) ×21; 1876-08-22 ← Dimanche 20 août 1876 (8 août) ×15; 1876-08-23 ← Dimanche 20 août 1876 (8 août) ×19; 1876-08-24 ← Dimanche 20 août 1876 (8 août) ×13; 1876-08-25-26 ← et Mardi 22 août 1876 (10 août) ×26; 1876-08-27 ← et Mardi 22 août 1876 (10 août) ×13; 1876-08-28 ← et Mardi 22 août 1876 (10 août) ×12; 1876-08-29 ← et Mardi 22 août 1876 (10 août) ×14; 1876-08-30 ← et Mardi 22 août 1876 (10 août) ×13; 1876-08-31 ← et Mardi 22 août 1876 (10 août) ×21; 1876-09-01 ← et Mardi 22 août 1876 (10 août) ×9; 1876-09-02 ← et Mardi 22 août 1876 (10 août) ×17 |
| 066 | 12 | 0 | 1876-09-03 ← et Mardi 22 août 1876 (10 août) ×5 + Mercredi 23 août 1876 (11 août) ×6; 1876-09-04 ← Mercredi 23 août 1876 (11 août) ×21; 1876-09-05 ← Mercredi 23 août 1876 (11 août) ×14; 1876-09-06 ← Mercredi 23 août 1876 (11 août) ×9; 1876-09-07 ← Mercredi 23 août 1876 (11 août) ×7; 1876-09-08 ← Mercredi 23 août 1876 (11 août) ×21; 1876-09-09 ← Jeudi 24 août 1 876 (12 août) ×13; 1876-09-10 ← Jeudi 24 août 1 876 (12 août) ×8; 1876-09-11 ← Jeudi 24 août 1 876 (12 août) ×7; 1876-09-12 ← Jeudi 24 août 1 876 (12 août) ×9; 1876-09-13 ← Jeudi 24 août 1 876 (12 août) ×6; 1876-09-15 ← Jeudi 24 août 1 876 (12 août) ×6 |
| 067 | 2 | 2 | 1876-11-01-continued ← Mercredi Ier novembre 1 876 (20 octobre) ×1; 1876-11-16-18 ← Mercredi 15 novembre 1 876 (3 novembre) ×37 + Samedi 18 novembre 1876 ×13; 1876-11-26 ← Vendredi 25 novembre 1876 ×34 + Samedi 26 novembre 1876 ×33; 1876-12-02-07 ← Mercredi 30 novembre 1876 ×5 + Vendredi 2 décembre 1876 ×21 + Samedi 3 décembre 1876 ×8 + Dimanche 4 décembre 1876 ×4 + Lundi 5 décembre 1876 ×8 + Mardi 6 décembre 1876 ×13 + Mercredi 7 décembre 1876 ×3 |
| 068 | 1 | 1 | 1877-01-01 ← Dimanche 31 décembre 1876 ×12; 1877-02-22-23 ← Mercredi 21 février 1877 ×5 + Jeudi 22 février 1877 Il pleut. ×6 + Vendredi 23 février 1877 ×26 |
| 069 | 2 | 0 | 1877-03-01 ← Mercredi 28 février 1877 ×9; 1877-04-01 ← Samedi 31 mars 1877 ×21 |
| 072 | 1 | 1 | 1877-06-16 ← Vendredi 1 5 juin 1877 ×14 + Samedi 1 6 juin 1 877 ×31; 1877-06-29 ← Jeudi 28 juin 1 877 ×9 |
| 073 | 0 | 2 | 1877-07-15 ← Samedi 14 juillet 1877 ×29 + Dimanche 1 5 juillet 1877 ×5; 1877-08-08 ← Mardi 7 août 1877 ×17 + Mercredi 8 août 1877 (Marie a noté Mer.8 et jeudi 8, mais a réctifié par la suite) ×24 |
| 074 | 2 | 0 | 1877-09-09 ← Samedi 8 septembre 1877 ×15; 1877-09-11 ← Mardi 10 septembre 1877 ×16 |
| 077 | 1 | 4 | 1877-12-23 ← Samedi 22 décembre 1877 ×2; 1878-01-02 ← Mardi 1er janvier 1878 ×1 + Mercredi 2 janvier 1878 ×8; 1878-01-21 ← Dimanche 20 janvier 1878 ×16 + Lundi 21 janvier 1878 ×24; 1878-01-25 ← Jeudi 24 janvier 1878 ×14 + Vendredi 25 janvier 1878 ×11; 1878-01-29 ← Lundi 28 janvier 1 878 ×37 + Mardi 29 janvier 1878 ×3 |
| 078 | 2 | 6 | 1878-02-04 ← Dimanche 3 février 1878 - suite ×13 + Lundi 4 février 1878 ×1; 1878-02-10 ← Samedi 9 février 1878 ×15; 1878-02-13 ← Mardi 12 Février 1 878 ×5 + Mercredi 13 février 1878 ×11; 1878-02-18 ← Dimanche 17 février 1878 ×24 + Lundi 18 février 1878 ×11; 1878-02-23 ← Vendredi 22 février 1878 ×6 + Samedi 23 février 1878 ×1; 1878-02-24 ← Samedi 23 février 1878 ×20; 1878-03-04 ← Dimanche 3 mars 1878 ×19 + Lundi 4 mars 1878 ×14; 1878-03-15 ← Jeudi 14 mars 1878 ×5 + Vendredi 15 mars 1878 ×11 |
| 079 | 3 | 3 | 1878-03-26 ← Lundi 25 mars 1 878 ×11 + Mardi 26 mars 1878 ×9; 1878-03-31 ← Samedi 30 mars 1878 ×1 + Dimanche 31 mars 1878 ×32; 1878-04-02 ← Lundi 1er avril 1 878 ×3; 1878-04-10 ← Mardi 9 avril 1 878 ×2 + Mercredi 10 avril 1878 ×35; 1878-04-30 ← Lundi 29 avril 1 878 ×7; 1878-05-01 ← Mardi 30 avril 1 878 ×38 |
| 080 | 0 | 7 | 1878-05-04 ← Vendredi 3 mai 1 878 ×5 + Samedi 4 mai 1 878 ×8; 1878-05-11 ← Vendredi 10 mai 1878 ×17 + Samedi 11 mai 1878 ×29; 1878-05-18 ← Vendredi 17 mai 1878 ×13 + Samedi 18 mai 1 878 ×6; 1878-05-21 ← Lundi 20 mai 1878 ×8 + Mardi 21 mai 1 878 ×5; 1878-05-29 ← Mardi 28 mai 1 878 ×2 + Mercredi 29 mai 1 878 ×25; 1878-06-04 ← Lundi 3 juin 1 878 ×9 + Mardi 4 juin 1 878 ×8; 1878-06-09 ← Samedi 8 juin 1 878 ×39 + Dimanche 9 juin 1878 ×20 |
| 081 | 2 | 6 | 1878-06-30 ← Samedi 29 juin 1 878 ×32 + Dimanche 30 juin 1878 ×3; 1878-07-06 ← Vendredi 5 juillet 1878 ×20 + Samedi 6 juillet 1878 ×3; 1878-07-07 ← Lundi 8 juillet 1 878 ×3; 1878-07-21 ← Samedi 20 juillet 1878 ×3 + Dimanche 21 juillet 1878 ×2; 1878-07-22 ← Dimanche 21 juillet 1878 ×4 + Lundi 22 juillet 1878 ×1; 1878-07-23 ← Lundi 22 juillet 1878 ×4; 1878-07-25 ← Mercredi 24 juillet 1878 ×2 + Jeudi 25 juillet 1878 ×2; 1878-08-05 ← Dimanche 4 août 1878 ×5 + Lundi 5 août 1878 ×2 |
| 082 | 5 | 6 | 1878-08-18 ← Samedi 1 7 août 1878 ×2 + Dimanche 18 août 1878 ×4; 1878-08-21 ← Mardi 20 août 1878 ×2 + Mercredi 21 août 1878 ×1; 1878-08-26 ← Dimanche 25 août 1878 ×4; 1878-09-11 ← Mardi 10 septembre 1878 ×5 + Mercredi 11 septembre 1878 ×3; 1878-09-17 ← Lundi 16 septembre 1878 ×6; 1878-09-26 ← Mercredi 25 septembre 1878 ×4; 1878-10-04-evening ← Jeudi 3 octobre 1878 ×9; 1878-10-04 ← Jeudi 3 octobre 1878 ×6; 1878-10-06 ← Samedi 5 octobre 1878 ×13 + Dimanche 6 octobre 1878 ×3; 1878-10-12 ← Vendredi 11 octobre 1878 ×6 + Samedi 12 octobre 1878 ×6; 1878-10-15 ← Lundi 14 octobre 1878 ×1 + Mardi 15 octobre 1878 ×1 |
| 083 | 3 | 6 | 1878-10-17 ← Mercredi 16 octobre 1878 ×2; 1878-10-26 ← Vendredi 25 octobre 1878 ×8 + Samedi 26 octobre 1878 ×12; 1878-11-19 ← Lundi 18 novembre 1878 ×4; 1878-11-30 ← Vendredi 29 novembre 1878 ×1 + Samedi 30 novembre 1878 ×2; 1878-12-04 ← Mardi 3 décembre 1878 ×1 + Mercredi 4 décembre 1878 ×2; 1878-12-15 ← Samedi 14 décembre 1878 ×3 + Dimanche 15 décembre 1878 ×1; 1878-12-28 ← Vendredi 27 décembre 1878 ×3 + Samedi 28 décembre 1878 ×1; 1879-01-03 ← Samedi 4 janvier 1879 ×1; 1879-01-09 ← Mercredi 8 janvier 1879 ×1 + Jeudi 9 janvier 1 879 ×3 |
| 084 | 5 | 4 | 1879-01-12 ← Lundi 1 3 janvier 1 879 - Nouvelle année russe ×2; 1879-01-19 ← Samedi 1 8 janvier 1879 ×2; 1879-01-25 ← Dimanche 26 janvier 1879 ×3; 1879-02-06 ← Mercredi 5 février 1879 ×1; 1879-03-05 ← Mardi 4 mars 1879 ×4 + Mercredi 5 mars 1879 ×26; 1879-03-13 ← Mercredi 12 mars 1879 ×7 + Jeudi 1 3 mars 1879 ×1; 1879-03-30 ← Samedi 29 mars 1879 ×3 + Dimanche 30 mars 1879 ×3; 1879-04-02 ← Mardi 1er avril 1 879 ×1; 1879-04-21 ← Dimanche 20 avril 1879 ×1 + Lundi 21 avril 1879 ×3 |
| 085 | 2 | 6 | 1879-05-13 ← Lundi 1 2 mai 1 879 ×1 + Mardi 1 3 mai 1879 ×2; 1879-05-18 ← Samedi 1 7 mai 1879 ×1 + Dimanche 1 8 mai 1 879 ×6; 1879-05-20 ← Lundi 1 9 mai 1 879 ×2; 1879-05-24 ← Vendredi 23 mai 1879 ×2 + Samedi 24 mai 1879 ×11; 1879-06-28 ← Vendredi 27 juin 1879 ×3 + Samedi 28 juin 1 879 ×4; 1879-07-04 ← Jeudi 3 juillet 1 879 ×1; 1879-07-13 ← Samedi 1 2 juillet 1879 ×12 + Dimanche 13 juillet 1879 ×12; 1879-07-21 ← Dimanche 20 juillet 1879 ×7 + Lundi 21 juillet 1 879 ×4 |
| 086 | 2 | 7 | 1879-08-10 ← Samedi 9 août 1879 ×6 + Dimanche 10 août 1879 ×10; 1879-08-18 ← Dimanche 17 août 1879 ×1 + Lundi 1 8 août 1 879 ×2; 1879-08-30 ← Vendredi 29 août 1879 ×5; 1879-09-09 ← Lundi 8 septembre 1879 ×4 + Mardi 9 septembre 1879 ×5; 1879-09-10 ← Mardi 9 septembre 1879 ×3 + Mercredi 10 septembre 1879 ×5; 1879-10-01 ← Lundi 29 septembre 1879 Mardi 30 septembre 1879 Mercredi 1er octobre 1879 ×5; 1879-10-19 ← Samedi 18 octobre 1879 ×3 + Dimanche 19 octobre 1879 ×11; 1879-10-27 ← Dimanche 26 octobre 1879 ×4 + Lundi 27 octobre 1879 ×2; 1879-11-01 ← Vendredi 31 octobre 1879 ×2 + Samedi 1er novembre 1879 - Toussaint ×3 |
| 087 | 5 | 0 | 1880-02-01 ← Samedi 31 janvier 1880 ×9; 1880-02-17 ← Lundi 1 6 février 1 880 ×5; 1880-03-16 ← Lundi 1 5 mars 1 880 ×5; 1880-04-06 ← Lundi 5 avril 1 880 ×6; 1880-04-11 ← Dimanche Î1 avril 1880 ×6 |
| 088 | 2 | 0 | 1880-06-01 ← Lundi 31 mai 1 880 ×37; 1880-06-11 ← Vendredi î 1 juin 1 880 ×4 |
| 089 | 2 | 0 | 1880-07-01 ← Mercredi 30 juin 1880 ×3; 1880-08-01 ← Samedi 31 juillet 1880 ×4 |
| 090 | 1 | 0 | 1880-11-26 ← Jeudi 25 novembre 1880 ×1 |
| 091 | 2 | 0 | 1881-02-06 ← Lundi 7 février 1 881 ×9; 1881-04-20 ← Jeudi 21 avril 1 881 ×5 |
| 092 | 3 | 0 | 1881-06-12 ← Lundi 13 juin 1881 -1er juin ×1; 1881-07-10 ← Dimanche 10 jullet 1881 - 28 juin ×5; 1881-08-07 ← Lundi 8 août 1 881 ×7 |
| 093 | 1 | 0 | 1881-09-26 ← Mardi 2.7 septembre 1881 ×12 |
| 094 | 1 | 0 | 1882-02-15 ← Mardi 14 février 1882 ×1 |
| 095 | 2 | 1 | 1882-05-20 ← Samedi 20 mars 1882 ×14; 1882-05-24 ← Mardi 23 mai 1 882- ×7; 1882-07-13 ← Mercredi 12 juillet 1882 ×5 + Jeudi 1 3 juillet 1 882 ×6 |
| 096 | 6 | 3 | 1882-08-08 ← Mardi 6 août 1 882 ×7; 1882-08-12 ← Vendredi 11 août 1882 ×2 + Samedi 12 août 1882 ×1; 1882-08-29 ← Lundi 28 août 1 882 ×6 + Mardi 29 août 1 882 ×8; 1882-09-06 ← Mardi 5 septembre 1882 ×7; 1882-09-13 ← Lundi 11 septembre 1882 Mardi 12 septembre 1882 Mercredi 13 septembre 1882 ×1; 1882-09-17 ← Vendredi 15 septembre 1882 Samedi 16 septembre 1882 Dimanche 17 septembre 1882 ×5; 1882-10-01 ← Samedi 30 septembre 1882 Dimanche 1er octobre 1882 ×2; 1882-10-07 ← Vendredi 6 octobre 1882 ×14; 1882-10-27 ← Jeudi 26 octobre 1882 ×1 + Vendredi 27 octobre 1882 ×6 |
| 097 | 2 | 1 | 1882-11-05 ← Samedi 4 novembre 1882 ×7; 1882-11-18 ← Vendredi 17 novembre 1882 ×3 + Samedi 18 novembre 1882 ×6; 1883-01-08 ← Lundi 9 janvier 1 883 ×8 |
| 098 | 2 | 0 | 1883-03-03 ← Vendredi 2 mars 1883 Samedi 3 mars 1883 ×5; 1883-03-19 ← Lundi 1 7 mars 1 883 ×4 |
| 099 | 1 | 0 | 1883-04-08 ← Dimanche 8 août 1883 ×6 |
| 100 | 4 | 0 | 1883-06-20 ← Jeudi 21 juin 1 883 ×2; 1883-07-18 ← Jeudi 1 9 juillet 1 883 ×5; 1883-07-29 ← Lundi 30 juillet 1 883 ×6; 1883-08-01 ← Jeudi 2 août 1 883 ×2 |
| 101 | 1 | 0 | 1883-09-16 ← Samedi 15 septembre 1883 ×8 |
| 103 | 2 | 0 | 1884-03-12 ← Jeudi 1 3 mars 1 884 ×8; 1884-03-23 ← Lundi 24 mars 1 884 ×22 |
| 104 | 3 | 0 | 1884-05-11 ← Lundi 1 2 mai 1 884 ×4; 1884-05-21 ← Mardi 20 mai 1 884 ×10; 1884-05-28 ← Mardi 27 mai 1 884 ×17 |
| 105 | 3 | 0 | 1884-08-17 ← Mardi 1 9 août 1884 ×17; 1884-08-23 ← Vendredi 22 août 1884 ×16; 1884-09-06 ← Samedi 8 septembre 1884 ×6 |

## 3. Carnets 065–066 (August–September 1876)

Every file from 065/1876-08-19 to 066/1876-09-15 holds text from the raw entries of 18–24 August 1876 (tome09 Livre 65) under invented dates and headings: 065/08-21..08-24 are all «Dimanche 20 août», 065/08-25-26..066/09-03 are «Lundi 21 / Mardi 22 août», 066/09-03 (second half)..09-08 are «Mercredi 23 août», 066/09-09..09-15 are «Jeudi 24 août» (09-14 is an empty file). The raw text from late 24 August to 14 September 1876 (tome09 python-docx paragraphs ~512–1139, including the opening of Livre 66, «Dimanche 3 septembre 1876 (22 août)») is missing from `_original` altogether, and 066/1876-09-16 starts inside the raw entry «Jeudi 14 septembre 1876». Later gaps in 066: raw ~1358–1392 (27 Sept), ~1427–1442, ~1560 onward (from 6 Oct; 066/1876-10-07..10-13 have no text).

Done here: 066/09-09 keeps its heading (it is the raw heading of its text); 09-10..09-13 and 09-15 now read «Jeudi, 24 août 1876 (12 août) (suite)» in all trees, the raw's own form for continuations. File dates not renamed. The rest of the block needs re-extraction from tome09.

## 4. Carnet 099 (April–May 1883) gaps found while restoring the 9 placeholders

- 1883-04-28 has no file: raw tome15 has the entry under a misprinted heading «Samedi 26 août 1883» between «Vendredi 27 avril» and «Dimanche 29 avril» (Trocadéro matinée, the maréchale, midnight Easter mass). Needs a new entry.
- 099/1883-04-08: its text sits under a raw heading «Dimanche 8 août 1883», which is a misprint for 8 avril in the raw itself; the file date is right.
- Restored in this pass besides the 9 listed paragraphs: 099.0336 (mixed French/English), 099.0377 (a tenth English placeholder), and truncated lines 099.0188, 099.0354, 099.0368, 099.0376, 099.0388.
