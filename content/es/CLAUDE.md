# es/ — Spanish Translations (Traducción al español)

This directory contains Spanish translations of Marie Bashkirtseff's diary. **Status: pilot** (2026-09-05) — the workflow is being trialled on carnet 001 before any wave is scheduled. Several style decisions below are marked PILOT DECISION and must be confirmed by the human after the first carnet.

> Style guide revised after pilot slice 1 (carnet 001, entries 1873-01-11 .. 1873-01-15) on 2026-09-05; run report `.claude/reports/2026-09-05-es-001.md`.

## Structure

```
es/
├── CLAUDE.md            # This file (workflow in English, style guide in Spanish)
├── PROGRESS.md          # Overall Spanish translation status + pilot plan
├── TranslationMemory.md # Established terminology (seeded, confirm during pilot)
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
└── 001/-106/            # Translated entries
    └── README.md        # Per-carnet progress
```

## Why Spanish

Spanish is the first target language of this project with a large readership on two continents and no established Bashkirtseff tradition: the only widely circulated Spanish editions are selections derived from the censored 1887 text. This is the first complete, uncensored Spanish translation from the manuscripts. Do not consult or paraphrase existing Spanish selections; translate from the annotated French source.

## Translation File Format

Spanish files mirror the French originals and follow the **cz/uk/en frontmatter shape** (not the fr tree, which has no frontmatter). `just scaffold NNN -l es` produces the skeleton; `just sync NNN es` re-syncs RSR/LAN comments later.

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
translation_complete: true
opus_reviewed: true
editor_approved: true
conductor_approved: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Sábado 11 de enero de 1873. Hace un tiempo espléndido...
%% 2026-09-05T12:00:00 TR: "superbe" → "espléndido" (no "soberbio", que en español %%
%% connota arrogancia). %%
```

**Key points:**
- French original in `%% ... %%` immediately before the Spanish text
- Glossary links use the `../../_original/_glossary/` path
- TR comments document non-obvious choices; every `%%` opens and closes on the same line
- Footnotes: `[^CC.PP.n]` as in the en/cz trees — two-digit carnet, paragraph number padded to two digits, note number (`[^01.07.1]`, `[^01.13.1]`, `[^01.108.2]`); see Notas al pie below

## Translation Phases

### 1. Translation (TR)
- Translate from the annotated French source (RSR + LAN complete)
- Preserve Marie's voice; follow `TranslationMemory.md`
- Add TR comments for non-obvious choices

**Frontmatter flag**: `translation_complete: true`

### 2. Opus Review (OPS)
- Language expert cross-validation: naturalness pass first, then semantic pass against the French
- Fixes applied directly, recorded in OPS comments

**Frontmatter flag**: `opus_reviewed: true`

### 3. Editor Review (RED)
- Naturalness in Spanish, accuracy against French, register
- Flag awkward phrasing, gallicisms, tense slips

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)
- Final literary quality gate; approve or request revision

**Frontmatter flag**: `conductor_approved: true`

### 5. Optional passes
- `fablelous` (FAB) word-level polish and `vox` (VOX) reader-side review, recorded under `redaction_passes`.

---

# Guía de estilo para la traducción al español

## Enfoque general

Traducimos a un **español literario contemporáneo** que deje traslucir el siglo XIX sin caer en el pastiche arcaizante. La pregunta que guía cada frase: "¿Cómo lo habría escrito una autora hispanohablante culta que quisiera conservar la atmósfera de 1870 y todas las capas de sentido de Marie, para que lo lea con gusto una persona joven de hoy?"

No se sigue servilmente el orden de palabras francés. Se busca la frase que una escritora española habría escrito, aunque una idea acabe media oración más allá. Nada en Marie es casual: cada giro tiene motivo y debe reflejarse, aunque sea desplazado.

## La voz de Marie

- Sofisticación aristocrática decimonónica con energía juvenil: escribe con doce años en 1873 y con veinticinco en 1884; la voz madura, la traducción debe madurar con ella.
- Emoción dramática, a veces exagerada; ingenio afilado; autoconciencia constante. Ni suavizar ni ridiculizar.
- Registro alto sin arcaísmos forzados: nada de "vuesa merced", "empero", "mas" adversativo, "aqueste". Sí: léxico culto todavía vivo (*menester*, *acaso*, *harto*, *sobremanera*) con moderación.
- Cuando Marie usa el presente narrativo para dar inmediatez, se conserva.
- El lenguaje crudo se conserva crudo (*crever* → "reventar", no "fallecer").

### Telegrafismo, fragmentos sin verbo y saltos de tiempo

- Marie escribe a menudo en **telegrama**: fragmentos nominales, enumeraciones sin verbo, frases truncadas ("Tiempo espléndido. Paseo. Nadie."). Es un registro, no un descuido: **no se suplen verbos** ni se completan las frases; se reproduce la elipsis con la misma economía.
- Sus **cambios de tiempo verbal son deliberados**: presente para la vanidad, la profecía y el ensueño ("seré célebre", "estoy hermosa"), pretérito para la crónica del día. **Nunca se unifican** los tiempos de un párrafo para "alisarlo"; el salto forma parte del sentido.

## Variedad del español — DECISIÓN PILOTO

Por defecto, **español neutro literario panhispánico**: evitar regionalismos marcados (ni *coche* vs *carro* como bandera, ni voseo, ni *ordenador/computadora*, que además no aparecen). Preferir la palabra común a todo el ámbito hispánico; cuando no exista, la forma peninsular culta, que es la tradición de las grandes traducciones literarias del francés.

| Francés | Español (por defecto) | Nota |
|---------|----------------------|------|
| tu | tú (tuteo) | familia, Dina, amigas íntimas, Dios en oración |
| vous (singular) | usted | sociedad, pretendientes, criados en registro formal |
| vous (plural) | **vosotros/vosotras** | PILOTO: forma de las traducciones literarias clásicas |
| Alternativa | **ustedes** en todos los plurales | opción para lectores latinoamericanos |

**Regionalismos que delatan**: *voiture* (de caballos) → **carruaje** (o "el coche de caballos" sólo si el contexto lo exige); "coche" a secas es bandera regional y evoca el automóvil. Igual criterio para toda palabra que sitúe al lector en un país concreto antes que en 1873.

**El humano decide tras el carnet 001** entre `vosotros` (peninsular, marca de distancia informal/formal en plural, tradición literaria) y `ustedes` universal (neutro para América, pierde la distinción tú/usted en plural). Hasta entonces: `vosotros`, y anotar en TR toda ocurrencia de plural informal para poder cambiarlo mecánicamente. No mezclar ambas en un mismo cuaderno.

## Lista de galicismos y falsos amigos

La trampa central de esta lengua meta: el español acepta con demasiada facilidad la sintaxis y el léxico franceses, y el resultado "suena bien" al oído descuidado. Todo revisor debe pasar esta lista.

| Francés | Calco (evitar) | Español correcto |
|---------|----------------|------------------|
| assister à | asistir a (cuando es "presenciar") | presenciar, ir a, estar en; "asistir" sólo en su sentido español pleno |
| éventuellement | eventualmente | quizá, tal vez, llegado el caso |
| actuellement | actualmente (= "en realidad") | en este momento / (= "réellement") en realidad |
| librairie | librería (= biblioteca) | librería es tienda; *bibliothèque* → biblioteca |
| ignorer | ignorar (= despreciar) | no saber, desconocer |
| prétendre | pretender (= cortejar/intentar) | afirmar, sostener |
| rester | restar | quedarse, permanecer |
| demander | demandar | preguntar (información) / pedir (cosa) |
| attendre | atender | esperar; *s'attendre à* → contar con |
| se rappeler / se souvenir | rappelarse | acordarse de, recordar |
| il y a (temporal) | hay (tres años) | hace tres años |
| en train de | en tren de | estar + gerundio |
| venir de + inf. | venir de hacer | acabar de hacer |
| regarder | regardar / mirar (= concernir) | mirar; *cela me regarde* → eso es asunto mío |
| ennuyer / s'ennuyer | enojar / enojarse | aburrir, fastidiar / aburrirse |
| toilette | toilette / toilet | vestido, atuendo, tocado (nunca "aseo") |
| sympathique | simpático (a veces sí) | agradable, que cae bien; ojo al contexto |
| large | largo | ancho, amplio |
| sensible | sensible (= razonable) | sensible = *sensitif*; *raisonnable* → sensato |
| habit | hábito | traje, frac, ropa |
| gentil | gentil | amable, simpático, bueno |
| succès (avoir du) | tener suceso | tener éxito |
| chance | chance | suerte, ocasión |
| se passer (que se passe-t-il) | pasarse | ocurrir, pasar |
| entendre | entender | oír; *entendre dire* → oír decir |
| si seulement | si tan solo | si al menos, ojalá |
| c'est pour ça que | es por eso que | por eso, de ahí que |
| ce n'est que… que | no es hasta que | sólo cuando, no… hasta que |
| basé sur | basado en | fundado en, a partir de, según |
| afin de / en vue de | en orden a | para, con el fin de |
| en robe rose / en chapeau | de vestido rosa | **con** vestido rosa, con sombrero (la prenda que se lleva va con *con*) |
| à notre loge / à la maison (estático) | a nuestro palco, a casa | **en** nuestro palco, en casa (*a* sólo con movimiento) |
| se montrer avec / se faire voir / se donner en spectacle | mostrarse con; se la vio con | **dejarse ver con**, exhibirse (voluntad de exhibición, no pasiva refleja) |
| faire la connaissance de | hacer el conocimiento de | conocer a alguien (complemento directo) |

**Fórmulas de doblaje**: "si tan solo", "es por eso que", "no es hasta que", "basado en", "en orden a", "¿estás bien?", "hacer sentido". Regla: **si una frase estaría en su sitio en una película doblada, no es español de época** ni español literario; búsquese la forma castiza.

**Calcos sintácticos:**
- **Posesivos en exceso**: *j'ai mal à ma tête* → "me duele la cabeza", no "mi cabeza"; *elle a mis son chapeau* → "se puso el sombrero".
- **Cadenas de "que"**: el francés encadena *que… que… que*; en español se rompe con gerundio, infinitivo, punto y coma o dos oraciones.
- **"El hecho de que"**: casi siempre sobra; *le fait que* → "que + subjuntivo" o reformular.
- **Pasiva perifrástica**: *elle a été invitée par* → "la invitó", "la invitaron", pasiva refleja "se la invitó". La pasiva con *ser* es rara en prosa española narrativa. Ojo: los verbos reflexivos de **exhibición social** (*se montrer avec*, *se faire voir*) expresan voluntad del sujeto y NO se vuelcan en pasiva refleja ("se nos vio con") sino en "dejarse ver con".
- **Orden de palabras**: sujeto pronominal explícito sólo en tres casos: contraste o énfasis ("yo, en cambio…"), cambio de sujeto que el verbo no marca, y **desambiguación** cuando dos referentes del mismo género compiten ("él" para el duque frente a otro caballero de la escena). Fuera de esos casos se omite; el francés lo exige, el español no. Adjetivo antepuesto/pospuesto según valor, no según el francés; los adverbios van donde los pone el español ("no dudó ni un instante en…", no el orden francés).
- **Artículo ante nombres propios** con título: *la comtesse de X* → "la condesa de X" (sí), pero *Madame X* → "madame X" sin artículo.
- **"On"**: → "se" impersonal, "uno", "la gente", primera persona del plural; nunca "on".
- **Negación**: *ne… que* → "sólo / no… más que"; *ne… plus* → "ya no"; *ne… jamais* → "nunca" (con doble negación correcta en español).
- **Frases hechas**: buscar el equivalente idiomático español, no traducir la imagen (*casser du sucre sur le dos* → "poner verde a alguien").

## Puntuación y tipografía

- Signos de apertura obligatorios: **¿…? ¡…!** Se abren donde empieza la pregunta o la exclamación, no necesariamente al principio de la frase: "Pero ¿qué diría Maman?"
- Sin espacio antes de `; : ? !` (el francés lo lleva; el español no).
- **Diálogo con raya** (—, U+2014), sin espacio tras la raya de apertura, con rayas de inciso: —¿Vienes? —preguntó—. Hace frío.
- **Comillas**: latinas « » como exteriores, inglesas " " para citas dentro de citas, simples ' ' en tercer nivel. La puntuación va fuera de las comillas de cierre salvo que forme parte de la cita.
- Puntos suspensivos: un solo carácter (…) o tres puntos, nunca más de tres. Marie los usa muchísimo; se conservan.
- **Fechas**: "sábado 11 de enero de 1873" — días y **meses en minúscula**. Encabezados de entrada: "Sábado 11 de enero de 1873" con mayúscula inicial de frase.
- Horas: "a las cinco", "a las cinco y media"; numerales en letra hasta el 30 y en cifra a partir de ahí, salvo edades y cantidades exactas de dinero.
- **Ordinales**: 1.º, 2.ª (con punto volado); en prosa, "primero", "segunda". Siglos en romanos: siglo XIX.
- **Minúscula**: gentilicios (*los ingleses*, *la duquesa rusa*), idiomas (*el italiano*), tratamientos (*señora*, *señor*, *condesa*, *duque*, *madame*, *mademoiselle*, *monsieur*), cargos (*el emperador*, *el rey*). Mayúscula: Dios, nombres propios, instituciones (*la Ópera*, *el Cercle de la Méditerranée*) y **festividades** (*Año Nuevo*, *Navidad*, *Pascua*, *Carnaval* como fiesta; en minúscula el periodo genérico: "en carnaval").
- Miles con espacio fino o punto según RAE actual: preferir "10 000"; decimales con coma.
- Cursiva para palabras extranjeras no adaptadas (*toilette* si se conserva, *veglione*, *table d'hôte*) y para títulos de obras. La cursiva se aplica también a la **glosa española dentro de la nota al pie** (*La Fille de madame Angot* → nota: «*La hija de la señora Angot*»).
- **Títulos**: las **obras representadas** (óperas, operetas, comedias, piezas de concierto) conservan el título francés en cursiva y reciben una nota con la glosa española en su primera aparición; los **títulos descriptivos** de artículos, capítulos o cuadros se traducen en el cuerpo.

## Tiempos verbales y gramática

- **Pretérito indefinido** ("fui", "dijo") para lo narrado en la entrada del día: es el tiempo del diario en español literario. **Pretérito perfecto compuesto** ("he ido") sólo cuando Marie subraya que el efecto llega al momento de escribir ("hoy he llorado y todavía lloro"); no calcar el *passé composé* francés en perfecto compuesto sistemáticamente.
- **Imperfecto** para trasfondo, hábito y descripción; imperfecto narrativo con cautela.
- **Pluscuamperfecto** cuando el francés usa *plus-que-parfait*; el pretérito anterior ("hube llegado") sólo en registro muy elevado.
- **Subjuntivo**: correcto en concesivas, finales, temporales de futuro ("cuando venga", no "cuando vendrá"), deseos, dudas; el francés indicativo tras *je pense que* sigue indicativo en español; tras negación, subjuntivo.
- **Condicional** para el futuro del pasado y la cortesía; no confundir con el imperfecto de subjuntivo en -ra en prótasis ("si tuviera", no "si tendría").
- **Leísmo, laísmo, loísmo**: se evitan. Complemento directo → lo/la/los/las; indirecto → le/les. Único leísmo tolerado: *le* por persona masculina singular en complemento directo, y sólo si el conjunto del cuaderno lo hace de forma consistente (preferible no usarlo).
- **Ser/estar** según naturaleza vs. estado; **haber/tener**; *il fait beau* → "hace buen tiempo". Con el **aspecto físico**, ser/estar es una cuestión de significado, no de estilo: *je serais belle* (esa noche, con ese vestido) → "**estaría** hermosa"; "sería hermosa" afirma otra cosa (que llegaría a serlo, o que lo es por naturaleza). Todo *être + adjetivo de apariencia* se decide en el contexto: "está guapa" (hoy) vs "es guapa" (siempre).
- **Saltos de tiempo de Marie**: presente para la vanidad y la profecía, pretérito para la crónica; el *passé composé* francés NO se homogeneiza con el presente narrativo vecino (ver Telegrafismo, arriba). Corregir la mecánica del tiempo, nunca la intención.
- **Gerundio**: nunca de posterioridad ("salió, cerrando la puerta al llegar" es incorrecto si la acción es posterior); nunca como adjetivo especificativo.
- Concordancia de género con sujetos femeninos: Marie escribe de sí misma en femenino; todos los participios y adjetivos referidos a ella van en femenino ("estaba cansada", "fui invitada").
- **Diminutivos**: el español los tiene y Marie los pide ("mi pobre niñita"); usarlos con tino, sin infantilizar.

## Nombres, tratamientos y lugares

- **Marie Bashkirtseff**: siempre así, con esta grafía; es la marca del proyecto. Nunca "María Bashkírtseva" ni "Bashkirtseva".
- Nombres franceses, ingleses e italianos: sin cambio (Marie, Paul, Dina, los Howard, el duque de Hamilton, Pietro).
- **Nombres rusos**: transliteración española (Nikolái, Alexéi, Gagarin, Bábanin/Babanine según TM); la familia materna se mantiene como **Babanine** (forma francesa que usa Marie). Las decisiones caso por caso (Пётр → Piotr o Pedro; Dina/Dinah) se fijan en `TranslationMemory.md`, no en cada entrada.
- **Moussia**: apodo familiar de Marie; se conserva "Moussia" en cursiva la primera vez de cada carnet, luego redonda.
- **Maman**: se conserva "Maman" (como en la tradición en/cz), no "Mamá"; con mayúscula, sin artículo.
- **madame / mademoiselle / monsieur** + apellido en la sociedad francesa de Niza o París: **se conservan en francés**, en minúscula, sin cursiva ("madame Howard", "monsieur de Biesme"), como hace el árbol en. Como sustantivo común (*une dame*, *ce monsieur*) → "una señora", "ese caballero".
- Títulos nobiliarios: en español y minúscula (*el duque*, *la condesa*, *el príncipe*); "Su Alteza" con mayúscula.
- **Topónimos**: exónimo español establecido — **Niza**, París, Roma, Florencia, Nápoles, Viena, Londres, San Petersburgo, Moscú; sin exónimo → forma local o transliteración (Poltava, Gavrontsi, Ostende, Schlangenbad). *Promenade des Anglais* se conserva.
- *carnet* → "cuaderno"; *journal* → "diario"; *salon* → "salón".

## Pasajes en otras lenguas

Marie alterna francés, inglés, italiano y ruso:

- **Inglés en el original**: se traduce al español, marcado con `==resaltado==`, con nota al pie: "*En inglés en el original:* «…»" (con el texto inglés).
- **Italiano / ruso**: igual — traducir, `==resaltado==`, nota con el texto original y su lengua.
- **Palabras sueltas** extranjeras: traducir en el cuerpo, nota "*En inglés en el original:* «bribed» — sobornado".
- **Francés conservado en español** (*toilette*, *veglione*): cursiva y nota al pie en la primera aparición del carnet.
- **Español en el original** (Marie lo emplea raramente): se conserva tal cual, `==resaltado==`, nota "*En español en el original*".

## Notas al pie

Formato idéntico al de los árboles en/cz: `[^CC.PP.n]` — carnet en dos cifras, número de párrafo con al menos dos cifras (sin el relleno de cuatro), número de nota: `[^01.07.1]`, `[^01.13.1]`, `[^01.108.2]`. (La forma `[^NNN.PPPP.n]` de la especificación antigua no se usa en la práctica.) Definidas al final de la entrada. Tipos:

- **N. de la A.** — nota de la autora, sólo si está en el manuscrito.
- **N. de la T.** — nota de la traductora: decisiones, lenguas originales, juegos de palabras.
- **N. de la E.** — nota de la editora: contexto, dudas de lectura, investigación.

```markdown
—Está casado desde ayer[^14.25.1].

