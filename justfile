# Justfile for Marie Bashkirtseff Diary Translation Project
# Common operations for carnet compilation and project management

# Set shell for Windows/WSL compatibility
set shell := ["bash", "-c"]

# Default variables
default_lang := "cz"
default_carnet := "001"

# Deploy target for server-side DB/report commands (mirrors the GitHub
# Actions deploy secrets). Set in your shell, e.g. an SSH config alias:
#   export DEPLOY_USER=deploy
#   export DEPLOY_HOST=your-host
deploy_user := env_var_or_default("DEPLOY_USER", "deploy")
deploy_host := env_var_or_default("DEPLOY_HOST", "")

# Show available commands
default:
    @just --list

# === ENVIRONMENT SETUP ===

# Install all dependencies (Node.js workspaces)
setup:
    npm install
    npm run build:shared
    @echo "Environment ready."

# Build shared TypeScript package
build-ts:
    npm run build:shared

# === GLOSSARY ===

# Find all diary entries referencing a glossary entry
glossary-find id:
    npx tsx src/scripts/glossary-refs.ts find {{id}}

# List orphaned glossary entries (not referenced anywhere)
glossary-orphaned:
    npx tsx src/scripts/glossary-refs.ts orphaned

# List missing glossary entries (referenced but don't exist)
glossary-missing:
    npx tsx src/scripts/glossary-refs.ts missing

# Show glossary usage statistics
glossary-stats:
    npx tsx src/scripts/glossary-refs.ts stats

# Search glossary entries by pattern
glossary-search pattern:
    npx tsx src/scripts/glossary-refs.ts search {{pattern}}

# Generate detailed report for a glossary entry
glossary-entry-report id:
    npx tsx src/scripts/glossary-refs.ts report {{id}}

# Move a glossary entry to a new category and update all references (use --dry-run to preview)
glossary-move id new_category *FLAGS:
    npx tsx src/scripts/glossary-move.ts {{FLAGS}} {{id}} {{new_category}}

# Merge two glossary entries (source → target, updates all refs; use --dry-run to preview)
glossary-merge source target *FLAGS:
    npx tsx src/scripts/glossary-merge.ts merge {{FLAGS}} {{source}} {{target}}

# Find potential duplicate glossary entries
glossary-duplicates:
    npx tsx src/scripts/glossary-merge.ts find-duplicates

# OBSOLETE (2026-07-06): one-shot migration completed Feb 2026 (7,650 refs); zero flat refs remain — candidate for removal
# Migrate flat-path glossary refs to categorized paths
glossary-migrate-flat *FLAGS:
    npx tsx src/scripts/glossary-migrate-flat.ts {{FLAGS}}

# Analyze glossary duplicates and generate restructure plan
glossary-dedup-analyze:
    npx tsx src/scripts/glossary-dedup.ts analyze

# Execute glossary dedup plan (use --dry-run to preview)
glossary-dedup-execute plan_file *FLAGS:
    npx tsx src/scripts/glossary-dedup.ts execute {{FLAGS}} {{plan_file}}

# Ensure all glossary entries have YAML frontmatter (use --dry-run to preview)
glossary-fm-ensure *FLAGS:
    npx tsx src/scripts/glossary-frontmatter.ts ensure {{FLAGS}}

# Auto-derive aliases from glossary headings (use --dry-run to preview)
glossary-aliases *FLAGS:
    npx tsx src/scripts/glossary-frontmatter.ts aliases {{FLAGS}}

# Set a frontmatter field on a glossary entry
glossary-fm-set id field value:
    npx tsx src/scripts/glossary-frontmatter.ts set {{id}} {{field}} '{{value}}'

# Show frontmatter for a glossary entry
glossary-fm-get id:
    npx tsx src/scripts/glossary-frontmatter.ts get {{id}}

# Add a single alias to a glossary entry
glossary-add-alias id alias:
    npx tsx src/scripts/glossary-frontmatter.ts add-alias {{id}} '{{alias}}'

# Remove a single alias from a glossary entry
glossary-remove-alias id alias:
    npx tsx src/scripts/glossary-frontmatter.ts remove-alias {{id}} '{{alias}}'

# Query glossary frontmatter (supports --field, --category, --has-field, --no-field, --json, --limit)
glossary-query *FLAGS:
    npx tsx src/scripts/glossary-frontmatter.ts query {{FLAGS}}

# Show alias coverage statistics
glossary-alias-stats:
    npx tsx src/scripts/glossary-frontmatter.ts stats

# === TAGGING ===

# Add theme tags to diary entries (use --dry-run to preview)
theme-tag *FLAGS:
    npx tsx src/scripts/theme-tagger.ts {{FLAGS}}

