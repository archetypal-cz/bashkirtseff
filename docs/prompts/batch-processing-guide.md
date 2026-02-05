# Batch Processing Guide for Shared Context Entries

## Overview
Process related diary entries as batches to maximize efficiency and maintain narrative continuity. This approach reduces redundant glossary lookups and ensures consistent tagging.

## When to Use Batch Processing

### Ideal Scenarios
1. **Sequential days in same location** (Nice week, Paris soirées)
2. **Continuing storylines** (Hamilton pursuit, art exhibition)
3. **Social event series** (multiple balls, concert season)
4. **Travel sequences** (journey entries)

### Batch Size Guidelines
- **Optimal**: 3-5 entries
- **Maximum**: 7 entries
- **Minimum**: 2 entries (if strong connection)

## Identifying Batchable Entries

### Quick Scan Method
```bash
# Preview entries for common entities
for i in {10..15}; do
  echo "=== 1874-03-$i ==="
  grep -E "(Hamilton|Nice|ball)" src/_original/03/1874-03-$i.md | head -3
done
```

### Batch Criteria Checklist
- [ ] Same primary location (Nice, Paris, etc.)
- [ ] 3+ shared people mentioned
- [ ] Continuing narrative/event
- [ ] Within 7-day window
- [ ] Similar social context

## Batch Processing Workflow

### Step 1: Batch Analysis
```markdown
## Batch: 1874-03-10 to 1874-03-14

### Shared Context
- **Location**: Nice (all 5 days)
- **Key People**: Hamilton (all), Tolstoy (4/5), Boreel (3/5)
- **Venues**: Promenade des Anglais (all), Casino (3/5)
- **Theme**: Hamilton courtship escalation

### Unique Elements
- 03-11: Raoulx dinner party
- 03-13: Italian visitors
- 03-14: Hamilton's departure announced
```

### Step 2: Context Loading Strategy

#### One-Time Loads (for entire batch)
```yaml
core_context:
  places:
    - Nice
    - Promenade_des_Anglais
    - Villa_Baquis
  people:
    - Duke_of_Hamilton
    - Paul_Tolstoy
    - Mme_Bashkirtseff
  recurring_elements:
    - Daily_promenade_routine
    - Hamilton_pursuit_timeline
```

#### Per-Entry Loads
```yaml
entry_specific:
  1874-03-11:
    - Mme_de_Raoulx
    - Dinner_party_etiquette
  1874-03-13:
    - Italian_visitors
    - Marchese_di_Villanova
  1874-03-14:
    - Departure_preparations
    - Travel_to_London
```

### Step 3: Batch Annotation Template

Create a batch overview file:
```markdown
# Batch Research: 1874-03-10 to 1874-03-14

## Batch Summary
- **Primary storyline**: Hamilton's final week in Nice
- **Marie's emotional arc**: Hope → Excitement → Disappointment
- **Social dynamics**: Increased competition for Hamilton's attention

## Shared Glossary Loaded
1. [Duke of Hamilton](people/core/Duke_of_Hamilton.md) - 127 mentions
2. [Nice](places/travel/Nice.md) - Primary location
3. [Promenade des Anglais](places/social/Promenade_des_Anglais.md)
[... up to 20 shared entries]

## Daily Processing Notes

### 1874-03-10
- New entities: None
- Key moments: Hamilton walks with Marie alone
- Emotional tone: Hopeful

### 1874-03-11
- New entities: Mme de Raoulx (create glossary)
- Key moments: Dinner party, Hamilton sits beside Marie
- Emotional tone: Elated

[Continue for each day...]

## Patterns Observed
- Hamilton appears daily between 2-4pm
- Marie's French becomes more emotional/less controlled
- Increased use of English phrases when discussing Hamilton

## Language Annotation Notes
- "Fair-play" used 3 times (English sporting term)
- "Flirtation" becoming "flirt" (anglicization)
- Diminutives increase when happy (Hammy, Tolsty)
```

### Step 4: Efficient Processing Commands

