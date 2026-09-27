#!/usr/bin/env python3
"""Construit le système de design Lumineux à partir de design-system/.

  python3 tools/construire_systeme.py
      → écrit docs/systeme-de-design.html (page de référence du site)

  python3 tools/construire_systeme.py --artefact DOSSIER
      → écrit DOSSIER/project/… : les fichiers d'un artefact « Design System »
        (README, jetons, composants avec aperçus, couverture, index).
"""
import argparse
import datetime
import html
import json
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DS = RACINE / "design-system"
COMPOSANTS = DS / "composants"
DOCS = RACINE / "docs"

POLICES = ("https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;600&family=IM+Fell+DW+Pica+SC"
           "&family=JetBrains+Mono:wght@400;600&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400"
           "&family=Rajdhani:wght@500;600;700&display=swap")

CSS_APERCU = """
.apercu { display: grid; gap: 16px; padding: 24px; }
.apercu--rangee { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.apercu--duo { grid-template-columns: minmax(0, 1fr) auto; align-items: start; }
.scene-tiroir { position: relative; block-size: 340px; overflow: hidden; border-radius: 14px; border: 1px solid var(--ligne); background: var(--fond); }
.scene-tiroir .tiroir { transition: none; }
@media (max-width: 560px) { .apercu--duo { grid-template-columns: minmax(0, 1fr); } }
""".strip()


# ---------------------------------------------------------------- utilitaires

def index_composants():
    return json.loads((COMPOSANTS / "index.json").read_text(encoding="utf-8"))


def remplir(apercu, icones, image):
    def icone(m):
        return f'<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">{icones[m.group(1)]}</svg>'

    def marque(m):
        return f'<span class="rail-capsule__marque" aria-hidden="true">{icone(m)}</span>'

    apercu = re.sub(r"\{\{MARQUE:([a-z]+)\}\}", marque, apercu)
    apercu = re.sub(r"\{\{ICONE:([a-z]+)\}\}", icone, apercu)
    apercu = re.sub(r"\{\{IMG:([^}]+)\}\}", lambda m: image(m.group(1)), apercu)
    return apercu


def markdown(texte, niveau_min=2):
    """Convertisseur Markdown minimal : titres, paragraphes, listes, tableaux, code."""
    def en_ligne(s):
        s = html.escape(s, quote=False)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<![\w*])\*([^*\s][^*]*)\*(?!\w)", r"<em>\1</em>", s)
        s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
        return s

    sortie, lignes, i = [], texte.splitlines(), 0
    while i < len(lignes):
        l = lignes[i]
        if not l.strip():
            i += 1
            continue
        if l.startswith("```"):
            bloc = []
            i += 1
            while i < len(lignes) and not lignes[i].startswith("```"):
                bloc.append(lignes[i])
                i += 1
            i += 1
            sortie.append('<figure class="code"><pre><code>' + html.escape("\n".join(bloc)) + "</code></pre></figure>")
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", l)
        if m:
            n = max(niveau_min, len(m.group(1)) + niveau_min - 1)
            sortie.append(f"<h{n}>{en_ligne(m.group(2))}</h{n}>")
            i += 1
            continue
        if l.startswith("|"):
            rangs = []
            while i < len(lignes) and lignes[i].startswith("|"):
                rangs.append([c.strip() for c in lignes[i].strip().strip("|").split("|")])
                i += 1
            tete, corps = rangs[0], [r for r in rangs[2:]]
            t = '<div class="tableau-defilant"><table class="tableau"><thead><tr>'
            t += "".join(f'<th scope="col">{en_ligne(c)}</th>' for c in tete) + "</tr></thead><tbody>"
            for r in corps:
                t += "<tr>" + "".join(f"<td>{en_ligne(c)}</td>" for c in r) + "</tr>"
            sortie.append(t + "</tbody></table></div>")
            continue
        if re.match(r"^(- |\d+\. )", l):
            ordonne = bool(re.match(r"^\d+\. ", l))
            items = []
            while i < len(lignes) and re.match(r"^(- |\d+\. )", lignes[i]):
                items.append(re.sub(r"^(- |\d+\. )", "", lignes[i]))
                i += 1
            balise = "ol" if ordonne else "ul"
            sortie.append(f"<{balise}>" + "".join(f"<li>{en_ligne(x)}</li>" for x in items) + f"</{balise}>")
            continue
        para = []
        while i < len(lignes) and lignes[i].strip() and not re.match(r"^(#|```|\||- |\d+\. )", lignes[i]):
            para.append(lignes[i])
            i += 1
        sortie.append("<p>" + en_ligne(" ".join(para)) + "</p>")
    return "\n".join(sortie)


