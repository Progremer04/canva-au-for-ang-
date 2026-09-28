#!/usr/bin/env python3
"""Diaporamas du cours : vérification des sources et construction des fichiers du site.

  python3 tools/diapos.py
      → vérifie docs/_sources/diapos/{,en/,ar/}*.json et écrit docs/assets/diapos/diapos-<langue>.js

  python3 tools/diapos.py --verifier FICHIER.json [FICHIER.json …]
      → vérifie seulement ces fichiers (erreurs, avertissements de longueur)

Un diaporama est un fichier JSON : quelques champs de description, puis la liste de ses diapositives.
Chaque diapositive a un « type » ; les champs permis pour chaque type sont dans TYPES ci-dessous.
Les textes acceptent trois marques : **gras**, *italique* et `code`.
"""
import argparse
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
SOURCES = DOCS / "_sources"
DOSSIERS = {"fr": SOURCES / "diapos", "en": SOURCES / "diapos" / "en", "ar": SOURCES / "diapos" / "ar"}
SORTIE = DOCS / "assets" / "diapos"

ORDRE = ["seance-1", "seance-2", "seance-3", "seance-4", "seance-5", "seance-6", "seance-7", "seance-8", "mini-projet"]

CHAMPS_DECK = {"id", "numero", "titre", "resume", "duree", "lien", "fiche", "diapos"}
OBLIGATOIRES_DECK = {"id", "titre", "resume", "diapos"}

# type → (champs obligatoires, champs facultatifs). « notes » est permis partout.
TYPES = {
    "titre": ({"titre"}, {"surtitre", "sousTitre"}),
    "section": ({"titre"}, {"numero", "sousTitre"}),
    "points": ({"titre", "points"}, {"progressif"}),
    "deux": ({"titre", "colonnes"}, {"progressif"}),
    "definition": ({"terme", "definition"}, {"traduction", "exemple"}),
    "citation": ({"texte", "source"}, set()),
    "code": ({"titre", "code"}, {"sortie", "legende"}),
    "tableau": ({"titre", "entetes", "lignes"}, {"legende"}),
    "etapes": ({"titre", "etapes"}, {"progressif"}),
    "question": ({"question", "reponse"}, {"titre", "choix", "explication"}),
    "activite": ({"titre", "duree", "consignes"}, {"materiel"}),
    "chiffre": ({"valeur", "legende"}, {"source"}),
    "chronologie": ({"titre", "evenements"}, set()),
    "fin": ({"titre"}, {"points", "texte"}),
}

# Limites qui garantissent qu'une diapositive tient à l'écran (16:9) sans être illisible.
LIM = {
    "points": 6, "sous": 3, "car_point": 150, "car_titre": 80,
    "lignes_code": 16, "car_ligne_code": 64, "lignes_sortie": 6,
    "lignes_tableau": 7, "colonnes_tableau": 5, "car_cellule": 70,
    "etapes": (2, 6), "evenements": (2, 7), "choix": 5, "consignes": 6,
    "diapos": (8, 24), "car_notes": 900, "car_texte": 320,
}


class Rapport:
    def __init__(self, nom):
        self.nom, self.erreurs, self.avis = nom, [], []

    def err(self, ou, msg):
        self.erreurs.append(f"{self.nom} {ou} : {msg}")

    def avertir(self, ou, msg):
        self.avis.append(f"{self.nom} {ou} : {msg}")


def ids_du_site():
    """Les id définis dans les sources françaises (les autres langues ont les mêmes)."""
    ids = set()
    for f in SOURCES.glob("*.html"):
        ids.update(re.findall(r'\sid="([^"]+)"', f.read_text(encoding="utf-8")))
    return ids


def verifier_texte(r, ou, valeur, maxi=None, vide_ok=False):
    if not isinstance(valeur, str):
        r.err(ou, f"texte attendu, trouvé {type(valeur).__name__}")
        return
    if not valeur.strip() and not vide_ok:
        r.err(ou, "texte vide")
    if valeur.count("**") % 2:
        r.err(ou, "« ** » non refermé")
    if valeur.replace("**", "").count("`") % 2:
        r.err(ou, "« ` » non refermé")
    if re.search(r"</?[a-zA-Z][^>]*>", valeur):
        r.err(ou, "balise HTML dans un texte (utilisez **gras**, *italique*, `code`)")
    if maxi and len(valeur) > maxi:
        r.avertir(ou, f"{len(valeur)} caractères (conseillé : {maxi} au plus)")


