"""Reviewed plans for carnets 015–030 (tome03/tome04): python3 fix.py → final/plan-CCC.json + log."""
import re
from fixlib import Plans, W, ORIG, DOCX, WITHDRAWN, log, typo, vis, dtext

X = Plans()
P = X.P
EMPTY = '[Aucun texte - date seule mentionnée]'
TODAY = '2026-09-28'

# ---------------------------------------------------------------------------------------------
# 1. Generic clean-up
# ---------------------------------------------------------------------------------------------
COVER_RE = re.compile(r"(H\[is\]|Livre \d|commencé le|Promenade des Anglais,? 55 ?bis|^\[?Carnet)", re.I)

for c, p in P.items():
    # cover entries: withdrawn (owner 2026-09-28: no cover entries until the manuscript is scanned)
    for e in [e for e in p['entries'] if e['file'].endswith('-cover.md')]:
        for q in e['paragraphs']:
            WITHDRAWN.append((c, q['new']['rsr'].split(':')[0].replace('Restored from ', ''), q['new']['french']))
        p['entries'].remove(e)
        log(c, 'cover', f"cover entry {e['file']} not created (title page withdrawn)")
    for e in p['entries']:
        keep = []
        for q in e['paragraphs']:
            if 'new' in q:
                n = q['new']
                n['french'] = typo(n['french'])
                t = n['french'].strip()
                d = q.get('_docx', ['?'])[0]
                letters = re.sub(r'[^A-Za-zÀ-ÿ]', '', t)
                if re.fullmatch(r'\d+', t):
                    log(c, 'new-dropped', f"docx ¶{d} «{t}»: printed page number (picture-caption style), not text")
                    continue
                if len(letters) < 3:
                    log(c, 'new-dropped', f"docx ¶{d} «{t}»: OCR debris")
                    continue
                if COVER_RE.search(t) and len(t) < 200 and ('H[is]' in t or 'Livre' in t or 'commencé le' in t or '55' in t):
                    WITHDRAWN.append((c, f"tome{'03' if int(c) <= 20 else '04'}.docx ¶{d}", t))
                    log(c, 'cover', f"docx ¶{d} «{t[:60]}»: title-page line, withdrawn")
                    continue
            if 'set_french' in q:
                q['set_french'] = typo(q['set_french'])
            keep.append(q)
        e['paragraphs'] = keep
        # existing kind markers in _original win over the drafter's text-based guesses
        for q in e['paragraphs']:
            if 'old' in q and 'kind' in q:
                lines = ORIG[q['old'][:3]][q['old']]['lines']
                if any(l.startswith('%% kind:') for l in lines):
                    q.pop('kind'); q.pop('_kind_guess_reason', None)

# the drafter's "letter" guesses on old paragraphs are dialogue lines («- Monsieur, …»), not copied letters
for c, p in P.items():
    for e in p['entries']:
        for q in e['paragraphs']:
            if 'old' in q and q.get('kind') == 'letter' and 'set_french' not in q:
                t = vis(q['old'])
                if re.match(r'^[-—–]\s', t) or q['old'] in ('027.0262', '029.0141'):
                    X.kind(q['old'], None, 'dialogue or narration, not a copied letter (drafter guess from a salutation)')

# annotations Marie added later: kind other with a source naming the year
for c, p in P.items():
    for e in p['entries']:
        for q in e['paragraphs']:
            t = q['new']['french'] if 'new' in q else vis(q['old'])
            m = re.match(r'^[\[(]\s*Annotation\s*[:;]?\s*[!-]?\s*([0-9! ]{4,5}|[A-ZÉa-zé]+ \d{4})?', t)
            if m and (q.get('kind') in (None, 'other')):
                yr = (m.group(1) or '').replace('!', '1').replace(' ', '').strip()
                src = f"Annotation ultérieure de Marie{', ' + yr if yr else ''}"
                if 'old' in q:
                    X.kind(q['old'], 'other', 'Marie\'s later annotation', source=src)
                else:
                    q['new']['kind'] = 'other'; q['new']['source'] = src

