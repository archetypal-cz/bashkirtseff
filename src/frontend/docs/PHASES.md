# Implementation Phases

Step-by-step roadmap for building the Bashkirtseff PWA.

---

## Overview

```
Phase 0: Foundation          → Project setup, tooling, CI/CD
Phase 1: Core Reading        → Static content, navigation, basic PWA
Phase 2: User Features       → Auth, notes, ratings, suggestions
Phase 3: Community           → Collections, search, insights
Phase 4: Polish & Scale      → Performance, advanced features
```

---

## Phase 0: Foundation

**Goal**: Establish project structure, tooling, and deployment pipeline.

### Tasks

#### 0.1 Project Initialization
- [x] Initialize AstroJS project
- [x] Configure TypeScript
- [x] Set up Tailwind CSS
- [ ] Configure ESLint + Prettier
- [x] Create base layouts (reading, auth, admin)

#### 0.2 Content Integration
- [x] Set up Astro Content Collections
- [x] Create schema for diary entries
- [ ] Create schema for glossary entries
- [x] Symlink or copy content from `../src/`
- [x] Test content loading

#### 0.3 Basic Components
- [x] Header component (nav, placeholder login)
- [x] Footer component
- [x] Book list component
- [x] Entry list component
- [x] Basic entry display

#### 0.4 Docker Setup
- [x] Create Dockerfile
- [x] Create docker-compose.yml
- [x] Create nginx.conf
- [ ] Test local Docker build

#### 0.5 CI/CD
- [ ] GitHub Actions workflow for build
- [x] Deploy script (GitHub Actions)
- [x] Add to justfile

### Deliverables
- Running Astro dev server
- Basic navigation works
- Content loads from source files
- Docker container builds
- Deploy pipeline ready

---

## Phase 1: Core Reading Experience

**Goal**: Full reading experience without user features.

### Tasks

#### 1.1 Entry Display
- [x] Parse paragraph IDs from content
- [x] Generate anchor tags for paragraphs
- [x] Style entry headers (date, location)
- [x] Style paragraph text
- [x] Handle paragraph clustering (text + ID)

#### 1.2 Glossary Integration
- [x] Parse glossary links from content
- [x] Create glossary page routes
- [x] Implement tooltip component
- [x] Link terms to glossary pages
- [x] Paragraph menu with glossary tags

#### 1.3 Foreign Text Handling
- [x] Detect `==highlighted==` text
- [x] Style foreign phrases
- [x] Parse and display footnotes

#### 1.4 Language Switching
- [x] Route structure: `/[lang]/[book]/[entry]`
- [x] Language selector component
- [x] Preserve scroll position on switch
- [x] Show translation status per entry

#### 1.5 Navigation
- [x] Book sidebar component
- [x] Entry list within book
- [x] Previous/Next entry navigation
- [x] Breadcrumb component
- [x] "Back to top" button

#### 1.6 Reading Settings
- [x] Font size control
- [x] Dark mode toggle
- [x] Sepia mode
- [x] Store preferences locally

#### 1.7 Deep Linking
- [x] Paragraph anchor scrolling
- [x] Share button per paragraph
- [x] Copy link functionality
- [x] Highlight linked paragraph

#### 1.8 Basic PWA
- [x] Create manifest.json
- [x] Add service worker (Workbox)
- [x] Cache static assets
- [x] Install prompt

#### 1.9 Responsive Design
- [x] Mobile layout
- [x] Tablet layout
- [x] Desktop layout
- [ ] Test on real devices

### Deliverables
- Complete reading experience
- All content accessible
- Language switching works
- Deep links work
- Installable as PWA
- Responsive on all devices

---

## Phase 2: User Features

**Goal**: Authentication and core user interactions.

### Tasks

#### 2.1 Supabase Setup
- [ ] Create Supabase project
- [ ] Configure OAuth providers (Google, Microsoft, Facebook)
- [ ] Create database schema (see ARCHITECTURE.md)
- [ ] Set up Row Level Security policies
- [ ] Create Supabase client in frontend

#### 2.2 Authentication
- [ ] Login button component (island)
- [ ] OAuth flow implementation
- [ ] User profile creation on first login
- [ ] Session persistence
- [ ] Logout functionality
- [ ] User menu component

#### 2.3 Personal Notes
- [ ] Note editor component (island)
- [ ] Create note API integration
- [ ] Update note functionality
- [ ] Delete note functionality
- [ ] Note indicator on paragraphs
- [ ] Note display panel

#### 2.4 Highlighting
- [ ] Highlight color picker
- [ ] Apply highlight to paragraph
- [ ] Save highlight as note
- [ ] Display highlighted paragraphs

#### 2.5 Paragraph Ratings
- [ ] Star rating component (island)
- [ ] Save rating to database
- [ ] Update existing rating
- [ ] Show user's rating
- [ ] Calculate and show aggregate

#### 2.6 Emotional Dimensions
- [ ] Dimension slider/buttons component
- [ ] Save dimension ratings
- [ ] Show user's ratings
- [ ] Show aggregate dimensions
- [ ] "Top dimensions" display

