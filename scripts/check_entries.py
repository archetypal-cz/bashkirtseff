import re
import os

# Read the raw carnet file
with open('01_carnet_raw.md', 'r', encoding='utf-8') as f:
    raw_lines = f.readlines()

# Find all date entries in raw file
date_pattern = r'^(Lundi < /dev/null | Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche),?\s+(\d+)\s+(janvier|février|mars|avril|mai)\s+1873'
dates_in_raw = []

for i, line in enumerate(raw_lines):
    match = re.match(date_pattern, line.strip())
    if match:
        dates_in_raw.append((i, line.strip(), match.groups()))

# Check April entries
april_entries = [(i, line, groups) for i, line, groups in dates_in_raw if groups[2] == 'avril']

print("April entries found in raw carnet:")
for i, line, groups in april_entries[:10]:  # First 10 April entries
    day_num = groups[1].zfill(2)
    filename = f"01/1873-04-{day_num}.md"
    
    # Find next entry to determine boundaries
    next_idx = None
    for j, (idx, _, _) in enumerate(dates_in_raw):
        if idx > i:
            next_idx = idx
            break
    
    if next_idx:
        content_lines = next_idx - i - 1
    else:
        content_lines = "unknown"
    
    exists = os.path.exists(filename)
    print(f"Line {i+1}: {line} - File exists: {exists} - Content lines: {content_lines}")
    
    if exists and next_idx:
        # Check if file contains key content from raw
        with open(filename, 'r', encoding='utf-8') as f:
            file_content = f.read()
        
        # Get a unique string from middle of entry
        mid_line_idx = i + (next_idx - i) // 2
        mid_line = raw_lines[mid_line_idx].strip()
        if len(mid_line) > 20:
            check_str = mid_line[:50]
            if check_str in file_content:
                print(f"  ✓ Contains middle content: {check_str[:30]}...")
            else:
                print(f"  ✗ Missing middle content: {check_str[:30]}...")
