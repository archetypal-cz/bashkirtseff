"""common/plan-085.json -> final/plan-085.json (worker C). See final/REVIEW-085.md."""
import re
from fixlib_c import Plan, newpara, WITHDRAW, EMPTY, DX

P = Plan('085')

# --- Livre 86 title page (¶957–970): withdrawn; 086.0089 goes back to 086 (16 Aug, plan-086)
e = P.entry('1878-06-27.md')
for x in list(e['paragraphs']):
    if 'new' in x:
        P.withdrawn.append({'french': x['new']['french'], 'rsr': x['new']['rsr']})
e['paragraphs'] = [x for x in e['paragraphs'] if x.get('old') == '086.0089']
P.take_old('086.0089')          # placed by plan-086
P.remove_entry('1878-06-27.md')
P.log.append('entry 1878-06-27 (Livre 86 title-page lines ¶960–964) withdrawn; 086.0089 returned to 086')
P.remove_new(957, withdraw=True, why='Livre 86 title-page index lines (Dessin / peinture / médaille)')

# --- 25 April «- suite»: the heading is «Vendredi 25 avril 1879 - suite», the text «voir pour y croire.»
e = P.entry('1879-04-25.md')
e['heading'] = 'Vendredi 25 avril 1879 - suite'
P.replace_new(62, newpara(63, 63, note='Continuation of 25 April from Livre 84; the date line reads «Vendredi 25 avril 1879 - suite» (¶62).'))


# --- 11 May «- suite»: «que je ne sais plus quoi.» ends the sentence of 10 May, printed under «Dimanche 11 mai 1879 - suite»
e = P.entry('1879-05-11.md')
e['heading'] = 'Dimanche 11 mai 1879 - suite'
P.replace_new(146, newpara(146, 146, text='que je ne sais plus quoi.', note='The date line reads «Dimanche 11 mai 1879 - suite» and continues the last sentence of 10 May (printed p.10).'))
P.strip_heading('085.0055')

# --- headings glued to the previous day's last paragraph (text belongs to the day before)
for i in ('085.0062', '085.0080', '085.0094', '085.0118', '085.0294', '085.0330', '085.0364', '085.0400'):
    P.strip_heading(i)

# --- 29 July: «March 29 juillet 1879» is the OCR of «Mardi»; a bare date line
P.remove_new(884, why='OCR «March 29 juillet 1879» = the 29 July date line; the day is old 085.0421')
P.add_entry('1879-07-29.md', '1879-07-29', 'Mardi 29 juillet 1879', frontmatter_from='1879-07-29.md')
P.move_old('085.0421', '1879-07-29.md')

# --- tiler prefix duplicates / labels
P.unset_french('085.0025', 'the prefix «voix doit s\'écouter de plus loin.» is already the end of 085.0024 (page break)')
P.set_french('085.0445', P.old_text('085.0445').replace('[Je voudrais]', '[Mots noircis: Je voudrais]', 1), 'label as printed (¶914)')

# --- kinds
for i in ('085.0030', '085.0147', '085.0206', '085.0404'):
    P.kind_old(i, None)        # not letters: sentences opening with Madame/Monsieur, dialogue
for i in ('085.0178', '085.0310', '085.0340'):
    P.kind_old(i, None)        # a date heading plus an inline struck line: no kind (the heading must not be struck)
P.kind_old('085.0359', 'letter', "Invitation de Marie à Bojidar Karageorgevitch, signée «la mère Couvelet», 11 juillet 1879")
P.kind_new(365, 'editorial'); P.kind_new(369, 'editorial')
P.kind_new(265, 'other', "Annotation de la mère de Marie (M. Bashkirtseff mère), 1905")
# the note Marie sent to the Figaro and the Pays (¶633–637), signature included
e, k = P.where_new(633)
P.replace_new(633, newpara(633, 637, joiner='\n', kind='letter', source="Note envoyée par Marie au Figaro et au Pays, signée «Un abonné, revenant de Londres», 21 juin 1879",
                           text='\n'.join([
                               "Les circonstances qui ont accompagné la mort du Prince préoccupent vivement les esprits en Angleterre. Les objets d'or trouvés sur le corps, tandis que les habits sont volés comme pour donner le change font supposer un crime dont on a voulu charger les Zoulous. Le bruit court avec une persistance extraordinaire que le lieutenant Carey, qui a été au moins imprudent, va passer en Conseil de guerre. L'émotion et énorme.",
                               "Un abonné, revenant de Londres."]),
                           note='«La note suivante» that Marie had Mme de Bailleul drop at the Figaro and the Pays (¶632); set in small type in the print.'))

# --- 2 August: bare date line
P.placeholders()

# --- OCR in new text
P.edit_new(502, lambda s: s.replace("qu'/7 *faut*", "qu'il *faut*"), "OCR «qu'/7» = «qu'il» (printed p.35)")

# --- accentless old clusters
for i in sorted(P.O):
    if not i.startswith('085.'): continue
    t = ' '.join(l for l in P.O[i][1] if not l.startswith('#'))
    if len(t) > 40 and not re.search('[éèêàâùûôîçÉÀ]', t):
        P.restore_accents(i, 57, 966)

P.restore_labels(57, 966)
P.set_french('085.0304', P.p and next(x for e in P.p['entries'] for x in e['paragraphs'] if x.get('old') == '085.0304')['set_french'].replace("[Mots noircis: elle n'ai]", "[Mots noircis: Elle n'a]"), "label restored; keep «Elle n'a» (OCR «n'ai»)")
P.set_french('085.0400', next(x for e in P.p['entries'] for x in e['paragraphs'] if x.get('old') == '085.0400')['set_french'].replace("à ('Exposition", "à l'Exposition"), "OCR «('Exposition» = «l'Exposition»")
P.edit_new(266, lambda s: s.replace('sous nos 18 fenêtres', 'sous nos fenêtres'), 'page number 18 glued')
P.edit_new(606, lambda s: s.replace('sans 43 parler', 'sans parler'), 'page number 43 glued')
P.restore_inline_labels(57, 966)
P.ocr_hyphens()
P.typos([('belle toille', 'belle toile'), ('me condurie', 'me conduire'), ('respécter', 'respecter'), ('asurément', 'assurément'),
         ("d'aillleurs", "d'ailleurs"), ('intellignece', 'intelligence'), ('aussi madade', 'aussi malade'),
         ('réssusciter', 'ressusciter'), ("m'empécher", "m'empêcher"), ("L'émotion et énorme", "L'émotion est énorme")], 57, 966)
P.join_breaks()
P.save()
