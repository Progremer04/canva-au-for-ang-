#!/usr/bin/env python3
"""Assemble le site du cours à partir de docs/_sources/, en français, anglais et arabe.

  python3 tools/assembler.py
      → pour chaque langue (docs/, docs/en/, docs/ar/) : la page d'accueil (index.html), le cours
        (cours.html), le guide de l'enseignant (enseignant.html), les diaporamas (diaporamas.html,
        via tools/diapos.py), la page « Mes groupes » (classe.html) et le programme officiel
        (programme.html)

  python3 tools/assembler.py --autonome CHEMIN [--langue fr|en|ar] [--lien-systeme URL]
      → écrit une version en un seul fichier : CSS et JS intégrés,
        sans l'enveloppe <!DOCTYPE>/<html>/<head>/<body> (pour un hébergeur
        qui fournit lui-même ce squelette).

Sources : docs/_sources/<fragment>.html pour le français,
          docs/_sources/en/ et docs/_sources/ar/ pour l'anglais et l'arabe (mêmes id).
"""
import argparse
import re
from pathlib import Path

import diapos
import lecon1
import verrou

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources"

FRAGMENTS = ["methode", "chapitre-1", "chapitre-2", "chapitre-3", "mini-projet", "td-tp", "tables-rondes"]

# (cible, marque, {langue: libellé})
NAV = [
    ("accueil", "i-maison", {"fr": "Accueil", "en": "Home", "ar": "الرئيسية"}),
    ("fiche", "i-fiche", {"fr": "Fiche de la matière", "en": "Course card", "ar": "بطاقة المقياس"}),
    ("parcours", "i-calendrier", {"fr": "Calendrier", "en": "Calendar", "ar": "الرزنامة"}),
    ("methode", "i-boussole", {"fr": "Comment apprendre", "en": "How to learn", "ar": "كيف تتعلّم"}),
    ("chapitre-1", "1", {"fr": "Introduction à l'IA", "en": "Introduction to AI", "ar": "مدخل إلى الذكاء الاصطناعي"}),
    ("chapitre-2", "2", {"fr": "Python", "en": "Python", "ar": "بايثون"}),
    ("chapitre-3", "3", {"fr": "Types d'IA", "en": "Types of AI", "ar": "أنواع الذكاء الاصطناعي"}),
    ("mini-projet", "i-ampoule", {"fr": "Mini-projet", "en": "Mini-project", "ar": "المشروع المصغَّر"}),
    ("td-tp", "i-crayon", {"fr": "TD / TP corrigés", "en": "Solved TD / TP", "ar": "حلول TD / TP"}),
    ("tables-rondes", "i-bulle", {"fr": "Tables rondes", "en": "Round tables", "ar": "الموائد المستديرة"}),
    ("references", "i-livre", {"fr": "Références", "en": "References", "ar": "المراجع"}),
    ("glossaire", "Aa", {"fr": "Glossaire", "en": "Glossary", "ar": "المسرد"}),
    ("enseignant.html", "i-outil", {"fr": "Guide de l'enseignant", "en": "Teacher's guide", "ar": "دليل الأستاذ"}),
    ("diaporamas.html", "i-ecran", {"fr": "Diaporamas", "en": "Slides", "ar": "العروض التقديمية"}),
    ("classe.html", "i-groupe", {"fr": "Mes groupes", "en": "My groups", "ar": "أفواجي"}),
]

# Page « Guide de l'enseignant » : fragments et menu.
FRAGMENTS_GUIDE = ["guide-1", "guide-5", "guide-2", "guide-3", "guide-4"]
NAV_GUIDE = [
    ("cours.html", "i-retour", {"fr": "Retour au cours", "en": "Back to the course", "ar": "العودة إلى المقياس"}),
    ("guide-demarrer", "i-boussole", {"fr": "Par où commencer", "en": "Where to start", "ar": "من أين تبدأ"}),
    ("guide-carte", "i-carte", {"fr": "Carte du cours", "en": "Course map", "ar": "خريطة المقياس"}),
    ("guide-progression", "i-calendrier", {"fr": "Progression", "en": "Week-by-week plan", "ar": "الخطة الأسبوعية"}),
    ("guide-langues", "i-groupe", {"fr": "Étudiants de langues", "en": "Language students", "ar": "طلبة اللغات"}),
    ("guide-seances", "i-crayon", {"fr": "Fiches de séance", "en": "Lesson plans", "ar": "مذكرات الحصص"}),
    ("guide-activites", "i-bulle", {"fr": "Activités en classe", "en": "Classroom activities", "ar": "أنشطة القسم"}),
    ("guide-evaluation", "i-coche", {"fr": "Évaluation", "en": "Assessment", "ar": "التقييم"}),
    ("guide-ia", "i-ampoule", {"fr": "L'IA générative en classe", "en": "Generative AI in class", "ar": "الذكاء التوليدي في القسم"}),
    ("guide-ressources", "i-livre", {"fr": "Ressources", "en": "Resources", "ar": "المراجع والموارد"}),
    ("diaporamas.html", "i-ecran", {"fr": "Diaporamas", "en": "Slides", "ar": "العروض التقديمية"}),
    ("classe.html", "i-groupe", {"fr": "Mes groupes", "en": "My groups", "ar": "أفواجي"}),
    ("programme.html", "i-fiche", {"fr": "Programme officiel", "en": "Official syllabus", "ar": "البرنامج الرسمي"}),
]

