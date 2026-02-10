# EPUB Analysis Report — 2026-02-10

## Source Files

Three English editions copied from NAS to `raw_books/` (gitignored):

| File | Edition | Translator | Year | Size |
|------|---------|-----------|------|------|
| `Kernberger_Journal_illustrated.epub` | Complete 2-vol (I Am the Most Interesting Book + Lust for Glory) | Katherine Kernberger | 2013 | 20MB |
| `Kernberger_Journal_text.epub` | Censored 1-volume | Mathilde Blind | 1890 | 1.4MB |
| `From_Childhood_to_Womanhood.epub` | Early years only | Unknown | 2012 | 108KB |

## Kernberger Analysis Results

### Phase 1: Structure
- **283 XHTML documents** in spine
- **All 106 Books** covered (Book 1-106 = our Carnets 001-106)
- Volume I: Books 1-60 (1873-1876)
- Volume II: Books 61-106 (1876-1884)
- **5 Appendices**: Glossary, Genealogy, Chronology, Bojidar piece, Funeral
- Front matter: Translator's Preface, Introduction, Marie's Preface, Map of Nice

### Phase 2: Paragraph Matching
- **9,252 / 34,720 paragraphs matched** (~27% coverage)
- **2,465 dates** found in both Kernberger and our originals
- **328 dates** only in Kernberger (mostly date parsing artifacts, some genuine gaps)
- **1,195 dates** only in our originals (entries Kernberger omitted)

### Coverage by Year
| Year | Entries | In Kernberger | Coverage |
|------|---------|---------------|----------|
| 1873 | 340 | 278 | 81% |
| 1874 | 359 | 213 | 59% |
| 1875 | 315 | 194 | 61% |
| 1876 | 287 | 253 | 88% |
| 1877 | 280 | 234 | 83% |
| 1878 | 348 | 232 | 66% |
| 1879 | 317 | 194 | 61% |
| 1880 | 340 | 236 | 69% |
| 1881 | 245 | 124 | 50% |
| 1882 | 275 | 144 | 52% |
| 1883 | 325 | 204 | 62% |
| 1884 | 219 | 159 | 72% |

### Phase 3: Images
- **220 images extracted** to `content/_raw/images/kernberger/`
- Includes: Map of Nice, Duke of Hamilton portrait, Marie's monogram, many more
- All images have context (alt text, surrounding paragraphs)
- Report: `content/_raw/reports/kernberger_images.md`

### Phase 4: Footnotes
- **0 inline footnotes** detected (notes are in appendices, not inline)
- Appendices (Glossary, Genealogy, Chronology) need separate extraction

## Tools Created
- **Script**: `src/scripts/epub_kernberger.py` (6 subcommands)
- **Justfile commands**: `just kernberger-analyze`, `kernberger-extract`, `kernberger-images`, etc.

## Next Steps
1. Run `just kernberger-tag-dry` then `just kernberger-tag` to add #Kernberger tags
2. Extract Kernberger appendices (Glossary, Genealogy, Chronology) for glossary enrichment
3. Investigate the ~30-50 genuine EPUB-only dates (possible missing entries)
4. Analyze Mathilde Blind edition for censored content mapping
5. Refine date parsing to handle combined entries (e.g., `1876-12-08-11`)

## Citation Requirement
**ALWAYS cite Kernberger** when using her information:
> Per Kernberger (2013), ...
> Katherine Kernberger, *I Am the Most Interesting Book of All* / *Lust for Glory*, Fonthill Press, 2013.

## Detailed Reports
- `EPUB_ANALYSIS_PLAN.md` — full technical plan
- `content/_raw/reports/kernberger_structure.md` — EPUB structure
- `content/_raw/reports/kernberger_matching.md` — paragraph matching
- `content/_raw/reports/kernberger_images.md` — image inventory
- `content/_raw/reports/kernberger_matching.json` — machine-readable matching data
