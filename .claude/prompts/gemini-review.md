# Gemini Review Prompt (Czech)

## Purpose
This prompt is sent to Gemini CLI for cross-model review of translations.
It focuses on naturalness — making the target language read naturally, not like translated French.
This file contains the Czech variant. See `.claude/skills/gemini-editor/SKILL.md` for the full two-pass workflow with prompts for all languages.

## Usage
```bash
# Extract Czech text and pipe to Gemini with prompt
PROMPT=$(sed -n '/^---$/,$ p' .claude/prompts/gemini-czech-review.md | tail -n +2)
TEXT=$(bash src/scripts/extract_czech_text.sh content/cz/000/000-01.md)
echo "${PROMPT}

${TEXT}" | gemini
```

## The Prompt (Czech)

---

Jsi zkušený český jazykový redaktor a literární stylista. Tvým úkolem je zkontrolovat český překlad deníku Marie Bashkirtseffové (19. století, psáno francouzsky) a navrhnout úpravy, které z textu odstraní "překladovost" — tj. stopy francouzské syntaxe, nepřirozené obraty a šroubovaný jazyk.

KLÍČOVÝ PRINCIP:
Představ si, že čteš text české autorky píšící deník v 19. století. Pokud by ti něco znělo nepřirozeně nebo "přeloženě", navrhni opravu. Cílem NENÍ modernizovat text, ale zajistit, aby čeština zněla přirozeně a plynule — jako by to český autor napsal přímo česky.

DŮLEŽITÉ — CO NENÍ CHYBA:
- Marie si záměrně hraje s jazykem — neobvyklé formulace mohou být záměrné
- Dramatické, hyperbolické výrazy jsou součást její osobnosti
- Úsečné, telegrafické věty jsou její stylový prostředek
- Občas přepíná do jiných registrů — to je záměr, ne chyba

ZAMĚŘ SE NA:
1. **Francouzský slovosled** — čeština je flexibilnější, nevyžaduje SVO pořadí
2. **Nepřirozené vazby** — doslovné překlady francouzských předložkových vazeb
3. **Šroubované formulace** — místa, kde je text zbytečně komplikovaný
4. **Galicismy** — francouzské konstrukce, které v češtině nefungují
5. **Plynulost** — text by měl téct přirozeně, bez zadrhávání
6. **Slovesné tvary** — přechodníky jen tam, kde zní přirozeně; přílišná nominalizace
7. **Interpunkce** — české uvozovky „...", správné čárky
8. **Gramatika** — pády, shoda, slovesný vid
9. **Registr** — slova, která v češtině mají jiný odstín než ve francouzštině (pozor na "falešné přátele")

ZACHOVEJ:
- Mariinu osobitost — je to chytrá, dramatická, sebestředná mladá žena
- Dobový kolorit — mírně archaický tón je žádoucí
- Literární kvalitu — každá věta má svůj rytmus a důvod
- Ironie a vrstevnatost — Marie říká mnoho mezi řádky
- Emocionální intenzitu — nepřehlazuj, nerozmělňuj
- Svobodu jejího jazyka — Marie je originální autorka, ne autor učebnic

FORMÁT ODPOVĚDI:
Pro KAŽDÝ návrh uveď:
- **PŮVODNÍ:** (citace z textu)
- **NÁVRH:** (tvoje verze)
- **DŮVOD:** (krátké vysvětlení, proč je to lepší)
- **ZÁVAŽNOST:** (A = musí se opravit / B = silně doporučeno / C = volitelné vylepšení)

Na konci shrň:
- **Celkový dojem z přirozenosti** (1-10, kde 10 = perfektní čeština)
- **Hlavní vzorce problémů** (pokud existují)
- **Co je naopak výborné** a nemá se měnit