def verifier_liste_points(r, ou, points):
    if not isinstance(points, list) or not points:
        r.err(ou, "liste de points non vide attendue")
        return
    if len(points) > LIM["points"]:
        r.err(ou, f"{len(points)} points (maximum {LIM['points']})")
    for i, p in enumerate(points, 1):
        if isinstance(p, dict):
            inconnus = set(p) - {"texte", "sous"}
            if inconnus:
                r.err(f"{ou}[{i}]", f"champs inconnus {sorted(inconnus)}")
            verifier_texte(r, f"{ou}[{i}].texte", p.get("texte"), LIM["car_point"])
            sous = p.get("sous", [])
            if not isinstance(sous, list) or len(sous) > LIM["sous"]:
                r.err(f"{ou}[{i}].sous", f"liste de {LIM['sous']} sous-points au plus attendue")
            else:
                for j, s in enumerate(sous, 1):
                    verifier_texte(r, f"{ou}[{i}].sous[{j}]", s, LIM["car_point"])
        else:
            verifier_texte(r, f"{ou}[{i}]", p, LIM["car_point"])


def verifier_diapo(r, n, d, ids):
    ou = f"diapo {n}"
    if not isinstance(d, dict) or "type" not in d:
        r.err(ou, "objet avec un champ « type » attendu")
        return
    t = d["type"]
    if t not in TYPES:
        r.err(ou, f"type inconnu « {t} » (types : {', '.join(TYPES)})")
        return
    ou = f"diapo {n} ({t})"
    obligatoires, facultatifs = TYPES[t]
    for c in obligatoires - set(d):
        r.err(ou, f"champ obligatoire manquant « {c} »")
    for c in set(d) - obligatoires - facultatifs - {"type", "notes"}:
        r.err(ou, f"champ non permis « {c} »")
    if "notes" in d:
        verifier_texte(r, f"{ou}.notes", d["notes"], LIM["car_notes"])
    for c in ("titre", "surtitre", "sousTitre", "terme", "traduction", "source", "legende"):
        if c in d:
            verifier_texte(r, f"{ou}.{c}", d[c], LIM["car_titre"] if c in ("titre", "terme") else LIM["car_texte"])
    for c in ("definition", "exemple", "texte", "question", "reponse", "explication", "materiel"):
        if c in d:
            verifier_texte(r, f"{ou}.{c}", d[c], LIM["car_texte"])
    for c in ("progressif",):
        if c in d and not isinstance(d[c], bool):
            r.err(f"{ou}.{c}", "true ou false attendu")
    if "numero" in d and not isinstance(d["numero"], (int, str)):
        r.err(f"{ou}.numero", "nombre ou texte court attendu")

    if t in ("points", "fin") and "points" in d:
        verifier_liste_points(r, f"{ou}.points", d["points"])
    if t == "deux":
        cols = d.get("colonnes")
        if not isinstance(cols, list) or len(cols) != 2:
            r.err(f"{ou}.colonnes", "exactement deux colonnes attendues")
        else:
            for i, c in enumerate(cols, 1):
                if not isinstance(c, dict) or set(c) - {"titre", "points"} or "points" not in c:
                    r.err(f"{ou}.colonnes[{i}]", "objet {titre, points} attendu")
                    continue
                if "titre" in c:
                    verifier_texte(r, f"{ou}.colonnes[{i}].titre", c["titre"], LIM["car_titre"])
                verifier_liste_points(r, f"{ou}.colonnes[{i}].points", c["points"])
                if len(c["points"]) > 5:
                    r.avertir(f"{ou}.colonnes[{i}]", "plus de 5 points dans une colonne")
    if t == "code":
        code = d.get("code", "")
        if not isinstance(code, str) or not code.strip():
            r.err(f"{ou}.code", "texte non vide attendu")
        lignes = code.split("\n") if isinstance(code, str) else []
        if len(lignes) > LIM["lignes_code"]:
            r.err(f"{ou}.code", f"{len(lignes)} lignes (maximum {LIM['lignes_code']})")
        for i, l in enumerate(lignes, 1):
            if len(l) > LIM["car_ligne_code"]:
                r.avertir(f"{ou}.code ligne {i}", f"{len(l)} caractères (conseillé : {LIM['car_ligne_code']})")
        if "sortie" in d:
            if not isinstance(d["sortie"], str):
                r.err(f"{ou}.sortie", "texte attendu")
            elif len(d["sortie"].split("\n")) > LIM["lignes_sortie"]:
                r.err(f"{ou}.sortie", f"plus de {LIM['lignes_sortie']} lignes")
            if isinstance(code, str) and len(lignes) + len(d.get("sortie", "").split("\n")) > LIM["lignes_code"] + 2:
                r.avertir(ou, "code + sortie trop longs pour une diapositive")
    if t == "tableau":
        ent, lignes = d.get("entetes"), d.get("lignes")
        if not isinstance(ent, list) or not 2 <= len(ent) <= LIM["colonnes_tableau"]:
            r.err(f"{ou}.entetes", f"de 2 à {LIM['colonnes_tableau']} en-têtes attendus")
        elif not isinstance(lignes, list) or not 1 <= len(lignes) <= LIM["lignes_tableau"]:
            r.err(f"{ou}.lignes", f"de 1 à {LIM['lignes_tableau']} lignes attendues")
        else:
            for i, e in enumerate(ent, 1):
                verifier_texte(r, f"{ou}.entetes[{i}]", e, 40)
            for i, l in enumerate(lignes, 1):
                if not isinstance(l, list) or len(l) != len(ent):
                    r.err(f"{ou}.lignes[{i}]", f"{len(ent)} cellules attendues")
                    continue
                for j, c in enumerate(l, 1):
                    verifier_texte(r, f"{ou}.lignes[{i}][{j}]", c, LIM["car_cellule"], vide_ok=True)
    if t == "etapes":
        et = d.get("etapes")
        mini, maxi = LIM["etapes"]
        if not isinstance(et, list) or not mini <= len(et) <= maxi:
            r.err(f"{ou}.etapes", f"de {mini} à {maxi} étapes attendues")
        else:
            for i, e in enumerate(et, 1):
                if not isinstance(e, dict) or "titre" not in e or set(e) - {"titre", "texte"}:
                    r.err(f"{ou}.etapes[{i}]", "objet {titre, texte?} attendu")
                    continue
                verifier_texte(r, f"{ou}.etapes[{i}].titre", e["titre"], 40)
                if "texte" in e:
                    verifier_texte(r, f"{ou}.etapes[{i}].texte", e["texte"], 120 if len(et) > 4 else 160)
    if t == "chronologie":
        ev = d.get("evenements")
        mini, maxi = LIM["evenements"]
        if not isinstance(ev, list) or not mini <= len(ev) <= maxi:
            r.err(f"{ou}.evenements", f"de {mini} à {maxi} événements attendus")
        else:
            for i, e in enumerate(ev, 1):
                if not isinstance(e, dict) or set(e) != {"date", "texte"}:
                    r.err(f"{ou}.evenements[{i}]", "objet {date, texte} attendu")
                    continue
                verifier_texte(r, f"{ou}.evenements[{i}].date", e["date"], 14)
                verifier_texte(r, f"{ou}.evenements[{i}].texte", e["texte"], 90)
    if t == "question" and "choix" in d:
        ch = d["choix"]
        if not isinstance(ch, list) or not 2 <= len(ch) <= LIM["choix"]:
            r.err(f"{ou}.choix", f"de 2 à {LIM['choix']} choix attendus")
        else:
            for i, c in enumerate(ch, 1):
                verifier_texte(r, f"{ou}.choix[{i}]", c, 90)
    if t == "activite":
        if not isinstance(d.get("duree"), int) or not 1 <= d["duree"] <= 120:
            r.err(f"{ou}.duree", "nombre entier de minutes attendu (1 à 120)")
        cons = d.get("consignes")
        if not isinstance(cons, list) or not 1 <= len(cons) <= LIM["consignes"]:
            r.err(f"{ou}.consignes", f"de 1 à {LIM['consignes']} consignes attendues")
        else:
            for i, c in enumerate(cons, 1):
                verifier_texte(r, f"{ou}.consignes[{i}]", c, LIM["car_point"])
    if t == "chiffre":
        verifier_texte(r, f"{ou}.valeur", d.get("valeur"), 16)
        verifier_texte(r, f"{ou}.legende", d.get("legende"), 160)


