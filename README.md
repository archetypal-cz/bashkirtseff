# Marie Bashkirtseff Diary Project

Complete, uncensored translation of Marie Bashkirtseff's diary (1873-1884) from French to Czech, with a modern web reading experience.

## About Marie Bashkirtseff

Marie Bashkirtseff (1858-1884) was a Ukrainian-born artist and diarist who wrote one of the most remarkable personal documents of the 19th century. Her diary, written primarily in French, spans from age 14 until her death from tuberculosis at 25. The published versions were heavily censored by her family - this project aims to present the complete, unedited text.

## Project Overview

| Metric | Value |
|--------|-------|
| **Carnets (notebooks)** | 107 (000-106) |
| **Diary entries** | ~3,300 |
| **Date range** | January 1873 - October 1884 |
| **Source language** | French |
| **Target languages** | Czech, Ukrainian, English, French (modern) |
| **Frontend** | https://bashkirtseff.org |

## Project Structure

```
/
├── src/                     # Content source files
│   ├── _original/           # French originals (source)
│   │   ├── 000/-106/        # Carnets (Marie's original notebooks)
│   │   └── _glossary/       # Historical entities (people, places, etc.)
│   ├── cz/                  # Czech translations
│   ├── uk/                  # Ukrainian translations
│   ├── en/                  # English translations
│   └── fr/                  # French modern edition
│
├── frontend/                # AstroJS Progressive Web App
│   ├── src/pages/           # Year and carnet browsing
│   ├── src/components/      # Vue interactive components
│   └── src/lib/             # Content loading utilities
│
├── shared/                  # Shared TypeScript utilities
├── scripts/                 # Node.js utility scripts
├── prompts/                 # Translation style guides
├── docs/                    # Documentation
└── .claude/                 # Claude Code agent configuration
    └── skills/              # Role definitions
```

## Carnet Organization

Marie wrote in **105 numbered carnets (notebooks)**. The project uses 3-digit folder names (000-106):

| Year | Carnets | Entries | Marie's Age |
|------|---------|---------|-------------|
| 1873 | 11 | 242 | 14-15 |
| 1874 | 14 | 378 | 15-16 |
| 1875 | 23 | 298 | 16-17 |
| 1876 | 17 | 317 | 17-18 |
| 1877 | 8 | 270 | 18-19 |
| 1878 | 6 | 331 | 19-20 |
| 1879 | 3 | 297 | 20-21 |
| 1880 | 2 | 75 | 21-22 |
| 1881 | 4 | 299 | 22-23 |
| 1882 | 3 | 259 | 23-24 |
| 1883 | 5 | 321 | 24-25 |
| 1884 | 4 | 207 | 25-26 |

**Carnet 000** contains Marie's retrospective preface, written in May 1884.

## Translation Workflow

The project uses a multi-agent workflow with specialized roles:

1. **Researcher** - Historical research, entity identification, context
2. **Linguistic Annotator** - Translation guidance, language notes
3. **Translator** - French to Czech translation
4. **Gemini** - External AI review for fresh perspective
5. **Editor** - Quality review and corrections
6. **Conductor** - Final literary quality approval

Each role adds timestamped comments to track decisions:
```
%% 2025-12-07T16:00:00 RSR: Historical context note... %%
%% 2025-12-07T17:00:00 LAN: Translation guidance... %%
%% 2025-12-08T10:00:00 GEM: Alternative phrasing suggestion... %%
```

## Entry Format

Each entry file follows this structure:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
entities:
  people: [Howard_family]
  places: [Nice]
---

%% 001.0001 %%
%% [#Nice](../_glossary/places/cities/NICE.md) %%
Samedi 11 janvier 1873. Il fait un temps superbe...

%% 001.0002 %%
Next paragraph...
```

Translation files include the French original in comments and the visible Czech translation.

## Frontend Features

The AstroJS Progressive Web App provides:

- **Year-based navigation** - Browse by year (1873-1884) with Marie's age
- **Carnet browsing** - View entries within each notebook
- **Flip cards** - See French original alongside Czech translation
- **Paragraph linking** - Deep links to specific paragraphs
- **Glossary integration** - Hover for historical context
- **PWA support** - Offline reading capability
- **Multi-language UI** - Czech, English, French interfaces

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Start frontend development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build
```

### Just Commands

The project uses [Just](https://github.com/casey/just) for task automation:

```bash
just help                # Show all commands
just frontend-dev        # Start frontend dev server
just frontend-build      # Build frontend
just frontend-deploy     # Deploy to production
```

## Working with Claude Code

This project is designed to work with Claude Code. See:

- `CLAUDE.md` - Main project guidance
- `frontend/CLAUDE.md` - Frontend-specific guidance
- `src/CLAUDE.md` - Diary content guidance
- `.claude/skills/` - Role definitions
- `docs/INFRASTRUCTURE.md` - Progress tracking and collaboration system

Use skill commands like `/researcher`, `/translator`, `/editor` to invoke specialized roles.

Use `/project-status` to check progress and track work across the project.

## Learn More

- **[Digital Humanities & This Project](docs/digital-humanities.md)** — What is DH, how this project fits, invitation to scholars
- **[Marie Bashkirtseff: Homecoming](docs/ukraine.md)** — Dedication to Ukraine (English)
- **[Марія Башкирцева: Повернення](docs/Україна.md)** — Dedication to Ukraine (Ukrainian)

## Contributing

We welcome contributions in any language! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:

- Setting up your development environment
- Configuring your worker profile
- Using the translation workflow
- Submitting pull requests

**Quick start:**
```bash
git clone https://github.com/YOUR_USERNAME/bashkirtseff.git
cd bashkirtseff
just setup
cp .claude/WORKER_CONFIG.yaml.template .claude/WORKER_CONFIG.yaml
# Edit WORKER_CONFIG.yaml with your language (cz, uk, en, fr)
```

## License

This project is licensed under CC BY-NC-SA 4.0. See [LICENSE](LICENSE) for details.

The original diary text is in the public domain. The translations, annotations, and software are licensed under the terms above.

## Links

- **Live site**: https://bashkirtseff.org
- **Source**: https://github.com/ArchetypalCz/Bashkirtseff
