#!/usr/bin/env python3
"""Assemble le site du cours à partir de docs/_sources/, en français, anglais et arabe.

  python3 tools/assembler.py
      → écrit docs/index.html (français), docs/en/index.html (anglais), docs/ar/index.html (arabe)
        et, pour chaque langue, le guide de l'enseignant (enseignant.html), les diaporamas
        (diaporamas.html, via tools/diapos.py) et la page « Mes groupes » (classe.html)

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
    ("index.html", "i-retour", {"fr": "Retour au cours", "en": "Back to the course", "ar": "العودة إلى المقياس"}),
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
]

# Pages outils (diaporamas, groupes) : menu du tiroir et textes d'en-tête.
NAV_OUTILS = [
    ("index.html", "i-retour", {"fr": "Retour au cours", "en": "Back to the course", "ar": "العودة إلى المقياس"}),
    ("enseignant.html", "i-outil", {"fr": "Guide de l'enseignant", "en": "Teacher's guide", "ar": "دليل الأستاذ"}),
    ("diaporamas.html", "i-ecran", {"fr": "Diaporamas", "en": "Slides", "ar": "العروض التقديمية"}),
    ("classe.html", "i-groupe", {"fr": "Mes groupes", "en": "My groups", "ar": "أفواجي"}),
]
TEXTES_OUTILS = {
    "diaporamas": {
        "fr": {"titre": "Diaporamas · Cours d'IA", "surtitre": "Pour projeter en classe", "h1": "Diaporamas",
               "chapeau": "Une présentation par séance, prête à projeter : plein écran, notes de l'enseignant, réponses à dévoiler, minuteur pour les activités. Chaque diaporama se télécharge aussi en PowerPoint (.pptx) ou en PDF.",
               "nav": "Menu", "noscript": "Les diaporamas ont besoin de JavaScript. Activez-le dans votre navigateur."},
        "en": {"titre": "Slides · AI Course", "surtitre": "To project in class", "h1": "Slides",
               "chapeau": "One presentation per session, ready to project: full screen, teacher's notes, answers to reveal, a timer for activities. Every deck also downloads as PowerPoint (.pptx) or PDF.",
               "nav": "Menu", "noscript": "The slides need JavaScript. Please enable it in your browser."},
        "ar": {"titre": "العروض التقديمية · مقياس الذكاء الاصطناعي", "surtitre": "للعرض في القسم", "h1": "العروض التقديمية",
               "chapeau": "عرض لكل حصة، جاهز للإسقاط على الشاشة: ملء الشاشة، ملاحظات الأستاذ، أجوبة تُكشف عند الطلب، مؤقّت للأنشطة. ويمكن تنزيل كل عرض بصيغة ⁦PowerPoint (.pptx)⁩ أو PDF.",
               "nav": "القائمة", "noscript": "تحتاج العروض إلى JavaScript. فعّلوه في المتصفح."},
    },
    "classe": {
        "fr": {"titre": "Mes groupes · Cours d'IA", "surtitre": "Pour l'enseignant", "h1": "Mes groupes",
               "chapeau": "Vos groupes et vos étudiants, le planning et le cahier de textes de chaque groupe, les présences, les observations et les notes. Tout reste sur votre ordinateur, dans une base SQLite.",
               "nav": "Menu", "noscript": "Cette page a besoin de JavaScript. Activez-le dans votre navigateur."},
        "en": {"titre": "My groups · AI Course", "surtitre": "For the teacher", "h1": "My groups",
               "chapeau": "Your groups and students, each group's schedule and class log, attendance, notes on students and grades. Everything stays on your computer, in an SQLite database.",
               "nav": "Menu", "noscript": "This page needs JavaScript. Please enable it in your browser."},
        "ar": {"titre": "أفواجي · مقياس الذكاء الاصطناعي", "surtitre": "للأستاذ", "h1": "أفواجي",
               "chapeau": "أفواجكم وطلبتكم، ورزنامة كل فوج ودفتر نصوصه، والحضور، والملاحظات على الطلبة، والعلامات. كل شيء يبقى على حاسوبكم في قاعدة بيانات SQLite.",
               "nav": "القائمة", "noscript": "تحتاج هذه الصفحة إلى JavaScript. فعّلوه في المتصفح."},
    },
}
# Scripts propres à chaque page outil ({langue} est remplacé).
SCRIPTS_OUTILS = {
    "diaporamas": ["assets/diapos/diapos-{langue}.js", "assets/js/diaporama.js"],
    "classe": ["assets/js/classe.js"],
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
    "fr": {"sources": SOURCES, "sortie": DOCS / "index.html", "base": "",
           "nav": ("Sommaire (menu)", "Sommaire du cours")},
    "en": {"sources": SOURCES / "en", "sortie": DOCS / "en" / "index.html", "base": "../",
           "nav": ("Contents (menu)", "Course contents")},
    "ar": {"sources": SOURCES / "ar", "sortie": DOCS / "ar" / "index.html", "base": "../",
           "nav": ("المحتويات (القائمة)", "محتويات المقياس")},
}

PRISM = [
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
    return page


def habillage(langue, page, titre):
    """L'en-tête et le pied de page du cours, adaptés à une page voisine de index.html."""
    conf = LANGUES[langue]
    gabarit = (conf["sources"] / "gabarit.html").read_text(encoding="utf-8")
    tete = gabarit[:gabarit.index('<main id="contenu">')]
    pied = gabarit[gabarit.index("</main>") + len("</main>"):]
    pied = pied.replace('href="#', 'href="index.html#')   # le pied de page renvoie aux sections du cours
    tete = re.sub(r"<title>[^<]*</title>", f"<title>{titre}</title>", tete, count=1)
    tete = tete.replace('class="entete__marque" href="#accueil"', 'class="entete__marque" href="index.html"')
    # Le sélecteur de langue pointe vers la même page dans l'autre langue.
    tete = re.sub(r'(<div class="langues".*?</div>)', lambda m: m.group(1).replace('index.html"', f'{page}"'), tete, count=1, flags=re.S)
    return tete, pied


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
    return page