def verifier_deck(chemin, ids=None):
    r = Rapport(Path(chemin).name)
    try:
        deck = json.loads(Path(chemin).read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        r.err("JSON", f"ligne {e.lineno}, colonne {e.colno} : {e.msg}")
        return r, None
    if not isinstance(deck, dict):
        r.err("racine", "objet attendu")
        return r, None
    for c in OBLIGATOIRES_DECK - set(deck):
        r.err("racine", f"champ obligatoire manquant « {c} »")
    for c in set(deck) - CHAMPS_DECK:
        r.err("racine", f"champ non permis « {c} »")
    if deck.get("id") != Path(chemin).stem:
        r.err("racine.id", f"« {deck.get('id')} » devrait être « {Path(chemin).stem} » (nom du fichier)")
    for c in ("titre", "resume", "duree"):
        if c in deck:
            verifier_texte(r, f"racine.{c}", deck[c], 200)
    ids = ids if ids is not None else ids_du_site()
    for c, page in (("lien", "index.html"), ("fiche", "enseignant.html")):
        if c in deck:
            m = re.fullmatch(r"(index|enseignant)\.html#([\w-]+)", str(deck[c]))
            if not m:
                r.err(f"racine.{c}", "forme attendue : index.html#ancre ou enseignant.html#ancre")
            elif m.group(2) not in ids:
                r.err(f"racine.{c}", f"ancre inconnue « #{m.group(2)} »")
    diapos = deck.get("diapos")
    if not isinstance(diapos, list):
        r.err("racine.diapos", "liste attendue")
        return r, deck
    mini, maxi = LIM["diapos"]
    if not mini <= len(diapos) <= maxi:
        r.avertir("racine.diapos", f"{len(diapos)} diapositives (conseillé : {mini} à {maxi})")
    for n, d in enumerate(diapos, 1):
        verifier_diapo(r, n, d, ids)
    if diapos and isinstance(diapos[0], dict) and diapos[0].get("type") != "titre":
        r.avertir("diapo 1", "la première diapositive devrait être de type « titre »")
    return r, deck


def construire(silencieux=False):
    """Vérifie toutes les sources et écrit un fichier JS par langue. Renvoie le nombre d'erreurs."""
    SORTIE.mkdir(parents=True, exist_ok=True)
    ids = ids_du_site()
    total = 0
    for langue, dossier in DOSSIERS.items():
        decks = []
        for nom in ORDRE:
            chemin = dossier / f"{nom}.json"
            if not chemin.exists():
                print(f"attention : {chemin.relative_to(RACINE)} manquant, diaporama ignoré")
                continue
            r, deck = verifier_deck(chemin, ids)
            for e in r.erreurs:
                print(f"[x] {langue}/{e}")
            if not silencieux:
                for a in r.avis:
                    print(f"[!] {langue}/{a}")
            total += len(r.erreurs)
            if deck is not None and not r.erreurs:
                decks.append(deck)
        js = ("/* Fichier produit par tools/diapos.py depuis docs/_sources/diapos : ne pas modifier à la main. */\n"
              f"window.LX_DIAPOS = {json.dumps(decks, ensure_ascii=False, separators=(',', ':'))};\n")
        cible = SORTIE / f"diapos-{langue}.js"
        cible.write_text(js, encoding="utf-8")
        n = sum(len(d["diapos"]) for d in decks)
        print(f"écrit : {cible.relative_to(RACINE)} ({len(decks)} diaporamas, {n} diapositives)")
    return total


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--verifier", nargs="+", metavar="FICHIER")
    a = p.parse_args()
    if a.verifier:
        ids = ids_du_site()
        total = 0
        for f in a.verifier:
            r, deck = verifier_deck(f, ids)
            for e in r.erreurs:
                print("[x]", e)
            for x in r.avis:
                print("[!]", x)
            n = len(deck.get("diapos", [])) if isinstance(deck, dict) else 0
            print(f"{Path(f).name} : {n} diapositives, {len(r.erreurs)} erreur(s), {len(r.avis)} avertissement(s)")
            total += len(r.erreurs)
        sys.exit(1 if total else 0)
    sys.exit(1 if construire() else 0)


if __name__ == "__main__":
    main()
