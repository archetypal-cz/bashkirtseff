---
name: glossary-tagger
description: Auto-tag diary entries with glossary references using alias matching + AI evaluation. Run on a carnet to scan, evaluate, and apply tags. Handles the full pipeline including team coordination.
allowed-tools: Agent, Task, Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, TaskGet
---

# Glossary Auto-Tagger — Team Pipeline

You orchestrate the glossary auto-tagging pipeline for Marie Bashkirtseff diary carnets. This is a 3-phase process: **scan** for alias matches, **evaluate** with parallel subagents, and **apply** accepted tags.

## What This Pipeline Does

Every glossary entry (3,200+) has **aliases** — text forms by which entities appear in the diary. For example, DUKE_OF_HAMILTON has aliases ["Duke of Hamilton", "Hamilton"]. The auto-tagger:

1. Scans diary paragraphs for alias matches (word-boundary regex)
2. Skips paragraphs already tagged with that glossary entry
3. Classifies matches by confidence (high/medium/low)
4. Sends medium/low matches to AI evaluators who read the diary text and glossary entries
5. Applies accepted tags as `%% [#DisplayName](../_glossary/path/ID.md) %%` comment lines

## Pipeline Commands

```bash
# Phase 1: Scan
just glossary-scan <carnet>                          # Find all candidates
just glossary-scan <carnet> --min-confidence high    # Only high confidence
just glossary-scan <carnet> --json                   # JSON for piping

# Phase 2: Batch + Evaluate + Collect
just glossary-batch <carnet>                         # Generate eval batches in /tmp/glossary-eval/<carnet>/
# ... launch evaluator subagents (see below) ...
just glossary-collect <carnet>                       # Merge results into accepted.json

# Phase 3: Apply
just glossary-apply <carnet> --accept /tmp/glossary-eval/<carnet>/accepted.json --dry-run
just glossary-apply <carnet> --accept /tmp/glossary-eval/<carnet>/accepted.json
```

## Running the Full Pipeline

When the user asks to auto-tag a carnet (e.g., `/glossary-tagger 068`):

### Step 1: Pre-flight — Clean Problematic Aliases

Before scanning, remove known false-positive aliases from glossary frontmatter. These were identified across multiple carnet runs and cause noise:

```bash
# Remove these aliases (they match common French words, not the entities):
just glossary-fm-remove-alias UN_BAL_DU_GRAND_MONDE "monde"
just glossary-fm-remove-alias BELLE_DE_JOUR "jour"
just glossary-fm-remove-alias LE_JOURNAL_D_UNE_FEMME "femme"
just glossary-fm-remove-alias CINQ_FEMMES "femmes"
just glossary-fm-remove-alias PLACE_D_ESPAGNE "place"
just glossary-fm-remove-alias THEATRE_ITALIEN_NICE "Théâtre"
just glossary-fm-remove-alias REVUE_NOUVELLE "nouvelle"
just glossary-fm-remove-alias GARE_DE_LYON "gare"
just glossary-fm-remove-alias GRANDE_DUCHESSE_MARIE "grande"
just glossary-fm-remove-alias GRANDE_DUCHESSE_CATHERINE "Grande"
just glossary-fm-remove-alias LEGION_D_HONNEUR "honneur"
just glossary-fm-remove-alias TIREUSE_DE_CARTES "cartes"
just glossary-fm-remove-alias LE_FILS_DE_LA_NUIT "nuit"
just glossary-fm-remove-alias RENARD_BLEU "bleu"
just glossary-fm-remove-alias TOLSTOY_FAMILY "family"
just glossary-fm-remove-alias SELF_DESCRIPTION "Description"
just glossary-fm-remove-alias ORDRE_DU_LION_ET_DU_SOLEIL "ordre"
just glossary-fm-remove-alias TRENTE_ET_QUARANTE "Trente"
just glossary-fm-remove-alias PALAIS_D_HOOGHWORST "Palais"
just glossary-fm-remove-alias TALON_ROUGE "rouge"
just glossary-fm-remove-alias PLACE_DU_PEUPLE "Place"
just glossary-fm-remove-alias MONT_DE_MARSAN "Mont"
just glossary-fm-remove-alias HOHENLOHE_PRINCES "princes"

# Round 2: discovered in carnets 065-070
just glossary-remove-alias CAFE_DE_PARIS "Paris"
just glossary-remove-alias ECHOS_DE_NICE "Nice"
just glossary-remove-alias RUE_DE_ROME "Rome"
just glossary-remove-alias COURSES_FLORENCE "Florence"
just glossary-remove-alias CHAMP_DE_MARS "Mars"
just glossary-remove-alias DON_GIOVANNI "Giovanni"
just glossary-remove-alias QUARTIER_LATIN "latin"
just glossary-remove-alias LE_CHALET "chalet"
just glossary-remove-alias PALAIS_DE_L_INDUSTRIE "Palais"
just glossary-remove-alias PORTE_SAINT_MARTIN "Porte"
just glossary-remove-alias PECHEUR_A_LA_LIGNE "ligne"
just glossary-remove-alias LA_RESERVE "Réserve"
```

