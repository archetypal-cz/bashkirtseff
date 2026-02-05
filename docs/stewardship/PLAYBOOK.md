# Stewardship Playbook

Practical guide for executing the cultural stewardship strategy.

---

## Daily Rhythm: "This Day in Marie's Life"

### Morning Routine (5-10 minutes)

1. **Invoke stewardship skill**: `/stewardship`
2. **Request content**: "Generate This Day content for [today's date] for Reddit"
3. **Review output**: Check quote accuracy, context correctness
4. **Post to Reddit**: /r/bashkirtseff
5. **Optionally adapt**: Request Instagram/Facebook versions

### Automation Opportunity

The "This Day" workflow could be partially automated:
- Pre-generate a week's worth of content
- Store in `docs/stewardship/queue/` as dated files
- Human reviews batch, approves, schedules via Mixpost/Postiz

**Queue file format**:
```
docs/stewardship/queue/
├── 2026-02-04-reddit.md
├── 2026-02-04-instagram.md
├── 2026-02-05-reddit.md
└── ...
```

---

## Weekly Content Calendar

| Day | Primary Content | Platform | Skill Command |
|-----|-----------------|----------|---------------|
| Mon | Progress Update | Reddit, Newsletter | `/stewardship progress` |
| Tue | Thematic Post | All | `/stewardship theme [topic]` |
| Wed | Historical Context | Reddit, Facebook | `/stewardship person [name]` or `place [name]` |
| Thu | This Day (feature) | All | `/stewardship this_day` |
| Fri | Translation Insight | Reddit | Manual or from translator notes |
| Sat | Discussion Prompt | Reddit | Manual, based on recent entries |
| Sun | Art Focus | Instagram, Facebook | Manual, requires image |

### Batch Creation Session

Once weekly, generate content for the week:

```
/stewardship

Generate this week's content queue:
- This Day posts for Feb 4-10 (Reddit format)
- One thematic post on "ambition"
- One "Meet [Person]" post (suggest an interesting person from recent entries)
```

---

## Platform-Specific Guidelines

### Reddit (/r/bashkirtseff)

**Post Types**:
- `This Day in Marie's Life` - daily
- `Translation Progress` - weekly
- `Research Discovery` - when something interesting found
- `Discussion` - questions for community
- `Methodology` - how we work

**Flair System** (create these):
- `This Day` - daily posts
- `Translation` - progress, insights
- `Research` - discoveries, context
- `Discussion` - community questions
- `Methodology` - how AI is used
- `Art` - Marie's paintings

**Best Times**: Check subreddit analytics once established

**Engagement**: Respond to comments substantively. Use Marie quotes when relevant.

### Facebook

**Page vs Group**:
- **Page**: Public face, curated content, formal voice
- **Group**: Community space, discussions, more informal

**Content Adaptation**:
- Slightly longer captions than Instagram
- Can use multiple images/carousel
- Link to website when relevant
- Ask questions to encourage comments

**Best Times**: Typically evening/weekends for cultural content

### Instagram

**Visual Requirements**:
- Quote graphics (consistent template)
- Marie's paintings (high quality)
- Historical images (public domain)
- Carousel for thematic collections

**Visual Template Needs**:
- Quote card template (period-appropriate typography)
- "This Day" template
- Carousel template for themes

**Caption Structure**:
```
[Hook line]

"[French quote]"
([Translation])

[1-2 lines context]

[Link in bio if relevant]

#MarieBashkirtseff #DiaryOfMarie #19thCentury #WomensHistory #UncensoredDiary #HistoricalDiary #FrenchLiterature #WomenWriters
```

**Hashtag Strategy**:
- Core: #MarieBashkirtseff #DiaryOfMarie
- Reach: #WomensHistory #19thCentury #HistoricalDiary
- Discovery: #FrenchLiterature #WomenWriters #DiaryWriting
- Situational: #Nice1873 #Paris1880s #AcademieJulian

### TikTok / Reels

**Content Formats**:
1. **Dramatic Reading**: Quote on screen, voiceover reading
2. **POV**: "POV: It's 1873 and..."
3. **Mini-doc**: Brief explanation of who Marie was
4. **Contrast**: "Things that haven't changed since 1873"
5. **Quote React**: Present quote, react/contextualize

**Script Structure**:
```
[HOOK - 0:00-0:03]
Text overlay or spoken hook that stops scroll

[CONTENT - 0:03-0:45]
Main content, Marie's words, context

[CTA - 0:45-0:60]
Follow for more, link in bio, etc.
```

**Production Notes**:
- Can be AI voiceover (ElevenLabs, etc.) for readings
- Simple visuals (quote cards, period images)
- Captions essential
- Music: period-appropriate or trending sounds used thoughtfully

---

## Mixpost/Postiz Integration

### Workflow

1. **Generate content** using `/stewardship` skill
2. **Export to queue folder** with platform tags
3. **Import to Mixpost/Postiz** or paste directly
4. **Schedule** according to calendar
5. **Monitor** engagement, adjust timing

### Content Format for Import

```yaml
---
platforms: [reddit, facebook, instagram]
scheduled_for: 2026-02-04T09:00:00+01:00
status: draft
---

# Reddit Version
[Full markdown content]

---

# Facebook Version
[Adapted content]

---

# Instagram Version
[Short content with hashtags]
```

