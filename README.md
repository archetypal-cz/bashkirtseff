# Coslate: Collaborative Translation Framework

Coslate (Collaborative Translation) is a framework for human-AI collaborative translation projects. It provides the scaffolding necessary to make translation and related activities happen efficiently through a structured workflow.

## Project Overview

This project serves two purposes:
1. A framework for translation projects with all necessary tooling and structure - should not touch `/src` content. 
2. The actual translation content being worked on, most text in `/src` and prompts in `/prompts`. 

Coslate is designed to facilitate a smooth workflow between human translators, editors, and AI assistants, ensuring high-quality translations that maintain the spirit of the original text while adapting appropriately to the target language - all up tu publication automated and transparent as possible.

## Project Structure

If several languages are to be supported, we use short or long ISO language codes as subfolder names - usually in both `/src` and `/src/media`.

- `/src`: Contains the translation files (original text and translations)
  - `/{lang}`: Language-specific directories (e.g., `/src/cz/` for Czech)
    - `/00`, `/01`, etc.: Book/chapter directories with ISO date filenames (e.g., `1873-01-11.md`)
  - `/_original`: Original source materials
    - `/00`, `/01`, etc.: Book/chapter directories with ISO date filenames (e.g., `1873-01-11.md`)
- `/src/media`: Contains media files related to the translation
- `/prompts`: Contains style guidelines and information about the work being translated
- `/docs`: Contains reference materials, translation memory, and other documentation
- `/pub`: Contains compiled output files with the translations - can be set up to be MarkDown, HTML or even other formats like ePUB.
- `/bin`: Contains executable tools - when needed to create and convert ebooks, or upload the translation versions somewhere
- `/memlog`: Contains logs of completed work and plans

## Book Organization and Date Ranges

This project contains Marie Bashkirtseff's diary organized into 6 books covering 1873-1884:

### Book Coverage and Processing Status

| Book | Date Range | Entries | Raw Carnet | Hashtag Tagging | Research Comments | Status |
|------|------------|---------|------------|-----------------|------------------|---------|
| **00** | May 1-10, 1884 | 10 | 45KB | ✅ Complete (10/10) | ❌ None | Complete - Final entries |
| **01** | Jan 11 - May 3, 1873 | 99 | 544KB | ✅ Nearly complete (97/99) | ✅ Most entries (77/99) | Highly researched |
| **02** | Aug 11, 1873 - Jan 1, 1874 | 143 | 624KB | ✅ Nearly complete (140/143) | ✅ Nearly complete (134/143) | Highly researched |
| **03** | Jan 2 - July 4, 1874 | 182 | 607KB | ✅ Nearly complete (175/182) | ✅ Complete (182/182) | Fully researched |
| **04** | July 5, 1874 - Apr 2, 1875 | 258 | 786KB | ⚠️ Partial (107/258) | ✅ Complete (258/258) | **Needs hashtag tagging** |
| **05** | Apr 2, 1875 - Sep 25, 1875* | 18 | 744KB | ✅ Nearly complete (17/18) | ⚠️ Partial (13/18) | **Needs extraction** |

*Book 05 raw carnet covers through September 25, 1875 but only April 2-19 entries have been extracted*

### Book Content Highlights

- **Book 00 (1884)**: Marie's preface and final diary entries before her death
- **Book 01 (1873)**: Early diary entries, establishment in Nice, social observations
- **Book 02 (1873-1874)**: Continued Nice life, Hamilton obsession development
- **Book 03 (1874)**: Major Hamilton obsession, Nice society, personal development
- **Book 04 (1874-1875)**: Extended period including London visits, social isolation, Prince of Wales encounters
- **Book 05 (1875)**: Continued Nice life, piano recitals, ongoing romantic interests

### Known Gaps and Anomalies

#### Missing Dates
- **Book 03**: April 4, 1874
- **Book 04**: September 13-15, 1874; December 15, 1874; March 8-17, 1875 (10-day gap)

#### Technical Issues
- **Book 04**: August 18, 1874 entry has split text issue documented in research comments
- **Book 05**: April 2, 1875 appears in both Book 04 and Book 05 (overlap)

### Research Methodology

The project uses a systematic tagging approach:
- **Hashtag Tagging**: Paragraph-level entity linking using `[//]: # ( [#Entity](/src/_original/_glossary/Entity.md) )`
- **Researcher Comments**: Historical context and analysis using `[//]: # ( YYYY-MM-DDThh:mm:ss RSR: comment )`
- **Glossary Integration**: 400+ entity entries providing historical context and biographical information

## File Naming Conventions

- `*.done.md`: Completed translations
- `*.red.md`: Translations that need redaction/editing
- `*.proof.md`: Translations that need proofreading

## Translation Format

Translations follow a specific format:
1. Original text in Markdown comment: `[//]: # ( original text )`
2. Paragraph ID comment: `[//]: # ( 01.01 )` (first document, first paragraph)
3. Optional translation notes/deliberations in Markdown comments
4. The polished translation with Markdown footnotes[^part_id.paragraph_id.note_id] by author, translator and editor as needed 
   [^part_id.paragraph_id.note_id]: This is footnote body.
