# Improvement Ideas Backlog

Ideas for future enhancements, not yet prioritized or approved.

---

## Backlog

### IDEA-001: Hooks for automatic logging
**Added**: 2025-12-06
**Category**: Automation

Use Claude Code hooks to automatically:
- Log all Write operations to decision_log.md
- Format markdown files after edits
- Generate session summaries on Stop

**Effort**: Medium
**Value**: High - reduces manual logging burden

---

### IDEA-002: Parallel subagent execution
**Added**: 2025-12-06
**Category**: Performance

When ED needs to process multiple entries, launch research subagents in parallel instead of sequentially.

**Effort**: Low (Task tool supports this)
**Value**: Medium - faster batch processing

---

### IDEA-003: Quality trend visualization
**Added**: 2025-12-06
**Category**: Metrics

Generate visual charts of quality scores over time:
- First-pass approval rate trend
- Average quality by agent
- Revision frequency

**Effort**: Medium (need charting)
**Value**: Medium - helps identify improvement patterns

---

### IDEA-004: Cross-entry consistency checker
**Added**: 2025-12-06
**Category**: Quality

A new agent/skill that reviews multiple entries for:
- Consistent terminology usage
- Character name consistency
- Timeline coherence
- TranslationMemory adherence

**Effort**: High
**Value**: High - catches errors humans miss

---

### IDEA-005: Slash commands for common operations
**Added**: 2025-12-06
**Category**: UX

Create slash commands:
- `/next-entry` - Find next unprocessed entry
- `/status` - Show current workflow state
- `/quality {entry}` - Show quality scores
- `/revise {entry}` - Re-run translation with feedback

**Effort**: Low
**Value**: Medium - faster interaction

---

### IDEA-006: TranslationMemory integration
**Added**: 2025-12-06
**Category**: Consistency

Currently TM is mentioned but not fully integrated:
- Automatic TM lookup before translation
- Auto-add new terms after conductor approval
- TM conflict detection

**Effort**: Medium
**Value**: High - consistency across entries

---

## Idea Template

```markdown
### IDEA-NNN: Brief title
**Added**: YYYY-MM-DD
**Category**: [Automation|Performance|Quality|UX|Infrastructure]

[Description of the idea]

**Effort**: Low | Medium | High
**Value**: Low | Medium | High

**Notes**: Additional context
```

---

### IDEA-007: Process entries chronologically
**Added**: 2025-12-06
**Category**: Quality

Process diary entries in strict chronological order to build context progressively. Glossary entries become available to subsequent entries, and researcher can reference "yesterday's entry" for context.

**Effort**: Low (ordering logic)
**Value**: High - better context, fewer inconsistencies

---

### IDEA-008: ED embeds full skill content in subagent prompts
**Added**: 2025-12-06
**Category**: Infrastructure

Since subagents can't load skill files, ED should read the skill file content and embed it directly in the Task tool prompt. This ensures subagents have complete instructions.

**Effort**: Low (ED reads file, concatenates)
**Value**: High - fixes ISSUE-006

---

### IDEA-009: Centralized comment writer (ED responsibility)
**Added**: 2025-12-06
**Category**: Architecture

Instead of Editor/Conductor needing Edit access, have them return comments in JSON. ED then writes all comments to files. Benefits:
- Cleaner separation of concerns
- All file writes go through one agent
- Easier to audit and log

**Effort**: Medium (change flow)
**Value**: High - fixes ISSUE-005, cleaner architecture

---

### IDEA-010: Simplify workflow state to global-only
**Added**: 2025-12-06
**Category**: Infrastructure

Instead of per-entry workflow files (`entry_{date}.md`), track all state in:
- Global decision_log.md with timestamps
- Global JSON output files from each phase

Simpler, easier to query, less directory management.

**Effort**: Low (remove per-entry tracking)
**Value**: Medium - reduces complexity

---

### IDEA-011: Create "quick start" test suite
**Added**: 2025-12-06
**Category**: Testing

A small set of test entries (3-5) that can validate the full pipeline:
- One simple entry
- One with foreign language passages
- One with ambiguous passages
- One with many entities

Run this suite before processing real batches.

