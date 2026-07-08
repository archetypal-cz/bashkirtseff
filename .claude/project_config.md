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

# Principle: Opus for understanding, knowledge, and writing.
# Sonnet for administrative and evaluation tasks.
models:
  # Source preparation pipeline (COMPLETE for all 107 carnets — gap-filling only)
  executive_director: opus       # deep understanding needed to evaluate all roles
  researcher: opus               # knowledge, research, footnote writing
  linguistic_annotator: opus     # deep language understanding, period expertise
  source_evaluator: sonnet       # checklist-based quality verification

  # Translation pipeline (ACTIVE)
  translator: opus               # proven config since Feb 2026 runs
  editor: opus                   # RED — spawn as general-purpose subagent type (Edit access)
  conductor: opus                # CON — spawn as general-purpose subagent type (Edit access)

## Agent Teams Settings

agent_teams:
  enabled: true
  # Current active pipeline
  active_pipeline: translation

  # Source preparation pipeline: RSR → LAN → EVAL (complete; gap-filling only)
  source_preparation:
    team_name_pattern: "source-{carnet}"
    teammates:
      - role: researcher
        model: opus
        skill: .claude/skills/researcher/SKILL.md
      - role: linguistic-annotator
        model: opus
        skill: .claude/skills/linguistic-annotator/SKILL.md
    evaluation:
      model: sonnet    # ED or subagent runs quality checks
      method: checklist  # systematic verification, not literary judgment

  # Translation pipeline (ACTIVE)
  translation:
    team_name_pattern: "{lang}-{carnet}"
    teammates:
      - role: translator
      - role: editor       # RED — general-purpose subagent type
      - role: conductor    # CON — general-purpose subagent type
    opus_review: subagent  # OPS dispatched as a subagent, not a teammate

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
  active:
    - cz                    # Czech — full corpus translated; quality/fluidity waves ongoing
    - uk                    # Ukrainian — 100% conductor-approved (3,733/3,733); corrections/TM only
    - en                    # English — partial
    - fr                    # French modern edition

## Carnet Status

# Per-carnet status is tracked on disk, not here — this section previously held
# a hand-maintained snapshot that went stale. Use:
#   just status                    # overall status
#   just status {lang} {carnet}    # specific carnet
# and content/{lang}/PROGRESS.md for language-level progress.

---

## Usage

This configuration is read by the Executive Director at the start of each session.
Modify values as the system matures:
- Increase analysis_frequency as prompts stabilize
- Adjust quality thresholds based on reviewer feedback
- Update book status as processing completes
