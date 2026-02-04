# Glossary Auto-Deprecation Implementation Guide

## Overview
Implement automatic deprecation of unused glossary entries to maintain a lean, efficient glossary that doesn't overwhelm context windows.

## Deprecation Lifecycle

```
Active → Stale (180 days) → Archived (365 days) → Deleted (never - keep archive)
```

## Implementation Strategy

### 1. Metadata Tracking

Every glossary entry needs these fields:
```markdown
# Entity Name

**Category**: people/mentioned
**First Mention**: 1873-11-15
**Last Mention**: 1874-02-20
**Mention Count**: 3
**Status**: active|stale|archived
**Last Reviewed**: 2025-01-06
```

### 2. Deprecation Rules

```yaml
deprecation_rules:
  mark_stale:
    condition: "Last mention > 180 days ago"
    action: "Add status: stale"
    exception: "Category = people/core"

  archive:
    condition: "Last mention > 365 days ago"
    action: "Move to _archive/{category}/"
    exception: "Mention count > 50"

  quick_archive:
    condition: "Single mention AND > 90 days"
    action: "Move to _archive/single_mention/"
    exception: "Important historical figure"
```

### 3. Monthly Maintenance Script

```python
#!/usr/bin/env python3
# glossary_maintenance.py

import os
import yaml
import shutil
from datetime import datetime, timedelta
from pathlib import Path

def load_entry_metadata(filepath):
    """Extract metadata from glossary entry."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Extract metadata using regex or parsing
    metadata = {}

    # Parse **Last Mention**: YYYY-MM-DD
    last_mention_match = re.search(r'\*\*Last Mention\*\*: (\d{4}-\d{2}-\d{2})', content)
    if last_mention_match:
        metadata['last_mention'] = datetime.strptime(last_mention_match.group(1), '%Y-%m-%d')

    # Parse **Mention Count**: N
    mention_count_match = re.search(r'\*\*Mention Count\*\*: (\d+)', content)
    if mention_count_match:
        metadata['mention_count'] = int(mention_count_match.group(1))

    # Parse **Category**: path/to/category
    category_match = re.search(r'\*\*Category\*\*: ([\w/]+)', content)
    if category_match:
        metadata['category'] = category_match.group(1)

    return metadata

def check_deprecation_status(entry_path):
    """Determine if entry should be marked stale or archived."""
    metadata = load_entry_metadata(entry_path)

    if not metadata.get('last_mention'):
        return 'needs_review', 'No last mention date'

    days_since_mention = (datetime.now() - metadata['last_mention']).days
    mention_count = metadata.get('mention_count', 0)
    category = metadata.get('category', '')

    # Never deprecate core people
    if 'people/core' in category:
        return 'active', 'Core person - never deprecate'

    # Quick archive for single mentions
    if mention_count == 1 and days_since_mention > 90:
        return 'archive', f'Single mention {days_since_mention} days ago'

    # Standard deprecation timeline
    if days_since_mention > 365:
        return 'archive', f'Not mentioned in {days_since_mention} days'
    elif days_since_mention > 180:
        return 'stale', f'Not mentioned in {days_since_mention} days'

    return 'active', 'Recently mentioned'

def process_glossary_maintenance(glossary_dir='src/_original/_glossary'):
    """Run monthly maintenance on glossary."""

    report = {
        'processed': 0,
        'marked_stale': [],
        'archived': [],
        'errors': []
    }

    archive_dir = Path(glossary_dir) / '_archive'
    archive_dir.mkdir(exist_ok=True)

    # Process all entries
    for root, dirs, files in os.walk(glossary_dir):
        # Skip archive directory
        if '_archive' in root:
            continue

        for file in files:
            if file.endswith('.md') and not file.startswith('_'):
                filepath = Path(root) / file
                report['processed'] += 1

                try:
                    status, reason = check_deprecation_status(filepath)

                    if status == 'archive':
                        # Move to archive
                        category_path = Path(root).relative_to(glossary_dir)
                        archive_path = archive_dir / category_path / file
                        archive_path.parent.mkdir(parents=True, exist_ok=True)

                        shutil.move(str(filepath), str(archive_path))
                        report['archived'].append(f"{file}: {reason}")

                    elif status == 'stale':
                        # Mark as stale in file
                        mark_entry_stale(filepath)
                        report['marked_stale'].append(f"{file}: {reason}")

                except Exception as e:
                    report['errors'].append(f"{file}: {str(e)}")

    return report

def mark_entry_stale(filepath):
    """Add stale status to entry metadata."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Update or add status
    if '**Status**:' in content:
        content = re.sub(r'\*\*Status\*\*: \w+', '**Status**: stale', content)
    else:
        # Insert after Category line
        content = re.sub(
            r'(\*\*Category\*\*: [\w/]+)',
            r'\1\n**Status**: stale',
            content
        )

    # Add reviewed date
    today = datetime.now().strftime('%Y-%m-%d')
    if '**Last Reviewed**:' in content:
        content = re.sub(
            r'\*\*Last Reviewed\*\*: \d{4}-\d{2}-\d{2}',
            f'**Last Reviewed**: {today}',
            content
        )
    else:
        content = re.sub(
            r'(\*\*Status\*\*: \w+)',
            f'\\1\\n**Last Reviewed**: {today}',
            content
        )

    with open(filepath, 'w') as f:
        f.write(content)

def generate_maintenance_report(report):
    """Create markdown report of maintenance actions."""

    output = f"""# Glossary Maintenance Report - {datetime.now().strftime('%Y-%m-%d')}

## Summary
- **Total Entries Processed**: {report['processed']}
- **Marked Stale**: {len(report['marked_stale'])}
- **Archived**: {len(report['archived'])}
- **Errors**: {len(report['errors'])}

## Stale Entries ({len(report['marked_stale'])})
"""
    for entry in report['marked_stale']:
        output += f"- {entry}\n"

    output += f"\n## Archived Entries ({len(report['archived'])})\n"
    for entry in report['archived']:
        output += f"- {entry}\n"

    if report['errors']:
        output += f"\n## Errors ({len(report['errors'])})\n"
        for error in report['errors']:
            output += f"- ERROR: {error}\n"

    output += """
## Next Steps
1. Review stale entries for potential reactivation
2. Check archived entries before creating duplicates
3. Update mention counts for active entries
"""
    return output

if __name__ == '__main__':
    report = process_glossary_maintenance()
    report_content = generate_maintenance_report(report)

    # Save report
    report_path = f"memlog/glossary_maintenance_{datetime.now().strftime('%Y%m%d')}.md"
    with open(report_path, 'w') as f:
        f.write(report_content)

    print(f"Maintenance complete. Report saved to: {report_path}")
    print(f"Archived {len(report['archived'])} entries")
    print(f"Marked {len(report['marked_stale'])} entries as stale")
```

