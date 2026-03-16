# Experiment: Format Impact on Czech Redaction Quality

**Status**: Planning & harness build
**Started**: 2026-03-16
**Hypothesis**: The heavy markdown annotation format (`%%` comments, glossary links, timestamped notes) degrades Czech redaction quality by biasing models toward literal, non-idiomatic output.

## Overview

We test whether stripping annotation overhead from input improves Czech editing/redaction quality. We also compare CLI tools (which inject their own system prompts) against direct API calls where we control the full prompt.

## Test Material

**Gold standard**: Human-perfected Czech paragraphs (created by kerray):
- Carnet 000 intro entries (primary)
- Selected complex paragraphs from other carnets (TBD — IDs to be added)

**Source**: Existing Czech translations that are precise but too literal — these become the "draft" input for redaction.

## Independent Variables

### Dimension 1: Input Format

| ID | Format | Description |
|----|--------|-------------|
| `FULL` | Full workflow | All `%%` comments, glossary links, IDs, timestamps |
| `IDS_TEXT` | IDs + text | Paragraph IDs + Czech text only (no comments, no glossary) |
| `BARE` | Bare text | Just Czech text, no IDs, no annotations |
| `SIDE_BY_SIDE` | Side-by-side | French original block + Czech block (no interleaving) |
| `FEWSHOT` | Few-shot | 2-3 human-perfected triplets (FR / draft CZ / perfected CZ) before target |
| `FEWSHOT_BARE` | Few-shot bare | Same as FEWSHOT but bare text only |

### Dimension 2: Model × Channel

| ID | Model | Channel | Notes |
|----|-------|---------|-------|
| `claude-opus-cli` | Claude Opus 4.6 | Claude Code CLI | Has Claude Code system prompt |
| `claude-sonnet-cli` | Claude Sonnet 4.6 | Claude Code CLI | Has Claude Code system prompt |
| `gemini-pro-cli` | Gemini 2.5 Pro | Gemini CLI | Has Gemini CLI system prompt |
| `gemini3-pro-cli` | Gemini 3 Pro | Gemini CLI | Has Gemini CLI system prompt |
| `gpt41-cli` | GPT-4.1 | Codex CLI | Has Codex CLI system prompt |
| `claude-opus-api` | Claude Opus 4.6 | Windmill LiteLLM | Our prompt only |
| `claude-sonnet-api` | Claude Sonnet 4.6 | Windmill LiteLLM | Our prompt only |
| `gemini-pro-api` | Gemini 2.5 Pro | Windmill LiteLLM | Our prompt only |
| `gemini3-pro-api` | Gemini 3 Pro | Windmill LiteLLM | Our prompt only |
| `gpt41-api` | GPT-4.1 | Windmill LiteLLM (OpenRouter) | Our prompt only |
| `deepseek-v3-api` | DeepSeek V3 | Windmill LiteLLM | Our prompt only |

The CLI vs API comparison isolates the effect of default system prompts.

### Dimension 3: Prompt Variation

| ID | Prompt | Description |
|----|--------|-------------|
| `minimal` | Short instruction | "Improve this Czech translation for naturalness. Keep meaning intact." |
| `detailed` | Full redaction brief | Our current editor prompt with Czech style guide excerpt |
| `czech-native` | Czech-language prompt | Entire prompt in Czech, framing as native editing task |

## Evaluation

### Judge Models
- Claude Opus 4.6 (via Windmill API)
- Gemini 3 Pro (via Windmill API)
- Best ChatGPT (GPT-4.1 or o3, via Windmill/OpenRouter)

### Scoring Criteria (each 1-10)

1. **Naturalness** — Does it read like native Czech prose?
2. **Word order** — Czech-natural sentence structure, not French calques?
3. **Flow** — Literary rhythm, not choppy/mechanical?
4. **Accuracy** — Meaning preserved vs gold standard?
5. **Voice** — Sounds like Marie — youthful, dramatic, intelligent?

### Evaluation Protocol
- **Blind**: Judge sees gold standard + candidate + French original, but NOT which model/format produced it
- **Multi-judge**: All three judge models score every output
- **Eval prompt variation**: We also test 2-3 different evaluation prompts to check sensitivity

### Eval Prompt Variations

| ID | Description |
|----|-------------|
| `eval-structured` | Score each criterion separately with reasoning |
| `eval-holistic` | Overall quality assessment, then break into scores |
| `eval-comparative` | Rank candidate vs gold standard, then score |

## Execution Plan

### Phase 1: Harness (`src/scripts/experiments/`)

```
src/scripts/experiments/
├── README.md                 # Points to this doc
├── config.ts                 # Experiment configuration, model/format/prompt definitions
├── prepare-inputs.ts         # ParagraphRenderer → format variants
├── run-experiment.ts         # Orchestrate model calls (CLI + API)
├── evaluate.ts               # Blind judge evaluation
├── analyze.ts                # Aggregate scores → comparison tables
├── prompts/                  # All prompt templates
│   ├── redaction-minimal.md
│   ├── redaction-detailed.md
│   ├── redaction-czech.md
│   ├── eval-structured.md
│   ├── eval-holistic.md
│   └── eval-comparative.md
└── results/                  # Output storage
    └── run-YYYY-MM-DD-HH/
        ├── manifest.json     # Full config for reproducibility
        ├── inputs/           # Generated format variants
        ├── outputs/          # Raw model outputs
        └── scores.json       # Judge evaluations
```

### Phase 2: Prepare Gold Standard (kerray)

- Redact carnet 000 entries to perfection
- Select + perfect complex paragraphs from other carnets
- Provide paragraph IDs to experiment config

### Phase 3: First Run (small)

- ~3-5 entries × 3 formats × 3 models × 2 prompts = ~30-90 calls
- + evaluation: each output × 3 judges × 2 eval prompts = ~180-540 eval calls
- Most cheap (Gemini Flash, DeepSeek); some pricier (Opus, GPT-4.1)

### Phase 4: Analyze & Iterate

- Produce comparison matrices (format × model, format × prompt, CLI vs API)
- Identify which factors matter most
- Design follow-up experiments based on findings

## Key Comparisons

1. **Format effect**: Does `BARE` beat `FULL` across all models? (tests the core hypothesis)
2. **Few-shot effect**: Does `FEWSHOT_BARE` beat everything else? (tests example-driven quality)
3. **CLI vs API**: Do CLI system prompts help or hurt? (tests prompt contamination)
4. **Prompt language**: Does prompting in Czech improve Czech output?
5. **Model effect**: Which models handle Czech best regardless of format?
6. **Judge agreement**: Do all three judges agree on what's good?

## Test Entry Registry

Human-perfected entries go here as they're completed:

```
# Format: paragraph_range, source_file, gold_file, notes
# TBD — kerray will add after redacting
```

## Notes

- Existing translations are precise but too literal — good accuracy, poor naturalness
- We're testing redaction (improving existing CZ), not translation from scratch
- Translation quality experiments may follow later
- All results saved for re-evaluation with different criteria
