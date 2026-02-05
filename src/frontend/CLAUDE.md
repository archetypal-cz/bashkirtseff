# CLAUDE.md - Frontend Project

Instructions for Claude Code when working on the Bashkirtseff frontend.

---

## Project Context

This is an AstroJS Progressive Web App for reading Marie Bashkirtseff's diary. The content comes from the `../../content/` directory. This frontend focuses on:

1. Excellent reading experience
2. User engagement (notes, ratings, suggestions)
3. Community features (collections, insights)
4. Accessibility and performance

**Related Documentation**:
- [README.md](README.md) — Project overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical decisions
- [docs/FEATURES.md](docs/FEATURES.md) — Feature specifications
- [docs/PHASES.md](docs/PHASES.md) — Implementation roadmap

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | AstroJS 4.x |
| UI Islands | Vue 3 (Composition API) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | OAuth (Google, Microsoft, Facebook) |
| PWA | Workbox |
| Ads | AdSense (pluggable) |

---

## Project Structure

```
frontend/
├── CLAUDE.md              # This file
├── README.md              # Project overview
├── docs/                  # Documentation
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
├── src/
│   ├── components/        # UI components (.astro and .vue)
│   ├── layouts/           # Page layouts
│   ├── pages/             # Route pages
│   │   ├── cz/            # Czech translation routes
│   │   │   ├── index.astro          # Year overview (1873-1884)
│   │   │   ├── [year]/index.astro   # Carnets in a year
│   │   │   ├── [carnet]/index.astro # Entries in a carnet
│   │   │   ├── [carnet]/[entry].astro # Individual entry
│   │   │   ├── carnets.astro        # Flat carnet list
│   │   │   └── 000/index.astro      # Preface (special)
│   │   └── original/      # French original routes
│   ├── content/           # Content collection config
│   ├── lib/               # Utilities, content loading
│   │   └── content.ts     # getYears(), getCarnets(), etc.
│   └── styles/            # Global styles
└── public/
    ├── manifest.json
    └── sw.js
```

## URL Structure

The diary is organized for browsing by year, then carnet:

| Route | Description |
|-------|-------------|
| `/cz/` | Year overview (1873-1884) with Marie's age |
| `/cz/1873/` | Carnets from 1873 |
| `/cz/001/` | Entries in Carnet 001 |
| `/cz/001/1873-01-11` | Individual diary entry |
| `/cz/000` | Preface (special carnet) |
| `/cz/carnets` | Flat list of all carnets |
| `/original/001/1873-01-11` | French original entry |

Cross-year carnets appear in both years with visual indicators.

---

## Coding Standards

### Astro Components (.astro)

Use for:
- Static content
- Layouts
- Components that don't need client-side JS

```astro
---
// Component script (runs at build time)
import { getEntry } from 'astro:content';

const { entryId } = Astro.props;
const entry = await getEntry('entries', entryId);
---

<article class="entry">
  <h1>{entry.data.title}</h1>
  <div set:html={entry.body} />
</article>

<style>
  /* Scoped styles */
  .entry { max-width: 700px; }
</style>
```

### Vue Islands (.vue)

Use for:
- Interactive components (ratings, notes, login)
- Components that need client-side state
- Real-time features

```vue
<!-- src/components/user/RatingPanel.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';

const props = defineProps<{
  paragraphId: string;
  language: string;
}>();

const rating = ref<number | null>(null);

onMounted(async () => {
  // Load existing rating...
});

const setRating = async (value: number) => {
  rating.value = value;
  // Save to Supabase...
};
</script>

<template>
  <div class="rating-panel">
    <button
      v-for="star in 5"
      :key="star"
      @click="setRating(star)"
      :class="{ active: rating && star <= rating }"
    >
      ★
    </button>
  </div>
</template>
```

### Hydration Directives

Choose appropriate hydration:

| Directive | Use When |
|-----------|----------|
| `client:load` | Needs to work immediately (login button) |
| `client:idle` | Can wait until browser is idle (note editor) |
| `client:visible` | Only when scrolled into view (ratings) |
| `client:media` | Based on media query (mobile menu) |

