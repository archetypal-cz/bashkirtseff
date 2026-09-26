# UK fablelous wave — 2026-09 (cloud routine)

Owner-authorised self-driven polish of the Ukrainian tree (`content/uk/` only).
Model: Opus 5.5 (lead + one agent per carnet). Started 2026-09-26.

- **Phase 1** — first fablelous pass on 098–106 (commit msg "fablelous pass").
- **Phase 2** — second "calque hunt" pass on 000–097, going upward (commit msg "calque pass").

Gates per carnet: `just splicescan uk {c}` empty, `just verify-carnet uk {c}` PASS.
Carnets with >150 changed lines get a fresh-context reviewer (RED comments, % better/neutral/worse).

## Resume here

Phase 1 (098–106) DONE. Phase 2 done: 000–081. Next: 082 upward, waves of 6 (push after each wave — `git pull --rebase` needs a clean tree). Lead's helper scripts live in the session scratchpad (lost with the container); the per-carnet brief = the routine prompt's agent section. Running: —

## Done

| carnet | pass | commit | files | changes (FAB comments) | review | notes |
|---|---|---|---|---|---|---|
| 098 | FAB 1 | 02b00923 | 78 (46 changed) | 129 (~163 edits) | not needed (129 lines) | owner query 0005: sprain is feigned («удаю… вивиху»); Mlle de Villevieille feminine again (0568/0588/0590/0603); ~15 meaning errors; God «Ви» → «Ти» in 0056 to match 0024 |
| 099 | FAB 1 | 0f0b362d | 53 (29 changed) | 94 | not needed (94 lines) | meaning fixes 0181 monter, 0232, 0322 *en vouloir*, 0393 sarcasm; пастель → fem.; TM «Поль і Вірджинія» restored 0374 |
| 100 | FAB 1 | d6850566 | 53 (32 changed; 21 placeholder/empty) | 312 | RED: 83% better / 15% neutral / 2% worse, 7 fixed | Marie restored: 0003 «архітектор», 0010 «поета Демодоніса»; Modeste Mignon (06-27); TM Жюліан ×5 |
| 101 | FAB 1 | 7bf54579 | 56 (45 changed) | 128 | not needed (124 lines) | TM locks: Жулян → Жюліан 20×, Карагеоргевич → Караджорджевич 6×; meaning slips 0035/0206/0409/0466/0492/0554/0598; «подрочити» → «подражнити» (0174) |
| 102 | FAB 1 | cb1a1669 + 6b5f36b3 | 88 (55 changed) | 131 | not needed (63 lines) | «меса» → «служба» for Orthodox services 5×; ennuyer→нудити 5×; masc. forms in Marie's voice 3×; 6b5f36b3 drops duplicated 102.0086 sentence from 102.0085 |
| 103 | FAB 1 | 9c05f959 | 59 (45 changed) | ~270 | RED: 88% better / 10% neutral / 1.5% worse, 4 fixed | owner query 0004 fixed (Villevielle back at lunch); Marie's «Арія Геродота» restored (0244; uk has no footnote — RSR could add one); «родини Жід» (0513) |
| 000 | calque 2 | 78b89e14 | 10 (10 changed) | 60 | not needed (32 lines) | preface; «Свята Русь!!» restored (0036) |
| 001 | calque 2 | 657ffc33 | 22 (18 changed) | 37 | not needed (35 lines) | 2 pre-existing id-alignment warns (empty/footnote-only source paras 0019, 0104) |
| (tree) | TM-lock sweep | 2eb49e75 | 10 carnets | ~44 ED | — | Карагеоргевич → Караджорджевич, Суцо/Сутцо → Соутцо |
| 104 | FAB 1 | bb90be94 | 53 | 169 | not needed (142 lines) | Marie's «!!» ×4; pre-existing splice in RED comment (1884-06-15) repaired |
| 105 | FAB 1 | 80566966 | 61 (47 changed) | 169 | not needed (148 lines) | 0075 *faire poser* = keep waiting (cz/105 has the same error «Nechal mě pózovat» — for the local session); TM «Пополь» |
| 106 | FAB 1 | 39f706e1 | 39 (14 changed) | 114 | not needed (102 lines) | TM «Жюліан» ×4; Мак-Кей vs Маккей here is Marie's own distinction (0007) — keep |
| 002 | calque 2 | 94b118b6 | 25 (23 changed) | 90 | not needed (77 lines) | «Miserere I» → «Miserere!» (0041; source/cz/en still have «I»); signature «Башкірцева [sic]» (0303) vs TM-071 lock «Башкирцева» — owner |
| 004 | calque 2 | 99026c14 | 33 (33 changed) | 158 | not needed (121 lines) | stray marginal-note copies at 0054/0067 removed (ED); God *vous* restored as «Ви» ×4 (see owner question)  |
| 006 | calque 2 | b9d8faf4 | 27 (27 changed) | 131 | not needed (81 lines) | floor numbering au premier → «на другому поверсі»; *pont* read as bathing stage (0118/0199) and 0068 «постати перед судом» — owner may revert |
| 003 | calque 2 | 5b5b9f2e | 33 (33 changed) | 160 | not needed (112 lines) | 0249 TR addition removed (Marie's contradiction about Boreel) |
| 005 | calque 2 | 36b33bcc | 29 (27 changed) | 167 | not needed (120 lines) | 0282 second «ревнувала до племінниці» ambiguous (left); God Toi→Vous switch 0229–0230 flattened to Ти (kept) |
| 007 | calque 2 | 2f73dfa6 | 29 (29 changed) | 182 | not needed (122 lines) | 0355 Marie's «Снідали … увечері» restored; *faire son chic* (0356) — owner |
| 009 | calque 2 | 673e7486 | 21 (20 changed) | 83 | not needed | 0041 *vache espagnole* literal «корова по-іспанськи» (CON-kept) → «страшенно калічить мову» — owner may revert |
| 013 | calque 2 | 6becb6f0 | 18 (17 changed) | 132 | not needed | «Халкіонов» (tree form, 79×) replaces «Хальціонов» ×2 — lock?; *salon* «салон» vs TM «вітальня» — owner |
| 008 | calque 2 | 6e3b0047 | 22 (21 changed) | 104 | not needed | 0331 *comme une biche* «сарна» (slang kept woman?); 0345 «сідає на високого коня» loan idiom — owner |
| 012 | calque 2 | 78dd17a8 | 19 (19 changed) | 110 | not needed | Aggie «Аґґі» (0281) vs «Еґі» (0052, 0102; tree 7 vs 12); «мадам/пані Говард» switch mid-carnet; 0207 dîner and déjeuner both «обідати» |
| 011 | calque 2 | 0b6e4c12 | 18 (18 changed) | 172 | not needed (127 lines) | «руське порося» (0267, 0275) for *cochon russe* — «руський» ambiguous, owner; «Галіньяні» (0218) probably nickname |
| 010 | calque 2 | ea12dc23 | 22 (21 changed) | 228 | RED: 85% better / 14% neutral / 1 worse, fixed | Одіффре ×3; après-midi → «пополудні» |
| 014 | calque 2 | b037e1bf | 23 (23 changed) | 140 | not needed (92 lines) | 0205 *ne l'a remarqué* and 0283 *Je ne me proposais* — stray ne? (left); «Анічковські» (0078) vs «Анічкови» |
| 019 | calque 2 | 32059118 | 36 (29 changed) | 108 | not needed | «Тріфон» vs TM «Трифон»; Laferrière «Лафер'єр» is the 2026-06-14 corpus-wide form (TM 019 section still says «Лаферрьєр» — TM stale) |
| 015 | calque 2 | a381ff56 | 24 (24 changed) | 160 | not needed (116 lines) | «до Сімон» (0086) vs «до Сімони» (0206, 0232); «авеню де ла Ґар» (0019) vs «Вокзальна алея» (0198) |
| 018 | calque 2 | fbc01b94 | 26 (25 changed) | 149 | not needed | «ніццяни» 21× elsewhere vs TM «ніццянці» 45× — sweep candidate; Lambertye «Ламбер'є» here vs «Ламбертьє» (FAB 004 said 170 vs 4) |
| 016 | calque 2 | 816faa73 | 26 (25 changed) | 158 | not needed (130 lines) | 0254 «Барон Потьомкін-перший» fuses Woerman+Potemkine (no comma in French); «Соломінка» (0087, 0193) vs «Соломинка» (0349, 0352) |
| 017 | calque 2 | 5e8642d9 | 34 (34 changed) | 248 | RED: 94% better / 3% neutral / 3% worse, 7 fixed | «на Бакі» (0113, 0189, elsewhere) vs TM «вілла Бакіс» — declension ruling |
| 025 | calque 2 | 4e6402d2 | 23 (20 changed) | 98 | not needed | TM «Башкирцева» applied; 0099 *cocodès* rendered «кокотками» (male dandies?) — owner |
| 021 | calque 2 | 43034fbc | 19 (18 changed) | 162 | not needed (130 lines) | Marie's «Orphée à Paris» restored (0060); TM double forms: Жерике/Жерікке, Танле/Тансле, Ґамбар vs text Гамбар, Маргарита/Марґеріт; *comme il faut* kept French once, «бездоганний» 5× |
| 022 | calque 2 | 4eec4b98 | 16 (15 changed) | 132 | not needed | «Папа» (Paparigopoulos) could read as the Pope — «Папарі»?; «Терези» (0265, the Thérèse sisters) reads as scales; «[закреслено:» vs «[Закреслено:» case mixed; «Маккейни» for *Macainne* (0367) |
| 020 | calque 2 | c37db74b | 36 (32 changed) | 177 | not needed (134 lines) | TM «порох» vs first-FAB «пил» (06-28/29); Notlimah forms; Вітґенштейн vs TM Вітґенштайн; «мисливці-піхотинці» vs TM; 0521 *au premier* «на першому поверсі» (006 changed floors to Ukrainian convention) |
| 024 | calque 2 | d7290702 | 41 (37 changed) | 188 | RED: 90% better / 9% neutral / 1% worse, 2 fixed | 0115 «del Puente I» read as «!» artefact — cz/en/fr and RSR stub keep «I»; fix belongs at source (RSR) |
| 023 | calque 2 | 69060d21 | 35 (32 changed) | 185 | RED: 90% better / 8% neutral / 2% worse, 4 fixed | footnote 023.0191.4 still «герцога Гамільтонського» (literal gloss) |
| (tree) | TM-lock sweep | 42ab95e0 | 25 carnets | 60 ED | — | Башкірцев → Башкирцев, Колліньйон → Коліньйон |
| 026 | calque 2 | d0b64b33 | 5 (5 changed) | 28 + 3 NOTE | not needed | TM vs tree majority: Трифон (TM) vs Тріфон (32:10 files); Мержеєвська (TM) vs Мержевськ- (78:15); Ґалула (TM, 79) vs Ґалюл- (19) |
| 031 | calque 2 | 3cfe1069 | 20 (16 changed) | 68 | not needed | Laussel «Лосселя/Лоссель» vs TM «Лосель» (032); 0098 *mon journal* after Galignani = newspaper?; 0164/0165 «I» artefacts (guess, left) |
| 028 | calque 2 | 7cdfee5c | 27 (23 changed) | 89 | not needed | Boileau quote misattributed in _original/028/1874-12-31 LAN note too (outside uk); Barrême «Барреме» (028) vs «Барем» (027, 029); «Єтьєнну» vs «Етьєн» |
| 029 | calque 2 | c9faacaa | 29 (27 changed) | 126 | not needed | 0227 «Юм» for source *Horne* (silent identification); 0080 «він трохи Каліостро»; 0223 inserted «(добре)» for *désonner* [sic] |
| 027 | calque 2 | 9c07b927 | 30 (28 changed) | 160 | not needed (119 lines) | pre-existing mixed-script «flapperом» (1874-12-04) |
| 032 | calque 2 | f095f8d6 | 24 (20 changed) | 62 | not needed | Marie's truncated *Audiffer* rendered «Одіффре» vs TM «Одіффер» (later carnet); TM-locked «грудь» for *gorge* reads Russian-leaning; 0109 *mon journal* diary or newspaper? |
| 030 | calque 2 | 75660119 | 33 (33 changed) | ~200 | not needed (142 lines) | footnotes 030.075.1 (Gioia = Maria Beckwith?) and 030.155.1 («Диявол» = Hamilton?) look wrong — RSR; «Зоя» vs TM «Зое Пелікан»; 0257 *qui ne me regarde pas* = God? (NOTE) |
| 035 | calque 2 | 687079ea | 2 (2 changed) | 21 | not needed | «зволює» also in 099/1883-05-01 (post-FAB) |
| 036 | calque 2 | 5b056ab4 | 6 (6 changed) | 44 | not needed | **0026 reread against LAN/RED/CON** (*Je ne puis le sentir ni le voir* = can't feel whether I paid him back) — owner; 0015 *Je dîne seule toujours* = still? |
| 037 | calque 2 | 7b474317 | 7 (6 changed) | 50 | not needed | 0141 *centenaire de Michel-Ange* rendered «чотиристаліття» (glosses Marie; «ювілей»?) |
| 038 | calque 2 | 3dbc27ba | 11 (11 changed) | 70 | not needed | demonym «ніццець» still in 028/1875-01-02, 033/1875-06-06, 035/1875-07-01 ×2 (TM: «ніццянець»; «мій ніццець» pet name OK) |
| 034 | calque 2 | 72378465 | 11 (11 changed) | 72 | lead spot-checked restored strikes | 11 dropped [Rayé:] restored; «Сапожеников-» still in 031, 043, 047–049, 064, 085, 102, 103 (TM/tree: Сапоженіков-, 190:47) — sweep candidate |
| 041 | calque 2 | 6932cff9 | 2 (2 changed) | 13 | not needed | Schlangenbad «Шлангенбад» ×24 / «Шлянгенбад» ×16 / «Шлянґенбад» ×10 — no lock |
| 039 | calque 2 | c154ad49 | 12 (10 changed) | 31 | not needed | 0114 «підряд» kept for rhyme; 0056 *je me trouve moins bien* health or looks? (NOTE) |
| 033 | calque 2 | 09b1193f | 21 (20 changed) | 112 | not needed | *paysan* «мужлай» vs TM cluster «селюк»; *faquin* first-FAB «негідник/шельмо» vs TM «фат»; en/033.0292 «his smile» may be wrong |
| 040 | calque 2 | 54f53867 | 5 (5 changed) | 46 | not needed | Schlangenbad split four ways in tree (21/12/9/6) — ruling |
| (tree) | TM-lock sweep | c52f62e7 | 9 carnets | 34 | — | Сапожеников- → Сапоженіков- |
| 042 | calque 2 | a67de9bc | 2 (2 changed) | 12 | not needed | source-side (RSR/LAN): 042.0040 Gioia tagged as a place; 042.0018 LAN glosses *gros bleu* as coarse; 0012 «шибеника» (*face de pendu*) — «повішеника»? |
| 044 | calque 2 | 48eaf0e2 | 4 (4 changed) | 37 | not needed | «Сапогеніков-» may remain elsewhere (045, 050, 059, 079) — sweep |
| 043 | calque 2 | 3662b4e5 | 10 (10 changed) | 63 | not needed | *centenaire* rendered «Чотиривікові роковини» (043.0104) vs «сторіччя» (041.0016) vs «чотиристаліття» (037.0141) — one ruling |
| 047 | calque 2 | 11651fe3 | 11 (11 changed) | 70 | not needed | footnote corrected Giroflé = Olga; 0365 «загартовуючи» for *durcissant* too positive? |
| 046 | calque 2 | f8732139 | 10 (10 changed) | 87 + 1 NOTE | not needed | 0014 who greets whom (cz differs); 0089 «шибениця» as fem. of «шибеник» (= gallows) |
| 045 | calque 2 | ff56bdee | 7 (7 changed) | 89 | not needed | 3 dropped strikes restored; «Ґалюла» still in 019, 024, 026, 050 (TM Ґалула) — sweep; 0122 *supérieure en haut* transcription? |
| 049 | calque 2 | f6f3de4b | 10 (10 changed) | 77 | not needed | 0217 *mon homme* → «мій герой» (flagged); note: a 2026-08 FAB in 049 had moved Sapogenikoff toward «Сапожеников-»; the 2026-09 sweep followed TM «Сапоженіков-» — owner confirm |
| 048 | calque 2 | 2a43a32e | 14 (14 changed) | 156 | not needed (142 lines) | Marie's weekday slip restored (0093); tarot «Приміряю!» overrides TR/CON; 0150 «я його хочу» reads sexual |
| (tree) | TM-lock sweep | 6e149796 | 13 carnets | 27 | — | Ґалюл-/Галул- → Ґалул-, Сапогеніков- → Сапоженіков- |
| 050 | calque 2 | 81e14714 | 38 (36 changed) | 158 | RED: 73% better / 25% neutral / 2% worse, 3 fixed | *Petit Noël* → «Святий Миколай» (0925, 0980) cultural substitution — owner; 0516 *mauvais esprit* «лихим кодлом»? |
| 051 | calque 2 | 057c8c88 | 14 (14 changed) | 87 | not needed | «монах» (0343) vs «ченці» elsewhere; *Si vous croyez que…* → «Ви, мабуть, гадаєте…» as a tree convention? |
| 052 | calque 2 | fb169f35 | 14 (14 changed) | 77 | not needed | 0264 *Je crois bien être nièce de l'Empereur* — irony or wish?; source oddities 0034 (duplicate of 0041), 0035 garbled |
| 053 | calque 2 | d08fb739 | 19 (18 changed) | 111 + 1 NOTE | not needed | **source-side: _original/053/1876-02-05 footnote calls Vigier a tenor** (she is the vicomtesse de Vigier; en same) — fix in _original/en; «умирущий гладіатор» vs «Вмираючий галл»? |
| 055 | calque 2 | 18f49c7c | 27 (27 changed) | 156 | lead spot-check (146 lines) | floor numbering mixed within 055 (0012 French counting vs 0681/0901 Ukrainian) |
| 054 | calque 2 | 14ce8756 | 18 (18 changed) | ~206 | RED: 85% better / 12% neutral / 3% worse, 5 fixed | Marie's «al Apollo» restored |
| 056 | calque 2 | fb058316 | 13 (13 changed) | ~258 | RED: 70% better / 27% neutral / 3% worse, 5 fixed | *huit jours* kept «вісім днів» (Marie counts them, 0263); 0570 *pour avoir des paroles* — news from him or words to express? |
| 057 | calque 2 | 6c9ad619 | 4 (4 changed) | 79 | not needed | 0104 «я подурнішав» (FAB 08-14) ambiguous (less handsome?) — «отупів»? |
| 058 | calque 2 | 103a0e9a | 6 (6 changed) | 115 | not needed | «Петруччо» (058, 059) vs TM «П'єтруччо»; «Десклі» for Desclée («Декле»?) |
| 061 | calque 2 | 2cb09bee | 7 (7 changed) | 157 | not needed (111 lines) | Marie's code asterisk restored (0096); «Ессаєвич» (no TM); «Наді» for Nadine; «Рима/Риму» |
| 065 | calque 2 | cf32609b | 16 (15 changed) | 50 | not needed | 0166 father's formal *vous* rendered «дозволь … тобі» |
| 063 | calque 2 | 3663aa23 | 13 (8 changed) | 142 | not needed | source-side: LAN note on _original 063.0104 (*amener* = persuade) is wrong; 0313 *Vous devez chanter* inference or advice? |
| 060 | calque 2 | ece5e947 | 9 (9 changed) | 245 | RED: 80% better / 17% neutral / 2.5% worse, 6 fixed | — |
| 059 | calque 2 | 9a0ef8cb | 20 (20 changed) | ~244 | RED: 80% better / 19% neutral / <1% worse, 2 fixed | Wykerslooth «Вейкерслот» (0384) vs «Вейкерслоот» (0577) |
| 062 | calque 2 | f4c4e17f | 35 (35 changed) | 399 | RED: 80% better / 16% neutral / 4% worse, 7 fixed | Savoy princess «Маргарита» (062) vs «Маргерита» (055, 060, 072) vs TM «Марґеріт» — ruling |
| 064 | calque 2 | 58bba800 | 23 (21 changed) | 222 | RED: 76% better / 22% neutral / 2% worse, 4 fixed | «мюлі» vs TM line 1303 *mules* «пантофлі»; footnote-glue candidate 064.0429 (pre-existing) — check |
| 070 | calque 2 | a96406d4 | 8 (8 changed) | 109 | not needed | **070.0162 «Alexandre»**: TM says uncle Олександр, context suggests Larderei (Алессандро) — owner; Кьяя vs К'яя; «Сілен»/«Силена» |
| 071 | calque 2 | c7f9bed2 | 25 (25 changed) | 107 | not needed | 0150 *une réponse de moi dit que je battais le monde* — manuscript check; 0264 Rosalie as the dictionary (flagged) |
| 066 | calque 2 | f4a109d5 | 37 (28 changed) | 112 | not needed | footnotes mix «Марія»/«Марі» (tree-wide question) |
| 067 | calque 2 | d019758d | 37 (16 changed) | 142 | not needed | Girofla «Жирофля» (masc.) vs TM operetta «Жирофле-Жирофля»; 0061 vocative «Поль» vs «Полю»; TM «ватажок дворянства» sounds odd |
| 069 | calque 2 | f237a57b | 36 (33 changed) | 191 | RED: 91% better / 6% neutral / 3% worse, 6 fixed | «Дзуніка» (TM 069) vs «Зуніка» (TM 070); «Караччоло» vs «Каракчоло»; I/II artefacts also in _original/069 |
| 068 | calque 2 | 1cb052aa | as-is).
Fresh-context RED review: ~79% better / 14% neutral / 4% worse;
7 fixed (0077, 0079, 0177, 0321, 0410 idiom, 0508, 0584). Gates:
splicescan clean, verify-carnet PASS. |
| 072 | calque 2 | d8c616a8 | 34 (33 changed) | 171 | not needed (145 lines) | **Кондарефф ×20 in 072 vs TM/071 «Кондарева»** — ruling; «пані де Музé» with Latin é; Трифон (TM) vs Тріфон (tree 32:10) — ruling |
| 073 | calque 2 | 33e56a25 | 36 (33 changed) | 263 | RED: 91% better / 8% neutral / 1% worse, 3 fixed | «Єтьєн» ×4 still in 078; 072 «оглядала готелі» / 073.0213 — «особняки»? |
| 074 | calque 2 | 565001bb | 37 (33 changed) | 121 | not needed | «Берт» undeclined in 083 (1878-12-04/08/15) vs «Берта»; 0029 *passée* «минула» → «зів'яла»?; 0224 *lâcher les poneys* |
| 077 | calque 2 | 01433d89 | 43 (37 changed) | 173 | not needed (149 lines) | signature «Марі Башкірцефф» in letters (0090, 0167, 0279, 0397) vs TM 2192 lock «Башкирцева»; «де Бопрер» (077) vs «де Бовреп'єр» (078–079) |
| 079 | calque 2 | ed91633a | 44 (35 changed) | 194 | RED: 92% better / 6% neutral / 1.5% worse, 3 fixed | Alexandre lock conflict (see questions) |
| 076 | calque 2 | 6941516e | 52 (43 changed) | 202 | RED: 73% better / 25% neutral / 2% worse, 3 fixed | 071/1877-05-13 FAB 08-15 declined «Коліньйона» (TM indeclinable) |
| 075 | calque 2 | ecbb12a0 | 36 (33 changed) | 195 | RED: 75% better / 21% neutral / 4% worse, 7 fixed | — |
| 078 | calque 2 | 3cd299ff | 41 (32 changed) | 246 | RED: 78% better / 19% neutral / 3% worse, 6 fixed | Alexandre (Larderei) «Александр» ×11 vs 071 lock «Алессандро»; «Єтьєн» 4× remains (sweep) |
| 080 | calque 2 | 25b9dbe1 | 48 (~41 changed) | 240 | RED: 82% better / 15% neutral / 3% worse, 7 fixed | — |
| 081 | calque 2 | e162fd9f | 47 (43 changed) | ~290 | RED: 78% better / 20% neutral / 2% worse, 4 fixed | reviewer: «приймати за» is normative Ukrainian (SUM), not a Russianism — agents should not swap it |
| (tree) | TM-lock sweep | 382b9887 | 028, 078, 091 | 8 | — | Єтьєн → Етьєн, Latin-ó Попóль → Пополь |

## Findings (other uk work)

- 081: source footnotes absent from uk (0035, 0347, 0357 [^2], 0362, 0439) — needs `just sync 081 uk` check or RSR decision; heading «#» inconsistent (06-23..06-27 lack it); «Олександр» for Larderei in 0223, 0445 (TM «Алессандро»).
- 080: Joyeuse «Жуаезький» (0305–0313) vs «Жуаєз» (0679); Multedo letter 0537/0538 made masculine (flagged).

- 073.0304 (1877-08-07): uk (and en) carry a visible editorial note «Марі написала «Вівторок 7 серпня 1877», але це помилка, 7 серпня було понеділком» — false: 7 Aug 1877 was a Tuesday; _original paragraph is empty. Removed in uk (see git log); en needs the same fix.
- Strike-marker wording mixed in uk (075 alone has «[Замазане слово]», «[Замазані слова: …]», «[Закреслені слова: …]», «[закреслено: …]», «[Закреслені рядки: …]», «[Викреслене слово]»): «[Закреслено: …]» (majority in places) vs «[Викреслено: …]» (TM form used by this wave). Owner: pick one.

- **_original/068 (Feb 1877) contains English summary placeholders in brackets** (0189, 0191, 0194, 0197, 0204, 0207, 0216, ~0219, 0231, 0234, 0235, 0238, 0239, 0241, 0243, 0246, 0247, 0249–0251, 0253, 0255, 0257, 0271) plus truncated 0181 ("et prenez") and placeholder 0031. uk translates them as bracketed editorial notes — per editing_rules §2 they must not read as Marie's words; needs a source fix (RSR) and an owner decision. Also date headings sit one paragraph apart fr vs uk in 068 (0085/0086 … 0634/0635).
- **«I!»/«II» transcription artefacts**: this wave renders them as Marie's «!!/!!!» (the routine brief lists them as a known trap), but TM lines ~1869/2047 (Conventions 068/069) and some TR notes say "preserved as-is"; cz keeps «II», en uses «‖». Owner: confirm the brief's convention and update the TM (or order a revert). Source-side fix in _original would settle all trees.

- Done (6e149796): «Сапогеніков-» and Galula variants swept. Still TODO: demonym «ніццець» in 028/1875-01-02, 033 (done), 035/1875-07-01 → «ніццянець» (check each is the demonym, not the pet name).

- **Laferrière is a woman** (the couturière; Marie: *cette sorcière… elle*, 024.0090/0130) but uk declines «Лафер'єр» as masculine («Лафер'єра», «якого боюся») — tree-wide check needed (indeclinable feminine «Лафер'єр» / «пані Лафер'єр»?). Owner/RED.
- **024.0207 footnote + ==highlight== claim Marie wrote «contre мене» in Cyrillic**; _original has plain «contre moi» / «pour moi» — recommend deleting the footnote and highlights (FAB NOTE at 0274). Owner.

- «Башкірцев-» → locked «Башкирцев-» (58×, 25 carnets) and stray «Колліньйон» → «Коліньйон»: swept in 42ab95e0. Note: 002.0303 signature now «Башкирцева [sic]» — TM says no [sic] for the signature slip; owner may drop it.

- 100 07-21 «Весна … біля його ніг» (pre-existing gender mismatch, Marie's *Le Printemps est un jeune dieu*) — left.
- Outside uk (for the local session): en/100 06-10 still has added "blind" + corrected "Demodocus"; _original/100/1883-06-27 LAN note on *la modeste Mignon* (Bettina/Goethe) is wrong — it is Balzac's *Modeste Mignon*.

- **102.0085 (1883-12-24)** is flattened into one visible line (source ~30 lines incl. dialogue) and was left unpolished; needs an entry-restructurer pass. Trailing duplicate of 0086 removed (6b5f36b3).
- **Karageorgevitch / Soutzo**: stray forms swept to TM locks in 2eb49e75 (all carnets except those then in agents' hands: 000, 104–106 — agents told to fix theirs).
- **Mackay «Мекей»** — a third spelling, only in 101 (~13×: 0041, 0121, 0122, 0174 ×4, 0179, 0186, 0347, 0515, 0559, 0560); TM lock is «Маккей». Recommend normalising (not done — Маккей/Мак-Кей is on the disputed list).
- 101.0104: French has footnote "In English in the original" with no visible English passage (source oddity). 101.0574 «II» artefact dropped in uk.

## Owner decisions / questions

Carried over from WORKPLAN-2026-09-25:
- 098.0005 faked or real sprain (*joue à une espèce d'entorse*)?
- 103.0004 *il croit que c'est lui Villevielle et Claire étant à déjeuner* — uk may drop Villevielle from the lunch.

Disputed spellings seen (not normalised — owner ruling needed):
- 099: Мак-Кей (0028, 0295, 0321) vs Маккей (0328–0331); Ехт (0200, 0338); Гавіні vs Ґавіні (0368); «Святих жон» (0239, 0359) vs «жінок» (0345, 0363, 0391).
- **Henner: «Геннер» (099.0305, 0393) vs «Еннер» (0347, 0377)** — not in TM; ruling needed.
- 099 minor: «ательє» once (0391) vs «майстерня»; bracket labels mixed «[Слова зачорнено: …]» / «[замазано: …]».

- 100: Гавіні (Г) 8×, Габріель (0084), Маккей, Гехта (0003); *père X*: «отець Жері» (0010), «батечка Гавіні» (0104), «батечка/батечко Чумаков» (0084, 0125).
- 101: Ґавіні (Ґ) throughout, «старому Ґавіні» 0605; «маршальша» (0243, 0295 ×2, 0311, 0331, 0381) vs TM-103 «маршалова» (corpus 16 vs 15); Габріель 0040; «Черниський» (0466, source *Tchernisky*) vs «Черницький»; «Княгиня Матильда» (0253) vs TM «принцеса Матильда»; «імператор Александр» (0383); «шваґро» (0369).
- 102: «старий/стара X» for *père/mère X* (0021, 0036, 0040, 0051 ×2, 0065, 0084, 0088).
- 103: Маккей throughout; Ґавіні; Дусе (0095).
- 001: **Boreel «Борель»** (TM line 126) collides with editor П'єр Борель (0002/0003); stray «Бореел/Бореель» elsewhere — ruling? Hélène «Елен» (0158) vs TM «Елена»/«Гелена».
- 000: «Батько Ґонзалес» (*le père Gonzalès*, 0026/0027 — here literally Rémy's father); «Жюлі Корнеліус» (0007).
- 098: Soutzo «Суцо» ×7 → fixed to locked «Соутцо» in the 2eb49e75 sweep; Eristoff «Принцеса Еристова» (0410) vs locked «Ерістов» and принцеса/княгиня mix; Ґабріель ×2 (0237); Дусе (0341); Ґамбетта (Ґ, corpus-normalised, TM 097 section still says Г).

- 104: «Ехт» (0159) vs TM «Гехт»; Ґавіні; **«Мітинг» ×6 for Marie's *Meeting* vs TM-103 «Збори»**; «княгиня Матильда» (0357, 0459) vs TM «принцеса»; «Сарицькі» used for both *Saritsky* (0219) and *Staritsky* (0271, 0458, 0597, 0701, 0719) — Marie's variants silently unified.

- 002: «Габрієллі» (Г) vs Ґ; «авеню де ля Ґар» (0127); signature «Марі де Башкірцева [sic]» (0303) vs TM-071 lock «Башкирцева».
- 004: Tolstoy — «Толстая» (Russian nominative, 0160/0162/0199) next to «Толстої/Толстою/Толстій»; no lock — «Толста»? 0083 «як кажуть по-нашому» hides Marie's *en russe*; 0262 «(нудьга)» for *(cochon)*.
- 006: vocative «Муся» (0008) vs «Мусю» in 021/027.
- 003: Ґальве ×3 (0033, 0080, 0115) vs Гальве ×16; Бенза ×6 vs Бенса (0210; tree majority Бенса); «New Scotland» Latin (0096) vs «Нью Скотленд» (0191); *matinée* at cercle Masséna ×3 renderings vs TM «музичний ранок»; «прогулянка» for the Promenade as a place (0061).
- 005: «Чернікофф» (-офф, 0213/0238/0278) vs -ов elsewhere; «Ненькова» (Nennkoff, 0224); «Маноте» (0220); «Ліонс» (0155).
- 007: «Ґаліцина» (Ґ) here vs 7× «Галіцин» in tree; «Ґранд-Готель» vs majority «Гранд-Готел…».
- 008: Hélène «Елен» (0039) vs «Елені» (0281 → Елена); 012: «боярською жоною» (0108); 013: «Коліньйон» (0154), «Воерман» (0093/0118), «Батько Бартер» (literally the father, 0111).
- 010: Brunet «Брюне» (0002, 0153, 0229) vs TM (lines 724, 952) «Бруне».
- 017: «Звєгінцов», «Вочею Данилівським» (0407), «Бете»; Mlle as «Мадемуазель Коліньон» and «панна де Ґальве».
- 018: Lise «Ліз» (0123–0124) vs «Ліза» (0307); Simone «Сімон» (016, 018) vs «Сімона» (015).
- 020: TM «порох» vs «пил» (06-28/29); Notlimah «Нотліма/Нотлім/Нотлімах»; Вітґенштейн vs TM Вітґенштайн/Віттґенштайн (also князь/принц split, 024.0307); «мисливці-піхотинці» vs TM «пішохідні мисливці»; «[Анотація: …]» vs TM «[Примітка … р.:]»; «Закреслено» and «Rayé» both used.
- 024: «батько Морено» (0075); «Басілєвич» vs TM Базілевич; «Ґалюла» vs TM Ґалула; «Бове»/«Соваса»; «Льовен» (Lewin); «Кертьє» (Querteux); мадам/пані mixed.
- **Floors**: *au premier* rendered «на першому поверсі» in 020.0521, 024.0025 while 006 converted to Ukrainian counting («на другому») — convention ruling.
- 023: Муленар regularises Marie's own «Mulinare»/«Moelenar» (0187–0202) — fact-correction?; «предводитель» vs TM «ватажок дворянства» (0208); stray «Колліньйон» still in 011/1873-11-01, 072/1877-07-14.
- 054: *coup de foudre* «удар грому» (0362, 0651) vs TM lines 453/702 "keep French" (not Locked) — «закохатися з першого погляду»?; footnote 054.0570.1 dates Fanny Lear scandal 1874 vs French RSR 1876.
- 060: Larderei's given name — «Олександру» (0450, the uncle's locked form) vs TM 071 «Алессандро» vs «Александра» (0067); «Рима/Риму» mixed.
- 062: «Шоколь» (0420, 0421) vs TM-063 «Шоколад»; vocative «Маріє» (0207, 0211, 0215) vs TM «Марі» indeclinable; *mes mères* «матусі»; *fraises* «суниці»/«полуниці».
- 079: **Alexandre** rendered «Александр» throughout (RED 0045 calls it canonical) vs TM lock Larderei = «Алессандро», uncle = «Олександр» (Larderei in 0045, 0050, 0128, 0129, 0213, 0216; uncle 0113, 0239) — lock conflict, owner/lead; Сент-Оґюстен/Сент-Огюстен/Сен-Огюстен; Морган/Морґан; 0654 *chez papa* (1878) «до тата» may be the grandfather; stray empty ID 079.0566 at end of 04-27, extra 079.0144 in 03-28.
- 076: «Маркуар (вимовляється Маркуар)» (0328) meaningless in Cyrillic — footnote or drop?; «Популь» still 4× in 087 (TM «Пополь») — fix when 087 is polished.
- 075: address forms «Мосьє» (Marcuard) vs «пане» (Julian); «Принцеса Суворова» vs «княгиня» (0445).

Other questions:
- 023.0058 *maison de quatorze siècles* rendered «будинок чотирнадцятого сторіччя» — corrects Marie's "fourteen centuries [old]"?
- 010.0157 *chez les ânes* → «в ослів» (nickname for the Anitchkoffs); is «ослячий прокат» (*la petite ânerie*) also their house? 010.0225 *il est au Français* → «у Французькому ліцеї» (Théâtre Français? French class?); 010.0302 *J'ai joué au petit cosaque* — a game or the tune?
- 011: God Ти/Ви mixed inside one entry (0017 vs 0018/0019…); in 0389/0390 Marie herself writes *tu*.
- *dîner/déjeuner*: uk tree splits dîner between «обід» and «вечеря» (007 aligned to сніданок/обід; 103 mixes) — make «обід» a uk-wide TM rule?
- 106.0030 «Та блакиті, Вікторе Гюго» for *du bleu Victor Hugo* (Hugo-style blue?) — TR defends it; 106.0147 «бідолашний пес» for affectionate *pauvre chien*.
- 105: «Пер'в'є» for Périvier (0677, 0713) looks malformed («Перів'є»?). 105.0155 *comme je vais bien* likely a transcription slip for *je sais bien* (uk+cz literal). 105.0506 *la tête dans les mains* — «обхопивши» dangles; source check. 105.0192 verse attributed to Vigny *La Maison du berger* — unverified.
- «меса» for Orthodox services (104.0572 «Заупокійна меса»; 102 changed 5× to «служба») — ruling?
- 000.0006 *des mineurs* kept «промисловців» (LAN/RSR: mine owners); Kernberger reads "minors", likelier with *gens ruinés*. 000.0023 RED «поляк — підданий Росії» interprets Marie's *polonais, russe*. 000.0046 *sa bonne amie* «подруга» — maybe sweetheart.
- 098.0356 Marie's *sale Juif* → slur «жид», but *Juifs* in 0064 → «євреями». Keep? 098.0005 *jouent à la Porte* rendered as a Porte-Saint-Martin scene — maybe Musset's *Il faut qu'une porte…*. 098.0259 «Мадьє де Монжо» silently corrects Marie's "Montjan" (left).
- **Tchernitsky's gender**: 102.0030 changed «Черницького» → «Черницьку» (source continues *elle, le pope…*, 0035 *la Tchernitsky*), but 102.0148 and 101 are masculine — ruling needed.
- **God addressed as «ви» vs «Ти»**: 101 has «ви» (0235, 0247) and «Ти» (0095, 0302, 0575). Marie writes *vous*; Ukrainian norm is «Ти». Corpus-wide ruling? Note: agents moved in both directions pending the ruling — 098.0056 «Ви» → «Ти» (to match 0024); 004 four imperatives «ти» → «Ви» (to match the carnet's «Благаю Вас»).
- *maréchal de la noblesse*: «маршал…» ×7 vs «предводител…» ×13 in corpus, no lock (100.0009).
- «Нового времени» (100, 06-17/07-01) keeps the Russian paper title — keep or «Нового часу»?
- 100.0093 Marie's slip *pique d'amour-pur* (for *amour-propre*) rendered «уколом гордості» — restore literally with a note?
- 102.0055 «ішійська лотерея» (Ischia → «іскійська»?) — NOTE only. 102.0034 «Гарненьке ж завдання…» read as ironic; could be sincere.
- 103: **Cazin** spelled «Кадзен» (0217, 0633) — «Казен»? 0572 *chanteur des cours* rendered «придворний співець» in uk/cz/en — context suggests courtyard/street singer; cross-tree ruling. *dîner* as «обід» and «вечеряти» in the same carnet.
- 099.0215 transcription artefact *(II!!)* rendered «(!!!!)» (was invented «(та ну!!)») — or «(!!)»?
- 099.0393 «P. S.» where Marie wrote *N.B.* — left.