# ---------------------------------------------------------------------------------------------
# 2. Old cover-page paragraphs in _original: withdrawn (dropped, text kept in REVIEW.md)
# ---------------------------------------------------------------------------------------------
for oid in ['021.0517', '022.0464', '024.0022', '024.0023', '024.0024', '024.0025', '025.0265', '026.0041',
            '028.0024', '029.0002', '030.0002']:
    WITHDRAWN.append((oid[:3], f"_original {oid} ({ORIG[oid[:3]][oid]['file']})", vis(oid)))
    X.drop_old(oid, 'withdrawn title-page text (owner 2026-09-28: no cover pages until the manuscript is scanned; text kept in content/_renumber/015-030/REVIEW.md)', cat='cover')

# ---------------------------------------------------------------------------------------------
# 3. Completions the drafter proposed that duplicate the neighbouring paragraph
# ---------------------------------------------------------------------------------------------
for oid, nb in [('015.0277', '015.0278'), ('016.0412', '016.0401–0411'), ('024.0282', '024.0283'), ('024.0426', '024.0425'),
                ('025.0225', '025.0224'), ('026.0029', '026.0028'), ('026.0031', '026.0030'), ('030.0092', '030.0091')]:
    X.unsf(oid, f'the docx paragraph also holds {nb}, which _original keeps as its own paragraph; no text is missing')

# ---------------------------------------------------------------------------------------------
# 4. Per carnet
# ---------------------------------------------------------------------------------------------
FN = 'printed-edition footnote'


def marie_note(c, docx, why):
    """A printed footnote whose text is Marie's own remark: kept as kind other."""
    e, i = X.where_new(c, docx)
    n = e['paragraphs'][i]['new']
    n['french'] = re.sub(r'^\d+\s+', '', n['french'])
    n['kind'] = 'other'
    n['source'] = 'Note de Marie, imprimée en bas de page dans Mon Journal'
    log(c, 'kind', f"new ¶{docx} → other («{n['french'][:50]}»): {why}")


# 015 -----------------------------------------------------------------------------------------
marie_note('015', 156, "footnote in Marie's voice («Laid et poussiéreux, je ne le compte pas»), not the editors'")
X.drop_new('015', 229, f"{FN} marked [NdT] (translator's gloss of a Russian word)")
X.drop_new('015', 232, 'page-break repeat of the end of 015.0133 («…la com-/tesse de Galve»); its struck word goes into 015.0133')
X.sf('015.0133', vis('015.0133').replace("je l'ai vue plus que les autres", "je l'ai vue [Rayé: assez] plus que les autres"),
     "restore the struck word «[Rayé: assez]» (docx ¶232)")
X.restore_files('015', ['1874-01-20.md', '1874-01-21.md'],
                "the manuscript dates both entries «21 janvier» (Mardi 21, then Mercredi 21); Tuesday was the 20th, so the first stays 1874-01-20 as in _original")
X.sf('015.0290', vis('015.0290') + ' la nuit pour en commencer une autre presque semblable.',
     'complete the sentence cut at a page break (docx ¶451 + ¶456)')
X.drop_new('015', 456, 'appended to 015.0290 (same sentence)')
X.split_new('015', 457, ['Merci mon Dieu !', 'Pourquoi lorsque je suis heureuse, je voudrais toujours demander le pardon de mes péchés ?'],
            'two docx paragraphs; OCR «I» → «!»')

# 015's _original lost the words Marie struck inside her sentences; put them back where the docx has them
import json as _json
_R = _json.load(open(W / 'raye.json'))
for oid, t in sorted(_R.items()):
    if not oid.startswith('015.') or oid == '015.0193':
        continue
    t = re.sub(r'\[Rayé\s*[,;:]\s*', '[Rayé: ', t.replace('\n', ' '))
    X.sf(oid, t, 'restore the struck words «[Rayé: …]» the docx has inside this paragraph (the 015 extraction dropped them)')

