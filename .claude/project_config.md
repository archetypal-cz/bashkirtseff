# Project Configuration

---
project: Marie Bashkirtseff Diary Translation
version: 1.0.0
created: 2025-12-06

## Workflow Settings

workflow:
  # How many entries between improvement analysis runs
  # Start with 3 (tight feedback), increase as system matures
  analysis_frequency: 3

  # Revision attempts before escalating to human
  # "context" = ED decides based on severity/confidence
  revision_max_attempts: context

  # Quality score below this triggers human escalation
  escalation_threshold: 0.6

  # Confidence below this on any flag triggers human question
  confidence_threshold: 0.65

## Quality Targets

quality:
  # Target first-pass approval rate (translator → editor)
  min_first_pass: 0.75

  # Minimum quality for conductor approval
  min_final_quality: 0.85

  # Target TranslationMemory utilization
  translation_memory_target: 0.8

## Model Allocation

models:
  executive_director: opus
  conductor: opus
  linguistic_annotator: opus
  researcher: sonnet
  translator: sonnet
  editor: sonnet

## Automation Settings

automation:
  # Researcher can create new glossary entries without approval
  auto_glossary_create: true

  # Translator can update TranslationMemory
  auto_tm_update: true

  # ED can draft prompt improvements (still requires human approval)
  prompt_drafts_enabled: true

## Human Approval Gates

human_gates:
  # These actions ALWAYS require human approval
  - prompt_changes           # Updates to skill files/prompts
  - book_completion          # End-of-book sign-off
  - escalated_issues         # Issues ED couldn't resolve
  - ambiguous_translations   # Flagged by LAN with low confidence
  - new_language_start       # Starting translation for new target language

## Target Languages

languages:
  primary: cz               # Czech - main translation target
  future:
    - en                    # English
    - de                    # German

## Book Status

books:
  "00":
    status: source_ready
    entries: ~100
    translation_cz: partial
  "01":
    status: source_ready
    entries: ~300
    translation_cz: partial
  "02":
    status: source_ready
    entries: ~400
    translation_cz: none
  "03":
    status: source_ready
    entries: ~350
    translation_cz: none
  "04":
    status: source_ready
    entries: ~380
    translation_cz: none
  "05":
    status: raw_only
    entries: unknown
  "15":
    status: source_ready
    entries: 434
    translation_cz: none
    notes: "Complete book, good for testing full pipeline"

---

## Usage

This configuration is read by the Executive Director at the start of each session.
Modify values as the system matures:
- Increase analysis_frequency as prompts stabilize
- Adjust quality thresholds based on reviewer feedback
- Update book status as processing completes
