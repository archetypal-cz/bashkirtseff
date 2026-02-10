I need your permission to write to files in the glossary directory. Could you approve the write permission? 

In the meantime, here's the summary of what needs to happen:

**Merge plan:**

1. **Target file** (`places/cities/ROME.md`) — update `last_updated` to `2026-02-10` and add the one unique fact from the source: Rome is also mentioned in carnet 086 (1879). The source was a bare stub with no real content beyond that.

2. **Delete source file** (`people/mentioned/ROME.md`) — it's a misclassified stub (typed "Person/Place" for a city). Zero diary entries reference this path, so deletion is safe with no broken links.

3. **No reference updates needed** — grep confirms no entries point to `people/mentioned/ROME.md`.
