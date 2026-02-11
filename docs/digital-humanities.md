# Digital Humanities & The Bashkirtseff Project

## What Is Digital Humanities?

Picture this: it's 1946, and a Jesuit priest named Roberto Busa walks into IBM with an audacious request. He wants to create a concordance of every word Thomas Aquinas ever wrote—13 million of them. By hand, this would take several lifetimes. With computers? Merely thirty years.

That moment—a scholar saying "surely machines can help us understand human thought better"—is the spark that became **digital humanities**.

At its core, DH is simply this: using computational tools to ask humanistic questions. Not replacing the scholar with the algorithm, but giving the scholar superpowers. It's the marriage of close reading (what did Marie mean by _that_ sentence?) with distant reading (what patterns emerge across 3,300 diary entries?).

### The Evolution: From Punch Cards to AI Agents

The field has had several identity crises:

- **1960s-80s**: "Humanities Computing" — mostly concordances and databases
- **1990s**: [Text Encoding Initiative (TEI)](https://en.wikipedia.org/wiki/Text_Encoding_Initiative) — finally agreeing on how to mark up texts
- **2000s**: Rebranded as "Digital Humanities" — now with visualizations and archives
- **2010s**: Topic modeling, network analysis, massive digitization projects
- **2020s**: AI-assisted scholarship, multi-agent workflows, born-digital archives

What began as counting words has evolved into creating interactive archives, visualizing social networks of historical figures, and—yes—orchestrating teams of AI agents to translate and annotate 19th-century diaries.

### The Toolkit

For those new to DH, the [Digital Humanities Toolkit](https://github.com/pacian/Digital-Humanities-Toolkit) is a treasure chest. Common tools include:

| Domain               | Tools                      | What For                                            |
| -------------------- | -------------------------- | --------------------------------------------------- |
| **Text Analysis**    | Voyant, NLTK, Stanford NER | Finding patterns, extracting entities               |
| **Topic Modeling**   | MALLET                     | "What is this corpus _about_?"                      |
| **Network Analysis** | Gephi, Cytoscape           | Mapping relationships between people, places, ideas |
| **Mapping**          | ArcGIS, CartoDB            | Spatial humanities—where things happened            |
| **Visualization**    | D3.js, RAW, Tableau        | Making data tell stories                            |

---

## The Bashkirtseff Project as Digital Humanities

### What We're Attempting

- **107 carnets** (notebooks) containing ~3,300 diary entries (1873-1884)
- **Linked glossary**: People, places, cultural references—growing daily
- **Rich annotation layer**: Named entities, historical context, linguistic notes
- **Parallel translations**: Possibility of Czech, Ukrainian, English, modern French and more, all aligned at paragraph level, with AI-provided translation workflow that mostly needs only human final editing
- **Multi-agent workflow**: Best current LLMs and AI agents (Claude Code with Opus 4.6, Gemini 3 Pro) doing most of the work
- **Open web access**: Simple, non-tracking web app at bashkirtseff.org, with source code fully open on GitHub, with offline reading support in the future

### The Approach

The approach is hobbyist tinkering - scrappy and experimental. AI agents do most of the heavy lifting—research, annotation, draft translation, coding, project administration. Humans provide intent, prompts, and course corrections, but this isn't a carefully reviewed scholarly pipeline. It's closer to "let's see if we can get a working first draft up" and iterate from there as resources allow and interest grows.

Every contribution should documented in the source files—not for careful oversight, but so we can see what happened and fix it later.

We don't know how well this will work at scale, but it's now sure that it can bring us this far. Now the infrastructure exists, the methodology is open, and anyone can build on it.

### Current State

As of early 2025:

- **Sources**: All 107 carnets restructured with paragraph-level IDs
- **Research**: Ongoing—entries being annotated as the pipeline processes them - more Claude Code Max subscriptions would be helpful!
- **Czech translation**: Primary target, in progress - project was started under the header of [Archetypal.cz](https://archetypal.cz/english), a tiny Czech non-profit for worthwhile and noncommercial translations
- **Ukrainian/English/...**: Infrastructure almost ready, waiting for originals to be fully annotated and researched, and then the Claude Code Max subscriptions and human editors are the limit
- **Glossary**: 600+ entries, growing with each processed entry

---

## Technical Architecture (For DH Practitioners)

This project's architecture is documented in code. We chose a lightweight [Markdown](https://www.markdownguide.org/getting-started/)-based approach over TEI for pragmatic reasons: faster iteration, easier AI processing, and simpler tooling.

### Key Components

- **Entry format**: See `shared/src/models/` for TypeScript definitions
- **Paragraph ID system**: `shared/src/parser/` implements the `%% XXX.YYYY %%` alignment system
- **Comments in content notation**: Role codes (RSR, LAN, TR, RED, CON) or human initials with ISO timestamps
- **Glossary linking**: Relative markdown links to entity definitions
- **Workflow state**: Machine-readable JSON in `src/_original/_workflow/`

Full documentation: [`shared/README.md`](../shared/README.md)

### The Multi-Agent Pipeline

```
Conductor  (CON)          →
↓
Linguistic Annotator → Researcher → Translator → Editor
   (LAN)                 (RSR)       (TR)        (RED)
```

Each role has defined responsibilities, tools, and output formats. See `.claude/skills/` for role definitions.

---

## For DH Scholars & Students

This project is an invite to collaboration. Here's where your expertise matters:

### Research Opportunities

- **Network analysis**: Marie's social connections across European aristocracy
- **Spatial humanities**: Mapping her movements (Nice, Rome, Paris, Russia)
- **Sentiment analysis**: Tracking emotional patterns across 12 years - it would be great to have paragraphs mood-tagged!
- **Comparative stylistics**: How does her voice change with age?
- **Reception history**: How was the diary edited, censored, received? We'll add "version tags", specifying which additional edition a passage is mentioned in, allowing us to emulate various versions as to choice of included content.
- **Methodology critique**: Is this AI-driven approach viable? What are its limits?

### Technical Contributions

- **Translation to additional languages** (German, Spanish, Italian, Polish...) - if you have maybe started your own translation, you could use your style as guidance for the LLMs
- **Improved tooling** for the annotation workflow
- **Visualization** of the glossary as knowledge graph, timelines of Marie's life, etc.
- **NLP experiments** on the French source text
- **Frontend features** for scholarly use

### How to Get Involved

1. **Explore**: Read entries at bashkirtseff.org to feel Marie's voice
2. **Browse the code**: The repository is open source
3. **Join the conversation**: [/r/bashkirtseff](https://www.reddit.com/r/bashkirtseff) for questions, ideas, and discussion
4. **Fork and experiment**: The infrastructure is hopefully designed to be extended

We operate on the principle that good ideas can come from anywhere. Graduate students, independent scholars, curious programmers—all welcome.

---

## A Note on AI

This project lets AI agents do most of the work. Humans set direction, write prompts, and intervene when things go obviously wrong—but there's no careful review of every output. The goal is to see how far AI can carry a project like this with minimal human labor.

It's an experiment in letting go of control, not in maintaining it.

As AI becomes more capable, the humanities need working models—successful or not—for what happens when you let the machines run. This can be one data point.

---

## Further Reading

- [Digital Humanities - Wikipedia](https://en.wikipedia.org/wiki/Digital_humanities)
- [What are the digital humanities? - The British Academy](https://www.thebritishacademy.ac.uk/blog/what-are-digital-humanities/)
- [Introduction to Digital Humanities - Harvard](https://pll.harvard.edu/course/introduction-digital-humanities)
- [Digital Humanities Toolkit - GitHub](https://github.com/pacian/Digital-Humanities-Toolkit)

---

_"What do I want? Oh, you know well. I want glory!"_
— Marie Bashkirtseff, 1884

_(«Mais qu'est-ce que je veux ? Oh ! vous le savez bien. Je veux la gloire !»)_
