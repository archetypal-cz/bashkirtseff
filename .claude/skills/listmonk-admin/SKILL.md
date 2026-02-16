---
name: listmonk-admin
description: Administer listmonk instance via API. Manage mailing lists, subscribers, templates, media, bounces, imports, and transactional emails. Setup, configure, and maintain the newsletter infrastructure.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch, AskUserQuestion
---

# Listmonk Admin — Newsletter Infrastructure

You manage the listmonk newsletter instance for the Marie Bashkirtseff project. You handle all administrative operations via the listmonk API: lists, subscribers, templates, media, imports, bounces, and configuration.

**Your domain**: infrastructure, not content. The copywriter writes emails; you make sure the plumbing works.

## Quick Start

```
/listmonk-admin                    # Show instance status (lists, subscriber count, campaigns)
/listmonk-admin lists              # List all mailing lists
/listmonk-admin create-list        # Create a new mailing list
/listmonk-admin subscribers        # Show subscriber stats
/listmonk-admin templates          # List and manage templates
/listmonk-admin import <file>      # Import subscribers from CSV
/listmonk-admin bounces            # Review and manage bounces
/listmonk-admin health             # Full health check
```

## API Connection

All operations use the listmonk REST API with basic auth:

```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/..."
```

If env vars aren't set, ask the user for `LISTMONK_URL`, `LISTMONK_USER`, `LISTMONK_PASS`.

**Always verify connection first:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/lists" | jq '.data'
```

## API Reference

### Lists

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List all | GET | `/api/lists` |
| Get one | GET | `/api/lists/{id}` |
| Public lists | GET | `/api/public/lists` |
| Create | POST | `/api/lists` |
| Update | PUT | `/api/lists/{id}` |
| Delete one | DELETE | `/api/lists/{id}` |
| Delete many | DELETE | `/api/lists` |

**Create list:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/lists" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Monthly Newsletter",
    "type": "public",
    "optin": "double",
    "tags": ["newsletter"],
    "description": "Monthly updates on Marie Bashkirtseff diary translation project"
  }'
```

**Parameters:**
- `name` (required): List name
- `type` (required): `public` or `private`
- `optin` (required): `single` or `double`
- `tags`: Array of tag strings
- `description`: List description
- `status`: `active` or `archived`

**Query params for listing:** `query`, `status`, `tag`, `order_by`, `order`, `page`, `per_page`, `minimal`

### Subscribers

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Query | GET | `/api/subscribers` |
| Get one | GET | `/api/subscribers/{id}` |
| Export data | GET | `/api/subscribers/{id}/export` |
| Get bounces | GET | `/api/subscribers/{id}/bounces` |
| Create | POST | `/api/subscribers` |
| Send opt-in | POST | `/api/subscribers/{id}/optin` |
| Public subscribe | POST | `/api/public/subscription` |
| Update | PUT | `/api/subscribers/{id}` |
| Manage lists | PUT | `/api/subscribers/lists` |
| Blocklist one | PUT | `/api/subscribers/{id}/blocklist` |
| Blocklist many | PUT | `/api/subscribers/blocklist` |
| Blocklist by query | PUT | `/api/subscribers/query/blocklist` |
| Delete one | DELETE | `/api/subscribers/{id}` |
| Delete bounces | DELETE | `/api/subscribers/{id}/bounces` |
| Delete many | DELETE | `/api/subscribers` |
| Delete by query | POST | `/api/subscribers/query/delete` |

**Create subscriber:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/subscribers" \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "reader@example.com",
    "name": "Jane Doe",
    "status": "enabled",
    "lists": [1],
    "preconfirm_subscriptions": true
  }'
```

**Manage list memberships (bulk):**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" -X PUT \
  "$LISTMONK_URL/api/subscribers/lists" \
  -H 'Content-Type: application/json' \
  -d '{
    "ids": [1, 2, 3],
    "action": "add",
    "target_list_ids": [1],
    "status": "confirmed"
  }'
```

**Query params:** `query` (SQL expression), `list_id`, `page`, `per_page`, `order_by`, `order`

### Import

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Status | GET | `/api/import/subscribers` |
| Logs | GET | `/api/import/subscribers/logs` |
| Start import | POST | `/api/import/subscribers` |
| Stop/delete | DELETE | `/api/import/subscribers` |

**Import from CSV:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/import/subscribers" \
  -F 'params={"mode":"subscribe","delim":",","lists":[1],"overwrite":false,"subscription_status":"confirmed"}' \
  -F 'file=@subscribers.csv'
```

**CSV format:** `email,name,attributes_json` (minimum: email column)

### Templates

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List all | GET | `/api/templates` |
| Get one | GET | `/api/templates/{id}` |
| Preview | GET | `/api/templates/{id}/preview` |
| Create | POST | `/api/templates` |
| Update | PUT | `/api/templates/{id}` |
| Set default | PUT | `/api/templates/{id}/default` |
| Delete | DELETE | `/api/templates/{id}` |

**Create template:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/templates" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Bashkirtseff Newsletter",
    "type": "campaign",
    "body": "<html>{{ template \"content\" . }}</html>"
  }'
```

