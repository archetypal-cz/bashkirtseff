# Glossary Categorization Implementation Guide

## Purpose

Transform the flat glossary structure (400+ entries) into a categorized hierarchy for better context management and faster research.

## New Directory Structure

```
/src/_original/_glossary/
├── _categories.yaml          # Category definitions (created)
├── _archive/                 # Deprecated entries
├── people/
│   ├── core/                # Always load (Hamilton, family)
│   ├── recurring/           # Regular mentions (10+)
│   └── mentioned/           # Occasional (1-9)
├── places/
│   ├── residences/         # Where Marie lives
│   ├── social/             # Venues, promenades
│   └── travel/             # Cities, regions
├── culture/
│   ├── literature/         # Books, authors
│   ├── theater/            # Plays, operas
│   ├── music/              # Songs, composers
│   └── history/            # Historical references
└── society/
    ├── aristocracy/        # Nobility, titles
    ├── politics/           # Political figures, parties, events
    └── artists/            # Painters, musicians
```

## Migration Process

### Phase 1: Create Directory Structure

```bash
cd src/_original/_glossary
mkdir -p people/{core,recurring,mentioned}
mkdir -p places/{residences,social,travel}
mkdir -p culture/{literature,theater,history}
mkdir -p society/{aristocracy,artists}
mkdir -p _archive
```

### Phase 2: Categorize Existing Entries

#### Quick Categorization Script

```python
# categorize_glossary.py
import os
import re
from pathlib import Path

# Category keywords for auto-sorting
KEYWORDS = {
    'people/core': ['Hamilton', 'Bashkirtseff', 'Dina', 'Paul_de_Cassagnac'],
    'places/residences': ['Villa', 'Hotel', 'Rue_de', 'apartment'],
    'places/social': ['Promenade', 'Casino', 'Theatre', 'Opera'],
    'places/travel': ['Nice', 'Paris', 'Rome', 'London', 'Vienna'],
    'culture/literature': ['Victor_Hugo', 'Dumas', 'Zola', 'George_Sand'],
    'culture/theater': ['La_Traviata', 'Carmen', 'Bernhardt'],
    'society/aristocracy': ['Duke', 'Duchess', 'Prince', 'Princess', 'Baron', 'Count'],
    'society/artists': ['painter', 'artist', 'sculptor', 'musician']
}

def categorize_entry(filename):
    """Suggest category based on filename and content."""
    name = filename.replace('.md', '')

    # Check keywords
    for category, keywords in KEYWORDS.items():
        if any(kw in name for kw in keywords):
            return category

    # Default categories
    if name[0].isupper() and '_' not in name:
        return 'people/mentioned'  # Simple names

    return 'culture/history'  # Default fallback

# Generate categorization suggestions
glossary_files = Path('.').glob('*.md')
suggestions = {}

for file in glossary_files:
    if file.name.startswith('_'):
        continue
    suggestions[file.name] = categorize_entry(file.name)

# Output suggestions for review
for file, category in sorted(suggestions.items()):
    print(f"mv {file} {category}/{file}")
```

### Phase 3: Enhanced Glossary Entry Format

Update each glossary entry to include category metadata:

```markdown
# Duke of Hamilton

**Category**: people/core
**Mention Count**: 127
**First Mention**: 1873-11-15
**Last Mention**: 1874-07-15
**Load Priority**: 1
**Sentiment**: romantic_interest
**Related Entries**: [Lady_Hamilton](../core/Lady_Hamilton.md), [Duchess_of_Hamilton](../core/Duchess_of_Hamilton.md)

## Overview

[existing content...]

## Diary References

- 1873-11-15: First sighting at Nice [Book 01]
- 1873-11-20: Dancing at ball [Book 01]
- 1873-12-25: Christmas encounter [Book 01]
  [Auto-generated from entry tags]

## Research Status

**Status**: Comprehensive
**Last Updated**: 2024-07-15
**Sources**: Wikipedia, British Peerage, Contemporary newspapers
```

### Phase 4: Update Researcher Workflow

#### Context Loading Protocol

```python
def load_research_context(entry_date, book):
    """Load only relevant glossary entries based on categories."""
    context = {
        'glossary_entries': [],
        'loaded_count': 0
    }

    # 1. Always load core people (max 10)
    core_people = load_category('people/core', limit=10)
    context['glossary_entries'].extend(core_people)

    # 2. Load current residence
    current_residence = get_current_residence(entry_date)
    if current_residence:
        context['glossary_entries'].append(current_residence)

    # 3. Scan entry for mentioned entities
    mentioned = scan_entry_for_entities(entry_date)

    # 4. Load only mentioned entities (up to budget)
    budget_remaining = 50 - len(context['glossary_entries'])
    for entity in mentioned[:budget_remaining]:
        if exists_in_glossary(entity):
            context['glossary_entries'].append(load_entity(entity))

    context['loaded_count'] = len(context['glossary_entries'])
    return context
```

## Implementation Checklist

### Immediate Actions

- [x] Create \_categories.yaml with definitions
- [ ] Create directory structure
- [ ] Write categorization script
- [ ] Review and approve categorizations
- [ ] Move files to new locations
- [ ] Update existing entries with metadata

### Researcher Updates

- [ ] Modify context loading to use categories
- [ ] Implement mention counting
- [ ] Add category-aware search
- [ ] Update glossary creation to assign category

### Maintenance Tasks

- [ ] Monthly deprecation review
- [ ] Quarterly category rebalancing
- [ ] Annual archive cleanup

## Benefits

1. **Faster Context Loading**: Load only relevant categories
2. **Better Organization**: Find entries quickly
3. **Automatic Cleanup**: Deprecate unused entries
4. **Scalability**: System handles growth better
5. **Clear Priorities**: Know what to load always/sometimes/rarely

## Validation

After implementation, verify:

- [ ] Core people load in under 5 seconds
- [ ] Context stays under 50 entries
- [ ] Deprecated entries move to archive
- [ ] New entries get proper categories
- [ ] Research sessions run faster

## Future Enhancements

1. **Auto-categorization**: ML model to suggest categories
2. **Relationship Graphs**: Visualize people connections
3. **Timeline Integration**: Show when people were relevant
4. **Cross-reference Matrix**: See all related entries