# Pages outils (diaporamas, groupes) : menu du tiroir et textes d'en-tête.
NAV_OUTILS = [
    ("index.html", "i-maison", {"fr": "Accueil", "en": "Home", "ar": "الرئيسية"}),
    ("cours.html", "i-livre", {"fr": "Le cours", "en": "The course", "ar": "المقياس"}),
    ("enseignant.html", "i-outil", {"fr": "Guide de l'enseignant", "en": "Teacher's guide", "ar": "دليل الأستاذ"}),
    ("diaporamas.html", "i-ecran", {"fr": "Diaporamas", "en": "Slides", "ar": "العروض التقديمية"}),
    ("classe.html", "i-groupe", {"fr": "Mes groupes", "en": "My groups", "ar": "أفواجي"}),
    ("programme.html", "i-fiche", {"fr": "Programme officiel", "en": "Official syllabus", "ar": "البرنامج الرسمي"}),
]
TEXTES_OUTILS = {
    "diaporamas": {
        "fr": {"titre": "Diaporamas · Cours d'IA", "surtitre": "Pour projeter en classe", "h1": "Diaporamas",
               "chapeau": "Une présentation par séance, prête à projeter : plein écran, notes de l'enseignant, réponses à dévoiler, minuteur pour les activités. Chaque diaporama se télécharge aussi en PowerPoint (.pptx) ou en PDF.",
               "nav": "Menu", "noscript": "Les diaporamas ont besoin de JavaScript. Activez-le dans votre navigateur.", "chargement": "Préparation des diaporamas…"},
        "en": {"titre": "Slides · AI Course", "surtitre": "To project in class", "h1": "Slides",
               "chapeau": "One presentation per session, ready to project: full screen, teacher's notes, answers to reveal, a timer for activities. Every deck also downloads as PowerPoint (.pptx) or PDF.",
               "nav": "Menu", "noscript": "The slides need JavaScript. Please enable it in your browser.", "chargement": "Preparing the slides…"},
        "ar": {"titre": "العروض التقديمية · مقياس الذكاء الاصطناعي", "surtitre": "للعرض في القسم", "h1": "العروض التقديمية",
               "chapeau": "عرض لكل حصة، جاهز للإسقاط على الشاشة: ملء الشاشة، ملاحظات الأستاذ، أجوبة تُكشف عند الطلب، مؤقّت للأنشطة. ويمكن تنزيل كل عرض بصيغة ⁦PowerPoint (.pptx)⁩ أو PDF.",
               "nav": "القائمة", "noscript": "تحتاج العروض إلى JavaScript. فعّلوه في المتصفح.", "chargement": "جارٍ تحضير العروض…"},
    },
    "classe": {
        "fr": {"titre": "Mes groupes · Cours d'IA", "surtitre": "Pour l'enseignant", "h1": "Mes groupes",
               "chapeau": "Vos groupes et vos étudiants, le planning et le cahier de textes de chaque groupe, les présences, les observations et les notes. Tout reste sur votre ordinateur, dans une base SQLite.",
               "nav": "Menu", "noscript": "Cette page a besoin de JavaScript. Activez-le dans votre navigateur.", "chargement": "Ouverture de la base…"},
        "en": {"titre": "My groups · AI Course", "surtitre": "For the teacher", "h1": "My groups",
               "chapeau": "Your groups and students, each group's schedule and class log, attendance, notes on students and grades. Everything stays on your computer, in an SQLite database.",
               "nav": "Menu", "noscript": "This page needs JavaScript. Please enable it in your browser.", "chargement": "Opening the database…"},
        "ar": {"titre": "أفواجي · مقياس الذكاء الاصطناعي", "surtitre": "للأستاذ", "h1": "أفواجي",
               "chapeau": "أفواجكم وطلبتكم، ورزنامة كل فوج ودفتر نصوصه، والحضور، والملاحظات على الطلبة، والعلامات. كل شيء يبقى على حاسوبكم في قاعدة بيانات SQLite.",
               "nav": "القائمة", "noscript": "تحتاج هذه الصفحة إلى JavaScript. فعّلوه في المتصفح.", "chargement": "جارٍ فتح قاعدة البيانات…"},
    },
}
# Scripts propres à chaque page outil ({langue} est remplacé).
SCRIPTS_OUTILS = {
    "diaporamas": ["assets/js/verrou.js", "assets/diapos/diapos-{langue}.js", "assets/js/diaporama.js"],
    "classe": ["assets/js/verrou.js", "assets/js/classe.js"],
}
TEXTES_GUIDE = {
    "fr": {"titre": "Guide de l'enseignant · Cours d'IA", "surtitre": "Pour l'enseignant",
           "h1": "<span>Guide de</span> <span>l'enseignant</span>",
           "chapeau": "Tout ce qu'il faut pour enseigner ce cours, même sans avoir jamais programmé : par où commencer, la carte du cours, une progression semaine par semaine, des fiches de séance prêtes à l'emploi, des activités pour la classe, un sujet d'examen corrigé et toutes les ressources utiles.",
           "b1": "Par où commencer", "b2": "Toutes les ressources", "b3": "Diaporamas", "b4": "Mes groupes", "nav": ("Guide (menu)", "Sommaire du guide")},
    "en": {"titre": "Teacher's guide · AI Course", "surtitre": "For the teacher",
           "h1": "<span>Teacher's</span> <span>guide</span>",
           "chapeau": "Everything you need to teach this course, even if you have never programmed: where to start, a map of the course, a week-by-week plan, ready-to-use lesson plans, classroom activities, a model exam with answers, and every useful resource.",
           "b1": "Where to start", "b2": "All resources", "b3": "Slides", "b4": "My groups", "nav": ("Guide (menu)", "Guide contents")},
    "ar": {"titre": "دليل الأستاذ · مقياس الذكاء الاصطناعي", "surtitre": "للأستاذ",
           "h1": "<span>دليل</span> <span>الأستاذ</span>",
           "chapeau": "كل ما تحتاجه لتدريس هذا المقياس حتى لو لم تبرمج من قبل: من أين تبدأ، خريطة المقياس، خطة أسبوعًا بأسبوع، مذكرات حصص جاهزة، أنشطة للقسم، نموذج امتحان مع الحل، وكل المراجع والموارد المفيدة.",
           "b1": "من أين تبدأ", "b2": "كل المراجع", "b3": "العروض التقديمية", "b4": "أفواجي", "nav": ("الدليل (القائمة)", "محتويات الدليل")},
}