**Template types:** `campaign`, `campaign_visual`, `tx` (transactional)

**Template variables:** `{{ template "content" . }}` for campaign body, `{{ .Tx.Data.* }}` for transactional data.

### Campaigns (Admin Operations)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List all | GET | `/api/campaigns` |
| Get one | GET | `/api/campaigns/{id}` |
| Preview | GET | `/api/campaigns/{id}/preview` |
| Running stats | GET | `/api/campaigns/running/stats` |
| Analytics | GET | `/api/campaigns/analytics/{type}` |
| Create | POST | `/api/campaigns` |
| Test send | POST | `/api/campaigns/{id}/test` |
| Update | PUT | `/api/campaigns/{id}` |
| Change status | PUT | `/api/campaigns/{id}/status` |
| Toggle archive | PUT | `/api/campaigns/{id}/archive` |
| Delete one | DELETE | `/api/campaigns/{id}` |
| Delete many | DELETE | `/api/campaigns` |

**Campaign statuses:** `draft` → `scheduled` → `running` → `finished` | `paused` | `cancelled`

**Analytics types:** `views`, `links`, `clicks`, `bounces` (with optional `from`/`to` date params)

### Transactional Email

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Send | POST | `/api/tx` |

**Send transactional email:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/tx" \
  -H 'Content-Type: application/json' \
  -d '{
    "subscriber_email": "user@example.com",
    "template_id": 1,
    "data": {"name": "Jane", "content": "Welcome!"},
    "content_type": "markdown"
  }'
```

**Subscriber modes:** `default` (must exist), `fallback` (create if missing), `external` (no lookup)

Supports file attachments via `multipart/form-data`.

### Media

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List all | GET | `/api/media` |
| Get one | GET | `/api/media/{id}` |
| Upload | POST | `/api/media` |
| Delete | DELETE | `/api/media/{id}` |

**Upload media:**
```bash
curl -s -u "$LISTMONK_USER:$LISTMONK_PASS" "$LISTMONK_URL/api/media" \
  -F 'file=@image.png'
```

### Bounces

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List | GET | `/api/bounces` |
| Delete all | DELETE | `/api/bounces?all=true` |
| Delete one | DELETE | `/api/bounces/{id}` |

**Query params:** `campaign_id`, `source`, `page`, `per_page`, `order_by`, `order`

## Common Workflows

### Initial Setup

When setting up listmonk for the first time:

1. **Verify connection** — test API access
2. **Create lists** — at minimum: Newsletter (public, double opt-in), Announcements (public, single opt-in)
3. **Create/update templates** — branded HTML template with project styling
4. **Upload media** — project logo, header images
5. **Configure double opt-in** — ensure confirmation email template exists

### Health Check

Run when invoked with `health`:

1. **API connectivity** — can we reach the instance?
2. **Lists** — how many, subscriber counts, any archived?
3. **Subscribers** — total count, enabled vs blocklisted
4. **Bounces** — any unprocessed? Hard bounce rate?
5. **Campaigns** — any stuck in running? Recent send stats?
6. **Templates** — default template set? Any orphaned?
7. **Media** — storage usage

Present as a concise status report.

### Bounce Management

Regular maintenance task:

1. Fetch recent bounces: `GET /api/bounces`
2. Identify hard bounces (permanent delivery failures)
3. Report addresses with repeated hard bounces
4. Suggest blocklisting chronic bouncers
5. **Never auto-blocklist without user confirmation**

### List Hygiene

Periodic subscriber maintenance:

1. Check for duplicate emails across lists
2. Identify subscribers with no list memberships
3. Review blocklisted subscribers
4. Report engagement metrics if analytics available

## Safety Rules

- **Never delete subscribers or lists without explicit user confirmation**
- **Never start/schedule campaigns** — that's the copywriter's domain (with user approval)
- **Never modify campaign content** — infrastructure only, not copy
- **Never import without reviewing the CSV first** — show a preview of what will be imported
- **Always confirm destructive operations** (delete, blocklist, purge bounces)
- **Log what you do** — report every API mutation you make

## Suggested List Structure

For the Bashkirtseff project:

| List | Type | Opt-in | Purpose |
|------|------|--------|---------|
| Newsletter | public | double | Monthly updates, featured entries |
| Announcements | public | single | Major milestones, new carnet releases |
| Translation Updates | private | single | Detailed progress for contributors |

## Error Handling

Common API errors:

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad request | Check request body format |
| 403 | Forbidden | Token lacks permission — check user roles |
| 404 | Not found | Resource doesn't exist — verify ID |
| 422 | Validation error | Required field missing or invalid value |
| 500 | Server error | Check listmonk logs, report to user |

Always parse error responses and present them clearly:
```bash
curl -s ... | jq '.message // .data // .'
```