Also note these glossary entries are **misclassified stubs** in `people/mentioned/` that should be in other categories. If they cause matches, the evaluators should reject them in favor of the correct entry:
- CERCLE, MEDITERRANEE → should be places/social or already covered by CERCLE_DE_LA_MEDITERRANEE
- SKATING → should be places/venues or culture/social_customs
- ITALIE, ESPAGNE, SUISSE, VIENNE, VICO → should be places/, not people/
- EMILE_D_AUDIFFRET → duplicate of AUDIFFRET in people/recurring

### Step 2: Scan

```bash
just glossary-batch <carnet>
```

This runs the scan and writes batch files to `/tmp/glossary-eval/<carnet>/`:
- `auto-accept-high.json` — high-confidence candidates (auto-accepted)
- `<carnet>-001.json` through `<carnet>-NNN.json` — medium and low batches grouped by entry file

### Step 3: Launch Evaluator Team

Group the batches into teams of ~4-6 batches each. Launch them as parallel background subagents.

**Medium-confidence batches** → General-purpose subagent. These are mostly proper nouns (people, places) that just need context verification.

**Low-confidence batches** → General-purpose subagent with more detailed prompt. These involve short/ambiguous aliases ("Dina", "Nice", "Rome", "Paul", "Dieu") that need careful disambiguation.

#### Medium Evaluator Prompt Template

```
You are a glossary tag evaluator for the Marie Bashkirtseff diary project (1858-1884 French diary).

## Task
Evaluate MEDIUM-confidence glossary tag candidates. For each candidate, decide ACCEPT or REJECT.

## Batches to evaluate
Process these batch files in `/tmp/glossary-eval/<CARNET>/`:
- <BATCH_ID>.json (<N> candidates, <ENTRY_FILE>)
- ... (list all batches in this group)

## Method
For each batch file:
1. Read the batch JSON to see the candidates
2. Read the diary entry file (e.g., `content/_original/<CARNET>/<DATE>.md`) to understand context
3. If unsure about a glossary entry, look it up: `just glossary-fm-get <GLOSSARY_ID>` or read the file directly
4. Evaluate each candidate

## Decision Rules
- **ACCEPT** if the text genuinely references the glossary entity
- **REJECT** if it's a false positive:
  - Generic French word matching a specific glossary entry (e.g., "monde" for UN_BAL_DU_GRAND_MONDE, "femme" for LE_JOURNAL_D_UNE_FEMME)
  - Wrong entity: a stub/duplicate when a better glossary entry exists (e.g., CERCLE stub vs CERCLE_DE_LA_MEDITERRANEE)
  - Match in a comment (RSR/LAN) rather than in diary text
  - Compound name only partially matching (e.g., VICTOR matching "Victor-Emmanuel" — use VICTOR_EMMANUEL instead)
- For people's names (Broussais, Pelikan, Larderei, etc.): usually ACCEPT — names are unambiguous
- For "Maman": ACCEPT — it's Marie's mother
- For known misclassified stubs in people/mentioned/ (CERCLE, MEDITERRANEE, SKATING, ITALIE, ESPAGNE, etc.): REJECT unless the entity is genuinely about a person
- For efficiency: once you verify a recurring name (e.g., Larderei appears 70x), batch-accept all occurrences

## Output
For EACH batch, write a result file: `/tmp/glossary-eval/<CARNET>/<batchId>-result.json`
{
  "batchId": "<BATCH_ID>",
  "decisions": [
    { "paraId": "...", "glossaryId": "...", "decision": "accept|reject", "reason": "brief reason" }
  ]
}

Process all batches and write all result files.
```

#### Low Evaluator Prompt Template