# Par langue : dossier des sources, dossier de sortie, préfixe des assets, libellés des deux nav.
LANGUES = {
    "fr": {"sources": SOURCES, "sortie": DOCS / "cours.html", "base": "",
           "nav": ("Sommaire (menu)", "Sommaire du cours")},
    "en": {"sources": SOURCES / "en", "sortie": DOCS / "en" / "cours.html", "base": "../",
           "nav": ("Contents (menu)", "Course contents")},
    "ar": {"sources": SOURCES / "ar", "sortie": DOCS / "ar" / "cours.html", "base": "../",
           "nav": ("المحتويات (القائمة)", "محتويات المقياس")},
}

# Coloration du code : copie locale (docs/assets/vendor/prism) ; le fichier unique de --autonome garde le CDN.
PRISM = ["assets/vendor/prism/prism-core.min.js", "assets/vendor/prism/prism-clike.min.js", "assets/vendor/prism/prism-python.min.js"]
PRISM_CDN = [
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js",
]


def nav(etiquette, langue, entrees=None):
    items = []
    for cible, marque, textes in (entrees or NAV):
        texte = textes[langue]
        if marque.startswith("i-"):
            signe = f'<svg class="icone" aria-hidden="true"><use href="#{marque}"/></svg>'
        else:
            signe = marque
        items.append(
            f'<li><a href="{cible if cible.endswith(".html") else "#" + cible}"><span class="rail-capsule__marque" aria-hidden="true">{signe}</span>{texte}</a></li>'
        )
    return (f'<nav aria-label="{etiquette}" data-rail>\n<ul class="rail-capsule">\n'
            + "\n".join(items) + "\n</ul>\n</nav>")


def lire(dossier, nom):
    chemin = dossier / f"{nom}.html"
    if not chemin.exists():
        print(f"attention : {chemin.relative_to(RACINE)} manquant, section ignorée")
        return ""
    return chemin.read_text(encoding="utf-8").strip()