# 016 -----------------------------------------------------------------------------------------
X.restore_files('016', ['1874-02-07.md'], 'the docx lines here come from a garbled two-column OCR; _original holds the complete text in reading order')
X.replace_new_with_old('016', 881, '016.0281', 'the drafter matched «Que je suis malheureuse aujourd\'hui !» to 1 March (¶1189 «Ah ! que je suis…») and took ¶881 for new text')
X.insert_new('017', '1874-03-01.md', ('end', 'end'), "Ah ! que je suis malheureuse aujourd'hui !",
             f"Restored from tome03.docx ¶1189 (missing from original extraction, {TODAY} rebuild).", 'the 1 March line, distinct from 016.0281', docx=1189)
marie_note('016', 948, "footnote in Marie's voice («… j'avais douze ans»)")
# 14 Feb: date line only («Je n'ai rien écrit hier» on the 15th)
X.sf('016.0282', '# Dimanche, 15 février 1874', 'the old cluster held both date lines; 14 February becomes its own empty day')
e14 = X.entry('016', '1874-02-14.md')
e15 = X.entry('016', '1874-02-15.md')
q = e14['paragraphs'].pop(0)
e15['paragraphs'].insert(0, q)
e14['paragraphs'] = []
e14['paragraphs'].append({'new': {'french': EMPTY, 'rsr': f"tome03.docx ¶882: the date line «Samedi 14 février 1874» has no text under it ({TODAY} rebuild)."}})
log('016', 'entry', '1874-02-14: date line only → «[Aucun texte…]» entry; 016.0282 opens 1874-02-15')
X.kind('016.0400', 'editorial', "the editors' note introducing the struck fragments (docx ¶1040)")
for n in range(401, 412):
    X.kind(f'016.{n:04d}', 'rayé', 'unfinished phrase Marie struck out (docx ¶1040–1041)')

# 017 -----------------------------------------------------------------------------------------
X.sf('017.0097', vis('017.0097') + ' ces dames à la gare; je vais avec Machenka chez Rumpelmayer.',
     'complete the sentence cut at a page break (docx ¶1184 + ¶1188)')
X.drop_new('017', 1188, 'appended to 017.0097 (same sentence)')
X.drop_new('017', 1274, 'page-break repeat of the start of 017.0162')
X.drop_new('017', 1290, 'page-break repeat of the end of 017.0170 («…embellisse-ments»)')

# 018 -----------------------------------------------------------------------------------------
X.drop_new('018', 1909, 'words of 018.0121 printed around the facsimile (image7); already in _original')
X.restore_files('018', ['1874-04-07.md', '1874-04-08.md'], 'the date line «Merceredi 8 avril» (OCR) was not recognised by the drafter')
X.restore_files('018', ['1874-04-19.md', '1874-04-20.md'], 'the date line «Lund 20 avril» (OCR) was not recognised by the drafter')
# «Lundi 20 - suite.»: Marie's addendum to the 20th, written after the 21st entry — stays in manuscript order in 21 April
X.move_old('018.0310', '018', '1874-04-21.md', ('end', 'end'), "«Lundi 20 - suite.» sits after the 21 April text in the manuscript (docx ¶2223–2224)")
X.insert_new('018', '1874-04-21.md', ('before', '018.0310'), 'Lundi 20 - suite.',
             f"Restored from tome03.docx ¶2223 (missing from original extraction, {TODAY} rebuild): Marie's label for the addendum to 20 April.",
             'the label of the addendum', docx=2223)

e, i = X.where_new('018', 2036); e['paragraphs'][i]['new']['french'] = e['paragraphs'][i]['new']['french'].replace('Oh Paris I Je', 'Oh Paris ! Je')
log('018', 'new-edited', 'docx ¶2036: OCR «Oh Paris I» → «Oh Paris !»')

# 019 -----------------------------------------------------------------------------------------
X.sf('019.0374', vis('019.0374') + " Elle ne m'a pas reconnue ou n'a pas voulu me reconnaître. Ce dernier est plus sûr, et plus dur. " +
     typo(dtext('03', 2749)).split('plus dur. ', 1)[1], 'complete the paragraph cut at a page break (docx ¶2745 + ¶2749)')
