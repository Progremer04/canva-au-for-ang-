# Cours d'IA du Master LGC

Site du cours **Intelligence artificielle** du Master Littérature Générale et Comparée (semestre 3, Unité d'Enseignement Transversale, Université Yahia Farès, Médéa, 2025–2026), et **Lumineux**, le système de design qui le met en forme.

Le programme officiel de la matière tient en trois pages : des intitulés de chapitres, cinq sujets de mini-projet, une liste d'exercices. Le site le développe en entier : chaque notion est expliquée, les exercices du TD sont corrigés, les sujets de mini-projet sont découpés en étapes avec un code de départ, et quatre démonstrations interactives permettent d'essayer les algorithmes.

## Contenu

| Dossier | Rôle |
| --- | --- |
| `docs/` | Le site statique, prêt pour GitHub Pages (`index.html`, `systeme-de-design.html`, `assets/`). |
| `docs/_sources/` | Les sources des pages : gabarit et un fragment HTML par partie du cours. |
| `design-system/` | Lumineux : jetons (`tokens.json`), guide d'usage (`README.md`), audit du code d'origine (`extraction.md`), composants (`composants/<Nom>/README.md` et `apercu.html`). |
| `tools/` | Scripts de construction (Python 3, sans dépendance). |
| `ليان ليان/` | Les démos d'origine (« Cadre Lumineux », menu capsule, slider) dont Lumineux est tiré. Conservées telles quelles. |

## Le site

- **Accueil** : un lecteur de sentiments à lexique, à essayer sur une phrase (méthode du sujet 1).
- **Fiche de la matière** et **calendrier** du semestre, avec renvois vers les parties du site.
- **Chapitre 1** : définitions, histoire de l'IA, IA faible et forte, apprentissage supervisé et non supervisé, approches, éthique.
- **Chapitre 2** : Python pour les textes (types, listes, dictionnaires, NumPy, pandas, objets, fichiers, rapports Excel et PDF).
- **Chapitre 3** : systèmes experts, apprentissage automatique, algorithmes (régression, descente de gradient, classification, k-moyennes), apprentissage profond et Transformers, apprentissage par renforcement. Démonstrations du chaînage avant, de la descente de gradient et des k-moyennes.
- **Mini-projet** : les cinq sujets, avec démarche, données, code de départ et livrables.
- **TD / TP corrigés**, **tables rondes**, **références** et **glossaire** français–anglais.

Thème Nuit (par défaut) ou Jour, lisible sur téléphone, navigable au clavier, animations coupées si le système le demande.

## Lumineux, le système de design

Tiré des démos du dossier `ليان ليان/` : le dégradé à cinq couleurs (`#FFFF00`, `#87CEEB`, `#ff512f`, `#dd2476`, `#1c64ff`), le fond `#151515`, les rayons 20, 27 et 70 px, les lueurs blanches, la police IM Fell DW Pica SC. `design-system/extraction.md` détaille chaque valeur relevée et les défauts corrigés (hauteurs fixes, contraste du titre, déclarations CSS invalides, clignotement, accessibilité).

Quinze composants : sept repris des démos (`CadreLumineux`, `PastilleTitre`, `BoutonVerre`, `RailCapsule`, `Tiroir`, `Carrousel`, `AnneauPortrait`) et huit ajoutés pour un site de cours (`Bouton`, `Encadre`, `Puce`, `BlocCode`, `Exercice`, `Quiz`, `Chronologie`, `Tableau`). Tous sont visibles en direct dans `docs/systeme-de-design.html`.

## Construire

```sh
python3 tools/build_tokens.py          # design-system/tokens.json → docs/assets/css/lumineux-tokens.css
python3 tools/construire_systeme.py    # design-system/ → docs/systeme-de-design.html
python3 tools/assembler.py             # docs/_sources/ → docs/index.html
```

Pour voir le site en local : `python3 -m http.server --directory docs`, puis ouvrir `http://localhost:8000`.

Pour le publier avec GitHub Pages : *Settings → Pages → Deploy from a branch*, dossier `/docs`.

## Source

Programme officiel de la matière « Intelligence artificielle », Master Littérature Générale et Comparée, Université Yahia Farès, Médéa, année universitaire 2025–2026 (pages 84 à 86 de l'offre de formation). Les explications, exemples et corrigés du site accompagnent le cours de l'enseignant et ne le remplacent pas.