def assembler(langue, lien_systeme):
    conf = LANGUES[langue]
    page = (conf["sources"] / "gabarit.html").read_text(encoding="utf-8")
    fragments = "\n\n".join(lire(conf["sources"], n) for n in FRAGMENTS)
    page = page.replace("{{FRAGMENTS}}", fragments)
    page = page.replace("{{GLOSSAIRE}}", lire(conf["sources"], "glossaire"))
    # Le tiroir et le rail reçoivent chacun leur propre nav.
    page = page.replace("{{NAV}}", nav(conf["nav"][0], langue), 1)
    page = page.replace("{{NAV}}", nav(conf["nav"][1], langue), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme)
    page = page.replace("{{BASE}}", conf["base"])
    page = vers_page(page, "cours.html")
    page = page.replace('class="entete__marque" href="#accueil"', 'class="entete__marque" href="index.html"')
    return page


def vers_page(page, nom):
    """Le sélecteur de langue et les <link rel="alternate"> pointent vers la même page dans l'autre langue."""
    page = re.sub(r'(<div class="langues".*?</div>)', lambda m: m.group(1).replace('index.html"', f'{nom}"'), page, count=1, flags=re.S)
    return re.sub(r'(<link rel="alternate" hreflang="\w+" href="[^"]*?)index\.html"', rf'\1{nom}"', page)


def habillage(langue, page, titre):
    """L'en-tête et le pied de page du cours, adaptés à une page voisine de index.html."""
    conf = LANGUES[langue]
    gabarit = (conf["sources"] / "gabarit.html").read_text(encoding="utf-8")
    tete = gabarit[:gabarit.index('<main id="contenu">')]
    pied = gabarit[gabarit.index("</main>") + len("</main>"):]
    pied = pied.replace('href="#', 'href="cours.html#')   # le pied de page renvoie aux sections du cours
    tete = re.sub(r"<title>[^<]*</title>", f"<title>{titre}</title>", tete, count=1)
    tete = tete.replace('class="entete__marque" href="#accueil"', 'class="entete__marque" href="index.html"')
    tete = vers_page(tete, page)
    tete = tete.replace('<link rel="stylesheet" href="{{BASE}}assets/css/cours.css">',
                        '<link rel="stylesheet" href="{{BASE}}assets/css/cours.css">\n<link rel="stylesheet" href="{{BASE}}assets/css/outils.css">', 1)
    return tete, pied


def vers_cours(page):
    """Les pages voisines renvoient aux sections du cours, désormais dans cours.html."""
    return page.replace('href="index.html#', 'href="cours.html#')


def guide(langue, lien_systeme):
    """Page « Guide de l'enseignant » : l'en-tête et le pied de page du cours, un héros sobre, les fragments du guide."""
    conf, t = LANGUES[langue], TEXTES_GUIDE[langue]
    tete, pied = habillage(langue, "enseignant.html", t["titre"])
    fragments = "\n\n".join(lire(conf["sources"], n) for n in FRAGMENTS_GUIDE)
    corps = f"""<main id="contenu">
  <section class="heros heros--guide" id="guide-haut" aria-labelledby="titre-guide">
    <div>
      <p class="surtitre">{t['surtitre']}</p>
      <h1 class="heros__titre" id="titre-guide">{t['h1']}</h1>
      <p class="heros__chapeau">{t['chapeau']}</p>
      <div class="heros__actions">
        <a class="bouton bouton--prisme" href="#guide-demarrer">{t['b1']}</a>
        <a class="bouton" href="#guide-ressources">{t['b2']}</a>
        <a class="bouton" href="diaporamas.html"><svg class="icone" aria-hidden="true"><use href="#i-ecran"/></svg>{t['b3']}</a>
        <a class="bouton" href="classe.html"><svg class="icone" aria-hidden="true"><use href="#i-groupe"/></svg>{t['b4']}</a>
      </div>
    </div>
  </section>

  <div class="page">
    <div class="page__rail">
      {{{{NAV}}}}
    </div>
    <div class="page__contenu">
{fragments}
    </div>
  </div>
</main>"""
    page = tete + corps + pied
    page = page.replace("{{NAV}}", nav(t["nav"][0], langue, NAV_GUIDE), 1)
    page = page.replace("{{NAV}}", nav(t["nav"][1], langue, NAV_GUIDE), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme).replace("{{BASE}}", conf["base"])
    return vers_cours(page)


