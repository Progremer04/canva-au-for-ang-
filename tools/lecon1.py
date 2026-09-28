#!/usr/bin/env python3
"""Construit la leçon 1 (« De l'automate à l'agent ») en un seul fichier : docs/chapitr1_first_lesson.html.

  python3 tools/lecon1.py

Sources : docs/_sources/lecon1/gabarit.html (le moteur de présentation)
          docs/_sources/lecon1/{fr,en,ar}.json (les 60 diapositives, une version par langue)

Les trois versions doivent avoir exactement la même structure : mêmes types, même nombre de points,
mêmes valeurs pour les clés techniques (illustration, photo, vidéo, bonne réponse…).

Photos : les copies de docs/_sources/lecon1/photos/ sont intégrées au fichier (visibles hors ligne) ;
pour les autres, le fichier cherche docs/assets/img/lecon1/<clé>.jpg, puis la photo sur Wikimedia Commons
(vignette de 500 px, puis l'original) ; sans connexion, il affiche une illustration dessinée.
"""
import base64
import hashlib
import json
import sys
from pathlib import Path
from urllib.parse import quote

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources" / "lecon1"
SORTIE = DOCS / "chapitr1_first_lesson.html"
LANGUES = ("fr", "en", "ar")
FIXES = {"type", "illus", "personne", "encart", "youtube", "reponse", "qui", "numero", "annee"}

# clé : (fichier sur Wikimedia Commons, auteur, licence, illustration de repli, format)
#   - le nom du fichier doit être exact (majuscules, extension) : il sert à calculer l'adresse de l'image ;
#   - « PD » est affiché « domaine public » dans la langue de la présentation ;
#   - format « l » : photo en largeur (machine, bâtiment), sinon en hauteur (portrait) ;
#   - une copie dans docs/_sources/lecon1/photos/<clé>.jpg est intégrée au fichier : elle s'affiche hors ligne.
PHOTOS = {
    "jazari": ("Al-jazari_elephant_clock.png", "al-Jazari, 1206", "PD", "elephant", ""),
    "pascaline": ("Arts_et_Metiers_Pascaline_dsc03869.jpg", "Rama", "CC BY-SA 2.0 FR", "calculatrice", "l"),
    "babbage": ("Charles_Babbage_-_1860.jpg", "", "PD", "profil", ""),
    "lovelace": ("Ada_Lovelace_portrait.jpg", "Alfred Edward Chalon", "PD", "profil", ""),
    "turing": ("Alan_Turing_Aged_16.jpg", "", "PD", "profil", ""),
    "eniac": ("Classic_shot_of_the_ENIAC_(full_resolution).jpg", "U.S. Army", "PD", "ordinateur", "l"),
    "shannon": ("C.E._Shannon._Tekniska_museet_43069.jpg", "Tekniska museet", "CC BY 2.0", "profil", ""),
    "mccarthy": ("John_McCarthy_Stanford.jpg", "null0", "CC BY-SA 2.0", "profil", ""),
    "dartmouth": ("Dartmouth_Hall_-_Dartmouth_College_-_DSC01608.jpg", "Daderot", "CC0", "", "l"),
    "perceptron": ("", "Wikipedia", "", "perceptron", ""),
    "shakey": ("SRI_Shakey_with_callouts.jpg", "SRI International", "CC BY-SA 3.0", "robot", ""),
    "deepblue": ("Deep_Blue.jpg", "James the photographer", "CC BY 2.0", "echecs", ""),
    "kasparov": ("Garry_Kasparov_IMG_0130.JPG", "", "CC BY-SA 3.0", "", ""),
    "feifei": ("Fei-Fei_Li_at_AI_for_Good_2017.jpg", "ITU Pictures", "CC BY", "profil", ""),
    "hinton": ("Geoffrey_Hinton_at_UBC.jpg", "Eviatar Bach", "CC BY-SA 3.0", "profil", ""),
    "lecun": ("Yann_LeCun_-_2018_(cropped).jpg", "", "CC BY-SA 2.0", "", ""),
    "hassabis": ("Demis_Hassabis_Royal_Society.jpg", "Royal Society", "CC BY-SA 4.0", "go", ""),
    "leesedol": ("Lee_Se-Dol_-_2016_(cropped).jpg", "", "CC BY 2.0", "", ""),
}
# Pages de référence des photos qui ne viennent pas de Wikimedia Commons.
PAGES = {"perceptron": "https://en.wikipedia.org/wiki/Perceptron"}
LARGEUR = 500  # une des tailles de vignette standard de Wikimedia : les autres sont refusées


def photo(cle, nom, auteur, licence, illus, fmt):
    sources = []
    copie = SOURCES / "photos" / f"{cle}.jpg"
    if copie.exists():
        sources.append("data:image/jpeg;base64," + base64.b64encode(copie.read_bytes()).decode("ascii"))
    else:
        sources.append(f"assets/img/lecon1/{cle}.jpg")
    page = PAGES.get(cle, "")
    if nom:
        m = hashlib.md5(nom.encode("utf-8")).hexdigest()
        chemin = f"{m[0]}/{m[:2]}/{quote(nom)}"
        vignette = f"{LARGEUR}px-{quote(nom)}" + (".png" if nom.lower().endswith(".svg") else "")
        sources += [f"https://upload.wikimedia.org/wikipedia/commons/thumb/{chemin}/{vignette}",
                    f"https://upload.wikimedia.org/wikipedia/commons/{chemin}"]
        page = f"https://commons.wikimedia.org/wiki/File:{quote(nom)}"
    return {"sources": sources, "page": page, "auteur": auteur or "Wikimedia Commons", "licence": licence,
            "illus": illus, "format": fmt}


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
            for champ in ("personne", "encart"):
                if diapo.get(champ) and diapo[champ] not in PHOTOS:
                    erreurs.append(f"{l}.diapos[{i}] : photo inconnue {diapo[champ]!r}")
    if erreurs:
        print("[x] leçon 1 :\n  " + "\n  ".join(erreurs[:40]), file=sys.stderr)
        return 1
    photos = {cle: photo(cle, *v) for cle, v in PHOTOS.items()}
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
