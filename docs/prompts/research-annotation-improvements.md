# Research & Annotation Improvements Implementation Guide

## Overview
This guide implements three critical improvements to the research and language annotation phase, addressing context window limits and glossary management.

## 1. Context-Aware Loading for Researcher

### Problem
Loading 400+ glossary entries exceeds context limits and slows processing.

### Solution: Smart Context Loading

#### Pre-Research Phase
```python
# Pseudo-code for context selection
def prepare_research_context(entry_date, book):
    # 1. Scan entry for named entities
    entities = quick_scan_for_names(entry_file)

    # 2. Load only relevant glossary entries
    relevant_glossary = []
    for entity in entities:
        if exists(f"/src/_original/_glossary/{entity}.md"):
            relevant_glossary.append(entity)

    # 3. Load location from previous entry
    previous_location = get_location_from_previous_entry(entry_date - 1)

    # 4. Load recurring characters from last 7 days
    recent_people = get_entities_from_date_range(entry_date - 7, entry_date - 1)

    return {
        "glossary_entries": relevant_glossary[:50],  # Cap at 50
        "previous_location": previous_location,
        "recent_context": recent_people[:20]  # Cap at 20
    }
```

#### Research Instructions Update
```markdown
## Context Loading Protocol

1. **Initial Scan**: Read entry once to identify potential entities
2. **Selective Loading**: Load ONLY:
   - Glossary entries for names found in scan
   - Previous day's location tag
   - Frequently mentioned people from last week
3. **Create on Demand**: Make new glossary entries as you encounter unknowns
4. **Context Budget**: Stay under 50 glossary entries per session
```

## 2. Batch Processing for Shared Context

### Problem
Processing entries individually misses shared context opportunities.

### Solution: Entity-Based Batching

#### Batch Identification
```python
# Group entries by shared entities
def identify_research_batches(entries):
    batches = []
    current_batch = []
    shared_entities = set()

    for entry in entries:
        entry_entities = scan_for_entities(entry)

        if len(entry_entities & shared_entities) > 3:  # 3+ shared entities
            current_batch.append(entry)
            shared_entities.update(entry_entities)
        else:
            if current_batch:
                batches.append(current_batch)
            current_batch = [entry]
            shared_entities = entry_entities

    return batches
```

#### Batch Processing Workflow
```markdown
## Batch Research Protocol

1. **Identify Batches**: Group 3-5 sequential entries with shared people/places
2. **Load Shared Context Once**:
   - Common glossary entries
   - Location continuity
   - Recurring themes
3. **Process as Unit**:
   - Research all entries in batch
   - Create glossary entries once
   - Maintain consistency across batch
4. **Document Patterns**: Note recurring themes for future batches
```

### Example Batch Command
```
Research entries 1874-03-10 through 1874-03-14 as a batch:
- These entries share: Hamilton, Nice, Promenade des Anglais
- Load shared glossary entries once
- Track Marie's movements across these days
- Note any developing storylines
```

## 3. Smart Glossary Architecture

### Problem
Unstructured glossary with 400+ entries becomes unwieldy.

### Solution: Categorized & Prioritized Structure

#### New Glossary Organization
```
/src/_original/_glossary/
├── _categories.yaml           # Category definitions
├── people/
│   ├── core/                 # Hamilton, family members
│   ├── recurring/            # Appears 5+ times
│   └── mentioned/            # Appears 1-4 times
├── places/
│   ├── residences/          # Where Marie lives
│   ├── social/              # Venues, promenades
│   └── travel/              # Cities, regions
└── culture/
    ├── literature/          # Books, authors
    ├── theater/             # Plays, operas
    └── history/             # Historical figures
```

#### Category Metadata File
```yaml
# /src/_original/_glossary/_categories.yaml
categories:
  people:
    core:
      description: "Central figures in Marie's life"
      load_priority: 1  # Always load
      entries:
        - Duke_of_Hamilton
        - Mme_Bashkirtseff
        - Paul_de_Cassagnac
    recurring:
      description: "Appears in 5+ entries"
      load_priority: 2  # Load when mentioned
      auto_promote: 10  # Promote to core after 10 mentions
    mentioned:
      description: "Appears in 1-4 entries"
      load_priority: 3  # Load only when needed
      auto_deprecate: 180  # Archive if not used in 180 days

  places:
    residences:
      load_priority: 1
      entries:
        - Villa_Baquis
        - Hotel_de_la_Grande_Bretagne
```

#### Glossary Entry Enhancement
```markdown
# Duke of Hamilton

**Category**: people/core
**First Mention**: 1873-11-15
**Last Updated**: 2025-01-06
**Mention Count**: 127
**Sentiment**: romantic_interest
**Related Entries**: [Lady_Hamilton], [Mandeville]

## Overview
[existing content]

## Entry References
- 1873-11-15: First sighting at Nice
- 1873-11-20: Dancing at ball
- 1873-12-25: Christmas encounter
[auto-generated from tags]
```

#### Auto-Deprecation Rules
```yaml
deprecation_rules:
  mentioned_once:
    after_days: 180
    action: move_to_archive

  no_recent_mentions:
    threshold: 365
    action: add_stale_flag

  low_priority:
    if:
      - category: "mentioned"
      - mention_count: 1
      - days_since_last: 90
    action: archive
```

## Implementation Steps

### Phase 1: Document Format Clarity (Immediate)
1. ✅ Updated Claude.md with paragraph clustering rules
2. Update researcher SKILL.md with format examples
3. Update linguistic-annotator SKILL.md with format rules
4. Add format validation examples

### Phase 2: Context Management (This Week)
1. Create context loading guidelines
2. Implement entity pre-scanning workflow
3. Set context budgets (50 glossary entries max)
4. Document in researcher instructions

### Phase 3: Glossary Restructure (Next Week)
1. Create category structure directories
2. Write _categories.yaml file
3. Script to categorize existing entries
4. Update researcher to use categories
5. Implement auto-deprecation tracking

### Phase 4: Batch Processing (Following Week)
1. Create batch identification algorithm
2. Update researcher instructions
3. Test with Hamilton-heavy sequences
4. Document best practices

## Measuring Success

### Context Loading
- Research sessions stay under context limits
- No "glossary not found" errors
- Faster processing time

### Batch Processing
- Shared entities tagged consistently
- Reduced redundant glossary lookups
- Better narrative continuity

### Glossary Management
- Easy to find relevant entries
- Automatic cleanup of stale entries
- Clear hierarchy of importance

## Notes for Researchers

### When Processing Entries
1. **Always check format**: Paragraph clusters must stay together
2. **Scan first**: Quick read to identify entities before loading glossary
3. **Batch when possible**: Look for 3+ shared entities in sequence
4. **Categorize new entries**: Place in correct glossary subdirectory
5. **Track mentions**: Update mention count in glossary entries

### Example Research Session
```
1. Scan entries 1874-03-10 to 1874-03-14
2. Identify shared: Hamilton (core), Nice (residence), balls (social)
3. Load only: 15 relevant glossary entries
4. Process batch maintaining consistency
5. Update Hamilton mention count: 127 → 132
6. Create new entry: Colonel_Kinsky (people/mentioned)
```