def page_outil(langue, cle, lien_systeme):
    """Pages « Diaporamas » et « Mes groupes » : une application en pleine largeur, sans rail."""
    conf, t = LANGUES[langue], TEXTES_OUTILS[cle][langue]
    tete, pied = habillage(langue, f"{cle}.html", t["titre"])
    corps = f"""<main id="contenu" class="page-outil">
  <section class="outil-tete" aria-labelledby="titre-outil">
    <p class="surtitre">{t['surtitre']}</p>
    <h1 class="outil-tete__titre" id="titre-outil">{t['h1']}</h1>
    <p class="outil-tete__chapeau">{t['chapeau']}</p>
  </section>
  <div class="outil" id="outil-{cle}" data-outil="{cle}" data-base="{{{{BASE}}}}" data-langue="{langue}">
    <noscript><p class="outil-message">{t['noscript']}</p></noscript>
    <div class="chargement" role="status"><span class="chargement__anneau" aria-hidden="true"></span><p class="chargement__texte">{t['chargement']}</p></div>
  </div>
</main>"""
    page = tete + corps + pied
    page = page.replace("{{NAV}}", nav(t["nav"], langue, NAV_OUTILS), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme).replace("{{BASE}}", conf["base"])
    lignes = [f'<script src="{conf["base"]}{u}"></script>' for u in (PRISM if cle == "diaporamas" else [])]
    lignes.append(f'<script src="{conf["base"]}assets/js/lumineux.js"></script>')
    lignes += [f'<script src="{conf["base"]}{f.format(langue=langue)}"></script>' for f in SCRIPTS_OUTILS[cle]]
    return vers_cours(page.replace("{{SCRIPTS}}", "\n".join(lignes)))


