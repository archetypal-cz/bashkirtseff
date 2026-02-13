# Marie Bashkirtseff Diary Project

Complete, uncensored translation of Marie Bashkirtseff's diary (1873-1884) from French to Czech, with a modern reading experience.

## About Marie Bashkirtseff

Marie Bashkirtseff (1858-1884) was a Ukrainian-born artist and diarist who wrote one of the most remarkable personal documents of the 19th century. Her diary, written primarily in French, spans from age 14 until her death from tuberculosis at 25. The legendary published versions were _heavily_ censored by her family - this project aims to present the complete, unedited text, resurrecting Marie's authentic voice and experiences for her readers, along with rich historical context.

## Project Overview

| Metric                       | Value                                          |
| ---------------------------- | ---------------------------------------------- |
| **Carnets (notebooks)**      | 107 (000-106)                                  |
| **Diary entries**            | ~3,300                                         |
| **Date range**               | January 1873 - October 1884                    |
| **Source language**          | Mostly French, some English, Russian, Italian  |
| **Planned target languages** | Czech, Ukrainian, English, French (modern)     |
| **Frontend**                 | https://bashkirtseff.org                       |

## Project Structure

```
/
├── content/                 # Diary content files
│   ├── original/            # French originals (source)
│   │   ├── 000/-106/        # Carnets (Marie's original notebooks)
│   │   └── _glossary/       # Historical entities (people, places, etc.) and themes
│   ├── cz/                  # Czech translations
│   ├── uk/                  # Ukrainian translations
│   ├── en/                  # English translations
│   └── fr/                  # French modern edition
│
├── src/                     # Source code
│   ├── frontend/            # AstroJS Progressive Web App
│   │   ├── src/pages/       # Year and carnet browsing
│   │   ├── src/components/  # Vue interactive components
│   │   └── src/lib/         # Content loading utilities
│   ├── shared/              # Shared TypeScript utilities
│   └── scripts/             # Node.js utility scripts
│
├── raw/                     # Scans of original books and resources
├── docs/                    # Documentation
│   └── prompts/             # Translation style guides
├── .claude/                 # Claude Code agent configuration
│   └── skills/              # Role definitions
│   └── prompts/             # Translation style guides
└── .vscode/                 # Visual Studio Code setting
    └── bashkirtseff-highlighting/ # Syntax highlight plugin for our markdown in VSCode
```

## Carnet Organization

Marie wrote in **105 numbered carnets (notebooks)**. The project uses 3-digit folder names (000-106):

| Year | Carnets | Entries | Marie's Age |
| ---- | ------- | ------- | ----------- |
| 1873 | 11      | 242     | 14-15       |
| 1874 | 14      | 378     | 15-16       |
| 1875 | 23      | 298     | 16-17       |
| 1876 | 17      | 317     | 17-18       |
| 1877 | 8       | 270     | 18-19       |
| 1878 | 6       | 331     | 19-20       |
| 1879 | 3       | 297     | 20-21       |
| 1880 | 2       | 75      | 21-22       |
| 1881 | 4       | 299     | 22-23       |
| 1882 | 3       | 259     | 23-24       |
| 1883 | 5       | 321     | 24-25       |
| 1884 | 4       | 207     | 25-26       |

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

Each entry file follows this structure — a [YAML frontmatter](https://jekyllrb.com/docs/front-matter/) header with metadata, followed by paragraph clusters in [Markdown](https://www.markdownguide.org/getting-started/):

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

The AstroJS [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app) provides:

- **Year-based navigation** - Browse by year (1873-1884) with Marie's age
- **Carnet browsing** - View entries within each notebook
- **Flip cards** - See French original alongside translations by clicking icon on top right of paragraphs
- **Paragraph linking** - Deep links to specific paragraphs
- **Glossary integration** - Paragraph menu with glossary links for historical context
- **PWA support** - Offline reading capability
- **Multi-language UI** 

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- [Just](https://just.systems) command runner

### Setup

```bash
# Install dependencies
npm install

# Start frontend development server
cd src/frontend && npm run dev

# Build for production
cd src/frontend && npm run build
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
- `src/frontend/CLAUDE.md` - Frontend-specific guidance
- `content/CLAUDE.md` - Diary content guidance
- `.claude/skills/` - Role definitions
- `docs/INFRASTRUCTURE.md` - Progress tracking and collaboration system

Use skill commands like `/researcher`, `/translator`, `/editor` to invoke specialized roles.

Use `/project-status` to check progress and track work across the project.

## Learn More

- **[Digital Humanities & This Project](docs/digital-humanities.md)** — What is DH, how this project fits, invitation to scholars
- **[Marie Bashkirtseff: Homecoming](docs/ukraine.md)** — Dedication to Ukraine (English)
- **[Марія Башкирцева: Повернення](docs/Україна.md)** — Dedication to Ukraine (Ukrainian)

## Contributing

We welcome discussion about the project and contributions in any language! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:

- Setting up your environment
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

## Community

Join the discussion at [/r/bashkirtseff](https://www.reddit.com/r/bashkirtseff) — our main community hub for questions, ideas, translation discussions, and everything Marie.

## Links

- **Live site**: https://bashkirtseff.org
- **Source**: https://github.com/archetypal-cz/bashkirtseff
- **Community**: https://www.reddit.com/r/bashkirtseff

## FAQ

- ** Can I buy an ebook? **
  Not yet. Please use our website for reading, it can be installed as an app. We'll look at publishing once the translations exist and have good quality. For (shortened but very good) English translation, you can [buy Katherine Kernberger dual volume](https://www.amazon.com/Journal-Marie-Bashkirtseff-Interesting-Glory-ebook/dp/B00BMEMB4Q?), none of the other available editions come from the uncensored version.
- ** I don't know anything about programming, how can I support this project? **
  You can become a [GitHub Sponsor](https://github.com/sponsors/kerray)