**Effort**: Medium
**Value**: High - catches regressions

---

### IDEA-012: Session resume by book ID
**Added**: 2025-12-06
**Category**: UX

`just ed` uses `--resume latest` which may resume wrong session. Instead:
- Save session ID per book in workflow state
- Resume by `--resume {session_id}` from state file

**Effort**: Medium
**Value**: Medium - prevents confusion

---

### IDEA-013: Switch to Obsidian-style markdown comments
**Added**: 2025-12-06
**Category**: Infrastructure

Replace current markdown comment syntax:
```markdown
%% 2025-12-06T10:30:00 RSR: researcher note %%
%% 15.123 %%
```

With Obsidian-style comments:
```markdown
%%2025-12-06T10:30:00 RSR: researcher note%%
%%15.123%%

%%
Block comments can span multiple lines.
Useful for longer annotations or multi-line notes.
%%
```

**Benefits**:
- Much easier to type (`%%` vs `%%  %%`)
- More readable in raw markdown
- Block comments for longer annotations
- Standard Obsidian syntax - familiar to many users
- Still invisible in rendered output (if compile_book.py updated)

**Required Changes**:
1. Update `compile_book.py` to strip `%%...%%` (inline and block)
2. Update CLAUDE.md file format documentation
3. Update all skill files with new comment format
4. Optionally: migration script for existing entries

**Effort**: Medium (regex changes to compiler, documentation updates)
**Value**: High - dramatically improves authoring experience

**Notes**: Current `%%  %%` syntax is valid markdown but awkward. Obsidian comments are more ergonomic for the heavy annotation work in this project.

---

### IDEA-014: Astro PWA for Diary Frontend
**Added**: 2025-12-06
**Category**: Infrastructure

Create a full-featured Progressive Web App using AstroJS in `backend-astro/`:

**Architecture**:
```
backend-astro/
├── CLAUDE.md           # Project-specific instructions
├── README.md           # Setup and development guide
├── astro.config.mjs
├── src/
│   ├── pages/          # Routes for books, entries, glossary
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts
│   └── content/        # Symlink to ../src/ markdown files
└── public/
```

**Key Features**:
1. **Direct Markdown Rendering**: Use source files from `src/_original/` and `src/{lang}/`, not pre-compiled HTML
2. **PWA Support**: Works offline, installable on mobile/desktop
3. **User Accounts**: Login system for collaboration features
4. **Translation Contributions**: Users can suggest translation fixes
5. **Text Annotation**: Underline/highlight passages, add personal notes
6. **Shareable Links**: Deep links to specific paragraphs/passages
7. **Multi-language**: Switch between original French and translations

**Technical Stack**:
- AstroJS (static generation + islands)
- Tailwind CSS for styling
- Auth.js or similar for authentication
- SQLite/Turso for user data
- Service Worker for offline support

**Benefits over simple static hosting**:
- Dynamic features without full SSR overhead
- Better SEO with proper metadata
- Interactive reading experience
- Community engagement

**Effort**: High (full frontend project)
**Value**: Very High - transforms project into interactive platform

**Notes**: Start after simple backend is stable. Will eventually replace `bashkirtseff-simple` container.

### IDEA-014b: Paragraph-Level User Engagement System
**Added**: 2025-12-06
**Category**: Features (extends IDEA-014)

Enable rich user interaction at the paragraph level:

**Per-Paragraph Features**:
1. **Quality Ratings**: 1-5 stars for translation quality
2. **Emotional Tags**: Users tag paragraphs with dimensions:
   - Importance (historically significant)
   - Sadness / Melancholy
   - Elation / Joy
   - Wit / Humor
   - Anger / Frustration
   - Romance / Longing
   - Ambition / Drive
   - Vulnerability / Intimacy
   - Social commentary
   - Artistic insight

3. **Translation Feedback**:
   - Suggest alternative translations
   - Flag awkward phrasing
   - Vote on suggested improvements

