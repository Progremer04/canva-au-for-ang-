#!/usr/bin/env python3
"""Assemble le site du cours à partir de docs/_sources/.

  python3 tools/assembler.py
      → écrit docs/index.html (feuilles de style et scripts liés)

  python3 tools/assembler.py --autonome CHEMIN [--lien-systeme URL]
      → écrit une version en un seul fichier : CSS et JS intégrés,
        sans l'enveloppe <!DOCTYPE>/<html>/<head>/<body> (pour un hébergeur
        qui fournit lui-même ce squelette).
"""
import argparse
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources"

FRAGMENTS = ["chapitre-1", "chapitre-2", "chapitre-3", "mini-projet", "td-tp", "tables-rondes"]

NAV = [
    ("accueil", "i-maison", "Accueil"),
    ("fiche", "i-fiche", "Fiche de la matière"),
    ("parcours", "i-calendrier", "Calendrier"),
    ("chapitre-1", "1", "Introduction à l'IA"),
    ("chapitre-2", "2", "Python"),
    ("chapitre-3", "3", "Types d'IA"),
    ("mini-projet", "i-ampoule", "Mini-projet"),
    ("td-tp", "i-crayon", "TD / TP corrigés"),
    ("tables-rondes", "i-bulle", "Tables rondes"),
    ("references", "i-livre", "Références"),
    ("glossaire", "Aa", "Glossaire"),
]

PRISM = [
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js",
]


def nav(etiquette):
    items = []
    for cible, marque, texte in NAV:
        if marque.startswith("i-"):
            signe = f'<svg class="icone" aria-hidden="true"><use href="#{marque}"/></svg>'
        else:
            signe = marque
        items.append(
            f'<li><a href="#{cible}"><span class="rail-capsule__marque" aria-hidden="true">{signe}</span>{texte}</a></li>'
        )
    return (f'<nav aria-label="{etiquette}" data-rail>\n<ul class="rail-capsule">\n'
            + "\n".join(items) + "\n</ul>\n</nav>")


def lire(nom):
    chemin = SOURCES / f"{nom}.html"
    if not chemin.exists():
        print(f"attention : {chemin.name} manquant, section ignorée")
        return ""
    return chemin.read_text(encoding="utf-8").strip()


def assembler(lien_systeme):
    page = (SOURCES / "gabarit.html").read_text(encoding="utf-8")
    fragments = "\n\n".join(lire(n) for n in FRAGMENTS)
    page = page.replace("{{FRAGMENTS}}", fragments)
    page = page.replace("{{GLOSSAIRE}}", lire("glossaire"))
    # Le tiroir et le rail reçoivent chacun leur propre nav.
    page = page.replace("{{NAV}}", nav("Sommaire (menu)"), 1)
    page = page.replace("{{NAV}}", nav("Sommaire du cours"), 1)
    page = page.replace("{{LIEN_SYSTEME}}", lien_systeme)
    return page


def scripts_lies():
    lignes = [f'<script src="{u}"></script>' for u in PRISM]
    lignes += ['<script src="assets/js/lumineux.js"></script>', '<script src="assets/js/cours.js"></script>']
    return "\n".join(lignes)


def autonome(page):
    def css(m):
        chemin = DOCS / m.group(1)
        return "<style>\n" + chemin.read_text(encoding="utf-8") + "\n</style>"
    page = re.sub(r'<link rel="stylesheet" href="(assets/[^"]+)">', css, page)
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
    p.add_argument("--lien-systeme", default="systeme-de-design.html")
    a = p.parse_args()
    if a.autonome:
        sortie = Path(a.autonome)
        sortie.write_text(autonome(assembler(a.lien_systeme)), encoding="utf-8")
    else:
        sortie = DOCS / "index.html"
        sortie.write_text(assembler(a.lien_systeme).replace("{{SCRIPTS}}", scripts_lies()), encoding="utf-8")
    print(f"écrit : {sortie} ({sortie.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
