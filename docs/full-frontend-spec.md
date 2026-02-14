# Frontend Specification: Marie Bashkirtseff Diary Reader

This document describes the complete behavior, structure, and user experience of the Marie Bashkirtseff diary reading application. It is written to be technology-agnostic: no frameworks, libraries, or implementation details are mentioned. Anyone should be able to rebuild this application from scratch using this specification alone.

---

## Table of Contents

1. [Site Structure and Navigation](#1-site-structure-and-navigation)
2. [Multi-Language Support](#2-multi-language-support)
3. [Home Page](#3-home-page)
4. [Diary Organization and Browsing](#4-diary-organization-and-browsing)
5. [Reading Experience](#5-reading-experience)
6. [Glossary System](#6-glossary-system)
7. [Filter and Search](#7-filter-and-search)
8. [Reading History](#8-reading-history)
9. [Offline and Installable App](#9-offline-and-installable-app)
10. [Visual Design and Theming](#10-visual-design-and-theming)
11. [Mobile vs Desktop](#11-mobile-vs-desktop)
12. [Static Pages](#12-static-pages)
13. [User Preferences and Features](#13-user-preferences-and-features)

---

## 1. Site Structure and Navigation

### URL Hierarchy

The application is a statically generated site with the following URL structure:

| URL Pattern | Page |
|---|---|
| `/` | Root redirect (detects language, redirects to home) |
| `/home/{locale}` | Home page (locale = `cs`, `en`, `fr`, `uk`) |
| `/{lang}/` | Year overview for a content language |
| `/{lang}/{year}/` | Carnets within a specific year |
| `/{lang}/{carnet}/` | Entries within a specific carnet |
| `/{lang}/{carnet}/{date}` | Individual diary entry |
| `/{lang}/glossary/` | Glossary index |
| `/{lang}/glossary/{id}` | Individual glossary entry |
| `/{lang}/about` | About the project |
| `/{lang}/marie` | Biography of Marie Bashkirtseff |
| `/{lang}/welcome` | Installable app onboarding |
| `/offline` | Offline fallback page |

The `{lang}` parameter represents a content language path: `cz` (Czech translation), `en` (English translation), `uk` (Ukrainian translation), `fr` (French — original French with non-French passages translated into Marie's French style), or `original` (French original manuscript, multilingual).

The `{locale}` parameter uses standard language codes: `cs`, `en`, `fr`, `uk`.

### Two Code Systems

The application maintains two parallel language code systems:

| Purpose | Czech | English | Ukrainian | French | Original French |
|---|---|---|---|---|---|
| UI locale (used in home URL, settings) | `cs` | `en` | `uk` | `fr` | N/A |
| Content path (used in diary URLs) | `cz` | `en` | `uk` | `fr` | `original` |

Helper functions convert between these two systems. The `cz` vs `cs` distinction exists to preserve established URLs.

### Root Redirect Logic

When a user visits `/`:
1. Check browser storage for a previously saved language preference.
2. If none, detect browser language preferences from the browser's language list.
3. Map the detected language to a supported locale (`cs`, `en`, `fr`, `uk`), defaulting to `cs`.
4. Redirect to `/home/{detected-locale}`.

### Global Header

A sticky header appears at the top of every page:

- **Left**: Site title ("Diary of Marie Bashkirtseff" in the user's locale). The title is rendered server-side in a default locale and immediately updated client-side from the stored locale preference to prevent a flash of wrong language.
- **Center** (desktop only): Navigation links to diary sections (translation, original, glossary, about Marie, about project). These links are reactive to the user's stored locale preference and update without page reload.
- **Right**: Three controls:
  - **Offline status indicator**: Shows a badge when the user is offline.
  - **Locale switcher**: A dropdown showing the current UI locale code (e.g., "CS"). Opens a list of available locales sorted with the browser's preferred locale first (marked with a left border accent). Selecting a locale navigates to the equivalent page in the new language and saves the preference.
  - **Unified menu button**: A hamburger icon that opens the main side panel (see Section 5.5). When an entity filter is active, an additional pill badge appears next to the hamburger showing the active filter count.

### Footer

A simple footer on every page with:
- Copyright notice
- Links to project pages (About, GitHub)
- Current year

---

## 2. Multi-Language Support

### Content Languages

The diary exists in multiple content versions, each served under its own URL path:

| Path | Description | Features |
|---|---|---|
| `cz` | Czech translation | Flip-to-original, progress tracking, untranslated badges |
| `en` | English translation | Flip-to-original, progress tracking, untranslated badges |
| `uk` | Ukrainian translation | Flip-to-original, progress tracking, untranslated badges |
| `fr` | French (non-French passages translated into Marie's French style) | Flip-to-original, progress tracking, untranslated badges |
| `original` | French original manuscript (multilingual) | Plain text, no flip, no progress bars |

Translation languages are flagged with `isTranslation: true` and receive additional UI features: the ability to flip paragraphs to see the French original, translation progress bars, and badges marking entries not yet translated.

### UI Translations

All user interface text (buttons, labels, headings, descriptions) is translated into four UI locales: Czech (`cs`), English (`en`), French (`fr`), and Ukrainian (`uk`). The French original content uses Czech as its UI locale.

The translation system uses a key-based lookup with dot-notation keys (e.g., `home.startReading`, `nav.diary`). If a key is missing in a locale, it falls back gracefully.

### Locale Switcher Behavior

When the user switches locale via the dropdown:
- On diary content pages (entries, carnets, years): the URL's content path segment changes (e.g., `/cz/001/` becomes `/en/001/`).
- On static pages (about, marie): the locale parameter in the URL changes.
- On home pages: redirects to the home page in the new locale.
- The preference is saved to browser storage.

### Language Preference Persistence

The user's chosen UI language is saved to browser local storage under the key `ui-language`. This preference is:
- Read on every page load to set the header title correctly.
- Used by the navigation component to generate correct links.
- Checked during the root redirect to skip auto-detection.

---

## 3. Home Page

The home page (`/home/{locale}`) is a marketing/landing page with six distinct sections:

### 3.1 Hero Section

- Gradient background (sepia to parchment tones).
- Large title: "Diary" (localized) in bold, followed by "Marie Bashkirtseff" in normal weight.
- An italicized quote from Marie about her diary being "the most interesting book."
- If the current locale is not French, a smaller line shows the original French quote.
- Two call-to-action buttons:
  - **"Start Reading"**: Links to the preface (carnet 000) in the appropriate content path.
  - **"About Marie"**: Links to the about page.

### 3.2 This Day in Marie's Life

- A bordered section below the hero.
- Shows a diary entry written on today's calendar date (month and day match, any year).
- Displays: the entry date, Marie's age at that time, a preview of the entry text, and a link to the full entry.
- Day navigation arrows allow browsing to adjacent days.
- If no entry exists for the current day, shows a "no entry today" message.
- The data is pre-computed at build time for the current content language.

### 3.3 Introduction

- White/parchment background section.
- A floating right-aligned image of Marie's self-portrait (with caption).
- Three paragraphs of introductory text about the diary and the project, all localized.

### 3.4 Carnet Grid

- Shows a sample of 4 carnets as clickable cards in a responsive grid (1-4 columns).
- Each card shows: carnet number (large, accented), "Carnet XXX" label, year range, and entry count.
- Cards link to the carnet detail page.
- Below the grid: a "View all volumes" link to the year overview page.

### 3.5 Current State

- Three icon cards in a row describing the project's current capabilities:
  - Original text availability
  - Research annotations
  - Translation infrastructure
- Each card has an icon, heading, and description paragraph.

### 3.6 Call to Action (Dark Section)

- Dark background (ink color) with light text.
- A large italicized quote from Marie about living fully.
- If the locale is not French, the original French quote is shown.
- Attribution to Marie Bashkirtseff.
- A prominent button to start reading the diary.

### 3.7 Language Preference Script

An inline script runs synchronously during page load to save the current locale to browser storage, ensuring the header and navigation render in the correct language before any interactive components initialize.

---

## 4. Diary Organization and Browsing

### 4.1 Diary Structure

The diary spans 12 years (1873-1884) across 107 carnets (notebooks numbered 000-106). Carnet 000 is a preface. Ten carnets span year boundaries and appear in listings for both years.

### 4.2 Year Overview Page (`/{lang}/`)

This is the entry point for browsing a content language's diary.

**For translation languages:**
- A language tab bar at the top showing available languages (CS, EN, UK, FR) as clickable tabs, plus an "Original" button with a globe icon (indicating multilingual). The current language is highlighted.
- Below the tabs: an overall translation progress bar showing percentage complete (translated entries / total entries).
- Statistics: total entry count and translated entry count.

**For the original French:**
- A centered header with the title "Journal de Marie Bashkirtseff" in serif font, styled elegantly without progress tracking.

**Year Grid (both modes):**
- A responsive grid (1-4 columns) of year cards from 1873 to 1884.
- Each card shows:
  - The year (large, bold)
  - Marie's age that year (e.g., "age 15-16")
  - Number of notebooks in that year
  - Number of entries
  - For translations: a translation progress bar with percentage
- Cards link to the year detail page.

**Below the grid:**
- A link to carnet 000 (preface).
- For translations: a link to the flat carnet list page.

### 4.3 Year Detail Page (`/{lang}/{year}/`)

Shows all information about a single year.

**Summary Grid (4 panels):**

1. **Year Header Panel**: Year number, Marie's age range, notebook count, entry count, translated count (for translations), progress bar, and primary location for the year.

2. **Key People Panel**: The top 10 most-mentioned people in this year, each with mention count. Names link to their glossary entries.

3. **Key Places Panel**: The top 10 most-mentioned places, each with mention count and glossary links.

4. **Themes Panel**: A tag cloud of themes appearing in this year's entries.

**Year Navigation**: Previous/next year arrows with year labels.

**Carnet List**: All carnets active during this year, each showing:
- Carnet number
- Date range
- Cross-year indicator (if the carnet spans into another year, a note like "continues from 1873" or "continues into 1875")
- Entry count
- For translations: translation status (translated count, progress bar, or "Not yet translated" label)
- Clicking a carnet goes to its detail page.

**Filter Overlay**: When an entity filter is active, a banner appears showing the active filter. Non-matching carnet cards are dimmed (reduced opacity) rather than hidden.

**Offline Download**: A download button for offline access to this year's content.

### 4.4 Carnet Detail Page (`/{lang}/{carnet}/`)

Shows all entries within a single carnet.

**Summary Grid (4-5 panels):**

1. **Carnet Header Panel**: Carnet number with previous/next navigation arrows, date range, entry count, translated count, progress bar, primary location, a "Read from beginning" button linking to the first entry, and an offline download button.

2. **Key People Panel**: Top mentioned people with counts and glossary links.

3. **Key Places Panel**: Top mentioned places with counts and glossary links.

4. **Themes Panel**: Tag cloud of themes.

5. **Calendar Widget**: A monthly calendar grid showing which days have diary entries. Days with entries are clickable and link to the entry page. The current month is shown with navigation arrows for previous/next months. If the carnet spans multiple months, multiple calendar grids may appear.

**Entry List**: All entries in the carnet, each showing:
- Entry number within the carnet
- Formatted date (localized to the content language's date locale, e.g., "11 janvier 1873" for French)
- For translations: an "FR" badge on entries not yet translated, indicating the entry is only available in the French original
- A preview snippet of the entry text (first ~150 characters)
- Clicking an entry goes to the entry reading page.

**Filter Overlay**: When active, dims non-matching entries and shows a filter banner with active tag names and a count of matching entries.

### 4.5 Flat Carnet List (`/{lang}/carnets`)

Available only for translation languages. Shows all 107 carnets in a simple flat list with carnet number, date range, and entry count. Useful for direct navigation to any carnet without going through the year hierarchy.

---

## 5. Reading Experience

### 5.1 Entry Page Layout (`/{lang}/{carnet}/{date}`)

The individual entry page is the core of the application. It uses a reading-optimized layout:

**Breadcrumb Navigation**: Shows the path: Language > Year > Carnet > Entry date. Each segment is a clickable link.

**Entry Header**:
- The formatted date as the main heading (e.g., "Samedi 11 janvier 1873").
- A language switcher specific to this entry, showing language codes (CZ, EN, UK, FR) and a globe icon for the multilingual original. Allows switching to the same entry in another language.
- Previous/next entry navigation arrows with the adjacent entry's date shown.

**Entry Body**: The main content area containing the diary text rendered as a series of paragraphs, each with interactive features (see below).

**Footnotes Section**: If the entry contains footnotes, they appear at the bottom with back-reference links to the paragraph that cited them.

**Bottom Navigation**: A repeated previous/next entry navigation bar at the bottom of the page.

### 5.2 Paragraph Rendering

Each paragraph in a diary entry is rendered as a distinct block with:
- A unique paragraph ID (format: `XXX.YYYY` where XXX is the carnet number and YYYY is a sequential number).
- An HTML anchor for deep linking.
- The paragraph text with any inline glossary tags rendered as interactive links (see Section 6).
- A paragraph toolbar (see Section 5.3).

When the URL contains a hash fragment matching a paragraph ID (e.g., `#002.0145`), the page scrolls to that paragraph and plays a brief yellow highlight animation that fades out after about 2 seconds.

### 5.3 Paragraph Toolbar

Each paragraph has a small toolbar that appears at the top-right corner. It contains two icon buttons:

1. **Menu Button** (three-dot icon): Opens a bottom sheet (mobile) or dropdown panel with:
   - The paragraph ID displayed as a header.
   - **"Flip to Original"** action: Triggers the flip animation (see Section 5.4).
   - **"Share"** button: Uses the device's native share dialog if available, sharing a deep link to this specific paragraph.
   - **"Copy Link"** button: Copies the paragraph's direct URL to the clipboard, with a brief "Copied!" confirmation.
   - **Glossary Tags section**: Lists all entity tags present in this paragraph. Each tag shows a category-colored icon and the entity name, linking to its glossary entry. Each tag also has a small filter icon that, when clicked, activates filtering by that entity across the entire diary.

2. **Flip Button** (fleur-de-lis icon): A quick-access button that toggles the flip animation without opening the full menu. Only appears for translation languages.

### 5.4 Flip-to-Original Animation

For translation languages, each paragraph can be "flipped" to reveal the French original text underneath. The animation works as follows:

- The paragraph is rendered as a 3D card with a front face (translation) and back face (original French text).
- Clicking the flip button triggers a smooth 0.6-second horizontal rotation (rotateY) animation.
- The front face rotates away and the back face rotates into view.
- The back face shows the original French text with a small language indicator icon (fleur-de-lis for French).
- Clicking again flips back to the translation.
- The card container adjusts its height to accommodate whichever face is taller.
- On the original French content path, no flip is available since the text is already in the original language.

Language indicator icons for different languages embedded in the text:
- Fleur-de-lis: French
- Crown: English
- Star: Russian
- Circle: Italian

### 5.5 Unified Side Panel (Menu)

The main menu is a comprehensive right-side panel that slides in from the right edge of the screen. It is opened by the hamburger button in the header (or the filter pill next to it). The panel contains multiple collapsible accordion sections:

#### Navigation Section (mobile only)
Links to: the translation for the current locale, the French original, the glossary, Marie's biography, and the about page. Each link includes an icon and localized label.

#### Settings Section
- **Font size controls**: A minus button ("A-") and plus button ("A+") with the current size displayed as a percentage. Range: 80% to 130% in 5% increments. The default size maps to 16px at 100%.
- **Theme selector**: Three options — Light, Sepia (default), and Dark. Each is a clickable swatch. The active theme is indicated with a checkmark.

#### History Section
- Shows the most recently read paragraphs (up to 10 items).
- Each item shows the carnet number, paragraph ID, and a snippet of the text, linking directly to that paragraph.
- Also shows recently visited glossary entries.
- A "Clear history" button removes all history records.
- If no history exists, shows a "No reading history yet" message.

#### Contents Section (only on entry pages)
- A mini table of contents for the current carnet.
- Shows a calendar widget for quick date navigation.
- A search input to filter entries by text.
- A scrollable list of all entries in the carnet with entry numbers, dates, and title snippets.
- The current entry is highlighted in the list.
- A "Back to carnet" link at the top.

#### Filter Section
- A search input for finding filter tags by name.
- **AND/OR mode toggle**: Switches between requiring all selected tags to match (AND) or any selected tag to match (OR). Default is OR.
- **Active filter summary**: Shows the count of active filters and a "Clear all" button. Lists each active tag as a removable chip.
- **Category browser**: Hierarchical accordion of filter categories:
  - **Editions**: Filter by published edition
  - **People**: Filter by mentioned persons, with subcategories (family, friends, acquaintances, etc.)
  - **Places**: Filter by locations, with subcategories (cities, countries, residences, etc.)
  - **Culture**: Filter by cultural references, with subcategories (art, music, literature, etc.)
  - **Themes**: Filter by diary themes (love, ambition, health, etc.)
  - **Location**: Filter by Marie's location when writing
- Each category shows a count of available tags. Tags within a category are checkboxes with occurrence counts.
- Categories with many tags show a "Show more" / "Show less" toggle (threshold: 10 items).
- Each category has its own "Clear" button.

### 5.6 Book Sidebar (Left Panel)

On entry pages, a left-side panel provides carnet-level navigation:
- **Carnet title** at the top.
- **Calendar widget(s)** for the months covered by this carnet.
- **Search input** to filter entries by text.
- **Scrollable entry list** showing all entries with entry numbers, dates, and short titles. The current entry is highlighted with a distinct background color.
- **"Back to carnet"** link.
- On large screens (1024px+), the sidebar can be "pinned" open so it remains visible alongside the reading content. On smaller screens, it slides in from the left with a backdrop overlay and must be dismissed.

### 5.7 Reading Settings (Floating Button)

A floating button in the bottom-right corner of reading pages opens a small settings panel with:
- Font size adjustment (same A-/A+ controls as the unified menu).
- Theme selection (same three options as the unified menu).
- Changes are applied immediately and persist across sessions.

### 5.8 Back to Top

A floating "back to top" button appears in the bottom-right area when the user has scrolled down significantly. Clicking it smoothly scrolls back to the top of the page. It only becomes visible after scrolling past a threshold.

### 5.9 Reading Progress Tracking

As the user reads an entry, the application tracks which paragraphs have been viewed:
- An intersection observer monitors each paragraph. When a paragraph scrolls out of view (indicating the user has read past it), a `paragraph-read` event is dispatched.
- A headless tracking component listens for these events and records them in the reading history store.
- Only the most recently read paragraph per carnet is stored (not every paragraph).

---

## 6. Glossary System

### 6.1 Overview

The glossary is a structured encyclopedia of entities mentioned in the diary: people, places, cultural references, languages, and social concepts. Each entity has a dedicated page with detailed information and cross-references back to the diary.

### 6.2 Glossary Index Page (`/{lang}/glossary/`)

The index page offers three ways to browse:

1. **Search**: A search input with debounced (300ms delay) instant results. The search uses a scoring algorithm:
   - Exact name match: highest score (1000)
   - Name starts with query: 500
   - Exact alias match: 400
   - Alias starts with query: 300
   - Word boundary match: 200
   - Name contains query: 100
   - Alias contains query: 150
   - Type match: 50
   - Summary match: 25
   - Bonus points for higher usage counts
   - Up to 20 results displayed, each showing the entity name with the matching portion highlighted, a category icon, and a reference count.

2. **Category Browser**: A hierarchical accordion showing all glossary categories (People, Places, Culture, Society, Languages). Clicking a category expands it to show subcategories, and each subcategory lists its entries.

3. **Alphabetical Grid**: An A-Z grid of letters. Each letter shows the count of entries starting with that letter. Clicking a letter scrolls to or links to entries beginning with that letter.

### 6.3 Glossary Entry Page (`/{lang}/glossary/{id}`)

Each glossary entry page shows:

**Header Information:**
- Entity name (large heading)
- Original script name (if different from the display name)
- Transliteration (if applicable)
- Aliases listed below the name
- Type badge (e.g., "Person", "Place", "Artwork")
- Category badge with color coding
- Languages associated with this entity
- Research status indicator
- Pronunciation link (if available)
- Last updated date
- Usage count: how many diary paragraphs reference this entity, with a "Show in diary" button that activates a filter for this entity

**Content Body:**
- The glossary entry content is rendered either as structured paragraph clusters (with the same paragraph toolbar/menu features as diary entries) or as simple formatted text.
- Content may include historical context, biographical details, Marie's relationship to the entity, and scholarly notes.

**History Tracking:**
- Visiting a glossary entry dispatches a `glossary-visit` event, which is recorded in the reading history.

### 6.4 Inline Glossary Tags

Within diary entry paragraphs, entity references appear as interactive inline links:
- They are visually distinguished from regular text (typically with a subtle underline or color).
- Clicking a glossary tag navigates to the glossary entry page for that entity.
- Tags also appear in the paragraph menu's "Glossary Tags" section with category-colored icons and filter actions.

### 6.5 Glossary URL Structure

Each content language has its own glossary at `/{lang}/glossary/`. Bare `/glossary/{id}` URLs redirect to `/original/glossary/{id}`.

Glossary entry IDs use uppercase ASCII with underscores (e.g., `PROMENADE_DES_ANGLAIS`, `HOWARD_FAMILY`).

---

## 7. Filter and Search

### 7.1 Filter System

The filter system allows users to find diary entries mentioning specific entities or themes. It operates across the entire diary.

**Filter Data**: A pre-built filter index (generated at build time) maps each tag to the list of entries containing it. The index is loaded from a JSON file (`/data/filter-index.json`).

**Filter Categories**:
- **Editions**: Published editions of the diary
- **People**: With subcategories (family, friends, acquaintances, artists, nobility, etc.)
- **Places**: With subcategories (cities, countries, residences, streets, etc.)
- **Culture**: With subcategories (art, music, literature, theater, etc.)
- **Themes**: Diary themes (love, ambition, health, death, religion, etc.)
- **Location**: Marie's location when writing

**Filter Modes**:
- **OR mode** (default): An entry matches if it contains ANY of the selected tags.
- **AND mode**: An entry matches only if it contains ALL of the selected tags.

**Filter Persistence**: Selected tags and the AND/OR mode are saved to browser storage and restored on page load. Filter state is synchronized across multiple components via a custom sync event.

### 7.2 Filter Overlay

When a filter is active, a banner overlay appears on browsing pages (year detail, carnet detail):

**On year detail pages:**
- Non-matching carnet cards are dimmed (reduced opacity) but remain visible.
- The banner shows active tag names and a count of matching entries.

**On carnet detail pages:**
- Non-matching entry cards are dimmed.
- Between groups of matching entries, navigation hints are injected showing the gap (e.g., "3 days later") with links to jump to the next/previous match.
- The banner shows active tag names, matching count, and a clear button.

### 7.3 Filter on Entry Pages

On individual entry pages, when a filter is active:
- Paragraphs matching the filter are displayed normally.
- Non-matching paragraphs are collapsed into "gap" sections (e.g., "5 paragraphs hidden"). These gaps are expandable — clicking reveals the hidden paragraphs.
- This allows the reader to focus on relevant content while retaining access to context.

### 7.4 Filter Activation Methods

Filters can be activated from multiple places:
1. The unified menu's Filter section (checkbox selection).
2. The paragraph menu's glossary tag "filter" button (single-entity quick filter).
3. The glossary entry page's "Show in diary" button.
4. Direct URL parameters (the filter state can be encoded in the URL).

---

## 8. Reading History

### 8.1 Tracking

The application tracks two types of reading activity:

1. **Paragraph reads**: When a user scrolls past a paragraph on an entry page, the paragraph ID, carnet, entry date, and a text snippet are recorded. Only the most recent paragraph per carnet is kept (replacing any previous record for that carnet).

2. **Glossary visits**: When a user views a glossary entry page, the glossary ID and name are recorded.

### 8.2 Storage

- History is stored in browser local storage.
- Maximum 10 items are retained (oldest items are evicted when the limit is reached).
- Each item includes a timestamp.

### 8.3 Display

Reading history is displayed in the unified menu's History section:
- Items are listed in reverse chronological order (most recent first).
- Paragraph reads show: carnet number, paragraph ID snippet, and a link to resume reading from that exact paragraph.
- Glossary visits show: entity name with a link to the glossary page.
- A "Clear history" button removes all records.

---

## 9. Offline and Installable App

### 9.1 Progressive Web App

The application is installable as a standalone app on mobile and desktop devices:

**Manifest**: Defines the app name ("Bashkirtseff Diary"), short name, description, start URL, standalone display mode, and theme colors (parchment background, amber accent).

**Service Worker**: Caches the application shell and content for offline access using a stale-while-revalidate strategy for content and cache-first for static assets.

### 9.2 Install Prompt

A banner appears at the bottom of the screen when the browser signals that the app can be installed:
- Shows a brief message encouraging installation.
- Two buttons: "Install" and "Dismiss".
- If dismissed, the preference is saved to browser storage and the prompt is not shown again.
- Only appears on supported browsers.

### 9.3 Offline Download

Users can download content for offline reading at two granularities:

- **By year**: A download button on the year detail page downloads all entries for that year.
- **By carnet**: A download button on the carnet detail page downloads all entries in that carnet.

**Download UI States**:
1. **Not downloaded**: Shows a download icon with an estimated size.
2. **Downloading**: Shows a progress bar with percentage and a cancel button.
3. **Complete**: Shows a checkmark with a "Remove" option to free storage.
4. **Partial**: Shows a warning icon with a "Resume" option (if a download was interrupted).
5. **Error**: Shows an error icon with a "Retry" option.

Downloads run with up to 3 concurrent requests. Download records (which scopes have been downloaded) are persisted to browser storage.

### 9.4 Offline Fallback Page

When the user navigates to a page that hasn't been cached while offline, a fallback page is shown:
- A message "You are offline" (localized based on stored preference).
- A hint suggesting the user download content for offline use.
- A list of content that IS available offline (read from browser storage).
- A button to return to the home page.

### 9.5 Online/Offline Toast

When the connection status changes:
- Going offline: A toast notification appears saying "You are offline."
- Coming back online: A toast says "Back online."

### 9.6 Welcome / Onboarding

When the app is launched in standalone (installed) mode for the first time, the user sees a full-screen onboarding experience (`/{lang}/welcome`):

Eight scrollable cards introduce the app's features:
1. **Welcome**: App title and brief introduction.
2. **Paragraph Toolbar**: Explains the three-dot menu and available actions.
3. **Flip to Original**: Demonstrates the flip animation feature.
4. **Glossary Tags**: Explains inline entity links and the glossary.
5. **Filtering**: Introduces entity-based filtering.
6. **Reading History**: Explains automatic progress tracking.
7. **Offline Reading**: Describes the download feature.
8. **Start Reading**: A call-to-action button to begin.

A progress bar at the bottom shows how far through the onboarding the user has scrolled. A "Skip" link allows bypassing onboarding. Once completed (or skipped), a flag (`pwa-onboarded`) is set in browser storage so the onboarding is not shown again.

---

## 10. Visual Design and Theming

### 10.1 Color Palette

The application uses a warm, literary color scheme:

| Name | Usage |
|---|---|
| **Parchment** | Primary background — warm off-white (#FFF8F0 or similar) |
| **Sepia** | Secondary background, header — warm beige/tan |
| **Ink** | Primary text — dark brown/charcoal |
| **Ink Light** | Secondary text — lighter brown |
| **Muted** | Tertiary text, captions — gray-brown |
| **Accent** | Links, highlights, active elements — amber/brown (#B45309 or similar) |
| **Accent Light** | Hover state for accent |

### 10.2 Typography

Two font families are used:
- **Serif** (Crimson Pro or similar): Used for headings, titles, quotes, the site title, and literary text. Evokes a 19th-century diary aesthetic.
- **Sans-serif** (Inter or similar): Used for UI elements, navigation, buttons, metadata, and body text.

Font size is adjustable from 80% to 130% of the base size (16px default), controlled in 5% increments.

### 10.3 Three Themes

1. **Light**: White/light background with dark text. Clean and bright.
2. **Sepia** (default): Warm parchment tones. Feels like reading an old book. The signature look of the application.
3. **Dark**: Dark background with light text. Reduced eye strain in low light.

Themes are applied by setting a class or attribute on the root HTML element. The theme is applied during initial HTML parsing (before first paint) by reading from browser storage, preventing a flash of the wrong theme.

### 10.4 Design Principles

- **Reading first**: The diary text is the centerpiece. All UI recedes into the background.
- **19th-century inspired**: Elegant, warm, literary. Not sterile or modern.
- **Generous whitespace**: Text blocks have comfortable line height and max-width (typically ~700px for reading, ~1200px for grids).
- **Subtle interactions**: Hover effects, transitions, and animations are gentle (0.2-0.6s).

### 10.5 Structured Data

The base layout includes schema.org structured data (JSON-LD) describing Marie Bashkirtseff as a Person with biographical details, enabling rich search engine results.

### 10.6 Open Graph / Social Sharing

Every page includes Open Graph and Twitter Card meta tags with:
- Page title
- Description
- A composite image (`/images/og/og-image-composite.jpg`) as the default
- Site name
- Content type (website or article)

---

## 11. Mobile vs Desktop

### 11.1 Responsive Layout

The application uses a mobile-first responsive design:

- **Mobile** (< 640px): Single column layouts. Full-width cards. Stacked navigation. Bottom sheets for menus.
- **Tablet** (640-1023px): Two-column grids for carnet/year cards. Side panels overlay content.
- **Desktop** (1024px+): Up to four-column grids. Side panels can be pinned alongside content. Desktop navigation visible in header.

### 11.2 Navigation Differences

**Mobile:**
- Header shows only the site title, offline indicator, locale switcher, and hamburger menu.
- Desktop navigation links are hidden; they appear in the unified menu's Navigation section instead.
- Side panels (book sidebar, unified menu) slide in as full-height overlays with backdrop.
- Paragraph menus open as bottom sheets (sliding up from the bottom of the screen).

**Desktop:**
- Full navigation links visible in the header (diary, original, glossary, about).
- The Navigation section is hidden from the unified menu (since links are already visible).
- The book sidebar can be pinned open on the left, with content reflowing to accommodate it.
- Paragraph menus may appear as positioned dropdowns rather than bottom sheets.

### 11.3 Touch Interactions

- Bottom sheets are the primary interaction pattern for mobile actions (paragraph menu, settings).
- Tap targets are sized appropriately (minimum 44x44px touch areas).
- Swipe gestures are not used (all navigation is through taps and scrolls).

### 11.4 Grid Breakpoints

| Screen | Year Cards | Carnet Cards | Entry Cards |
|---|---|---|---|
| Mobile | 1 column | 1 column | 1 column |
| Small tablet | 2 columns | 2 columns | 1 column |
| Large tablet | 3 columns | 2 columns | 1 column |
| Desktop | 4 columns | 4 columns | 1 column |

---

## 12. Static Pages

### 12.1 About Page (`/{lang}/about`)

A long-form informational page about the project with these sections:

1. **Project Introduction**: What this project is and why it exists.
2. **The Diary's Story**: History of the diary's censorship and the journey to the uncensored text.
3. **This Project**: How this digital edition came about.
4. **Current Status**: What has been completed and what remains.
5. **Vision**: Long-term goals for the project.
6. **AI Translation**: How artificial intelligence is used in the translation process.
7. **Praise**: A historical quote (from Gladstone) praising the diary.
8. **Privacy**: The project's stance on user privacy.
9. **Acknowledgments**: Credits and thanks.
10. **Contact**: Links for getting in touch.
11. **Learn More**: External resource links.

All text is localized.

### 12.2 Marie's Biography Page (`/{lang}/marie`)

A biography page with:

1. **Self-Portrait Image**: Marie's self-portrait at the top.
2. **Life Section**: Biographical overview of Marie's life (1858-1884).
3. **Artist Section**: Her career as a painter, with a two-column image gallery showing two of her paintings ("The Meeting" and "In the Studio") with captions.
4. **Diary Section**: The significance of her diary in literary history.
5. **Feminism Section**: Her proto-feminist views and advocacy, with a highlighted quote.
6. **Legacy Section**: Her lasting impact on art and literature.
7. **External Links**: Links to Wikipedia, WikiArt, Musee d'Orsay, Wikimedia Commons, Gallica, and JSTOR Daily. Each link opens in a new tab.

All text is localized.

### 12.3 Welcome/Onboarding Page (`/{lang}/welcome`)

Described in Section 9.6. Only accessible and useful in standalone/installed app mode.

### 12.4 Offline Fallback Page (`/offline`)

Described in Section 9.4. A simple page shown when navigating to uncached content while offline.

---

## 13. User Preferences and Features

### 13.1 Persisted Preferences

The following user preferences are saved to browser local storage and restored on every page load:

| Preference | Key | Default | Options |
|---|---|---|---|
| UI Language | `ui-language` | Auto-detected | `cs`, `en`, `fr`, `uk` |
| Theme | (preferences store) | `sepia` | `light`, `sepia`, `dark` |
| Font Size | (preferences store) | 16px (100%) | 80%-130% in 5% steps |
| Reading History | (history store) | Empty | Up to 10 items |
| Filter Tags | (filter store) | None | Any combination of tags |
| Filter Mode | (filter store) | `OR` | `AND`, `OR` |
| PWA Install Dismissed | `pwa-install-dismissed` | `false` | `true`, `false` |
| PWA Onboarded | `pwa-onboarded` | `false` | `true`, `false` |
| Offline Downloads | (offline store) | None | Records of downloaded scopes |

### 13.2 Theme Application

The theme and font scale are applied via an inline script that runs synchronously during HTML parsing (before any rendering). This prevents a "flash of unstyled content" — the user never sees the wrong theme momentarily switch to the correct one.

The script:
1. Reads the theme from local storage.
2. Sets a class on the `<html>` element (e.g., `theme-dark`).
3. Reads the font scale from local storage.
4. Sets a CSS custom property on the `<html>` element (e.g., `--font-scale: 1.1`).

### 13.3 Connection Status Monitoring

The application monitors online/offline status:
- An indicator in the header shows when the user is offline.
- Toast notifications appear on status changes.
- The offline fallback page is served when navigating to uncached content while disconnected.

### 13.4 Deep Linking

Every paragraph in every diary entry is directly addressable via URL hash:
- URL format: `/{lang}/{carnet}/{date}#XXX.YYYY`
- When such a URL is loaded, the page scrolls to the target paragraph and applies a 2-second highlight animation (yellow/gold background that fades out).
- The "Copy Link" and "Share" actions in the paragraph menu generate these deep link URLs.

### 13.5 Web Share Integration

On devices that support the Web Share API (primarily mobile), the paragraph menu's "Share" button opens the native share dialog, allowing the user to share a link to a specific paragraph via any installed app (messaging, social media, email, etc.). On devices without Web Share support, only the "Copy Link" option is available.

### 13.6 Translation Progress Tracking

For translation languages, the application computes and displays translation progress at multiple levels:

- **Overall**: On the year overview page, a progress bar shows total translated entries / total entries.
- **Per Year**: Each year card shows its own translation progress bar and percentage.
- **Per Carnet**: Each carnet card shows its translation progress.
- **Per Entry**: Untranslated entries are marked with an "FR" badge indicating they are only available in French.

Progress is computed at build time from the content data and is not interactive.

### 13.7 Cross-Year Carnet Handling

Ten carnets in the diary span year boundaries (e.g., a carnet starting in December 1873 and ending in January 1874). These carnets:
- Appear in the carnet listings for both years they span.
- Show a visual indicator noting which year they continue from or into (e.g., "Continues from 1873" or "Continues into 1875").
- Link to the same carnet detail page regardless of which year listing they appear in.

---

## 14. User Accounts and Authentication (Proposed)

### 14.1 Login and Registration

Users can create an account and log in via OAuth providers (Google, Microsoft, Facebook) or email/password. Authentication is managed by a hosted backend service (e.g., Supabase Auth).

**Login UI:**
- A "Log in" button in the header (visible when not authenticated).
- Clicking opens a modal or dedicated page with OAuth provider buttons and an email/password form.
- After successful login, the button is replaced by a user avatar or initials.
- A dropdown menu from the avatar provides: profile summary, settings, and "Log out".

**Session:**
- Authentication state persists across sessions via secure tokens stored in browser storage.
- Session is checked on app load; expired sessions redirect to login if needed for protected actions.
- Unauthenticated users can read all content freely; authentication is only required for interactive features (reporting, highlighting, future social features).

### 14.2 User Profile

Minimal profile stored server-side:
- Display name (from OAuth or user-provided)
- Email
- Preferred UI language
- Account creation date

No personal data beyond what is needed for attribution on reports and highlights.

---

## 15. Paragraph Reporting (Proposed)

### 15.1 Purpose

Readers can report issues with any paragraph — translation errors, typos, unclear phrasing, missing context, or suggestions for improvement. Reports are stored server-side and reviewed by project maintainers.

### 15.2 Report Flow

1. User opens the paragraph toolbar menu (the three-dot "..." button).
2. A new "Report issue" item appears in the menu (with a flag icon).
3. Tapping "Report issue" opens a bottom sheet / modal with:
   - **Paragraph ID** displayed (read-only, auto-filled).
   - **Current translation text** displayed (read-only, auto-filled from the paragraph content).
   - **Report type** selector: "Translation error", "Typo", "Unclear", "Missing context", "Other".
   - **Note** text field (required, multi-line): the user describes the issue or suggests a correction.
   - **Submit** button and **Cancel** button.
4. On submit, the report is sent to a server endpoint and a confirmation toast appears ("Report submitted. Thank you!").
5. If the user is not logged in, they are prompted to log in first (reports are attributed to user accounts).

### 15.3 Server Endpoint

**POST** to a reports endpoint with payload:
```
{
  "paragraph_id": "002.0145",
  "language": "cz",
  "entry_date": "1873-08-11",
  "carnet": "002",
  "translation_text": "The current paragraph text...",
  "report_type": "translation_error",
  "note": "User's description of the issue",
  "user_id": "authenticated-user-id"
}
```

**Response**: 201 Created with the report ID.

### 15.4 Database Storage

Reports are stored in a `paragraph_reports` table:

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| paragraph_id | TEXT | e.g., "002.0145" |
| language | TEXT | e.g., "cz" |
| entry_date | DATE | The diary entry date |
| carnet | TEXT | Carnet number |
| translation_text | TEXT | Snapshot of the translation at time of report |
| report_type | TEXT | Category of the report |
| note | TEXT | User's description |
| user_id | UUID | Foreign key to auth.users |
| status | TEXT | "new", "reviewed", "resolved", "dismissed" |
| created_at | TIMESTAMP | When the report was submitted |
| resolved_at | TIMESTAMP | When the report was resolved (nullable) |
| resolver_note | TEXT | Maintainer's response (nullable) |

Row-level security: users can create reports and read their own reports. Maintainers can read and update all reports.

### 15.5 Maintainer Review (Future)

An admin dashboard (out of scope for initial implementation) would allow maintainers to:
- List all reports filtered by status, language, carnet.
- Mark reports as reviewed, resolved, or dismissed.
- Add resolver notes.

---

## 16. Text Highlighting (Proposed)

### 16.1 Purpose

Authenticated users can highlight passages of text in the diary, similar to highlighting in an e-reader. Highlights persist across sessions and devices (stored server-side). This allows readers to mark memorable passages, collect quotes, or annotate their reading.

### 16.2 Creating a Highlight

1. User selects text within a diary entry by long-pressing (mobile) or click-dragging (desktop).
2. A floating toolbar appears near the selection with a "Highlight" button (marker pen icon) and optionally a color picker (3-4 color options: yellow, green, blue, pink).
3. Tapping "Highlight" saves the selection and immediately renders it with a colored background.
4. The selection can span multiple paragraphs — the highlight is stored as a range (start paragraph ID + offset, end paragraph ID + offset).

### 16.3 Viewing and Managing Highlights

**On entry pages:**
- Saved highlights are rendered as colored background spans within the paragraph text.
- Tapping/clicking on a highlight opens a small popover with:
  - The highlight color (changeable).
  - An optional **note** field: users can attach a short personal note to any highlight.
  - A **Delete** button to remove the highlight.

**In the user menu (future):**
- A "My Highlights" section lists all highlights across the diary.
- Each item shows: a text snippet, the entry date, carnet, and any attached note.
- Clicking navigates to the entry and scrolls to the highlighted passage.

### 16.4 Data Model

Highlights are stored in a `user_highlights` table:

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| language | TEXT | e.g., "cz" |
| entry_date | DATE | The diary entry date |
| carnet | TEXT | Carnet number |
| start_paragraph_id | TEXT | e.g., "002.0145" |
| start_offset | INTEGER | Character offset within the start paragraph |
| end_paragraph_id | TEXT | e.g., "002.0147" |
| end_offset | INTEGER | Character offset within the end paragraph |
| highlighted_text | TEXT | Snapshot of the selected text |
| color | TEXT | "yellow", "green", "blue", "pink" |
| note | TEXT | User's personal note (nullable) |
| created_at | TIMESTAMP | When the highlight was created |
| updated_at | TIMESTAMP | Last modification |

Row-level security: users can only read, create, update, and delete their own highlights.

### 16.5 Rendering Highlights

When an entry page loads:
1. Fetch all highlights for the current user + current entry from the server.
2. For each highlight, find the corresponding DOM range using paragraph IDs and character offsets.
3. Wrap the range in styled `<mark>` elements with the appropriate color class.
4. If the highlighted text no longer matches (e.g., translation was updated), show the highlight with a "stale" indicator and offer to remove it.

### 16.6 Cross-Paragraph Highlights

Since highlights can span multiple paragraphs:
- The start paragraph is highlighted from the start offset to the end.
- Intermediate paragraphs are highlighted entirely.
- The end paragraph is highlighted from the beginning to the end offset.
- If a paragraph in the middle is added or removed (due to content updates), the highlight gracefully degrades — showing what it can and marking itself as potentially stale.

---

## Appendix A: Data Files

The application depends on several pre-built data files generated at build time:

| File | Purpose |
|---|---|
| `/data/filter-index.json` | Maps each entity/theme tag to the list of entries containing it. Used by the filter system. |
| Diary content files | Markdown files with YAML frontmatter containing the diary text, metadata, entity references, and paragraph IDs. Organized by language and carnet. |
| Glossary content files | Markdown files with structured metadata about each entity (people, places, culture, etc.). |

## Appendix B: Event System

The application uses custom browser events for cross-component communication:

| Event | Dispatched When | Consumed By |
|---|---|---|
| `paragraph-read` | A paragraph scrolls out of view on an entry page | History tracker component |
| `glossary-visit` | A glossary entry page is viewed | History tracker component |
| `filter-sync` | Filter state changes in any component | All filter-aware components |

## Appendix C: Calendar Widget

The calendar widget appears on carnet detail pages and in the book sidebar:

- Displays a monthly grid (Sun-Sat or Mon-Sun depending on locale).
- Days with diary entries are highlighted and clickable.
- Navigation arrows allow moving between months.
- If a carnet spans multiple months, the widget shows the relevant months.
- Clicking a day with an entry navigates directly to that entry's page.
