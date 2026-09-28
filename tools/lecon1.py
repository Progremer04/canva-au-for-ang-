#!/usr/bin/env python3
"""Construit la leçon 1 (« De l'automate à l'agent ») en un seul fichier : docs/chapitr1_first_lesson.html.

  python3 tools/lecon1.py

Sources : docs/_sources/lecon1/gabarit.html (le moteur de présentation)
          docs/_sources/lecon1/{fr,en,ar}.json (les 60 diapositives, une version par langue)

Les trois versions doivent avoir exactement la même structure : mêmes types, même nombre de points,
mêmes valeurs pour les clés techniques (illustration, photo, vidéo, bonne réponse…).

Photos : le fichier cherche d'abord docs/assets/img/lecon1/<clé>.jpg (pour un usage hors ligne),
puis la photo sur Wikimedia Commons ; sans connexion, il affiche une illustration dessinée.
"""
import hashlib
import json
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources" / "lecon1"
SORTIE = DOCS / "chapitr1_first_lesson.html"
LANGUES = ("fr", "en", "ar")
FIXES = {"type", "illus", "personne", "youtube", "reponse", "qui", "numero", "annee"}

# clé : (fichier sur Wikimedia Commons, illustration de repli : une silhouette pour les personnes)
PHOTOS = {
    "babbage": ("Charles_Babbage_-_1860.jpg", "profil"),
    "lovelace": ("Ada_Lovelace_portrait.jpg", "profil"),
    "turing": ("Alan_Turing_Aged_16.jpg", "profil"),
    "eniac": ("Eniac.jpg", "ordinateur"),
    "mccarthy": ("John_McCarthy_Stanford.jpg", "profil"),
    "perceptron": ("Mark_I_perceptron.jpeg", "perceptron"),
    "shakey": ("SRI_Shakey_with_callouts.jpg", "robot"),
    "deepblue": ("Deep_Blue.jpg", "echecs"),
    "feifei": ("Fei-Fei_Li_at_AI_for_Good_2017.jpg", "profil"),
    "hinton": ("Geoffrey_Hinton_at_UBC.jpg", "profil"),
    "hassabis": ("Demis_Hassabis_Royal_Society.jpg", "go"),
}


def commons(nom, illus, cle):
    m = hashlib.md5(nom.encode("utf-8")).hexdigest()
    return {
        "local": f"assets/img/lecon1/{cle}.jpg",
        "miniature": f"https://upload.wikimedia.org/wikipedia/commons/thumb/{m[0]}/{m[:2]}/{nom}/360px-{nom}",
        "original": f"https://upload.wikimedia.org/wikipedia/commons/{m[0]}/{m[:2]}/{nom}",
        "page": f"https://commons.wikimedia.org/wiki/File:{nom}",
        "illus": illus,
    }


def comparer(a, b, chemin, erreurs):
    if type(a) is not type(b):
        erreurs.append(f"{chemin} : type différent")
    elif isinstance(a, dict):
        if set(a) != set(b):
            erreurs.append(f"{chemin} : clés différentes {sorted(set(a) ^ set(b))}")
        for k in set(a) & set(b):
            if k in FIXES and a[k] != b[k]:
                erreurs.append(f"{chemin}.{k} : {a[k]!r} ≠ {b[k]!r}")
            else:
                comparer(a[k], b[k], f"{chemin}.{k}", erreurs)
    elif isinstance(a, list):
        if len(a) != len(b):
            erreurs.append(f"{chemin} : {len(a)} éléments ≠ {len(b)}")
        for i, (x, y) in enumerate(zip(a, b)):
            comparer(x, y, f"{chemin}[{i}]", erreurs)
    elif isinstance(a, str) and not a.strip():
        erreurs.append(f"{chemin} : texte vide")


def construire(silencieux=False):
    lecon = {l: json.loads((SOURCES / f"{l}.json").read_text(encoding="utf-8")) for l in LANGUES}
    erreurs = []
    for l in LANGUES[1:]:
        comparer(lecon["fr"], lecon[l], l, erreurs)
    for l, d in lecon.items():
        for i, diapo in enumerate(d["diapos"]):
            if diapo.get("personne") and diapo["personne"] not in PHOTOS:
                erreurs.append(f"{l}.diapos[{i}] : photo inconnue {diapo['personne']!r}")
    if erreurs:
        print("[x] leçon 1 :\n  " + "\n  ".join(erreurs[:40]), file=sys.stderr)
        return 1
    photos = {cle: commons(nom, illus, cle) for cle, (nom, illus) in PHOTOS.items()}
    donnees = ("window.LECON = " + json.dumps(lecon, ensure_ascii=False, separators=(",", ":")) + ";\n"
               "window.PHOTOS = " + json.dumps(photos, ensure_ascii=False, separators=(",", ":")) + ";")
    donnees = donnees.replace("</", "<\\/")
    gabarit = (SOURCES / "gabarit.html").read_text(encoding="utf-8")
    if "/*@@DONNEES@@*/" not in gabarit:
        print("[x] leçon 1 : le gabarit n'a pas de marqueur /*@@DONNEES@@*/", file=sys.stderr)
        return 1
    SORTIE.write_text(gabarit.replace("/*@@DONNEES@@*/", donnees, 1), encoding="utf-8")
    if not silencieux:
        print(f"écrit : {SORTIE.relative_to(RACINE)} ({SORTIE.stat().st_size // 1024} Ko, "
              f"{len(lecon['fr']['diapos'])} diapositives × {len(LANGUES)} langues)")
    return 0


if __name__ == "__main__":
    sys.exit(construire())