# Page d'accueil : légère, elle mène à tout. (cible, icône, teinte, {langue: (titre, texte)}, info)
TUILES_ETUDIANTS = [
    ("cours.html", "i-livre", "ciel", {"fr": ("Le cours", "Les trois chapitres expliqués pas à pas, avec des démonstrations à essayer."),
                                      "en": ("The course", "The three chapters explained step by step, with demos to try."),
                                      "ar": ("المقياس", "الفصول الثلاثة مشروحة خطوة بخطوة، مع عروض تفاعلية للتجريب.")}),
    ("{{LECON1}}", "i-ecran", "cobalt", {"fr": ("Leçon 1 : de l'automate à l'agent", "L'histoire de l'IA en 63 diapositives animées, avec photos, vidéos et quiz."),
                                       "en": ("Lesson 1: from automaton to agent", "The history of AI in 63 animated slides, with photos, videos and quizzes."),
                                       "ar": ("الدرس 1: من الآلة الذاتية الحركة إلى الوكيل الذكي", "تاريخ الذكاء الاصطناعي في 63 شريحة متحركة، مع صور وفيديوهات واختبارات.")}),
    ("cours.html#methode", "i-boussole", "soleil", {"fr": ("Comment apprendre", "Une semaine type, une méthode par chapitre, le vocabulaire utile."),
                                                   "en": ("How to learn", "A typical week, a method for each chapter, the useful vocabulary."),
                                                   "ar": ("كيف تتعلّم", "أسبوع نموذجي، وطريقة لكل فصل، والمفردات المفيدة.")}),
    ("cours.html#td-tp", "i-crayon", "braise", {"fr": ("TD / TP corrigés", "Tous les exercices du programme, avec leur corrigé détaillé."),
                                               "en": ("Solved TD / TP", "Every exercise of the syllabus, with a detailed solution."),
                                               "ar": ("حلول TD / TP", "كل تمارين البرنامج مع حلولها المفصّلة.")}),
    ("cours.html#mini-projet", "i-ampoule", "fuchsia", {"fr": ("Mini-projet", "Les cinq sujets : démarche, données, code de départ, livrables."),
                                                       "en": ("Mini-project", "The five subjects: method, data, starter code, deliverables."),
                                                       "ar": ("المشروع المصغَّر", "المواضيع الخمسة: المنهجية، البيانات، شيفرة الانطلاق، المطلوب تسليمه.")}),
    ("enseignant.html#guide-langues-carnets", "i-lecture", "cobalt", {"fr": ("Carnets prêts à exécuter", "Python dans Google Colab, pas à pas : on lance, on change une valeur, on observe, puis on écrit son propre code."),
                                                                     "en": ("Ready-to-run notebooks", "Python in Google Colab, step by step: run, change a value, observe, then write your own code."),
                                                                     "ar": ("دفاتر جاهزة للتشغيل", "بايثون في Google Colab خطوة بخطوة: شغّل، غيّر قيمة، لاحظ، ثم اكتب شيفرتك بنفسك.")}),
    ("cours.html#glossaire", "i-fiche", "juste", {"fr": ("Glossaire", "Les termes du cours, en français et en anglais."),
                                                 "en": ("Glossary", "The course's terms, in French and English."),
                                                 "ar": ("المسرد", "مصطلحات المقياس بالعربية والفرنسية والإنجليزية.")}),
]
TUILES_ENSEIGNANT = [
    ("classe.html", "i-groupe", "ciel", {"fr": ("Mes groupes", "Vos six groupes : étudiants, emploi du temps, cahier de textes, appel, notes."),
                                        "en": ("My groups", "Your six groups: students, timetable, class log, attendance, grades."),
                                        "ar": ("أفواجي", "أفواجكم الستة: الطلبة، التوقيت، دفتر النصوص، المناداة، العلامات.")}, "classe"),
    ("diaporamas.html", "i-ecran", "fuchsia", {"fr": ("Diaporamas", "Une présentation par séance, à projeter ou à télécharger en PowerPoint."),
                                              "en": ("Slides", "One presentation per session, to project or download as PowerPoint."),
                                              "ar": ("العروض التقديمية", "عرض لكل حصة، للإسقاط على الشاشة أو للتنزيل بصيغة PowerPoint.")}, "diaporamas"),
    ("enseignant.html", "i-outil", "soleil", {"fr": ("Guide de l'enseignant", "Par où commencer, progression, fiches de séance, évaluation, ressources."),
                                             "en": ("Teacher's guide", "Where to start, weekly plan, lesson plans, assessment, resources."),
                                             "ar": ("دليل الأستاذ", "من أين تبدأ، الخطة الأسبوعية، مذكرات الحصص، التقييم، الموارد.")}, None),
    ("enseignant.html#guide-langues", "i-bulle", "braise", {"fr": ("Étudiants de langues", "Enseigner l'IA et le code : ANG et LGC, un même programme ; DID, un parcours adapté."),
                                                           "en": ("Language students", "Teaching AI and code: one syllabus for ANG and LGC, an adapted path for DID."),
                                                           "ar": ("طلبة اللغات", "تدريس الذكاء الاصطناعي والبرمجة: برنامج واحد للإنجليزية والأدب المقارن، ومسار مكيَّف للتعليمية.")}, None),
    ("programme.html", "i-fiche", "cobalt", {"fr": ("Programme officiel", "Le texte intégral de la matière, en français, anglais et arabe."),
                                            "en": ("Official syllabus", "The full text of the course syllabus, in French, English and Arabic."),
                                            "ar": ("البرنامج الرسمي", "النص الكامل لبرنامج المقياس بالفرنسية والإنجليزية والعربية.")}, None),
    ("enseignant.html#guide-seances", "i-calendrier", "juste", {"fr": ("Fiches de séance", "Huit séances prêtes à l'emploi, minutées, avec leurs activités."),
                                                               "en": ("Lesson plans", "Eight ready-to-use, timed sessions with their activities."),
                                                               "ar": ("مذكرات الحصص", "ثماني حصص جاهزة ومحدَّدة التوقيت مع أنشطتها.")}, None),
]
TEXTES_ACCUEIL = {
    "fr": {"titre": "Intelligence artificielle · Master 2 · Université Yahia Farès, Médéa",
           "surtitre": "Université Yahia Farès, Médéa · Master 2 · 2025–2026", "h1": "Intelligence artificielle",
           "chapeau": "Le cours complet, ses exercices corrigés et les outils de l'enseignant, en français, en anglais et en arabe.",
           "b1": "Ouvrir le cours", "b2": "Guide de l'enseignant", "etudiants": "Pour les étudiants", "enseignant": "Pour l'enseignant", "nav": "Menu"},
    "en": {"titre": "Artificial intelligence · Master 2 · Université Yahia Farès, Médéa",
           "surtitre": "Université Yahia Farès, Médéa · Master 2 · 2025–2026", "h1": "Artificial intelligence",
           "chapeau": "The full course, its solved exercises and the teacher's tools, in French, English and Arabic.",
           "b1": "Open the course", "b2": "Teacher's guide", "etudiants": "For students", "enseignant": "For the teacher", "nav": "Menu"},
    "ar": {"titre": "الذكاء الاصطناعي · ماستر 2 · جامعة يحيى فارس بالمدية",
           "surtitre": "جامعة يحيى فارس بالمدية · ماستر 2 · 2025–2026", "h1": "الذكاء الاصطناعي",
           "chapeau": "المقياس كاملًا، وحلول تمارينه، وأدوات الأستاذ، بالفرنسية والإنجليزية والعربية.",
           "b1": "افتح المقياس", "b2": "دليل الأستاذ", "etudiants": "للطلبة", "enseignant": "للأستاذ", "nav": "القائمة"},
}
TEXTES_PROGRAMME = {
    "fr": {"titre": "Programme officiel · Cours d'IA", "surtitre": "Pour l'enseignant", "h1": "Programme officiel",
           "chapeau": "Le texte intégral du programme de la matière (offre de formation, pages 84 à 86), reproduit sans modification. Version originale en français ; versions anglaise et arabe traduites fidèlement.", "nav": "Menu"},
    "en": {"titre": "Official syllabus · AI Course", "surtitre": "For the teacher", "h1": "Official syllabus",
           "chapeau": "The full text of the course syllabus (training programme, pages 84 to 86), translated faithfully from the French original, without changes.", "nav": "Menu"},
    "ar": {"titre": "البرنامج الرسمي · مقياس الذكاء الاصطناعي", "surtitre": "للأستاذ", "h1": "البرنامج الرسمي",
           "chapeau": "النص الكامل لبرنامج المقياس (عرض التكوين، الصفحات من 84 إلى 86)، مترجمًا بأمانة عن الأصل الفرنسي دون أي تغيير.", "nav": "القائمة"},
}
# Les anciens liens (…/index.html#chapitre-3, liens des carnets) menaient au cours : l'accueil les y renvoie avant tout affichage.
REDIRECTION = ('<script>(function () { var h = location.hash; '
               'if (h.length > 1 && !/^#(contenu|portail-[\\w-]+)$/.test(h)) location.replace("cours.html" + h); })();</script>\n')