```astro
<!-- Example usage -->
<LoginButton client:load />
<RatingPanel client:visible paragraphId={id} />
<NoteEditor client:idle />
```

### Tailwind CSS

Follow utility-first approach:

```astro
<!-- Good -->
<div class="max-w-2xl mx-auto px-4 py-8 prose prose-lg dark:prose-invert">
  ...
</div>

<!-- Avoid -->
<div class="my-custom-container">
  ...
</div>
```

Use `@apply` sparingly, only for repeated patterns:

```css
/* src/styles/global.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700;
  }
}
```

---

## Content Integration

### Content Collections

The diary content lives in `../../content/`. Configure collections:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const entries = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.date(),
    carnet: z.string(),
    title: z.string().optional(),
  }),
});

export const collections = { entries };
```

### Paragraph ID Handling

Extract and use paragraph IDs for:
- Anchor links
- Database references (ratings, notes)
- Deep linking

```typescript
// src/lib/content/paragraphs.ts
export interface Paragraph {
  id: string;        // "002.0145" (carnet.paragraph)
  text: string;      // The paragraph content
  position: number;  // Order in entry
}

export function extractParagraphs(content: string): Paragraph[] {
  // Parse %%XXX.YYYY%% patterns (3-digit carnet, 4-digit paragraph)
  const regex = /%%(\d{3}\.\d{4})%%/g;
  // ... implementation
}
```

### Glossary Links

Handle glossary links in content:

```typescript
// Pattern: [#Name](../_glossary/Name.md)
// Transform to: <GlossaryLink term="Name" />
```

---

## Supabase Integration

### Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Environment Variables

```
# .env (local development)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Auth Pattern

```typescript
// Login
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin }
});

// Check session
const { data: { session } } = await supabase.auth.getSession();

// Subscribe to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Update UI
});
```

### Data Operations

```typescript
// Create note
const { error } = await supabase
  .from('notes')
  .insert({
    paragraph_id: '02.0145',
    language: 'cz',
    content: 'My note...'
  });

// Get user's rating
const { data } = await supabase
  .from('ratings')
  .select('*')
  .eq('paragraph_id', '02.0145')
  .eq('language', 'cz')
  .single();

// Get aggregate stats
const { data } = await supabase
  .from('paragraph_stats')  // View
  .select('*')
  .eq('paragraph_id', '02.0145');
```

---

## PWA Implementation

### Manifest

```json
// public/manifest.json
{
  "name": "Bashkirtseff Diary",
  "short_name": "Bashkirtseff",
  "description": "Read Marie Bashkirtseff's complete diary",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF8F0",
  "theme_color": "#B45309",
  "icons": [...]
}
```

### Service Worker

Use Workbox for caching:

```javascript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache content
registerRoute(
  ({ url }) => url.pathname.startsWith('/cz/') || url.pathname.startsWith('/fr/'),
  new StaleWhileRevalidate({ cacheName: 'content' })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new CacheFirst({ cacheName: 'static' })
);
```

---

## Ad Integration

### Pluggable Architecture

```typescript
// src/lib/ads/types.ts
export interface AdProvider {
  name: string;
  init(): Promise<void>;
  renderSlot(slotId: string, size: AdSize): void;
}

// src/lib/ads/adsense.ts
export class AdSenseProvider implements AdProvider {
  async init() {
    // Load AdSense script
  }

  renderSlot(slotId: string, size: AdSize) {
    // Render ad unit
  }
}
```

### Ad Placement

```astro
---
import AdBanner from '../components/ads/AdBanner.astro';
---

<header>
  <!-- Navigation -->
</header>

<AdBanner slot="header" size="leaderboard" />

<main>
  <!-- Content -->
</main>
```

---

## Testing

### Unit Tests

