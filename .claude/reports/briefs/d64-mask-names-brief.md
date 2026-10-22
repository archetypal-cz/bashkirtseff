# Brief — tag Marie's code and mask names (D-64, 2026-10-22)

Owner ruling (B-75, 2026-10-22): Marie's code/mask names are tagged to the mask-name glossary file, never to
MARIE; code names for other people are tagged to the real person. Roles: glossary + researcher. Read
`.claude/skills/glossary/SKILL.md`, `.claude/skills/glossary-tagger/SKILL.md`,
`~/rebuild-state/tag-audit/TAGGER_BRIEF.md`, `.claude/skills/_shared/editing_rules.md`.

## Input

`d64/candidates.tsv` in the session scratchpad (name, kind, stands_for, carnet, file, paragraph_id,
glossary_file, para_already_tagged_with_it, confidence, deciding_source_line, note). Rows marked
`exclude`/`doubtful` stay untagged unless the text settles them.

## Tasks

1. **Glossary.** Write real entries (frontmatter + body in the style of SUZANNE.md, with the deciding source
   lines and paragraph IDs found by text search) for VIOLETTE.md and CINQ_FEMMES.md (both stubs). Create
   entries for masks with ≥2 mentions that have none: the Cimiez «moines»/«frères moineaux»/«padri», the
   «cireurs de bottes de Nice», the «religieuses du Bon Pasteur», «Alfeda-da-fé», «Dom Fabrice», «Turcan» /
   «Don Fortunato», «mère Couvelet» (Marie's mask; COUVELET.md is the real woman — don't tag it there; mention
   Bojidar's «mère Arnaud» in the body). Category per `content/_original/_glossary/_categories.yaml` (check
   where SUZANNE lives); check a file doesn't exist right before writing; aliases only as written in the text.
2. **Tags.** Add the tag line in every paragraph where the mask is used (TSV rows with NO), including 080.0716
   «SUZANNE AU MASQUE» and «la colonelle» = Dina (DINA's canonical file per calibration) at 077.0451, .0453,
   .0454, .0502, 078.0030, .0035. Settle 072.0538 (is «Violet» Larderel?) and 078.0349 («je suis Violette»:
   the mask or Traviata's Violetta?) from context; don't tag 080.0160, 071.0459, 082.0078, 016.0182 to these.
   Single-mention masks, «Mlle Yvonne», the 046.0104 game names, T.P.L.: leave untagged, list them.
3. **Notes.** The RSR comment at 078.0494 saying Suzanne gets no tag is stale: add an `RSR: CORRECTION —` line
   (owner ruling 2026-10-22). Where a mask is not explained anywhere in the entry, one short RSR note is fine.

## Rules, gates, report

Only tag lines, RSR comments and glossary files; never Marie's French, IDs, footnotes, frontmatter. Edit tool
or Python; never printf/echo/sed for `%%` lines. Never git checkout/restore/stash/reset; no commits; don't run
entities-sync or tag-reconcile (the lead does). Gates per touched carnet: `just verify-carnet _original C` PASS,
`just splicescan _original C` empty, `just check-links _original C` OK; `just glossary-missing` clean. Write
touched files to the file list named in your prompt. Report: entries written/created (paths), tags added per
name, rows left and why, ledger lines.
