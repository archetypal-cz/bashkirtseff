# Carnets Reorganization - COMPLETED

**Status: COMPLETED** (January 31, 2026)

## Summary

The project has been successfully reorganized from the old "book" structure (17 folders) to Marie's original carnet (notebook) structure (100+ folders).

### Before (Old Structure)
- **17 folders**: `00/` through `16/` in `src/_original/` and `src/cz/`
- **Paragraph IDs**: Used book numbers (e.g., `01.0045`)
- **URLs**: `/cz/01/1873-01-11`

### After (Current Structure)
- **100+ folders**: `000/` through `106/` (with gaps for missing carnets)
- **Paragraph IDs**: Use carnet numbers (e.g., `001.0045`)
- **URLs**: `/cz/001/1873-01-11` or `/cz/1873/` for year-based browsing

## What Was Done

1. **Content Migration**
   - Moved all entries from book folders to carnet folders
   - Updated paragraph IDs to use 3-digit carnet numbers
   - Preserved all annotations (RSR, LAN, TR, RED, CON comments)

2. **Frontend Updates**
   - Updated routing to use carnet structure
   - Added year-based navigation (browse by 1873-1884)
   - Updated breadcrumbs and navigation links

3. **Cleanup**
   - Removed old book folders
   - Removed deprecated scripts
   - Updated documentation

## Current Navigation

The diary is now browsable by:

1. **Year** (`/cz/`) - Shows 12 years with Marie's age
2. **Year detail** (`/cz/1873/`) - Shows carnets from that year
3. **Carnet** (`/cz/001/`) - Shows entries in that notebook
4. **Entry** (`/cz/001/1873-01-11`) - Individual diary entry

Cross-year carnets (10 notebooks span year boundaries) appear in both years with indicators.

## Carnet Distribution by Year

| Year | Carnets | Entries | Marie's Age |
|------|---------|---------|-------------|
| 1873 | 11 | 242 | 14-15 |
| 1874 | 14 | 378 | 15-16 |
| 1875 | 23 | 298 | 16-17 |
| 1876 | 17 | 317 | 17-18 |
| 1877 | 8 | 270 | 18-19 |
| 1878 | 6 | 331 | 19-20 |
| 1879 | 3 | 297 | 20-21 |
| 1880 | 2 | 75 | 21-22 |
| 1881 | 4 | 299 | 22-23 |
| 1882 | 3 | 259 | 23-24 |
| 1883 | 5 | 321 | 24-25 |
| 1884 | 4 | 207 | 25-26 |

**Total**: ~100 carnets, ~3,300 entries

## Files Updated

- `frontend/src/lib/content.ts` - Year aggregation functions
- `frontend/src/pages/cz/index.astro` - Year-based index
- `frontend/src/pages/cz/[year]/index.astro` - Year detail page
- `frontend/src/pages/cz/carnets.astro` - Flat carnet list
- `frontend/src/pages/cz/[carnet]/index.astro` - Updated breadcrumbs
- `Claude.md`, `README.md` - Updated documentation
