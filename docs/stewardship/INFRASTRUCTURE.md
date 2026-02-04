# Stewardship Infrastructure

Technical integration guide for the content pipeline.

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Content Generation                          │
│                                                                   │
│  Claude Code + /stewardship skill                                │
│  └─> Generates content in structured format                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Output Queue                                │
│                                                                   │
│  docs/stewardship/queue/                                         │
│  └─> Platform-tagged markdown files                              │
│  └─> JSON metadata for automation                                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Reddit Scripts │ │     Postiz      │ │    Listmonk     │
│                 │ │                 │ │                 │
│  Custom scripts │ │  FB, IG, X,     │ │  Newsletter     │
│  for /r/bashk   │ │  LinkedIn, etc  │ │  campaigns      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Content Generation Layer

### `/stewardship` Skill

Generates content and outputs in automation-ready format.

**Invocation**:
```
/stewardship

Generate this week's content queue:
- This Day posts for [date range]
- Platform: all (reddit, facebook, instagram, tiktok)
- Output format: queue files
```

### Queue File Format

Each content piece outputs to `docs/stewardship/queue/`:

**Filename convention**: `{date}-{type}-{platform}.md`

Example: `2026-02-04-thisday-reddit.md`

**File structure**:
```yaml
---
# Metadata for automation
type: this_day
source_date: 1873-02-04
target_date: 2026-02-04
platforms:
  - reddit
  - facebook
  - instagram
status: draft  # draft | approved | scheduled | posted
created: 2026-02-04T09:00:00Z
---

# Reddit Version

**February 4, 1873** — Nice | Marie is 14

> "Je veux tout, et tout de suite."
> (I want everything, and I want it now.)

[Full Reddit content...]

---
# Facebook Version

[Adapted content...]

---
# Instagram Version

[Short content with hashtags...]

---
# TikTok Script

[Hook, reading, context, CTA...]
```

### Batch Generation

Generate a week's content in one session:

```
/stewardship

Batch generate:
- Type: this_day
- Date range: 2026-02-04 to 2026-02-10
- Platforms: reddit, facebook, instagram
- Output: queue files

Also generate:
- 1 thematic post (theme: ambition)
- 1 "Meet [Person]" post (suggest from recent entries)
```

---

## Reddit Integration

### Existing Scripts

Your Reddit scripts handle posting to /r/bashkirtseff. The stewardship skill outputs Reddit-ready markdown.

**Integration points**:
- Queue files with `platforms: [reddit]` or `platforms: [all]`
- Content in Reddit markdown format
- Flair suggestion in metadata

**Suggested queue format for Reddit scripts**:
```yaml
---
platform: reddit
subreddit: bashkirtseff
flair: This Day
title: "February 4, 1873 — \"I want everything, and I want it now.\""
scheduled_for: 2026-02-04T09:00:00Z
---

[Post body in Reddit markdown...]
```

### Reddit-Specific Content

The skill generates Reddit-appropriate content:
- Full markdown formatting
- Longer form acceptable
- Links to website
- Discussion prompts for community engagement

---

## Postiz Integration

### API Overview