#### Batch Entity Extraction
```bash
#!/bin/bash
# extract_batch_entities.sh

BOOK="03"
START_DAY=10
END_DAY=14

echo "## Entities in batch 1874-03-$START_DAY to 1874-03-$END_DAY"
for day in $(seq $START_DAY $END_DAY); do
  file="src/_original/$BOOK/1874-03-$day.md"
  if [ -f "$file" ]; then
    echo -e "\n### 1874-03-$day"
    # Extract hashtags
    grep "^%%\[#" "$file" | sed 's/%%\[#/- /g' | sed 's/\](.*//g' | sort | uniq
    # Extract capitalized words (potential new entities)
    grep -o '\b[A-Z][a-z]\+\b' "$file" | sort | uniq -c | sort -rn | head -10
  fi
done
```

#### Batch Tagging Consistency
```python
# ensure_batch_consistency.py

def check_batch_consistency(entries):
    """Ensure shared entities are tagged consistently."""

    entity_tags = {}

    # Collect all entity tags
    for entry in entries:
        tags = extract_tags(entry)
        for tag in tags:
            if tag not in entity_tags:
                entity_tags[tag] = []
            entity_tags[tag].append(entry['date'])

    # Find inconsistencies
    for entity, dates in entity_tags.items():
        if len(dates) >= 3 and len(dates) < len(entries):
            print(f"WARNING: {entity} tagged in {len(dates)}/{len(entries)} entries")
            print(f"  Present: {dates}")
            print(f"  Missing from: {set(all_dates) - set(dates)}")
```

## Batch Types and Strategies

### Type 1: Location-Based Batches
**Example**: Full week in Nice
- Load location-specific glossary once
- Track venue patterns
- Note weather/seasonal references

### Type 2: Event-Based Batches
**Example**: Series of balls/soirées
- Load social etiquette glossary
- Track guest lists across events
- Note fashion/appearance themes

### Type 3: Relationship-Based Batches
**Example**: Hamilton pursuit sequence
- Load all Hamilton-related entries
- Track interaction progression
- Note emotional language changes

### Type 4: Travel Batches
**Example**: Journey from Nice to Paris
- Load transportation glossary
- Track route and stops
- Note travel companions

## Quality Control for Batches

### Consistency Checks
1. **Entity Tagging**: Same person tagged same way
2. **Location Continuity**: Logical progression
3. **Timeline Coherence**: Events in proper order
4. **Emotional Arc**: Natural progression

### Common Batch Processing Errors
- ❌ Missing entity in middle entry
- ❌ Location change not noted
- ❌ Storyline gaps unexplained
- ❌ Inconsistent name spellings
- ✅ All shared entities tagged
- ✅ Narrative flow maintained
- ✅ Cross-references added

## Batch Processing Benefits

1. **Efficiency**: Load shared context once
2. **Consistency**: Uniform tagging across related entries
3. **Narrative**: Better storyline understanding
4. **Quality**: Catch patterns and connections
5. **Speed**: Process 5 entries in time of 3

## Implementation Checklist

### Before Starting Batch
- [ ] Identify batch boundaries
- [ ] List shared entities
- [ ] Load core glossary entries
- [ ] Create batch overview file

### During Processing
- [ ] Maintain consistency checklist
- [ ] Note patterns/themes
- [ ] Flag language quirks
- [ ] Track emotional progression

### After Batch
- [ ] Run consistency check
- [ ] Update batch overview
- [ ] Note improvements for next batch
- [ ] Update glossary mention counts

## Example: Processing Hamilton Sequence

```bash
# 1. Identify Hamilton-heavy sequence
grep -c "Hamilton" src/_original/01/1873-11-*.md | sort -k2 -t: -n

# 2. Group high-mention days
# Result: 1873-11-15 to 1873-11-22 (8 days, 47 Hamilton mentions)

# 3. Create batch context
echo "## Hamilton Sequence Batch 1873-11-15 to 1873-11-22" > batch_hamilton.md
echo "Total Hamilton mentions: 47" >> batch_hamilton.md
echo "Average per day: 5.9" >> batch_hamilton.md

# 4. Process as unit with shared Hamilton context loaded
```

## Future Enhancements

1. **Auto-batch detection**: Script to suggest batches
2. **Batch templates**: Pre-made templates for common batch types
3. **Visualization**: Timeline view of batches
4. **Metrics**: Track time saved through batching