def lien_lecon1(langue):
    """La leçon 1 (tools/lecon1.py) est un seul fichier trilingue, à la racine de docs/."""
    return "chapitr1_first_lesson.html" if langue == "fr" else f"../chapitr1_first_lesson.html?lang={langue}"


def tuiles(entrees, langue):
    items = []
    for e in entrees:
        cible, icone, teinte, textes = e[:4]
        info = e[4] if len(e) > 4 else None
        titre, texte = textes[langue]
        cible = cible.replace("{{LECON1}}", lien_lecon1(langue))
        attr_info = f' data-info="{info}"' if info else ""
        items.append(f'      <li><a class="tuile teinte-{teinte}" href="{cible}"{attr_info}>'
                     f'<span class="tuile__icone" aria-hidden="true"><svg class="icone"><use href="#{icone}"/></svg></span>'
                     f'<span class="tuile__titre">{titre}</span><span class="tuile__texte">{texte}</span>'
                     f'<span class="tuile__info" hidden></span></a></li>')
    return '    <ul class="tuiles">\n' + "\n".join(items) + "\n    </ul>"


def accueil(langue, lien_systeme):
    """Page d'accueil : un seul écran, sans contenu lourd, qui mène à tout et précharge le reste."""
    conf, t = LANGUES[langue], TEXTES_ACCUEIL[langue]
    tete, pied = habillage(langue, "index.html", t["titre"])
    tete = tete.replace("</head>", REDIRECTION + "</head>", 1)
    corps = (f'<main id="contenu" class="page-outil portail" data-base="{{{{BASE}}}}" data-langue="{langue}">\n'
             f'  <section class="outil-tete portail__tete" aria-labelledby="titre-portail">\n'
             f'    <p class="surtitre">{t["surtitre"]}</p>\n'
             f'    <h1 class="outil-tete__titre" id="titre-portail">{t["h1"]}</h1>\n'
             f'    <p class="outil-tete__chapeau">{t["chapeau"]}</p>\n'
             f'    <div class="heros__actions"><a class="bouton bouton--prisme" href="cours.html">{t["b1"]}</a>'
             f'<a class="bouton" href="enseignant.html">{t["b2"]}</a></div>\n'
             f'  </section>\n'
             f'  <section class="portail__bloc" id="portail-etudiants" aria-labelledby="portail-etudiants-titre">\n'
             f'    <h2 class="portail__titre" id="portail-etudiants-titre">{t["etudiants"]}</h2>\n{tuiles(TUILES_ETUDIANTS, langue)}\n  </section>\n'
             f'  <section class="portail__bloc" id="portail-enseignant" aria-labelledby="portail-enseignant-titre">\n'
             f'    <h2 class="portail__titre" id="portail-enseignant-titre">{t["enseignant"]}</h2>\n{tuiles(TUILES_ENSEIGNANT, langue)}\n  </section>\n'
             f'</main>')
    page = tete + corps + pied
    page = page.replace("{{NAV}}", nav(t["nav"], langue, NAV_OUTILS), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme).replace("{{BASE}}", conf["base"])
    scripts = "\n".join(f'<script src="{conf["base"]}{f}" defer></script>' for f in ("assets/js/lumineux.js", "assets/js/accueil.js"))
    return vers_cours(page.replace("{{SCRIPTS}}", scripts))


