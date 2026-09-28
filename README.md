# Cours d'IA du Master LGC

Site du cours **Intelligence artificielle** du Master Littérature Générale et Comparée (semestre 3, Unité d'Enseignement Transversale, Université Yahia Farès, Médéa, 2025–2026), et **Lumineux**, le système de design qui le met en forme.

Le programme officiel de la matière tient en trois pages : des intitulés de chapitres, cinq sujets de mini-projet, une liste d'exercices. Le site le développe en entier : chaque notion est expliquée, les exercices du TD sont corrigés, les sujets de mini-projet sont découpés en étapes avec un code de départ, et quatre démonstrations interactives permettent d'essayer les algorithmes.

## Contenu

| Dossier | Rôle |
| --- | --- |
| `docs/` | Le site statique, prêt pour GitHub Pages (`index.html`, `systeme-de-design.html`, `assets/`). |
| `docs/_sources/` | Les sources des pages : gabarit et un fragment HTML par partie du cours ; `docs/_sources/en/` pour l'anglais, `docs/_sources/ar/` pour l'arabe. |
| `docs/_sources/diapos/` | Les diaporamas, un fichier JSON par séance (`en/` et `ar/` pour les traductions). |
| `docs/assets/vendor/` | sql.js (SQLite dans le navigateur) et PptxGenJS (export PowerPoint), copiés pour marcher hors ligne. |
| `donnees/` | Créé au premier usage de « Mes groupes » : la base `classe.sqlite` et ses sauvegardes. Jamais dans git. |
| `design-system/` | Lumineux : jetons (`tokens.json`), guide d'usage (`README.md`), audit du code d'origine (`extraction.md`), composants (`composants/<Nom>/README.md` et `apercu.html`). |
| `tools/` | Scripts Python sans dépendance : construction du site, lancement local (`lancer.py`), vérification des bibliothèques (`verifier_bibliotheques.py`). |
| `run.bat` | Tout-en-un pour Windows : téléchargement, installation, lancement. |
| `requirements.txt`, `requirements-deep.txt` | Bibliothèques Python du cours. |
| `ليان ليان/` | Les démos d'origine (« Cadre Lumineux », menu capsule, slider) dont Lumineux est tiré. Conservées telles quelles. |

## Le site

- **En français, en anglais et en arabe** : `docs/index.html` (FR), `docs/en/index.html` (EN) et `docs/ar/index.html` (AR, de droite à gauche), avec un sélecteur FR / EN / عربي qui garde la leçon en cours.
- **Guide de l'enseignant** (`docs/enseignant.html`, et `en/`, `ar/`) : par où commencer (même sans avoir jamais programmé), carte du cours, progression semaine par semaine, fiches de séance prêtes à l'emploi, activités pour la classe, sujet d'examen corrigé et grilles d'évaluation, charte d'usage de l'IA, bibliothèque de ressources classées.
- **Diaporamas** (`docs/diaporamas.html`) : un « PowerPoint » dans le site, une présentation par fiche de séance (8) et une pour lancer le mini-projet, en trois langues, 181 diapositives chacune. Vue normale avec vignettes et notes de l'enseignant ; projection plein écran (flèches, clic, points qui apparaissent un à un, réponses à dévoiler, minuteur pour les activités, écran noir) ; mode présentateur dans une seconde fenêtre (notes, diapositive suivante, chronomètre) ; téléchargement en PowerPoint (`.pptx`, modifiable) ou en PDF.
- **Mes groupes** (`docs/classe.html`) : la classe de l'enseignant. Six groupes au départ (nom, horaire, salle, sujet du mini-projet, couleur) ; les étudiants, saisis un par un ou collés depuis Excel, déplacés d'un groupe à l'autre par glisser-déposer ; une fiche par étudiant avec des observations datées, ses présences et ses notes ; pour chaque groupe, le planning des séances (généré d'après la progression du guide, puis modifiable : dates, horaires, sujets, « Décaler » pour repousser toutes les séances suivantes) et le cahier de textes (ce qui a été fait, travail donné, appel) ; les évaluations et les moyennes ; une feuille d'émargement imprimable ; exports CSV pour Excel.
- **Accueil** : un lecteur de sentiments à lexique, à essayer sur une phrase (méthode du sujet 1).
- **Comment apprendre ce cours** : habitudes de travail qui marchent, semaine type, méthode par chapitre, vocabulaire français–anglais, bon usage d'un assistant d'IA, préparation de l'examen.
- **Fiche de la matière** et **calendrier** du semestre, avec renvois vers les parties du site.
- **Chapitre 1** : définitions, histoire de l'IA, IA faible et forte, apprentissage supervisé et non supervisé, approches, éthique.
- **Chapitre 2** : Python pour les textes (types, listes, dictionnaires, NumPy, pandas, objets, fichiers, rapports Excel et PDF).
- **Chapitre 3** : systèmes experts, apprentissage automatique, algorithmes (régression, descente de gradient, classification, k-moyennes), apprentissage profond et Transformers, apprentissage par renforcement. Démonstrations du chaînage avant, de la descente de gradient et des k-moyennes.
- **Mini-projet** : les cinq sujets, avec démarche, données, code de départ et livrables.
- **TD / TP corrigés**, **tables rondes**, **références** et **glossaire** (français–anglais ; arabe–français–anglais dans la version arabe).

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

**Où sont les données de « Mes groupes » ?** Lancé par `run.bat`, le site les enregistre dans une base SQLite ordinaire, `donnees\classe.sqlite`, dans le dossier du projet, avec une copie de sauvegarde par jour dans `donnees\sauvegardes\` (les 60 dernières). Le serveur n'écoute que sur cet ordinateur (127.0.0.1) et vérifie l'origine des requêtes ; `git pull` ne touche jamais ce dossier. Si le site est ouvert autrement (fichier ouvert directement, GitHub Pages), la base reste dans le navigateur : la page le signale, et l'onglet « Données » permet de télécharger la base ou d'en importer une. La base se lit aussi avec Python : `pandas.read_sql("SELECT * FROM etudiant", sqlite3.connect("donnees/classe.sqlite"))`.

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
python3 tools/assembler.py             # docs/_sources/ → docs/index.html, docs/en/ et docs/ar/ (diaporamas compris)
python3 tools/diapos.py --verifier docs/_sources/diapos/seance-1.json   # vérifie un diaporama
```

Un diaporama est un fichier JSON : un titre, puis une liste de diapositives typées (`titre`, `points`, `deux`, `definition`, `citation`, `code`, `tableau`, `etapes`, `question`, `activite`, `chiffre`, `chronologie`, `fin`), chacune avec ses `notes` pour l'enseignant. Le détail des champs est en tête de `tools/diapos.py`.

Pour voir le site en local : `python3 tools/lancer.py` (ou `python3 -m http.server --directory docs`, puis `http://localhost:8000`).

Pour le publier avec GitHub Pages : *Settings → Pages → Deploy from a branch*, branche `main`, dossier `/docs`. Le site sera alors à l'adresse `https://progremer04.github.io/canva-au-for-ang-/`.

Dépôt : [github.com/Progremer04/canva-au-for-ang-](https://github.com/Progremer04/canva-au-for-ang-).

## Source

Programme officiel de la matière « Intelligence artificielle », Master Littérature Générale et Comparée, Université Yahia Farès, Médéa, année universitaire 2025–2026 (pages 84 à 86 de l'offre de formation). Les explications, exemples et corrigés du site accompagnent le cours de l'enseignant et ne le remplacent pas.