# ---------------------------------------------------------------- couverture

COUVERTURE = """<!-- @dsCard height=288 -->
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Lumineux</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { background: var(--fond); color: var(--texte); font-family: var(--font-texte); overflow: hidden; }
  .couv { position: relative; height: 288px; overflow: hidden; }
  .art { position: absolute; top: 0; left: 480px; width: 480px; height: 288px; overflow: hidden; }
  .art svg { display: block; width: 480px; height: 288px; }
  .soleil { fill: var(--soleil); }
  .ciel { fill: var(--ciel); }
  .braise { fill: var(--braise); }
  .fuchsia { fill: var(--fuchsia); }
  .cobalt { fill: var(--cobalt); }
  .capsule { rx: var(--rayon-capsule); }
  .carte { rx: var(--rayon-m); }
  .pilule { rx: var(--rayon-pilule); }
  .anneau { fill: none; stroke-width: var(--trait-anneau); }
  .anneau.ciel { stroke: var(--ciel); }
  .anneau.creux { stroke: var(--fond); }
  .mots { position: absolute; left: 32px; bottom: 32px; max-width: 440px; }
  .nom { margin: 0; font-family: var(--font-affiche); font-weight: 400; font-size: 96px; line-height: .92; }
  .tag { margin: 8px 0 0 4px; font-size: 14px; line-height: 20px; color: var(--texte-doux); }
</style>
</head>
<body>
<div class="couv">
<div class="art" aria-hidden="true">
<svg viewBox="0 0 480 288" width="480" height="288">
<!--
  blocs       cobalt 140×320 (capsule, bord supérieur coupé) · soleil 128×128 (le carré de .card) · braise 128×104 · fuchsia 168×200 (coupé à droite) · ciel en anneaux — environ 38 % de 960×288
  disposition une capsule haute en tête, puis une colonne de deux blocs et une dalle coupée à droite, bas alignés sur espace-6 au-dessus du bord
  motif       anneaux, pris à l'anneau portrait et au cadre lumineux (« chaque forme vient du code d'origine ») : trait-anneau 12 px, deux anneaux ciel (sur la capsule, sur le fond), deux creusés dans les blocs
  échelles    côtés en multiples d'espace-2 ; gouttières espace-4 ; rayons rayon-capsule (70), rayon-m (14), rayon-pilule (27), rayon-rond ; trait-anneau
-->
<rect class="cobalt capsule" x="24" y="-64" width="140" height="320" rx="70"/>
<rect class="soleil" x="180" y="24" width="128" height="128"/>
<rect class="braise carte" x="180" y="168" width="128" height="88" rx="14"/>
<rect class="fuchsia pilule" x="324" y="56" width="168" height="200" rx="27"/>
<circle class="anneau creux" cx="244" cy="88" r="34"/>
<circle class="anneau creux" cx="404" cy="156" r="40"/>
<circle class="anneau ciel" cx="94" cy="224" r="22"/>
<circle class="anneau ciel" cx="436" cy="20" r="26"/>
</svg>
</div>
<div class="mots">
<h1 class="nom">Lumineux</h1>
<p class="tag">La presse et la machine : un cadre lumineux pour des pages qu'on lit longtemps.</p>
</div>
</div>
</body>
</html>
"""


# ---------------------------------------------------------------- artefact