### Scheduling Recommendations

**Reddit**: Morning (9am CET) for European engagement, or evening for US
**Facebook**: Evening (7-9pm CET)
**Instagram**: Lunch (12-1pm) or evening (8-9pm)
**TikTok**: Evening (7-10pm) when people are browsing

---

## Content Ideas Bank

### Recurring Series

1. **"This Day in Marie's Life"** - Daily date-matched content
2. **"Marie on [Topic]"** - Weekly thematic deep-dive
3. **"Meet [Person]"** - Bi-weekly glossary spotlights
4. **"[Place] in [Year]"** - Monthly location features
5. **"Translation Tuesday"** - Weekly translation insight
6. **"Research Friday"** - Weekly discovery or methodology

### One-Time / Seasonal

- **Marie's Birthday** (Nov 24) - Major celebration post
- **Anniversary of Death** (Oct 31) - Respectful remembrance
- **New Year** - Marie's New Year entries, reflection
- **Valentine's Day** - Marie on love, Duke obsession
- **International Women's Day** - Marie's feminist observations
- **Start of Diary** (Jan 11, 1873) - Anniversary of first entry

### Evergreen Content

- "Who was Marie Bashkirtseff?" - Introduction post
- "Why was the diary censored?" - Historical context
- "How we use AI to translate Marie" - Methodology
- "The complete vs. censored diary" - What was removed
- "Marie the painter" - Art focus
- "Marie and feminism" - Her activist writing

---

## Community Management

### Response Templates

**To newcomers asking "Who is this?"**:
> Marie Bashkirtseff (1858-1884) was a Ukrainian-born painter and diarist who kept one of the most remarkable personal documents of the 19th century. Her diary was famous when published in 1887, but was heavily censored by her family. We're finally able to read the complete, uncensored version—and we're translating it into more languages. Welcome! [link to intro post]

**To questions about AI**:
> Great question! We use AI tools to assist with translation, research, and content creation—but Marie's words are always Marie's words. We never simulate her voice or put words in her mouth. The AI is the humble translator, not the author. We're very open about our methodology: [link to methodology post]

**To scholarly inquiries**:
> Thank you for your interest! The original uncensored diary was transcribed by the Cercle des Amis de Marie Bashkirtseff and published in French between 1995-2005. Katherine Kernberger's English translation work is essential reading. Our project builds on this scholarship while adding AI-assisted translation methodology. Happy to discuss further! [links]

### Engagement Principles

1. **Respond substantively** - Not just "thanks!" but add value
2. **Use Marie's words** - Quote her when relevant to conversation
3. **Be transparent** - Answer questions about methodology honestly
4. **Welcome newcomers** - Every new person is a win for Marie
5. **Respect scholars** - We're building on existing work, credit it

---

## Metrics Tracking

### Weekly Review

- Reddit: Post views, comments, new subscribers
- Facebook: Reach, engagement, new followers/members
- Instagram: Impressions, saves, new followers

### Monthly Review

- Overall growth across platforms
- Most engaging content types
- Best performing times/days
- Community sentiment (qualitative)
- Translation progress (connects stewardship to core work)

### Quarterly Review

- Platform strategy adjustment
- Content calendar refinement
- Community health assessment
- Goal progress

---

## Launch Checklist

### Phase 1: Foundation

- [ ] Create Reddit community rules and sidebar
- [ ] Set up Reddit flair system
- [ ] Generate first week of "This Day" content
- [ ] Post introduction/manifesto to Reddit
- [ ] Establish daily posting rhythm

### Phase 2: Expansion

- [ ] Create Facebook Page
- [ ] Create Facebook Group
- [ ] Design Instagram visual templates
- [ ] Set up Instagram account
- [ ] Configure Mixpost/Postiz
- [ ] Begin cross-posting workflow

### Phase 3: Visibility

- [ ] TikTok account setup
- [ ] First Reels content
- [ ] Newsletter setup
- [ ] First newsletter issue
- [ ] Reach out to aligned communities

---

## Emergency Scenarios

### Content Mistake

If wrong date/quote/attribution posted:
1. Correct immediately with edit (if platform allows)
2. If major error, delete and repost with correction note
3. Transparency > perfection

### Community Conflict

If debates become heated:
1. Don't engage defensively
2. Return to Marie's words
3. Acknowledge different views
4. Moderate if necessary

### AI Criticism

If criticized for AI use:
1. Don't be defensive
2. Point to transparency documentation
3. Emphasize Marie as protagonist
4. Invite continued conversation

---

## Resources

### Internal

- `/stewardship` skill for content generation
- `docs/stewardship/STRATEGY.md` for strategic guidance
- `docs/MANIFESTO.md` for core values
- `docs/research/Marie_Bashkirtseff_Legacy.md` for background

### External Links to Share

- Website: bashkirtseff.org
- Wikipedia: en.wikipedia.org/wiki/Marie_Bashkirtseff
- Musée d'Orsay: (link to *The Meeting*)
- Katherine Kernberger's translations: (book links)

### Image Resources

- Marie's paintings (public domain)
- Period photographs of Nice, Paris
- Wikimedia Commons Marie Bashkirtseff category
- Her tomb at Passy Cemetery (visitor photos)