```typescript
// src/lib/__tests__/paragraphs.test.ts
import { extractParagraphs } from '../content/paragraphs';

describe('extractParagraphs', () => {
  it('extracts paragraph IDs', () => {
    const content = `Some text
%%002.0145%%
More text
%%002.0146%%`;

    const paragraphs = extractParagraphs(content);
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].id).toBe('002.0145');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/reading.spec.ts
import { test, expect } from '@playwright/test';

test('can navigate to entry', async ({ page }) => {
  await page.goto('/cz/008/1873-08-11');
  await expect(page.locator('h1')).toContainText('11 août 1873');
});

test('can switch language', async ({ page }) => {
  await page.goto('/cz/008/1873-08-11');
  await page.click('[data-testid="lang-switch-fr"]');
  await expect(page).toHaveURL('/fr/008/1873-08-11');
});
```

---

## Performance Guidelines

### Bundle Size

- Keep JS under 100KB total
- Use dynamic imports for large components
- Analyze bundle with `npm run analyze`

### Core Web Vitals

Target:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### Image Optimization

Use Astro's Image component:

```astro
---
import { Image } from 'astro:assets';
import coverImage from '../assets/book-cover.jpg';
---

<Image src={coverImage} alt="Book cover" width={400} />
```

---

## Deployment

### Docker Build

```bash
# Build
docker build -t bashkirtseff-app .

# Run locally
docker run -p 3000:80 bashkirtseff-app
```

### Deployment

Deployment is **automatic** via GitHub Actions on push to main branch.

```bash
# Push to deploy
git push origin main

# Check deployment status
# https://github.com/archetypal-cz/bashkirtseff/actions
```

---

## Common Tasks

### Add New Component

1. Create component file in appropriate directory
2. Import and use in pages/layouts
3. If interactive, make it a React island with appropriate hydration

### Add New Page

1. Create `.astro` file in `src/pages/`
2. Use appropriate layout
3. Add navigation link if needed

### Add Database Table

1. Create migration in Supabase dashboard
2. Add TypeScript types in `src/lib/types.ts`
3. Add RLS policies
4. Update relevant components

### Add OAuth Provider

1. Configure in Supabase Auth settings
2. Add button to login component
3. Test complete flow

---

## Language Code Mapping

**CRITICAL**: The application uses two different language code systems:

| System | Czech | French | English | Original |
|--------|-------|--------|---------|----------|
| UI Locale (ISO 639-1) | `cs` | `fr` | `en` | N/A |
| Content Path (URLs) | `cz` | `fr` | `en` | `original` |

**Why?** URLs use `/cz/` (not `/cs/`) to avoid breaking existing links. The UI locale system uses ISO standard `cs`.

**Helper functions** (from `src/i18n/index.ts`):
```typescript
localeToContentPath('cs')  // → 'cz'
contentPathToLocale('cz')  // → 'cs'
```

**See** [docs/LOCALE_MAPPING.md](docs/LOCALE_MAPPING.md) for complete documentation.

## Troubleshooting

### Content Not Loading

1. Check paths to `../../content/` are correct
2. Verify content collection config matches file structure
3. Check for frontmatter issues in source files

### Auth Issues

1. Check Supabase project URL and key
2. Verify OAuth callback URLs in provider settings
3. Check browser console for CORS errors

### PWA Not Installing

1. Verify manifest.json is valid
2. Check service worker registration
3. Ensure HTTPS (or localhost)

---

## Design Principles

1. **Reading first**: The diary content is the star. UI fades into background.
2. **Marie's aesthetic**: Elegant, 19th century inspired, but modern and clean.
3. **Accessibility**: Works for everyone - screen readers, keyboard, high contrast.
4. **Performance**: Fast loads, especially on mobile. Optimize for emerging markets.
5. **Privacy**: Minimal tracking. Ads should be respectful.

---

## Questions?

Before starting work, review:
1. [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical decisions
2. [FEATURES.md](docs/FEATURES.md) for detailed specs
3. [PHASES.md](docs/PHASES.md) for implementation order

When in doubt, prioritize the reading experience over features.