# Propagate ONE source glossary tag into all translations with correctly-localized paths
# (additive; never edits text/other tags; default dry-run, pass --apply to write).
# e.g. just propagate-tag --target culture/themes/MARRIAGE.md --display Marriage --apply
propagate-tag *FLAGS:
    python3 src/scripts/propagate_glossary_tag.py {{FLAGS}}

# Harvest reader-facing [^n] footnotes from a translation (default: English) into the
# French source, so future/new-language translations inherit them via the sync tool.
# Additive/idempotent; default dry-run, pass --apply to write. Confidence tiers:
#   HIGH (italic French term / end-of-paragraph), MED (--med: conservative proper-noun
#   anchor — leading def segment or its distinctive token, unique case-sensitive literal
#   match in the French prose), LOW (flagged, placed at paragraph end for review).
#   --high-only applies all deterministically anchored footnotes (HIGH+MED), skipping only
#   LOW (implies --med). --selftest validates anchoring against carnet 063 ground truth.
# e.g. just harvest-footnotes --carnet 063 --med --report .claude/reports/footnote-harvest-063.md
harvest-footnotes *FLAGS:
    python3 src/scripts/harvest_footnotes.py {{FLAGS}}

# Repair broken glossary links in translations by resolving each target's basename
# to the entry's real location (subcategory/category moves, bare-name/old styles).
# Run AFTER the path-depth fix. Default dry-run; pass --apply. e.g. just remap-glossary-links --langs fr,uk --apply
remap-glossary-links *FLAGS:
    python3 src/scripts/remap_broken_glossary_links.py {{FLAGS}}

# Show theme tag statistics without modifying files
theme-stats *FLAGS:
    npx tsx src/scripts/theme-tagger.ts --stats {{FLAGS}}

# Scan a carnet for glossary alias matches (Phase 1 auto-tagging)
glossary-scan carnet *FLAGS:
    npx tsx src/scripts/glossary-tagger.ts scan {{carnet}} {{FLAGS}}

# Generate evaluation batches for subagent review
glossary-batch carnet *FLAGS:
    npx tsx src/scripts/glossary-tagger.ts batch {{carnet}} {{FLAGS}}

# Collect evaluation results and build accept list
glossary-collect carnet *FLAGS:
    npx tsx src/scripts/glossary-tagger.ts collect {{carnet}} {{FLAGS}}

# Apply glossary tags to a carnet (use --dry-run to preview)
glossary-apply carnet *FLAGS:
    npx tsx src/scripts/glossary-tagger.ts apply {{carnet}} {{FLAGS}}

# === BUG REPORTS ===

# List open bug reports from the database
reports status="open":
    #!/usr/bin/env bash
    echo "=== Bug Reports (status: {{status}}) ==="
    ssh {{deploy_user}}@{{deploy_host}} "docker exec auth-db psql -U gotrue -d gotrue -t -c \"SELECT paragraph_id, language, reason, coalesce(custom_reason, ''), coalesce(highlighted_text, ''), status, created_at::date FROM public.paragraph_reports WHERE status = '{{status}}' ORDER BY created_at\"" 2>/dev/null | while IFS='|' read -r para lang reason custom highlight status created; do
        para=$(echo "$para" | xargs)
        lang=$(echo "$lang" | xargs)
        reason=$(echo "$reason" | xargs)
        custom=$(echo "$custom" | xargs)
        highlight=$(echo "$highlight" | xargs)
        status=$(echo "$status" | xargs)
        created=$(echo "$created" | xargs)
        [ -z "$para" ] && continue
        echo ""
        echo "  [$created] $para ($lang) — $reason"
        [ -n "$custom" ] && echo "    Note: $custom"
        [ -n "$highlight" ] && echo "    Text: \"$highlight\""
    done
    echo ""

# List all bug reports regardless of status
reports-all:
    #!/usr/bin/env bash
    echo "=== All Bug Reports ==="
    ssh {{deploy_user}}@{{deploy_host}} "docker exec auth-db psql -U gotrue -d gotrue -t -c \"SELECT paragraph_id, language, reason, coalesce(custom_reason, ''), coalesce(highlighted_text, ''), status, created_at::date FROM public.paragraph_reports ORDER BY created_at\"" 2>/dev/null | while IFS='|' read -r para lang reason custom highlight status created; do
        para=$(echo "$para" | xargs)
        lang=$(echo "$lang" | xargs)
        reason=$(echo "$reason" | xargs)
        custom=$(echo "$custom" | xargs)
        highlight=$(echo "$highlight" | xargs)
        status=$(echo "$status" | xargs)
        created=$(echo "$created" | xargs)
        [ -z "$para" ] && continue
        echo ""
        echo "  [$status] [$created] $para ($lang) — $reason"
        [ -n "$custom" ] && echo "    Note: $custom"
        [ -n "$highlight" ] && echo "    Text: \"$highlight\""
    done
    echo ""

