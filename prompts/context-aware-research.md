# Context-Aware Research Implementation

## Overview
This document provides practical instructions for researchers to manage context window limits when processing diary entries.

## Before You Start Research

### 1. Pre-Scan the Entry
Before loading any glossary entries, quickly scan the entry for:
- Named people (capitalized names)
- Places (cities, venues, streets)
- Cultural references (plays, books, operas)

### 2. Check Previous Day's Context
```bash
# Look at previous entry's tags to get location
grep -A1 "^%%\[#" src/_original/{book}/YYYY-MM-DD.md | head -1
```

### 3. Selective Glossary Loading

**DO NOT** load all 400+ glossary entries!

**INSTEAD**, use this priority system:

#### Priority 1: Always Load (Max 10)
- Previous day's location
- Core recurring people from last week
- Any person mentioned 10+ times in diary

#### Priority 2: Load When Mentioned (Max 20)
- People appearing in your pre-scan
- Places mentioned in entry
- Cultural references found

#### Priority 3: Skip Unless Critical
- Single-mention entities from months ago
- Generic places (e.g., "church", "shop")
- Well-known historical figures

## Practical Research Workflow

### Step 1: Context Budget
Your context budget per entry: **50 glossary entries maximum**

### Step 2: Smart Loading Commands
```bash
# Get list of people mentioned in last 7 days
grep -h "^\[#" src/_original/{book}/1874-03-{04..10}.md | sort | uniq -c | sort -rn

# Find if a specific person has existing glossary
ls src/_original/_glossary/ | grep -i "hamilton"
```

### Step 3: Research Process
1. **Quick scan** - 30 seconds to identify entities
2. **Load context** - Only relevant glossary entries
3. **Research gaps** - WebSearch for unknowns
4. **Create new** - Glossary entries as needed
5. **Tag entry** - Add all discovered entities

## When Processing Batches

### Identify Shared Context
Look for entries that share:
- Same location (Nice, Paris, etc.)
- Same social circle (3+ people)
- Same event/storyline

### Example Batch
```
Entries 1874-03-10 to 1874-03-14:
- All in Nice
- All mention Hamilton, Tolstoy, Promenade
- Load these 3 glossary entries ONCE for all 5 days
```

### Batch Commands
```bash
# Find common entities across date range
for date in 10 11 12 13 14; do
  echo "=== 1874-03-$date ==="
  grep "^\[#" src/_original/03/1874-03-$date.md | head -5
done
```

## Context Loading Checklist

- [ ] Pre-scanned entry for entities
- [ ] Checked previous location
- [ ] Listed entities needing glossary
- [ ] Counted context budget (under 50?)
- [ ] Loaded only relevant entries
- [ ] Created new entries on demand

## Red Flags 🚨

**You're loading too much context if:**
- Loading glossary takes over 30 seconds
- You see "context window exceeded" errors
- You're loading entries not mentioned in current text
- Your glossary count exceeds 50

## Emergency Context Reduction

If you hit context limits:
1. Drop all Priority 3 entries
2. Keep only people mentioned TODAY
3. Summarize long glossary entries to key facts
4. Process in smaller batches

## Measuring Success

Good context management shows:
- ✅ No context errors
- ✅ Fast processing (under 5 min/entry)
- ✅ All entities properly tagged
- ✅ Relevant glossary entries loaded
- ❌ Loading entries "just in case"
- ❌ Missing important context

## Remember

**Quality over Quantity**: Better to load 20 highly relevant glossary entries than 100 that might be useful.

**Create on Demand**: Don't pre-load entries hoping they'll appear. Create them when you encounter them.

**Batch Smart**: Group entries by shared context, not just by date.