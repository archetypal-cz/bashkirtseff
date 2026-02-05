# Český překladatelský styl a gramatické pokyny

Tento dokument poskytuje specifické pokyny pro překlad deníku Marie Bashkirtseff do češtiny, včetně gramatických zásad relevantních pro literární překlad z francouzštiny do češtiny.

## Základní přístup

Překládáme do moderní češtiny, ale necháváme text vyznít jakoby starobyleji. Používáme českou interpunkci - uvozovky dole a nahoře, české formátování datumu, vysvětlivky pro věci a koncepty, které v ČR nemusí být známé.

Toto je literární překlad - cílem je zachytit ducha originálu a převést ho do přirozeně znějící češtiny. Nedrží se otrocky původního slovosledu, ale hledá způsob, jak vyjádřit myšlenky tak, jak by je vyjádřila česká autorka slovy a vyjadřovacími prostředky té doby. Zároveň text musí být srozumitelný a přitažlivý pro současného mladého čtenáře - používáme tedy archaičtější výrazy a tvary, ale ne natolik, aby text působil nepřirozeně nebo těžkopádně - a zároveň se nebojíme používat současný jazyk.

Při překladu se ptáme: "Jak by tuto myšlenku vyjádřil český autor píšící pro dnešní mladé čtenáře, kdyby chtěl zachovat atmosféru 19. století?"

## Formátování a poznámky

### Poznámky v textu

Poznámky označujeme následovně:
- Pozn. aut.: (poznámky autorky)
- Pozn. překl.: (poznámky překladatele)
- Pozn. red.: (poznámky redaktora)

### Interpunkce

- Používáme české uvozovky: „text” 
- Pro citaci v citaci používáme: „text ‚vnitřní citace’ text”
- Pomlčky používáme s mezerami: text – text
- Data formátujeme podle českého úzu: 11. ledna 1873
- Používáme českou desetinnou čárku (ne tečku): 3,14
- Pro oddělení tisíců používáme mezery: 10 000 (ne 10,000)

### Poznámky pod čarou

Poznámky pod čarou formátujeme podle obecných pokynů v `prompts/Style.md`, ale s českým označením:

```markdown
Toto je text s poznámkou pod čarou[^01.01.1].

[^01.01.1]: Toto je obsah poznámky, kde 01.01.1 představuje kniha.odstavec.číslo_poznámky.
```

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

- Reálie, události a osobnosti které mohou být českému čtenáři neznámé, při prvním setkání krátce shrneme v poznámce pod čarou s odkazem do _glossary/hashtag_for_that_topic.md
- Francouzské šlechtické tituly používáme v českých ekvivalentech: duc → vévoda, comte → hrabě
- Francouzské výrazy můžeme někdy ponechat v originále s překladem v poznámkách pod čarou, pokud dodávají dobový kolorit

## Jazykové zvláštnosti

### Archaické výrazy

Používáme mírně archaické výrazy pro navození atmosféry 19. století, ale text musí zůstat srozumitelný. Příklady vhodných archaických prvků:

- Občasné použití přechodníků, pokud nezní příliš těžkopádně
- Starší varianty slov, které jsou stále srozumitelné (např. "byl bych býval" místo moderního "byl bych")
- Formálnější slovosled v některých pasážích
- Mírně archaická slovní zásoba, ale ne na úkor srozumitelnosti

### Idiomatické výrazy a oslovení

- Překládáme význam spíše než doslovně, chceme, aby to bylo čtivé, a používalo přirozený český slovosled
- Hledáme české ekvivalenty, které vyjadřují stejný pocit a dobu
- Používáme dobově vhodná česká oslovení místo přímého překladu francouzských

## Tón a hlas

Marie Bashkirtseff píše emotivně, často dramaticky a s velkým zaujetím. Její hlas by měl v překladu zůstat zachován - včetně jejích nadšení, zklamání, hněvu a dalších silných emocí. Zároveň je třeba zachovat její inteligenci, sečtělost a schopnost sebereflexe.

%% 2025-04-05T15:09:10 PA: Aktualizovaný český překladatelský styl s gramatickými pokyny %%