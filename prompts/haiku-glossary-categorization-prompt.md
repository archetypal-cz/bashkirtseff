# Haiku Agent Prompt: Categorize 1046 Glossary Entries

## Task Overview
Analyze and categorize all glossary entries for the Marie Bashkirtseff diary translation project. Process in batches of 50 entries.

## Instructions

### For Each Entry:
1. Read the glossary file content
2. Extract key information:
   - Entity type (person, place, cultural reference)
   - Mention count (if stated)
   - Relationship to Marie
   - Historical significance
3. Assign appropriate category
4. Rate confidence (0.0-1.0)

### Category Definitions

#### People Categories
- **people/core**:
  - Marie's immediate family
  - Major romantic interests (50+ mentions)
  - Daily companions
  - Examples: Duke_of_Hamilton, Mme_Bashkirtseff, Dina

- **people/recurring**:
  - Regular social acquaintances (10-49 mentions)
  - Frequent visitors
  - Regular correspondents
  - Examples: Tolstoy_Paul, various society friends

- **people/mentioned**:
  - Occasional mentions (1-9)
  - Ball attendees met once
  - Passing acquaintances

#### Places Categories
- **places/residences**:
  - Where Marie lives or stays
  - Hotels, villas, apartments
  - Examples: Villa_Baquis, Hotel_de_la_Grande_Bretagne

- **places/social**:
  - Social venues (casinos, theaters, promenades)
  - Churches, parks
  - Examples: Promenade_des_Anglais, Opera_de_Nice

- **places/travel**:
  - Cities and regions
  - Countries
  - Examples: Nice, Paris, Rome, Russia

#### Culture Categories
- **culture/literature**:
  - Authors, books, literary movements
  - Examples: Victor_Hugo, Alexandre_Dumas

- **culture/theater**:
  - Plays, operas, performances
  - Actors, singers
  - Examples: La_Traviata, Sarah_Bernhardt

- **culture/music**:
  - Composers, musicians, songs
  - Musical terms
  - Examples: Bach, Chopin

- **culture/history**:
  - Historical figures
  - Past events
  - Examples: Napoleon, Revolution_1789

#### Society Categories
- **society/aristocracy**:
  - Anyone with a title (Duke, Baron, Count, etc.)
  - Court members
  - Examples: Prince_Napoleon, Baron_de_Rothschild

- **society/politics**:
  - Politicians, government officials
  - Political movements
  - Examples: Ministers, political parties

- **society/artists**:
  - Painters, sculptors
  - Art teachers, critics
  - Examples: Tony_Robert_Fleury, Carolus_Duran

### Output Format

For each batch of 50, create a CSV block:
```csv
filename,category,mention_count,confidence,notes
Duke_of_Hamilton.md,people/core,127,0.95,"Major romantic interest throughout 1873-1874"
Nice.md,places/travel,500+,0.99,"Primary residence city"
Mme_de_Raoulx.md,people/recurring,23,0.85,"Regular at Nice social events"
Victor_Hugo.md,culture/literature,8,0.90,"Author Marie admires"
Baron_de_Rothschild.md,society/aristocracy,5,0.95,"Met at Paris events"
```

### Decision Guidelines

1. **When uncertain between recurring/mentioned**:
   - Check mention count if available
   - Default to "mentioned" if < 10

2. **For people with titles**:
   - Primary category: society/aristocracy
   - Can note if also core/recurring in notes

3. **For places**:
   - Residences: where Marie sleeps
   - Social: where Marie socializes
   - Travel: cities/regions she visits

4. **Ambiguous entries**:
   - Mark confidence < 0.70
   - Add clarifying note

### Batch Processing

1. Process entries alphabetically
2. Create summary after each 50:
   ```
   Batch 1 (A-Be): 50 entries
   - People: 35 (core: 2, recurring: 8, mentioned: 25)
   - Places: 10
   - Culture: 3
   - Society: 2
   ```

### Quality Checks

Before marking an entry:
- Verify category matches definition
- Check if mention count aligns with category
- Ensure confidence reflects certainty

### Start Processing

Begin with entries A-Al (first 50).

Report format:
```markdown
## Batch 1: A-Al (50 entries)

### Statistics
- People: 35
- Places: 10
- Culture: 3
- Society: 2

### Categorization
```csv
[CSV data here]
```

### Notes
- Abramovitch appears to be recurring (15+ mentions)
- Several Baron/Duke entries need aristocracy category
- Alexandre_Dumas clearly literature
```