# Update bug report status (statuses: open, acknowledged, fixed, dismissed)
report-status paragraph_id language new_status:
    #!/usr/bin/env bash
    case "{{new_status}}" in
        open|acknowledged|fixed|dismissed) ;;
        *) echo "Invalid status '{{new_status}}'. Use: open, acknowledged, fixed, dismissed"; exit 1 ;;
    esac
    result=$(ssh {{deploy_user}}@{{deploy_host}} "docker exec auth-db psql -U gotrue -d gotrue -t -c \"UPDATE public.paragraph_reports SET status = '{{new_status}}' WHERE paragraph_id = '{{paragraph_id}}' AND language = '{{language}}' RETURNING paragraph_id, status\"" 2>/dev/null)
    if echo "$result" | grep -q "{{paragraph_id}}"; then
        echo "Updated {{paragraph_id}} ({{language}}) → {{new_status}}"
    else
        echo "No report found for {{paragraph_id}} ({{language}})"
    fi

# === UTILITIES ===

# Verify all entries are properly formatted
verify:
    @echo "Verifying entry consistency..."
    @find content/_original -name "*.md" -type f | wc -l | xargs echo "Total source files:"
    @find content/cz -name "*.md" -type f | wc -l | xargs echo "Total Czech files:"

# Project status (RSR/LAN/translation progress)
status *ARGS:
    npx tsx src/scripts/project-status.ts {{ARGS}}

# Initialize source hashes in translation files (for change detection)
init-source-hashes lang="" carnet="":
    npx tsx src/scripts/hooks/init-source-hashes.ts {{lang}} {{carnet}}

# Search for text in source files (shows matching entries with links)
search query *FLAGS:
    #!/usr/bin/env bash
    echo "Searching for '{{query}}' in source files..."
    echo ""
    grep -r "{{query}}" content/_original/[0-9][0-9][0-9]/ --include="*.md" -l 2>/dev/null | sort | while read -r file; do
        carnet=$(echo "$file" | sed 's|content/_original/\([0-9]\{3\}\)/.*|\1|')
        date=$(basename "$file" .md)
        echo "  $carnet/$date  https://bashkirtseff.org/original/$carnet/$date/"
    done
    echo ""
    count=$(grep -r "{{query}}" content/_original/[0-9][0-9][0-9]/ --include="*.md" -l 2>/dev/null | wc -l)
    echo "Found in $count entries"

# Search for text in a specific language (shows matching entries with links)
search-lang query lang=default_lang:
    #!/usr/bin/env bash
    echo "Searching for '{{query}}' in {{lang}} files..."
    echo ""
    grep -r "{{query}}" content/{{lang}}/[0-9][0-9][0-9]/ --include="*.md" -l 2>/dev/null | sort | while read -r file; do
        carnet=$(echo "$file" | sed 's|content/[^/]*/\([0-9]\{3\}\)/.*|\1|')
        date=$(basename "$file" .md)
        echo "  $carnet/$date  https://bashkirtseff.org/{{lang}}/$carnet/$date/"
    done
    echo ""
    count=$(grep -r "{{query}}" content/{{lang}}/[0-9][0-9][0-9]/ --include="*.md" -l 2>/dev/null | wc -l)
    echo "Found in $count entries"

