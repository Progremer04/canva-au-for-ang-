#!/usr/bin/env python3
"""L'espace de l'enseignant : pages et diaporamas chiffrés avec le code des notes de la leçon 1.

Appelé par tools/assembler.py. Chaque page de l'enseignant (guide, diaporamas, Mes groupes, programme)
est remplacée par une « porte » : un petit formulaire et la page d'origine chiffrée. Le navigateur tire la
clé du code (PBKDF2, même sel que les notes : docs/_sources/lecon1/cle-notes.json), vérifie le contrôle
HMAC, puis affiche la page (docs/assets/js/verrou.js). Les fichiers des diaporamas (notes comprises) sont
chiffrés de la même façon. Le code n'est écrit nulle part ; pour le changer :
python3 tools/lecon1.py --mot-de-passe NOUVEAU, puis python3 tools/assembler.py.
"""
import base64
import html
import json
import re

from lecon1 import CLE_NOTES, chiffrer

PAGES = ("enseignant.html", "diaporamas.html", "classe.html", "programme.html")
TEXTES = {
    "fr": {"titre": "Espace de l'enseignant", "texte": "Cette page est réservée à l'enseignant. Entrez le code pour l'ouvrir.",
           "code": "Code", "entrer": "Entrer", "calcul": "Vérification…", "faux": "Code incorrect.",
           "retour": "Retour à l'accueil", "noscript": "Cette page a besoin de JavaScript."},
    "en": {"titre": "Teacher area", "texte": "This page is for the teacher only. Enter the code to open it.",
           "code": "Code", "entrer": "Enter", "calcul": "Checking…", "faux": "Wrong code.",
           "retour": "Back to the home page", "noscript": "This page needs JavaScript."},
    "ar": {"titre": "فضاء الأستاذ", "texte": "هذه الصفحة مخصّصة للأستاذ. أدخلوا الرمز لفتحها.",
           "code": "الرمز", "entrer": "دخول", "calcul": "جارٍ التحقّق…", "faux": "الرمز غير صحيح.",
           "retour": "العودة إلى الصفحة الرئيسية", "noscript": "تحتاج هذه الصفحة إلى JavaScript."},
}


def _reglage():
    r = json.loads(CLE_NOTES.read_text(encoding="utf-8"))
    return r, bytes.fromhex(r["cle"])


def _chiffre(texte):
    r, cle = _reglage()
    iv, donnees = chiffrer(texte.encode("utf-8"), cle)
    return {"sel": r["sel"], "iterations": r["iterations"],
            "iv": base64.b64encode(iv).decode("ascii"), "donnees": base64.b64encode(donnees).decode("ascii")}


def proteger_page(page, langue, base):
    """La page entière, chiffrée, derrière un formulaire qui demande le code."""
    t = TEXTES[langue]
    titre = re.search(r"<title>(.*?)</title>", page, re.S)
    titre = html.unescape(titre.group(1)) if titre else t["titre"]
    donnees = json.dumps(_chiffre(page), separators=(",", ":"))
    e = html.escape
    return f"""<!DOCTYPE html>
<html lang="{langue}" dir="{'rtl' if langue == 'ar' else 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{e(titre)}</title>
<style>
  :root {{ color-scheme: dark; --fond: #07070a; --surface: #151515; --ligne: #2e2e35; --texte: #f5f5f5; --doux: #a9a9b6; --accent: #87ceeb; }}
  @media (prefers-color-scheme: light) {{ :root {{ color-scheme: light; --fond: #f4f4f6; --surface: #fff; --ligne: #d6d6de; --texte: #121216; --doux: #55555f; --accent: #1c64ff; }} }}
  html, body {{ margin: 0; min-height: 100%; background: var(--fond); color: var(--texte); }}
  body {{ min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; font: 17px/1.6 "Segoe UI", system-ui, Tahoma, sans-serif; }}
  .carte {{ width: min(100%, 420px); padding: 32px 28px; border: 1px solid var(--ligne); border-radius: 24px; background: var(--surface); position: relative; overflow: hidden; visibility: hidden; }}
  .porte-prete .carte {{ visibility: visible; }}
  .carte::before {{ content: ""; position: absolute; inset: 0 0 auto; height: 5px; background: linear-gradient(90deg, #ffff00, #87ceeb, #ff512f, #dd2476, #1c64ff); }}
  h1 {{ margin: 0 0 8px; font-size: 26px; line-height: 1.25; }}
  p {{ margin: 0 0 20px; color: var(--doux); }}
  label {{ display: block; margin-bottom: 6px; font-weight: 700; }}
  input {{ width: 100%; box-sizing: border-box; height: 48px; padding: 0 16px; border: 1px solid var(--ligne); border-radius: 14px; background: var(--fond); color: var(--texte); font-size: 20px; letter-spacing: .15em; direction: ltr; text-align: center; }}
  input:focus {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
  button {{ width: 100%; height: 48px; margin-top: 14px; border: 0; border-radius: 999px; background: var(--texte); color: var(--fond); font-size: 17px; font-weight: 700; cursor: pointer; }}
  button:disabled {{ opacity: .6; cursor: progress; }}
  .message {{ margin: 12px 0 0; color: #ff6b6b; font-weight: 700; text-align: center; }}
  .message[hidden] {{ display: none; }}
  a {{ display: inline-block; margin-top: 18px; color: var(--accent); }}
</style>
<script src="{base}assets/js/verrou.js"></script>
</head>
<body>
<main class="carte">
  <h1>{e(t["titre"])}</h1>
  <p>{e(t["texte"])}</p>
  <form id="porte" autocomplete="off">
    <label for="porte-code">{e(t["code"])}</label>
    <input id="porte-code" type="password" inputmode="numeric" autocomplete="current-password" required>
    <button type="submit">{e(t["entrer"])}</button>
    <p class="message" id="porte-message" role="status" data-calcul="{e(t["calcul"])}" data-faux="{e(t["faux"])}" hidden></p>
  </form>
  <a href="index.html">{e(t["retour"])}</a>
  <noscript><p>{e(t["noscript"])}</p></noscript>
</main>
<script>LxVerrou.porte({donnees});</script>
</body>
</html>
"""


def proteger_diapos(chemin):
    """Réécrit assets/diapos/diapos-<langue>.js : les diaporamas (et leurs notes) chiffrés."""
    texte = chemin.read_text(encoding="utf-8")
    m = re.search(r"window\.LX_DIAPOS = (.*);\s*$", texte, re.S)
    if not m:
        return
    c = _chiffre(m.group(1))
    chemin.write_text("/* Produit par tools/diapos.py et tools/verrou.py : diaporamas chiffrés, lisibles après le code de l'enseignant. */\n"
                      f"window.LX_DIAPOS = window.LxVerrou ? window.LxVerrou.json({json.dumps(c['iv'])}, {json.dumps(c['donnees'])}, []) : [];\n",
                      encoding="utf-8")
