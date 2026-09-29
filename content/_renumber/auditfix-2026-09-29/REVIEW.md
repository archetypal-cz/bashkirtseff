# Audit fixes needing a rebuild (2026-09-29)

Source: post-rebuild audit (`.claude/reports/rebuild-audit-2026-09-29.md`) triaged in
~/rebuild-state/triage/{a-000-030,b-031-059,c-060-074,d-081-100}.md, «Fix list → Rebuild needed».
Plans (`plan-*.json` here) = identity plan at HEAD + `build_plans.py` (in this folder). Each carnet ran single-carnet
`rebuild-carnet` (maps `content/_renumber/{053,069,074}-2026-09-29.{json,sql}`).

## Applied

| carnet | fix | evidence |
|---|---|---|
| 053 | 053.0078 «Non, mais je vous demande si on a jamais vu une adresse…» moved from between letters 2° and 3° (1876-01-26) to after «Ces dames sont l'OIive et sa sœur…», before «Et Audiffret qui va recevoir…». New IDs: old 0079-0088 → 0078-0087, old 0078 → 0088. | tome07.docx ¶160-162; Mon Journal t.7 p.13 |
| 069 | Duplicate «Cette espèce de laideur qui me prend quelquefois comme une maladie…» in 1877-03-27: dropped 069.0555 (pre-rebuild 069.0495, the copy already in 27 Mar), kept 069.0556 (pre-rebuild 069.0464, moved from 03-25 by the 2026-09-28 rebuild) → now 069.0555. French identical; the kept copy has the fuller notes (cz FAB rationale, uk TR note, en #Health tag). The dropped copies' notes were redundant (cz FAB «táž oprava…», uk TR «повтор з 069.0556 (Марі сама повторює)» — wrong once the duplicate is gone). IDs from 0556 on shift down by one. | tome10.docx ¶774 (once), then ¶775 «Mercredi 28 mars 1877» |
| 074 | The Monday text (old 074.0278-0283: «Comme mon journal me ressemble peu !… J'ai dit adieu à la comtesse Benvenuti… sed inutilis.») moved back from 1877-09-11.md (under «Mardi 10 septembre») to 1877-09-10.md under «Lundi 10 septembre 1877». Now 074.0277-0282 in 09-10; the «Mardi 10» heading is 074.0283 in 09-11. File names unchanged (09-10 = Monday 10, 09-11 = Marie's «Mardi 10», her slip kept, notes on 074.0283). | tome10.docx ¶4589 «Lundi 10 septembre 1877», ¶4590-4595, ¶4596 «Mardi 10 septembre 1877» |

Translation flags were reset by the tool in the touched entries (053 1876-01-26; 069 1877-03-27; 074 1877-09-10/11)
— re-run review there.

## Not done here (in-place, handed to fix-inplace)

- 020/1874-06-02 (020.0107) and 068/1876-12-24 (068.0161) are heading-only clusters. Project convention
  (016.0282, 068.0067) puts «[Aucun texte - date seule mentionnée]» + RSR note in the heading cluster, so
  no new paragraph / renumbering is needed.

## Notes

- cz 069/1877-03-27 entry-level FAB notes (2026-09-26) still speak of an «ozvěna» (echo) of 069.0555 — the echo no longer exists; harmless history.
- Pre-existing `069.DROPPED-0650/0651` references (fr/_translate_manifest.json, fr/_non_french_passages.md, cz/TranslationMemory.md, uk/069/1877-03-22.md) come from the 2026-09-28 rebuild and are not touched here.
- `content/_raw/reports/kernberger_matching.json` still lists 069.0556 (raw report, not rewritten by the tool).
- 053 dry-run WARN «1876-01-24.md: first paragraph has no date heading» is pre-existing (title note).