[^14.25.1]: N. de la T.: En inglés en el original: «He is married since yesterday».
```

Reglas:

- **Llamada antes del signo de puntuación** (norma RAE): "desde ayer[^14.25.1]." y no "desde ayer.[^14.25.1]"; el árbol en la pone después, el español sigue la RAE.
- **La llamada va en el párrafo del original**: el ancla sigue al párrafo fuente, nunca se traslada a otro párrafo aunque la frase se haya reordenado.
- **Fidelidad**: las notas heredadas del `_original` se traducen enteras; no se omiten oraciones ni matices de la nota.
- **Notas añadidas por la traductora**: permitidas cuando alinean el aparato con el del árbol en (referencias de época que en ya anota) o cuando glosan un título francés conservado; se crean primero en `_original` y se propagan con `just sync`, o se anotan en TR si se añaden sólo en es.
- **Cursiva** para la glosa española de un título dentro de la nota; el texto extranjero citado va entre comillas latinas.
- Etiqueta por defecto **N. de la T.** (decisión pendiente del humano: "Nota de la traductora").

---

## Editor / review traps (Spanish)

Concrete Spanish traps for RED and OPS to catch (the language-agnostic frame lives in the `editor`/`opus-editor` skills; the concrete examples live here). The **Lista de galicismos** table above is the primary watch-list — start there.

| Category | Example |
|----------|---------|
| **Gallicisms (lexical)** | "asistir a un incidente" → "presenciar"; "eventualmente" → "quizá"; "restar en casa" → "quedarse en casa"; "demandar" → "preguntar/pedir"; "atender a alguien" (= wait) → "esperar" |
| **Gallicisms (syntactic)** | "el hecho de que"; "que… que… que" chains; "fue invitada por" → "la invitaron"; "ha tres años" / "hay tres años" → "hace tres años"; "estoy en tren de" → gerund; "vengo de ver" → "acabo de ver" |
| **Possessive overload** | "me dolía mi cabeza" → "me dolía la cabeza"; "se puso su sombrero" → "se puso el sombrero" |
| **Explicit pronouns** | "Yo fui, yo vi, yo dije" mirroring French *je* → drop unless contrastive |
| **Tense** | passé composé mechanically rendered as perfecto compuesto ("hoy he ido a la Ópera y he visto…") → indefinido for narrated day; future indicative after "cuando" → subjunctive |
| **Leísmo / laísmo / loísmo** | "la dije que" → "le dije que"; "le vi (a ella)" → "la vi" |
| **Punctuation** | missing ¿ ¡; space before `;:?!`; French « » with spaces inside; dialogue with quotation marks instead of raya; "..." with four dots |
| **Capitalisation** | "Enero", "Sábado", "Ruso", "Señora X", "Condesa" → all lowercase; "Dios", "Ópera" (institution) uppercase |
| **Register** | archaic pastiche ("empero", "mas", "vuestra merced") vs. flat modern colloquialism ("vale", "guay", "flipar"); regionalisms ("coger" ambiguity outside Spain — prefer "tomar" for vehicles) |
| **Variety consistency** | mixing vosotros and ustedes within a carnet; voseo; Latin-American vs peninsular lexicon flip-flopping |
| **False friends** | "actualmente" (= now, not "actually"); "sensible" (= sensitive); "largo" (= long, not wide); "simpático"; "librería"; "ignorar"; "pretender"; "suceso"; "gentil"; "entender" for *entendre* |
| **Feminine agreement** | Marie about herself: "estaba cansado" → "cansada"; "fui invitado" → "invitada" |
| **Gerund abuse** | gerund of posterity; gerund as adjective ("una carta conteniendo") → relative clause |
| **Name/exonym drift** | "Nice" → "Niza"; "Florence" → "Florencia"; "Bashkirtseva/María" → "Marie Bashkirtseff"; Russian names not following TM transliteration |
| **Foreign passages** | English left untranslated in the body (must be translated + `==highlight==` + footnote) |
| **Dubbing formulas** | "si tan solo" → "si al menos"; "es por eso que" → "por eso"; "no es hasta que" → "sólo cuando"; "basado en"; "en orden a" — if it would sit comfortably in a dubbed film, it is not period Spanish |
| **Ser/estar on appearance** | "sería hermosa" for *je serais belle* (that night) → "estaría hermosa"; "es guapa" vs "está guapa" is a meaning change, not style |
| **Tense unification** | passé composé + narrative present in one paragraph flattened to a single tense → keep Marie's deliberate shift (present = vanity/prophecy, preterite = chronicle) |
| **Telegraphese filled in** | verbs supplied to Marie's verbless fragments ("Tiempo espléndido. Paseo.") → restore the ellipsis |
| **Null-subject ambiguity** | pronoun dropped where two same-gender referents compete ("dijo que…" — the Duke or the count?) → keep "él" for disambiguation; "cette nuit" = last night, not tonight |
| **Prepositions (garment / place)** | "de vestido rosa" → "con vestido rosa"; "a nuestro palco" (static) → "en nuestro palco" |
| **Social-display reflexives** | *se montrer avec* as pasiva refleja ("se nos vio con") → "dejarnos ver con" |
| **Regionalism flag** | "coche" for a horse-drawn *voiture* → "carruaje" |
| **Festivity capitalisation** | "año nuevo" → "Año Nuevo"; "navidad" → "Navidad" |
| **Titles** | performed works translated in the body (*La hija de madame Angot*) → keep French title in italics + Spanish gloss footnote; descriptive article titles left in French → translate |
| **Footnotes** | call after the full stop → before it (RAE); anchor moved to another paragraph → back to the source paragraph; inherited note translated with a clause dropped → complete it; Spanish gloss inside the note not italicised |
| **Asserted-but-unapplied fix** | a review comment (OPS/RED/CON) says "rejoined the exclamation arc" / "changed X to Y" but the text is unchanged → verify every claimed fix against the line, not the comment |

Keep Marie's same-language code-switches as `==highlight==` with a footnote naming the original language. 19th-century sophistication without archaism.

## Review criteria (OPS / RED)

Language-specific review checklists for the two review passes (naturalness-only, then semantic against the French). They are the concrete Spanish criteria for the OPS and RED passes.

**Pass 1 — text-only:**

```
Eres un editor y estilista experimentado de lengua española. Revisa esta traducción al español del diario de Marie Bashkirtseff (siglo XIX).

