#!/usr/bin/env npx tsx
/**
 * PreToolUse hook for Bash: Git working-tree safety guard
 *
 * Receives JSON via stdin with: tool_name, tool_input.command, session_id,
 * transcript_path, hook_event_name, cwd (shape modelled on validate-write.ts).
 *
 * Purpose: block working-tree- or history-destroying git commands that have
 * previously discarded uncommitted work (a subagent once ran `git checkout --`,
 * `git stash`, and `git reset` that silently wiped broken-link fixes living only
 * in the working tree). See docs/INFRASTRUCTURE.md "Git Working-Tree Safety Guard".
 *
 * Deny contract (Claude Code 2.x): emit JSON on stdout with
 *   hookSpecificOutput.permissionDecision = "deny" + permissionDecisionReason
 * and exit 0. This is the current supported PreToolUse decision form. We also
 * exit 2 with a stderr message as a belt-and-suspenders fallback for the legacy
 * contract; either path blocks the call.
 *
 * Allow path: emit nothing meaningful and exit 0 (the call proceeds normally).
 *
 * Override: prefix the command with `GIT_ALLOW_DESTRUCTIVE=1` to consciously
 * bypass the SOFT-block (main agent / human only — subagents cannot override).
 *
 * SUBAGENT DETECTION (investigated 2026-05-31, Claude Code 2.1.158):
 * A one-shot probe hook captured a real PreToolUse stdin payload. In this
 * version the payload DOES distinguish a Task (subagent) call from the main
 * agent: subagent payloads carry an `agent_type` field (e.g. "general-purpose")
 * and an `agent_id`; the main agent's payload has NO `agent_type`. Full key set
 * observed for a subagent: agent_id, agent_type, cwd, effort, hook_event_name,
 * permission_mode, session_id, tool_input, tool_name, tool_use_id,
 * transcript_path.
 *
 * Policy, per the work order:
 *   - Subagent (agent_type present)  -> HARD-block destructive git. The
 *     GIT_ALLOW_DESTRUCTIVE=1 override is IGNORED. A subagent that thinks it
 *     needs a mutating git op must stop and report to its parent instead.
 *   - Main agent (no agent_type)     -> SOFT-block. Destructive git is denied by
 *     default, but GIT_ALLOW_DESTRUCTIVE=1 lets a human/main-agent proceed
 *     deliberately.
 * This stops the accidental case for everyone while reserving the conscious
 * escape hatch for the main agent only (which is where a human is in the loop).
 *
 * Fast and dependency-light: no imports beyond node:fs (runs on every Bash call).
 */

import { readFileSync, existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';

interface GuardInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    [key: string]: unknown;
  };
  session_id?: string;
  transcript_path?: string;
  hook_event_name?: string;
  cwd?: string;
  /** Present only for subagent (Task) calls in Claude Code 2.x; absent for the main agent. */
  agent_type?: string;
  agent_id?: string;
  [key: string]: unknown;
}

/** Allow the call to proceed: emit nothing, exit 0. */
function allow(): never {
  process.exit(0);
}

/** Block the call: emit deny JSON (current contract) + exit 2 (legacy fallback). */
function deny(reason: string): never {
  const message =
    `BLOCKED by git working-tree safety guard.\n${reason}\n\n` +
    `This command can destroy uncommitted work or rewrite history.\n` +
    `If you genuinely intend this, re-run prefixed with GIT_ALLOW_DESTRUCTIVE=1, e.g.:\n` +
    `  GIT_ALLOW_DESTRUCTIVE=1 <your command>\n` +
    `Prefer: commit early (git add + git commit) so work is never one stray command from gone.`;

  // Current Claude Code PreToolUse decision contract (stdout JSON, exit 0-style),
  // but we also exit 2 so the legacy stderr-exit-2 contract blocks too. Emitting
  // the JSON first then exiting 2 satisfies both readers.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: message,
      },
      // Legacy decision field, harmless to include:
      decision: 'block',
      reason: message,
    }),
  );
  console.error(message);
  process.exit(2);
}

/**
 * Returns a human-readable reason string if the command is destructive and
 * should be blocked, or null if it is safe / not a git command.
 */
