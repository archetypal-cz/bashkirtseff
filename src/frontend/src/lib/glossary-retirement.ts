/**
 * Retired glossary stubs (`status: retired`, optional `replaced_by: ID`).
 *
 * Merged or emptied entries keep their file so old links and tags still
 * resolve, but the site hides them from every listing and sends their URL to
 * the replacement. Plain functions with no Astro imports, so both content.ts
 * (pages) and filter-index-builder.ts (run from astro.config) share them.
 */

/** The part of a glossary entry that decides whether it is retired and where it points. */
export interface GlossaryRetirementInfo {
  id: string;
  retired?: boolean;
  replacedBy?: string;
}

/**
 * Map each retired glossary id with a usable `replaced_by` to its final live
 * target. Chains (A → B → C) collapse to C; a chain that ends in a missing
 * entry, a retired entry without a replacement, or a cycle gives no redirect,
 * so the stub page stays as it is rather than pointing at a dead end.
 */
export function buildGlossaryRedirectMap(entries: GlossaryRetirementInfo[]): Map<string, string> {
  const byId = new Map(entries.map(e => [e.id, e]));
  const out = new Map<string, string>();
  for (const start of entries) {
    if (!start.retired || !start.replacedBy) continue;
    const seen = new Set<string>([start.id]);
    let target: string | undefined = start.replacedBy;
    while (target) {
      const next = byId.get(target);
      if (!next || seen.has(target)) { target = undefined; break; }
      if (!next.retired) break;
      seen.add(target);
      target = next.replacedBy;
    }
    if (target) out.set(start.id, target);
  }
  return out;
}

/** Retirement fields from a glossary file's frontmatter (cheap regex read). */
export function readRetirementInfo(id: string, text: string): GlossaryRetirementInfo {
  const end = text.startsWith('---') ? text.indexOf('\n---', 3) : -1;
  const fm = end > 0 ? text.slice(0, end + 1) : '';
  const retired = /^status:\s*["']?retired["']?\s*$/m.test(fm);
  const replacedBy = fm.match(/^replaced_by:\s*["']?([A-Za-z0-9_]+)["']?\s*$/m)?.[1];
  return { id, retired, replacedBy };
}
