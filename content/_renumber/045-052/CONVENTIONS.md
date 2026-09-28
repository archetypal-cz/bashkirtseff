# Conventions for the tome06/07 plans (045–059)

Work dir: /tmp/claude-1000/-home-krr-bashkirtseff/467edde8-50c6-480d-80c0-3a213d11ff10/scratchpad/plan-tome0607/
Drafts: draft06/, draft07/ (never edit these; they are the baseline).
Final plans: final/plan-CCC.json, one per carnet; built by fix06.py / fix07.py from the drafts
(scripted edits, so a re-draft can be re-fixed). Review notes: final/REVIEW-06.md, final/REVIEW-07.md.
Helpers: tools.py (d TOME A B = docx dump; o CCC A B = _original texts), pp.py (plan summary),
t06.json / t07.json (docx dumps, index = docx ¶), pm6.json / pm7.json (page maps).

Page offset: tomes 6 and 7 have printed page = PDF page (0, sometimes −1); verified T7 PDF p.180 = printed 180.
The lead's "−2 to −4" applies to tome 9, not here.

Decisions (owner policy KRR 2026-09-27/28):
1. NO cover entries. Delete every draft `-cover.md` entry. Old `_original` paragraphs that are pure title-page
   text (Livre NN heading, "depuis … jusqu'au …", place lines, «Gloriae Cupiditate», «H[is] G[race] t[he] D[uke]
   o[f] H[amilton]», «Volo omnia…» mottos, name lists on the title page) are DROPPED with reason
   "title-page text withdrawn (KRR 2026-09-28: no cover pages until the manuscript is scanned)". The same draft
   `new` paragraphs are removed. Record every withdrawn text as printed (docx ¶, Mon Journal t.N p.X) in
   REVIEW under "Withdrawn cover pages".
   Exception flagged for the lead: a first-person note by Marie on the title page ([En travers: …] with «je»)
   stays as a `margin` paragraph at the start of the first entry.
2. Cross-carnet moves: accept only where the Livre title page in the docx really puts the text in the other
   notebook (e.g. a "(suite)" day continuing after the next Livre's title page). Reject moves caused by
   repeated text (a poem copied twice, a motto repeated each Livre) — keep those paragraphs in place and
   restore the repeated copy as `new` only if it is really a second copy in the manuscript.
3. Kinds: margin for [En travers:/Dans la marge:] whole paragraphs; rayé for whole struck paragraphs incl.
   «[N lignes cancellées]»; editorial for notes about the physical manuscript («[Bas de page enlevé]»,
   «[Demi-page enlevée]», «[Manque p. 66…]», «[Plusieurs pages non numérotées…]», «[Plans p. 98-99]»,
   «[Note de l'éd. : ici un dessin…]», «Sur l'original de la BNF…»); «[Annotation: 1881. …]» = margin
   (Marie's later annotation) — NOT other. Dialogue lines starting «— Ma chère,» / «— Mademoiselle,» are
   NOT letters: remove those kind guesses. Letters copied into the diary: kind letter with `> ` quoting via
   set_french (old) — check scan indentation; letters Marie only paraphrases are not letters.
   Clipping candidates from indentation: decide per case (anonymous letters Marie received/copied = letter).
4. Empty days: date line with no text → «[Aucun texte - date seule mentionnée]» entry.
5. Labels match the manuscript: «En travers:» etc. restored where `_original` dropped them (set_french).
6. OCR slips in new text: fix to the printed reading when the scan clearly shows it; otherwise keep and note.
   Fix «I !»/«I!» → «!», «II» → «!!» where obviously exclamation marks.
7. RSR on every new paragraph: "Restored from tomeNN.docx ¶N, Mon Journal t.N p.X (missing from original
   extraction, 2026-09-28 rebuild)." (draft already does this; keep).
8. Printed edition footnotes stay out.
9. Drawings: cut 600 dpi WebP (tight crop, ≤1600 px, <300 KB) to scratch drawings/CCC/tomeNN-pPPP-n.webp;
   list them in final/drawings.json {carnet, entry file, anchor old/new paragraph, caption (FR), alt, source
   "Mon Journal, t. N, p. X"}; they are applied to frontmatter after --write.
