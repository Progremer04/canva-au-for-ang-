#!/usr/bin/env python3
"""Assemble le site du cours à partir de docs/_sources/, en français et en anglais.

  python3 tools/assembler.py
      → écrit docs/index.html (français) et docs/en/index.html (anglais)

  python3 tools/assembler.py --autonome CHEMIN [--langue fr|en] [--lien-systeme URL]
      → écrit une version en un seul fichier : CSS et JS intégrés,
        sans l'enveloppe <!DOCTYPE>/<html>/<head>/<body> (pour un hébergeur
        qui fournit lui-même ce squelette).

Sources : docs/_sources/<fragment>.html pour le français,
          docs/_sources/en/<fragment>.html pour l'anglais (mêmes id).
"""
import argparse
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources"

FRAGMENTS = ["methode", "chapitre-1", "chapitre-2", "chapitre-3", "mini-projet", "td-tp", "tables-rondes"]

# (cible, marque, libellé français, libellé anglais)
NAV = [
    ("accueil", "i-maison", "Accueil", "Home"),
    ("fiche", "i-fiche", "Fiche de la matière", "Course card"),
    ("parcours", "i-calendrier", "Calendrier", "Calendar"),
    ("methode", "i-boussole", "Comment apprendre", "How to learn"),
    ("chapitre-1", "1", "Introduction à l'IA", "Introduction to AI"),
    ("chapitre-2", "2", "Python", "Python"),
    ("chapitre-3", "3", "Types d'IA", "Types of AI"),
    ("mini-projet", "i-ampoule", "Mini-projet", "Mini-project"),
    ("td-tp", "i-crayon", "TD / TP corrigés", "Solved TD / TP"),
    ("tables-rondes", "i-bulle", "Tables rondes", "Round tables"),
    ("references", "i-livre", "Références", "References"),
    ("glossaire", "Aa", "Glossaire", "Glossary"),
]

# Par langue : dossier des sources, dossier de sortie, préfixe des assets, libellés des deux nav.
LANGUES = {
    "fr": {"sources": SOURCES, "sortie": DOCS / "index.html", "base": "",
           "nav": ("Sommaire (menu)", "Sommaire du cours")},
    "en": {"sources": SOURCES / "en", "sortie": DOCS / "en" / "index.html", "base": "../",
           "nav": ("Contents (menu)", "Course contents")},
}

PRISM = [
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js",
]


def nav(etiquette, langue):
    items = []
    for cible, marque, texte_fr, texte_en in NAV:
        texte = texte_en if langue == "en" else texte_fr
        if marque.startswith("i-"):
            signe = f'<svg class="icone" aria-hidden="true"><use href="#{marque}"/></svg>'
        else:
            signe = marque
        items.append(
            f'<li><a href="#{cible}"><span class="rail-capsule__marque" aria-hidden="true">{signe}</span>{texte}</a></li>'
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
    for langue, conf in LANGUES.items():
        lien = a.lien_systeme or f"{conf['base']}systeme-de-design.html"
        conf["sortie"].parent.mkdir(parents=True, exist_ok=True)
        page = assembler(langue, lien).replace("{{SCRIPTS}}", scripts_lies(conf["base"]))
        conf["sortie"].write_text(page, encoding="utf-8")
        print(f"écrit : {conf['sortie'].relative_to(RACINE)} ({conf['sortie'].stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
