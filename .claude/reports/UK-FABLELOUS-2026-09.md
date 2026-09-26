# UK fablelous wave — 2026-09 (cloud routine)

Owner-authorised self-driven polish of the Ukrainian tree (`content/uk/` only).
Model: Opus 5.5 (lead + one agent per carnet). Started 2026-09-26.

- **Phase 1** — first fablelous pass on 098–106 (commit msg "fablelous pass").
- **Phase 2** — second "calque hunt" pass on 000–097, going upward (commit msg "calque pass").

Gates per carnet: `just splicescan uk {c}` empty, `just verify-carnet uk {c}` PASS.
Carnets with >150 changed lines get a fresh-context reviewer (RED comments, % better/neutral/worse).

## Resume here

Phase 1: 099, 101, 102 committed (099 not yet pushed — tree never clean while agents run; push at wave end). Running: FAB 098, 104, 105, 106; reviewers on 100 and 103 (then commit them). Next: phase 2 from 000.

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

Other questions:
- 000.0006 *des mineurs* kept «промисловців» (LAN/RSR: mine owners); Kernberger reads "minors", likelier with *gens ruinés*. 000.0023 RED «поляк — підданий Росії» interprets Marie's *polonais, russe*. 000.0046 *sa bonne amie* «подруга» — maybe sweetheart.
- 098.0356 Marie's *sale Juif* → slur «жид», but *Juifs* in 0064 → «євреями». Keep? 098.0005 *jouent à la Porte* rendered as a Porte-Saint-Martin scene — maybe Musset's *Il faut qu'une porte…*. 098.0259 «Мадьє де Монжо» silently corrects Marie's "Montjan" (left).
- **Tchernitsky's gender**: 102.0030 changed «Черницького» → «Черницьку» (source continues *elle, le pope…*, 0035 *la Tchernitsky*), but 102.0148 and 101 are masculine — ruling needed.
- **God addressed as «ви» vs «Ти»**: 101 has «ви» (0235, 0247) and «Ти» (0095, 0302, 0575). Marie writes *vous*; Ukrainian norm is «Ти». Corpus-wide ruling?
- *maréchal de la noblesse*: «маршал…» ×7 vs «предводител…» ×13 in corpus, no lock (100.0009).
- «Нового времени» (100, 06-17/07-01) keeps the Russian paper title — keep or «Нового часу»?
- 100.0093 Marie's slip *pique d'amour-pur* (for *amour-propre*) rendered «уколом гордості» — restore literally with a note?
- 102.0055 «ішійська лотерея» (Ischia → «іскійська»?) — NOTE only. 102.0034 «Гарненьке ж завдання…» read as ironic; could be sincere.
- 103: **Cazin** spelled «Кадзен» (0217, 0633) — «Казен»? 0572 *chanteur des cours* rendered «придворний співець» in uk/cz/en — context suggests courtyard/street singer; cross-tree ruling. *dîner* as «обід» and «вечеряти» in the same carnet.
- 099.0215 transcription artefact *(II!!)* rendered «(!!!!)» (was invented «(та ну!!)») — or «(!!)»?
- 099.0393 «P. S.» where Marie wrote *N.B.* — left.