def artefact(dossier, blobs):
    projet = Path(dossier) / "project"
    idx = index_composants()
    icones = idx["icones"]

    def ecrire(chemin, contenu):
        p = projet / chemin
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(contenu, encoding="utf-8")

    ecrire("README.md", (DS / "README.md").read_text(encoding="utf-8"))
    ecrire("extraction.md", (DS / "extraction.md").read_text(encoding="utf-8"))
    ecrire("tokens.json", (DS / "tokens.json").read_text(encoding="utf-8"))
    css = (DOCS / "assets" / "css" / "lumineux.css").read_text(encoding="utf-8")
    ecrire("components/bundle.css", f'@import url("{POLICES}");\n\n' + css + "\n\n/* Mise en page des aperçus */\n" + CSS_APERCU + "\n")
    ecrire("components/bundle.js", (DOCS / "assets" / "js" / "lumineux.js").read_text(encoding="utf-8"))
    ecrire("components/index.d.ts", """// Lumineux est un système CSS : les composants sont des classes, pas des composants React.
// bundle.js expose seulement les comportements (tiroir, carrousel, quiz, copie, thème, rail).
declare global {
  interface Window {
    Lumineux: {
      /** Initialise tous les composants présents dans la page. Peut être rappelée sans effet de bord. */
      init(): void;
      /** Réinitialise seulement les quiz (après un ajout dynamique de contenu). */
      initQuiz(): void;
      /** Ajoute les boutons Copier aux blocs de code. */
      initCopie(): void;
    };
  }
}
export {};
""")
    for nom in idx["ordre"]:
        meta = idx["composants"][nom]
        ecrire(f"components/{nom}/README.md", (COMPOSANTS / nom / "README.md").read_text(encoding="utf-8"))
        corps = remplir((COMPOSANTS / nom / "apercu.html").read_text(encoding="utf-8"), icones,
                        lambda f: blobs[f])
        ecrire(f"components/{nom}/preview.html",
               f'<!-- @dsCard group="{meta["groupe"]}" height={meta["hauteur"]} -->\n'
               f'<!doctype html>\n<html lang="fr">\n<head><meta charset="utf-8"><title>{nom} · aperçu</title></head>\n'
               f"<body>\n{corps}<script>window.Lumineux && window.Lumineux.init();</script>\n</body>\n</html>\n")
    ecrire("components/Cover/preview.html", COUVERTURE)
    ecrire("assets/Photos/README.md",
           "Les cinq photographies du slider d'origine (`slidre2.html`), copiées telles quelles : "
           "`blog-1.jpg` (un barista verse du lait près d'une machine à expresso, 670 × 450), "
           "`blog-3.jpg` (café turc, baklavas et halva, 670 × 450), `gallery-4.jpg` (tasse de latte art, 150 × 150), "
           "`menu-2.jpg` (tasse de café et éclats de gaufrette sur fond noir, 200 × 200), "
           "`menu-5.jpg` (latte macchiato en couches, 200 × 200). Le slider d'origine les légendait « Himalaya », "
           "« Aurores Boréales », « Arctique », « Amazon », « Desert », sans rapport avec les images. Elles illustrent "
           "le `Carrousel` et l'`AnneauPortrait` ; elles ne sont pas liées au sujet du cours. Recadrage en `object-fit: cover`.\n")
    print(f"artefact écrit dans {projet}")


# ---------------------------------------------------------------- page du site

