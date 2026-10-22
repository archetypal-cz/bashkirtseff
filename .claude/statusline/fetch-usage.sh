#!/bin/sh
# Fetches Claude API usage stats and writes them to /tmp/.claude_usage_cache.
# Line 1: five_hour.utilization (integer %)
# Line 2: seven_day.utilization (integer %)
# Line 3: five_hour.resets_at (raw ISO string)
# Line 4: seven_day.resets_at (raw ISO string)
# All output is suppressed; meant to be run in background.
#
# Cross-platform (macOS + Linux). Requires: curl, jq
# Based on: https://www.reddit.com/r/ClaudeCode/comments/1rg3nmt/my_minimal_claude_code_statusline_config/

CACHE_FILE="/tmp/.claude_usage_cache"

# Throttle: the hooks fire on every tool call; refresh at most once a minute.
if [ -f "$CACHE_FILE" ] && [ $(( $(date +%s) - $(stat -c %Y "$CACHE_FILE" 2>/dev/null || stat -f %m "$CACHE_FILE") )) -lt 60 ]; then
  exit 0
fi

# --- get OAuth token (platform-specific) ---
token=""
case "$(uname -s)" in
  Darwin)
    # macOS: read from Keychain
    raw_creds=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null)
    if [ -n "$raw_creds" ]; then
      token=$(printf '%s' "$raw_creds" | xxd -r -p 2>/dev/null | grep -o 'sk-ant-oat01-[A-Za-z0-9_-]*' | head -1)
    fi
    ;;
  *)
    # Linux/WSL: read from credentials JSON file
    CREDS_FILE="$HOME/.claude/.credentials.json"
    if [ -f "$CREDS_FILE" ]; then
      token=$(jq -r '.claudeAiOauth.accessToken // empty' "$CREDS_FILE" 2>/dev/null)
    fi
    ;;
esac

if [ -z "$token" ]; then
  exit 0
fi

usage_json=$(curl -s -m 10 \
  -H "accept: application/json" \
  -H "anthropic-beta: oauth-2025-04-20" \
  -H "authorization: Bearer $token" \
  -H "user-agent: claude-code/2.1.11" \
  "https://api.anthropic.com/oauth/usage" 2>/dev/null)

if [ -z "$usage_json" ]; then
  exit 0
fi

five_h_raw=$(printf '%s' "$usage_json" | jq -r '.five_hour.utilization // empty' 2>/dev/null)
seven_d_raw=$(printf '%s' "$usage_json" | jq -r '.seven_day.utilization // empty' 2>/dev/null)
five_h_reset=$(printf '%s' "$usage_json" | jq -r '.five_hour.resets_at // ""' 2>/dev/null)
seven_d_reset=$(printf '%s' "$usage_json" | jq -r '.seven_day.resets_at // ""' 2>/dev/null)

if [ -n "$five_h_raw" ] && [ -n "$seven_d_raw" ]; then
  five_h=$(printf "%.0f" "$five_h_raw")
  seven_d=$(printf "%.0f" "$seven_d_raw")
  printf '%s\n%s\n%s\n%s\n' "$five_h" "$seven_d" "$five_h_reset" "$seven_d_reset" > "$CACHE_FILE"
fi
