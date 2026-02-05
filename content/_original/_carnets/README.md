# Carnet Mapping Documentation

## Overview

Marie Bashkirtseff kept her journal from January 11, 1873 until shortly before her death on October 31, 1884, writing in 105 numbered carnets (notebooks) that she herself numbered. These were later published in 17 volumes ("Tomes" or "Books" numbered 00-16).

This directory contains the mapping between Marie's original carnet numbering and the published book structure.

## Source Materials

The original 105 carnets are preserved at:
- **Bibliotheque nationale de France (BnF)**: Carnets 2-88 and 90-106 (NAF 12306 onwards)
- **Bibliotheque de Cessole, Nice**: Carnet 89
- **Lost**: Carnet 1 original (only Pierre Borel's 1925 partial publication survives)

## Mapping File

`carnet-mapping.json` contains:
- Complete carnet-to-book mapping
- Date ranges for each carnet
- Locations where Marie was writing
- Special notes about archival status or textual issues

## Book-to-Carnet Summary

| Book | Carnets | Date Range | Notes |
|------|---------|------------|-------|
| 00 | 000 (Preface) | May 1884 | Editorial preface, genealogy |
| 01 | 001-007 | Jan 11 - Aug 10, 1873 | Carnet 1 from Borel 1925 |
| 02 | 008-014 | Aug 11, 1873 - Jan 1, 1874 | |
| 03 | 015-020 | Jan 2 - Jul 4, 1874 | |
| 04 | 021-030 | Jul 5, 1874 - Apr 2, 1875 | 10 carnets |
| 05 | 031-044 | Apr 2 - Sep 25, 1875 | 14 carnets (many short) |
| 06 | 045-052 | Sep 26, 1875 - Jan 23, 1876 | |
| 07 | 053-059 | Jan 24 - May 9, 1876 | |
| 08 | 060-064 | May 10 - Aug 16, 1876 | |
| 09 | 065-068 | Aug 17, 1876 - Feb 23, 1877 | |
| 10 | 069-074 | Feb 24 - Sep 25, 1877 | **Verified** |
| 11 | 075-080 | Sep 26, 1877 - Jun 22, 1878 | **Verified** |
| 12 | 081-084 | Jun 23, 1878 - Apr 25, 1879 | |
| 13 | 085-089 | Apr 26, 1879 - Oct 2, 1880 | Carnet 89 at Cessole |
| 14 | 090-094 | Oct 3, 1880 - Apr 13, 1882 | |
| 15 | 095-100 | Apr 30, 1882 - Aug 7, 1883 | |
| 16 | 101-106 | Aug 8, 1883 - Oct 20, 1884 | Final volume |

## Verification Notes

### Books 10-11 (Previously "Inferred")

The mapping for Books 10-11 was verified from the table of contents in the raw files:

**Book 10 (10_carnet_raw.md):**
```
Livre N. 69 - 24 fevrier 1877 - 2 avril 1877, Naples
Livre N. 70 - 3 avril 1877 - 25 avril 1877, Naples
Livre N. 71 - 26 avril 1877 - 10 juin 1877, Genes, Nice
Livre N. 72 - 11 juin 1877 - 14 juillet 1877, Nice, Paris
Livre N. 73 - 15 juillet 1877 - 19 aout 1877, Paris
Livre N. 74 - 23 aout 1877 - 25 septembre 1877, Paris, Schlangenbad, Wiesbaden
```

**Book 11 (11_carnet_raw.md):**
```
Livre 75 - 26 septembre - 31 octobre 1877, Paris
Livre 76 - 1er novembre - 22 decembre 1877, Paris
Livre 77 - 23 decembre - 3 fevrier 1878, Paris
Livre 78 - 3 fevrier - 16 mars 1878, Paris
Livre 79 - 17 mars 1878 - 3 mai 1878, Paris
Livre 80 - 4 mai - 22 juin 1878, Paris
```

## Terminology Notes

The raw transcription files use both "Carnet" and "Livre" to refer to the notebooks:
- **Early carnets (1-14)**: Generally titled "Carnet N. X"
- **Later carnets (15+)**: Generally titled "Livre X" or "Livre Xeme"

This reflects Marie's own evolving terminology as she continued her journal.

## Special Cases

### Carnet 000 (Preface)
Book 00 contains editorial material and Marie's preface written in May 1884. This is mapped to carnet "000" for completeness but is not part of the original 105-carnet sequence.

### Carnet 001 (Lost Original)
The original manuscript of Carnet 1 appears to be lost. The text in Book 01 comes from Pierre Borel's 1925 publication "Le visage inconnu de Marie Bashkirtseff d'apres ses memoires" in the review "Les Oeuvres libres."

### Carnet 010 (No Header)
Carnet 10 has no explicit header in the raw text body; its boundaries were determined from the table of contents at the end of Book 02.

### Carnet 059 (Misplaced)
Marie herself noted that this carnet was "misplaced" (egare). She discovered the gap while re-reading in 1882 and noted the missing period was April 19 to May 10, 1876.

### Carnet 067 (Duplicate Headers)
The raw file 09_carnet_raw.md contains two sections labeled "Livre 67" with different date ranges. This appears to be a transcription artifact where the carnet continued across what might have been separate physical notebooks or sections.

### Carnet 089 (External Archive)
Unlike the other carnets held at BnF, Carnet 89 is preserved at the Bibliotheque de Cessole in Nice.

### Carnet 106 (Final Entry)
Marie's final carnet ends October 20, 1884. She died 11 days later on October 31, 1884.

## Usage

This mapping file is used by the reorganization scripts to:
1. Move diary entry files from the book-based structure to carnet-based folders
2. Validate date assignments
3. Generate carnet-level metadata

## Data Sources

The mapping was extracted from:
- Table of contents sections at the end of each `XX_carnet_raw.md` file
- Carnet headers within the raw text
- Editorial notes in the preface (Book 00)

Date formats were normalized to ISO 8601 (YYYY-MM-DD) from the original French formats.

## Gaps and Uncertainties

1. **Small date gaps**: Some carnets have gaps of 1-4 days between end and start dates (e.g., carnet 23 ends Sep 13, carnet 24 starts Sep 17). These likely represent days without entries.

2. **Overlapping dates**: Some carnets appear to have the same date as end/start (e.g., carnet 77 ends Feb 3, carnet 78 starts Feb 3). This is normal - Marie would start a new carnet the same day.

3. **OCR artifacts**: Some dates in the source files have OCR errors (e.g., "ler" for "1er"). These have been corrected in the mapping.