def page_site():
    idx = index_composants()
    icones = idx["icones"]
    t = json.loads((DS / "tokens.json").read_text(encoding="utf-8"))

    def valeurs(v):
        if isinstance(v, str):
            return f"<code>{v}</code>"
        return " · ".join(f"{('Nuit' if k == 'dark' else 'Jour')} <code>{x}</code>" for k, x in v.items())

    couleurs = "".join(
        f'<li class="nuancier__item"><span class="nuancier__pastille" style="background: var(--{c["name"]})"></span>'
        f'<span><strong><code>{c["name"]}</code></strong><br><span class="nuancier__valeurs">{valeurs(c["value"])}</span>'
        f'<br><span class="nuancier__usage">{html.escape(c["usage"])}</span></span></li>'
        for c in t["color"]["tokens"])
    styles = "".join(
        f'<li class="specimen"><p class="{s["name"]}" style="margin:0">{html.escape(s.get("sample", s["name"]))}</p>'
        f'<p class="nuancier__valeurs"><code>{s["name"]}</code> · {s["fontSize"]}/{s["lineHeight"]} · '
        f'{html.escape(s.get("usage", ""))}</p></li>'
        for g in t["type"]["groups"] for s in g["styles"])
    espaces = "".join(
        f'<li class="regle-espace"><span class="regle-espace__barre" style="inline-size: var(--{e["name"]})"></span>'
        f'<code>{e["name"]}</code> {e["value"]} · {html.escape(e["usage"])}</li>' for e in t["spacing"]["tokens"])
    rayons = "".join(
        f'<li class="rayon-demo"><span class="rayon-demo__forme" style="border-radius: var(--{r["name"]})"></span>'
        f'<code>{r["name"]}</code><span class="nuancier__valeurs">{r["value"]}</span></li>' for r in t["radius"]["tokens"])
    ombres = "".join(
        f'<li class="ombre-demo"><span class="ombre-demo__forme" style="box-shadow: var(--{o["name"]})"></span>'
        f'<code>{o["name"]}</code><span class="nuancier__usage">{html.escape(o["usage"])}</span></li>' for o in t["shadow"]["tokens"])

    composants = []
    for nom in idx["ordre"]:
        meta = idx["composants"][nom]
        doc = (COMPOSANTS / nom / "README.md").read_text(encoding="utf-8")
        doc = re.sub(r"^# .*\n", "", doc)
        corps = remplir((COMPOSANTS / nom / "apercu.html").read_text(encoding="utf-8"), icones,
                        lambda f: f"assets/img/{f}")
        composants.append(
            f'<article class="lecon" id="composant-{nom.lower()}"><p class="surtitre">{meta["groupe"]}</p>'
            f'<h3>{nom}</h3><div class="composant-apercu">{corps}</div>'
            f'<details class="corrige"><summary>Règles d\'usage</summary><div class="corrige-corps">{markdown(doc, 4)}</div></details></article>')

    nav = "".join(f'<li><a href="#composant-{n.lower()}">{n}</a></li>' for n in idx["ordre"])
    guide = markdown((DS / "README.md").read_text(encoding="utf-8"), 3)
    audit = markdown(re.sub(r"^# .*\n", "", (DS / "extraction.md").read_text(encoding="utf-8")), 3)
    liste_composants = "".join(composants)
    page = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Lumineux · système de design</title>
<link rel="stylesheet" href="{html.escape(POLICES)}">
<link rel="stylesheet" href="assets/css/lumineux-tokens.css">
<link rel="stylesheet" href="assets/css/lumineux.css">
<link rel="stylesheet" href="assets/css/cours.css">
<style>
{CSS_APERCU}
.composant-apercu {{ border: 1px solid var(--ligne); border-radius: var(--rayon-m); background: var(--fond); margin-block: var(--espace-4); overflow: hidden; }}
.nuancier {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: var(--espace-3); list-style: none; padding: 0; margin: var(--espace-5) 0; }}
.nuancier__item {{ display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: var(--espace-3); align-items: start; font-size: 14px; line-height: 1.45; }}
.nuancier__pastille {{ inline-size: 56px; block-size: 56px; border-radius: var(--rayon-s); border: 1px solid var(--ligne); }}
.nuancier__valeurs {{ color: var(--texte-doux); font-size: 13px; }}
.nuancier__usage {{ color: var(--texte-doux); }}
.specimens, .regles-espace, .rayons, .ombres {{ list-style: none; padding: 0; margin: var(--espace-5) 0; display: grid; gap: var(--espace-4); }}
.specimen {{ padding-block-end: var(--espace-3); border-block-end: 1px solid var(--ligne); }}
.regle-espace {{ display: flex; align-items: center; gap: var(--espace-3); font-size: 14px; }}
.regle-espace__barre {{ block-size: 16px; background: var(--lien); border-radius: 2px; flex: none; }}
.rayons, .ombres {{ grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }}
.rayon-demo, .ombre-demo {{ display: grid; gap: 6px; font-size: 14px; }}
.rayon-demo__forme {{ block-size: 72px; border: 2px solid var(--ligne-forte); background: var(--surface); }}
.ombre-demo__forme {{ block-size: 72px; border-radius: var(--rayon-m); background: var(--surface); }}
.prisme-bande {{ block-size: 48px; border-radius: var(--rayon-pilule); background: var(--prisme); }}
</style>
</head>
<body>
<header class="entete">
  <div class="entete__barre">
    <a class="entete__marque" href="index.html"><span class="anneau-prisme" aria-hidden="true"></span>IA <small>Retour au cours</small></a>
    <button type="button" class="bouton-verre" data-bascule-theme aria-label="Changer de thème"><svg class="icone" viewBox="0 0 24 24" aria-hidden="true">{icones["contraste"]}</svg></button>
  </div>