### 4. Update Research Workflow

#### Check for Stale Entries
```python
def should_load_entry(entry_path):
    """Determine if a glossary entry should be loaded."""
    metadata = load_entry_metadata(entry_path)

    # Skip archived entries
    if '_archive' in str(entry_path):
        return False, "Archived entry"

    # Skip stale entries unless directly mentioned
    if metadata.get('status') == 'stale':
        # Check if mentioned in current entry
        if not is_mentioned_in_entry(entry_name, current_entry):
            return False, "Stale entry not mentioned"

    # Load active entries based on priority
    category = metadata.get('category', '')
    if 'core' in category:
        return True, "Core entry - always load"

    return True, "Active entry"
```

#### Update Mention Counts
```python
def update_mention_count(entity_name, entry_date):
    """Update the mention count and last mention date."""
    glossary_path = find_glossary_entry(entity_name)

    if not glossary_path:
        return

    with open(glossary_path, 'r') as f:
        content = f.read()

    # Update mention count
    count_match = re.search(r'\*\*Mention Count\*\*: (\d+)', content)
    if count_match:
        old_count = int(count_match.group(1))
        new_count = old_count + 1
        content = content.replace(
            f'**Mention Count**: {old_count}',
            f'**Mention Count**: {new_count}'
        )
    else:
        # Add mention count
        content = re.sub(
            r'(\*\*Last Mention\*\*: [\d-]+)',
            f'\\1\\n**Mention Count**: 1',
            content
        )

    # Update last mention date
    content = re.sub(
        r'\*\*Last Mention\*\*: \d{4}-\d{2}-\d{2}',
        f'**Last Mention**: {entry_date}',
        content
    )

    with open(glossary_path, 'w') as f:
        f.write(content)
```

## Archive Structure

```
/src/_original/_glossary/_archive/
├── single_mention/          # One-time mentions
├── stale_regular/          # Regular mentions gone stale
├── people/
│   └── mentioned/          # Archived people
├── places/
│   └── travel/            # Old travel destinations
└── _archive_index.md       # Searchable index
```

## Manual Review Process

### Monthly Review Checklist
- [ ] Run maintenance script
- [ ] Review newly stale entries
- [ ] Check for reactivation candidates
- [ ] Verify core people still active
- [ ] Update categories if needed

### Reactivation Criteria
- Mentioned again after stale period
- Historical importance discovered
- Needed for context in later books
- Cross-referenced by new entries

## Benefits

1. **Smaller Context**: ~200 active entries vs 400+
2. **Faster Loading**: Skip stale/archived entries
3. **Better Relevance**: Focus on current narrative
4. **Clean Hierarchy**: Clear importance levels
5. **Historical Preserve**: Archive maintains full history

## Monitoring Deprecation

### Metrics to Track
```yaml
monthly_metrics:
  total_entries: 423
  active_entries: 198
  stale_entries: 67
  archived_entries: 158

  deprecation_rate: "15.7%"  # Entries marked stale
  archive_rate: "8.2%"       # Entries archived
  reactivation_rate: "2.1%"  # Stale entries reactivated
```

### Warning Signs
- Archive rate > 20% monthly (too aggressive)
- Reactivation rate > 5% (poor deprecation logic)
- Core entries marked stale (bug in logic)
- Missing recent mentions (tracking failure)

## Integration with Research Tools

### Quick Commands
```bash
# Find all stale entries
find src/_original/_glossary -name "*.md" -exec grep -l "Status**: stale" {} \;

# Count active vs archived
echo "Active: $(find src/_original/_glossary -name "*.md" | grep -v _archive | wc -l)"
echo "Archived: $(find src/_original/_glossary/_archive -name "*.md" | wc -l)"

# Find candidates for archiving
./scripts/find_archive_candidates.py --days=365
```

## Future Enhancements

1. **Auto-update mention counts** during research
2. **Reactivation alerts** when archived entry mentioned
3. **Category rebalancing** based on usage patterns
4. **Importance scoring** beyond just mention count
5. **Relationship preservation** in archive