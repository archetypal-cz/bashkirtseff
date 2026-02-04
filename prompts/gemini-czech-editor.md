# Gemini Czech Editor #2 Prompt

Use this prompt with `vibe-tools` to run a secondary Czech language review before publishing translations.

## Usage

```bash
vibe-tools ask "$(cat prompts/gemini-czech-editor-prompt.txt)" --provider gemini --model gemini-2.5-pro
```

Or for a specific file:

```bash
# Extract Czech text from file, then run review
vibe-tools ask "Jsi český jazykový editor... [text here]" --provider gemini --model gemini-2.5-pro
```

## When to Use

- **Final step before publishing** - after all RED/CON reviews are complete
- **Quality gate** - catches grammar, declension, and naturalness issues Claude may miss
- **Cross-model validation** - different AI perspective on translation quality

## Prompt Template

See `gemini-czech-editor-prompt.txt` in this directory.

## Comment Format

When applying Gemini's corrections, use:

```markdown
%%YYYY-MM-DDThh:mm:ss GEM: [description of fix]%%
```

## Typical Issues Caught

1. **Typos** - oblasst → oblast
2. **Unnatural phrasing** - "rozkládám se" (decompose) → "odhaluji se" (reveal myself)
3. **Galicisms** - double negatives that work in French but are awkward in Czech
4. **Word order** - Czech has flexible word order but some patterns are more natural
5. **Register** - ensuring 19th century literary Czech, not modern colloquial
