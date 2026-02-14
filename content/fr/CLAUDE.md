# fr/ — Édition française annotée

Ce répertoire contient l'édition française annotée du journal de Marie Bashkirtseff.

## Philosophie éditoriale

Le français de Marie (années 1870-1880) est parfaitement lisible aujourd'hui. Ce n'est pas une traduction, c'est une **édition annotée** du texte original. L'intervention est minimale.

### Ce qu'on fait

1. **Traduire les passages non-français** — Marie parsème son journal de mots russes (translittérés), d'expressions anglaises, de latin, d'italien. Ces passages sont traduits directement en français dans le texte (le lecteur voit l'original en cliquant sur le paragraphe).
2. **Traduire les notes de bas de page** — Les notes existantes dans `_original/` sont en anglais (issues de la phase de recherche). Elles doivent être traduites en français naturel.
3. **Annoter pour le lecteur moderne** — Notes explicatives pour les personnes, lieux, événements, références culturelles (en puisant dans la recherche RSR de `_original/`).
4. **Corriger les erreurs de transcription** — Quand `_original/` contient des lectures douteuses du manuscrit, on corrige avec un commentaire FRE.
5. **Liens vers le glossaire** — Mêmes liens `[#Entity]` que dans les autres langues.

### Ce qu'on ne fait PAS

- **On ne modernise pas sa prose.** Marie écrit magnifiquement ; son style est le texte.
- **On ne normalise pas l'orthographe d'époque** sauf quand c'est clairement une erreur de transcription (pas un archaïsme).
- **On ne réécrit pas les tournures vieillottes** — elles font partie du charme et de l'authenticité.
- **On ne touche pas à sa ponctuation** sauf erreur manifeste de transcription.

## Structure

```
fr/
├── CLAUDE.md            # Ce fichier
├── PROGRESS.md          # État d'avancement global
│
├── 000/                 # Préface éditée
│   └── README.md        # Avancement du carnet
├── 001/-106/            # Entrées éditées
│   └── README.md        # Avancement par carnet
```

## Format des fichiers

Les fichiers fr/ reprennent le texte original, avec commentaires uniquement là où il y a un changement ou une annotation.

```markdown
---
date: 1873-01-11
carnet: "001"
location: Nice
edition_complete: true
entities:
  people: [Howard_family]
  places: [Nice, Promenade_des_Anglais]
para_start: 1
para_end: 7
---

%% 001.0001 %%
%% [#Nice](../../_original/_glossary/places/cities/NICE.md) %%
Samedi 11 janvier 1873. Il fait un temps superbe...

%% 001.0002 %%
Il est sur le point de tomber amoureux de moi.
%% 2026-02-14T10:00:00 FRE: "on his way to fall in love with me" dans l'original — code-switch anglais traduit %%
```

## IMPORTANT : Instructions pour les agents

### Chemins des glossaires

Les liens glossaire dans `_original/` utilisent `../_glossary/`. Dans `fr/`, le chemin correct est **`../../_original/_glossary/`**.

**Règle** : Remplacer systématiquement `../_glossary/` par `../../_original/_glossary/` dans tous les liens glossaire.

### Contenu à supprimer

Supprimer de la sortie fr/ :
- Tous les commentaires RSR (`%% ... RSR: ... %%`)
- Tous les commentaires LAN (`%% ... LAN: ... %%`)
- Le bloc `workflow:` du frontmatter
- Les flags : `research_complete`, `linguistic_annotation_complete`, `kernberger_covered`, `empty_in_source`

### Contenu à conserver et adapter

- **Paragraph IDs** (`%% XXX.YYYY %%`) — conserver tels quels
- **Liens glossaire** (`%% [#...] %%`) — conserver en corrigeant le chemin (voir ci-dessus)
- **Notes de bas de page** (`[^XX.YY.Z]`) — traduire en français si elles sont en anglais
- **Texte français** — copier VERBATIM, ne rien modifier
- **Frontmatter** : garder date, entry_id, carnet, location, entities, para_start, para_end. Ajouter `edition_complete: true`.

### Traitement des passages non-français

**CRUCIAL** : Avant de produire le fichier fr/, lire les commentaires LAN dans l'original pour repérer les passages non-français. Les marqueurs sont :
- `LAN: ENGLISH:` ou `LAN: CODE-SWITCH ENGLISH:`
- `LAN: RUSSIAN:`
- `LAN: LATIN:`
- `LAN: ITALIAN:`

Quand un passage non-français est identifié :
1. Le traduire en français naturel directement dans le texte
2. Ajouter un commentaire FRE documentant le changement : `%% 2026-XX-XXT00:00:00 FRE: "texte original" — traduit du [langue] %%`

## Phases éditoriales

### 1. Édition (FRE)

- Copier le texte depuis `_original/`
- Corriger les chemins glossaire (`../_glossary/` → `../../_original/_glossary/`)
- Identifier et traduire les passages non-français (en se basant sur les commentaires LAN)
- Traduire les notes de bas de page anglaises en français
- Corriger les erreurs de transcription manifestes (avec commentaire FRE)
- Supprimer les commentaires RSR/LAN

**Flag frontmatter** : `edition_complete: true`

### 2. Révision (REV)

- Vérifier la cohérence des annotations
- S'assurer que les notes sont utiles sans être envahissantes
- Vérifier contre l'original
- Contrôle final

**Flag frontmatter** : `review_complete: true`

## Types de commentaires

| Code | Rôle     | Objet                                              |
| ---- | -------- | -------------------------------------------------- |
| FRE  | Éditeur  | Décisions éditoriales, corrections, traductions     |
| REV  | Réviseur | Notes de révision, vérifications                   |
| KRR  | Humain   | Notes des collaborateurs humains                   |

## Notes de bas de page

Format : `[^CC.PP.N]` où CC = carnet, PP = paragraphe, N = numéro de note.

Types de notes :
- **Contexte historique** : Explications pour le lecteur moderne
- **Personnes et lieux** : Identification quand le glossaire ne suffit pas
- **Notes de l'éditeur** : « N.d.É. : ... » pour les interventions éditoriales

**IMPORTANT** : Les notes dans `_original/` sont souvent en anglais (issues de la phase RSR). Les traduire en français naturel pour l'édition fr/.

## Traitement des langues étrangères

Marie utilise régulièrement :

- **Russe** (translittéré) : « Moussia », « plachtchanitsa », « Diadia » — termes familiaux, religieux, culturels
- **Anglais** : « gentleman », « bustle », « God save the Queen » — code-switching pour l'emphase ou le prestige
- **Latin** : citations, expressions mock-latines — culture classique et humour
- **Italien** : termes musicaux, expressions — culture artistique

**Approche** : Traduire directement en français dans le texte. Le lecteur peut toujours cliquer sur un paragraphe pour voir l'original — inutile donc de conserver le mot étranger. On traduit tout, y compris les anglicismes courants comme « gentleman » → « ce monsieur » ou équivalent contextuel. Une note de bas de page peut signaler que l'original était dans une autre langue si c'est pertinent pour le sens.

## Tâches courantes

### Vérifier l'avancement

```bash
/project-status fr           # État global français
/project-status fr 001       # Carnet 001
```

## Documentation liée

- `/content/_original/CLAUDE.md` — Texte source (transcription du manuscrit)
- `/content/_original/_glossary/` — Glossaire partagé
- `/docs/INFRASTRUCTURE.md` — Système de suivi