# Find files that don't contain a pattern (e.g., unannotated entries)
find-missing pattern directory:
    @echo "Finding .md files in {{directory}} that don't contain '{{pattern}}'..."
    @for file in {{directory}}/*.md; do \
        if [ -f "$file" ] && ! grep -q "{{pattern}}" "$file"; then \
            basename "$file"; \
        fi; \
    done

# Compare i18n locale files and report missing keys
i18n-diff *ARGS:
    npx tsx src/scripts/i18n-diff.ts {{ARGS}}

# Clean TypeScript build artifacts
clean-ts:
    rm -rf src/shared/dist
    @echo "Cleaned TypeScript build artifacts"

# Scaffold empty translation files for a carnet (use --dry-run to preview, --overwrite to replace)
scaffold carnet *FLAGS:
    npx tsx src/scripts/scaffold-translation.ts {{carnet}} {{FLAGS}}

# Run parser/renderer round-trip test (validates parse→render fidelity)
round-trip-test *ARGS:
    npx tsx src/scripts/round-trip-test.ts {{ARGS}}

# Debug parser/renderer round-trip for a single file
debug-roundtrip file:
    npx tsx src/scripts/debug-roundtrip.ts {{file}}

# Verify diary entries against source DOCX tomes
docx-verify *ARGS:
    uv run --with python-docx --with rapidfuzz python3 src/scripts/docx_verify.py {{ARGS}}

# Extract visible Czech text (strips frontmatter, comments, footnotes)
extract-czech *ARGS:
    bash src/scripts/extract_czech_text.sh {{ARGS}}

# Sync RSR/LAN annotations from _original/ to a translation language for a carnet (use --dry-run to preview)
sync carnet lang=default_lang *FLAGS:
    npx tsx src/scripts/sync-translation.ts {{carnet}} --lang {{lang}} {{FLAGS}}

# Sync annotations for ALL carnets in a language
sync-all lang=default_lang:
    #!/usr/bin/env bash
    echo "Syncing all carnets for language: {{lang}}"
    total_changes=0
    total_modified=0
    for carnet_dir in content/{{lang}}/[0-9][0-9][0-9]; do
        carnet=$(basename "$carnet_dir")
        if [ -d "content/_original/$carnet" ]; then
            result=$(npx tsx src/scripts/sync-translation.ts "$carnet" --lang {{lang}} 2>&1)
            modified=$(echo "$result" | grep "^Modified:" | awk '{print $2}')
            changes=$(echo "$result" | grep "^Total changes:" | awk '{print $3}')
            if [ "${changes:-0}" -gt 0 ]; then
                echo "  $carnet: $modified files, $changes changes"
                total_changes=$((total_changes + ${changes:-0}))
                total_modified=$((total_modified + ${modified:-0}))
            fi
        fi
    done
    echo ""
    echo "Total: $total_modified files modified, $total_changes changes"

# === FRONTMATTER MANAGEMENT ===

# Update calculated frontmatter fields (metrics, age, sentence counts; use --dry-run to preview)
update-frontmatter carnet *FLAGS:
    npx tsx src/scripts/update-frontmatter.ts {{FLAGS}} {{carnet}}

# Update frontmatter for all carnets
update-frontmatter-all:
    npx tsx src/scripts/update-frontmatter.ts

# Update translation frontmatter metrics
update-frontmatter-lang lang carnet:
    npx tsx src/scripts/update-frontmatter.ts --lang {{lang}} {{carnet}}


# Check for missing para_start in a specific carnet (Carnet 000 excluded - special handling)
check-para-start carnet=default_carnet:
    #!/usr/bin/env bash
    echo "Checking para_start in Carnet {{carnet}}..."
    if [ "{{carnet}}" = "000" ]; then
        echo "Carnet 000 has special handling (no frontmatter - uses inline paragraph markers)"
    else
        missing=0
        for file in content/_original/{{carnet}}/*.md; do
            case "$(basename "$file")" in _*) continue;; esac
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
    for carnet in $(ls -d content/_original/[0-9][0-9][0-9] 2>/dev/null | sort | grep -v '/000$'); do
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
        for file in content/_original/{{carnet}}/*.md; do
            case "$(basename "$file")" in _*) continue;; esac
            if grep -q "^---" "$file" && ! grep -q "^para_start:" "$file"; then
                basename "$file"
            fi
        done
    fi

# Check entries for missing or incomplete frontmatter
check-frontmatter carnet=default_carnet:
    @echo "Checking frontmatter in Carnet {{carnet}}..."
    @for file in content/_original/{{carnet}}/*.md; do \
        case "$(basename "$file")" in _*) continue;; esac; \
        if ! grep -q "^---" "$file"; then \
            echo "Missing frontmatter: $file"; \
        elif ! grep -q "marie_age:" "$file"; then \
            echo "Missing calculated fields: $file"; \
        fi \
    done

# Check that relative .md links (glossary tags, cross-refs) resolve in a translation carnet
check-links lang=default_lang carnet=default_carnet:
    #!/usr/bin/env bash
    dir="content/{{lang}}/{{carnet}}"
    if [ ! -d "$dir" ]; then
        echo "No such directory: $dir"
        exit 1
    fi
    broken=0
    checked=0
    while IFS= read -r file; do
        b=$(basename "$file")
        case "$b" in README.md|PROGRESS.md) continue;; esac
        fdir=$(dirname "$file")
        # Each markdown link whose target ends in .md (e.g. ](../../_original/_glossary/...md))
        while IFS= read -r hit; do
            ln=${hit%%:*}
            target=${hit#*:}
            target=${target#*](}    # strip leading ](
            target=${target%)}      # strip trailing )
            target=${target%%#*}    # strip #anchor
            case "$target" in
                http://*|https://*|mailto:*) continue;;
            esac
            checked=$((checked + 1))
            if [ ! -f "$fdir/$target" ]; then
                echo "  BROKEN  $b:$ln  ->  $target"
                broken=$((broken + 1))
            fi
        done < <(grep -noE '\]\([^)]+\.md[^)]*\)' "$file")
    done < <(find "$dir" -maxdepth 1 -name '*.md' | sort)
    if [ "$broken" -eq 0 ]; then
        echo "check-links {{lang}}/{{carnet}}: OK ($checked .md links resolve)"
    else
        echo "check-links {{lang}}/{{carnet}}: $broken/$checked broken (see above)"
        exit 1
    fi

# Check relative .md links across every carnet of a language (full sweep)
check-links-all lang=default_lang:
    #!/usr/bin/env bash
    echo "=== check-links sweep: content/{{lang}} ==="
    fail=0
    for dir in content/{{lang}}/[0-9][0-9][0-9]; do
        [ -d "$dir" ] || continue
        carnet=$(basename "$dir")
        just check-links {{lang}} "$carnet" || fail=1
    done
    if [ "$fail" -eq 0 ]; then
        echo "=== All carnets OK ==="
    else
        echo "=== Broken links found (see above) ==="
        exit 1
    fi

# Structural integrity gate for a translated carnet — run BEFORE RED (frontmatter,
# links, glossary path-depth, footnote integrity, %%-balance, script contamination).
# Exits non-zero on hard failures. --strict promotes warnings to failures, --quiet prints only failures.
# See docs/VERIFY_CARNET_GATE.md
verify-carnet lang carnet *FLAGS:
    npx tsx src/scripts/verify-carnet.ts {{lang}} {{carnet}} {{FLAGS}}

# Run verify-carnet across every carnet of a language (exits non-zero if any fails)
verify-carnet-all lang=default_lang *FLAGS:
    #!/usr/bin/env bash
    echo "=== verify-carnet sweep: content/{{lang}} ==="
    fail=0
    for dir in content/{{lang}}/[0-9][0-9][0-9]; do
        [ -d "$dir" ] || continue
        carnet=$(basename "$dir")
        npx tsx src/scripts/verify-carnet.ts {{lang}} "$carnet" --quiet {{FLAGS}} || fail=1
    done
    if [ "$fail" -eq 0 ]; then echo "=== All carnets PASS ==="; else echo "=== Failures found (see above) ==="; exit 1; fi

# Repo-wide broken glossary-link scan across ALL five trees (_original, cz, en, uk, fr).
# Applies correct path-depth per tree, prints per-tree counts + broken targets, and
# EXITS NON-ZERO if any link is broken (CI-usable). Use this, NOT `just sync`, for link health.
check-links-repo *FLAGS:
    python3 src/scripts/check_links_repo.py {{FLAGS}}

# Suggest existing glossary entries that might be the same entity as a missing/broken
# target (REMAP candidate suggester). Matches filename + aliases:/name: + fuzzy/substring.
# Read-only. e.g. just glossary-resolve NINA_BELLOTTI
glossary-resolve name:
    python3 src/scripts/glossary_resolve.py "{{name}}"

# === WORKSPACE ===
#
# Docker development environment with Claude Code, Gemini, code-server, and all tooling.
# See src/workspace/README.md for full documentation.

# Build and start the workspace container
workspace-up:
    cd src/workspace && docker compose up -d --build

# Stop the workspace container
workspace-down:
    cd src/workspace && docker compose down

# Attach to the workspace byobu session
workspace-attach:
    docker compose -f src/workspace/docker-compose.yml attach workspace

# Open a shell in the workspace container
workspace-shell:
    docker compose -f src/workspace/docker-compose.yml exec workspace bash

# View workspace container logs
workspace-logs:
    docker compose -f src/workspace/docker-compose.yml logs -f

# Copy your SSH public key into the running workspace container
workspace-ssh-copy key="~/.ssh/id_ed25519.pub":
    #!/usr/bin/env bash
    KEY_FILE="{{key}}"
    KEY_FILE="${KEY_FILE/#\~/$HOME}"
    if [ ! -f "$KEY_FILE" ]; then
        echo "Key file not found: $KEY_FILE"
        echo "Usage: just workspace-ssh-copy ~/.ssh/id_rsa.pub"
        exit 1
    fi
    KEY_CONTENT=$(cat "$KEY_FILE")
    docker compose -f src/workspace/docker-compose.yml exec workspace bash -c \
        "mkdir -p /root/.ssh && echo '$KEY_CONTENT' >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && /usr/sbin/sshd -p 2222 2>/dev/null; echo 'SSH key installed. Connect with: ssh root@localhost -p 2222'"

# SSH into the workspace container
workspace-ssh:
    ssh root@localhost -p 2222 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null

# === DEPLOYMENT ===
#
# Frontend deployment is AUTOMATIC via GitHub Actions:
#   - Push to main branch triggers deployment
#   - Workflow: .github/workflows/deploy.yml
#   - Site: https://bashkirtseff.org
#
# Check deployment status in GitHub Actions:
#   https://github.com/archetypal-cz/bashkirtseff/actions

# === AI TRANSLATION WORKFLOW ===
#
# OBSOLETE — candidates for removal (2026-07-06 backend-tooling review):
# This headless `claude -p` pipeline predates the current skills/agent-team
# workflow (/executive-director, background Agents, verify-carnet gate).
# content/_original/_workflow/ has been dormant since Feb 2026 (carnet-015-era
# JSONs only), and `claude --resume latest` is not valid on the current CLI.
# Kept for reference until KRR confirms removal. `workflow-status` still works
# (it just wraps project-status.ts) and is NOT obsolete.

# OBSOLETE: superseded by the /architect skill used interactively
# Start Workflow Architect session (for developing/debugging the system)
architect:
    @echo "Starting Workflow Architect session..."
    @echo "Use /architect command or load .claude/skills/workflow-architect/SKILL.md"
    claude "Load the workflow-architect skill from .claude/skills/workflow-architect/SKILL.md. You are the system architect, not a translation agent. Read the skill file completely, then ask what I want to work on."

# OBSOLETE: `claude --resume latest` is invalid on the current CLI; use the /executive-director skill
# Start Executive Director for a carnet (interactive mode)
ed carnet="015":
    @echo "Starting Executive Director for Carnet {{carnet}}..."
    claude --resume latest "You are the Executive Director. Load .claude/project_config.md and .claude/skills/executive-director/SKILL.md. Begin processing Carnet {{carnet}}. Report current status and await instructions."

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
# Run researcher on a specific entry (headless)
research entry carnet="015":
    @echo "Running researcher on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/researcher/SKILL.md. Then process entry content/_original/{{carnet}}/{{entry}}.md following those instructions. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Write,Edit,Grep,Glob,WebSearch" \
        | tee content/_original/_workflow/research_{{entry}}.json

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
# Run linguistic annotator on a specific entry (headless)
annotate entry carnet="015":
    @echo "Running linguistic annotator on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/linguistic-annotator/SKILL.md. Then process entry content/_original/{{carnet}}/{{entry}}.md following those instructions. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Edit,Write,Grep,Glob" \
        | tee content/_original/_workflow/annotate_{{entry}}.json

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
# Run translator on a specific entry (headless)
translate entry carnet="015" lang="cz":
    @echo "Running translator on {{entry}} to {{lang}}..."
    @mkdir -p content/{{lang}}/{{carnet}}
    claude -p "First, read your full instructions from .claude/skills/translator/SKILL.md. Then translate content/_original/{{carnet}}/{{entry}}.md to the target language ({{lang}}). Output to content/{{lang}}/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Edit,Write,Grep,Glob" \
        | tee content/_original/_workflow/translate_{{entry}}.json

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
# Run editor review on a translation (headless)
review entry carnet="015" lang="cz":
    @echo "Running editor review on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/editor/SKILL.md. Then review translation content/{{lang}}/{{carnet}}/{{entry}}.md against original content/_original/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        | tee content/_original/_workflow/review_{{entry}}.json

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
# Run conductor final review (headless)
conduct entry carnet="015" lang="cz":
    @echo "Running conductor final review on {{entry}}..."
    claude -p "First, read your full instructions from .claude/skills/conductor/SKILL.md. Then do final review of content/{{lang}}/{{carnet}}/{{entry}}.md against content/_original/{{carnet}}/{{entry}}.md. Return structured JSON output as specified." \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        | tee content/_original/_workflow/conduct_{{entry}}.json

# OBSOLETE: headless pipeline unused since Feb 2026; use skills/agent teams
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

# OBSOLETE: headless pipeline unused since Feb 2026; also broken ($$ PID-expansion bug in the loop)
# Batch process multiple entries (research + annotate only)
prepare-batch start end carnet="015":
    @echo "Preparing entries {{start}} to {{end}} in Carnet {{carnet}}..."
    @for entry in $(ls content/_original/{{carnet}}/ | grep -E "\.md$" | sort | sed -n '/^{{start}}/,/^{{end}}/p'); do \
        just research $${entry%.md} {{carnet}}; \
        just annotate $${entry%.md} {{carnet}}; \
    done

# Show workflow status for a carnet
workflow-status carnet="015":
    npx tsx src/scripts/project-status.ts original {{carnet}}

# OBSOLETE: targets the dormant content/_original/_workflow/ dir
# Generate workflow metrics report
workflow-report carnet="015":
    @echo "Generating workflow report for Carnet {{carnet}}..."
    claude -p "Analyze all JSON files in content/_original/_workflow/. Generate a metrics report with agent performance, quality trends, and improvement suggestions. Save to content/_original/_workflow/metrics/carnet_{{carnet}}_metrics.md" \
        --allowedTools "Read,Write,Grep,Glob"

# OBSOLETE: targets the dormant _workflow/ dir; also broken ($$confirm PID bug — always prints "Cancelled")
# Clean workflow state (careful!)
workflow-clean:
    @echo "This will delete all workflow state files. Continue? [y/N]"
    @read -r confirm && [ "$$confirm" = "y" ] && rm -rf content/_original/_workflow/*.json || echo "Cancelled"

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
    @echo "  just glossary-find ID     # Find references to a glossary entry"
    @echo "  just glossary-orphaned    # List orphaned entries (no refs)"
    @echo "  just glossary-missing     # List missing entries (broken links)"
    @echo "  just glossary-stats       # Show usage statistics"
    @echo "  just glossary-search PAT  # Search entries by pattern"
    @echo "  just glossary-entry-report ID  # Detailed report for an entry"
    @echo "  just glossary-move ID CAT      # Move entry to new category (--dry-run)"
    @echo "  just glossary-merge S T        # Merge two entries S → T (--dry-run)"
    @echo "  just glossary-duplicates       # Find potential duplicates"
    @echo "  just glossary-fm-ensure        # Ensure YAML frontmatter (--dry-run)"
    @echo "  just glossary-aliases          # Auto-derive aliases (--dry-run)"
    @echo ""
    @echo "PROJECT MANAGEMENT:"
    @echo "  just status               # Full project status (RSR/LAN/TR)"
    @echo "  just status original      # Source preparation status"
    @echo "  just status original 001  # Specific carnet"
    @echo "  just status cz            # Czech translation status"
    @echo "  just verify               # Verify file consistency"
    @echo "  just search 'term'        # Search in source files (with links)"
    @echo "  just search-lang 'term' cz  # Search in a language (with links)"
    @echo ""
    @echo "FRONTMATTER:"
    @echo "  just update-frontmatter 001             # Update metrics for carnet 001"
    @echo "  just update-frontmatter 001 --dry-run   # Preview changes"
    @echo "  just update-frontmatter-all             # Update metrics for all carnets"
    @echo "  just update-frontmatter-lang cz 001     # Update translation metrics"
    @echo ""
    @echo "TRANSLATION SCAFFOLDING:"
    @echo "  just scaffold 001              # Scaffold Czech translation files"
    @echo "  just scaffold 001 --lang en    # Scaffold for English"
    @echo "  just scaffold 001 --dry-run    # Preview changes"
    @echo ""
    @echo "DEVELOPMENT & TESTING:"
    @echo "  just build-ts              # Build TypeScript packages"
    @echo "  just clean-ts              # Clean TypeScript build artifacts"
    @echo "  just round-trip-test       # Run parser/renderer round-trip test"
    @echo "  just round-trip-test 001   # Test specific carnet"
    @echo "  just debug-roundtrip FILE  # Debug round-trip for a single file"
    @echo "  just docx-verify           # Verify entries against source DOCX"
    @echo "  just extract-czech         # Extract visible Czech text"
    @echo ""
    @echo "WORKSPACE (Docker dev environment):"
    @echo "  just workspace-up      # Build and start workspace container"
    @echo "  just workspace-down    # Stop workspace container"
    @echo "  just workspace-attach    # Attach to byobu session"
    @echo "  just workspace-shell     # Open a shell in container"
    @echo "  just workspace-ssh-copy  # Copy SSH key into container"
    @echo "  just workspace-ssh       # SSH into container"
    @echo "  just workspace-logs      # View container logs"
    @echo ""
    @echo "DEPLOYMENT (automatic on push to main):"
    @echo "  git push origin main  # Triggers GitHub Actions deploy"
    @echo "  Check status: https://github.com/archetypal-cz/bashkirtseff/actions"
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
    @echo "ANALYTICS (Umami):"
    @echo "  just analytics-up       # Start Umami analytics stack"
    @echo "  just analytics-down     # Stop analytics stack"
    @echo "  just analytics-logs     # View Umami logs"
    @echo "  just analytics-status   # Check container status"
    @echo "  just analytics-restart  # Restart after config changes"
    @echo "  Dashboard: https://analytics.bashkirtseff.org"
    @echo ""
    @echo "FRONTEND (Astro PWA):"
    @echo "  just fe-filter-index  # Build filter index for tag filtering"
    @echo "  just fe-generate-icons # Generate PWA icons"
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
    @grep -l "status: draft" docs/stewardship/queue/*.md 2>/dev/null | while IFS= read -r file; do \
        sed -i 's/status: draft/status: approved/' "$file"; \
        echo "Approved: $file"; \
    done

# View published log
stewardship-log:
    @cat docs/stewardship/published.log 2>/dev/null || echo "No publish log yet"

# Generate translation progress report
stewardship-progress:
    @echo "=== Translation Progress ==="
    @echo "Source entries:"
    @find content/_original -name "*.md" -path "**/[0-9][0-9][0-9]/*" | wc -l
    @echo "Czech translations:"
    @find content/cz -name "*.md" -path "**/[0-9][0-9][0-9]/*" 2>/dev/null | wc -l
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
    @grep -l "status: posted" docs/stewardship/queue/*.md 2>/dev/null | while IFS= read -r file; do \
        mv "$file" docs/stewardship/archive/; \
        echo "Archived: $(basename "$file")"; \
    done

# === KERNBERGER EPUB ANALYSIS ===
#
# Analyze the Kernberger English translation EPUB to identify which
# French paragraphs were included and extract images/footnotes.
# Requires: EPUB file at raw_books/Kernberger_Journal_illustrated.epub

# Shared uv dependencies for Kernberger scripts
_kernberger_deps := "--with ebooklib --with beautifulsoup4 --with lxml --with rapidfuzz"

# Analyze Kernberger EPUB structure (TOC, chapters, images, metadata)
kernberger-analyze:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py analyze

# Extract text and match to French originals by date + content
kernberger-extract:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py extract

# Extract images from Kernberger EPUB with context
kernberger-images:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py images

# Extract footnotes from Kernberger EPUB
kernberger-footnotes:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py footnotes

# Tag source files with Kernberger coverage (use --dry-run to preview)
kernberger-tag *FLAGS:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py tag {{FLAGS}}

# Extract appendices from Kernberger EPUB
kernberger-appendices:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py appendices

# Generate comprehensive Kernberger coverage report
kernberger-report:
    uv run {{_kernberger_deps}} python3 src/scripts/epub_kernberger.py report

# === 1887 CENSORED EDITION MATCHING ===
#
# Match the 1887 Charpentier/Fasquelle censored edition against our
# uncensored French originals. Tags matched paragraphs with #Censored_1887.
# Source: Internet Archive OCR text of the 1903 Fasquelle reprint.

# Parse OCR text files to extract censored edition entries
censored-parse:
    uv run --with rapidfuzz python3 src/scripts/censored_matching.py parse

# Match censored entries to French originals (paragraph-level)
censored-extract:
    uv run --with rapidfuzz python3 src/scripts/censored_matching.py extract

# Tag source files with #Censored_1887 (use --dry-run to preview)
censored-tag *FLAGS:
    uv run --with rapidfuzz python3 src/scripts/censored_matching.py tag {{FLAGS}}

# Show censored edition report status
censored-report:
    uv run --with rapidfuzz python3 src/scripts/censored_matching.py report

# === ANALYTICS (Umami) ===
#
# Cookie-free, privacy-respecting page view analytics.
# Dashboard: https://analytics.bashkirtseff.org
# See src/analytics/docker-compose.yml for setup instructions.

# Start Umami analytics stack
analytics-up:
    cd src/analytics && docker compose up -d

# Stop Umami analytics stack
analytics-down:
    cd src/analytics && docker compose down

# View Umami logs
analytics-logs:
    docker compose -f src/analytics/docker-compose.yml logs -f umami

# Restart Umami (after config changes)
analytics-restart:
    docker compose -f src/analytics/docker-compose.yml restart umami

# Check Umami status
analytics-status:
    @docker ps --filter name=umami --format "table {{{{.Names}}\t{{{{.Status}}\t{{{{.Ports}}"

# === FRONTEND (Astro PWA) ===

# Generate PWA icons from Marie's self-portrait
fe-generate-icons:
    npx tsx src/scripts/generate-pwa-icons.ts

# Build filter index JSON for frontend tag filtering
fe-filter-index:
    npx tsx src/scripts/build-filter-index.ts

# Build offline manifest JSON (commit hash, version, timestamp)
fe-offline-manifest:
    npx tsx src/scripts/build-offline-manifest.ts

# A11y: verify the WCAG contrast matrix (12 theme×brand combos, static math)
a11y-contrast:
    node src/scripts/a11y-contrast-matrix.mjs

# A11y: run axe-core against a dev server on :4407 (start one first, e.g.
# `env -u AI_AGENT -u CLAUDECODE npx astro dev --port 4407` in src/frontend).
# THEMES=light,dark just a11y-axe  for per-theme runs.
a11y-axe:
    node src/scripts/a11y-axe-run.mjs

# A11y: full CI gate — axe serious/critical budget (default 0) + %%-leak check
# across 8 page types. THEMES=light,dark BRANDS=default,atelier,deuil,riviera
# to sweep combos; BASE_URL to point at a built/preview server.
a11y:
    just a11y-contrast
    node src/scripts/a11y-audit.mjs

# Start frontend development server
fe-dev:
    cd src/frontend && npx astro dev --host

# Build frontend for production (includes filter index + offline manifest)
fe-build:
    just fe-filter-index
    just fe-offline-manifest
    cd src/frontend && npm run build

# Preview production build locally
fe-preview:
    cd src/frontend && npm run preview

# Install frontend dependencies
fe-install:
    cd src/frontend && npm install