function classify(rawCommand: string, cwd?: string): string | null {
  const command = rawCommand.trim();

  // Resolve an argument against the payload cwd (else process.cwd()) and report
  // whether it names an existing file/dir on disk. Used to tell a real path
  // (e.g. `content/...` exists -> overwrite -> block) from a branch ref
  // (e.g. `feature/x` doesn't exist on disk -> switch -> allow). A leading `:/`
  // or pathspec magic is treated as a path conservatively.
  const baseDir = cwd && isAbsolute(cwd) ? cwd : process.cwd();
  const argIsExistingPath = (arg: string): boolean => {
    if (!arg) return false;
    try {
      const abs = isAbsolute(arg) ? arg : resolve(baseDir, arg);
      return existsSync(abs);
    } catch {
      return false;
    }
  };

  // Only concern ourselves with git invocations. Split on shell separators so a
  // chained command like `foo && git reset --hard` is still inspected.
  const segments = command.split(/&&|\|\||;|\|/);

  for (const segRaw of segments) {
    let seg = segRaw.trim();

    // Strip a leading `sudo` and any leading ENV=VAR assignments so the command
    // word is exposed. This is also how we avoid matching `git` when it appears
    // only as an argument (e.g. `echo git reset --hard`): the segment must START
    // with the git command word.
    seg = seg.replace(/^sudo\s+/, '');
    while (true) {
      const m = seg.match(/^[A-Za-z_][A-Za-z0-9_]*=\S*\s+/);
      if (!m) break;
      seg = seg.slice(m[0].length);
    }

    // The segment must begin with the literal `git` command word.
    if (!/^git(\s|$)/.test(seg)) continue;

    // Everything after the literal leading `git` token.
    let rest = seg.replace(/^git\b/, '').trim();
    // Strip global options that precede the subcommand.
    while (true) {
      const m = rest.match(/^(-C\s+\S+|-c\s+\S+|--no-pager|--git-dir\s+\S+|--work-tree\s+\S+|-p|--paginate)\s+/);
      if (!m) break;
      rest = rest.slice(m[0].length).trim();
    }

    const tokens = rest.split(/\s+/);
    const sub = tokens[0] || '';
    const args = tokens.slice(1);
    const argStr = args.join(' ');

    // --- git reset --hard ---
    if (sub === 'reset' && args.includes('--hard')) {
      return 'git reset --hard discards all uncommitted changes in tracked files.';
    }

    // --- git stash (bare, or destructive subcommands) ---
    if (sub === 'stash') {
      const stashSub = args.find((a) => !a.startsWith('-')) || '';
      if (stashSub === '' || ['drop', 'pop', 'clear', 'push', 'save'].includes(stashSub)) {
        return 'git stash moves/clears uncommitted changes off the working tree (recoverable only via reflog, easily lost).';
      }
      // `git stash list/show` are read-only -> allow.
    }

    // --- git clean -f / -d / -x ---
    if (sub === 'clean') {
      if (/-[a-z]*[fdx]/.test(argStr) || args.includes('--force')) {
        return 'git clean -f/-d/-x permanently deletes untracked (and possibly ignored) files.';
      }
    }

    // --- git push --force / --force-with-lease ---
    if (sub === 'push') {
      if (args.includes('--force') || args.includes('-f') || args.some((a) => a.startsWith('--force-with-lease'))) {
        return 'git push --force / --force-with-lease rewrites remote history.';
      }
      // normal push -> allow
    }

    // --- git rebase ---
    if (sub === 'rebase') {
      // allow `git rebase --abort` / `--continue` / `--skip` (recovery ops)
      if (args.includes('--abort') || args.includes('--continue') || args.includes('--skip')) {
        continue;
      }
      return 'git rebase rewrites history and can drop commits / disturb the working tree.';
    }

    // --- git branch -D (force-delete) ---
    if (sub === 'branch') {
      if (args.includes('-D') || (args.includes('--delete') && args.includes('--force'))) {
        return 'git branch -D force-deletes a branch ref (may orphan unmerged commits).';
      }
      // `git branch`, `git branch -a`, `git branch -d <merged>` -> allow
    }

    // --- git checkout / git restore: block only genuine working-tree overwrites ---
    if (sub === 'checkout' || sub === 'restore') {
      // `git checkout -b X` / `git checkout -B X` -> creating a branch, safe.
      if (sub === 'checkout' && (args.includes('-b') || args.includes('-B'))) {
        continue;
      }

      const hasDashDash = args.includes('--');
      const hasForce = args.includes('-f') || args.includes('--force');
      const positional = args.filter((a) => a !== '--' && !a.startsWith('-'));

      // A bare `.` always means "everything in cwd" -> overwrite working tree.
      if (positional.includes('.')) {
        return `git ${sub} . overwrites all modified tracked files in the path with the committed version.`;
      }
      // Explicit path separator `--` -> the following args are paths -> overwrite.
      if (hasDashDash) {
        return `git ${sub} -- <path> overwrites the named working-tree files, discarding local edits.`;
      }
      // Forced checkout discards local changes even on a branch switch.
      if (hasForce) {
        return `git ${sub} -f/--force discards local working-tree changes.`;
      }
      // Otherwise: only destructive if some positional arg resolves to an existing
      // file/dir on disk. That reliably distinguishes a real path (content/... ,
      // src/foo.ts — exists -> block) from a branch ref (feature/x , main —
      // does NOT exist as a file -> allow), even when the ref contains a slash.
      // git itself refuses a bare `git checkout <ref>` that would clobber
      // uncommitted changes (no -f), so a non-path ref switch is safe to allow.
      // NOTE on `git restore <nonexistent>`: with no `--`/`.`/`-f` and no on-disk
      // path match we ALLOW it; git restore of a non-existent pathspec just errors
      // harmlessly without touching the working tree.
      if (positional.some(argIsExistingPath)) {
        return `git ${sub} <path> overwrites the named working-tree files, discarding local edits.`;
      }
      // No path-ish signal -> treat as a branch/ref switch -> allow.
    }
  }

  return null;
}

function main(): void {
  let input: GuardInput;
  try {
    const stdin = readFileSync(0, 'utf-8');
    input = JSON.parse(stdin);
  } catch {
    // No parseable input -> don't block anything.
    allow();
  }

  const command = input.tool_input?.command;
  if (!command || typeof command !== 'string') {
    allow();
  }

  const reason = classify(command as string, input.cwd);
  if (!reason) {
    allow();
  }

  // Subagent (Task) calls carry `agent_type`; the main agent does not.
  const isSubagent = typeof input.agent_type === 'string' && input.agent_type.length > 0;

  // Override marker present anywhere as an env-style prefix on the command.
  const hasOverride = /(^|\s|;|&&|\|\|)GIT_ALLOW_DESTRUCTIVE=1(\s|$)/.test(
    (command as string).trim(),
  );

  if (isSubagent) {
    // HARD-block for subagents: override is ignored.
    deny(
      `${reason}\n[subagent: agent_type="${input.agent_type}"] Destructive git is ` +
        `HARD-blocked for subagents — the GIT_ALLOW_DESTRUCTIVE=1 override does NOT ` +
        `apply here. Stop and report to your parent agent instead of mutating git.`,
    );
  }

  // Main agent: soft-block, honour the conscious override.
  if (hasOverride) {
    allow();
  }
  deny(reason as string);
}

main();
