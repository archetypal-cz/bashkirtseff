# cz/ — Czech Translations

This directory contains Czech translations of Marie Bashkirtseff's diary.

## Structure

```
cz/
├── CLAUDE.md            # This file - Czech-specific style guide
├── PROGRESS.md          # Overall Czech translation status
├── TranslationMemory.md # Established terminology
│
├── 000/                 # Translated preface
│   └── README.md        # Carnet progress
├── 001/-106/            # Translated entries
│   └── README.md        # Per-carnet progress
│
└── _archive/            # Old translation versions
```

## Translation File Format

Czech translation files mirror the French originals but include both languages:

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
translation_complete: true
editor_approved: true
conductor_approved: false
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
%% Samedi 11 janvier 1873. Il fait un temps superbe... %%
Sobota 11. ledna 1873. Je nádherné počasí...
%% 2025-12-08T10:00:00 TR: Used "nádherné" for "superbe" to match
Marie's enthusiastic tone. %%
```

**Key points:**

- French original in `%% ... %%` comment before Czech text
- Glossary links use path to `_original/_glossary/`
- TR comments document translation decisions

## Translation Phases

### 1. Translation (TR)

- Translate from annotated French source, thinking about it paragraph by paragraph.
- Evaluate Czech sentence structure and word choice to best capture Marie's voice and the original layers of meaning and intent and attention. LAN and RSR comments in the original can guide you on what to pay attention to.
- Preserve Marie's voice and style and mood and intent, not just the literal meaning. This is a literary translation, not a technical one. The Czech should read as literature, as a czech Marie, not as a translation.
- Follow terminology established in `TranslationMemory.md` for consistency across entries - and take care of it too, launch subagent to updated it with new information as you translate.
- Add TR comments for non-obvious choices and thinking process.
- After finishing first pass of a paragraph (or several short ones) take a look at it again with fresh eyes - maybe a subagent can help with that, just a young czech native speaker, prompted in czech, with good literary sense and intuitive knowledge of how meanings change with small shifts in wording. Make improvements as needed.

**Frontmatter flag**: `translation_complete: true`

### 2. Gemini Review (GEM)

- Use Gemini skill to send things for fresh perspective and external review and feedback. This is a chance to catch things you might have missed and get suggestions for improvement.
- Check consistency and natural flow of Czech - the key point of view (and not just for Gemini, but definitely pass it on too) is "if this was said in Czech, would it be the best most natural way to say it to display a Czech version of Marie's layered meanings and implications - while noting that they are there and we need to express them.
- Suggest alternative phrasings

**Frontmatter flag**: `gemini_reviewed: true`

### 3. Editor Review (RED)

- Catch issues others have missed - because of being too involved or because of different perspective
- Check naturalness in Czech
- Verify accuracy against French
- Flag awkward phrasing
- Flag unnoticed implications or layers of meaning
- Notice chances to use existing glossary entries for tagging paragraphs everything readers might want to know more about, as well as
- Suggest improvements
- After nothing more remains to clarify or improve, run a final quality check, several finished entries at once, to notice continuation problems, consistency problems, and any remaining issues.

**Frontmatter flag**: `editor_approved: true`

### 4. Conductor Approval (CON)

- Final literary quality check
- Ensure Marie's voice preserved, every strand brushed and layers of meaning captured in Czech
- Every technical aspect of the translation, file format, footnotes, glossary links, TR comments, etc. is in order
- Approve or request revision from roles as needed - larger things via inline comments, smaller things by talking to agents directly

**Frontmatter flag**: `conductor_approved: true`

### Terminology Consistency

Check `TranslationMemory.md` for established translations of:

- Recurring phrases
- Character names and titles
- Places and institutions
- Period vocabulary

### Cultural Adaptation

- Keep French terms that add flavor (with footnotes)
- Adapt references for Czech readers
- Explain what needs explaining, preserve what should feel foreign

## Comment Types

| Code | Role            | Purpose                       |
| ---- | --------------- | ----------------------------- |
| TR   | Translator      | Translation decisions         |
| GEM  | Gemini          | External AI review notes      |
| RED  | Editor          | Quality notes, suggestions    |
| CON  | Conductor       | Approval, final notes         |
| KRR  | People initials | Notes from human colaborators |

## Progress Tracking

Each carnet has a `README.md` tracking:

- Translation/edit/approval counts
- TODOs (local and synced from original)
- Changelog

Use `/project-status cz 001` to check status.

## Common Tasks

### Translate an entry

```bash
/translator    # Invoke translator skill with entry path
```

### Review a translation

```bash
/editor        # Invoke editor skill
```

### Final approval

```bash
/conductor     # Invoke conductor skill
```

### Check what needs work

```bash
/project-status cz           # Overall Czech status
/project-status cz 001       # Carnet 001 status
```

### Record completed work

```bash
/project-status log cz 001 "Edited entries 1873-01-20 to 1873-01-25"
```

## Branch Strategy

Czech translations live on the `cz` branch:

- Regularly merge from `main` to get source updates
- Translation commits use format: `[cz-001] Description`

## Related Documentation

- `/src/_original/CLAUDE.md` - French source materials
- `/docs/INFRASTRUCTURE.md` - Progress tracking system
- `/.claude/skills/translator/SKILL.md` - Translator role
- `/.claude/skills/editor/SKILL.md` - Editor role
- `/.claude/skills/conductor/SKILL.md` - Conductor role

# Český překladatelský styl a gramatické pokyny

Tento dokument poskytuje specifické pokyny pro překlad deníku Marie Bashkirtseff do češtiny, včetně gramatických zásad relevantních pro literární překlad z francouzštiny do češtiny.

## Základní přístup

Překládáme do moderní češtiny, ale necháváme text vyznít jakoby starobyleji. Používáme českou interpunkci - uvozovky dole a nahoře, české formátování datumu, vysvětlivky pro věci a koncepty, které v ČR nemusí být známé.

Toto je literární překlad - cílem je zachytit ducha originálu a převést ho do přirozeně znějící češtiny. Nedrží se otrocky původního slovosledu, ale hledá způsob, jak vyjádřit myšlenky tak, jak by je vyjádřila česká autorka slovy a vyjadřovacími prostředky té doby. Zároveň text musí být srozumitelný a přitažlivý pro současného mladého čtenáře - používáme tedy archaičtější výrazy a tvary, ale ne natolik, aby text působil nepřirozeně nebo těžkopádně - a zároveň se nebojíme používat současný jazyk.

Při překladu se ptáme: "Jak by tuto myšlenku vyjádřil český autor píšící pro dnešní mladé čtenáře, kdyby chtěl zachovat atmosféru 19. století a všechny Mariiny implikace a vrstvy významu?"

## Formátování a poznámky

### Poznámky pod čarou

Máme jich několi typů - z originálu k nám prochází poznámky k věcem a jevům, které nevyužijí vlastní záznam v rejstříku, ale přesto je potřeba je vysvětlit českému čtenáři, a poznámky vysvětlující překladatelská rozhodnutí. Tyto poznámky označujeme jako "Pozn. překl." a jsou umístěny pod čarou. Poznámky redaktora "Pozn. red.", obsahují připomínky k textu od redaktora - může se to týkat možností významu, výzkumu.

Poznámky označujeme následovně:

- Pozn. aut.: (poznámky autorky - jen pokud byly přímo v textu deníku, nic nedomýšlíme)
- Pozn. překl.: (poznámky překladatele)
- Pozn. red.: (poznámky redaktora)

```markdown
Toto je text s poznámkou pod čarou[^01.01.1].

