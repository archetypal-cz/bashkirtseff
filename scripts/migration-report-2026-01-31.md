# Carnet Migration Report - 2026-01-31

## Summary

Successfully migrated diary entries from book-based structure (00-16) to carnet-based structure (000-106).

## Statistics

### Original (French)
- Files processed: 3306
- Files migrated: 3306 (after fixing malformed filename)
- Files skipped: 0
- Errors: 0
- Warnings: 16

### Czech Translations
- Files processed: 112
- Files migrated: 112
- Files skipped: 0
- Errors: 0
- Warnings: 0

## Changes Made

1. **New directories created**: 107 carnet directories (000-106) in both `src/_original/` and `src/cz/`

2. **Frontmatter updates**:
   - Changed `book: XX` to `carnet: XXX`
   - Example: `book: 01` -> `carnet: 001`

3. **Paragraph ID updates**:
   - Changed 2-digit book format to 3-digit carnet format
   - Standardized paragraph numbers to 4 digits
   - Example: `%% 01.15 %%` -> `%% 001.0015 %%`

4. **Book 00 files renamed**:
   - `00-01.md` -> `000-01.md`
   - `00-02.md` -> `000-02.md`
   - etc.

## Carnet Distribution

| Carnet | Files | Date Range |
|--------|-------|------------|
| 000 | 11 | Preface (May 1884) |
| 001 | 22 | 1873-01-11 to 1873-02-12 |
| 002 | 25 | 1873-02-16 to 1873-03-12 |
| 003 | 33 | 1873-03-13 to 1873-04-14 |
| 004 | 19 | 1873-04-15 to 1873-05-17 |
| ... | ... | ... |
| 106 | 39 | 1884-09-11 to 1884-10-20 |

## Warnings (Edge Cases)

The following dates fell between carnet boundaries and required tolerance matching:

1. 1873-10-14 -> carnet 010 (tolerance)
2. 1874-09-16 -> carnet 024 (tolerance)
3. 1875-08-13 -> carnet 038 (tolerance)
4. 1875-08-15 -> carnet 039 (tolerance)
5. 1875-11-07 -> carnet 048 (tolerance)
6. 1875-11-08 -> carnet 049 (tolerance)
7. 1876-01-09 -> carnet 051 (tolerance)
8. 1876-02-11 -> carnet 053 (tolerance)

The following dates (April 1882) fell in a gap between carnets 094 and 095:

- 1882-04-18 to 1882-04-25 -> assigned to carnet 090 (fallback using book 14 mapping)
- 1882-04-27 and 1882-04-29 -> assigned to carnet 095 (tolerance)

## Data Issue Found and Fixed

File `src/_original/14/1-01-02.md` had a malformed filename.
- **Fixed**: Renamed to `1880-01-02.md`
- **Migrated**: File correctly moved to `src/_original/087/1880-01-02.md` (based on date)
- **Note**: The file was in book 14, but its date (1880-01-02) falls within carnet 087 (1879-12-22 to 1880-04-23, originally book 13). This indicates the file may have been misplaced in the original book structure.

## Files Preserved

Old book directories (00-16) are preserved for reference and verification. They can be removed after confirming the new structure is correct.

## Next Steps

1. Fix the malformed filename: `1-01-02.md` -> `1880-01-02.md`
2. Verify the new structure works with the application
3. Update frontend code to use carnet paths
4. Remove old book directories after verification
5. Update documentation

## Script Location

Migration script: `scripts/migrate-to-carnets.py`

Run with `--dry-run` flag to preview changes without making them.