FÍJATE EN:
1. Galicismos (calcos léxicos y sintácticos del francés que suenan antinaturales en español)
2. Gramática (tiempos verbales, subjuntivo, concordancia, leísmo/laísmo, gerundios)
3. Naturalidad (debe leerse como prosa de una autora hispanohablante, no como traducción)
4. Adecuación de época (sabor del siglo XIX, pero legible para un público de hoy; sin pastiche)
5. Desplazamientos de sentido (galicismos que cambian el significado)
6. Falsos amigos (actualmente, eventualmente, asistir, ignorar, pretender, sensible, largo…)
7. Puntuación y tipografía españolas (¿¡, raya de diálogo, comillas latinas, minúsculas)
8. Coherencia de variedad (vosotros/ustedes, sin regionalismos marcados)

Para cada problema, asigna gravedad:
- A: hay que corregir (error gramatical, cambio de sentido, sinsentido)
- B: recomendado (antinaturalidad, galicismo, existe una alternativa mejor)
- C: cosmético (menor, ignorar)
```

**Pass 2 — with-comments:**

```
Eres un editor y estilista experimentado de lengua española. Revisa esta traducción al español del diario de Marie Bashkirtseff (siglo XIX).

El texto contiene comentarios en formato %% ... %%: el original francés, notas de traducción (TR), notas lingüísticas (LAN), notas de investigación (RSR) y correcciones previas. Úsalos como contexto, pero revisa SOLO la traducción española (líneas sin %%).