[^01.01.1]: Toto je obsah poznámky, kde 01.01.1 představuje kniha.odstavec.číslo_poznámky.
```

### Interpunkce

- Používáme české uvozovky: „text”
- Pro citaci v citaci používáme: „text ‚vnitřní citace’ text”
- Pomlčky používáme s mezerami: text – text
- Data formátujeme podle českého úzu: 11. ledna 1873
- Používáme českou desetinnou čárku (ne tečku): 3,14
- Pro oddělení tisíců používáme mezery: 10 000 (ne 10,000)

## Gramatické zásady

### Slovesné časy

- Používáme minulý čas odpovídající narativnímu kontextu
- Dbáme na správný vid (dokonavý vs. nedokonavý) pro vyjádření dokončených nebo probíhajících dějů
- Příklad: "Je suis allée" → "Šla jsem" (nedokonavý) nebo "Zašla jsem" (dokonavý)
- Když Marie píše v přítomném čase pro navození bezprostřednosti, zachováváme to i v češtině

### Pády podstatných jmen

- Zajišťujeme správné skloňování jmen a míst podle české gramatiky
- Zahraniční jména skloňujeme podle českých vzorů, pokud jsou zavedené
- Pro méně běžná zahraniční jména používáme vhodné vzory skloňování podle koncových hlásek

### Zájmena

- Čeština často vynechává osobní zájmena, když je podmět jasný z kontextu
- Používáme zájmena pro zdůraznění nebo vyjasnění, když je to potřeba
- Věnujeme pozornost rozlišení tykání/vykání na základě vztahu mezi mluvčími

## Terminologie a postavy

Vždy mít připravený `src/cz/TranslationMemory.md` ke čtení i doplňování.

## Kulturní reference a adaptace

- Reálie, události a osobnosti které mohou být (nejen českému) čtenáři neznámé, by měly mít vlastní záznam v rejstříku/glosáři, a měly by být součástí původního textu - pokud nejsou, jde se v komentáři ozvat o doplnění záznamu do glosáře a odkazu k odstavci.
- Francouzské šlechtické tituly používáme v českých ekvivalentech: duc → vévoda, comte → hrabě - materiál pro `TranslationMemory.md`
- Francouzské výrazy můžeme někdy ponechat v originále s překladem v poznámkách pod čarou, pokud dodávají dobový kolorit - ale ne příliš často, aby text nebyl pro českého čtenáře těžkopádný.

## Jazykové zvláštnosti

### Archaické výrazy

Používáme mírně archaické výrazy pro navození atmosféry 19. století, ale text musí zůstat srozumitelný. Příklady vhodných archaických prvků:

- Občasné použití přechodníků, pokud nezní příliš těžkopádně
- Starší varianty slov, které jsou stále srozumitelné (např. "byl bych býval" místo moderního "byl bych")
- Formálnější slovosled v některých pasážích - zvlášť, když Marie zrovna zvýšenou formalitu používá
- Mírně archaická slovní zásoba, ale ne na úkor srozumitelnosti

### Idiomatické výrazy a oslovení

- Překládáme význam spíše než doslovně, chceme, aby to bylo čtivé, a používalo přirozený český slovosled
- Hledáme české ekvivalenty, které vyjadřují stejný pocit a dobu
- Používáme dobově vhodná česká oslovení místo přímého překladu francouzských

## Tón a hlas

Marie Bashkirtseff píše emotivně, často dramaticky a s velkým zaujetím. Její hlas by měl v překladu zůstat zachován - včetně jejích nadšení, zklamání, hněvu a dalších silných emocí. Zároveň je třeba zachovat její inteligenci, sečtělost a schopnost sebereflexe. Žádný obrat není napsaný jen tak, každý má svůj důvod a význam, a vše by se mělo v překladu zrcadlit, i kdyby to bylo třeba o půl věty jinde.
