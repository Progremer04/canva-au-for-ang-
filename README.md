# Cours d'IA du Master LGC

Site du cours **Intelligence artificielle** du Master Littérature Générale et Comparée (semestre 3, Unité d'Enseignement Transversale, Université Yahia Farès, Médéa, 2025–2026), et **Lumineux**, le système de design qui le met en forme.

Le programme officiel de la matière tient en trois pages : des intitulés de chapitres, cinq sujets de mini-projet, une liste d'exercices. Le site le développe en entier : chaque notion est expliquée, les exercices du TD sont corrigés, les sujets de mini-projet sont découpés en étapes avec un code de départ, et quatre démonstrations interactives permettent d'essayer les algorithmes.

## Contenu

| Dossier | Rôle |
| --- | --- |
| `docs/` | Le site statique, prêt pour GitHub Pages (`index.html`, `systeme-de-design.html`, `assets/`). |
| `docs/_sources/` | Les sources des pages : gabarit et un fragment HTML par partie du cours. |
| `design-system/` | Lumineux : jetons (`tokens.json`), guide d'usage (`README.md`), audit du code d'origine (`extraction.md`), composants (`composants/<Nom>/README.md` et `apercu.html`). |
| `tools/` | Scripts Python sans dépendance : construction du site, lancement local (`lancer.py`), vérification des bibliothèques (`verifier_bibliotheques.py`). |
| `run.bat` | Tout-en-un pour Windows : téléchargement, installation, lancement. |
| `requirements.txt`, `requirements-deep.txt` | Bibliothèques Python du cours. |
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

## Lancer le projet sous Windows : `run.bat`

Double-cliquez sur `run.bat`. Il fait tout, dans l'ordre :

1. **Télécharge le projet** s'il est seul dans son dossier (avec `git`, sinon l'archive ZIP de GitHub), ou le **met à jour** (`git pull`).
2. **Trouve Python 3** (3.12 de préférence) ; s'il manque, l'installe avec `winget`.
3. **Installe les bibliothèques du cours** dans un environnement privé `.venv` (première fois seulement, plusieurs centaines de Mo) : NumPy, pandas, matplotlib, seaborn, scikit-learn, spaCy et son modèle français, gensim, NetworkX, TextBlob, VADER, WordCloud, Tweepy, GeoPandas, Jupyter, puis Transformers et PyTorch.
4. **Ouvre le site** dans le navigateur (`http://127.0.0.1:8000`). Fermez la fenêtre pour l'arrêter.

`run.bat` suffit à lui seul : copiez-le dans un dossier vide et double-cliquez, il télécharge le projet à côté de lui (dossier `canva-au-for-ang-`).

| Commande | Effet |
| --- | --- |
| `run.bat` | tout : téléchargement ou mise à jour, installation (une fois), site |
| `run.bat site` | ouvre seulement le site |
| `run.bat install` | (ré)installe les bibliothèques Python du cours |
| `run.bat notebook` | ouvre Jupyter Notebook dans le dossier du projet |
| `run.bat check` | liste les bibliothèques installées |
| `run.bat build` | reconstruit le site depuis `docs/_sources`, puis l'ouvre |

Sans Python, `run.bat` ouvre quand même le site directement depuis `docs/index.html`. Au premier lancement d'un fichier téléchargé, Windows peut afficher « Windows a protégé votre ordinateur » : *Informations complémentaires → Exécuter quand même*.

Sur macOS ou Linux : `python3 tools/lancer.py` ouvre le site, `python3 -m pip install -r requirements.txt -r requirements-deep.txt` installe les bibliothèques.

## Construire

```sh
python3 tools/build_tokens.py          # design-system/tokens.json → docs/assets/css/lumineux-tokens.css
python3 tools/construire_systeme.py    # design-system/ → docs/systeme-de-design.html
python3 tools/assembler.py             # docs/_sources/ → docs/index.html
```

Pour voir le site en local : `python3 tools/lancer.py` (ou `python3 -m http.server --directory docs`, puis `http://localhost:8000`).

Pour le publier avec GitHub Pages : *Settings → Pages → Deploy from a branch*, branche `main`, dossier `/docs`. Le site sera alors à l'adresse `https://progremer04.github.io/canva-au-for-ang-/`.

Dépôt : [github.com/Progremer04/canva-au-for-ang-](https://github.com/Progremer04/canva-au-for-ang-).

## Source

Programme officiel de la matière « Intelligence artificielle », Master Littérature Générale et Comparée, Université Yahia Farès, Médéa, année universitaire 2025–2026 (pages 84 à 86 de l'offre de formation). Les explications, exemples et corrigés du site accompagnent le cours de l'enseignant et ne le remplacent pas.
