#!/usr/bin/env python3
"""Génère docs/assets/css/lumineux-tokens.css à partir de design-system/tokens.json.

Le thème « Nuit » (dark) est le thème par défaut, posé sur :root.
Le thème « Jour » (light) s'applique :
  - quand le système demande un thème clair, sauf si data-theme="dark" est posé ;
  - quand data-theme="light" est posé explicitement.

Usage : python3 tools/build_tokens.py
"""
import json
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "design-system" / "tokens.json"
CIBLE = RACINE / "docs" / "assets" / "css" / "lumineux-tokens.css"


def valeur(v, theme, premier):
    if isinstance(v, str):
        return v
    return v.get(theme, v.get(premier))


def css_valeur(v):
    # Un alias "{nom}" devient var(--nom)
    if isinstance(v, str) and v.startswith("{") and v.endswith("}"):
        return f"var(--{v[1:-1]})"
    return v


def main():
    t = json.loads(SOURCE.read_text(encoding="utf-8"))
    themes = [th["id"] for th in t["color"]["themes"]]
    premier, second = themes[0], themes[1]
    themables = t["color"]["tokens"] + t.get("shadow", {}).get("tokens", [])

    def bloc(theme, seulement_differents=False):
        lignes = []
        for tok in themables:
            v = tok["value"]
            if seulement_differents and (isinstance(v, str) or v.get(theme) is None):
                continue
            lignes.append(f"  --{tok['name']}: {css_valeur(valeur(v, theme, premier))};")
        return "\n".join(lignes)

    fixes = []
    for famille in ("spacing", "radius", "trait"):
        for tok in t.get(famille, {}).get("tokens", []):
            fixes.append(f"  --{tok['name']}: {tok['value']};")
    for cle, pile in t["type"]["families"].items():
        fixes.append(f"  --font-{cle}: {pile};")

    styles = []
    for groupe in t["type"]["groups"]:
        famille = groupe.get("family")
        for s in groupe["styles"]:
            regles = [f"font-family: var(--font-{s.get('family', famille)})",
                      f"font-size: {s['fontSize']}",
                      f"line-height: {s['lineHeight']}",
                      f"font-weight: {s['fontWeight']}"]
            if "letterSpacing" in s:
                regles.append(f"letter-spacing: {s['letterSpacing']}")
            styles.append(f".{s['name']} {{ {'; '.join(regles)}; }}")

    css = f"""/* Lumineux — jetons de design.
   FICHIER GÉNÉRÉ par tools/build_tokens.py depuis design-system/tokens.json.
   Ne pas modifier à la main. */

:root {{
  color-scheme: dark;
{bloc(premier)}
{chr(10).join(fixes)}
}}

@media (prefers-color-scheme: light) {{
  :root:not([data-theme="{premier}"]) {{
    color-scheme: light;
{chr(10).join('  ' + l for l in bloc(second, True).splitlines())}
  }}
}}

:root[data-theme="{second}"] {{
  color-scheme: light;
{bloc(second, True)}
}}

:root[data-theme="{premier}"] {{
  color-scheme: dark;
}}

/* Styles typographiques */
{chr(10).join(styles)}
"""
    CIBLE.parent.mkdir(parents=True, exist_ok=True)
    CIBLE.write_text(css, encoding="utf-8")
    print(f"écrit : {CIBLE.relative_to(RACINE)} ({len(themables)} jetons à thème, {len(fixes)} jetons fixes)")


if __name__ == "__main__":
    main()
