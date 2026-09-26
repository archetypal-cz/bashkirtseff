# UK fablelous wave — 2026-09 (cloud routine)

Owner-authorised self-driven polish of the Ukrainian tree (`content/uk/` only).
Model: Opus 5.5 (lead + one agent per carnet). Started 2026-09-26.

- **Phase 1** — first fablelous pass on 098–106 (commit msg "fablelous pass").
- **Phase 2** — second "calque hunt" pass on 000–097, going upward (commit msg "calque pass").

Gates per carnet: `just splicescan uk {c}` empty, `just verify-carnet uk {c}` PASS.
Carnets with >150 changed lines get a fresh-context reviewer (RED comments, % better/neutral/worse).

## Resume here

Phase 1 (098–106) DONE. Phase 2 done: 000–019. Next: 020 upward, waves of 6 (push after each wave — `git pull --rebase` needs a clean tree). Lead's helper scripts live in the session scratchpad (lost with the container); the per-carnet brief = the routine prompt's agent section. Running: —

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

## Findings (other uk work)

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

Other questions:
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
