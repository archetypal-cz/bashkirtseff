# Justfile for Marie Bashkirtseff Diary Translation Project
# Common operations for carnet compilation and project management

# Set shell for Windows/WSL compatibility
set shell := ["bash", "-c"]

# Default variables
default_lang := "cz"
default_carnet := "001"

# Show available commands
default:
    @just --list

# === ENVIRONMENT SETUP ===

# Install all dependencies (Node.js workspaces)
setup:
    npm install
    npm run build:shared
    @echo "Environment ready."

# Install dependencies
install:
    npm install

# Build shared TypeScript package
build-ts:
    npm run build:shared

# === GLOSSARY MANAGEMENT ===

# Find all diary entries referencing a glossary entry
glossary-find id:
    npx tsx scripts/glossary-refs.ts find {{id}}

# List orphaned glossary entries (not referenced anywhere)
glossary-orphaned:
    npx tsx scripts/glossary-refs.ts orphaned

# List missing glossary entries (referenced but don't exist)
glossary-missing:
    npx tsx scripts/glossary-refs.ts missing

# Show glossary usage statistics
glossary-stats:
    npx tsx scripts/glossary-refs.ts stats

# Search glossary entries by pattern
glossary-search pattern:
    npx tsx scripts/glossary-refs.ts search {{pattern}}

# Generate detailed report for a glossary entry
glossary-entry-report id:
    npx tsx scripts/glossary-refs.ts report {{id}}

# === UTILITIES ===

# Verify all entries are properly formatted
verify:
    @echo "Verifying entry consistency..."
    @find src/_original -name "*.md" -type f | wc -l | xargs echo "Total source files:"
    @find src/cz -name "*.md" -type f | wc -l | xargs echo "Total Czech files:"

# Check project status
status:
    @echo "=== Project Status ==="
    @echo "Carnets in source (_original):"
    @ls -la src/_original/ | grep "^d" | grep -E "[0-9]+" | wc -l | xargs echo "  Count:"
    @echo "Carnets with Czech translations:"
    @ls -la src/cz/ 2>/dev/null | grep "^d" | grep -E "[0-9]+" | wc -l | xargs echo "  Count:"
    @echo "View at: https://bashkirtseff.org"

# Initialize source hashes in translation files (for change detection)
init-source-hashes lang="" carnet="":
    npx tsx scripts/hooks/init-source-hashes.ts {{lang}} {{carnet}}

# Show statistics about the project
project-stats:
    #!/usr/bin/env bash
    echo "=== Project Statistics ==="
    echo "Source files by carnet:"
    for carnet in $(ls -d src/_original/[0-9][0-9][0-9] 2>/dev/null | sort); do
        carnet_num=$(basename $carnet)
        count=$(find $carnet -name "*.md" | wc -l)
        echo "  Carnet $carnet_num: $count entries"
    done
    echo "Czech translation progress:"
    for carnet in $(ls -d src/cz/[0-9][0-9][0-9] 2>/dev/null | sort); do
        carnet_num=$(basename $carnet)
        count=$(find $carnet -name "*.md" | wc -l)
        echo "  Carnet $carnet_num: $count entries"
    done
    echo "Glossary entries:"
    find src/_original/_glossary -name "*.md" | wc -l | xargs echo "  Count:"

# Search for text in source files
search query:
    @echo "Searching for '{{query}}' in source files..."
    @grep -r "{{query}}" src/_original/ --include="*.md" -n | head -20

# Search for text in Czech translations
search-cz query:
    @echo "Searching for '{{query}}' in Czech translations..."
    @grep -r "{{query}}" src/cz/ --include="*.md" -n | head -20