</header>
<main class="page" style="grid-template-columns: minmax(0, 1fr)">
  <div class="page__contenu" style="margin-inline: auto; inline-size: 100%">
    <section class="chapitre" id="haut">
      <header class="chapitre-tete">
        <p class="surtitre">Système de design</p>
        <div class="pastille-titre"><h1>Lumineux</h1></div>
        <p class="chapeau">Le système qui met en forme ce site. Il reprend les démos « Cadre Lumineux », « menu capsule » et « slider » du dépôt, en garde les couleurs, les formes et les lueurs, et corrige ce qui empêchait de lire. Les jetons sont définis dans <code>design-system/tokens.json</code>.</p>
      </header>
      <div class="prisme-bande" role="img" aria-label="Le dégradé prisme : soleil, ciel, braise, fuchsia, cobalt"></div>
      <nav class="sommaire-chapitre" aria-label="Sommaire" style="margin-block-start: var(--espace-6)"><ol>
        <li><a href="#principes">Principes et règles</a></li><li><a href="#extraction">Extraction du code d'origine</a></li>
        <li><a href="#couleurs">Couleurs</a></li><li><a href="#typo">Typographie</a></li>
        <li><a href="#formes">Espaces, rayons, ombres</a></li><li><a href="#composants">Composants</a></li>
      </ol></nav>
    </section>
    <section class="chapitre" id="principes"><header class="chapitre-tete"><p class="surtitre">Guide</p><h2 class="titre-section">Principes et règles</h2></header>
      <article class="lecon">{guide}</article></section>
    <section class="chapitre" id="extraction"><header class="chapitre-tete"><p class="surtitre">Audit</p><h2 class="titre-section">Extraction du code d'origine</h2></header>
      <article class="lecon">{audit}</article></section>
    <section class="chapitre" id="couleurs"><header class="chapitre-tete"><p class="surtitre">Jetons</p><h2 class="titre-section">Couleurs</h2>
      <p class="chapeau">Chaque pastille montre la valeur du thème affiché. Basculez Nuit / Jour en haut à droite pour voir l'autre.</p></header>
      <ul class="nuancier">{couleurs}</ul></section>
    <section class="chapitre" id="typo"><header class="chapitre-tete"><p class="surtitre">Jetons</p><h2 class="titre-section">Typographie</h2></header>
      <ul class="specimens">{styles}</ul></section>
    <section class="chapitre" id="formes"><header class="chapitre-tete"><p class="surtitre">Jetons</p><h2 class="titre-section">Espaces, rayons, ombres</h2></header>
      <h3 class="surtitre">Espacements</h3><ul class="regles-espace">{espaces}</ul>
      <h3 class="surtitre">Rayons</h3><ul class="rayons">{rayons}</ul>
      <h3 class="surtitre">Ombres et lueurs</h3><ul class="ombres">{ombres}</ul></section>
    <section class="chapitre" id="composants"><header class="chapitre-tete"><p class="surtitre">Bibliothèque</p><h2 class="titre-section">Composants</h2>
      <p class="chapeau">Quinze composants : sept repris des démos, huit ajoutés pour un site de cours. Chaque aperçu est vivant.</p></header>
      <nav class="sommaire-chapitre" aria-label="Composants"><ol>{nav}</ol></nav>
      {liste_composants}</section>
  </div>
</main>
<script src="assets/js/lumineux.js"></script>
</body>
</html>
"""
    sortie = DOCS / "systeme-de-design.html"
    sortie.write_text(page, encoding="utf-8")
    print(f"écrit : {sortie.relative_to(RACINE)} ({sortie.stat().st_size // 1024} Ko)")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--artefact")
    p.add_argument("--blobs", help="JSON {fichier: url} des images téléversées dans l'artefact")
    a = p.parse_args()
    if a.artefact:
        blobs = json.loads(Path(a.blobs).read_text(encoding="utf-8")) if a.blobs else {}
        artefact(a.artefact, blobs)
    else:
        page_site()


if __name__ == "__main__":
    main()