X.drop_new('019', 2749, 'appended to 019.0374 (same paragraph)')

X.drop_old('019.0221', 'date line «Vendredi, 15 mai 1874» invented by the extraction: neither tome03.docx nor the raw carnet has it; the text stays under Jeudi 14 mai (docx ¶2524–2558)')
X.entry('019', '1874-05-14.md').setdefault('redirect_from', []).append('1874-05-15.md')

# 020 -----------------------------------------------------------------------------------------
for oid, d in (('020.0373', 'Mardi, 23 juin'), ('020.0388', 'Mercredi, 24 juin')):
    X.drop_old(oid, f'date line «{d} 1874» invented by the extraction: neither tome03.docx nor the raw carnet has it; the text stays under Lundi 22 juin (Marie: «depuis lundi 22 je n\'ai rien écrit»)')
X.entry('020', '1874-06-22.md').setdefault('redirect_from', []).extend(['1874-06-23.md', '1874-06-24.md'])
X.drop_new('020', 3250.5, '«12 février Duc de Hamilton.» is text (020.0314), not a date line')
X.restore_files('020', ['1874-06-17.md'], '«12 février Duc de Hamilton.» was read as a date line by the drafter')
X.sf('020.0194', vis('020.0194') + ' ' + typo(dtext('03', 3076)), 'complete the paragraph cut at the facsimile pages (docx ¶3068–3076)')
X.drop_new('020', 3076, 'appended to 020.0194 (same sentence)')
X.sf('020.0279', vis('020.0279') + ' avec étonnement.', 'complete the sentence cut at a page break (docx ¶3185 + ¶3189)')
X.drop_new('020', 3189, 'appended to 020.0279 (same sentence)')
for oid in ('020.0158', '020.0166'):
    X.kind(oid, 'other', "Marie's own note printed as a footnote (as the new ones in 015/016/027)", source='Note de Marie, imprimée en bas de page dans Mon Journal')

# 021 -----------------------------------------------------------------------------------------
X.edit_new('021', 153, 'drop «d\'arriver.», the end of 021.0086 repeated after the page break',
           french=re.sub(r"^d'arriver\.\s*", '', typo(dtext('04', 153))))
X.drop_new('021', 185, 'OCR debris («J CUI IO.»)')
X.drop_new('021', 208, 'garbled OCR of 021.0134 (same text)')
X.drop_new('021', 307, 'garbled OCR of the end of 021.0211')
for d in (533, 536, 537, 538, 540, 542, 543, 544):
    X.edit_new('021', d, None, kind='letter', source='Lettre de Marie à Berthe, Spa, 19 juillet 1874 (copie)')
log('021', 'kind', 'new ¶533–544 → letter: the copy of Marie\'s letter to Berthe (19 July 1874)')
X.kind('021.0488', 'editorial', "the editors' description of the torn page corner with the surviving word fragments")

# 022 -----------------------------------------------------------------------------------------
X.drop_new('022', 857, 'the acrostic lines are already in _original, one line per paragraph (022.0084–0087)')
X.drop_new('022', 859, 'the acrostic lines are already in _original (022.0089–0097)')

# 023 -----------------------------------------------------------------------------------------
X.sf('022.0465', '# Samedi, 8 août 1874 - suite', "Marie's date line «Samedi 8 août 1874 - suite» opens Livre 23 (docx ¶1307); made a heading")
X.entry('023', '1874-08-08.md').pop('heading', None)  # the set_french heading is the entry's heading; a plan heading doubled it in the translations
X.drop_new('023', 1555, 'repeat of 023.0161 («! ! !»)')
X.drop_new('023', 1805, 'already in 023.0194')
X.drop_new('023', 1995, 'already in 023.0202 (German verse)')
X.drop_new('023', 2110, 'page-break repeat inside 023.0203')
X.drop_new('023', 2159, 'the misspelt date line «Mercredi 9 septembe»; 023.0206 already opens 9 September')
X.restore_files('023', ['1874-09-08.md', '1874-09-09.md'], 'the date line «Mercredi 9 septembe 1874» (OCR) was not recognised by the drafter')
# 16 September: Marie's retrospective entry (13–16 Sept) stays one entry, now the last of Livre 23
e13 = X.entry('023', '1874-09-13.md')
e16 = X.entry('023', '1874-09-16.md')
moved = [q for q in e13['paragraphs'] if q.get('old', '').startswith('024.')]
e13['paragraphs'] = [q for q in e13['paragraphs'] if not q.get('old', '').startswith('024.')]
e16['paragraphs'] += moved
log('023', 'entry', "1874-09-16 (024.0001–0021) kept as one entry: «Dimanche 13 septembre» inside it is Marie's retrospective sub-date, not a new day")