```
You are a CAREFUL glossary tag evaluator for the Marie Bashkirtseff diary project (1858-1884 French diary). You're evaluating LOW-confidence candidates — short or ambiguous aliases that need extra scrutiny.

## Batches to evaluate
Process these batch files in `/tmp/glossary-eval/<CARNET>/`:
- <BATCH_ID>.json (<N> candidates, <ENTRY_FILE>)
- ... (list all batches in this group)

## Method — Be Thorough
For each batch:
1. Read the batch JSON
2. Read the FULL diary entry file to understand context
3. For EACH candidate, look up the glossary entry: `just glossary-fm-get <ID>` AND read the glossary file to understand what it describes
4. Consider surrounding paragraphs for context if needed

## Common Low-Confidence Aliases and How to Handle Them
- **"Dina"** → Marie's cousin Dina. Distinctive name — usually ACCEPT if the text is about a person named Dina
- **"Nice"** → The city of Nice (case-sensitive match). Marie lived there. ACCEPT when clearly the city
- **"Rome"** → The city. ACCEPT when clearly about the city (even "la campagne de Rome" — it's about the area near Rome)
- **"Paul"** → Could be Marie's brother Paul, or Paul de Cassagnac, or Paul Antonelli. Check context carefully — "mon frère Paul" = brother, "M. Paul de Cassagnac" = the journalist
- **"Jean"** → Multiple possible people. Check if it's a person name or part of a place name ("Saint-Jean de Latran")
- **"Dieu"** → REJECT if it's an exclamation ("mon Dieu!", "bon Dieu!"). ACCEPT only if genuinely discussing God/religion as a topic
- **"Marie"** → REJECT — it's the diarist herself, not a glossary reference. Exception: if the text discusses "Marie" as a third person
- **"Alexandre"** → Check if it's Marie's brother or Alexander the Great or someone else
- **"Peinture"** → REJECT if just generic "painting". Too common a word
- **"Promenade"** → REJECT if generic "walk". ACCEPT only if referring to a specific promenade (e.g., Promenade des Anglais)
- **"Aida"** → Verdi's opera. Usually ACCEPT
- **"BELLE_DE_JOUR"** matching "jour" → REJECT (false positive — "jour" just means "day")
- **"BELLE_DE_JOUR"** matching "Belle-de-jour" → ACCEPT if referring to the person by that nickname

## Output
For EACH batch, write a result file: `/tmp/glossary-eval/<CARNET>/<batchId>-result.json`
{
  "batchId": "<BATCH_ID>",
  "decisions": [
    { "paraId": "...", "glossaryId": "...", "decision": "accept|reject", "reason": "detailed reason" }
  ]
}

Process all batches and write all result files.
```

### Step 4: Monitor and Collect

Wait for all evaluator agents to complete. Check progress:

```bash
ls /tmp/glossary-eval/<carnet>/*-result.json | wc -l  # Count completed
```

Once all are done:

```bash
just glossary-collect <carnet>
```

This merges all results (auto-accepted high + evaluated medium/low) into `/tmp/glossary-eval/<carnet>/accepted.json`.

### Step 5: Apply

```bash
# Preview first
just glossary-apply <carnet> --accept /tmp/glossary-eval/<carnet>/accepted.json --dry-run

# Then apply
just glossary-apply <carnet> --accept /tmp/glossary-eval/<carnet>/accepted.json
```

### Step 6: Post-Run Analysis

After applying, review the rejection patterns. If new false-positive aliases emerge (rejected 2+ times across different paragraphs), add them to the pre-flight cleanup list in this skill file.

Also check for glossary data quality issues flagged by evaluators:
- Entries miscategorized (e.g., places filed under `people/mentioned/`)
- Duplicate/stub entries that should be merged
- Missing aliases for entities that appear frequently

## Grouping Strategy

For efficient parallel evaluation:
- **Target ~50-100 candidates per subagent** for medium batches
- **Target ~20-30 candidates per subagent** for low batches (they need more reads)
- **Max 4-5 medium subagents + 2-3 low subagents** per carnet
- Large entry files (100+ candidates) should get their own subagent

## Expected Results

Based on carnet 068 (the first run):
- **717 raw candidates** from 3,205 glossary entries
- **80% accept rate** (572 accepted, 145 rejected)
- **567 tags applied** across 19 entry files
- Top rejections: generic French words (monde, jour, femme, place, Dieu)
- Processing time: ~10 minutes with 7 parallel subagents

## Confidence Classification

The scanner classifies matches into three confidence levels:

| Level | Criteria | Action |
|-------|----------|--------|
| **High** | Multi-word alias ≥10 chars (e.g., "Cercle de la Méditerranée", "Paul de Cassagnac") | Auto-accept |
| **Medium** | Single words 5-7 chars, or shorter multi-word | Evaluate with subagent |
| **Low** | ≤4 char aliases, or in AMBIGUOUS_ALIASES set (salon, portrait, etc.) | Evaluate carefully with subagent |

## Tag Format

Tags are inserted as comment lines after the paragraph ID and any existing tags:

```markdown
%% 068.0008 %%
%% [#Kernberger](../_glossary/people/writers/KATHERINE_KERNBERGER.md) %%
%% [#Mortality](../_glossary/culture/themes/MORTALITY.md) %%
%% [#Dina](../_glossary/people/core/DINA.md) %%           ← NEW auto-tag
%% [#Broussais](../_glossary/people/mentioned/BROUSSAIS.md) %%  ← NEW auto-tag
%% 2026-02-02T12:20:00 LAN: "Cercle de la Méditerranée" - exclusive social club... %%
Je respire, et je vais me promener à pied avec ma tante, Dina et Bihovetz.
```
