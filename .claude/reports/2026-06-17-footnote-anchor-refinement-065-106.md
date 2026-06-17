# Footnote harvest — anchor-refinement log (carnets 065–106)

Carnet **082 is EXCLUDED** — it was partially hand-done with a non-standard compound-key
scheme (`82.454.1`) whose spelling/format diverges from EN; needs manual reconciliation, not
automated harvest (reverted to its prior 12-footnote state this run).

- HIGH (precise): **553**   MED (precise proper-noun): **25**   LOW (end-of-para, refine later): **671**
- Unplaceable gaps (paragraph/text absent in French source): **1**

## Known edge cases (hand-handled or flagged)

- **091/1881-05-12 [^1],[^2]**: EN has a DUPLICATE paragraph id `091.0583` (Gavini + Cassagnac clusters); French has it once. Hand-placed at the true French Gambetta paragraph **091.0582**. (An audit vs EN's id will show a benign 0582≠0583 diff.)
- **070/1877-04-08 [^greek]**: EN inline ref sat on a `%%` comment line (parser blind spot) → auto-fell to the def paragraph; hand-moved to **070.0038** after 'prêtre grec'.
- **EN dangling defs (2)**: 067/1876-12-08-11 [^7], 101/1883-08-18 [^italian_101_0184] — EN has the def but no inline ref; completed at the def paragraph.
- **Duplicate-key-def files (mirror EN, flag for upstream renumber)**: 066/1876-09-05, 066/1876-09-24, 076/1877-12-22, 076/1877-12-12, 078/1878-02-14, 078/1878-02-18, 078/1878-02-13, 095 (×10). Keys restart per entry; defs paired by occurrence so placement is correct, but two `[^1]:` defs in one file can mis-render — fix upstream in EN.

## LOW footnotes to refine

| carnet | paragraph | key | definition |
|---|---|---|---|
| 065 | 065.0007 | [^1] | *Hetman*: the title of the Cossack military and political leader who governed Little Russi |
| 065 | 065.0009 | [^2] | The *Third Section* of His Imperial Majesty's Own Chancellery: the Tsarist secret police,  |
| 065 | 065.0022 | [^3] | A popular 19th-century parlor game in which players each write a word or phrase on a slip  |
| 066 | 066.0014 | [^1] | *In English in the original.* |
| 066 | 066.0043 | [^1] | The 19th-century term for Ukrainian. |
| 066 | 066.0056 | [^1] | The Louis XV style featured a low square neckline and laced or open front. |
| 066 | 066.0068 | [^1] | *Le Ruisseau* (The Brook), a fashionable salon piece. |
| 066 | 066.0229 | [^1] | The Fronde (1648–53), the 17th-century French civil wars during which aristocratic women w |
| 066 | 066.0242 | [^1] | Marie's contemptuous nickname for local workers or peasants. |
| 066 | 066.0278 | [^1] | The *Lupercalia*, an ancient Roman festival of purification and fertility celebrated on 15 |
| 066 | 066.0286 | [^1] | Orel (or Oryol) province was famous for its horse breeding. |
| 066 | 066.0341 | [^2] | A traditional Ukrainian peasant overcoat (*svita*), gathered at the waist. |
| 066 | 066.0384 | [^1] | The wonder-working icon of the Virgin of Akhtyrka (*Akhtyrskoye*), a celebrated pilgrimage |
| 066 | 066.0396 | [^1] | Girofla is a character from Charles Lecocq's comic opera *Giroflé-Girofla* (1874); Marie u |
| 066 | 066.0424 | [^1] | Adolphe Granier de Cassagnac (1806–1880), French journalist and Bonapartist polemicist, fa |
| 066 | 066.0428 | [^1] | Dikanka was celebrated by Pushkin in *Poltava* (1829), which recounts the love between Het |
| 066 | 066.0429 | [^2] | Prince Viktor Pavlovitch Kochubey (1768–1834), Russian statesman, one of Alexander I's clo |
| 066 | 066.0441 | [^1] | Léon Gambetta (1838–1882), French republican statesman and orator, founder of the Third Re |
| 066 | 066.0443 | [^2] | *O rus!* — "O countryside!" Horace, *Satires* II.6. The celebrated exclamation of longing  |
| 066 | 066.0489 | [^2] | Walking to Kiev — to the Pechersk Lavra (Monastery of the Caves), a foremost Orthodox pilg |
| 066 | 066.0529 | [^3] | Marie de Rohan, Duchess of Chevreuse (1600–1679), celebrated beauty and political intrigan |
| 067 | 067.0029 | [^2] | M. Prudhomme — pompous bourgeois character created by Henri Monnier (1830s), famous for hi |
| 067 | 067.0042 | [^4] | "L'homme vert" (the green man) — Marie's nickname for Pacha, recurring throughout the diar |
| 067 | 067.0114 | [^7] | Sacher's — the famous Viennese restaurant and hotel founded by Eduard Sacher in 1876, reno |
| 067 | 067.0198 | [^2] | Marie's pointed joke: she calls him "M. February" (Février) to mock the name Janvier (Janu |
| 067 | 067.0201 | [^1] | Blanc — a political associate at Mouzay's table; luncheon at 420 rue Saint-Honoré, 4th flo |
| 067 | 067.0204 | [^3] | Alexis — the famous Parisian *somnambule* (clairvoyant) consulted by fashionable Parisians |
| 067 | 067.0206 | [^4] | Cassagnac was from Gascony (southwest France), of a family with roots in the colonial worl |
| 067 | 067.0223 | [^1] | *Paolo* — Italian form of Paul, here a mocking nickname the La Motte circle applied to Cas |
| 067 | 067.0229 | [^3] | *Silhouettes à la plume* — a parliamentary almanac publishing brief profile sketches of de |
| 067 | 067.0231 | [^6] | The laryngoscope was invented in 1854 by Manuel García; in 1876 it was still a relatively  |
| 067 | 067.0262 | [^2] | *La Jeunesse du roi Henri* — an eight-volume historical romance by Pierre Alexis Ponson du |
| 067 | 067.0265 | [^3] | *Un ballo in maschera* — opera by Giuseppe Verdi (1859); the plot turns on a masked ball,  |
| 067 | 067.0271 | [^5] | The Trémoille — one of the oldest noble families of France, with continuous history from t |
| 067 | 067.0293 | [^3] | Roller skating rinks (*skating-rinks*) were a fashionable novelty of the 1870s; Marie uses |
| 067 | 067.0315 | [^6] | *Tu quoque?* — Latin: "You too?" The phrase here conveys ironic surprise. |
| 067 | 067.0360 | [^10] | Livy — Titus Livius (59 BC–AD 17), Roman historian, author of the *Ab Urbe Condita* chroni |
| 068 | 068.0004 | [^2] | Ironic: the phrase in French means "did not have the happiness of seeing me." |
| 068 | 068.0034 | [^5] | "My mothers" — Marie's ironic plural for the various older women who advise her. |
| 068 | 068.0052 | [^8] | *sorokas* — Russian for "magpies"; Marie's code word for suitors attracted to shiny, fashi |
| 068 | 068.0061 | [^9] | *habits pontificaux* — the formal, conservative dress code required in papal Rome society. |
| 068 | 068.0126 | [^17] | Lily of the valley: traditional New Year good-luck flower in France and Italy; ivy: symbol |
| 068 | 068.0139 | [^ve] | *Victor Emmanuel*: Victor Emmanuel II (1820–1878), the first King of unified Italy; known  |
| 068 | 068.0141 | [^youngitaly] | *Young Italy* (*La Giovine Italia*): the Risorgimento movement founded by Mazzini in 1831, |
| 068 | 068.0146 | [^murs] | *Murs marrons* ("brown walls"): for Marie, the epitome of bourgeois provincial drabness. |
| 068 | 068.0146 | [^coucou] | *Pendule à coucou* ("cuckoo clock"): a symbol of middle-class taste and provincial time-ke |
| 068 | 068.0159 | [^giaour] | *Giaour*: from Turkish, an infidel — a non-Muslim. Used here as a theatrical mock-insult i |
| 068 | 068.0162 | [^girofla] | *Girofla*: a character from the operetta *Giroflé-Girofla* (Lecocq, 1874) — Marie repurpos |
| 068 | 068.0173 | [^latin] | ==*Dubium, illusio, deceptio, oppressio*== *In Latin in the original.* "Doubt, illusion, d |
| 068 | 068.0176 | [^cabinet] | *Cabinet d'études*: a gentleman's study or private library — traditionally a male domain f |
| 068 | 068.0366 | [^23] | The Countess of Mirafiore was the morganatic wife of Vittorio Emanuele II's illegitimate s |
| 068 | 068.0509 | [^32] | *coquine* — literally a minx or rogue; used here as a euphemism for a kept mistress. |
| 068 | 068.0648 | [^46] | Dante, *Inferno* II.127–129: the simile of flowers drooping in night frost and reviving in |
| 069 | 069.0117 | [^3] | A handshake with the thumb pressed forward implied an inappropriate degree of intimacy or  |
| 069 | 069.0170 | [^2] | Marie's invented Italian: "On the occasion of the arrival of Count Alessandro de Larderei, |
| 069 | 069.0240 | [^1] | The "cardinal's son" refers to the illegitimate son of Cardinal Antonelli, whom Marie has  |
| 069 | 069.0256 | [^1] | *Sappho*: opera by Gounod (1851), based on the life of the Greek poetess. |
| 069 | 069.0286 | [^1] | A dress in the pastoral style of the heroine of *Paul et Virginie*. |
| 069 | 069.0286 | [^3] | *Dilettanti*: in Italian in the original; society amateurs performing. |
| 069 | 069.0294 | [^1] | The Hôtel Drouot was the famous Paris auction house; sixty thousand francs would have been |
| 069 | 069.0457 | [^1] | Worth: the celebrated Paris couturier Charles Frederick Worth (1825–1895), whose house dre |
| 069 | 069.0466 | [^3] | In Italian in the original: "Marquis of Campomarino" — a nobleman holding the marquisate o |
| 069 | 069.0480 | [^2] | In Italian in the original: "Please, introduce me to those ladies!" |
| 069 | 069.0487 | [^1] | *Stabat Mater*: the celebrated sacred choral work by Giovanni Battista Pergolesi (1710–173 |
| 069 | 069.0521 | [^1] | Holy Thursday and Good Friday: during Holy Week, the Via Toledo (Via Roma) was closed to c |
| 069 | 069.0567 | [^1] | The *King of Thule* aria: *Il était un roi de Thulé*, from Gounod's opera *Faust* (1859),  |
| 070 | 070.0001 | [^lazzarone] | *Lazzarone* (pl. *lazzaroni*): Neapolitan term for a street idler or rascal, often hired f |
| 070 | 070.0001 | [^silene] | *Silène*: Silenus, the drunken foster-father of Dionysus in Greek mythology, also associat |
| 070 | 070.0001 | [^faust] | In Gounod's *Faust* (1859), Marguerite is seduced and abandoned by Faust; she kills her ch |
| 070 | 070.0004 | [^dante1] | *In Italian in the original.* Dante, *Inferno* I:37-40: "It was the beginning of the morni |
| 070 | 070.0010 | [^villareale] | The Villa Reale (now Villa Comunale), Naples' premier public garden along the Chiaia seafr |
| 070 | 070.0010 | [^aquarium] | The Stazione Zoologica aquarium, built 1872-74 by Anton Dohrn — one of the first public aq |
| 070 | 070.0011 | [^poisson] | *Poisson d'avril*: April Fool's prank (lit. "April fish"). |
| 070 | 070.0020 | [^champdemars] | The Champ de Mars: Naples' racecourse, modeled on the French pattern. |
| 070 | 070.0021 | [^carricolo] | *Carricolo*: a Neapolitan two-wheeled cart, famously overloaded. |
| 070 | 070.0022 | [^roi] | King Vittorio Emanuele II of Italy (1820-1878), in the last year of his reign. |
| 070 | 070.0028 | [^russian] | *In Russian in the original.* Marie switches to Russian for private communication in publi |
| 070 | 070.0030 | [^gerace] | *In Italian in the original.* "I was saying it wasn't Larderei... Francesco, it's my son,  |
| 070 | 070.0034 | [^detraque] | *Détraqué*: out of order, derailed — colloquial French for mentally disturbed. |
| 070 | 070.0038 | [^easter] | Orthodox Easter (Julian calendar) fell on 8 April 1877, coinciding that year with Western  |
| 070 | 070.0071 | [^greek] | *Prêtre grec*: a Greek Orthodox priest; the family followed the Russian Orthodox rite, ser |
| 070 | 070.0073 | [^vitanuova] | *In Italian in the original.* Dante, *Vita Nuova* XXVI: "So gentle and so honest appears / |
| 070 | 070.0081 | [^cherubino] | Cherubino: the adolescent page in Mozart's *The Marriage of Figaro* (1786), archetype of u |
| 070 | 070.0086 | [^on] | The letter is written throughout in the formal impersonal third person *on* ("one"), which |
| 070 | 070.0122 | [^dante3] | *In Italian in the original.* Dante, *Inferno* I:41: "so that it gave me reason to hope."  |
| 070 | 070.0174 | [^filarmonica] | The *Società Filarmonica*: a private Neapolitan club for music and theatrical performances |
| 070 | 070.0198 | [^latin] | *In Latin in the original.* Marie's closing motto: "Doubt, illusion, deception, oppression |
| 071 | 071.0018 | [^2] | The Cascine is Florence's principal public park, stretching along the Arno, famous for fas |
| 071 | 071.0039 | [^3] | "L'Aquarium": Marie's nickname for a person (likely a rival or social figure from Naples). |
| 071 | 071.0040 | [^4] | The Teatro della Pergola, Florence's principal opera house and theater; closed for the sea |
| 071 | 071.0057 | [^7] | The French proverb: *Il n'y a que les montagnes qui ne se rencontrent pas* — only mountain |
| 071 | 071.0064 | [^9] | Michele Gordigiani (1835–1909), celebrated Florentine portrait painter who had painted Que |
| 071 | 071.0075 | [^10] | Marcuard is Swiss; Marie invokes William Tell as the Swiss national hero, a mock-heroic tr |
| 071 | 071.0151 | [^14] | This is one of the earliest recorded symptoms of the tuberculosis that would take Marie's  |
| 071 | 071.0153 | [^15] | Maman's remark carried a clinical, biological implication — that marrying Audiffret would  |
| 071 | 071.0156 | [^16] | Captain Paul Boyton (1848–1924), an American adventurer famous for swimming feats in an in |
| 071 | 071.0158 | [^17] | "The young lady who plays the harp" is a playful code Marie and Marcuard use to refer to M |
| 071 | 071.0158 | [^18] | Budapest was then divided into Buda and Pest; "Pesth" refers to the Pest side. |
| 071 | 071.0161 | [^19] | Sophie Cruvelli (1826–1907), celebrated operatic soprano who retired from the stage around |
| 071 | 071.0177 | [^22] | The parenthetical "(c'est pour le faire enrager)" = "(this is to make him furious)" — addr |
| 071 | 071.0188 | [^24] | Crown Prince Umberto of Italy, future King Umberto I (r. 1878–1900). |
| 071 | 071.0241 | [^29] | Phonetic transcription of Lise's speech, who cannot pronounce *r*: "Les trois camarades La |
| 071 | 071.0256 | [^31] | Catherine Segurana: legendary heroine of Nice, celebrated for her defiant role in repellin |
| 073 | 073.0047 | [^1] | Henri d'Artois, Comte de Chambord (1820–1883): the Legitimist claimant to the French thron |
| 073 | 073.0142 | [^1] | The Oath of Rütli (or Grütli): legendary oath said to have founded the Swiss Confederation |
| 073 | 073.0144 | [^3] | Euterpe: Muse of music in Greek mythology; Marie uses the name playfully for an invented h |
| 073 | 073.0177 | [^1] | The Lambertini-Antonelli case: Countess Loretta Lambertini claimed to be the illegitimate  |
| 073 | 073.0218 | [^1] | *La Vie Parisienne*: a popular Parisian satirical and society weekly, founded in 1863; kno |
| 073 | 073.0220 | [^2] | Soden am Taunus: a German spa town in Hesse, known for its saline mineral springs, recomme |
| 073 | 073.0229 | [^1] | The Français: the Comédie-Française, France's national theatre, founded in 1680. |
| 073 | 073.0231 | [^2] | Louis-Arsène Delaunay (1826–1903): celebrated actor of the Comédie-Française, renowned for |
| 073 | 073.0232 | [^3] | An allusion to Genesis 9:21: Noah, having planted a vineyard, "drank of the wine and was d |
| 073 | 073.0248 | [^1] | The Bon Marché: Paris's pioneering department store, founded in 1852 and redesigned by Gus |
| 073 | 073.0261 | [^2] | The Talleyrand-Périgord: one of the great names of the French aristocracy, bearers of the  |
| 073 | 073.0268 | [^3] | Watteau style: hats inspired by the pastoral and fête galante paintings of Antoine Watteau |
| 073 | 073.0273 | [^maar] | Marie writes *maar* (Dutch/Flemish for "but") — the reason for this code-switch is unclear |
| 073 | 073.0285 | [^1] | The Cascade: an artificial waterfall in the Bois de Boulogne, a fashionable destination fo |
| 073 | 073.0290 | [^2] | *In English in the original.* Marie uses the English slang "gangster" in the sense of a pr |
| 073 | 073.0346 | [^4] | Charles Frederick Worth (1825–1895): English-born Paris couturier, founder of haute coutur |
| 073 | 073.0361 | [^1] | La Grenouillère: a famous bathing and dancing establishment on the Seine at Bougival, immo |
| 073 | 073.0361 | [^2] | Bal Mabille: a notorious open-air dance hall on the Champs-Élysées, celebrated for its cou |
| 073 | 073.0391 | [^2] | Waléry: studio name of Stanislaus Julian, Count Ostrorog (1830–1890), one of the foremost  |
| 073 | 073.0406 | [^2] | *In English in the original.* |
| 073 | 073.0418 | [^1] | Caroline Reboux (1837–1927): the most celebrated milliner in Paris, whose creations were w |
| 073 | 073.0419 | [^3] | 15 August: the feast of the Assumption of the Virgin Mary, the name-day of Marie (Maria).  |
| 073 | 073.0427 | [^1] | Saint-Augustin: the fashionable church in the 8th arrondissement of Paris, completed in 18 |
| 073 | 073.0427 | [^2] | The feast of the Assumption (15 August) had been declared Napoleon I's name-day in 1806; t |
| 073 | 073.0427 | [^3] | Paul de Cassagnac (1842–1904): fiery Bonapartist journalist and politician, editor of *L'A |
| 073 | 073.0427 | [^4] | Napoleon IV: the Prince Imperial, Louis-Napoleon (1856–1879), son of Napoleon III and heir |
| 073 | 073.0471 | [^1] | Uncle Alexandre: Marie's uncle by marriage, not Alexandre Larderei, the young man she is i |
| 073 | 073.0475 | [^2] | Hecuba: Queen of Troy, wife of Priam. In Homer's *Iliad*, she watches from the walls as he |
| 073 | 073.0484 | [^1] | Marie is acting as godmother to little Alexandrine (the Cardinal Antonelli's illegitimate  |
| 073 | 073.0504 | [^3] | Marie signals that she is rendering Ouida's English-language novel into French as she quot |
| 073 | 073.0525 | [^5] | Diogenes of Sinope (c. 412–323 BC): the Cynic philosopher celebrated for renouncing worldl |
| 074 | 074.0216 | [^gf] | In English in the original. |
| 075 | 075.0086 | [^3] | "My Emperor": Marie's mock-formal address to her imaginary diary reader, used as an exclam |
| 075 | 075.0095 | [^4] | Charles Frederick Worth (1825–1895), the celebrated Paris couturier, founder of haute cout |
| 075 | 075.0117 | [^5] | The Académie Julian, founded 1868 by Rodolphe Julian, was one of the very few Parisian stu |
| 075 | 075.0121 | [^7] | A scapular is a small religious amulet, typically two cloth squares joined by cords, worn  |
| 075 | 075.0121 | [^8] | The Prix de Rome: the prestigious French state scholarship in fine arts, allowing the winn |
| 075 | 075.0133 | [^9] | In the studio context, *académie* refers to a life drawing from a nude model — the fundame |
| 075 | 075.0152 | [^10] | Larderei was Marie's previous drawing teacher in Nice, evidently far less rigorous than th |
| 075 | 075.0229 | [^14] | *The Last Day of Corinth* (1870), by Tony Robert-Fleury (1837–1911): a monumental history  |
| 075 | 075.0282 | [^15] | The legislative elections of 14 October 1877, in which the republican opposition dealt a h |
| 075 | 075.0289 | [^16] | The republicans had won 363 seats in the 1876 elections, giving rise to the "Groupe des 36 |
| 075 | 075.0331 | [^17] | Mistigri is a character in Balzac's play *Le Faiseur* (also known as *Mercadet*) — or more |
| 076 | 076.0081 | [^1] | Parliamentary *validations*: the Chamber's review and ratification of contested election r |
| 076 | 076.0220 | [^1] | The fortress of Kars (in present-day Turkey) fell to Russian forces on 18 November 1877, a |
| 076 | 076.0239 | [^1] | The Prix de Rome: France's most prestigious art award, granting a residency at the Villa M |
| 076 | 076.0319 | [^1] | Tommaso Salvini (1829–1915), renowned Italian tragic actor, famous throughout Europe for h |
| 076 | 076.0334 | [^1] | Italian: "the beautiful things." In Italian in the original. |
| 076 | 076.0358 | [^1] | Jean-Martin Charcot (1825–1893), the celebrated neurologist at the Salpêtrière, considered |
| 076 | 076.0369 | [^1] | "The Greek Calends" — since the Greeks had no Calends (that was a Roman division of the ca |
| 076 | 076.0378 | [^1] | The Faubourg Saint-Germain: the aristocratic quarter of Paris, stronghold of the old legit |
| 076 | 076.0382 | [^1] | Adolphe Desbarolles (1801–1886), a celebrated Parisian chiromancer (palm-reader) whose sal |
| 076 | 076.0386 | [^1] | The fortress of Plevna (Pleven, Bulgaria) fell to Russian forces on 10 December 1877 after |
| 076 | 076.0415 | [^1] | The motto of the Three Musketeers — Marie continuing her Dumas game from the entry of 27 N |
| 076 | 076.0436 | [^1] | Julian — Rodolphe Julian, director of the Académie Julian. Marie calls him "le patron" (th |
| 076 | 076.0468 | [^1] | Léon Bonnat (1833–1922), a prominent academic portrait painter with a celebrated private s |
| 076 | 076.0468 | [^2] | Mihály Munkácsy (1844–1900), the celebrated Hungarian realist painter then at the height o |
| 077 | 077.0051 | [^1] | In English in the original. |
| 077 | 077.0096 | [^1] | In English in the original ("skatiner"). |
| 077 | 077.0140 | [^1] | In English in the original. |
| 077 | 077.0178 | [^1] | In Italian in the original: "Farewell, Miss." |
| 078 | 078.0024 | [^1] | Laferrière: a fashionable Paris couturier of the period. |
| 078 | 078.0037 | [^1] | "Mounted to the loge": entered the enclosed competition studios at the École des Beaux-Art |
| 078 | 078.0140 | [^1] | *Girofle-Girofla* (1874): comic operetta by Charles Lecocq, about twin sisters whose desti |
| 078 | 078.0189 | [^1] | The Café Anglais, on the boulevard des Italiens, was one of the most celebrated restaurant |
| 078 | 078.0189 | [^2] | The Grand-16 was the Café Anglais's most notorious private cabinet, associated with assign |
| 078 | 078.0198 | [^1] | King Victor Emmanuel II of Italy died on 9 January 1878; his funeral in Rome drew mourners |
| 078 | 078.0199 | [^1] | Teatro della Pergola: Florence's oldest and most celebrated opera house. |
| 078 | 078.0199 | [^2] | In English in the original. |
| 078 | 078.0215 | [^1] | Alexis: a celebrated Parisian clairvoyant (*somnambule*) who worked by psychometry — holdi |
| 078 | 078.0301 | [^1] | Quotation from Corneille's *Le Cid* (1637), Don Diègue's monologue (Act I, scene 4): "Ô ra |
| 079 | 079.0127 | [^1] | In English in the original. |
| 079 | 079.0128 | [^2] | "Gentlemen-riders" in English in the original. |
| 080 | 080.0020 | [^2] | The 1878 Exposition Universelle in Paris, a major world's fair. |
| 081 | 081.0035 | [^1] | Violets were the emblem of the Bonapartists; sending them anonymously to the Empress in ex |
| 081 | 081.0341 | [^1] | The Russo-Turkish War of 1877-78, in which Russian forces defeated the Ottoman Empire. Gen |
| 081 | 081.0347 | [^1] | The fake letter Marie sent Multedo, signed as from "la petite tante," described in the ent |
| 081 | 081.0355 | [^1] | The celebrated Ariadne on the Panther sculpture by Johann Heinrich Dannecker (1814), displ |
| 081 | 081.0357 | [^2] | In English in the original (French text uses the word as fashionable slang). |
| 081 | 081.0362 | [^1] | The small ads / personal column of *Le Figaro*, under the editorship of its founder Hippol |
| 081 | 081.0384 | [^1] | "They say you are getting married" — a popular French sentimental song. |
| 081 | 081.0395 | [^1] | Italian proverb: "In the country you choose, you find the customs" — approximately "When i |
| 081 | 081.0403 | [^1] | Empress Eugénie (1826-1920), widow of Napoleon III, lived in exile after the fall of the S |
| 081 | 081.0448 | [^1] | In English in the original — a young male servant who rides behind on a carriage. |
| 083 | 083.0026 | [^1] | Marie's bitter nickname for Cassagnac — "the Deceased" — after his marriage, as though he  |
| 084 | 084.0632 | [^bed-1] | In English in the original. |
| 085 | 085.0089 | [^1] | TR: Marie uses the casual antisemitic epithet "ce juif de Julian" — Julian was not in fact |
| 085 | 085.0156 | [^1] | *In English in the original.* |
| 085 | 085.0268 | [^1] | TR: "chelme" — Marie puns on Chelmsford's name and the German *Schelm* (rogue, scoundrel). |
| 086 | 086.0007 | [^huguenots] | Meyerbeer's grand opera (1836) about the St. Bartholomew's Day massacre. |
| 086 | 086.0007 | [^mezzovoce] | *In Italian in the original* — in an undertone, half-voice. |
| 086 | 086.0084 | [^pochade] | A quick oil sketch, typically made outdoors. |
| 086 | 086.0099 | [^iettatore] | *In Italian in the original* — one who casts the evil eye, a bearer of bad luck. |
| 086 | 086.0103 | [^engverse] | *In English in the original* — anonymous love poetry sent to Marie. |
| 086 | 086.0159 | [^break] | *In English in the original* — an open four-wheeled carriage. |
| 087 | 087.0008 | [^skating] | In English in the original. |
| 087 | 087.0013 | [^lunch] | In English in the original. |
| 087 | 087.0210 | [^lat] | Vanity! Desire for glory! (Latin) |
| 087 | 087.0679 | [^1] | In English in the original. |
| 088 | 088.0027 | [^1] | "The October Night" by Alfred de Musset, a Romantic poem Marie was learning to recite. |
| 088 | 088.0035 | [^1] | A reference to Boccaccio's *Decameron* (Day IV, Story 5): Isabetta and the pot of basil. |
| 088 | 088.0076 | [^1] | *Le Petit Caporal* ("The Little Corporal") was a Bonapartist newspaper. |
| 089 | 089.0055 | [^english1] | In English in the original. |
| 089 | 089.0065 | [^rpjulian] | Marie's mock-honorific "Reverend Father" (*Reverend Pere*) for Rodolphe Julian, founder of |
| 089 | 089.0103 | [^english1] | In English in the original. |
| 089 | 089.0126 | [^english1] | In English in the original. |
| 089 | 089.0140 | [^english1] | In English in the original. |
| 090 | 090.0088 | [^1] | The marshal of the nobility (*predvoditel dvoryanstva*) was an elected leader of the local |
| 090 | 090.0105 | [^1] | Jean-Baptiste Greuze (1725-1805), French painter known for sentimental genre scenes featur |
| 090 | 090.0112 | [^1] | The popular Sunday concerts at the Cirque d'Hiver, founded by conductor Jules Pasdeloup. |
| 090 | 090.0122 | [^1] | A *vesicatoire* was a counter-irritant treatment that raised blisters on the skin, believe |
| 090 | 090.0128 | [^1] | Nickname for Prince Napoleon (Jerome Napoleon Bonaparte), the unpopular Bonapartist preten |
| 090 | 090.0150 | [^1] | Pierre-Carl Potain (1825-1901), an eminent Parisian physician. |
| 090 | 090.0156 | [^1] | *Les Chatiments* (1853), Hugo's collection of political poetry attacking Napoleon III. |
| 090 | 090.0175 | [^1] | A play about Charlotte Corday, the young woman who assassinated the revolutionary leader M |
| 090 | 090.0193 | [^1] | A reference to the March 1880 decrees under which religious orders were expelled from Fran |
| 090 | 090.0199 | [^1] | Emile de Girardin (1802-1881), influential journalist and press magnate. |
| 090 | 090.0200 | [^1] | Armand de Baudry d'Asson, a Catholic royalist deputy who physically resisted the expulsion |
| 090 | 090.0241 | [^1] | Hubertine Auclert (1848-1914), leading French suffragist and feminist activist. |
| 090 | 090.0278 | [^1] | Emile de Girardin (1802-1881), influential French journalist and politician, founder of *L |
| 090 | 090.0282 | [^1] | Juliette Adam (1836-1936), prominent French writer, salon hostess, and founder of the lite |
| 090 | 090.0282 | [^2] | Marie Laetitia Bonaparte-Wyse (1831-1902), known as the Princesse Rattazzi after her secon |
| 090 | 090.0357 | [^1] | Latin: medical consultation, a meeting of doctors to discuss a case. |
| 090 | 090.0390 | [^1] | Theodore Deck (1823-1891), famous French ceramicist known for his artistic earthenware. |
| 091 | 091.0014 | [^2] | "Documents": Marie uses Zola's naturalist vocabulary — treating family portraits as scient |
| 091 | 091.0023 | [^4] | *Mademoiselle de Maupin* (1835): novel by Théophile Gautier (1811–1872). The hero d'Albert |
| 091 | 091.0030 | [^6] | Héloïse (c. 1090–1164): medieval scholar and abbess, famous for her correspondence with Ab |
| 091 | 091.0035 | [^1] | From Rousseau's *Julie, ou la Nouvelle Héloïse* (1761), Part I, Letter 14. The passage art |
| 091 | 091.0040 | [^1] | Émile de Girardin (1802–1881): the founding father of the modern French popular press, cre |
| 091 | 091.0048 | [^1] | Les Mirlitons: a Paris gallery or exhibition space frequented by artists and collectors in |
| 091 | 091.0055 | [^3] | René de Saint-Marceaux (1845–1915): French sculptor known for lyrical figure work in marbl |
| 091 | 091.0059 | [^1] | "Popaul": Marie's mocking nickname for Paul de Cassagnac (from "Paul" — the diminutive "Po |
| 091 | 091.0077 | [^2] | Julian awarded the Légion d'honneur: Rodolphe Julian (1839–1907), founder of the Académie  |
| 091 | 091.0080 | [^3] | The red ribbon of the Légion d'honneur, worn as a boutonnière. |
| 091 | 091.0089 | [^1] | Louise Michel (1830–1905): French anarchist and feminist revolutionary, "the Red Virgin of |
| 091 | 091.0096 | [^3] | *Galbeuse*: Marie's invented or half-heard word from *galbe* (curve, contour); used admiri |
| 091 | 091.0100 | [^2] | Hubertine Auclert (1848–1914): radical French suffragist, founder of *La Citoyenne* (1881) |
| 091 | 091.0141 | [^1] | The Race of the Barbieri (Riderless Horse Race) and the Corso: the *Corsa dei Barberi* was |
| 091 | 091.0144 | [^1] | Pauline Orell: apparently a stage character or costume type. The precise reference has not |
| 091 | 091.0147 | [^3] | "As Zola": Marie identifies with Zola's naturalist practice of visiting low-life environme |
| 091 | 091.0165 | [^2] | Victor Hugo's seventy-ninth birthday: 26 February 1881 was indeed Hugo's birthday (born 26 |
| 091 | 091.0211 | [^1] | Adelina Patti (1843–1919): the most celebrated soprano of the age. Her Paris seasons at th |
| 091 | 091.0254 | [^1] | The men's studio at Atelier Julian was on the ground floor, while the women's section was  |
| 091 | 091.0254 | [^2] | Louise Catherine Breslau (1856–1927): Swiss-born painter, fellow student at Atelier Julian |
| 091 | 091.0257 | [^1] | Tsar Alexander II (1818–1881) was assassinated on 1 March 1881 (13 March in the Western ca |
| 091 | 091.0257 | [^2] | Henri Rochefort (1831–1913): radical republican journalist and polemicist, founder of *La  |
| 091 | 091.0261 | [^4] | The Emancipation Reform of 1861, by which Alexander II freed the Russian serfs, was his pr |
| 091 | 091.0287 | [^1] | The "Carnet d'un mondain" was a popular society gossip column in *Le Figaro* published und |
| 091 | 091.0290 | [^1] | Marie, the house servant — not Marie Bashkirtseff herself. |
| 091 | 091.0291 | [^2] | The Palais de l'Industrie on the Champs-Élysées was where the annual Salon was held until  |
| 091 | 091.0321 | [^3] | The Duc de Nemours (1814–1896) was the son of King Louis-Philippe and a prominent Orléanis |
| 091 | 091.0329 | [^6] | Marie Van Zandt (1858–1919): American coloratura soprano who had a great success in Paris  |
| 091 | 091.0349 | [^2] | The Queen: Queen Isabella II of Spain (1830–1904), who had been living in exile in Paris s |
| 091 | 091.0363 | [^1] | Édouard Détaille (1848–1912): celebrated French military painter, extremely popular in thi |
| 091 | 091.0372 | [^2] | Catalogue number two: with a surname beginning "A" (Andrey), Marie would be near the front |
| 091 | 091.0383 | [^1] | The Bolero from *Les Vêpres Siciliennes* (Verdi, 1855): the soprano aria "Mercè, dilette a |
| 091 | 091.0391 | [^2] | M. Bashkirtseff: Marie's father, from whom the family had been estranged. His appearance i |
| 091 | 091.0395 | [^1] | Robert Mitchell (1818–1883): French journalist and politician, editor of various republica |
| 091 | 091.0396 | [^2] | Émile de Girardin (1802–1881): the pioneering journalist who had transformed the French pr |
| 091 | 091.0398 | [^3] | Boulevard Malesherbes 151 was Cassagnac's Paris address — Marie regularly checks whether s |
| 091 | 091.0418 | [^1] | The Chambre des Députés: the lower house of the French parliament, then housed in the Pala |
| 091 | 091.0418 | [^2] | *Semiramide* (1823): grand opera by Rossini, based on Voltaire's play. An extremely demand |
| 091 | 091.0425 | [^2] | Louis Andrieux (1840–1931): radical politician and prefect of police (1879–1881), later re |
| 091 | 091.0425 | [^3] | The Théâtre des Variétés on the Boulevard Montmartre: one of Paris's most popular boulevar |
| 091 | 091.0433 | [^4] | The Grand Prix de Paris: the prestigious June horse race at Longchamp, one of the great so |
| 091 | 091.0445 | [^3] | Waléry: the fashionable Paris photographer Stanisław Julian Ostrowoski, known as Waléry (1 |
| 091 | 091.0450 | [^1] | The Pré Catalan: a fashionable café-restaurant in the Bois de Boulogne, popular with the s |
| 091 | 091.0465 | [^1] | Juliette Adam (née Lamber, 1836–1936): writer and prominent political hostess, founder of  |
| 091 | 091.0466 | [^2] | Prince Nikolai Orloff (1827–1885): Russian ambassador to France 1871–1882, a great figure  |
| 091 | 091.0471 | [^2] | Vyatka (also spelled Vatka or Viatka): a city in the Ural region, commonly used as a place |
| 091 | 091.0485 | [^1] | Batiste: a very fine, lightweight woven fabric — cotton, linen, or silk — used for elegant |
| 091 | 091.0496 | [^2] | No. 37: Marie's private studio at 37 rue something (the exact address is not specified), w |
| 091 | 091.0501 | [^1] | Émile de Girardin died on 27 April 1881. He was 79, and his death was a major event in Par |
| 091 | 091.0503 | [^2] | Donkey's milk (*lait d'ânesse*): a traditional remedy for pulmonary and chest ailments, pr |
| 091 | 091.0507 | [^2] | Ernest Nicolini (1834–1898): French tenor, Adelina Patti's lover and later husband (they m |
| 091 | 091.0513 | [^4] | *La Citoyenne*: the feminist newspaper founded by Hubertine Auclert in 1881. Marie had inv |
| 091 | 091.0515 | [^7] | Carolus-Duran (1837–1917): fashionable French portrait painter, celebrated for his fluent  |
| 091 | 091.0516 | [^8] | Léon Bonnat (1833–1922): one of the most celebrated French academic portrait painters of t |
| 091 | 091.0519 | [^1] | *Le Monde où l'on s'ennuie* (The World where One is Bored, 1881): a hugely successful sati |
| 091 | 091.0526 | [^1] | Marie uses an antisemitic epithet here in a characteristically contradictory way — the "Je |
| 091 | 091.0532 | [^1] | Jules Joseph Lefèbvre (1836–1911): distinguished French academic painter and professor at  |
| 091 | 091.0543 | [^1] | Bad Ems: a German spa town on the Rhine, famous for its mineral springs used to treat resp |
| 091 | 091.0549 | [^3] | Léon Gambetta (1838–1882): the great republican statesman and former Prime Minister. By 18 |
| 091 | 091.0559 | [^2] | "The five women": Marie is apparently referring to a story she knows about five women who  |
| 091 | 091.0560 | [^3] | "Popaul": an affectionate/ironic nickname for Paul de Cassagnac, used by those in his circ |
| 091 | 091.0585 | [^1] | Léon Gambetta (1838–1882): the dominant figure of the Third Republic, at this time recentl |
| 091 | 091.0585 | [^2] | "On dit que l'on te marie": a popular French song — "They say you are going to be married" |
| 091 | 091.0584 | [^3] | "Balandard": a period colloquial term for a solid, wealthy bourgeois without title — a com |
| 091 | 091.0592 | [^1] | Louise Breslau (1856–1927): Swiss-German painter, a fellow student at the Atelier Julian w |
| 092 | 092.0003 | [^2] | Chairon: an eminent Paris physician consulted by Marie for her worsening pulmonary and ear |
| 092 | 092.0004 | [^3] | Allevard: a spa town in the Isère, in the French Alps, known for its sulphurous waters rec |
| 092 | 092.0019 | [^1] | *Le Sport*: a fashionable Parisian society gazette covering equestrian, sporting, and soci |
| 092 | 092.0020 | [^2] | Astrakhan: curly lambskin fur from the Astrakhan region of Russia, fashionable for trimmin |
| 092 | 092.0023 | [^3] | "P. Orell": Marie's pseudonym for her Salon criticism published in *La Citoyenne*, Huberti |
| 092 | 092.0024 | [^1] | Victor Maurel (1848–1923): celebrated French baritone, one of the great operatic voices of |
| 092 | 092.0034 | [^2] | Karlsbad (now Karlovy Vary, Czech Republic): one of the most fashionable European spa dest |
| 092 | 092.0034 | [^3] | *Le Voltaire*: a republican, anticlerical Paris daily that covered society events and the  |
| 092 | 092.0036 | [^4] | Beaumetz: likely Charles-Aimé Beaumetz (1845–1888), a French painter and politician, later |
| 092 | 092.0042 | [^1] | Jules Bastien-Lepage (1848–1884): the leading naturalist painter of his generation, whose  |
| 092 | 092.0061 | [^1] | "Bois de Berlin": the Tiergarten, Berlin's central park and fashionable promenade, equival |
| 092 | 092.0062 | [^2] | The Godard balloon festival: Eugène Godard (1827–1890) was France's most celebrated aerona |
| 092 | 092.0065 | [^3] | The 1881 pogroms: following the assassination of Tsar Alexander II in March 1881, waves of |
| 092 | 092.0069 | [^1] | Poltava: the principal city of the Poltava region in central Ukraine, some 300 kilometres  |
| 092 | 092.0072 | [^2] | The reference to Jews here reflects the context of the 1881 pogroms in which Jewish commun |
| 092 | 092.0085 | [^1] | "The peasants — monsters!": Marie's exclamation of frustration that she cannot find the ca |
| 092 | 092.0103 | [^1] | Prince Sviatopolk-Mirsky: a senior imperial administrator responsible for the governance o |
| 092 | 092.0106 | [^1] | The entries carry dual dating: 14 June in the Gregorian calendar (used in France) correspo |
| 092 | 092.0130 | [^1] | The Orthodox priest who baptised Marie Bashkirtseff — apparently a local figure whose subs |
| 092 | 092.0155 | [^1] | Adelina Patti (1843–1919): the greatest soprano of her generation, who gave celebrated con |
| 092 | 092.0165 | [^1] | *Les eaux* — the waters: mineral spa treatments, a standard prescription for respiratory a |
| 092 | 092.0186 | [^2] | Roubles: Russian currency, indicating that the Bashkirtseff family maintained financial as |
| 092 | 092.0187 | [^3] | Jesuitical half-sentences: Marie uses "Jesuit" as an epithet for cunning, equivocating spe |
| 092 | 092.0188 | [^4] | "*The impudence I!*" — In English in the original. Marie uses this emphatic English exclam |
| 092 | 092.0200 | [^1] | The Frenchwoman: a euphemism for M. Bashkirtseff's French mistress, to whom he has apparen |
| 092 | 092.0201 | [^2] | Arpents: an old French land measure, roughly equivalent to an acre. A hundred arpents was  |
| 092 | 092.0205 | [^1] | Colourman: a merchant specialising in artists' paints and materials — a significant expens |
| 092 | 092.0211 | [^4] | Louise Breslau (1856–1927): Swiss-born painter and fellow student at the Julian Academy in |
| 092 | 092.0218 | [^5] | Three candles burning simultaneously: a Russian superstition foretelling death. Marie has  |
| 092 | 092.0225 | [^1] | Kremontchougy (Kremenchuk): an industrial town on the Dnieper river in central Ukraine, ab |
| 092 | 092.0263 | [^1] | Karkoff: Kharkov (modern Kharkiv), a major city in eastern Ukraine, a transit point on the |
| 092 | 092.0284 | [^1] | Balzac's detective exploits: a reference to Balzac's crime narratives, particularly those  |
| 092 | 092.0286 | [^2] | *Starovoi* (*stanovoi pristav*): a Russian term for a local district police supervisor, ro |
| 092 | 092.0289 | [^3] | *Ave!* — the Latin salutation (*Ave Caesar!*), used here in mock-heroic admiration of Alex |
| 092 | 092.0290 | [^4] | The Great Comet of 1881 (*Comet Tebbutt*) was visible in the northern hemisphere from June |
| 092 | 092.0309 | [^2] | Lavra: the Kyiv-Pechersk Lavra (Monastery of the Caves), one of the holiest sites in Easte |
| 092 | 092.0310 | [^3] | Iconostasis: the gilded screen bearing icons that separates the nave from the sanctuary in |
| 092 | 092.0318 | [^4] | Saint Barbara: a 3rd-century Christian martyr; her relics are venerated at the Saint Barba |
| 092 | 092.0328 | [^3] | Pré Catelan: an elegant restaurant and gardens in the Bois de Boulogne, Paris — the quinte |
| 092 | 092.0328 | [^4] | Count Paskevitch d'Erivan: a member of the family of Field Marshal Ivan Paskevitch (1782–1 |
| 092 | 092.0336 | [^1] | Tony: Tony Robert-Fleury (1837–1912), one of the principal teachers at the Académie Julian |
| 092 | 092.0340 | [^2] | The three Graces: Marie's social circle in Nice in her mid-teens, a group she recurrently  |
| 092 | 092.0344 | [^1] | *Père Rodolphe*: a familiar nickname for Rodolphe Julian (1839–1907), founder of the Acadé |
| 092 | 092.0345 | [^2] | Ricard: almost certainly Dr. Philippe Ricord (1800–1889), a famous Parisian specialist in  |
| 092 | 092.0350 | [^1] | Saint Agathe: a recurring figure in the diaries — apparently a nickname or alias for an ad |
| 092 | 092.0354 | [^1] | Klumpke: Anna Klumpke (1856–1942), an American-born painter who studied at the Académie Ju |
| 092 | 092.0355 | [^2] | Plon-Plon: the popular nickname of Prince Napoléon-Jérôme Bonaparte (1822–1891), cousin of |
| 092 | 092.0355 | [^3] | *This strange Napoleon*: Marie's characteristic ambivalence — she has followed Plon-Plon's |
| 092 | 092.0356 | [^4] | Election poster: the legislative elections of August–September 1881 (the third elections o |
| 092 | 092.0368 | [^2] | Mounet-Sully (1841–1916): Jean-Sully Mounet, one of the foremost tragic actors of the age  |
| 092 | 092.0368 | [^3] | Amanda: from the Latin *amanda*, meaning "she who is to be loved" or "lovable." Marie's ji |
| 092 | 092.0376 | [^2] | Dr. Maurice Krishaber (1836–1883): a prominent Viennese-born Parisian specialist in ear, n |
| 092 | 092.0383 | [^1] | Election fever: the French legislative elections of August–September 1881 (the third elect |
| 092 | 092.0394 | [^3] | Georges: Marie's brother Georges, whose alcoholism was a constant source of family distres |
| 092 | 092.0426 | [^3] | The women's demonstration on the 14th: 14 July 1881 (Bastille Day). Auclert's group organi |
| 092 | 092.0426 | [^4] | *La Citoyenne*: the feminist newspaper founded by Hubertine Auclert in 1881, demanding ful |
| 092 | 092.0426 | [^5] | *L'Évènement*: a mainstream Republican newspaper of the period. The pun "l'Ève-nement" ("t |
| 092 | 092.0432 | [^8] | The new school: a loose reference to the Naturalist and Impressionist-adjacent circle of y |
| 093 | 093.0019 | [^1] | *Mise en scène*: theatrical staging and self-presentation; here Marie uses the term to mea |
| 093 | 093.0024 | [^2] | *Crédit foncier de France*: the French land mortgage bank, founded 1852, which financed pr |
| 093 | 093.0045 | [^1] | *La Confession d'un enfant du siècle* (1836): Alfred de Musset's autobiographical novel ab |
| 093 | 093.0052 | [^1] | *La Dame aux camélias* (1852): play by Alexandre Dumas fils, one of Sarah Bernhardt's most |
| 093 | 093.0054 | [^1] | Villa Eugénie: the Basque summer residence of Empress Eugénie, wife of Napoleon III, who m |
| 093 | 093.0060 | [^1] | Tsar Alexander II was assassinated on 1 March 1881; Russian society was expected to observ |
| 093 | 093.0062 | [^1] | Coquelin Cadet: Ernest Coquelin (1848–1909), celebrated comic actor of the Comédie-Françai |
| 093 | 093.0070 | [^1] | Fontarabía: Fuenterrabía (now Hondarribia), a Spanish town on the border with France at th |
| 093 | 093.0071 | [^2] | Doucet: the House of Doucet, one of the great Paris couturiers of the late 19th century. |
| 093 | 093.0076 | [^1] | The Cartuja de Miraflores: a Carthusian monastery near Burgos, noted for its Gothic altarp |
| 093 | 093.0079 | [^1] | Goya's *La maja desnuda* (c. 1797–1800), held at the Prado; tradition long associated the  |
| 093 | 093.0080 | [^2] | Yom Kippur: the Jewish Day of Atonement, the holiest day of the Jewish calendar, observed  |
| 093 | 093.0080 | [^3] | Carolus-Duran: Charles Auguste Emile Durand (1837–1917), celebrated French portrait painte |
| 093 | 093.0080 | [^4] | Velázquez's *The Rokeby Venus* (*La venus del espejo*, c. 1647–51), then still in Spain; t |
| 093 | 093.0080 | [^5] | *Les papillons* (butterflies): Marie's term for visual disturbances — floaters or scintill |
| 093 | 093.0081 | [^6] | *La Época*: a conservative Madrid daily newspaper, one of the leading Spanish papers of th |
| 093 | 093.0084 | [^1] | Bojidar: Bojidar Karageorgevitch, a Serbian prince and family friend who habitually served |
| 093 | 093.0086 | [^1] | Madrazo: Federico de Madrazo y Ochoa (1815–1894) was director of the Prado at this time; h |
| 093 | 093.0087 | [^3] | *Las Hilanderas* (*The Spinners*), by Velázquez (c. 1657), in the Prado. |
| 093 | 093.0089 | [^2] | Pandolini: Agostino Pandolini (1836–1916), Italian baritone, prominent at the Opéra-Comiqu |
| 093 | 093.0096 | [^1] | St Lawrence was martyred by being roasted on a gridiron; the Escorial's floor plan, with i |
| 093 | 093.0096 | [^2] | Mercedes of Orléans (1860–1878), Alfonso XII's first wife; she died at eighteen, seven mon |
| 093 | 093.0097 | [^3] | The Casita del Príncipe (Prince's Little House), built 1772–1793, a small royal retreat in |
| 093 | 093.0102 | [^1] | The Duke of Montpensier, Antoine d'Orléans, married the Spanish Infanta Luisa Fernanda in  |
| 093 | 093.0106 | [^1] | *Lèse-arts*: Marie's coinage, modeled on *lèse-majesté* (high treason). The parenthetical  |
| 093 | 093.0108 | [^1] | Julian: the Académie Julian, the private art school on the Rue du Dragon in Paris where Ma |
| 093 | 093.0108 | [^2] | The Real Fábrica de Tabacos in Seville, one of the largest buildings in Spain; it employed |
| 093 | 093.0111 | [^1] | *Paul and Virginia*: the celebrated 1788 novel by Bernardin de Saint-Pierre; a romance of  |
| 093 | 093.0112 | [^2] | Breslau's Honorable Mention: Louise Breslau (1856–1927), Swiss-born painter, a fellow stud |
| 093 | 093.0112 | [^3] | Théophile Gautier (1811–1872), French poet, novelist, and art critic, celebrated for his e |
| 093 | 093.0114 | [^1] | Generalife (Arabic: *Jannat al-'Arif*, "Garden of the Architect"): the summer palace and g |
| 093 | 093.0118 | [^1] | *François Ier avec le Titien*: the celebrated anecdote that Francis I (or Charles V, in ot |
| 093 | 093.0119 | [^1] | The Alhambra: the great Nasrid palace-fortress complex in Granada, built in the 13th–14th  |
| 093 | 093.0119 | [^3] | Boabdil: Muhammad XII (c. 1459–c. 1533), last Nasrid sultan of Granada, who surrendered th |
| 093 | 093.0121 | [^1] | "The eyes flee in all directions": Marie translates a Russian idiom (*glaza razbezhalis'*) |
| 093 | 093.0123 | [^1] | Tony: Tony Robert-Fleury (1837–1912), Marie's principal painting teacher at the Académie J |
| 093 | 093.0123 | [^2] | Amélie: her 1880 Salon entry, a portrait of her aunt. |
| 093 | 093.0128 | [^1] | The Chamber of Deputies: the lower house of the French parliament, housed in the Palais-Bo |
| 093 | 093.0128 | [^2] | Violets carried a well-known symbolism of hidden love in the period's flower language; Mar |
| 093 | 093.0130 | [^1] | Pneumatic postal system: Paris's underground network of compressed-air tubes carried lette |
| 093 | 093.0130 | [^2] | Henri Brisson (1835–1912), President of the Chamber of Deputies 1881–1885, later twice Pri |
| 093 | 093.0134 | [^1] | Léon Gambetta (1838–1882) became President of the Council (Prime Minister) on 14 November  |
| 093 | 093.0134 | [^2] | The Legion of Honor (*la Légion d'honneur*), France's highest civil and military decoratio |
| 093 | 093.0135 | [^3] | Joseph-Nicolas Robert-Fleury (1797–1890), father of Tony Robert-Fleury, was a distinguishe |
| 093 | 093.0137 | [^1] | General Jean-Baptiste Campenon (1819–1891), War Minister in Gambetta's cabinet from Novemb |
| 093 | 093.0137 | [^2] | The Ring of Polycrates: in Greek legend, the tyrant Polycrates of Samos was so fortunate i |
| 093 | 093.0138 | [^1] | Henri-Anatole Carrier-Belleuse (1851–1913), painter. His father, Albert-Ernest Carrier-Bel |
| 093 | 093.0138 | [^2] | Pierre-Carl Potain (1825–1901), eminent French physician and specialist in cardiac and pul |
| 093 | 093.0140 | [^1] | Louise Breslau (1856–1927), Swiss-German painter, Marie's most formidable rival at the Aca |
| 093 | 093.0140 | [^2] | Jean-Martin Charcot (1825–1893), professor at the Salpêtrière hospital and the most celebr |
| 094 | 094.0104 | [^1] | In English in the original. |
| 095 | 095.0020 | [^1] | Queen Isabel II of Spain, in exile at the Palais de Castille on the Avenue Kléber, kept a  |
| 095 | 095.0029 | [^1] | Jules Joseph Lefebvre (1836-1911), professor at the Académie Julian, celebrated for his gr |
| 095 | 095.0031 | [^1] | A competition to determine the placement of paintings at the Salon. |
| 095 | 095.0037 | [^1] | The Chiaia, a fashionable seafront promenade in Naples. |
| 095 | 095.0037 | [^3] | *Étincelle* ("Spark"), a society gossip columnist. |
| 095 | 095.0041 | [^1] | Gavini, the Corsican father of Adeline Gavini. |
| 095 | 095.0124 | [^1] | President Jules Grévy (1807-1891) was known for keeping long, hospitable lunches. |
| 095 | 095.0127 | [^1] | Alfred Grévin (1827-1892), celebrated caricaturist and designer of theatrical costumes. |
| 095 | 095.0128 | [^1] | Presumably Mlle Théo, a celebrated actress of the era. |
| 095 | 095.0133 | [^1] | The Grand Prix de Paris, the prestigious annual horse race at Longchamp. |
| 095 | 095.0134 | [^1] | Alexandre Cabanel (1823-1889), the celebrated academic painter famous for *The Birth of Ve |
| 095 | 095.0138 | [^1] | Pierre Savorgnan de Brazza (1852-1905), the explorer who opened up the Congo for France. |
| 095 | 095.0140 | [^1] | Gustave Nadaud (1820-1893), prolific songwriter and chansonnier. |
| 095 | 095.0140 | [^2] | Victor Maurel (1848-1923), celebrated baritone, later the creator of Iago and Falstaff in  |
| 095 | 095.0140 | [^3] | The Murcia floods of 1879 provoked a major charity campaign in Paris. |
| 095 | 095.0149 | [^1] | The Musée Grévin, Paris's celebrated wax museum, had opened in 1882. |
| 095 | 095.0158 | [^1] | Louise Abbema (1853-1927), painter and intimate friend of Sarah Bernhardt. |
| 095 | 095.0172 | [^1] | Marie writes "guitaire" — her characteristic spelling variant for *guitare*. |
| 095 | 095.0183 | [^1] | Théophile Gautier (1811-1872), *Voyage en Espagne* (1843), the celebrated Romantic travel  |
| 095 | 095.0194 | [^1] | The *premier étage*, the principal floor above the ground floor, equivalent to the first f |
| 095 | 095.0199 | [^1] | Pierre Savorgnan de Brazza (1852-1905), the Italian-French explorer who had just returned  |
| 095 | 095.0204 | [^1] | The *premier étage*, the principal reception floor above the ground floor. |
| 095 | 095.0215 | [^1] | Marie's own spelling: "insannités" for "insanités." |
| 095 | 095.0220 | [^1] | Henri Gervex (1852-1929), fashionable Parisian painter, known for his society portraits an |
| 095 | 095.0226 | [^1] | The annual Foire de Neuilly, the popular fair held in the Neuilly suburb of Paris. |
| 095 | 095.0232 | [^1] | Paul Baudry (1828-1886), celebrated academic painter best known for the ceiling decoration |
| 095 | 095.0233 | [^1] | René de Saint-Marceaux (1845-1915), celebrated French sculptor. |
| 095 | 095.0234 | [^1] | Bidel's celebrated menagerie and circus, a popular fairground attraction. |
| 095 | 095.0252 | [^1] | The Batignolles quarter of northern Paris had a significant Jewish population; Marie's rem |
| 095 | 095.0270 | [^1] | The 14th of July, Bastille Day, celebrated since 1880 as France's national holiday. |
| 095 | 095.0345 | [^1] | The Prix de Rome, the prestigious annual competition of the École des Beaux-Arts, whose re |
| 095 | 095.0345 | [^2] | Laferrière, one of the leading Paris couture houses. |
| 096 | 096.0057 | [^1] | Marie writes "the twelve tables" — confusing Moses' tablets of the Law with the Roman Twel |
| 096 | 096.0125 | [^1] | Latin: "Suffer the little children to come unto me" (Mark 10:14). |
| 096 | 096.0207 | [^1] | In English in the original. |
| 096 | 096.0406 | [^1] | In English in the original. |
| 096 | 096.0411 | [^2] | *Starovoï*: the village elder or headman. |
| 096 | 096.0439 | [^3] | In English in the original (spelling as Marie wrote it). |
| 097 | 097.0006 | [^1] | Dikanka: the famous estate of the Kotchoubey family in the Poltava region, renowned in Rus |
| 097 | 097.0022 | [^1] | Albert Wolff (1835–1891): the powerful art critic of *Le Figaro*, one of the supreme judge |
| 097 | 097.0037 | [^2] | Kharkov (Kharkiv): the major city of northeastern Ukraine, considerably larger and more co |
| 097 | 097.0058 | [^1] | The institute: the Imperial Institute for Young Ladies (*Institut blagorodnykh devits*), t |
| 097 | 097.0069 | [^2] | The "two liars of Marseille": a reference to a well-known French comic anecdote about the  |
| 097 | 097.0070 | [^3] | Doenhoff: a Prussian nobleman in royal service, evidently acquainted with the Bashkirtseff |
| 097 | 097.0081 | [^2] | "L'espoir en Dieu" (1838): a major philosophical poem by Alfred de Musset (1810–1857), gra |
| 097 | 097.0094 | [^1] | The "great Bonapartist": Paul de Cassagnac (1842–1904), the prominent Bonapartist journali |
| 097 | 097.0102 | [^1] | Saint-Amand: a friend and social acquaintance of the Bashkirtseff family, evidently a figu |
| 097 | 097.0102 | [^2] | The Hôtel Rambouillet: the famous 17th-century Parisian salon of the Marquise de Rambouill |
| 097 | 097.0106 | [^1] | The architect: Emile Bastien, brother of painter Jules Bastien-Lepage, who worked as an ar |
| 097 | 097.0116 | [^2] | Mme Cartwright: an English or Anglo-American woman in Parisian artistic circles, friend of |
| 097 | 097.0118 | [^3] | A bacchante: in classical mythology, a female devotee of Bacchus, associated with wild bea |
| 097 | 097.0122 | [^1] | *Le Roi s'amuse* (1832): Victor Hugo's verse drama, suppressed by the government after its |
| 097 | 097.0130 | [^5] | Bastien-Lepage: Jules Bastien-Lepage (1848–1884), the leading French naturalist painter of |
| 097 | 097.0135 | [^1] | Got: Edmond Got (1822–1901), doyen of the Comédie-Française for fifty years, celebrated fo |
| 097 | 097.0135 | [^2] | Coquelin: Benoît-Constant Coquelin (1841–1909), known as Coquelin aîné, generally consider |
| 097 | 097.0135 | [^3] | Saint-Vallier: in Hugo's play, the Comte de Saint-Vallier, whose daughter Blanche has been |
| 097 | 097.0139 | [^5] | *Les Mères ennemies* (Enemy Mothers): a play by Catulle Mendès, staged at the Odéon in 188 |
| 097 | 097.0148 | [^1] | The works Marie lists: the Salon picture (*La réunion au jardin*, 1881); the open-air woma |
| 097 | 097.0156 | [^1] | The Princess: Princess Cantacuzène, a frequent presence in the Bashkirtseff social circle, |
| 097 | 097.0160 | [^2] | Filippini: a fellow student at the Académie Julian whose name appears occasionally in the  |
| 097 | 097.0164 | [^1] | The Académie Julian had several premises. The original studio in the passage des Panoramas |
| 097 | 097.0178 | [^1] | *Le Roman chez la postière*: a popular novel (1876) by Hector Malot, satirising provincial |
| 097 | 097.0190 | [^2] | The Hôtel Drouot: the principal public auction house of Paris, founded in 1852 on the rue  |
| 097 | 097.0207 | [^1] | Père Charles: a familiar nickname for one of the professional models who posed regularly a |
| 097 | 097.0212 | [^1] | Émile Bastien: brother of Jules Bastien-Lepage, who worked as an architect in Paris. He is |
| 097 | 097.0212 | [^2] | The "real brother": Marie uses this to distinguish Jules Bastien-Lepage, the celebrated pa |
| 097 | 097.0217 | [^1] | Soutzo: a Greek-Romanian aristocratic family with branches in both Constantinople and Pari |
| 097 | 097.0219 | [^1] | René de Saint-Marceaux (1845–1915): one of the most celebrated French sculptors of his gen |
| 097 | 097.0229 | [^2] | The Marquise d'Espard, Lucien de Rubempré and Eugène de Rastignac: three of Balzac's most  |
| 097 | 097.0232 | [^1] | The "real Bastien": Jules Bastien-Lepage (1848–1884), distinguished from his brother Émile |
| 097 | 097.0233 | [^2] | Jules Breton (1827–1906): celebrated painter of idealized peasant scenes in a lyrical, poe |
| 097 | 097.0235 | [^3] | *Pas de chance* (also known as *Pas méché*): Bastien-Lepage's large painting of a London s |
| 097 | 097.0257 | [^2] | The Grande Jatte: the island in the Seine at Neuilly, famous as a site for plein-air paint |
| 097 | 097.0260 | [^1] | The rue de Sèze exhibition: the annual winter exhibition of the Cercle des arts libéraux,  |
| 097 | 097.0262 | [^1] | The Rothschilds' front box (*avant-scène des Rothschild*): the Rothschild family maintaine |
| 097 | 097.0262 | [^2] | Edelfelt: Albert Edelfelt (1854–1905), Finnish painter and one of the most celebrated nort |
| 097 | 097.0262 | [^3] | Carolus: Carolus-Duran (1837–1917), celebrated French portrait painter and teacher (his mo |
| 097 | 097.0277 | [^1] | Vaillant: the most celebrated florist in Paris at the time, known for spectacular arrangem |
| 097 | 097.0278 | [^2] | Orleanist: in French political and aesthetic vocabulary, *orléaniste* meant belonging to t |
| 097 | 097.0291 | [^1] | Consumptive (*poitrinaire*): the 19th-century term for tuberculosis of the lungs. The actu |
| 097 | 097.0291 | [^2] | The holy catacombs at Kiev: the famous Kiev Pechersk Lavra (Monastery of the Caves), one o |
| 097 | 097.0291 | [^3] | Comtesse de Toulouse-Lautrec: Marie's family had a collateral connection with the Toulouse |
| 097 | 097.0294 | [^4] | Potain: Dr. Pierre-Carl Potain (1825–1901), one of the most eminent Parisian physicians of |
| 097 | 097.0295 | [^5] | The Holy Women (*les Saintes femmes*): a large religious painting Marie had in mind — the  |
| 097 | 097.0307 | [^6] | Frank: the hero of Musset's dramatic poem *La Coupe et les Lèvres* (1832). Frank's passion |
| 097 | 097.0315 | [^1] | Jean-Charles Cazin (1841–1901): French painter, associated with poetic naturalism — atmosp |
| 097 | 097.0321 | [^1] | Léon Gambetta (1838–1882): the most celebrated French Republican statesman of the Third Re |
| 097 | 097.0323 | [^2] | His ministry: Gambetta formed his "Grand Ministry" in November 1881, with great hopes — bu |
| 097 | 097.0328 | [^3] | Chopin's Funeral March: the third movement of Chopin's Piano Sonata No. 2 in B-flat minor, |
| 097 | 097.0332 | [^4] | Étincelle: the pen-name of Comtesse de Martel, Marie-Mathilde ("Gyp"), one of the leading  |
| 097 | 097.0335 | [^2] | Clemenceau the doctor: Georges Clemenceau (1841–1929) held a degree in medicine before ent |
| 097 | 097.0341 | [^1] | Ville d'Avray: the suburb west of Paris where Gambetta had been staying at the villa of Lé |
| 097 | 097.0342 | [^2] | Prince Pierre Bonaparte (1815–1881): a nephew of Napoleon I, notorious for having shot and |
| 097 | 097.0342 | [^3] | Mlle Blanc, of Monaco: Marie Blanc (1854–1881), daughter of François Blanc the gambling ma |
| 097 | 097.0342 | [^4] | The Marquis de Casa-Riera: a Spanish-French aristocrat of very great wealth. Marie's notat |
| 097 | 097.0344 | [^1] | Pelletan: Camille Pelletan (1846–1915), Radical Republican journalist and politician, co-d |
| 097 | 097.0344 | [^2] | Claude Vignon to Camille Maupin: in Balzac's *Béatrix* (1839), the cold, analytical art cr |
| 097 | 097.0345 | [^3] | Spuller: Eugène Spuller (1835–1896), Gambetta's closest personal and political associate f |
| 097 | 097.0345 | [^4] | Brisson: Henri Brisson (1835–1912), president of the Chamber of Deputies, a moderate Repub |
| 097 | 097.0352 | [^1] | Hecht: probably Albert Hecht, a Republican sympathiser of modest literary connections. He  |
| 097 | 097.0355 | [^1] | 240 rue de Rivoli: an excellent address directly facing the Tuileries Garden, with a direc |
| 097 | 097.0357 | [^2] | The Bastien-Lepage brothers designed the funeral hearse: Jules Bastien-Lepage had been com |
| 097 | 097.0360 | [^4] | Brass band (*orphéon*): a civic wind band, typically composed of amateur players from work |
| 097 | 097.0361 | [^5] | Belleville: the working-class district of north-eastern Paris, Gambetta's own political co |
| 097 | 097.0380 | [^2] | Mirabeau: Honoré Gabriel Riqueti, Comte de Mirabeau (1749–1791), the great orator and lead |
| 097 | 097.0382 | [^3] | Skobelev: General Mikhail Skobelev (1843–1882), the Russian military hero of the Russo-Tur |
| 097 | 097.0382 | [^4] | Chanzy: General Alfred Chanzy (1823–1883), one of the most respected French commanders of  |
| 097 | 097.0388 | [^5] | Floquet: Charles Floquet (1828–1896), Radical Republican politician, known for his theatri |
| 097 | 097.0388 | [^6] | Grévy: Jules Grévy (1807–1891), President of the French Republic — a cautious, conservativ |
| 097 | 097.0388 | [^7] | Rochefort: Henri Rochefort (1831–1913), the most famous polemical journalist of the Third  |
| 097 | 097.0389 | [^8] | ==arrived==: *In English in the original.* Marie uses the English word *arrived* to mean s |
| 097 | 097.0395 | [^1] | Père Lachaise: the famous Paris cemetery in the 20th arrondissement, where Gambetta was bu |
| 097 | 097.0405 | [^3] | Four thousand francs: the sum she sent Tony as payment for the portrait (noted in the 24 D |
| 097 | 097.0408 | [^2] | Coquelin cadet: Ernest Coquelin (1848–1909), younger brother of the celebrated actor Coque |
| 097 | 097.0410 | [^3] | The Little Prince: the Prince Imperial, Napoléon Eugène Louis Bonaparte (1856–1879), only  |
| 098 | 098.0064 | [^fn1] | Paul Barras (1755–1829), corrupt and extravagant member of the Directory government. Marie |
| 098 | 098.0167 | [^fn1] | Reference to La Fontaine's fable "La Laitière et le Pot au Lait" (The Dairywoman and the M |
| 099 | 099.0015 | [^3] | *Vesicants*: caustic plasters applied to the skin as a counter-irritant treatment for lung |
| 099 | 099.0016 | [^4] | She refers to the shoulder as the site where vesicant plasters would be applied. |
| 099 | 099.0017 | [^5] | "The architect" refers to Émile Bastien-Lepage, brother of Jules Bastien-Lepage the painte |
| 099 | 099.0024 | [^1] | Alice Brisbane's drawing was in fact accepted; the rejection had been a mistake. |
| 099 | 099.0051 | [^2] | The name is deliberately omitted — almost certainly Paul de Cassagnac, Marie's former roma |
| 099 | 099.0094 | [^1] | "Gouvernante intime": a discreet euphemism for a kept mistress — here Madame Presseq. |
| 099 | 099.0118 | [^1] | *Alphonse*: 1880s slang for a kept man or male parasite, drawn from the title character of |
| 099 | 099.0156 | [^1] | *In English in the original.* |
| 099 | 099.0254 | [^1] | *Misérable d'amour*: roughly, "a wretch destroyed by love" — Jules Bastien-Lepage's own ph |
| 099 | 099.0392 | [^1] | The Salon traditionally closed for several days while the jury voted on prizes, then reope |
| 099 | 099.0393 | [^3] | The irony is deliberate: the mention was not unexpected at all — it had been extensively p |
| 099 | 099.0393 | [^4] | Marie spells the name "Robert-Flery" in the original, perhaps a slip of anger. |
| 099 | 099.0393 | [^7] | *Cuisine artistico-électorale* — Marie's satirical coinage for the backroom dealing by whi |
| 099 | 099.0393 | [^9] | To be "admitted with a number" meant the painting was assigned a specific catalogue number |
| 099 | 099.0394 | [^1] | Pierre Auguste Cot (1837–1883), academic painter known for *The Storm* (1880) and *Springt |
| 099 | 099.0394 | [^2] | "What one understands well is stated clearly, / And the words to say it come easily." — Bo |
| 099 | 099.0394 | [^3] | "O Richard, O my king, the universe abandons you" — the opening line of Blondel's famous a |
| 101 | 101.0038 | [^crystallization] | *Crystallization*: Stendhal's term in *De l'Amour* (1822) for the process by which the ima |
| 101 | 101.0104 | [^1] | *In English in the original.* |
| 101 | 101.0184 | [^italian_101_0184] | *In Italian in the original* (first sentence): "Ebbene, Dina se vedesse che a me piacesse  |
| 101 | 101.0190 | [^gran_giulio] | *In Italian in the original*: "il gran Giulio" — the great Giulio (ironic grandiloquence). |
| 101 | 101.0301 | [^vanitas] | *Vanity of vanities, all is vanity.* Ecclesiastes 1:2. |
| 102 | 102.0018 | [^1] | Marie's painting *Un Meeting* (1884 Salon), depicting street children at a political meeti |
| 102 | 102.0025 | [^1] | Stendhal's theory in *De l'Amour* (1822): the process by which the lover mentally adorns t |
| 102 | 102.0033 | [^1] | Island in the Seine near Neuilly, later immortalised by Seurat's *A Sunday on La Grande Ja |
| 102 | 102.0035 | [^4] | *Il m'aime, un peu, beaucoup, passionnément, pas du tout*: the French love-divination game |
| 102 | 102.0035 | [^5] | Marie uses Stendhal's term from *De l'Amour* (1822): *crystallisation* is the process by w |
| 102 | 102.0036 | [^1] | Nihilism: Russian revolutionary movement of the 1870s–80s, culminating in the assassinatio |
| 102 | 102.0036 | [^3] | Edmond: a chiromancer (palm-reader) consulted by Marie in 1877, whose prophecies she took  |
| 102 | 102.0036 | [^5] | The exact parallel Marie has in mind is unclear — possibly Rousseau's ailments (he suffere |
| 102 | 102.0037 | [^1] | Marie credits herself with influencing Parisian fashion through her persistent demands at  |
| 102 | 102.0037 | [^3] | Tony: Tony Robert-Fleury (1837–1912), painter and teacher at the Académie Julian, one of M |
| 102 | 102.0037 | [^4] | Julian: Rodolphe Julian (1839–1907), founder of the Académie Julian, the progressive art s |
| 102 | 102.0038 | [^1] | Emile Bastien: Jules Bastien-Lepage's brother, an architect. |
| 102 | 102.0038 | [^3] | Damvillers: village in the Meuse department, Jules Bastien-Lepage's birthplace, to which h |
| 102 | 102.0038 | [^4] | Bloodletting was still practised in the 1880s as a medical treatment; the resulting weakne |
| 102 | 102.0038 | [^6] | Nausicaa: princess in Homer's *Odyssey* who discovers the shipwrecked Odysseus — Marie's s |
| 102 | 102.0039 | [^2] | Mrs. Mackay: Katherine Mackay, wife of the American silver magnate John William Mackay, wi |
| 102 | 102.0040 | [^1] | *Manger de la vache enragée*: lit. "to eat of the rabid cow" — French idiom for having end |
| 102 | 102.0040 | [^2] | Count Larderei: an Italian nobleman who had shown interest in Marie in earlier years. She  |
| 102 | 102.0040 | [^4] | Canrobert: a young visitor to the household, likely a relation or family acquaintance. |
| 102 | 102.0040 | [^5] | Musée Grévin: Paris wax museum, opened 1882, fashionable with all classes. |
| 102 | 102.0043 | [^1] | Jouy: likely Jouy-en-Josas, a small town south-west of Paris, near Versailles. |
| 102 | 102.0045 | [^2] | Catherine II (1729–1796): Empress of Russia, known for her formidable intellect and numero |
| 102 | 102.0048 | [^2] | The Marshal: Marshal François-Certain Canrobert (1809–1895), a celebrated Crimean War gene |
| 102 | 102.0049 | [^1] | Marie would turn twenty-five on 11 November — she writes this ten days after her birthday, |
| 102 | 102.0052 | [^1] | Bibliomancy: the practice of seeking guidance by opening a book at random and reading the  |
| 102 | 102.0054 | [^2] | Marie's aside to her imagined future reader is characteristic of her self-conscious relati |
| 102 | 102.0055 | [^1] | My fisherman: an earlier painting by Marie. |
| 102 | 102.0055 | [^2] | Ischia lottery: a charity fundraising lottery, to which Marie had contributed a work. |
| 102 | 102.0055 | [^3] | Hôtel Drouot: the principal public auction house for art in Paris, still operating today. |
| 102 | 102.0055 | [^4] | Théâtre des Batignolles: a theatre in the working-class Batignolles district, where Irma e |
| 102 | 102.0058 | [^1] | Marie's progressive hearing loss was a symptom of her deteriorating health, likely related |
| 102 | 102.0059 | [^2] | Northern lights visible in Paris: a rare geomagnetic storm made the aurora borealis visibl |
| 102 | 102.0059 | [^3] | Léon Gambetta (1838–1882): French statesman and leader of the Third Republic, who died in  |
| 102 | 102.0059 | [^4] | Louise Breslau (1856–1927): Swiss-German painter, Marie's chief rival at the Académie Juli |
| 102 | 102.0059 | [^5] | Cartwright: Julia Cartwright (1851–1924), English art critic and journalist, who wrote on  |
| 102 | 102.0063 | [^1] | Union des Femmes Peintres et Sculpteurs: founded 1881 by Hélène Bertaux (here spelled Bert |
| 102 | 102.0063 | [^3] | The judicious architect: Émile Bastien-Lepage, Jules's brother, who was an architect. |
| 102 | 102.0064 | [^1] | Carolus: Carolus-Duran (1837–1917), fashionable French portrait painter and teacher, known |
| 102 | 102.0067 | [^1] | Count Mikhail Loris-Melikov (1825–1888): Armenian-Russian statesman, former Minister of th |
| 102 | 102.0067 | [^2] | The family's legal affairs in Russia: Marie's family had ongoing disputes over property an |
| 102 | 102.0067 | [^3] | Écarte: a card game for two players, fashionable in 19th-century French society. |
| 102 | 102.0071 | [^1] | A French proverb: *les enfants qui ont trop d'esprit ne vivent pas longtemps* ("children w |
| 102 | 102.0071 | [^2] | Leonardo's colossal horse: the *Sforza Horse*, a clay model for a bronze equestrian monume |
| 102 | 102.0072 | [^2] | The Marshal's wife: Mme Canrobert, wife of Marshal François-Certain Canrobert. |
| 102 | 102.0078 | [^1] | Ernest Renan (1823–1892): French philosopher and historian, best known for *Vie de Jésus*  |
| 102 | 102.0085 | [^3] | Nikolai Gogol (1809–1852): Russian author whose works — particularly *Dead Souls* and *The |
| 102 | 102.0090 | [^1] | Empire costume: dress in the style of the First Empire (Napoleonic era, c. 1800–1815), cha |
| 102 | 102.0090 | [^2] | Italians: the Théâtre-Italien (later Théâtre-Ventadour), Paris's principal Italian opera h |
| 102 | 102.0092 | [^1] | The passage is from Balzac's *Illusions perdues* (1837–43), Part II ("Un grand homme de pr |
| 102 | 102.0092 | [^2] | Curtius: Marcus Curtius, Roman hero of legend who leapt on horseback into a chasm in the F |
| 102 | 102.0092 | [^4] | Princess Mathilde Bonaparte (1820–1904): niece of Napoleon I, cousin of Napoleon III. Her  |
| 102 | 102.0092 | [^5] | Pierre-Auguste Cot (1837–1883): French academic painter known for his society portraits an |
| 102 | 102.0092 | [^6] | Jules Joseph Lefebvre (1836–1912): Prix de Rome winner, professor at the Académie Julian a |
| 102 | 102.0093 | [^1] | Reign of Louis-Philippe: the July Monarchy (1830–1848). Marie's remark suggests the Bocher |
| 102 | 102.0111 | [^1] | Commander's cross of Saints Maurice and Lazarus: the Order of Saints Maurice and Lazarus,  |
| 102 | 102.0114 | [^2] | Manet Exhibition: the posthumous retrospective of Édouard Manet (1832–1883) held at the Éc |
| 102 | 102.0117 | [^4] | *Woman Lying with a Negro*: Marie's description of *Olympia* (1863) by Manet, showing the  |
| 102 | 102.0120 | [^1] | Russian Orthodox Christmas falls on 6 January (25 December in the Julian calendar, which r |
| 102 | 102.0122 | [^1] | Gustave Boulanger (1824–1888): Prix de Rome winner, professor at the École des Beaux-Arts  |
| 102 | 102.0135 | [^1] | Jules-Elias Franceschi (1825–1893): French sculptor, member of the Institut de France, kno |
| 102 | 102.0146 | [^3] | Julian: Rodolphe Julian (1839–1907), founder of the Académie Julian. Marie's epithet refle |
| 102 | 102.0153 | [^5] | The verses are a mock chanson in the style of a Montmartre street-song, with refrains endi |
| 103 | 103.0001 | [^1] | The Russian Orthodox New Year, celebrated thirteen days after the Western New Year accordi |
| 103 | 103.0060 | [^1] | The Théâtre-Italien, Paris's premier opera house for Italian opera. |
| 103 | 103.0060 | [^2] | To distinguish him from Henri de Rochefort (1831–1913), the famous radical journalist and  |
| 103 | 103.0070 | [^3] | Auvergnats were stereotyped as shrewdly practical and hard-nosed in their judgments. |
| 103 | 103.0096 | [^1] | Les Mirlitons: a Parisian artistic and literary club. |
| 103 | 103.0102 | [^1] | Mrs. Mackay: an American heiress who was Bastien-Lepage's wealthy patroness. |
| 103 | 103.0128 | [^1] | Appearing in public without a bonnet was considered improper for respectable women; it mar |
| 103 | 103.0133 | [^1] | Carolus-Duran (1837–1917): celebrated French portrait painter, later teacher of John Singe |
| 103 | 103.0138 | [^2] | Nausicaa: the young princess in Homer's *Odyssey* who discovers the shipwrecked Odysseus o |
| 103 | 103.0149 | [^3] | Marie's coded reference to her age: 16 + 9 = 25. |
| 103 | 103.0153 | [^1] | Mihály Munkácsy (1844–1900): celebrated Hungarian realist painter, famous in Paris for lar |
| 103 | 103.0153 | [^2] | Princess Mathilde Bonaparte (1820–1904): Napoleon III's cousin and one of Paris's most pro |
| 103 | 103.0162 | [^3] | Bituminous paint used asphalt-based pigments which produced deep, rich darks but were noto |
| 103 | 103.0168 | [^1] | Tonkin: the French colonial campaign in northern Vietnam, then a highly contentious politi |
| 103 | 103.0174 | [^3] | *Crystallisation*: Stendhal's term in *De l'Amour* (1822) for the process by which the ima |
| 103 | 103.0188 | [^5] | The street in Paris's 17th arrondissement where Bastien-Lepage had his studio. |
| 103 | 103.0204 | [^1] | *Journal des Débats*: the prestigious political and literary daily newspaper, founded 1789 |
| 103 | 103.0204 | [^2] | Louis-Arsène Delaunay (1826–1903): celebrated Comédie-Française actor renowned for elegant |
| 103 | 103.0217 | [^4] | Jean-Charles Cazin (1841–1901): French painter known for atmospheric nocturnal landscapes, |
| 103 | 103.0261 | [^3] | René de Saint-Marceaux (1845–1915): French sculptor Marie greatly admired, whom she placed |
| 103 | 103.0276 | [^1] | Marie's use of this antisemitic epithet, common in 1880s Parisian discourse, is recorded a |
| 103 | 103.0293 | [^1] | Alexandre Dumas père (1802–1870) was notorious for employing a workshop of ghost-writers,  |
| 103 | 103.0297 | [^2] | Allusion to the Spartan boy who stoically concealed a stolen fox beneath his cloak rather  |
| 103 | 103.0300 | [^4] | Massenet was elected to the Institut de France (Académie des Beaux-Arts) in 1878, giving h |
| 103 | 103.0314 | [^1] | Julián Gayarre (1844–1890): celebrated Navarrese tenor, renowned for the beauty and expres |
| 103 | 103.0341 | [^2] | Eugène de Rastignac and the Baronne de Nucingen: characters from Balzac's *La Comédie huma |
| 103 | 103.0351 | [^1] | Madeleine Lemaire (1845–1928): celebrated French watercolourist, famous for her roses, and |
| 103 | 103.0363 | [^2] | Pan: the Greek god of nature in all its totality; the reference is to pantheism. |
| 103 | 103.0378 | [^1] | William Alexander Louis Stephen Douglas-Hamilton, 12th Duke of Hamilton (1845–1895): Marie |
| 103 | 103.0380 | [^2] | Georges Clemenceau (1841–1929): Radical politician, at this time an influential deputy; la |
| 103 | 103.0393 | [^1] | *Ruy Blas* (1838): Victor Hugo's play in which the lackey-hero is tormented by an impossib |
| 103 | 103.0412 | [^2] | The Île de la Grande Jatte: an island in the Seine near Paris, later made world-famous by  |
| 103 | 103.0414 | [^3] | *Cimaise* (picture rail): the line at eye level where the most prestigious works were hung |
| 103 | 103.0463 | [^1] | *Porte-voix* (speaking-tube): a tube running between floors of a house, used by servants t |
| 103 | 103.0470 | [^2] | Marie explicitly defends herself against the Romantic cliché of the tubercular invalid who |
| 103 | 103.0473 | [^4] | *Un Meeting* (1884): Marie's painting of working-class children gathered in a street, subm |
| 103 | 103.0481 | [^1] | Damvillers: Bastien-Lepage's native village in the Meuse, to which he regularly returned t |
| 103 | 103.0483 | [^2] | Gustave Flaubert (1821–1880) was famous for his total dedication to writing as a vocation, |
| 103 | 103.0488 | [^1] | Anne, Duchesse d'Uzès (1847–1933): one of the most prominent aristocratic women of the Bel |
| 103 | 103.0489 | [^2] | Alexandre Cabanel (1823–1889): leading academic painter and professor at the École des Bea |
| 103 | 103.0494 | [^1] | Louise Abbema (1853–1927): French painter and sculptor, known especially for her portraits |
| 103 | 103.0518 | [^1] | In Greek mythology, Io was a mortal loved by Zeus who transformed her into a heifer to con |
| 103 | 103.0519 | [^2] | Virginie Gautreau (1859–1915): a celebrated beauty of Parisian society, immortalised by Sa |
| 103 | 103.0524 | [^1] | Blida: a town in French Algeria with a mild climate, used as a convalescent destination. B |
| 103 | 103.0527 | [^1] | Jean-François Raffaëlli (1850–1924): painter and printmaker celebrated for his scenes of P |
| 103 | 103.0530 | [^1] | The Salon jury ranked submitted works on a scale from 1 to 3; a *numéro 3* indicated accep |
| 103 | 103.0571 | [^1] | Mathilde Marchesi (1821–1913): renowned mezzo-soprano and voice teacher whose students inc |
| 103 | 103.0571 | [^2] | *Lucia di Lammermoor* (1835): opera by Gaetano Donizetti, one of the great bel canto maste |
| 103 | 103.0605 | [^1] | Bromide (potassium bromide): widely prescribed as a sedative and anticonvulsant throughout |
| 103 | 103.0633 | [^1] | The Galerie Georges Petit (rue de Sèze): one of the most prestigious private galleries in  |
| 103 | 103.0655 | [^1] | Bastien-Lepage competed twice for the Prix de Rome; on his second attempt in 1875 he won s |
| 103 | 103.0695 | [^1] | In Balzac's novel *Béatrix* (1839), Claude Vignon analyses the distinguished writer Camill |
| 104 | 104.0027 | [^vernissage] | The Vernissage (Varnishing Day) was the private preview day before the official opening of |
| 104 | 104.0258 | [^tempora] | *O tempora, o mores!* — "O the times, O the customs!" A famous exclamation from Cicero (*I |
| 105 | 105.0017 | [^eaux-bonnes] | Eaux-Bonnes: a spa town in the Pyrenees, commonly prescribed for tuberculosis patients in  |
| 105 | 105.0072 | [^saint-antoine] | Saint Anthony the Abbot is traditionally depicted with a small pig at his feet, a popular  |
| 105 | 105.0132 | [^dupuis] | Adolphe Dupuis (1824-1891), celebrated comic actor at the Théâtre des Variétés in Paris. |
| 105 | 105.0149 | [^laudanum] | Laudanum (tincture of opium) was widely used in the 1880s as a preventive against cholera. |
| 105 | 105.0306 | [^pre-catalan] | The Pré Catalan: a fashionable garden and restaurant within the Bois de Boulogne. |
| 105 | 105.0418 | [^bievre] | The Bièvre, a tributary of the Seine running through the Jouy-en-Josas valley, was celebra |
| 105 | 105.0444 | [^congres84] | The joint session of the Chamber of Deputies and Senate meeting at Versailles on 4 August  |
| 105 | 105.0450 | [^president-couvert] | Parliamentary procedure: when the session president puts on his hat it signals suspension  |
| 105 | 105.0497 | [^damvillers] | Damvillers in the Meuse, Bastien-Lepage's birthplace, to which he returned whenever he cou |
| 105 | 105.0557 | [^jeanne-darc] | Bastien-Lepage's *Jeanne d'Arc* (1879) is his most celebrated painting, showing the young  |
| 105 | 105.0701 | [^nittis] | Giuseppe De Nittis (1846–1884), Italian Impressionist painter based in Paris, celebrated f |
| 105 | 105.0775 | [^hecht] | Henri Hecht (1840–1891), prominent Paris art collector and patron. Marie uses an antisemit |
| 105 | 105.0775 | [^tissot] | Jean Béraud (1849–1935) and James Tissot (1836–1902), fashionable painters of Parisian lif |
| 105 | 105.0790 | [^gigoux] | Jean-François Gigoux (1806–1894), French Romantic history painter, a surviving figure of t |
| 106 | 106.0208 | [^7] | *Joan of Arc* (1879): Bastien-Lepage's celebrated painting, now at the Metropolitan Museum |

## Unplaceable gaps

| carnet | paragraph | key | reason |
|---|---|---|---|
| 066 | 066.0324 | [^1] | no-fr-text |
