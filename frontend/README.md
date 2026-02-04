# Bashkirtseff Frontend

> *"Je veux tout, et tout de suite."* — Marie Bashkirtseff
>
> (I want everything, and I want it now.)

A Progressive Web App for reading Marie Bashkirtseff's complete, uncensored diary.

## Vision

Bring Marie's voice to the world through a modern, accessible reading platform that:

- **Works everywhere**: Browser, phone, tablet, desktop — installable as an app
- **Free to read**: Ad-supported, never paywalled (Marie wanted *everyone* to know her)
- **Community-powered**: Users can rate passages, suggest translations, share discoveries
- **Offline-capable**: Download books to read without internet
- **Multi-language**: Original text (multilingual: French, Russian, Italian, English...) alongside translations (Czech, French, more to come)

## Status

**Phase**: 1 (Core Reading) — In Progress

- [x] Phase 0: Foundation (mostly complete)
- [ ] Phase 1: Core Reading (in progress — basic reading works, needs polish)
- [ ] Phase 2: User Features
- [ ] Phase 3: Community
- [ ] Phase 4: Polish & Scale

**Build**: 3,578 static pages generated from diary entries.

See [docs/PHASES.md](docs/PHASES.md) for detailed implementation roadmap.

## Technical Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | **AstroJS** | Static generation + islands for interactive components |
| UI Islands | **Vue 3** | Composition API, smaller bundle than React |
| Database | **Supabase** | PostgreSQL + Auth + Realtime, generous free tier |
| Auth | **OAuth only** | Google, Microsoft, Facebook (Apple later) |
| Styling | **Tailwind CSS** | Utility-first, great DX, easy responsive |
| Ads | **AdSense** (pluggable) | Initial monetization, swappable for direct/ethical |
| PWA | **Workbox** | Service worker for offline, installability |
| Hosting | **Docker on aretea.cz** | Self-hosted, replaces current nginx container |

## Key Features

### For All Readers (No Login Required)
- Browse all books, entries, and glossary
- Switch between original text and translations
- Deep links to specific paragraphs
- Full-text search across the diary
- Responsive reading experience

### For Logged-In Users
- **Personal Notes**: Annotate any paragraph with private notes
- **Highlights**: Mark and color-code important passages
- **Translation Suggestions**: Propose better translations
- **Paragraph Ratings**: Rate translation quality (1-5 stars)
- **Emotional Tags**: Tag paragraphs with dimensions:
  - Importance (historically significant)
  - Sadness / Melancholy
  - Joy / Elation
  - Wit / Humor
  - Anger / Frustration
  - Romance / Longing
  - Ambition / Drive
  - Vulnerability / Intimacy
  - Social Commentary
  - Artistic Insight
- **Reading Progress**: Track what you've read
- **Collections**: Save favorite passages

### Community Features
- Aggregate ratings visible to all readers
- "Best Of" collections by emotion
- Trending passages
- Translation quality dashboard

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical architecture and decisions
- [FEATURES.md](docs/FEATURES.md) — Detailed feature specifications
- [PHASES.md](docs/PHASES.md) — Implementation roadmap
- [CLAUDE.md](CLAUDE.md) — Instructions for Claude Code when working on the frontend project

## Project Structure (Planned)

```
frontend/
├── README.md              # This file
├── CLAUDE.md              # Claude Code instructions
├── docs/
│   ├── ARCHITECTURE.md    # Technical decisions
│   ├── FEATURES.md        # Feature specifications
│   └── PHASES.md          # Implementation roadmap
├── astro.config.mjs       # Astro configuration
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
├── src/
│   ├── components/        # Reusable UI components
│   ├── layouts/           # Page layouts (reading, admin, etc.)
│   ├── pages/             # Routes
│   │   ├── index.astro    # Landing page
│   │   ├── [lang]/
│   │   │   └── [book]/
│   │   │       └── [entry].astro  # Entry reader
│   │   ├── glossary/      # Glossary browser
│   │   └── api/           # API routes (if needed)
│   ├── content/           # Content collections config
│   ├── lib/               # Utilities, Supabase client
│   └── styles/            # Global styles
└── public/
    ├── manifest.json      # PWA manifest
    └── sw.js              # Service worker
```

## Content Integration

The frontend reads markdown files directly from the main project:

```
../src/_original/     → Original entries (multilingual: primarily French, with Russian, Italian, English)
../src/cz/            → Czech translations
../src/fr/            → French translations (future)
../src/_original/_glossary/  → Glossary entries
```

**Routing Structure**:
- `/original/` — Original text (as Marie wrote it, in whatever languages she used)
- `/cz/` — Czech translation
- `/fr/` — (Future) French translation for French readers unfamiliar with period French

Content collections in Astro will define schemas for:
- Diary entries (date, book, paragraph IDs)
- Glossary entries (research status, last updated)
- Translations (language, source paragraph mapping)

## Getting Started (Future)

```bash
cd frontend
npm install
npm run dev
```

## Design Principles

1. **Reading first**: The diary is the star. UI should fade into the background.
2. **Marie's aesthetic**: Elegant, 19th-century inspired, but modern and clean.
3. **Accessibility**: Works for everyone — screen readers, keyboard navigation, high contrast.
4. **Performance**: Fast load times, especially on mobile. Optimize for emerging markets.
5. **Privacy-conscious**: Minimal tracking. Ads should be respectful.
6. **Community trust**: User contributions are valued and credited.

## PWA Roadmap

The site is already a PWA with basic offline support. Here's the plan for enhanced offline capabilities:

### Current State
- Using `@vite-pwa/astro` with Workbox
- Service worker caches visited entries (NetworkFirst, 30 days)
- Install prompt component exists
- **Problem**: Precache is too large (~575 MB with all pages)

### Phase 1: Fix Current PWA
- [ ] Add proper PNG icons (192x192, 512x512, maskable variants)
- [ ] Add screenshots for enhanced install prompt
- [ ] Reduce precache to app shell only (~5-10 MB)
- [ ] Keep runtime caching for visited content

### Phase 2: Selective Offline Caching
- [ ] "Download this carnet" button on carnet pages
- [ ] Offline indicator component (show when offline)
- [ ] Storage usage display in settings
- [ ] Use Cache API for user-downloaded entries

### Phase 3: Bulk Downloads (Gzipped Archives)
- [ ] Build script to generate yearly archives (`cz-1873.tar.gz`, etc.)
- [ ] Download manager UI for users to select content
- [ ] Consider OPFS (Origin Private File System) for large archives
- [ ] Same approach as [Kiwix](https://web.dev/case-studies/kiwix) for offline Wikipedia

### Estimated Sizes
| Content | Raw | Compressed |
|---------|-----|------------|
| Per year (~300 entries) | ~10-15 MB | ~3-5 MB |
| Full Czech diary | ~106 MB | ~25-35 MB |
| Full original (French) | ~151 MB | ~40-50 MB |

### References
- [Kiwix PWA Case Study](https://web.dev/case-studies/kiwix) — Offline Wikipedia approach
- [Origin Private File System](https://web.dev/articles/origin-private-file-system) — For large offline storage
- [PWA Offline Data](https://web.dev/learn/pwa/offline-data) — Storage strategies

---

*"Je serai célèbre ou je mourrai."*

(I will be famous or I will die.)

Marie exists. Let's make sure the world can read her.
