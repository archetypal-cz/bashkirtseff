import re
import os

def check_entry_completeness(raw_file, entry_dir, month_name, month_num):
    """Check if all entries for a month are complete"""
    
    with open(raw_file, 'r', encoding='utf-8') as f:
        raw_lines = f.readlines()
    
    # Find all date entries
    date_pattern = rf'^(Lundi < /dev/null | Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche),?\s+(\d+)\s+{month_name}\s+1873'
    dates_found = []
    
    for i, line in enumerate(raw_lines):
        match = re.match(date_pattern, line.strip())
        if match:
            dates_found.append((i, line.strip(), match.groups()))
    
    incomplete_entries = []
    
    for j, (start_idx, date_line, groups) in enumerate(dates_found):
        day_num = groups[1].zfill(2)
        filename = f"{entry_dir}/1873-{month_num}-{day_num}.md"
        
        # Find next entry to determine boundaries
        if j + 1 < len(dates_found):
            end_idx = dates_found[j + 1][0]
        else:
            # For last entry, search for next month or end marker
            end_idx = None
            for k in range(start_idx + 1, min(start_idx + 200, len(raw_lines))):
                if re.match(r'^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)', raw_lines[k]):
                    end_idx = k
                    break
            if not end_idx:
                end_idx = min(start_idx + 100, len(raw_lines))
        
        # Extract full entry text
        raw_entry = ''.join(raw_lines[start_idx:end_idx]).strip()
        
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                file_content = f.read()
            
            # Check if file contains last significant line before next entry
            last_content_idx = end_idx - 1
            while last_content_idx > start_idx and not raw_lines[last_content_idx].strip():
                last_content_idx -= 1
            
            if last_content_idx > start_idx:
                last_line = raw_lines[last_content_idx].strip()
                if len(last_line) > 10 and last_line not in file_content:
                    print(f"❌ {filename}: Missing ending content: {last_line[:50]}...")
                    incomplete_entries.append((filename, start_idx, end_idx))
                else:
                    print(f"✓ {filename}: Complete")
        else:
            print(f"⚠️  {filename}: File doesn't exist")
            incomplete_entries.append((filename, start_idx, end_idx))
    
    return incomplete_entries

# Check April entries
print("=== Checking April 1873 entries ===")
april_incomplete = check_entry_completeness('01_carnet_raw.md', '01', 'avril', '04')

# Check May entries  
print("\n=== Checking May 1873 entries ===")
may_incomplete = check_entry_completeness('01_carnet_raw.md', '01', 'mai', '05')

if april_incomplete or may_incomplete:
    print(f"\nFound {len(april_incomplete)} incomplete April entries and {len(may_incomplete)} incomplete May entries")
