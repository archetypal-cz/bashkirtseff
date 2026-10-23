# Brief — tag the places where Marie addresses God (owner ruling 2026-10-23)

KRR 2026-10-23: «boha nechat, sloučit dieu a god — byla by to prostě místa, kde Marie boha oslovuje, ale asi ne
každé postěžování „bože“». The entry is `content/_original/_glossary/people/religious/GOD.md` (DIEU and
GOD_JUSTICE are merged into it). Role: glossary-tagger (read-only on content — you only write a list).

## Tag (GOD)

A paragraph where Marie **speaks to God** — second person (vous/tu addressed to God), or a written prayer,
plea, vow, thanksgiving or reproach directed at Him:
- «Mon Dieu, faites que…», «Dieu, ayez pitié de moi», «Je vous remercie, mon Dieu», «Seigneur, …»;
- prayers she copies or composes, vows («je fais vœu…» to God), bargaining with God;
- an «ô Dieu!» apostrophe only when it opens real address (followed by a plea or a «vous» to God).
- Also (separate kind, still tagged): a passage that is **about** her relationship with God at length — her
  faith, doubt, arguing with Providence, «Dieu m'a abandonnée» — where God is the subject of reflection, not a
  figure of speech.

## Do not tag

- Interjections and complaints: «mon Dieu!», «Dieu! que je m'ennuie», «grand Dieu», «bon Dieu», «Dieu sait»,
  «Dieu merci», «grâce à Dieu», «plût à Dieu», «Dieu me pardonne», «adieu», «à Dieu ne plaise», «pour l'amour
  de Dieu», oaths and set phrases — even when emphatic.
- God named in other people's speech, in titles (*L'Espoir en Dieu*), church names, Hôtel-Dieu, Dieulafait.
- A single passing «je prie Dieu que…» inside a sentence about something else is a set phrase → no tag,
  unless the paragraph goes on to pray.

When unsure, don't propose (or give confidence < 0.8 and say why).

## Method

For each carnet of your range: find candidate paragraphs (grep `Dieu|Seigneur|prière|prie|vœu` and second-person
address in the visible text of `content/_original/CCC/*.md`; ignore `%%` lines and footnotes), read each in
context, decide. Note paragraphs already tagged GOD (086 has four) — confirm or reject them too.

## Output

One TSV per range, path given in your prompt, columns:
`para_id<TAB>kind<TAB>confidence<TAB>quote` — kind = `address` (speaks to God) or `relationship`
(reflection on God/faith); confidence 0.5–1.0; quote = the deciding French words (≤ 120 chars).
Add rows `para_id<TAB>remove<TAB>conf<TAB>why` for existing GOD tags that should go.
Finally 5–10 lines of notes: the most telling prayers of your range (para id + short quote) for the entry body,
and how Marie's way of addressing God changes over the years if you see it.

Rules: do not edit any file except your TSV. No git commands that change state. No commits.
