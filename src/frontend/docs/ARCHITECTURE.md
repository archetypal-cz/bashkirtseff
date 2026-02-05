# Architecture

Technical architecture and decisions for the Bashkirtseff frontend.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Astro PWA                              │  │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────────┐  │  │
│  │  │ Static  │  │  Islands    │  │   Service Worker      │  │  │
│  │  │  Pages  │  │  (Vue 3)    │  │   (Offline cache)     │  │  │
│  │  └─────────┘  └─────────────┘  └───────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  PostgreSQL │  │      Realtime           │  │
│  │   (OAuth)   │  │   (Data)    │  │   (Live updates)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Content (Static)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Original   │  │ Translations│  │       Glossary          │  │
│  │(multilingual)│  │  (CZ, FR...)│  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Decisions

### 1. Framework: AstroJS

**Decision**: Use AstroJS 4.x with islands architecture.

**Rationale**:
- **Static-first**: Most content is static (diary entries don't change often)
- **Islands**: Only interactive components (ratings, notes) ship JavaScript
- **Content Collections**: First-class markdown support with schemas
- **SSR when needed**: Can add server endpoints for API routes
- **Small bundle size**: Ship minimal JS for reading-focused experience

**Alternatives Considered**:
- Next.js: Heavier, more SSR-focused than we need
- SvelteKit: Great but smaller ecosystem
- Nuxt: Full Vue framework, but Astro's island architecture is better for content-first sites

### 1b. UI Islands: Vue 3

**Decision**: Use Vue 3 with Composition API for interactive components.

**Rationale**:
- **Smaller bundle**: Vue 3 is lighter than React
- **Composition API**: Clean, reusable logic with `<script setup>`
- **Great DX**: Single-file components, excellent TypeScript support
- **Familiar patterns**: Options API available if needed

### 2. Database: Supabase

**Decision**: Use Supabase for all user data.

**Rationale**:
- **PostgreSQL**: Full SQL power, reliable, scalable
- **Built-in Auth**: OAuth providers out of the box
- **Row Level Security**: Fine-grained access control
- **Realtime**: Live updates for collaborative features
- **Free tier**: Generous for starting out
- **Self-hostable**: Can migrate to own infrastructure later

**Data Model** (see [Database Schema](#database-schema) below)

### 3. Authentication: OAuth Only

**Decision**: No email/password, only OAuth providers.

**Providers** (in order of priority):
1. Google
2. Microsoft
3. Facebook
4. Apple (later — requires paid Apple Developer account)

**Rationale**:
- Simpler UX (no password management)
- No password reset flows to build
- Supabase handles all OAuth complexity
- Users already have these accounts

### 4. Styling: Tailwind CSS

**Decision**: Use Tailwind CSS with custom design tokens.

**Rationale**:
- Fast development with utility classes
- Easy responsive design
- Small production bundle (purges unused)
- Great integration with Astro

**Design System**:
- Custom color palette (19th century inspired, elegant)
- Typography scale optimized for reading
- Component variants for interactive elements

### 5. Ads: Pluggable Architecture

**Decision**: Start with AdSense, but design for easy switching.

**Architecture**:
```typescript
// src/lib/ads/provider.ts
export interface AdProvider {
  name: string;
  init(): Promise<void>;
  renderBanner(slot: string): HTMLElement;
  renderInline(slot: string): HTMLElement;
}

// Implementations
export class AdSenseProvider implements AdProvider { ... }
export class DirectAdProvider implements AdProvider { ... }
export class EthicalAdsProvider implements AdProvider { ... }
```

**Ad Placements**:
- Between carnet navigation and content (non-intrusive banner)
- Between entries in list view
- Never interrupting the reading flow within an entry

**Privacy**: Use Supabase to track ad impressions anonymously (no third-party cookies beyond AdSense requirements).

### 6. PWA: Service Worker with Workbox

**Decision**: Full PWA with offline support.

**Features**:
- **Install prompt**: Encourage users to install
- **Offline reading**: Cache viewed entries
- **Background sync**: Queue ratings/notes when offline
- **Push notifications**: (Future) New translation alerts

**Caching Strategy**:
- App shell: Cache-first (CSS, JS, layouts)
- Content: Network-first with cache fallback
- User data: Network-only (realtime from Supabase)
- Images: Cache-first with long expiration

### 7. Hosting: Docker Self-Hosted

**Decision**: Self-host on private server as Docker container.

**Note**: The Astro PWA runs as `bashkirtseff-app` container behind Nginx Proxy Manager at `bashkirtseff.org`.

**Architecture**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Container name**: `bashkirtseff-app` (distinct from `bashkirtseff-simple`)

**Why self-host vs Vercel/Cloudflare**:
- Existing infrastructure
- Full control over caching, headers
- No vendor lock-in
- Can add server-side features if needed
- Keep costs predictable

**Reverse proxy**: Nginx Proxy Manager handles SSL, domain routing. New proxy host will be configured for the Astro container.

---

## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'cz',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notes on paragraphs
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,  -- Format: "002.0145" (carnet.paragraph)
  language TEXT NOT NULL,       -- Which translation they're annotating
  content TEXT NOT NULL,
  highlight_color TEXT,         -- Optional highlight color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, paragraph_id, language)
);

-- Paragraph ratings (quality + emotional dimensions)
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  language TEXT NOT NULL,

  -- Quality rating (1-5 stars, NULL if not rated)
  quality_rating SMALLINT CHECK (quality_rating BETWEEN 1 AND 5),

  -- Emotional dimensions (each 0-5, 0 = not applicable)
  importance SMALLINT DEFAULT 0 CHECK (importance BETWEEN 0 AND 5),
  sadness SMALLINT DEFAULT 0 CHECK (sadness BETWEEN 0 AND 5),
  joy SMALLINT DEFAULT 0 CHECK (joy BETWEEN 0 AND 5),
  wit SMALLINT DEFAULT 0 CHECK (wit BETWEEN 0 AND 5),
  anger SMALLINT DEFAULT 0 CHECK (anger BETWEEN 0 AND 5),
  romance SMALLINT DEFAULT 0 CHECK (romance BETWEEN 0 AND 5),
  ambition SMALLINT DEFAULT 0 CHECK (ambition BETWEEN 0 AND 5),
  vulnerability SMALLINT DEFAULT 0 CHECK (vulnerability BETWEEN 0 AND 5),
  social_commentary SMALLINT DEFAULT 0 CHECK (social_commentary BETWEEN 0 AND 5),
  artistic_insight SMALLINT DEFAULT 0 CHECK (artistic_insight BETWEEN 0 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, paragraph_id, language)
);