5. Hashtags (in french) for crossreferencing topics mentioned in paragraphs as `[//]: # ( #Emile_Zole #Rome_Colosseum )` on a separate line before the paragraph translation, mentioned in src/HASHTAGS.md with the date of the diary entry mentioning them
6. When mentioning dates or paragraphs in the text, create markdown links to their relative files in the current translation (including when Marie writes back notes from the future)

## Custom Roo Code Modes

This project includes two custom Roo Code modes to facilitate the translation workflow:

### Translator Mode

- **Slug**: `translator`
- **Purpose**: Professional translation of content
- **Capabilities**:
  - Translates content according to style guidelines in `prompts/Style.md`
  - Works with source material described in `prompts/Work.md`
  - Follows the project's markdown comment notation system
  - Understands file naming conventions
  - Adds timestamped translator comments: `[//]: # ( YYYY-MM-DDThh:mm:ss TR: comment )`
  - Responds to redaction comments made by RED, updates translations when necessary based on comments and new information or insights, can participate in comment discussions when having important points. 
  - Can add translator Markdown footnotes if necessary based on project style, targeting and content 
- **Restrictions**: Can only edit files in the `/src` directory with `.md` extension

### Editor Mode

- **Slug**: `editor`
- **Purpose**: Review, editing, and proofreading of translations
- **Capabilities**:
  - Reviews translations for accuracy, fluency, and cultural appropriateness
  - Directly corrects obvious mistakes
  - Adds timestamped editor comments: `[//]: # ( YYYY-MM-DDThh:mm:ss RED: comment )`
  - Performs proofreading for grammar, spelling, and formatting
  - Can respond to translator (TR) or even (RED) comments, to communicate suggestions and point out problems in translation and its context.
  - Can add editor Markdown footnotes for the reader if necessary based on project style, targeting and content - particularly if editing a project where the translator is no longer available and cannot make updates.
- **Restrictions**: Can only edit files in the `/src` directory with `.md` extension

## Getting Started

1. Clone this repository
2. Open it with VSCode and Roo Code
3. Use the mode selector to switch between Translator and Editor modes as needed
4. Follow the workflow: translate → edit → proofread → finalize

## Build and Output

The project can include automation for compiling translated content into various formats (HTML, EPUB, PDF) using VSCode tasks and/or GitHub Actions, the AI in Roo Code can assist with both explanation and implementation for the project.

## Compilation Scripts

This project includes Python scripts (requiring Python 3.10 or higher) for compiling translated content into HTML:

### Setup

1. Install Poetry (dependency management tool for Python):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install project dependencies:
   ```bash
   poetry install
   ```

3. Activate the virtual environment:
   ```bash
   poetry shell
   ```

**IMPORTANT**: All Python scripts in this project must be run within the Poetry virtual environment. Either activate the environment with `poetry shell` before running scripts, or prefix commands with `poetry run` (e.g., `poetry run ./scripts/compile_book.py`).

### Usage

#### Compile a Single Book

```bash
poetry run ./scripts/compile_book.py 01 --language cz --template scripts/templates/book_template.html
```

This will:
1. Find all Markdown files in `src/cz/01/` (using ISO date filenames)
2. Combine them into a single Markdown file in `pub/cz_01.md`
3. Convert that Markdown file to HTML at `pub/cz_01.html`

#### Compile All Books

```bash
poetry run ./scripts/compile_all_books.py
```

This will compile all books for all languages defined in the project.

#### Rename Files to New Convention

```bash
poetry run ./scripts/rename_files.py
```

This will rename all files from the old format (e.g., `01.1873-01-11.md`) to the new format (e.g., `1873-01-11.md`).

### Just Commands (Recommended)

The project includes a `justfile` for easy task management. [Just](https://github.com/casey/just) is a command runner that simplifies common operations:

```bash
# Setup environment
just setup                # Install Poetry dependencies
just shell               # Activate Poetry environment

# Compilation
just compile 01 cz        # Compile Book 01 for Czech
just build               # Compile all books for Czech
just build-all           # Compile all books for all languages

# Viewing
just open 01 cz          # Open Book 01 (Czech) in browser
just open-original 01    # Open original French Book 01
just open-glossary       # Open glossary

# Project management
just status              # Show project status
just stats               # Show detailed statistics
just search "term"       # Search in source files
just help                # Show all available commands
```

### VSCode Tasks

The project also includes VSCode tasks for easy compilation:

1. **Compile Book (Czech, Book 01)**: Compiles the first book in Czech
2. **Compile All Books**: Compiles all books for all languages
3. **Open Compiled Book (Czech, Book 01)**: Opens the compiled HTML file in your default browser

To run a task, press `Ctrl+Shift+P`, type "Tasks: Run Task", and select the desired task.