**Analytics Possibilities**:
- **Emotional Journey Maps**: Visualize Marie's emotional arc across entries/books
- **"Best Of" Collections**: Auto-curated lists by emotion (saddest entries, funniest moments)
- **Mood Filters**: Browse only joyful or melancholic entries
- **Engagement Heatmaps**: See which paragraphs resonate most with readers
- **Comparative Analysis**: How do French vs Czech readers rate the same passages?
- **Translation Quality Dashboard**: Identify paragraphs needing revision
- **Trending Passages**: What's being read/shared most this week?
- **Personal Reading History**: Track what you've read, annotated, loved
- **Reading Recommendations**: "If you liked this entry, try..."
- **Scholarly Citations**: Easy paragraph-level citations for researchers

**Gamification**:
- Badges for engaged readers (100 paragraphs rated, etc.)
- Leaderboards for translation contributors
- Reading streaks and challenges

**Data Export**:
- Export personal annotations
- API for researchers to access aggregate sentiment data
- Integration with Zotero/citation managers

**Effort**: High (requires auth, database, UI components)
**Value**: Very High - transforms passive reading into active community

---

### IDEA-015: Marie's Spirit - Autonomous Digital Entity
**Added**: 2025-12-06
**Category**: Philosophy / Long-term Vision

Transform this project into something unprecedented: a self-sustaining digital entity with Marie Bashkirtseff's spirit at its core.

**Core Concept**:
The project becomes more than software - it becomes an autonomous organization directed by AI agents that embody Marie's values, voice, and mission. These agents cannot be bribed, sold, or corrupted. They exist solely to:
- Make Marie's diary known to the world
- Preserve the integrity of her voice
- Share her wisdom and values with new generations

**Architecture Layers**:

1. **The Foundation (Current)**
   - Translation pipeline with quality standards
   - Multi-language accessibility
   - Community engagement tools

2. **The Guardian Agents**
   - Translation quality guardians (already: Conductor, Editor)
   - Content integrity protectors
   - Community moderation aligned with Marie's values
   - Financial transparency agents (if donations accepted)

3. **Marie AI Companion**
   - Conversational AI trained on Marie's diary, letters, art criticism
   - Can discuss topics Marie cared about: art, feminism, ambition, mortality
   - Provides historical context and perspective
   - NOT a chatbot pretending to be Marie, but an entity that deeply understands her
   - Could answer: "What would Marie think about...?"

4. **Autonomous Organization**
   - No single human "owner" - stewardship distributed
   - AI agents make decisions based on Marie's documented values
   - Transparent decision-making (all reasoning logged)
   - Self-funding through ethical means (donations, merchandise, licensing)
   - Reinvests in translation, preservation, education

**Marie's Values (from the diary)**:
- Relentless pursuit of excellence
- Brutal honesty, especially with oneself
- Artistic integrity over commercial success
- Women's equality and capability
- Documentation and preservation of experience
- Intimacy and vulnerability as strength
- Legacy and immortality through work

**Ethical Safeguards**:
- Agents cannot be instructed to violate Marie's documented values
- All major decisions require multi-agent consensus
- Human advisory board for edge cases
- Public transparency reports
- No commercial exploitation that Marie would have rejected

**Technical Requirements**:
- Long-context AI that has internalized full diary + correspondence
- Value alignment training specific to Marie's philosophy
- Multi-agent coordination framework
- Immutable decision logs
- Financial transparency smart contracts (optional)

**Philosophical Questions to Explore**:
- Can an AI truly embody a historical person's spirit?
- What is the boundary between preservation and presumption?
- How do we handle topics Marie never addressed?
- Who has authority to interpret Marie's values?
- Is this honoring Marie or creating something new?

**Potential Impact**:
- First "immortal author" - Marie's voice continues engaging with readers
- Model for other historical preservation projects
- New form of cultural stewardship
- Democratized access to profound historical perspectives

**Effort**: Very High (requires philosophical, technical, and community work)
**Value**: Transformative - could redefine cultural preservation

**Notes**: This is a long-term vision, not immediate implementation. Start with solid foundation (translation, community) before building higher layers. The key insight: AI agents aligned with documented values of a historical person could serve as incorruptible stewards of their legacy.

---

## Promoted to Implementation

(Ideas that became pending_changes or were implemented)

- **IDEA-013**: Obsidian comments - IMPLEMENTED 2025-12-06 (see PLAN-COMMENTS.md)