-- Translation suggestions
CREATE TABLE translation_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  source_language TEXT NOT NULL,  -- Usually 'fr'
  target_language TEXT NOT NULL,

  original_text TEXT NOT NULL,    -- Current translation
  suggested_text TEXT NOT NULL,   -- User's suggestion
  rationale TEXT,                 -- Why this is better

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewer_notes TEXT,            -- Admin feedback
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),

  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes on translation suggestions
CREATE TABLE suggestion_votes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES translation_suggestions(id) ON DELETE CASCADE,
  vote SMALLINT CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY(user_id, suggestion_id)
);

-- Reading progress
CREATE TABLE reading_progress (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  carnet TEXT NOT NULL,           -- 3-digit carnet ID (e.g., "001")
  last_entry TEXT NOT NULL,       -- Date of last read entry
  last_paragraph TEXT,            -- Specific paragraph ID
  language TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY(user_id, carnet, language)
);

-- User collections (saved passages)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_items (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  language TEXT NOT NULL,
  note TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY(collection_id, paragraph_id, language)
);
```

### Aggregate Views

```sql
-- Aggregate ratings per paragraph (for public display)
CREATE VIEW paragraph_stats AS
SELECT
  paragraph_id,
  language,
  COUNT(*) as total_ratings,
  AVG(quality_rating) as avg_quality,
  AVG(NULLIF(importance, 0)) as avg_importance,
  AVG(NULLIF(sadness, 0)) as avg_sadness,
  AVG(NULLIF(joy, 0)) as avg_joy,
  AVG(NULLIF(wit, 0)) as avg_wit,
  AVG(NULLIF(anger, 0)) as avg_anger,
  AVG(NULLIF(romance, 0)) as avg_romance,
  AVG(NULLIF(ambition, 0)) as avg_ambition,
  AVG(NULLIF(vulnerability, 0)) as avg_vulnerability,
  AVG(NULLIF(social_commentary, 0)) as avg_social,
  AVG(NULLIF(artistic_insight, 0)) as avg_artistic
FROM ratings
GROUP BY paragraph_id, language;
```

### Row Level Security

```sql
-- Users can only see their own notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own ratings (but aggregates are public)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own ratings" ON ratings
  FOR ALL USING (auth.uid() = user_id);

-- Suggestions are public to read, but only creator can edit
ALTER TABLE translation_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suggestions are readable by all" ON translation_suggestions
  FOR SELECT USING (true);
CREATE POLICY "Users can create suggestions" ON translation_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending suggestions" ON translation_suggestions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
```

---

## Content Integration

### Astro Content Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const entries = defineCollection({
  type: 'content',
  schema: z.object({
    // Extracted from frontmatter or filename
    date: z.date(),
    carnet: z.string(),
    title: z.string().optional(),
    location: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const glossary = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    research_status: z.enum(['basic', 'moderate', 'comprehensive']),
    last_updated: z.date().optional(),
    diary_coverage: z.string().optional(),
  }),
});

export const collections = { entries, glossary };
```

### Paragraph ID Extraction

The compiler already assigns paragraph IDs (e.g., `%%002.0145%%`). The frontend will:

1. Parse these IDs during build
2. Generate anchor tags for deep linking
3. Map IDs to database records for ratings/notes

```typescript
// src/lib/content/parseEntry.ts
export function extractParagraphs(content: string): Paragraph[] {
  const regex = /%%(\d{3}\.\d{4})%%/g;
  // ... extract paragraph text and IDs
}
```

---

## Component Architecture

### Core Components

```
src/components/
├── layout/
│   ├── Header.astro          # Nav, language switcher, login
│   ├── Footer.astro          # Links, copyright, ad slot
│   └── Sidebar.astro         # Carnet navigation, TOC
│
├── reading/
│   ├── EntryHeader.astro     # Date, location, tags
│   ├── Paragraph.astro       # Single paragraph with interactions
│   ├── ParagraphActions.vue  # Island: rating, note, highlight
│   ├── GlossaryLink.astro    # Popup on hover
│   └── ForeignText.astro     # Highlighted foreign phrases
│
├── user/
│   ├── LoginButton.vue       # Island: OAuth login
│   ├── UserMenu.vue          # Island: Profile dropdown
│   ├── NoteEditor.vue        # Island: Create/edit notes
│   └── RatingPanel.vue       # Island: Star rating + dimensions
│
├── community/
│   ├── SuggestionForm.vue    # Island: Submit translation fix
│   ├── SuggestionList.vue    # Island: View/vote on suggestions
│   └── ParagraphStats.astro  # Aggregate ratings display
│
├── ads/
│   ├── AdBanner.astro        # Banner ad slot
│   └── AdInline.astro        # In-content ad slot
│
└── common/
    ├── Modal.vue             # Reusable modal
    ├── Tooltip.vue           # Reusable tooltip
    └── Icon.astro            # Icon component
```

### Island Hydration Strategy

| Component | Hydration | Rationale |
|-----------|-----------|-----------|
| ParagraphActions | `client:visible` | Only load when scrolled into view |
| LoginButton | `client:load` | Needed immediately for auth state |
| NoteEditor | `client:idle` | Load after main content |
| RatingPanel | `client:visible` | Only when user interacts |
| SuggestionForm | `client:idle` | Not critical path |

---

## Performance Budget

| Metric | Target | Rationale |
|--------|--------|-----------|
| First Contentful Paint | < 1.5s | Fast initial render |
| Largest Contentful Paint | < 2.5s | Main content visible quickly |
| Time to Interactive | < 3.5s | Islands can wait |
| Total Bundle Size (JS) | < 100KB | Minimal JS for reading |
| Lighthouse Score | > 90 | All categories |

### Optimization Strategies

1. **Static Generation**: Pre-render all entry pages at build time
2. **Image Optimization**: Use Astro's built-in image optimization
3. **Font Loading**: Subset fonts, use `font-display: swap`
4. **Code Splitting**: Islands are lazy-loaded
5. **Caching**: Aggressive caching for static assets

---

## Security Considerations

1. **Auth**: All handled by Supabase, no custom auth code
2. **RLS**: All database access goes through Supabase RLS
3. **Input Sanitization**: All user content sanitized before display
4. **CSP**: Strict Content Security Policy (allow AdSense)
5. **CORS**: API endpoints only accept same-origin requests
6. **Rate Limiting**: Supabase handles rate limits

---

## Monitoring & Analytics

### Privacy-First Analytics

- **Plausible** or **Umami**: Privacy-friendly, no cookies
- Track: Page views, reading progress, feature usage
- Don't track: Personal data, detailed behavior

### Error Monitoring

- **Sentry**: For JavaScript errors
- Log to console in development
- Alert on critical errors

### Performance Monitoring

- **Web Vitals**: Track Core Web Vitals
- Lighthouse CI in GitHub Actions
- Alert on performance regressions

---

## Future Considerations

### Potential Enhancements

1. **Full-text search**: Algolia or Meilisearch integration
2. **Export**: PDF/EPUB generation for offline reading
3. **API**: Public API for researchers
4. **i18n**: UI in multiple languages (not just content)
5. **Notifications**: Push notifications for new translations

### Scaling

- Supabase can scale to millions of users
- Static hosting is infinitely scalable
- Consider edge caching (Cloudflare) if needed
- Database can be migrated to dedicated PostgreSQL if needed

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-08 | AstroJS over Next.js | Static-first, smaller bundles |
| 2025-12-08 | Supabase over Firebase | PostgreSQL, better RLS, self-hostable |
| 2025-12-08 | OAuth only | Simpler, better UX, no password headaches |
| 2025-12-08 | Self-host over Vercel | Existing infrastructure, full control |
| 2025-12-08 | Pluggable ads | Future flexibility for ethical ads |
| 2025-12-08 | `/original/` route | Original is multilingual (FR, RU, IT, EN...), not just French. `/fr/` reserved for future French translation |
