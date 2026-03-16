# Format Impact Experiment

See [/EXPERIMENT-FORMAT-IMPACT.md](/EXPERIMENT-FORMAT-IMPACT.md) for the full plan.

## Quick Start

```bash
# 1. Prepare inputs (generates format variants from diary entries)
npx tsx src/scripts/experiments/prepare-inputs.ts

# 2. Run experiment (calls models via CLI and API)
npx tsx src/scripts/experiments/run-experiment.ts results/run-YYYY-MM-DD/ [--dry-run]

# 3. Evaluate outputs (blind judge scoring)
npx tsx src/scripts/experiments/evaluate.ts results/run-YYYY-MM-DD/ [--dry-run]

# 4. Analyze results (comparison tables)
npx tsx src/scripts/experiments/analyze.ts results/run-YYYY-MM-DD/
```

## Filtering

All scripts accept filters to run subsets:

```bash
# Only specific models
npx tsx run-experiment.ts <dir> --models claude-opus-cli,gemini3-pro-api

# Only specific formats
npx tsx run-experiment.ts <dir> --formats BARE,FEWSHOT_BARE

# Only specific prompts
npx tsx run-experiment.ts <dir> --prompts minimal,czech-native
```

## Environment Variables

- `LITELLM_PROXY_URL` — LiteLLM proxy URL (default: `http://litellm:4000`)
- `LITELLM_API_KEY` — API key for the proxy (if required)

## Files

- `config.ts` — All configuration: formats, models, prompts, test entries
- `prepare-inputs.ts` — Generate format variants using ParagraphRenderer
- `run-experiment.ts` — Call models via CLI and API
- `evaluate.ts` — Blind judge evaluation
- `analyze.ts` — Aggregate scores into comparison tables
- `prompts/` — Redaction and evaluation prompt templates
- `results/` — Output storage (gitignored)