[Postiz Public API](https://docs.postiz.com/public-api) provides:
- `POST /posts/schedule` - Schedule posts
- `POST /upload` - Upload media (returns Postiz URL)

### Supported Platforms

Facebook, Instagram, TikTok, YouTube, Reddit, LinkedIn, Threads, Pinterest, X/Twitter, BlueSky, Mastodon, Discord, Lemmy, Nostr, Warpcast

### Authentication

API key in header: `Authorization: Bearer {API_KEY}`

### Scheduling a Post

```bash
curl -X POST https://your-postiz-instance/api/posts/schedule \
  -H "Authorization: Bearer $POSTIZ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["facebook-page-id", "instagram-id"],
    "content": "Post content here...",
    "scheduledAt": "2026-02-04T09:00:00Z",
    "media": ["https://postiz-url/uploaded-image.jpg"]
  }'
```

### Media Upload

```bash
curl -X POST https://your-postiz-instance/api/upload \
  -H "Authorization: Bearer $POSTIZ_API_KEY" \
  -F "file=@/path/to/image.jpg"
```

Returns URL to use in post.

### Automation Script Concept

```typescript
// scripts/stewardship-publish.ts

import { readdir, readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';

const POSTIZ_API = process.env.POSTIZ_API_URL;
const POSTIZ_KEY = process.env.POSTIZ_API_KEY;

async function publishApprovedContent() {
  const queueDir = 'docs/stewardship/queue';
  const files = await readdir(queueDir);

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const content = await readFile(`${queueDir}/${file}`, 'utf-8');
    const [, frontmatter, ...body] = content.split('---');
    const meta = parseYaml(frontmatter);

    if (meta.status !== 'approved') continue;

    // Extract platform-specific content
    const platforms = meta.platforms || [];

    for (const platform of platforms) {
      if (platform === 'reddit') {
        // Use Reddit scripts
        await publishToReddit(meta, body);
      } else {
        // Use Postiz
        await publishToPostiz(platform, meta, body);
      }
    }

    // Update status to scheduled
    await updateStatus(file, 'scheduled');
  }
}

async function publishToPostiz(platform: string, meta: any, content: string) {
  const channelId = getChannelId(platform); // Map platform to Postiz channel ID

  const response = await fetch(`${POSTIZ_API}/posts/schedule`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POSTIZ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channels: [channelId],
      content: extractPlatformContent(content, platform),
      scheduledAt: meta.scheduled_for
    })
  });

  return response.json();
}
```

---

## Listmonk Integration

### Newsletter Content Generation

The stewardship skill can generate newsletter-ready content.

**Request**:
```
/stewardship

Generate monthly newsletter for February 2026:
- Translation progress summary
- 3 featured entries from the month
- Best quote of the month
- What's coming next
- Format: Listmonk HTML template
```

### Listmonk API

[Listmonk API docs](https://listmonk.app/docs/apis/apis/) for:
- Creating campaigns
- Sending to lists
- Managing subscribers

### Newsletter Template

```html
<!-- Listmonk template -->
<h1>Marie Bashkirtseff Project — {{ .Month }} {{ .Year }}</h1>

<h2>Translation Progress</h2>
<p>{{ .ProgressSummary }}</p>

<h2>Featured This Month</h2>
{{ range .FeaturedEntries }}
<blockquote>
  <p>"{{ .QuoteFr }}"</p>
  <p><em>({{ .QuoteEn }})</em></p>
  <p>— Marie, {{ .Date }}</p>
</blockquote>
{{ end }}

<h2>Quote of the Month</h2>
<blockquote>{{ .QuoteOfMonth }}</blockquote>

<h2>Coming Up</h2>
<p>{{ .ComingUp }}</p>

<p><a href="https://bashkirtseff.aretea.cz">Read the diary →</a></p>
```

---

## Workflow: Daily "This Day" Pipeline

### Fully Automated (Future Goal)

```
1. Cron triggers at 06:00 UTC
2. Script invokes Claude API with stewardship prompt
3. Content generated for today's date
4. Output written to queue with status: draft
5. Human reviews queue (optional step)
6. Approved content → Reddit scripts + Postiz API
7. Posted across platforms
8. Status updated to: posted
```

### Semi-Automated (Current)

```
1. Human invokes /stewardship in Claude Code
2. Content generated, reviewed in conversation
3. Approved content copied to queue
4. Scripts/API called manually or via justfile
5. Posted
```

### Justfile Commands

```just
# Stewardship commands

# Generate this week's content
stewardship-generate:
    @echo "Invoke /stewardship skill in Claude Code"

# Review queue
stewardship-queue:
    ls -la docs/stewardship/queue/

# Publish approved content to Reddit
stewardship-reddit:
    ./scripts/reddit-publish.sh

# Publish approved content to Postiz
stewardship-postiz:
    npx ts-node scripts/stewardship-publish.ts

# Publish to all platforms
stewardship-publish: stewardship-reddit stewardship-postiz

# Send newsletter via Listmonk
stewardship-newsletter:
    ./scripts/listmonk-send.sh
```

---

## Content Approval Workflow

### Status Flow

```
draft → approved → scheduled → posted
              ↓
           rejected (with notes)
```

### Queue Management

**View pending content**:
```bash
grep -l "status: draft" docs/stewardship/queue/*.md
```

**Approve content**:
```bash
# Edit file, change status: draft → status: approved
# Or use a script:
./scripts/stewardship-approve.sh 2026-02-04-thisday-reddit.md
```

**Bulk approve**:
```bash
./scripts/stewardship-approve.sh --all-drafts
```

---

## Platform Channel Mapping

Configure in `docs/stewardship/channels.yaml`:

```yaml
# Postiz channel IDs
postiz:
  facebook_page: "fb-123456"
  instagram: "ig-789012"
  twitter: "x-345678"
  linkedin: "li-901234"
  threads: "th-567890"
  bluesky: "bs-123456"
  mastodon: "ma-789012"

# Reddit (handled by custom scripts)
reddit:
  subreddit: "bashkirtseff"

# Listmonk
listmonk:
  list_id: 1
  template_id: 5
```

---

## Future: n8n Workflows

Both [Mixpost](https://docs.mixpost.app/) and [Postiz](https://postiz.com/blog/use-postiz-with-n-8-n) support n8n integration.

Potential workflows:
- **Daily This Day**: Cron → Generate → Approve (manual) → Publish
- **Translation milestone**: Webhook on carnet completion → Generate announcement → Publish
- **Engagement response**: New Reddit comment → Draft response → Human review → Post

---

## Environment Variables

```bash
# Postiz
POSTIZ_API_URL=https://your-postiz.example.com/api
POSTIZ_API_KEY=your-api-key

# Listmonk
LISTMONK_API_URL=https://your-listmonk.example.com/api
LISTMONK_USER=admin
LISTMONK_PASSWORD=your-password

# Reddit (for your scripts)
REDDIT_CLIENT_ID=your-client-id
REDDIT_CLIENT_SECRET=your-client-secret
REDDIT_USERNAME=your-username
REDDIT_PASSWORD=your-password

# Claude API (for automated generation)
ANTHROPIC_API_KEY=your-key
```

---

## Monitoring

### Content Published Log

Maintain `docs/stewardship/published.log`:

```
2026-02-04T09:15:00Z | this_day | reddit | 1873-02-04 | https://reddit.com/r/bashkirtseff/...
2026-02-04T09:16:00Z | this_day | facebook | 1873-02-04 | https://facebook.com/...
2026-02-04T09:17:00Z | this_day | instagram | 1873-02-04 | https://instagram.com/p/...
```

### Metrics Collection

Weekly script to collect:
- Reddit: subscribers, post views, comments (via Reddit API)
- Postiz: engagement metrics (if available via API)
- Listmonk: subscriber count, open rates, click rates
- Website: visitors to diary pages (analytics)

---

## Security Notes

- API keys in environment variables, not in code
- Queue files may contain scheduled content - don't commit to public repo if sensitive
- Review automation before enabling fully autonomous posting
- Human approval step recommended until confidence established
