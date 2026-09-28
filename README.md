# AI Course of the Master LGC

Website of the **Artificial Intelligence** course of the Master in General and Comparative Literature (semester 3, cross-disciplinary teaching unit, Université Yahia Farès, Médéa, 2025–2026), and **Lumineux**, the design system that styles it.

The official syllabus of the course fits on three pages: chapter titles, five mini-project topics, a list of exercises. The site develops all of it: every notion is explained, the tutorial (TD) exercises come with worked solutions, the mini-project topics are broken down into steps with starter code, and four interactive demos let students try the algorithms.

## Contents

| Folder | Role |
| --- | --- |
| `docs/` | The static site, ready for GitHub Pages: `index.html` (home), `cours.html` (the course), `enseignant.html`, `diaporamas.html`, `classe.html`, `programme.html`, `systeme-de-design.html`, `assets/`; the same pages in `en/` and `ar/`. |
| `docs/_sources/` | Page sources: a template and one HTML fragment per part of the course; `docs/_sources/en/` for English, `docs/_sources/ar/` for Arabic. |
| `docs/_sources/diapos/` | The slide decks, one JSON file per session (`en/` and `ar/` for the translations). |
| `docs/notebooks/` | Ten complete Jupyter notebooks, ready to run in Google Colab or with `run.bat notebook`, in French (`fr/`) and English (`en/`). |
| `docs/assets/vendor/` | sql.js (SQLite in the browser) and PptxGenJS (PowerPoint export), copied so that they work offline. |
| `donnees/` | Created the first time “My groups” is used: the `classe.sqlite` database and its backups. Never in git. |
| `design-system/` | Lumineux: tokens (`tokens.json`), usage guide (`README.md`), audit of the original code (`extraction.md`), components (`composants/<Name>/README.md` and `apercu.html`). |
| `tools/` | Dependency-free Python scripts: site build, local launcher (`lancer.py`), library check (`verifier_bibliotheques.py`). |
| `run.bat` | All-in-one for Windows: download, install, launch. Also starts the site on Linux (`bash run.bat`, used by Render). |
| `render.yaml` | Render settings (see [Hosting](#hosting)). |
| `requirements.txt`, `requirements-deep.txt` | Python libraries of the course. |
| `ليان ليان/` | The original demos (“Cadre Lumineux”, capsule menu, slider) that Lumineux is drawn from. Kept as they are. |

## The site

- **Home** (`index.html`): a light page that leads to everything, in two blocks of tiles, “For students” (course, study method, TD/TP, mini-project, notebooks, glossary) and “For the teacher” (My groups, slides, guide, language students, official syllabus, session plans). It shows the next session and the last slide deck opened right away, and preloads the rest while the page is idle. Old links (`index.html#chapitre-3`) are redirected to the course.
- **In French, English and Arabic**: the course is in `docs/cours.html` (FR), `docs/en/cours.html` (EN) and `docs/ar/cours.html` (AR, right to left), with an FR / EN / عربي switch that keeps the current lesson.
- **Official syllabus** (`programme.html`, for the teacher, not indexed): the full text of the course description (training offer, pages 84 to 86), reproduced unchanged, with faithful translations into English and Arabic.
- **Teacher's guide** (`docs/enseignant.html`, and `en/`, `ar/`): where to start (even without any programming experience), course map, week-by-week progression, ready-to-use session plans, classroom activities, exam paper with answers and grading rubrics, AI use policy, library of sorted resources.
- **Slides** (`docs/diaporamas.html`): a “PowerPoint” inside the site, one deck per session plan (8) and one to launch the mini-project, in three languages, 181 slides each. Normal view with thumbnails and teacher's notes; full-screen projection (arrow keys, click, bullet points that appear one by one, answers to reveal, timer for activities, black screen); presenter view in a second window (notes, next slide, stopwatch); download as PowerPoint (`.pptx`, editable) or PDF.
- **Lesson 1: from automaton to agent** (`docs/chapitr1_first_lesson.html`): the history of AI, from ancient automata to today's agents, in 63 animated slides in a single file, in French, English and Arabic (FR / EN / عربي buttons, or `?lang=en`, `?lang=ar`). Portraits (Babbage, Lovelace, Turing, McCarthy, Hinton…), timelines, animated diagrams, three illustrated slides that show how a Transformer turns text into numbers (tokens and vectors, the map of meanings, context and attention), the ELIZA dialogue, quizzes to reveal, and the two YouTube documentaries it draws on ([*The Complete History of AI*](https://www.youtube.com/watch?v=Xl-G6Mv-N0A), [*The Entire History of Artificial Intelligence*](https://www.youtube.com/watch?v=mSd9nmPM7Vg)), started with one click.
  - **Slide show:** the “Slide show” button or `F5` (from the start), `Shift+F5` or `F` (from the current slide) gives a full-screen slide show like PowerPoint, with no bar or button. Click, arrow keys, mouse wheel, `N`/`P` to move forward or back, a number then `Enter` to jump to a slide, `B` black screen, `W` white screen, `G` all slides, an end screen after the last slide, `Esc` to quit; small controls appear at the bottom only when the mouse moves.
  - **Presenter view:** `S` (or `Alt+F5`) opens a second window for you alone (notes, quiz answers, next slide, stopwatch, clock, black screen) that moves with the projection; set the display to “Extend” (Windows + P). The teacher's notes never appear on the projected screen, and they are encrypted in the file: the presenter window asks for the password (to change it: `python3 tools/lecon1.py --mot-de-passe NEW_PASSWORD`). `O` overview, `P` PDF, `T` theme, `L` language.
  - **Photos:** the 18 real photos (Babbage, Lovelace, Turing, the ENIAC, McCarthy, Shakey, Deep Blue, Hinton, al-Jazari, the Pascaline…) come from Wikimedia Commons, with their author and licence on each photo. If a Commons file has been renamed or deleted, the page asks the Wikimedia API for the main image of the matching Wikipedia article. The copies in `docs/_sources/lecon1/photos/` are embedded in the file and show offline: `python3 tools/lecon1.py --photos` downloads them all (an Internet connection is needed), and the GitHub workflow “Photos de la leçon 1” (`.github/workflows/photos-lecon1.yml`, Actions tab, “Run workflow”) does the same on GitHub's servers. With no connection and no copy, a drawn illustration replaces the photo.
- **Language students** (teacher's guide, `#guide-langues`): teaching AI and code to students of English, General and Comparative Literature (LGC) and didactics. ANG and LGC follow the same program, code included: every example is read, predicted, run, modified, then rewritten, and they type the code of the TD and TP; DID follows the same progression and may stick to reading and running the notebooks (PRIMM approach). No-code tools for each chapter, data for each specialty, a model session, assessment of code and of interpretation.
- **Ready-to-run notebooks** (`docs/notebooks/`): getting started with Python, the five mini-project topics (sentiment, questionnaire, speeches, prediction, networks), expert system, machine learning, generative AI, and a toolbox for the language classroom (readability, cloze texts, vocabulary profile). Data included, nothing to download.
- **My groups** (`docs/classe.html`): the teacher's class.
  - **Groups:** six groups to start with, those of the 2025–2026 timetable (M02 ANG ×2 on Tuesday, M02 LGC on Tuesday, M02 DID ×3 on Thursday, Labo 02), with specialty, day, time, room, mini-project topic and colour, and a weekly “Timetable” view.
  - **Students:** entered one by one or pasted from Excel, moved from one group to another by drag and drop; one record per student with dated observations, attendance and grades.
  - **Sessions:** for each group, the session schedule (generated from the guide's progression, for one group or all at once, each on its own day, then editable: dates, times, topics, “Shift” to push back all later sessions) and the class log (what was done, homework, roll call); assessments and averages; a printable sign-in sheet; CSV exports for Excel.
  - **Attendance tab:** today's roll call in one gesture (everyone present by default, tap the absent students, add a student on the spot, the session is marked “done”), a banner that recalls the current session, forgotten roll calls, the register for the year (by semester or by month: presences, absences, excused absences, late arrivals, attendance rate), automatic alerts with adjustable thresholds (by default: warning at 2 unexcused absences, exclusion at 3, or at 5 absences in total, counted over the semester) and a summary of all groups.
  - **The year:** “Prepare the year” creates the sessions of the ten months at once, each group on its own day and time, skipping holidays and public holidays (editable list); “Change the schedule” moves the planned sessions from a given date (changing a group's day or time also offers it).
- **Home page demo**: a lexicon-based sentiment reader to try on a sentence (the method of topic 1).
- **How to learn this course**: study habits that work, a model week, a method for each chapter, French–English vocabulary, good use of an AI assistant, exam preparation.
- **Course sheet** and semester **calendar**, with links to the parts of the site.
- **Chapter 1**: definitions, history of AI, weak and strong AI, supervised and unsupervised learning, how an AI “understands” a text (explained simply, without code), approaches, ethics.
- **Chapter 2**: how to phrase a request to an AI assistant (prompt engineering, workshop in the TD), then Python for texts (types, lists, dictionaries, NumPy, pandas, objects, files, Excel and PDF reports).
- **Chapter 3**: expert systems, machine learning, algorithms (regression, gradient descent, classification, k-means), deep learning and Transformers, reinforcement learning. Demos of forward chaining, gradient descent and k-means.
- **Mini-project**: the five topics, with method, data, starter code and deliverables.
- **TD / TP with solutions**, **round tables**, **references** and **glossary** (French–English; Arabic–French–English in the Arabic version).

Night theme (default) or Day theme, readable on a phone, keyboard-navigable, animations turned off when the system asks for it.

**Fast, even offline.** Fonts, code highlighting, SQLite and PowerPoint are served by the site itself (`docs/assets/fonts`, `docs/assets/vendor`): no request to any other server (only the photos and videos of lesson 1 come from the Internet, and the lesson works without them offline). Long pages only draw the visible sections (`content-visibility`): the course displays about three times faster on a slow computer, and links to a section land in the right place. Slide thumbnails are only drawn when on screen. The `run.bat` server lets the browser keep files and only sends what has changed.

## Lumineux, the design system

Drawn from the demos in the `ليان ليان/` folder: the five-colour gradient (`#FFFF00`, `#87CEEB`, `#ff512f`, `#dd2476`, `#1c64ff`), the `#151515` background, the 20, 27 and 70 px radii, the white glows, the IM Fell DW Pica SC typeface. `design-system/extraction.md` details every value found and the defects fixed (fixed heights, title contrast, invalid CSS declarations, flickering, accessibility).

Fifteen components: seven taken from the demos (`CadreLumineux`, `PastilleTitre`, `BoutonVerre`, `RailCapsule`, `Tiroir`, `Carrousel`, `AnneauPortrait`) and eight added for a course website (`Bouton`, `Encadre`, `Puce`, `BlocCode`, `Exercice`, `Quiz`, `Chronologie`, `Tableau`). All of them can be seen live in `docs/systeme-de-design.html`.

## Running the project on Windows: `run.bat`

Double-click `run.bat`. It does everything, in order:

1. **Downloads the project** if it is alone in its folder (with `git`, otherwise GitHub's ZIP archive), or **updates** it (`git pull`).
2. **Finds Python 3** (3.12 preferred); if it is missing, installs it with `winget`.
3. **Installs the course libraries** in a private `.venv` environment (first time only, several hundred MB): NumPy, pandas, matplotlib, seaborn, scikit-learn, spaCy and its French model, gensim, NetworkX, TextBlob, VADER, WordCloud, Tweepy, GeoPandas, Jupyter, then Transformers and PyTorch.
4. **Opens the site** in the browser (`http://127.0.0.1:8000`). Close the window to stop it.

`run.bat` is enough on its own: copy it into an empty folder and double-click it, and it downloads the project next to itself (folder `canva-au-for-ang-`).

**Where is the “My groups” data?** When started by `run.bat`, the site saves it in an ordinary SQLite database, `donnees\classe.sqlite`, in the project folder, with one backup copy per day in `donnees\sauvegardes\` (the last 60). The server only listens on this computer (127.0.0.1) and checks where requests come from; `git pull` never touches this folder. If the site is opened another way (file opened directly, GitHub Pages, Render), the database stays in the browser: the page says so, and the “Data” tab lets you download the database or import one. The database can also be read with Python: `pandas.read_sql("SELECT * FROM etudiant", sqlite3.connect("donnees/classe.sqlite"))`.

| Command | Effect |
| --- | --- |
| `run.bat` | everything: download or update, install (once), site |
| `run.bat site` | only opens the site |
| `run.bat install` | (re)installs the course's Python libraries |
| `run.bat notebook` | opens Jupyter Notebook in the project folder |
| `run.bat check` | lists the installed libraries |
| `run.bat build` | rebuilds the site from `docs/_sources`, then opens it |

Without Python, `run.bat` still opens the site directly from `docs/index.html`. The first time a downloaded file is run, Windows may show “Windows protected your PC”: *More info → Run anyway*.

On macOS or Linux: `python3 tools/lancer.py` opens the site, and `python3 -m pip install -r requirements.txt -r requirements-deep.txt` installs the libraries.

## Hosting

The site is already built in `docs/`: a host only has to serve that folder. Every push to `main` updates it.

### GitHub Pages (free, recommended)

*Settings → Pages → Build and deployment → Source: Deploy from a branch*, branch `main`, folder `/docs`, then *Save*. After a minute or two the site is at `https://progremer04.github.io/canva-au-for-ang-/`, and each push to `main` republishes it. `docs/.nojekyll` makes Pages serve the files exactly as they are.

GitHub Pages builds, like the photo workflow, run on GitHub Actions. If a run fails at once with *“The job was not started because your account is locked due to a billing issue”*, fix the billing problem in GitHub (*Settings → Billing and plans*) first: until then, no workflow and no Pages build can run.

### Render

The Render web service `canva-au-for-ang-` is connected to this repository and redeploys on every push to `main` (*Auto-Deploy: On Commit*).

- **Start Command:** `bash run.bat` works: on Linux, the first line of `run.bat` starts `python3 tools/lancer.py --public` (Windows ignores that line). `python tools/lancer.py --public` works too.
- **Build Command:** `python --version` is enough and takes a few seconds; `pip install -r requirements.txt` also works, but installs the TP libraries for nothing on every deploy.
- **Deploys that fail within a second** with *“Your workspace has run out of pipeline minutes”*: the build minutes of the Render workspace are used up. In *Workspace Settings → Build Pipeline*, choose *Starter* (free minutes included) or raise the spending limit of the *Performance* pipeline, then *Manual Deploy → Deploy latest commit*.
- **New service:** *New → Blueprint*, then this repository; `render.yaml` holds these settings.

On Render (variable `RENDER`) or with `--public`, `tools/lancer.py` listens on `0.0.0.0` on the port given by `PORT`, without opening a browser. The “My groups” database API is turned off there: on a public site, each visitor keeps their own data in their browser, and the teacher's database stays on their computer (`run.bat`).

## Building

```sh
python3 tools/build_tokens.py          # design-system/tokens.json → docs/assets/css/lumineux-tokens.css
python3 tools/construire_systeme.py    # design-system/ → docs/systeme-de-design.html
python3 tools/assembler.py             # docs/_sources/ → docs/index.html, docs/en/ and docs/ar/ (slide decks included)
python3 tools/diapos.py --verifier docs/_sources/diapos/seance-1.json   # checks a slide deck
python3 tools/lecon1.py                # docs/_sources/lecon1/ → docs/chapitr1_first_lesson.html (also done by assembler.py)
```

A slide deck is a JSON file: a title, then a list of typed slides (`titre`, `points`, `deux`, `definition`, `citation`, `code`, `tableau`, `etapes`, `question`, `activite`, `chiffre`, `chronologie`, `fin`), each with its `notes` for the teacher. The fields are described at the top of `tools/diapos.py`.

To view the site locally: `python3 tools/lancer.py` (or `python3 -m http.server --directory docs`, then `http://localhost:8000`).

Repository: [github.com/Progremer04/canva-au-for-ang-](https://github.com/Progremer04/canva-au-for-ang-).

## Source

Official syllabus of the course “Artificial Intelligence”, Master in General and Comparative Literature, Université Yahia Farès, Médéa, academic year 2025–2026 (pages 84 to 86 of the training offer). The explanations, examples and solutions on the site accompany the teacher's course and do not replace it.