def page_outil(langue, cle, lien_systeme):
    """Pages « Diaporamas » et « Mes groupes » : une application en pleine largeur, sans rail."""
    conf, t = LANGUES[langue], TEXTES_OUTILS[cle][langue]
    tete, pied = habillage(langue, f"{cle}.html", t["titre"])
    tete = tete.replace('<link rel="stylesheet" href="{{BASE}}assets/css/cours.css">',
                        '<link rel="stylesheet" href="{{BASE}}assets/css/cours.css">\n<link rel="stylesheet" href="{{BASE}}assets/css/outils.css">', 1)
    corps = f"""<main id="contenu" class="page-outil">
  <section class="outil-tete" aria-labelledby="titre-outil">
    <p class="surtitre">{t['surtitre']}</p>
    <h1 class="outil-tete__titre" id="titre-outil">{t['h1']}</h1>
    <p class="outil-tete__chapeau">{t['chapeau']}</p>
  </section>
  <div class="outil" id="outil-{cle}" data-outil="{cle}" data-base="{{{{BASE}}}}" data-langue="{langue}">
    <noscript><p class="outil-message">{t['noscript']}</p></noscript>
  </div>
</main>"""
    page = tete + corps + pied
    page = page.replace("{{NAV}}", nav(t["nav"], langue, NAV_OUTILS), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme).replace("{{BASE}}", conf["base"])
    lignes = [f'<script src="{u}"></script>' for u in (PRISM if cle == "diaporamas" else [])]
    lignes.append(f'<script src="{conf["base"]}assets/js/lumineux.js"></script>')
    lignes += [f'<script src="{conf["base"]}{f.format(langue=langue)}"></script>' for f in SCRIPTS_OUTILS[cle]]
    return page.replace("{{SCRIPTS}}", "\n".join(lignes))


def scripts_lies(base):
    lignes = [f'<script src="{u}"></script>' for u in PRISM]
    lignes += [f'<script src="{base}assets/js/lumineux.js"></script>', f'<script src="{base}assets/js/cours.js"></script>']
    return "\n".join(lignes)


def autonome(page):
    def css(m):
        chemin = DOCS / m.group(1)
        return "<style>\n" + chemin.read_text(encoding="utf-8") + "\n</style>"
    page = re.sub(r'<link rel="stylesheet" href="(?:\.\./)?(assets/[^"]+)">', css, page)
    js = "\n".join(f'<script src="{u}"></script>' for u in PRISM)
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
    for langue, conf in LANGUES.items():
        lien = a.lien_systeme or f"{conf['base']}systeme-de-design.html"
        conf["sortie"].parent.mkdir(parents=True, exist_ok=True)
        page = assembler(langue, lien).replace("{{SCRIPTS}}", scripts_lies(conf["base"]))
        conf["sortie"].write_text(page, encoding="utf-8")
        print(f"écrit : {conf['sortie'].relative_to(RACINE)} ({conf['sortie'].stat().st_size // 1024} Ko)")
        sortie_guide = conf["sortie"].with_name("enseignant.html")
        sortie_guide.write_text(guide(langue, lien).replace("{{SCRIPTS}}", scripts_lies(conf["base"])), encoding="utf-8")
        print(f"écrit : {sortie_guide.relative_to(RACINE)} ({sortie_guide.stat().st_size // 1024} Ko)")
        for cle in TEXTES_OUTILS:
            sortie_outil = conf["sortie"].with_name(f"{cle}.html")
            sortie_outil.write_text(page_outil(langue, cle, lien), encoding="utf-8")
            print(f"écrit : {sortie_outil.relative_to(RACINE)} ({sortie_outil.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