IMPORTANTE: No tengas en cuenta las correcciones previas; evalúa cada pasaje de forma independiente, como si lo vieras por primera vez.

FÍJATE EN:
1. Desplazamientos de sentido (compara el español con el francés: ¿recoge el significado real?)
2. Traducciones erróneas (palabras que significan otra cosa en español que en francés)
3. Matices perdidos (ironía, registro social, tono emocional, tú/usted)
4. Gramática (tiempos, subjuntivo, concordancia de género de la narradora)
5. Naturalidad (¿se lee como prosa española y no como traducción?)
6. Galicismos y falsos amigos

Para cada problema, asigna gravedad:
- A: hay que corregir
- B: recomendado
- C: cosmético (ignorar)
```

## Comment Types

| Code | Role | Purpose |
|------|------|---------|
| TR | Translator | Translation decisions |
| OPS | Opus Editor | Language expert review notes |
| RED | Editor | Quality notes, suggestions |
| CON | Conductor | Approval, final notes |
| FAB | Fablelous | Word-level polish |
| VOX | Voice of the Reader | Opposing reader-side review |

## Progress Tracking

Each carnet has a `README.md` tracking counts, TODOs and a changelog. Use `/project-status es 001` to check status and `/project-status log es 001 "…"` to record work. TODO tags: `TR-FIX`, `RED-FLAG`, `CON-BLOCK`, `TERMINOLOGY`, `VOICE`.

## Related Documentation

- `/content/_original/CLAUDE.md` - French source materials
- `/content/en/CLAUDE.md` - English tree (closest workflow template)
- `/docs/ADDING_LANGUAGES.md` - Part 3: content tree and agent pipeline wiring
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/.claude/skills/translator/SKILL.md`, `editor`, `opus-editor`, `conductor` - Role definitions
