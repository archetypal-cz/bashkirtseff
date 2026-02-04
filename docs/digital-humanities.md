# Digital Humanities & The Bashkirtseff Project

## What Is Digital Humanities?

Picture this: it's 1946, and a Jesuit priest named Roberto Busa walks into IBM with an audacious request. He wants to create a concordance of every word Thomas Aquinas ever wrote—13 million of them. By hand, this would take several lifetimes. With computers? Merely thirty years.

That moment—a scholar saying "surely machines can help us understand human thought better"—is the spark that became **digital humanities**.

At its core, DH is simply this: using computational tools to ask humanistic questions. Not replacing the scholar with the algorithm, but giving the scholar superpowers. It's the marriage of close reading (what did Marie mean by *that* sentence?) with distant reading (what patterns emerge across 3,300 diary entries?).

### The Evolution: From Punch Cards to AI Agents

The field has had several identity crises:

- **1960s-80s**: "Humanities Computing" — mostly concordances and databases
- **1990s**: Text Encoding Initiative (TEI) — finally agreeing on how to mark up texts
- **2000s**: Rebranded as "Digital Humanities" — now with visualizations and archives
- **2010s**: Topic modeling, network analysis, massive digitization projects
- **2020s**: AI-assisted scholarship, multi-agent workflows, born-digital archives

What began as counting words has evolved into creating interactive archives, visualizing social networks of historical figures, and—yes—orchestrating teams of AI agents to translate and annotate 19th-century diaries.

### The Toolkit

For those new to DH, the [Digital Humanities Toolkit](https://github.com/pacian/Digital-Humanities-Toolkit) is a treasure chest. Common tools include:

| Domain | Tools | What For |
|--------|-------|----------|
| **Text Analysis** | Voyant, NLTK, Stanford NER | Finding patterns, extracting entities |
| **Topic Modeling** | MALLET | "What is this corpus *about*?" |
| **Network Analysis** | Gephi, Cytoscape | Mapping relationships between people, places, ideas |
| **Mapping** | ArcGIS, CartoDB | Spatial humanities—where things happened |
| **Visualization** | D3.js, RAW, Tableau | Making data tell stories |

---

## This Project: An Experiment in AI-Driven Translation

The Marie Bashkirtseff Diary Project is an experiment: one person with AI assistance, building scaffolding for translating Marie's complete diary into multiple languages.

### What We're Attempting

- **107 carnets** (notebooks) containing ~3,300 diary entries (1873-1884)
- **Parallel translations**: Czech, Ukrainian, English, modern French
- **Rich annotation layer**: Named entities, historical context, linguistic notes
- **Linked glossary**: People, places, cultural references—growing daily
- **Multi-agent workflow**: AI agents doing most of the work
- **Open web access**: Simple, non-tracking web app at bashkirtseff.org

### The Approach

The approach is scrappy and experimental. AI agents do most of the heavy lifting—research, annotation, draft translation. Humans provide intent, prompts, and course corrections, but this isn't a carefully reviewed scholarly pipeline. It's closer to "let's see if we can get a working first draft up" and iterate from there.

Every contribution is documented in the source files—not for careful oversight, but so we can see what happened and fix it later.

We don't know if this will work at scale. But the infrastructure exists, the methodology is open, and anyone can build on it.

### Current State

As of early 2025:

- **Sources**: All 107 carnets restructured with paragraph-level IDs
- **Research**: Ongoing—entries being annotated as the pipeline processes them
- **Czech translation**: Primary target, in progress
- **Ukrainian/English**: Infrastructure ready, translation beginning
- **Glossary**: 600+ entries, growing with each processed entry

---

## Technical Architecture (For DH Practitioners)

This project's architecture is documented in code. We chose a lightweight markup approach over TEI for pragmatic reasons: faster iteration, easier AI processing, and simpler tooling.

### Key Components

- **Entry format**: See `shared/src/models/` for TypeScript definitions
- **Paragraph ID system**: `shared/src/parser/` implements the `%% XXX.YYYY %%` alignment system
- **Comment notation**: Role codes (RSR, LAN, TR, RED, CON) with ISO timestamps
- **Glossary linking**: Relative markdown links to entity definitions
- **Workflow state**: Machine-readable JSON in `src/_original/_workflow/`

Full documentation: [`shared/README.md`](../shared/README.md)

### The Multi-Agent Pipeline

```
Researcher → Linguistic Annotator → Translator → Editor → Conductor
   (RSR)           (LAN)              (TR)        (RED)     (CON)
```

Each role has defined responsibilities, tools, and output formats. See `.claude/skills/` for role definitions.

---

## For DH Scholars & Students

This project welcomes collaboration. Here's where your expertise matters:

### Research Opportunities

- **Network analysis**: Marie's social connections across European aristocracy
- **Spatial humanities**: Mapping her movements (Nice, Rome, Paris, Russia)
- **Sentiment analysis**: Tracking emotional patterns across 12 years
- **Comparative stylistics**: How does her voice change with age?
- **Reception history**: How was the diary edited, censored, received?
- **Methodology critique**: Is this AI-driven approach viable? What are its limits?

### Technical Contributions

- **Translation to additional languages** (German, Spanish, Italian, Polish...)
- **Improved tooling** for the annotation workflow
- **Visualization** of the glossary as knowledge graph
- **NLP experiments** on the French source text
- **Frontend features** for scholarly use

### How to Get Involved

1. **Explore**: Read entries at bashkirtseff.org to feel Marie's voice
2. **Browse the code**: The repository is open source
3. **Join the conversation**: [GitHub Discussions](https://github.com/ArchetypalCz/Bashkirtseff/discussions) for questions and ideas
4. **Fork and experiment**: The infrastructure is designed to be extended

We operate on the principle that good ideas can come from anywhere. Graduate students, independent scholars, curious programmers—all welcome.

---

## A Note on AI

This project lets AI agents do most of the work. Humans set direction, write prompts, and intervene when things go obviously wrong—but there's no careful review of every output. The goal is to see how far AI can carry a project like this with minimal human labor.

It's an experiment in letting go of control, not in maintaining it.

As AI becomes more capable, the humanities need working models—successful or not—for what happens when you let the machines run. This is one data point.

---

## Further Reading

- [Digital Humanities - Wikipedia](https://en.wikipedia.org/wiki/Digital_humanities)
- [What are the digital humanities? - The British Academy](https://www.thebritishacademy.ac.uk/blog/what-are-digital-humanities/)
- [Introduction to Digital Humanities - Harvard](https://pll.harvard.edu/course/introduction-digital-humanities)
- [Digital Humanities Toolkit - GitHub](https://github.com/pacian/Digital-Humanities-Toolkit)

---

*"What do I want? Oh, you know well. I want glory!"*
— Marie Bashkirtseff, 1884

*(«Mais qu'est-ce que je veux ? Oh ! vous le savez bien. Je veux la gloire !»)*