def programme(langue, lien_systeme):
    """Le programme officiel, en texte intégral : pour l'enseignant, non indexé par les moteurs de recherche."""
    conf, t = LANGUES[langue], TEXTES_PROGRAMME[langue]
    tete, pied = habillage(langue, "programme.html", t["titre"])
    tete = tete.replace('<meta name="viewport"', '<meta name="robots" content="noindex">\n<meta name="viewport"', 1)
    corps = (f'<main id="contenu" class="page-outil">\n'
             f'  <section class="outil-tete" aria-labelledby="titre-outil">\n'
             f'    <p class="surtitre">{t["surtitre"]}</p>\n'
             f'    <h1 class="outil-tete__titre" id="titre-outil">{t["h1"]}</h1>\n'
             f'    <p class="outil-tete__chapeau">{t["chapeau"]}</p>\n'
             f'  </section>\n'
             f'  <div class="page-document"><div class="page__contenu">\n{lire(conf["sources"], "programme")}\n  </div></div>\n'
             f'</main>')
    page = tete + corps + pied
    page = page.replace("{{NAV}}", nav(t["nav"], langue, NAV_OUTILS), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme).replace("{{BASE}}", conf["base"])
    return vers_cours(page.replace("{{SCRIPTS}}", f'<script src="{conf["base"]}assets/js/lumineux.js" defer></script>'))


def scripts_lies(base):
    lignes = [f'<script src="{base}{u}"></script>' for u in PRISM]
    lignes += [f'<script src="{base}assets/js/lumineux.js"></script>', f'<script src="{base}assets/js/cours.js"></script>']
    return "\n".join(lignes)


def autonome(page):
    def css(m):
        chemin = DOCS / m.group(1)
        return "<style>\n" + chemin.read_text(encoding="utf-8") + "\n</style>"
    page = re.sub(r'<link rel="stylesheet" href="(?:\.\./)?(assets/[^"]+)">', css, page)
    js = "\n".join(f'<script src="{u}"></script>' for u in PRISM_CDN)
    for f in ("lumineux.js", "cours.js"):
        js += "\n<script>\n" + (DOCS / "assets" / "js" / f).read_text(encoding="utf-8") + "\n</script>"
    page = page.replace("{{SCRIPTS}}", js)
    # Retire l'enveloppe du document : l'hébergeur fournit la sienne.
    page = re.sub(r"<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*", "", page, count=1)
    page = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", page, count=1)
    page = page.replace("</head>\n<body>\n", "", 1)
    page = re.sub(r"</body>\s*</html>\s*$", "", page)
    return page


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--autonome", help="chemin du fichier unique à produire")
    p.add_argument("--langue", choices=sorted(LANGUES), default="fr")
    p.add_argument("--lien-systeme")
    a = p.parse_args()
    if a.autonome:
        sortie = Path(a.autonome)
        lien = a.lien_systeme or "systeme-de-design.html"
        sortie.write_text(autonome(assembler(a.langue, lien)), encoding="utf-8")
        print(f"écrit : {sortie} ({sortie.stat().st_size // 1024} Ko)")
        return
    if diapos.construire(silencieux=True):
        print("[x] des diaporamas ont des erreurs : ils sont absents du site (détail : python3 tools/diapos.py)")
    # Les diaporamas (notes de l'enseignant comprises) ne se lisent qu'avec le code de l'enseignant.
    for fichier in sorted((DOCS / "assets" / "diapos").glob("diapos-*.js")):
        verrou.proteger_diapos(fichier)
    lecon1.construire()
    for langue, conf in LANGUES.items():
        lien = a.lien_systeme or f"{conf['base']}systeme-de-design.html"
        conf["sortie"].parent.mkdir(parents=True, exist_ok=True)
        page = assembler(langue, lien).replace("{{SCRIPTS}}", scripts_lies(conf["base"]))
        conf["sortie"].write_text(page, encoding="utf-8")
        print(f"écrit : {conf['sortie'].relative_to(RACINE)} ({conf['sortie'].stat().st_size // 1024} Ko)")
        sortie_guide = conf["sortie"].with_name("enseignant.html")
        sortie_guide.write_text(verrou.proteger_page(guide(langue, lien).replace("{{SCRIPTS}}", scripts_lies(conf["base"])),
                                                     langue, conf["base"]), encoding="utf-8")
        print(f"écrit : {sortie_guide.relative_to(RACINE)} ({sortie_guide.stat().st_size // 1024} Ko)")
        pages = {f"{cle}.html": page_outil(langue, cle, lien) for cle in TEXTES_OUTILS}
        pages["index.html"] = accueil(langue, lien)
        pages["programme.html"] = programme(langue, lien)
        for nom, contenu in pages.items():
            if nom in verrou.PAGES:  # espace de l'enseignant : la page ne s'ouvre qu'avec le code
                contenu = verrou.proteger_page(contenu, langue, conf["base"])
            sortie_page = conf["sortie"].with_name(nom)
            sortie_page.write_text(contenu, encoding="utf-8")
            print(f"écrit : {sortie_page.relative_to(RACINE)} ({sortie_page.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
