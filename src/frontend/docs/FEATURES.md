# Feature Specifications

Detailed specifications for all frontend features.

---

## Table of Contents

1. [Reading Experience](#1-reading-experience)
2. [Authentication](#2-authentication)
3. [Personal Notes](#3-personal-notes)
4. [Paragraph Ratings](#4-paragraph-ratings)
5. [Translation Suggestions](#5-translation-suggestions)
6. [Collections](#6-collections)
7. [Search](#7-search)
8. [PWA Features](#8-pwa-features)
9. [Advertising](#9-advertising)
10. [Glossary](#10-glossary)
11. [Analytics & Insights](#11-analytics--insights)

---

## 1. Reading Experience

### 1.1 Book Navigation

**Description**: Users can browse books chronologically or by date.

**UI Elements**:
- Sidebar with book list (00-16)
- Book covers/headers with date ranges
- "Continue reading" button (uses localStorage reading history, no login required)

**Behavior**:
- Books sorted chronologically
- Each book shows: title, date range, entry count, translation status
- Click to expand book → see list of entries

### 1.2 Entry Display

**Description**: Individual diary entries rendered for comfortable reading.

**UI Elements**:
- Date header (French format: "Lundi, 11 août 1873")
- Location tag (if known)
- Entry text with paragraph breaks
- Paragraph IDs as subtle anchors
- Glossary links as interactive elements
- Foreign text highlighted with footnotes

**Responsive Behavior**:
- Desktop: Max-width ~700px for readability, centered
- Tablet: Full-width with comfortable margins
- Mobile: Full-width with minimal margins, larger touch targets

### 1.3 Language Switching

**Description**: Toggle between French original and translations.

**UI Elements**:
- Language selector in header (FR | CZ | ...)
- "View original" link on translated paragraphs
- Side-by-side view option (desktop only)

**Behavior**:
- Preserve scroll position when switching
- Show translation status per entry ("translated", "in review", "untranslated")
- For untranslated entries, show French with note

### 1.4 Deep Linking

**Description**: Link directly to specific paragraphs.

**URL Format**:
```
/cz/02/1873-08-11#02.0145
/fr/02/1873-08-11#02.0145
```

**Behavior**:
- Paragraph scrolls into view and highlights briefly
- Share button on each paragraph generates URL
- Meta tags update for social sharing

### 1.5 Typography & Reading Comfort

**Settings** (stored locally, sync for logged-in users):
- Font size (Small, Medium, Large, XL)
- Line height (Compact, Normal, Relaxed)
- Font family (Serif, Sans-serif)
- Dark mode toggle
- Sepia mode for reduced eye strain

---

## 2. Authentication

### 2.1 OAuth Providers

**Supported Providers**:
1. Google
2. Microsoft
3. Facebook
4. Apple (Phase 2 — requires paid developer account)

**Flow**:
1. User clicks "Sign in" button
2. Provider selection modal
3. Redirect to OAuth provider
4. Return with token
5. Supabase creates/updates user record
6. Profile populated from OAuth data

### 2.2 User Profile

**Data from OAuth**:
- Display name
- Email (for account recovery only)
- Avatar URL

**User-Editable**:
- Display name override
- Preferred language
- Reading preferences

### 2.3 Session Management

**Behavior**:
- Sessions persist across browser restarts
- "Remember me" default on
- Logout clears local data
- Multi-device sync via Supabase

---

## 3. Personal Notes

### 3.1 Creating Notes

**Trigger**: Click note icon on any paragraph (logged-in users only)

**UI**:
- Floating panel anchored to paragraph
- Rich text editor (basic formatting: bold, italic, links)
- "Save" and "Cancel" buttons
- Character limit: 5000

**Behavior**:
- Auto-save draft locally
- Sync to Supabase on save
- Show "saving..." indicator

### 3.2 Note Display

**Visibility**: Notes are private to the user

**UI**:
- Small icon on paragraphs with notes
- Click to expand/collapse
- Edit button on expanded view

### 3.3 Highlighting

**Description**: Visual highlight without text note

**Options**:
- Yellow (default)
- Green
- Blue
- Pink
- Purple

**Behavior**:
- Click highlight icon → select color
- Paragraph background changes
- Stored as note with `highlight_color` only

### 3.4 Note Export

**Format**: Markdown file with all user notes

**Structure**:
```markdown
# My Notes on Marie Bashkirtseff's Diary

## Book 02: 1873

### August 11, 1873

**Paragraph 02.0145**:
> [Original text snippet...]

My note: This passage reminds me of...

---
```

---

## 4. Paragraph Ratings

### 4.1 Quality Rating

**Description**: Rate translation quality (Czech or other translations)

**Scale**: 1-5 stars

**UI**:
- Star icons below paragraph
- Click to set rating
- Hover shows "Rate translation quality"

**Constraints**:
- Only on translated content (not French original)
- One rating per user per paragraph per language
- Can update anytime

### 4.2 Emotional Dimensions

**Description**: Tag paragraphs with emotional/thematic qualities

**Dimensions** (each 0-5 scale):

| Dimension | Description | Example |
|-----------|-------------|---------|
| **Importance** | Historically significant | Key life events, major decisions |
| **Sadness** | Melancholy, grief, loss | Illness reflections, heartbreak |
| **Joy** | Elation, happiness | Successes, celebrations |
| **Wit** | Humor, clever observations | Sarcastic comments, wordplay |
| **Anger** | Frustration, indignation | Social injustice, personal slights |
| **Romance** | Love, longing, desire | Crushes, romantic musings |
| **Ambition** | Drive, determination | Career goals, artistic aspirations |
| **Vulnerability** | Intimacy, raw honesty | Self-doubt, fears, confessions |
| **Social Commentary** | Observations on society | Class, gender, politics |
| **Artistic Insight** | Art criticism, creative process | Painting technique, aesthetic theory |

**UI**:
- Expandable panel below quality rating
- Slider or button group for each dimension
- "Not applicable" (0) as default
- Show community average next to user's rating

### 4.3 Aggregate Display

**Public View** (all readers):
- Average quality rating (stars)
- Top 3 emotional dimensions
- Number of ratings

**Presentation**:
```
★★★★☆ (4.2) • 47 ratings
📊 High: Ambition, Wit, Artistic Insight
```

---

## 5. Translation Suggestions

### 5.1 Submitting Suggestions

**Trigger**: "Suggest improvement" button on any translated paragraph

**UI**:
- Modal with:
  - Original French text (read-only)
  - Current translation (read-only)
  - Suggested translation (editable textarea)
  - Rationale (optional textarea)
  - Submit button

**Constraints**:
- Logged-in users only
- One pending suggestion per paragraph per user
- Can edit pending suggestions
- Max 10,000 characters per suggestion

### 5.2 Suggestion Review (User View)

**My Suggestions Page**:
- List of all submitted suggestions
- Status: Pending, Approved, Rejected, Duplicate
- Reviewer notes (if any)
- Edit button (pending only)

### 5.3 Community Voting

**UI**:
- Upvote/downvote buttons on each suggestion
- Vote count visible to all
- User can change their vote

**Behavior**:
- High-voted suggestions surfaced to translation team
- Negative votes don't hide (transparency)

### 5.4 Admin Review (Future)

**Admin Panel**:
- Queue of pending suggestions
- Approve → integrates into workflow
- Reject → with reason
- Mark as duplicate
- Batch operations

---

## 6. Collections

### 6.1 Creating Collections

**Description**: Save favorite passages into named collections

**UI**:
- "Save to collection" button on paragraphs
- Create new collection or add to existing
- Collection name and optional description

**Examples**:
- "Marie on Art"
- "Heartbreaking Moments"
- "Favorite Quotes"

### 6.2 Managing Collections

**My Collections Page**:
- List of all collections
- Reorder items within collection
- Add notes to saved items
- Delete items or entire collections
- Export collection as markdown

### 6.3 Public Collections (Optional)

**Description**: Share collections publicly

**Features**:
- Toggle collection visibility
- Public URL for sharing
- Clone public collections

---

## 7. Search

### 7.1 Full-Text Search

**Scope**: All entries in selected language

**UI**:
- Search box in header
- Results page with snippets
- Highlight matching text

**Filters**:
- Language
- Book/date range
- Only entries with my notes
- Minimum rating

### 7.2 Search Implementation

**Phase 1**: Basic browser search (limited to current book)
**Phase 2**: Server-side PostgreSQL full-text search
**Phase 3**: Algolia/Meilisearch for advanced search

---

## 8. PWA Features

### 8.1 Installation

**Prompt**: Show install banner after 2+ sessions

**UI**:
- "Add to Home Screen" banner
- Dismissible, don't show again option

### 8.2 Offline Reading

**Description**: View previously read entries offline

**Behavior**:
- Cache viewed entries automatically
- "Download book" option for explicit caching
- Clear indicator when offline
- Queue actions (ratings, notes) for sync

### 8.3 Offline Indicator

**UI**:
- Banner when offline: "You're offline. Some features unavailable."
- Sync status icon
- "Sync now" button when back online

---

## 9. Advertising

### 9.1 Ad Placements

**Locations**:
1. **Header banner**: Below navigation, above content (728x90 or responsive)
2. **Between entries**: In list view only, every 5 entries
3. **Footer**: Above site footer (728x90 or responsive)

**NOT in**:
- Middle of entry text
- Paragraph hover states
- Modals or panels

### 9.2 Ad Experience

**Principles**:
- Non-intrusive
- Clearly labeled as advertising
- No auto-playing video
- No pop-ups or interstitials

**Responsive**:
- Mobile: Single banner, smaller sizes
- Desktop: Standard IAB sizes

### 9.3 Ad-Free Option (Future)

**Description**: Support the project, remove ads

**Options**:
- Monthly subscription
- Annual subscription
- Lifetime (one-time)

---

## 10. Glossary

### 10.1 Glossary Browser

**Description**: Browse all people, places, and concepts

**UI**:
- Alphabetical index
- Category filters (People, Places, Events, Concepts)
- Search within glossary

### 10.2 Inline Glossary Links

**Description**: Hoverable links in entry text

**UI**:
- Underlined or subtly highlighted terms
- Hover → tooltip with summary
- Click → full glossary page

### 10.3 Glossary Entry Page

**Content**:
- Name and category
- Research status badge
- Summary
- Diary appearances (linked)
- Historical context
- Sources/references

---

## 11. Analytics & Insights

### 11.1 Public Insights

**Description**: Aggregate data visible to all

**Examples**:
- "Most-read entries this week"
- "Highest-rated passages"
- "Emotional journey through Book 02"
- "Trending collections"

### 11.2 Personal Stats (Logged-in)

**Description**: User's reading statistics

**Data**:
- Entries read
- Books completed
- Notes created
- Ratings given
- Reading streak

### 11.3 Research API (Future)

**Description**: Anonymized data for scholars

**Endpoints**:
- Aggregate ratings by entry/book
- Emotional dimension averages
- Translation quality metrics
- Reading patterns (anonymized)

---

## Feature Priority Matrix

| Feature | Priority | Phase | Complexity |
|---------|----------|-------|------------|
| Entry display | P0 | 1 | Low |
| Book navigation | P0 | 1 | Low |
| Language switching | P0 | 1 | Medium |
| Deep linking | P0 | 1 | Low |
| OAuth login | P0 | 1 | Medium |
| Personal notes | P0 | 1 | Medium |
| Paragraph ratings | P0 | 1 | Medium |
| Emotional dimensions | P1 | 1 | Medium |
| Translation suggestions | P1 | 1 | High |
| PWA installation | P1 | 1 | Medium |
| Offline reading | P1 | 2 | High |
| Full-text search | P1 | 2 | High |
| Collections | P2 | 2 | Medium |
| Ad integration | P1 | 1 | Medium |
| Glossary browser | P1 | 1 | Medium |
| Public insights | P2 | 2 | Medium |
| Personal stats | P2 | 2 | Low |
| Research API | P3 | 3 | High |

---

## Non-Functional Requirements

### Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse Performance > 90

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

### Internationalization
- UI strings externalized
- RTL support (future)
- Date/number formatting per locale

### Security
- All data over HTTPS
- CSP headers
- XSS prevention
- CSRF protection