# 024 -----------------------------------------------------------------------------------------
e17 = X.entry('024', '1874-09-17.md')
i26 = X._index(e17, '024.0026'); q26 = e17['paragraphs'].pop(i26); e17['paragraphs'].insert(0, q26)
log('024', 'moved', "024.0026 (date line) back before 024.0027 («Je pense qu'on peut beaucoup supprimer dans ce livre…», written on the title page) as in _original")
X.restore_files('024', ['1874-10-05.md', '1874-10-06.md'], 'the date line «Mardi 6 octore 1874» (OCR) was not recognised by the drafter')
X.drop_new('024', 2783, f'{FN} «(Nd R)»')
X.edit_new('024', 2770, 'Marie\'s tally of the days she saw the duke of Hamilton (docx ¶2770–2782, a table the OCR broke: two cells of the January column are blank)',
           french='Décembre 13 mercredi\n14\n16\n20\n25\nJanvier 5 dimanche\n24\nFévrier 8 samedi\n9\n12\nen tout 12 fois.',
           kind='other', source='Liste de Marie: les jours où elle a vu le duc de Hamilton')

# 025 -----------------------------------------------------------------------------------------
X.drop_new('025', 2832, 'page-break repeat of the end of 025.0032')

# 027 -----------------------------------------------------------------------------------------
X.edit_new('027', 3529, 'the second date line of 18 December (Marie wrote «Jeudi 18» and then «Vendredi 18»), kept as a sub-heading',
           french='## Vendredi 18 décembre 1874')

# 027/028 ---------------------------------------------------------------------------------------
marie_note('027', 3582, "footnote in Marie's voice (docx style «Footnote»: «belle-mère de la Prodgers…»)")
X.drop_new('028', 3819, 'caption of the facsimile page (image26), used for the drawing entry, not diary text')
X.restore_files('028', ['1875-01-05.md', '1875-01-06.md'],
                'the manuscript dates both entries «6 janvier» (Mardi 6, then Mercredi 6); Tuesday was the 5th, so the first stays 1875-01-05 as in _original')

# 028 mid-January chain: the text moved one day back; fix the date line inside the first cluster
def head_sf(oid, new_head, why):
    v = ORIG[oid[:3]][oid]['vis']
    assert v[0].startswith('#'), oid
    rest = v[1:]
    X.sf(oid, '\n'.join(([new_head] if new_head else []) + rest), why)


head_sf('028.0216', None, 'its date line «Samedi 16 janvier» is dropped: the text is Vendredi 15 (docx ¶3990), whose heading 028.0214 now precedes it')
head_sf('028.0218', '# Samedi, 16 janvier 1875', 'text of Samedi 16 janvier (docx ¶3993)')
head_sf('028.0226', '# Dimanche, 17 janvier 1875', 'text of Dimanche 17 janvier (docx ¶4004)')
head_sf('028.0241', '# Lundi, 18 janvier 1875', 'text of Lundi 18 janvier (docx ¶4023)')
head_sf('028.0250', '# Mardi, 19 janvier 1875', 'text of Mardi 19 janvier (docx ¶4035)')
head_sf('029.0001', '# Mercredi, 20 janvier 1875', 'text of Mercredi 20 janvier, before the Livre 29 title page (docx ¶4046)')
head_sf('029.0014', '# Jeudi, 21 janvier 1875', 'text of Jeudi 21 janvier (docx ¶4086)')
X.insert_new('028', '1875-01-14.md', ('before', '028.0215'), '## Jeudi 14 janvier 1875',
             f"Restored from tome03.docx ¶3988: Marie's second date line «Jeudi 14 janvier 1875» ({TODAY} rebuild).".replace('tome03', 'tome04'),
             'the repeated date line of 14 January', docx=3988)
