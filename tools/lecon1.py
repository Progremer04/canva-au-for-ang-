#!/usr/bin/env python3
"""Construit la leçon 1 (« De l'automate à l'agent ») en un seul fichier : docs/chapitr1_first_lesson.html.

  python3 tools/lecon1.py
  python3 tools/lecon1.py --mot-de-passe NOUVEAU   (change le mot de passe des notes, puis reconstruit)
  python3 tools/lecon1.py --photos                 (télécharge les photos manquantes, puis reconstruit)

Sources : docs/_sources/lecon1/gabarit.html (le moteur de présentation)
          docs/_sources/lecon1/{fr,en,ar}.json (les 110 diapositives, une version par langue)

Les trois versions doivent avoir exactement la même structure : mêmes types, même nombre de points,
mêmes valeurs pour les clés techniques (illustration, photo, vidéo, bonne réponse…).

Notes de l'enseignant : elles ne figurent pas en clair dans le fichier produit. Elles y sont chiffrées
(clé tirée du mot de passe par PBKDF2-HMAC-SHA256, flux SHA-256 en mode compteur, contrôle HMAC-SHA256) et
ne s'affichent que dans la fenêtre du présentateur, une fois le mot de passe saisi. Le mot de passe n'est
pas conservé : docs/_sources/lecon1/cle-notes.json ne contient que le sel et la clé dérivée.

Photos : les copies de docs/_sources/lecon1/photos/ sont intégrées au fichier (visibles hors ligne) ;
pour les autres, le fichier cherche docs/assets/img/lecon1/<clé>.jpg, puis la photo sur Wikimedia Commons
(vignette de 500 px, puis l'original), puis l'image principale de l'article de Wikipédia ; sans connexion,
il affiche une illustration dessinée. --photos télécharge ces photos dans docs/_sources/lecon1/photos/ (il faut
une connexion vers wikimedia.org) et note leur auteur et leur licence dans photos/credits.json. Le flux de
travail GitHub « Photos de la leçon 1 » fait la même chose sur les serveurs de GitHub.
"""
import argparse
import base64
import hashlib
import hmac
import json
import os
import re
import sys
import urllib.request
import urllib.parse
from pathlib import Path
from html import unescape
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
    "minsky": ("Marvin_Minsky_at_OLPCc.jpg", "Sethwoodworth", "CC BY 3.0", "profil", ""),
    "rumelhart": ("DavidRumelhart-IJCNNseattle1991-07-08.jpg", "Rolf Kickuth", "CC BY-SA 4.0", "profil", ""),
    "goodfellow": ("Ian_Goodfellow.jpg", "Ian Goodfellow", "CC BY-SA 4.0", "profil", "l"),
    "watson": ("IBM_Watson_w_Jeopardy.jpg", "Atomic Taco", "CC BY-SA 2.0", "ordinateur", "l"),
    "gpu": ("NVIDIA_GPU.jpg", "Mickael Courtiade", "CC BY 2.0", "ordinateur", "l"),
    "tpu": ("Tensor_Processing_Unit_3.0.jpg", "Zinskauf", "CC BY-SA 4.0", "ordinateur", "l"),
    "datacenter": ("Datacenter_Server_Racks_(22370909788).jpg", "CLender", "CC BY 2.0", "ordinateur", "l"),
    "goban": ("FloorGoban.JPG", "Goban1", "PD", "go", "l"),
    "ubercar": ("Uber_Self_Driving_Volvo_at_Otto_Headquarters_at_737_Harrison.jpg", "Dllu", "CC BY-SA 4.0", "uber", "l"),
}
# Pages de référence des photos qui ne viennent pas de Wikimedia Commons.
PAGES = {"perceptron": "https://en.wikipedia.org/wiki/Perceptron"}
# Article de Wikipédia (en anglais) de chaque photo : si le fichier de Commons est introuvable, on prend
# l'image principale de l'article.
ARTICLES = {
    "jazari": "Ismail al-Jazari", "pascaline": "Pascal's calculator", "babbage": "Charles Babbage",
    "lovelace": "Ada Lovelace", "turing": "Alan Turing", "eniac": "ENIAC", "shannon": "Claude Shannon",
    "mccarthy": "John McCarthy (computer scientist)", "dartmouth": "Dartmouth workshop", "perceptron": "Perceptron",
    "shakey": "Shakey the robot", "deepblue": "Deep Blue (chess computer)", "kasparov": "Garry Kasparov",
    "feifei": "Fei-Fei Li", "hinton": "Geoffrey Hinton", "lecun": "Yann LeCun", "hassabis": "Demis Hassabis",
    "leesedol": "Lee Sedol", "minsky": "Marvin Minsky", "rumelhart": "David Rumelhart", "goodfellow": "Ian Goodfellow",
    "watson": "IBM Watson", "gpu": "GeForce", "tpu": "Tensor Processing Unit", "datacenter": "Data center",
    "goban": "Go (game)", "ubercar": "Self-driving car",
}
DOSSIER_PHOTOS = SOURCES / "photos"
CREDITS = DOSSIER_PHOTOS / "credits.json"
FORMATS = {".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
AGENT = "CoursIA-MasterLGC/1.0 (https://github.com/Progremer04/canva-au-for-ang-; photos de la leçon 1)"
LARGEUR = 500  # une des tailles de vignette standard de Wikimedia : les autres sont refusées
CLE_NOTES = SOURCES / "cle-notes.json"
ITERATIONS = 60_000


def definir_mot_de_passe(mot_de_passe):
    sel = os.urandom(16)
    cle = hashlib.pbkdf2_hmac("sha256", mot_de_passe.strip().encode("utf-8"), sel, ITERATIONS, 32)
    CLE_NOTES.write_text(json.dumps({"sel": sel.hex(), "iterations": ITERATIONS, "cle": cle.hex()}, indent=2) + "\n",
                         encoding="utf-8")


def chiffrer(texte, cle):
    """Même calcul que dechiffrer() dans le gabarit. Le vecteur initial est le contrôle HMAC du texte :
    un même texte donne le même fichier (pas de modification inutile à chaque construction)."""
    kc = hashlib.sha256(cle + b"lx-chiffre").digest()
    km = hashlib.sha256(cle + b"lx-controle").digest()
    iv = hmac.new(km, texte, hashlib.sha256).digest()[:16]
    flux = b"".join(hashlib.sha256(kc + iv + i.to_bytes(4, "big")).digest() for i in range((len(texte) + 31) // 32))
    return iv, bytes(a ^ b for a, b in zip(texte, flux))


def copie_locale(cle):
    return next((DOSSIER_PHOTOS / f"{cle}{ext}" for ext in FORMATS if (DOSSIER_PHOTOS / f"{cle}{ext}").exists()), None)


def photo(cle, nom, auteur, licence, illus, fmt, credits):
    sources = []
    copie = copie_locale(cle)
    if copie:
        sources.append(f"data:{FORMATS[copie.suffix]};base64," + base64.b64encode(copie.read_bytes()).decode("ascii"))
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
    c = credits.get(cle) if copie else None
    if c:  # la copie téléchargée peut venir d'un autre fichier que celui du tableau : on affiche son propre crédit
        page, auteur, licence = c.get("page") or page, c.get("auteur") or auteur, c.get("licence") or licence
    return {"sources": sources, "page": page, "auteur": auteur or "Wikimedia Commons", "licence": licence,
            "illus": illus, "format": fmt, "fichier": nom, "article": ARTICLES.get(cle, "")}


def lire_json(url):
    requete = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(requete, timeout=30) as r:
        return json.load(r)


def info_fichier(nom, hote="commons.wikimedia.org"):
    """Adresse de la vignette de 500 px, page, auteur et licence d'un fichier ; None s'il n'existe pas."""
    r = lire_json(f"https://{hote}/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "formatversion": "2", "redirects": "1", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": str(LARGEUR), "titles": "File:" + nom}))
    pages = r.get("query", {}).get("pages", [])
    if not pages or "imageinfo" not in pages[0]:
        return None
    ii = pages[0]["imageinfo"][0]
    meta = ii.get("extmetadata", {})
    auteur = re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")))).strip()
    licence = meta.get("LicenseShortName", {}).get("value", "").strip()
    if licence.lower() in ("public domain", "domaine public", "pd"):
        licence = "PD"
    return {"url": ii.get("thumburl") or ii["url"], "page": ii.get("descriptionurl", ""),
            "auteur": auteur[:80], "licence": licence}


def image_article(titre):
    r = lire_json("https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "formatversion": "2", "redirects": "1", "prop": "pageimages",
        "piprop": "name", "titles": titre}))
    pages = r.get("query", {}).get("pages", [])
    return pages[0].get("pageimage") if pages else None


