# Glossary Migration Plan - 1046 Entries

## Current Situation
- **Total entries**: 1046 (much more than estimated 400+)
- **Current structure**: Flat directory
- **Challenge**: Need to categorize, move files, and update all references

## Migration Strategy

### Phase 1: Analysis & Categorization

We need to analyze all 1046 entries. This is perfect for a haiku agent due to volume.

#### Step 1: Quick Scan Script
```python
# scan_glossary.py
import os
import re
from collections import defaultdict

def quick_categorize(filename):
    """Quick categorization based on filename patterns."""
    name = filename.replace('.md', '')

    # Titles indicate aristocracy
    if any(title in name for title in ['Duke', 'Duchess', 'Prince', 'Princess', 'Baron', 'Count', 'Comtesse', 'Marquis']):
        return 'society/aristocracy'

    # Places
    if any(place in name for place in ['Hotel', 'Villa', 'Rue', 'Avenue', 'Place', 'Boulevard']):
        return 'places/residences'

    # Multiple words starting with caps = likely person name
    if '_' in name and name.replace('_', ' ').istitle():
        return 'people/mentioned'  # Default, will refine later

    # Single word = could be anything
    return 'unknown'

# Scan all entries
categories = defaultdict(list)
for file in os.listdir('src/_original/_glossary'):
    if file.endswith('.md') and not file.startswith('_'):
        cat = quick_categorize(file)
        categories[cat].append(file)

# Report
for cat, files in sorted(categories.items()):
    print(f"{cat}: {len(files)}")
```

#### Step 2: Haiku Agent Task for Deep Analysis

```markdown
Task: Analyze and categorize 1046 glossary entries for the Marie Bashkirtseff diary project.

For each batch of 50 entries:
1. Read the content of each glossary file
2. Determine the correct category based on:
   - Entity type (person, place, cultural reference)
   - Relationship to Marie (core, recurring, mentioned)
   - Mention count if available
3. Output a CSV with: filename, category, mention_count, confidence

Categories to use:
- people/core (family, major romantic interests with 50+ mentions)
- people/recurring (10+ mentions, regular social circle)
- people/mentioned (1-9 mentions)
- places/residences (where Marie lives/stays)
- places/social (venues, promenades, theaters)
- places/travel (cities, regions)
- culture/literature (books, authors)
- culture/theater (plays, operas, performers)
- culture/music (songs, composers)
- culture/history (historical figures, events)
- society/aristocracy (titled nobility)
- society/politics (political figures, movements)
- society/artists (painters, sculptors, musicians)

Output format:
```csv
filename,category,mention_count,confidence,notes
Duke_of_Hamilton.md,people/core,127,0.95,Major romantic interest
Nice.md,places/travel,500+,0.99,Primary residence city
```
```

### Phase 2: Migration Execution

#### Step 1: Create Directory Structure
```bash
cd src/_original/_glossary
mkdir -p people/{core,recurring,mentioned}
mkdir -p places/{residences,social,travel}
mkdir -p culture/{literature,theater,music,history}
mkdir -p society/{aristocracy,politics,artists}
mkdir -p _archive/{stale,single_mention}
```

#### Step 2: Move Files Script
```python
# migrate_glossary.py
import csv
import shutil
import os

def migrate_entries(categorization_csv):
    """Move entries based on categorization results."""

    moved = 0
    errors = []

    with open(categorization_csv, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            src = f"src/_original/_glossary/{row['filename']}"
            dst = f"src/_original/_glossary/{row['category']}/{row['filename']}"

            try:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.move(src, dst)
                moved += 1
            except Exception as e:
                errors.append(f"{row['filename']}: {e}")

    return moved, errors
```

### Phase 3: Update References

#### The Reference Update Challenge
After moving files, we need to update ALL references in:
- Daily entry files (all books)
- Summary files
- Other glossary entries (related entries)

#### Step 1: Find All References
```bash
# Find all glossary references in the project
grep -r "\[#.*\](.*/_glossary/.*\.md)" src/_original/ > all_references.txt

# Count unique references
grep -o "\[#.*\](.*/_glossary/.*\.md)" src/_original/ -r | sort | uniq | wc -l
```

#### Step 2: Smart Reference Update Script
```python
# update_references.py
import re
import os

def update_glossary_refs(file_path, ref_mapping):
    """Update glossary references in a file."""

    with open(file_path, 'r') as f:
        content = f.read()

    updated = False

    # Pattern: [#Name](../_glossary/Name.md)
    def replace_ref(match):
        nonlocal updated
        full_match = match.group(0)
        name = match.group(1)
        old_path = match.group(2)

        if name + '.md' in ref_mapping:
            new_cat = ref_mapping[name + '.md']
            new_path = old_path.replace(
                f"_glossary/{name}.md",
                f"_glossary/{new_cat}/{name}.md"
            )
            updated = True
            return f"[#{name}]({new_path})"

        return full_match

    # Update all references
    pattern = r'\[#([^\]]+)\]\(([^)]*/_glossary/[^)]+\.md)\)'
    new_content = re.sub(pattern, replace_ref, content)

    if updated:
        with open(file_path, 'w') as f:
            f.write(new_content)

    return updated

def update_all_references(categorization_csv):
    """Update all glossary references project-wide."""

    # Build mapping
    ref_mapping = {}
    with open(categorization_csv, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ref_mapping[row['filename']] = row['category']

    # Update all markdown files
    updated_files = 0
    for root, dirs, files in os.walk('src/_original'):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                if update_glossary_refs(file_path, ref_mapping):
                    updated_files += 1

    return updated_files
```

## Implementation Timeline

### Day 1: Analysis (Haiku Agent)
1. Launch haiku agent to categorize all 1046 entries
2. Review categorization results
3. Adjust any obvious errors

### Day 2: Migration
1. Run migration script
2. Verify files moved correctly
3. Create backup of reference updates

### Day 3: Reference Updates
1. Update all references using script
2. Test compilation
3. Verify no broken links

## Risk Mitigation

1. **Backup Everything**
   ```bash
   tar -czf glossary_backup_$(date +%Y%m%d).tar.gz src/_original/_glossary/
   tar -czf entries_backup_$(date +%Y%m%d).tar.gz src/_original/[0-9]*/
   ```

2. **Test on Subset**
   - Test migration on 10 entries first
   - Verify reference updates work
   - Check compilation still works

3. **Rollback Plan**
   - Keep original structure until verified
   - Script to reverse migration if needed

## Validation Checklist

After migration:
- [ ] All 1046 entries categorized
- [ ] Files moved to new locations
- [ ] Zero files left in root glossary
- [ ] All references updated
- [ ] No broken links in entries
- [ ] Compilation still works
- [ ] Context loading uses categories

## Alternative: Symlink Approach

If updating references is too risky, we could:
1. Keep files in original location
2. Create categorized symlinks
3. Gradually migrate references

```bash
# Create symlinks instead of moving
ln -s ../Duke_of_Hamilton.md people/core/Duke_of_Hamilton.md
```

But this adds complexity and doesn't solve the context loading issue as cleanly.