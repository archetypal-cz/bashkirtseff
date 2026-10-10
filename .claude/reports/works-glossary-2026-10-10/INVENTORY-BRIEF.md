# Inventory of works Marie mentions (stage 1 of the works-glossary project, owner 2026-10-10)

Goal: list every WORK mentioned in the French source `content/_original/CCC/*.md` for your carnet range, so researchers can later write glossary entries (with full images / full texts where public domain).

A "work" = a painting, drawing, sculpture, statue, monument-as-artwork (by anyone other than Marie — Marie's own works are already covered in `content/_original/_glossary/culture/art/`, but list them too if you see one not covered), a play, opera, operetta, ballet, song/aria, novel, book, poem, essay, article series, periodical issue she discusses, a piece of music. NOT people, places, newspapers as institutions, or buildings as places.

Find them via: italic titles (*…*), quoted titles, phrases like «le tableau de…», «j'ai lu…», «on jouait…», «la statue de…», Salon pictures, theatre/opera evenings, RSR/LAN/footnote notes (lines `%% … RSR: … %%`, `[^…]:`) that identify a work. Check the glossary for an existing entry: `grep -ril "<title words>" content/_original/_glossary/` (culture/art, culture/literature, culture/theater, culture/music, …).

Output: JSON list to `.cache/works/inventory-<range>.json` (range given in your task), one object per distinct work:
`{"title": "as best identified (original language)", "marie_forms": ["how Marie writes it", …], "creator": "author/artist/composer or null", "year": "creation/premiere year if known or null", "type": "painting|sculpture|drawing|play|opera|operetta|ballet|song|music|novel|book|poem|other", "mentions": ["CCC.NNNN", …], "existing_glossary": "path or null", "existing_tag_count": n or null, "public_domain_likely": true/false, "notes": "identification doubts, which Salon year, etc."}`

Rules: read-only — edit nothing except your output file; no git. Be accurate rather than exhaustive-by-guessing: if a title is ambiguous, say so in `notes`. Reply with counts per type and the 10 most-mentioned works.
