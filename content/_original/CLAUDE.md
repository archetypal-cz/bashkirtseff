# _original/ — French Source Materials

This directory contains the French original diary entries and supporting materials.

## Structure

```
_original/
├── CLAUDE.md            # This file
├── PROGRESS.md          # Overall source preparation status
│
├── 000/                 # Carnet 000 (Marie's preface)
│   └── README.md        # Carnet progress tracking
├── 001/-106/            # Diary carnets
│   └── README.md        # Per-carnet progress
│
├── _glossary/           # Entity definitions
│   ├── CLAUDE.md        # Glossary system docs
│   ├── people/          # Person entries
│   ├── places/          # Location entries
│   ├── culture/         # Cultural references
│   ├── society/         # Social/institutional
│   └── languages/       # Language references
│
├── _carnets/            # Carnet metadata (YAML)
├── _summary/            # Book summaries
├── _workflow/           # Machine state (JSON from workflow runs)
└── _archive/            # Historical versions
```

## Source Preparation Phases

### 1. Restructuring (Complete for all carnets)
- Convert raw text to proper markdown
- Add YAML frontmatter
- Assign paragraph IDs (`%% XXX.YYYY %%`)

### 2. Research (RSR)
- Identify all entities (people, places, events, culture)
- Determine Marie's location for each entry
- Create/update glossary entries
- Add RSR comments with historical context

**Frontmatter flag**: `research_complete: true`

### 3. Linguistic Annotation (LAN)
- Add translation guidance for difficult passages
- Note period vocabulary, idioms, Marie's quirks
- Flag cultural references needing adaptation

**Frontmatter flag**: `linguistic_annotation_complete: true`

## Annotation Format

```markdown
%% 001.0015 %%
%% [#Paul_de_Cassagnac](../_glossary/people/politicians/PAUL_DE_CASSAGNAC.md) %%
Je lis les articles de M. de Cassagnac dans Le Pays...
%% 2025-12-07T16:00:00 RSR: Paul de Cassagnac (1842-1904), Bonapartist
journalist and politician. Marie follows his political articles closely. %%
%% 2025-12-07T17:00:00 LAN: "Le Pays" - Bonapartist newspaper, keep as
"Le Pays" with footnote on first occurrence. %%
```

## Glossary Linking

When referencing entities:
1. Add glossary link comment before paragraph text
2. Use relative path: `../_glossary/category/FILENAME.md`
3. Filename must be CAPITAL_ASCII

```markdown
%% [#Nice](../_glossary/places/cities/NICE.md) %%
%% [#Maman](../_glossary/people/family/MAMAN.md) %%
```

## Progress Tracking

Each carnet folder should have a `README.md` with:
- Research/annotation completion counts
- TODOs needing attention
- Changelog of work done

Use `/project-status original 001` to check status.

### TODO Tags for Source Work

| Tag | Meaning |
|-----|---------|
| `RSR-NEEDED` | Entry needs research |
| `RSR-DONE` | Research complete |
| `LAN-NEEDED` | Needs linguistic annotation |
| `LAN-DONE` | Annotation complete |
| `GLOSSARY-STUB` | Glossary entry needs expansion |
| `LOCATION-UNKNOWN` | Marie's location unclear |

## Quality Standards

### Research Quality
- Every person identified with full name when possible
- Every place linked to glossary
- Marie's location determined for every entry
- Cultural references explained

### Annotation Quality
- All idioms flagged with guidance
- Period vocabulary noted
- Marie's unique expressions documented
- Ambiguous passages clarified

## Common Tasks

### Add research to an entry
Use `/researcher` skill or manually add RSR comments.

### Create glossary entry
Use `/glossary` skill or create file in appropriate category.

### Check what needs research
```bash
/project-status original          # Overall status
grep -r "RSR-NEEDED" src/_original/*/README.md
```

## Related Documentation

- `/_glossary/CLAUDE.md` - Glossary system details
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/.claude/skills/researcher/SKILL.md` - Researcher role
- `/.claude/skills/linguistic-annotator/SKILL.md` - Annotator role