# Find files that don't contain a pattern (e.g., unannotated entries)
find-missing pattern directory:
    @echo "Finding .md files in {{directory}} that don't contain '{{pattern}}'..."
    @for file in {{directory}}/*.md; do \
        if [ -f "$$file" ] && ! grep -q "{{pattern}}" "$$file"; then \
            basename "$$file"; \
        fi; \
    done

# Clean TypeScript build artifacts
clean-ts:
    rm -rf shared/dist
    @echo "Cleaned TypeScript build artifacts"

# === FILE OPERATIONS ===

# Create a new daily entry file
new-entry date carnet="001":
    @echo "Creating new entry for {{date}} in carnet {{carnet}}"
    @mkdir -p src/_original/{{carnet}}
    @touch src/_original/{{carnet}}/{{date}}.md
    @echo "# Entry for {{date}}" > src/_original/{{carnet}}/{{date}}.md
    @echo "Created: src/_original/{{carnet}}/{{date}}.md"

# List entries for a specific carnet
list-entries carnet=default_carnet:
    @echo "Entries in Carnet {{carnet}}:"
    @ls -la src/_original/{{carnet}}/*.md 2>/dev/null | awk '{print $9}' | sort

# Show last few entries in a carnet
recent carnet=default_carnet count="5":
    @echo "Last {{count}} entries in Carnet {{carnet}}:"
    @ls -la src/_original/{{carnet}}/*.md 2>/dev/null | tail -{{count}} | awk '{print $9}'

# === FRONTMATTER MANAGEMENT ===

# Check for missing para_start in a specific carnet (Carnet 000 excluded - special handling)
check-para-start carnet=default_carnet:
    #!/usr/bin/env bash
    echo "Checking para_start in Carnet {{carnet}}..."
    if [ "{{carnet}}" = "000" ]; then
        echo "Carnet 000 has special handling (no frontmatter - uses inline paragraph markers)"
    else
        missing=0
        for file in src/_original/{{carnet}}/*.md; do
            if grep -q "^---" "$file" && ! grep -q "^para_start:" "$file"; then
                echo "Missing para_start: $file"
                missing=$((missing + 1))
            fi
        done
        if [ $missing -eq 0 ]; then
            echo "All entries have para_start"
        else
            echo "Total missing: $missing"
        fi
    fi

# Check para_start coverage across all carnets
check-para-start-all:
    #!/usr/bin/env bash
    echo "=== para_start Coverage Check ==="
    echo "Carnet 000: special handling (no frontmatter)"
    for carnet in $(ls -d src/_original/[0-9][0-9][0-9] 2>/dev/null | sort | grep -v '/000$'); do
        carnet_num=$(basename $carnet)
        total=$(find $carnet -name "*.md" 2>/dev/null | wc -l)
        with_para=$(grep -l "^para_start:" $carnet/*.md 2>/dev/null | wc -l)
        missing=$((total - with_para))
        if [ $missing -gt 0 ]; then
            echo "Carnet $carnet_num: $with_para / $total have para_start ($missing MISSING)"
        else
            echo "Carnet $carnet_num: $with_para / $total have para_start (OK)"
        fi
    done

# List entries missing para_start in a carnet
list-missing-para-start carnet=default_carnet:
    #!/usr/bin/env bash
    if [ "{{carnet}}" = "000" ]; then
        echo "Carnet 000 has special handling (no frontmatter)"
    else
        for file in src/_original/{{carnet}}/*.md; do
            if grep -q "^---" "$file" && ! grep -q "^para_start:" "$file"; then
                basename "$file"
            fi
        done
    fi

# Check entries for missing or incomplete frontmatter
check-frontmatter carnet=default_carnet:
    @echo "Checking frontmatter in Carnet {{carnet}}..."
    @for file in src/_original/{{carnet}}/*.md; do \
        if ! grep -q "^---" "$$file"; then \
            echo "Missing frontmatter: $$file"; \
        elif ! grep -q "marie_age:" "$$file"; then \
            echo "Missing calculated fields: $$file"; \
        fi \
    done

# === DEPLOYMENT ===
#
# Frontend deployment is AUTOMATIC via GitHub Actions:
#   - Push to main branch triggers deployment
#   - Workflow: .github/workflows/deploy.yml
#   - Site: https://bashkirtseff.org
#
# Check deployment status in GitHub Actions:
#   https://github.com/ArchetypalCz/Bashkirtseff/actions

# === AI TRANSLATION WORKFLOW ===

# Start Workflow Architect session (for developing/debugging the system)
architect:
    @echo "Starting Workflow Architect session..."
    @echo "Use /architect command or load .claude/skills/workflow-architect/SKILL.md"
    claude "Load the workflow-architect skill from .claude/skills/workflow-architect/SKILL.md. You are the system architect, not a translation agent. Read the skill file completely, then ask what I want to work on."

# Start Executive Director for a carnet (interactive mode)
ed carnet="015":
    @echo "Starting Executive Director for Carnet {{carnet}}..."
    claude --resume latest "You are the Executive Director. Load .claude/project_config.md and .claude/skills/executive-director/SKILL.md. Begin processing Carnet {{carnet}}. Report current status and await instructions."

# Run researcher on a specific entry (headless)
research entry carnet="015":
    @echo "Running researcher on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/researcher/SKILL.md. Then process entry src/_original/{{carnet}}/{{entry}}.md following those instructions. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Write,Edit,Grep,Glob,WebSearch" \
        | tee src/_original/_workflow/research_{{entry}}.json

# Run linguistic annotator on a specific entry (headless)
annotate entry carnet="015":
    @echo "Running linguistic annotator on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/linguistic-annotator/SKILL.md. Then process entry src/_original/{{carnet}}/{{entry}}.md following those instructions. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Edit,Write,Grep,Glob" \
        | tee src/_original/_workflow/annotate_{{entry}}.json

# Run translator on a specific entry (headless)
translate entry carnet="015" lang="cz":
    @echo "Running translator on {{entry}} to {{lang}}..."
    @mkdir -p src/{{lang}}/{{carnet}}
    claude -p "First, read your full instructions from .claude/skills/translator/SKILL.md. Then translate src/_original/{{carnet}}/{{entry}}.md to Czech. Output to src/{{lang}}/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Edit,Write,Grep,Glob" \
        | tee src/_original/_workflow/translate_{{entry}}.json

# Run editor review on a translation (headless)
review entry carnet="015" lang="cz":
    @echo "Running editor review on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/editor/SKILL.md. Then review translation src/{{lang}}/{{carnet}}/{{entry}}.md against original src/_original/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        | tee src/_original/_workflow/review_{{entry}}.json

# Run conductor final review (headless)
conduct entry carnet="015" lang="cz":
    @echo "Running conductor final review on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/conductor/SKILL.md. Then do final review of src/{{lang}}/{{carnet}}/{{entry}}.md against src/_original/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        | tee src/_original/_workflow/conduct_{{entry}}.json

# Run full pipeline on a single entry
pipeline entry carnet="015" lang="cz":
    @echo "=== Full pipeline for {{entry}} ==="
    just research {{entry}} {{carnet}}
    @echo ""
    just annotate {{entry}} {{carnet}}
    @echo ""
    just translate {{entry}} {{carnet}} {{lang}}
    @echo ""
    just review {{entry}} {{carnet}} {{lang}}
    @echo ""
    just conduct {{entry}} {{carnet}} {{lang}}
    @echo "=== Pipeline complete for {{entry}} ==="

# Batch process multiple entries (research + annotate only)
prepare-batch start end carnet="015":
    @echo "Preparing entries {{start}} to {{end}} in Carnet {{carnet}}..."
    @for entry in $(ls src/_original/{{carnet}}/ | grep -E "^{{start}}" | head -10); do \
        just research $${entry%.md} {{carnet}}; \
        just annotate $${entry%.md} {{carnet}}; \
    done

# Show workflow status for a carnet
workflow-status carnet="015":
    @echo "=== Workflow Status for Carnet {{carnet}} ==="
    @echo "Research completed:"
    @ls src/_original/_workflow/research_*.json 2>/dev/null | wc -l
    @echo "Annotation completed:"
    @ls src/_original/_workflow/annotate_*.json 2>/dev/null | wc -l
    @echo "Translation completed:"
    @ls src/_original/_workflow/translate_*.json 2>/dev/null | wc -l
    @echo "Review completed:"
    @ls src/_original/_workflow/review_*.json 2>/dev/null | wc -l
    @echo "Conductor approved:"
    @ls src/_original/_workflow/conduct_*.json 2>/dev/null | wc -l

# Generate workflow metrics report
workflow-report carnet="015":
    @echo "Generating workflow report for Carnet {{carnet}}..."
    claude -p "Analyze all JSON files in src/_original/_workflow/. Generate a metrics report following the format in MULTI_AGENT_PLAN.md. Include agent performance, quality trends, and improvement suggestions. Save to src/_original/_workflow/metrics/carnet_{{carnet}}_metrics.md" \
        --allowedTools "Read,Write,Grep,Glob"

# Clean workflow state (careful!)
workflow-clean:
    @echo "This will delete all workflow state files. Continue? [y/N]"
    @read -r confirm && [ "$$confirm" = "y" ] && rm -rf src/_original/_workflow/*.json || echo "Cancelled"

# === HELP ===

# Show detailed help
help:
    @echo "Marie Bashkirtseff Diary Translation Project"
    @echo "==========================================="
    @echo ""
    @echo "QUICK START:"
    @echo "  just setup           # Install dependencies & build TypeScript"
    @echo "  just fe-dev          # Start frontend dev server"
    @echo "  View site at: https://bashkirtseff.org"
    @echo ""
    @echo "GLOSSARY:"
    @echo "  just glossary-validate    # Validate all glossary links"
    @echo "  just glossary-stubs       # Create missing glossary stubs"
    @echo "  just glossary-check       # Check naming standards"
    @echo "  just glossary-report      # Full glossary report"
    @echo "  just glossary-find ID     # Find references to a glossary entry"
    @echo "  just glossary-orphaned    # List orphaned entries (no refs)"
    @echo "  just glossary-missing     # List missing entries (broken links)"
    @echo "  just glossary-stats       # Show usage statistics"
    @echo "  just glossary-search PAT  # Search entries by pattern"
    @echo ""
    @echo "PROJECT MANAGEMENT:"
    @echo "  just status          # Show project status"
    @echo "  just project-stats   # Show detailed statistics"
    @echo "  just verify          # Verify file consistency"
    @echo "  just search 'term'   # Search in source files"
    @echo ""
    @echo "DEVELOPMENT:"
    @echo "  just build-ts        # Build TypeScript packages"
    @echo "  just clean-ts        # Clean TypeScript build artifacts"
    @echo ""
    @echo "DEPLOYMENT (automatic on push to main):"
    @echo "  git push origin main  # Triggers GitHub Actions deploy"
    @echo "  Check status: https://github.com/ArchetypalCz/Bashkirtseff/actions"
    @echo ""
    @echo "AI TRANSLATION WORKFLOW:"
    @echo "  just architect                  # Start Workflow Architect (system dev)"
    @echo "  just ed 015                     # Start Executive Director for Carnet 015"
    @echo "  just research 1881-05-15 015    # Run researcher on entry"
    @echo "  just annotate 1881-05-15 015    # Run linguistic annotator on entry"
    @echo "  just translate 1881-05-15 015   # Translate entry to Czech"
    @echo "  just review 1881-05-15 015      # Run editor review"
    @echo "  just conduct 1881-05-15 015     # Run conductor final review"
    @echo "  just pipeline 1881-05-15 015    # Run full pipeline on entry"
    @echo "  just workflow-status 015        # Show workflow progress"
    @echo "  just workflow-report 015        # Generate metrics report"
    @echo ""
    @echo "Available carnets: 000-106 (3-digit IDs)"
    @echo "Available languages: _original, cz"
    @echo ""
    @echo "CULTURAL STEWARDSHIP:"
    @echo "  just stewardship-init        # Initialize stewardship directories"
    @echo "  just stewardship-queue       # View content queue"
    @echo "  just stewardship-drafts      # View draft content"
    @echo "  just stewardship-approved    # View approved content"
    @echo "  just stewardship-approve X   # Approve specific content file"
    @echo "  just stewardship-approve-all # Approve all drafts"
    @echo "  just stewardship-progress    # Show translation progress"
    @echo "  just stewardship-log         # View publish history"
    @echo "  just stewardship-archive     # Archive old posted items"
    @echo ""
    @echo "FRONTEND (Astro PWA):"
    @echo "  just fe-dev           # Start frontend dev server"
    @echo "  just fe-build         # Build frontend for production"
    @echo "  just fe-preview       # Preview production build"
    @echo "  (deploy via git push to main - automatic)"

# === CULTURAL STEWARDSHIP ===
#
# Content generation and social publishing for project outreach.
# See docs/stewardship/ for full strategy and infrastructure docs.

# Generate "This Day in Marie's Life" content
stewardship-thisday date="today":
    @echo "Generate This Day content using /stewardship skill in Claude Code"
    @echo "Invoke: /stewardship"
    @echo "Then: Generate This Day content for {{date}} in all platform formats"

# View content queue
stewardship-queue:
    @echo "=== Content Queue ==="
    @mkdir -p docs/stewardship/queue
    @ls -la docs/stewardship/queue/*.md 2>/dev/null || echo "Queue empty"

# View queue by status
stewardship-drafts:
    @echo "=== Draft Content ==="
    @grep -l "status: draft" docs/stewardship/queue/*.md 2>/dev/null || echo "No drafts"

stewardship-approved:
    @echo "=== Approved Content ==="
    @grep -l "status: approved" docs/stewardship/queue/*.md 2>/dev/null || echo "No approved content"

# Approve a specific content file
stewardship-approve file:
    @if [ -f "docs/stewardship/queue/{{file}}" ]; then \
        sed -i 's/status: draft/status: approved/' "docs/stewardship/queue/{{file}}"; \
        echo "Approved: {{file}}"; \
    else \
        echo "File not found: docs/stewardship/queue/{{file}}"; \
    fi

# Approve all drafts
stewardship-approve-all:
    @echo "Approving all draft content..."
    @for file in $(grep -l "status: draft" docs/stewardship/queue/*.md 2>/dev/null); do \
        sed -i 's/status: draft/status: approved/' "$$file"; \
        echo "Approved: $$file"; \
    done

# View published log
stewardship-log:
    @cat docs/stewardship/published.log 2>/dev/null || echo "No publish log yet"

# Generate translation progress report
stewardship-progress:
    @echo "=== Translation Progress ==="
    @echo "Source entries:"
    @find src/_original -name "*.md" -path "**/[0-9][0-9][0-9]/*" | wc -l
    @echo "Czech translations:"
    @find src/cz -name "*.md" -path "**/[0-9][0-9][0-9]/*" 2>/dev/null | wc -l
    @echo ""
    @echo "Use /stewardship skill to generate full progress report for newsletter"

# Initialize stewardship directories
stewardship-init:
    @mkdir -p docs/stewardship/queue
    @mkdir -p docs/stewardship/archive
    @touch docs/stewardship/published.log
    @echo "Stewardship directories initialized"

# Archive old queue items (posted more than 7 days ago)
stewardship-archive:
    @echo "Moving posted items to archive..."
    @mkdir -p docs/stewardship/archive
    @for file in $(grep -l "status: posted" docs/stewardship/queue/*.md 2>/dev/null); do \
        mv "$$file" docs/stewardship/archive/; \
        echo "Archived: $$(basename $$file)"; \
    done

# === FRONTEND (Astro PWA) ===

# Start frontend development server
fe-dev:
    cd frontend && npm run dev

# Build frontend for production
fe-build:
    cd frontend && npm run build

# Preview production build locally
fe-preview:
    cd frontend && npm run preview

# Install frontend dependencies
fe-install:
    cd frontend && npm install
