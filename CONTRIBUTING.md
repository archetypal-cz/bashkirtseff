# Contributing to the Marie Bashkirtseff Diary Project

Thank you for your interest in helping bring Marie Bashkirtseff's complete diary to readers worldwide. This guide will help you get started as a contributor.

## A Note About This Project

This is primarily a **one-person project** that evolves rapidly. Documentation, skills, and workflows may occasionally fall out of sync with reality.

**If you find inconsistencies** - a skill that doesn't work as documented, a command that's changed, or instructions that no longer match the codebase:

1. **Fix it** if you can (PRs welcome!)
2. **Report it** by opening a [GitHub Issue](https://github.com/archetypal-cz/bashkirtseff/issues)
3. **Don't assume you're doing something wrong** - the docs might simply be outdated

This applies to both human contributors and AI agents working on the project. Keeping documentation accurate is a valuable contribution in itself.

## What You Can Contribute

- **Translations**: Czech, Ukrainian, English, or French (modern edition)
- **Research**: Historical context, entity identification, biographical details
- **Review**: Quality review of existing translations
- **Technical**: Frontend improvements, tooling, documentation

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm 9+**
- **[Just](https://github.com/casey/just)** - Task runner (`cargo install just` or `brew install just`)
- **[Claude Code](https://github.com/anthropics/claude-code)** - AI-assisted translation workflow
- **Git** and a GitHub account

## Getting Started

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/bashkirtseff.git
cd bashkirtseff
```

### 2. Install Dependencies

```bash
just setup
```

This installs Node.js dependencies and builds the shared TypeScript library.

### 3. Configure Your Worker Profile

```bash
cp .claude/WORKER_CONFIG.yaml.template .claude/WORKER_CONFIG.yaml
```

Edit `.claude/WORKER_CONFIG.yaml` with your settings:

```yaml
# Your GitHub username
github_user: your_username

# Language you're working on: cz, uk, en, fr
working_language: uk

# Carnets you're working on (coordinate via Issues or /r/bashkirtseff)
assigned_carnets:
  - "001"
  - "002"

# Roles you can perform
roles:
  - researcher
  - translator
  - editor
```

This file is gitignored - it's your personal configuration.

### 4. Create Your Language Folder (if needed)

If you're starting a new language or carnet:

```bash
# Create carnet folder structure
mkdir -p src/uk/001
```

Check `src/uk/PROGRESS.md` or `src/en/PROGRESS.md` for language-specific setup notes.

### 5. Initialize Source Hashes

After creating your first translation files:

```bash
just init-source-hashes uk      # For Ukrainian
just init-source-hashes en      # For English
just init-source-hashes cz 001  # For specific carnet
```

This creates `.source-hash` files that track which version of the French original your translation is based on.

## Translation Workflow

### Using Claude Code Skills

The project uses specialized AI agents (skills) for each phase:

```bash
# Start Claude Code in the project directory
claude

# Then use skills:
/researcher          # Research historical context
/linguistic-annotator # Add translation notes
/translator          # Translate entries
/editor              # Review translations
/conductor           # Final quality check
```

### Standard Pipeline

1. **Research** (`/researcher`) - Extract entities, identify people/places, add historical context
2. **Annotate** (`/linguistic-annotator`) - Add translation guidance notes
3. **Translate** (`/translator`) - Create the translation
4. **Review** (`/editor`) - Check quality and naturalness
5. **Approve** (`/conductor`) - Final literary quality gate

### Checking Progress

```bash
# In Claude Code:
/project-status           # Overall project status
/project-status uk        # Ukrainian translation status
/project-status uk 001    # Specific carnet
```

## Entry File Format

Each translation file mirrors the French original structure:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
---

%% 001.0001 %%
%% [FR] Samedi 11 janvier 1873. Il fait un temps superbe... %%
Sobota 11. ledna 1873. Je nádherné počasí...

%% 001.0002 %%
%% [FR] Next French paragraph... %%
Next translated paragraph...
```

See `docs/FRONTMATTER.md` for complete format specification.

## Coordination

### Claiming Work

Before starting on a carnet:

1. Check GitHub Issues for claimed carnets
2. Create an issue or comment to claim your carnet
3. Update your `WORKER_CONFIG.yaml`

### Communication

- **[/r/bashkirtseff](https://www.reddit.com/r/bashkirtseff)** - Questions, ideas, general discussion, community
- **GitHub Issues** - Bug reports, work coordination
- **Pull Requests** - Submit completed work

## Submitting Your Work

### 1. Commit Your Changes

```bash
git add src/uk/001/
git commit -m "[uk] Translate carnet 001 entries 1873-01-11 to 1873-01-15"
```

Use the language code prefix: `[cz]`, `[uk]`, `[en]`, `[fr]`

### 2. Push and Create PR

```bash
git push origin your-branch
```

Create a Pull Request on GitHub with:

- Summary of what was translated/reviewed
- Any questions or notes for reviewers
- Link to relevant Issues

## Useful Commands

```bash
just                    # List all available commands
just setup              # Install deps + build TypeScript
just fe-dev             # Start frontend dev server
just validate src/uk/001/1873-01-11.md  # Validate entry format
just glossary-validate  # Check all glossary links
just init-source-hashes uk  # Initialize source tracking
```

## Resources

- **Entry Format**: `docs/FRONTMATTER.md` - File format specification
- **Infrastructure**: `docs/INFRASTRUCTURE.md` - Progress tracking system
- **Skills**: `.claude/skills/*/SKILL.md` - Detailed role documentation

## Questions?

- Ask on [/r/bashkirtseff](https://www.reddit.com/r/bashkirtseff) — our main community hub
- Check existing documentation in `/docs/`

---

_Marie's voice deserves to be heard in every language. Thank you for helping make that happen._
