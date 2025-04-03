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
- `/src/media`: Contains media files related to the translation
- `/prompts`: Contains style guidelines and information about the work being translated
- `/docs`: Contains reference materials, translation memory, and other documentation
- `/pub`: Contains compiled output files with the translations - can be set up to be MarkDown, HTML or even other formats like ePUB.
- `/bin`: Contains executable tools - when needed to create and convert ebooks, or upload the translation versions somewhere
- `/memlog`: Contains logs of completed work and plans

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
6. 

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

### Usage

#### Compile a Single Book

```bash
./scripts/compile_book.py 01 --language cz --template scripts/templates/book_template.html
```

This will:
1. Find all Markdown files in `src/cz/01/`
2. Combine them into a single Markdown file in `pub/cz_01.md`
3. Convert that Markdown file to HTML at `pub/cz_01.html`

#### Compile All Books

```bash
./scripts/compile_all_books.py
```

This will compile all books for all languages defined in the project.

### VSCode Tasks

The project includes VSCode tasks for easy compilation:

1. **Compile Book (Czech, Book 01)**: Compiles the first book in Czech
2. **Compile All Books**: Compiles all books for all languages
3. **Open Compiled Book (Czech, Book 01)**: Opens the compiled HTML file in your default browser

To run a task, press `Ctrl+Shift+P`, type "Tasks: Run Task", and select the desired task.