#### 2.7 Translation Suggestions
- [ ] Suggestion form component
- [ ] Submit suggestion API
- [ ] My suggestions page
- [ ] Edit pending suggestions
- [ ] Vote on suggestions
- [ ] Vote count display

#### 2.8 Reading Progress
- [ ] Track viewed entries
- [ ] "Continue reading" button
- [ ] Reading progress indicator
- [ ] Sync across devices

#### 2.9 Ad Integration
- [ ] AdSense account setup
- [ ] Ad component abstraction
- [ ] Banner placement (header, footer)
- [ ] List ad placement
- [ ] Responsive ad sizes

### Deliverables
- Full authentication flow
- Notes and highlights working
- Ratings system complete
- Translation suggestions functional
- Ads displaying
- User data syncing

---

## Phase 3: Community Features

**Goal**: Social features and discovery.

### Tasks

#### 3.1 Collections
- [ ] Create collection UI
- [ ] Add to collection functionality
- [ ] Collection management page
- [ ] Reorder items in collection
- [ ] Export collection
- [ ] Public collection toggle (optional)

#### 3.2 Full-Text Search
- [ ] PostgreSQL full-text search setup
- [ ] Search API endpoint
- [ ] Search UI component
- [ ] Results page with snippets
- [ ] Filters (language, book, date range)
- [ ] Highlight matches

#### 3.3 Public Insights
- [ ] Most-read entries calculation
- [ ] Highest-rated passages
- [ ] Trending collections
- [ ] Insights dashboard page
- [ ] Emotional journey visualization

#### 3.4 Personal Stats
- [ ] Entries read count
- [ ] Books completed
- [ ] Notes/ratings count
- [ ] Reading streak
- [ ] Stats page

#### 3.5 Advanced Offline
- [ ] Download entire book
- [ ] Offline queue for actions
- [ ] Sync indicator
- [ ] "Sync now" button
- [ ] Clear cached content

#### 3.6 Glossary Browser
- [ ] Alphabetical index
- [ ] Category filters
- [ ] Search within glossary
- [ ] Related entries
- [ ] Diary appearances list

### Deliverables
- Collections feature complete
- Full-text search working
- Public insights available
- Personal stats dashboard
- Robust offline support
- Complete glossary experience

---

## Phase 4: Polish & Scale

**Goal**: Performance optimization, advanced features, sustainability.

### Tasks

#### 4.1 Performance Optimization
- [ ] Image optimization (Astro Image)
- [ ] Font subsetting
- [ ] Critical CSS extraction
- [ ] Lazy loading non-critical JS
- [ ] Lighthouse audit and fixes
- [ ] Core Web Vitals monitoring

#### 4.2 Apple Sign-In
- [ ] Apple Developer account
- [ ] Configure OAuth in Supabase
- [ ] Add Apple login button
- [ ] Test on iOS

#### 4.3 Advanced Search
- [ ] Algolia or Meilisearch integration
- [ ] Fuzzy matching
- [ ] Synonym support
- [ ] Search suggestions

#### 4.4 Admin Features
- [ ] Suggestion review queue
- [ ] Approve/reject flow
- [ ] User moderation
- [ ] Content stats dashboard

#### 4.5 Export Features
- [ ] Export notes as Markdown
- [ ] Export collections
- [ ] Generate PDF (entries)
- [ ] Generate EPUB (books)

#### 4.6 Research API
- [ ] Public API design
- [ ] Authentication (API keys)
- [ ] Rate limiting
- [ ] Documentation (Swagger/OpenAPI)

#### 4.7 Ad Alternatives
- [ ] Ethical Ads integration
- [ ] Direct ad management
- [ ] Subscription option
- [ ] Donation integration

#### 4.8 Analytics
- [ ] Privacy-friendly analytics (Plausible/Umami)
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Alerting setup

### Deliverables
- Performance targets met
- Apple Sign-In available
- Advanced search working
- Admin tools functional
- Export features available
- Sustainable revenue model

---

## Milestone Definitions

### M0: Project Ready
- Astro project builds
- Content loads
- Docker deploys
- CI/CD works

### M1: Public Reading
- All entries readable
- Language switching works
- PWA installable
- Responsive design complete

### M2: User Engagement
- Login works
- Notes/ratings functional
- Suggestions submittable
- Ads live

### M3: Community Live
- Search works
- Collections available
- Insights visible
- Stats tracking

### M4: Production Ready
- Performance optimized
- All OAuth providers
- Admin tools
- Sustainable model

---

## Dependencies

```
Phase 0 ─────► Phase 1 ─────► Phase 2 ─────► Phase 3 ─────► Phase 4
                  │               │               │
                  │               │               └── Search needs content
                  │               │
                  │               └── User features need auth
                  │
                  └── Reading needs content
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase downtime | Design for graceful degradation |
| AdSense rejection | Have ethical ads as backup |
| Content parsing issues | Comprehensive test suite |
| Performance problems | Budget and monitor from start |
| OAuth provider issues | Multiple providers, no single point of failure |

---

## Definition of Done

Each phase is complete when:
- [ ] All tasks checked off
- [ ] Tests passing
- [ ] Deployed to production
- [ ] Documented
- [ ] No critical bugs
- [ ] Performance targets met
