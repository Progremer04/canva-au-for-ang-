#!/usr/bin/env python3
"""Construit les leçons illustrées (diapositives en images), une page trilingue par leçon :

  leçon 2 « Le Plan Directeur Python »  -> docs/lecon2_python.html
  leçon 3 « Maîtrise des Prompts IA »   -> docs/lecon3_prompts.html
  leçon 4 « Maîtriser les agents IA »   -> docs/lecon4_agents.html

  python3 tools/lecons.py

Sources : docs/_sources/lecons/gabarit.html        (la visionneuse, commune à toutes les leçons)
          docs/_sources/lecon<N>/diapos.json       (réglages de la leçon, textes de l'interface, titre de chaque
                                                    diapositive en fr/en/ar et le code ou le prompt qu'elle montre)
Images  : docs/assets/img/<images>/{fr,en,ar}/01.webp, 02.webp…
Fichiers: docs/assets/telechargements/<fichiers>-{fr,en,ar}.{pdf,pptx}

Réglages de diapos.json : « page » (fichier produit), « images » (dossier des images), « fichiers » (début du nom
des PDF/PowerPoint), « genre » (« code » : du Python, affiché tel quel ; « prompt » : du texte, dans la langue de
la page ; « markdown » : un fichier .md, en police à chasse fixe mais dans le sens de la langue), « ratio » (largeur / hauteur des images). « code » vaut un texte (le même pour toutes les langues) ou
{"fr": …, "en": …, "ar": …} ; vide si la diapositive ne montre rien à copier.

La page suit la langue de ?lang=fr|en|ar, ouvre la diapositive #N, et partage le thème Nuit / Jour du site.

Pour remplacer les diapositives d'une leçon (une page de PDF par diapositive ; un PowerPoint se convertit d'abord
en PDF avec « soffice --headless --convert-to pdf ») :
  pdftoppm -scale-to-x 1920 -scale-to-y 1080 -png COURS.pdf /tmp/p
puis convertir chaque /tmp/p-NN.png en docs/assets/img/<images>/<langue>/NN.webp (Pillow, qualité 80), mettre à
jour diapos.json si le nombre ou l'ordre des diapositives change, et relancer ce script.
"""
import html
import json
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources"
GABARIT = SOURCES / "lecons" / "gabarit.html"
LECONS = (2, 3, 4)
LANGUES = ("fr", "en", "ar")
REGLAGES = ("page", "images", "fichiers", "genre", "ratio")


def verifier(lecon):
    erreurs = [f"réglage « {r} » manquant" for r in REGLAGES if not lecon.get(r)]
    if erreurs:
        return erreurs
    if lecon["genre"] not in ("code", "prompt", "markdown"):
        erreurs.append("« genre » doit valoir « code », « prompt » ou « markdown »")
    cles = set(lecon["textes"]["fr"])
    for l in LANGUES:
        if set(lecon["textes"].get(l, {})) != cles:
            erreurs.append(f"textes.{l} : clés différentes de textes.fr")
    for i, d in enumerate(lecon["diapos"], 1):
        for l in LANGUES:
            if not d.get(l, "").strip():
                erreurs.append(f"diapositive {i} : titre {l} manquant")
            if not (DOCS / "assets" / "img" / lecon["images"] / l / f"{i:02d}.webp").exists():
                erreurs.append(f"diapositive {i} : image {lecon['images']}/{l}/{i:02d}.webp manquante")
        code = d.get("code")
        if isinstance(code, dict):
            if set(code) != set(LANGUES) or not all(isinstance(v, str) and v.strip() for v in code.values()):
                erreurs.append(f"diapositive {i} : « code » doit avoir un texte non vide pour fr, en et ar")
        elif not isinstance(code, str):
            erreurs.append(f"diapositive {i} : « code » doit être un texte (vide si la diapositive n'en montre pas)")
    for l in LANGUES:
        for ext in ("pdf", "pptx"):
            if not (DOCS / "assets" / "telechargements" / f"{lecon['fichiers']}-{l}.{ext}").exists():
                erreurs.append(f"fichier {lecon['fichiers']}-{l}.{ext} manquant")
    return erreurs


def construire_lecon(numero, gabarit, silencieux=False):
    lecon = json.loads((SOURCES / f"lecon{numero}" / "diapos.json").read_text(encoding="utf-8"))
    erreurs = verifier(lecon)
    if erreurs:
        print(f"[x] leçon {numero} :\n  " + "\n  ".join(erreurs), file=sys.stderr)
        return 1
    fr = lecon["textes"]["fr"]
    donnees = ("window.LECON = " + json.dumps(lecon, ensure_ascii=False, separators=(",", ":")) + ";").replace("</", "<\\/")
    page = (gabarit.replace("@@TITRE@@", html.escape(f"{fr['titre']} · {fr['lecon']}"))
                   .replace("@@DESCRIPTION@@", html.escape(fr["description"]))
                   .replace("/*@@DONNEES@@*/", donnees, 1))
    sortie = DOCS / lecon["page"]
    sortie.write_text(page, encoding="utf-8")
    if not silencieux:
        print(f"écrit : {sortie.relative_to(RACINE)} ({sortie.stat().st_size // 1024} Ko, "
              f"{len(lecon['diapos'])} diapositives × {len(LANGUES)} langues)")
    return 0


def construire(silencieux=False):
    gabarit = GABARIT.read_text(encoding="utf-8")
    if "/*@@DONNEES@@*/" not in gabarit:
        print("[x] leçons : le gabarit n'a pas de marqueur /*@@DONNEES@@*/", file=sys.stderr)
        return 1
    return max(construire_lecon(n, gabarit, silencieux) for n in LECONS)


if __name__ == "__main__":
    sys.exit(construire())