def telecharger_photos():
    """Télécharge les photos qui n'ont pas de copie : le fichier du tableau PHOTOS, sinon l'image de l'article."""
    DOSSIER_PHOTOS.mkdir(exist_ok=True)
    credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    manquantes = 0
    for cle, (nom, *_reste) in PHOTOS.items():
        if copie_locale(cle):
            continue
        info = None
        try:
            if nom:
                info = info_fichier(nom)
            if not info and ARTICLES.get(cle):
                image = image_article(ARTICLES[cle])
                if image:
                    info = info_fichier(image) or info_fichier(image, "en.wikipedia.org")
            if not info:
                raise ValueError("aucune image trouvée")
            requete = urllib.request.Request(info["url"], headers={"User-Agent": AGENT})
            with urllib.request.urlopen(requete, timeout=60) as r:
                donnees, type_mime = r.read(), r.headers.get_content_type()
            ext = next((e for e, m in FORMATS.items() if m == type_mime), None)
            if not ext:
                raise ValueError(f"format inattendu {type_mime}")
            (DOSSIER_PHOTOS / f"{cle}{ext}").write_bytes(donnees)
            credits[cle] = {k: info[k] for k in ("page", "auteur", "licence")}
            print(f"  {cle} : {len(donnees) // 1024} Ko ({info['page']})")
        except Exception as e:  # une photo manquante ne bloque pas les autres : l'illustration dessinée la remplace
            manquantes += 1
            print(f"  [!] {cle} : {e}", file=sys.stderr)
    if credits:
        CREDITS.write_text(json.dumps(credits, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                           encoding="utf-8")
    print(f"photos : {len(PHOTOS) - manquantes} sur {len(PHOTOS)} dans {DOSSIER_PHOTOS.relative_to(RACINE)}")


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
    if not CLE_NOTES.exists():
        print("[x] leçon 1 : pas de mot de passe pour les notes ; lancez python3 tools/lecon1.py --mot-de-passe …",
              file=sys.stderr)
        return 1
    reglage = json.loads(CLE_NOTES.read_text(encoding="utf-8"))
    notes = {l: [d.pop("notes", "") for d in lecon[l]["diapos"]] for l in LANGUES}
    iv, chiffre = chiffrer(json.dumps(notes, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
                           bytes.fromhex(reglage["cle"]))
    notes_chiffrees = {"sel": reglage["sel"], "iterations": reglage["iterations"],
                       "iv": base64.b64encode(iv).decode("ascii"), "donnees": base64.b64encode(chiffre).decode("ascii")}
    credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    photos = {cle: photo(cle, *v, credits) for cle, v in PHOTOS.items()}
    donnees = ("window.LECON = " + json.dumps(lecon, ensure_ascii=False, separators=(",", ":")) + ";\n"
               "window.PHOTOS = " + json.dumps(photos, ensure_ascii=False, separators=(",", ":")) + ";\n"
               "window.NOTES = " + json.dumps(notes_chiffrees, separators=(",", ":")) + ";")
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
    p = argparse.ArgumentParser()
    p.add_argument("--mot-de-passe", help="nouveau mot de passe des notes de l'enseignant")
    p.add_argument("--photos", action="store_true", help="télécharge les photos manquantes depuis Wikimedia")
    a = p.parse_args()
    if a.photos:
        telecharger_photos()
    if a.mot_de_passe:
        definir_mot_de_passe(a.mot_de_passe)
        print(f"mot de passe des notes changé : {CLE_NOTES.relative_to(RACINE)}")
    sys.exit(construire())