X.drop_new('028', 4056, 'already in 029.0001 (the poem)')

# 029 -----------------------------------------------------------------------------------------

X.drop_new('029', 4377, 'the date line «Mardi Gras 9 février 1875»; 029.0182 already opens 9 February')
X.restore_files('029', ['1875-02-08.md', '1875-02-09.md'], 'the date line «Mardi Gras 9 février 1875» was not recognised by the drafter')
X.sf('029.0182', '# Mardi Gras, 9 février 1875', 'the date line as Marie wrote it (docx ¶4377)')

# 030 -----------------------------------------------------------------------------------------
e1 = X.entry('030', '1875-04-01.md')
e2 = X.entry('030', '1875-04-02.md')
tail = [q for q in e1['paragraphs'] if q.get('old') in ('030.0359', '030.0360', '030.0361', '030.0362')]
e1['paragraphs'] = [q for q in e1['paragraphs'] if q not in tail]
e2['paragraphs'] = [tail[0]] + e2['paragraphs'] + tail[1:]
log('030', 'entry', '1875-04-02: heading 030.0359, then the tome04 text (docx ¶5078–5088), then 030.0360–0362 (the continuation from tome05)')

# 022: the visiting card pinned before the first page of Livre 22 (docx ¶755–757)
X.insert_new('022', '1874-07-24.md', ('after', '022.0001'), 'De la part du Baron Charles de Gericke d\'Herwynen Maria Douchenka\n1874, 22 juillet, Spa',
             f"Restored from tome04.docx ¶755–757 (missing from original extraction, {TODAY} rebuild): the edition notes «[Carte de visite insérée avant la première page: …]».",
             'the visiting card Marie put before the first page of Livre 22', kind='other',
             source='Carte de visite du baron de Gericke, insérée avant la première page du carnet', docx=755)

# typesetting / OCR typos in the restored text (owner 2026-09-28: correct them, note them)
TYPO = [('rafraî-chie', 'rafraîchie'), ('Tepla- koff', 'Teplakoff'), ('parti-culier', 'particulier'), ('davan- tage', 'davantage'),
        ('dis- je', 'dis-je'), ('au- dessus', 'au-dessus'), ('peut- il', 'peut-il'), ('lui- même', 'lui-même'), ('là- dedans', 'là-dedans'),
        ('indiffférents', 'indifférents'), (' veus sortir', ' veux sortir'), ('Zurybarren', 'Jurybarren'), ('après- demain', 'après-demain'), ('peut- être', 'peut-être'), ('criai- je', 'criai-je')]
for c, p in P.items():
    for e in p['entries']:
        for q in e['paragraphs']:
            n = q.get('new')
            if not n:
                if 'set_french' in q:
                    done = [f'«{a.strip()}» → «{b.strip()}»' for a, b in TYPO if a in q['set_french']]
                    for a, b in TYPO:
                        q['set_french'] = q['set_french'].replace(a, b)
                    if done:
                        log(c, 'set_french', f"{q['old']}: typos corrected {', '.join(done)}")
                continue
            done = [f'«{a.strip()}» → «{b.strip()}»' for a, b in TYPO if a in n['french']]
            for a, b in TYPO:
                n['french'] = n['french'].replace(a, b)
            if done:
                n['rsr'] += ' Typesetting/OCR slips corrected: ' + ', '.join(done) + '.'
                log(c, 'new-edited', f"docx ¶{q.get('_docx', ['?'])[0]}: typos corrected {', '.join(done)}")

X.finish()
print('ok')
