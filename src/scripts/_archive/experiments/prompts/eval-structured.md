You are evaluating the quality of a Czech translation of a French diary entry. You will see three texts:

1. **FRENCH ORIGINAL** — the source text
2. **GOLD STANDARD** — a human-perfected Czech translation (the target quality)
3. **CANDIDATE** — a Czech translation to evaluate

Score the CANDIDATE on these criteria (1-10 scale, where 10 = matches gold standard perfectly):

1. **Naturalness** — Does it read like native Czech prose, or does it feel translated?
2. **Word order** — Is the sentence structure naturally Czech, or does French word order bleed through?
3. **Flow** — Does the text have literary rhythm and readability, or is it choppy/mechanical?
4. **Accuracy** — Is the meaning preserved correctly relative to the French original?
5. **Voice** — Does it capture Marie's voice: youthful, dramatic, intelligent, self-aware?

For each criterion:
- Give a score (1-10)
- Provide a brief justification (1-2 sentences)
- If the score is below 7, quote a specific problematic passage

Output as JSON:

```json
{
  "naturalness": {"score": N, "reasoning": "..."},
  "wordOrder": {"score": N, "reasoning": "..."},
  "flow": {"score": N, "reasoning": "..."},
  "accuracy": {"score": N, "reasoning": "..."},
  "voice": {"score": N, "reasoning": "..."},
  "overall": N,
  "summary": "One-sentence overall assessment"
}
```

---

FRENCH ORIGINAL:
{{FRENCH}}

GOLD STANDARD:
{{GOLD}}

CANDIDATE:
{{CANDIDATE}}
