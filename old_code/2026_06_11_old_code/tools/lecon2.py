#!/usr/bin/env python3
"""Construit la leçon 2 (« Le Plan Directeur Python ») en un seul fichier : docs/lecon2_python.html.

  python3 tools/lecon2.py

Sources : docs/_sources/lecon2/gabarit.html (la visionneuse)
          docs/_sources/lecon2/diapos.json  (titre de chaque diapositive en fr, en, ar, et le code qu'elle montre)
Images  : docs/assets/img/lecon2/{fr,en,ar}/01.webp … 15.webp (les diapositives, tirées des PDF du cours)
Fichiers: docs/assets/telechargements/lecon2-python-{fr,en,ar}.{pdf,pptx} (une image par diapositive)

Comme la leçon 1, le fichier est trilingue : ?lang=en ou ?lang=ar choisit la langue, #3 ouvre la diapositive 3.

Pour remplacer les diapositives par une nouvelle version des PDF (une page par diapositive, 16:9) :
  pdftoppm -scale-to-x 1920 -scale-to-y 1072 -png COURS.pdf /tmp/p
puis convertir chaque /tmp/p-NN.png en docs/assets/img/lecon2/<langue>/NN.webp (Pillow, qualité 80),
mettre à jour diapos.json si le nombre ou l'ordre des diapositives change, et relancer ce script.
"""
import json
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources" / "lecon2"
SORTIE = DOCS / "lecon2_python.html"
LANGUES = ("fr", "en", "ar")


def verifier(lecon):
    erreurs = []
    cles = set(lecon["textes"]["fr"])
    for l in LANGUES:
        if set(lecon["textes"].get(l, {})) != cles:
            erreurs.append(f"textes.{l} : clés différentes de textes.fr")
    for i, d in enumerate(lecon["diapos"], 1):
        for l in LANGUES:
            if not d.get(l, "").strip():
                erreurs.append(f"diapositive {i} : titre {l} manquant")
            if not (DOCS / "assets" / "img" / "lecon2" / l / f"{i:02d}.webp").exists():
                erreurs.append(f"diapositive {i} : image {l}/{i:02d}.webp manquante")
        if not isinstance(d.get("code"), str):
            erreurs.append(f"diapositive {i} : « code » doit être un texte (vide si la diapositive n'en montre pas)")
    for l in LANGUES:
        for ext in ("pdf", "pptx"):
            if not (DOCS / "assets" / "telechargements" / f"lecon2-python-{l}.{ext}").exists():
                erreurs.append(f"fichier lecon2-python-{l}.{ext} manquant")
    return erreurs


def construire(silencieux=False):
    lecon = json.loads((SOURCES / "diapos.json").read_text(encoding="utf-8"))
    erreurs = verifier(lecon)
    if erreurs:
        print("[x] leçon 2 :\n  " + "\n  ".join(erreurs), file=sys.stderr)
        return 1
    gabarit = (SOURCES / "gabarit.html").read_text(encoding="utf-8")
    if "/*@@DONNEES@@*/" not in gabarit:
        print("[x] leçon 2 : le gabarit n'a pas de marqueur /*@@DONNEES@@*/", file=sys.stderr)
        return 1
    donnees = ("window.LECON2 = " + json.dumps(lecon, ensure_ascii=False, separators=(",", ":")) + ";").replace("</", "<\\/")
    SORTIE.write_text(gabarit.replace("/*@@DONNEES@@*/", donnees, 1), encoding="utf-8")
    if not silencieux:
        print(f"écrit : {SORTIE.relative_to(RACINE)} ({SORTIE.stat().st_size // 1024} Ko, "
              f"{len(lecon['diapos'])} diapositives × {len(LANGUES)} langues)")
    return 0


if __name__ == "__main__":
    sys.exit(construire())
