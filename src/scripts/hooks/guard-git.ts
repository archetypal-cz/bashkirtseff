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

  // Quote-aware tokenizer. Keeps `git restore "my file.md"` as ONE token and
  // normalises `\git` / `'git'` / "--hard" to their bare forms. Deliberately not
  // a shell grammar: no expansion, no here-docs, no operator handling.
  const tokenize = (input: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let started = false;
    let quote: string | null = null;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
          continue;
        }
        if (quote === '"' && ch === '\\' && i + 1 < input.length) {
          cur += input[++i];
          continue;
        }
        cur += ch;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        started = true;
        continue;
      }
      if (ch === '\\' && i + 1 < input.length) {
        cur += input[++i];
        started = true;
        continue;
      }
      if (/\s/.test(ch)) {
        if (started) {
          out.push(cur);
          cur = '';
          started = false;
        }
        continue;
      }
      cur += ch;
      started = true;
    }
    if (started) out.push(cur);
    return out;
  };

  // Wrapper options that consume a following operand. Missing one would leave the
  // operand looking like the command word (`env -u X git …` -> `X`).
  const WRAPPER_OPERAND_OPTS: Record<string, string[]> = {
    env: ['-u', '--unset', '-C', '--chdir', '--block-signal', '--default-signal', '--ignore-signal'],
    sudo: [
      '-u', '--user', '-g', '--group', '-p', '--prompt', '-C', '--close-from',
      '-D', '--chdir', '-h', '--host', '-r', '--role', '-t', '--type',
      '-U', '--other-user', '-R', '--chroot',
    ],
    command: [],
  };

  // git's own global options that consume a following operand when given bare.
  // Attached forms (`-C.`, `-ccore.x=y`, `--git-dir=.git`) carry their own value.
  const GIT_OPERAND_OPTS = [
    '-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env',
    '--super-prefix', '--attr-source',
  ];

  // Short options whose value may be attached (`-sHEAD`, `-mmsg`): such a token is
  // NOT a combined flag cluster and must not be expanded letter by letter.
  const ATTACHED_VALUE_SHORTS = new Set(['s', 'm', 'o', 'F', 'C']);

  // Only concern ourselves with git invocations. Split on shell separators so a
  // chained command like `foo && git reset --hard` is still inspected.
  const segments = command.split(/&&|\|\||;|\||\n|\$\(|`/);

  for (const segRaw of segments) {
    // A trailing `)` closes the `$(...)` we split on.
    const seg = segRaw.trim().replace(/\)+$/, '');
    if (!seg) continue;

    const tokens = tokenize(seg);
    let i = 0;

    // Strip leading `ENV=VAL` assignments and `sudo`/`env`/`command` wrappers,
    // consuming wrapper options AND their operands, so the command word is
    // exposed. This is also how we avoid matching `git` when it appears only as
    // an argument (`echo git reset --hard`): the segment must START with git.
    while (i < tokens.length) {
      const t = tokens[i];
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) {
        i++;
        continue;
      }
      if (t !== 'sudo' && t !== 'env' && t !== 'command') break;
      const operandOpts = WRAPPER_OPERAND_OPTS[t];
      i++;
      while (i < tokens.length && tokens[i].startsWith('-') && tokens[i] !== '--') {
        const opt = tokens[i];
        i++;
        // `env -S '<command line>'` hides a whole command line in one operand:
        // expand it in place rather than skipping over it.
        if (opt === '-S' || opt === '--split-string') {
          if (i < tokens.length) tokens.splice(i, 1, ...tokenize(tokens[i]));
          break;
        }
        if ((opt.startsWith('-S') && opt.length > 2) || opt.startsWith('--split-string=')) {
          tokens.splice(i, 0, ...tokenize(opt.replace(/^(?:-S|--split-string=)/, '')));
          break;
        }
        if (operandOpts.includes(opt) && i < tokens.length) i++;
      }
      if (i < tokens.length && tokens[i] === '--') i++;
    }

    // The segment must begin with the literal `git` command word.
    if (tokens[i] !== 'git') continue;
    i++;

    // Strip git global options (separated or attached) before the subcommand.
    while (i < tokens.length && tokens[i].startsWith('-') && tokens[i] !== '--') {
      const opt = tokens[i];
      i++;
      if (GIT_OPERAND_OPTS.includes(opt) && i < tokens.length) i++;
    }

    const sub = tokens[i] || '';
    const args = tokens.slice(i + 1);

    // Flag parsing STOPS at `--`: everything after it is a pathspec, never an
    // option (`git clean -f -- -n` deletes a file named `-n`, it is no dry run).
    const ddIndex = args.indexOf('--');
    const hasDashDash = ddIndex !== -1;
    const optArgs = hasDashDash ? args.slice(0, ddIndex) : args;
    const pathArgs = hasDashDash ? args.slice(ddIndex + 1) : [];

    // Expand combined short flags: `-SW` -> `-S -W`, `-fdn` -> `-f -d -n`.
    const flags: string[] = [];
    for (const a of optArgs) {
      if (/^-[A-Za-z]{2,}$/.test(a) && !ATTACHED_VALUE_SHORTS.has(a[1])) {
        for (const c of a.slice(1)) flags.push('-' + c);
      } else {
        flags.push(a);
      }
    }

    // --- git reset --hard ---
    if (sub === 'reset' && flags.includes('--hard')) {
      return 'git reset --hard discards all uncommitted changes in tracked files.';
    }

    // --- git stash (bare, or destructive subcommands) ---
    if (sub === 'stash') {
      const stashSub = optArgs.find((a) => !a.startsWith('-')) || '';
      if (stashSub === '' || ['drop', 'pop', 'clear', 'push', 'save'].includes(stashSub)) {
        return 'git stash moves/clears uncommitted changes off the working tree (recoverable only via reflog, easily lost).';
      }
      // `git stash list/show` are read-only -> allow.
    }

    // --- git clean -f / -d / -x ---
    if (sub === 'clean') {
      // `-n` / `--dry-run` only previews what would be removed; nothing is deleted.
      const isDryRun = flags.includes('-n') || flags.includes('--dry-run');
      const isDestructive =
        flags.includes('-f') ||
        flags.includes('-d') ||
        flags.includes('-x') ||
        flags.includes('-X') ||
        flags.includes('--force');
      if (!isDryRun && isDestructive) {
        return 'git clean -f/-d/-x permanently deletes untracked (and possibly ignored) files.';
      }
    }

    // --- git push --force / --force-with-lease ---
    if (sub === 'push') {
      if (
        flags.includes('--force') ||
        flags.includes('-f') ||
        optArgs.some((a) => a.startsWith('--force-with-lease'))
      ) {
        return 'git push --force / --force-with-lease rewrites remote history.';
      }
      // normal push -> allow
    }

    // --- git rebase ---
    if (sub === 'rebase') {
      // allow `git rebase --abort` / `--continue` / `--skip` (recovery ops)
      if (flags.includes('--abort') || flags.includes('--continue') || flags.includes('--skip')) {
        continue;
      }
      return 'git rebase rewrites history and can drop commits / disturb the working tree.';
    }

    // --- git branch -D (force-delete) ---
    if (sub === 'branch') {
      if (flags.includes('-D') || (flags.includes('--delete') && flags.includes('--force'))) {
        return 'git branch -D force-deletes a branch ref (may orphan unmerged commits).';
      }
      // `git branch`, `git branch -a`, `git branch -d <merged>` -> allow
    }

    // --- git checkout / git restore: block only genuine working-tree overwrites ---
    if (sub === 'checkout' || sub === 'restore') {
      // `git checkout -b X` / `git checkout -B X` -> creating a branch, safe.
      if (sub === 'checkout' && (flags.includes('-b') || flags.includes('-B'))) {
        continue;
      }

      const hasForce = flags.includes('-f') || flags.includes('--force');
      const positional = [...optArgs.filter((a) => !a.startsWith('-')), ...pathArgs];

      // `git restore --staged` without `--worktree` only rewrites the index; the
      // working-tree files keep their local edits. `-W`/`--worktree` cancels the
      // exemption, including inside a combined cluster such as `-SW`.
      if (
        sub === 'restore' &&
        (flags.includes('--staged') || flags.includes('-S')) &&
        !flags.includes('--worktree') &&
        !flags.includes('-W')
      ) {
        continue;
      }

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
