# Extraction du code d'origine

Inventaire exact de ce que contiennent les démos du dossier `ليان ليان/` (`color.html`, sa copie sans extension `color`, `ins.html`, `slidre2.html`) et ce que Lumineux en fait.

## Couleurs relevées

| Valeur d'origine | Où | Jeton Lumineux |
| --- | --- | --- |
| `black` / `#000` | fond de `color.html` et `ins.html` | `fond` (Nuit) `#07070a` |
| `#151515` | fond de `.card` | `surface` (Nuit), inchangé |
| `#FFFF00` | 1ᵉʳ arrêt du dégradé (`.card`, `.title`) | `soleil` |
| `#87CEEB` | 2ᵉ arrêt | `ciel` |
| `#ff512f` | 3ᵉ arrêt | `braise` |
| `#dd2476` | 4ᵉ arrêt | `fuchsia` |
| `#1c64ff` | 5ᵉ arrêt | `cobalt` |
| `darkred` (`#8B0000`) | anneau de `.img` | `grenat` |
| `whitesmoke` (`#F5F5F5`) | bord de `.title` | `texte` (Nuit) |
| `rgba(20, 20, 20, 0.3)` | fond de `.h1` | `verre-noir` (référence) ; `voile` à 0,7 pour le texte |
| `rgba(255, 255, 255, 0.3)` | fond de `.chevronbs` | `verre-blanc` |
| `white` | texte de `.h1`, bords de `.menu`, `.slider`, `.chevronbs` | `texte` (Nuit) |
| `rgb(181, 172, 172)` → `black` | fond de `slidre2.html` | non repris : le dégradé gris réduisait le contraste du texte |

## Typographie relevée

- Une seule famille employée : `IM Fell DW Pica SC` (le `.h1` de `color.html`, 40 px). Reprise pour les titres (`affiche-*`).
- Dix familles importées mais inutilisées : Anton, Bangers, Cinzel Decorative, Cookie, El Messiri, Pacifico, Rajdhani (400, 500), Schoolbell, Square Peg, Tapestry. Lumineux garde **Rajdhani** (étiquettes, `signal`) et **El Messiri** (texte arabe) ; il ajoute **Literata** pour le texte courant et **JetBrains Mono** pour le code.
- Tailles : 40 px (`.h1` du cadre), 25 px (légende du slider), 36 px (bouton fermer du menu).

## Formes relevées

| Élément | Dimensions | Rayon | Trait |
| --- | --- | --- | --- |
| `.card` | 300 × 300 | 0 | 27 px, `border-image` dégradé |
| `.img` | 250 × 250 | 50 % | 12 px `darkred` |
| `.title` | 350 × 100 | 27 px | 1 px `whitesmoke` |
| `.h1` (cadre) | 320 × 80 | 27 px | aucun |
| `.menu` | 150 × 500 | 70 px | 4 px blanc |
| `.icon` | 80 × 80 → 100 × 100 au survol | 50 % au survol | aucun |
| `.chevronbs` | 100 × 90 | 50 % | 1 px blanc |
| `.slider` | 400 × 360 | 0 | 12 px blanc |
| `.h1` (slider) | 300 × 45 | 20 px | aucun |
| `.dev` | 70 × 70 | 50 % | aucun |

Ombres : `0.5px 0.5px 1em white` (`halo`), `inset 2.5px 2.5px 4em black, 2.5px 2.5px 4em white` (`halo-survol`), `inset 1.25px 1.25px 1.75em white` (`lueur-interne`).

## Mouvements relevés

| Animation | Réglage d'origine | Dans Lumineux |
| --- | --- | --- |
| `rotate` (bord du cadre) | 2,5 s `ease-in`, bascule d'angle à 50 % | rotation conique continue en 6 s (`@property --lx-angle`) |
| `img` (portrait) | 7 s, `scale(0.8)` à 50 % | 7 s, `scale(.94)` : plus doux |
| `title` (pastille) | 1 s, inversion du dégradé | glissement de 9 s, aller-retour |
| `slid` (slider) | 14 s, `translateX` de −800 à 800 px | défilement par accroche, 7 s par diapo, pause et commandes |
| `.icon:hover` | 0,7 s, `scale(1.2)` | 700 ms, `scale(1.12)` |
| `.sidenav` | 0,5 s sur `height` | 500 ms sur `transform` |

## Défauts corrigés

1. **Hauteurs fixes** (`body { height: 915px }`, conteneurs de 697 à 800 px) : les pages débordaient sur téléphone. Tout est désormais dimensionné par le contenu.
2. **Contraste du titre** : texte blanc sur verre à 30 % posé sur le jaune, soit 2,1:1. Le `voile` à 70 % donne 7,1:1 sur l'arrêt le plus clair.
3. **Déclarations invalides**, ignorées par les navigateurs : `padding: 14px, 17px` (virgule), `@media (max-heigth: 450px)` (faute de frappe), `background-position-x: start`.
4. **`.chevronbs:hover { opacity: 0 }`** : le bouton du menu disparaissait sous le pointeur.
5. **Clignotement** : le dégradé de la pastille s'inversait chaque seconde. Lumineux ne clignote plus et respecte `prefers-reduced-motion`.
6. **Accessibilité** : boutons sans nom accessible, images d'icônes sans `alt`, lien `javascript:void(0)`, cinq `h1` dans le slider, aucune gestion du focus ni de la touche Échap dans le menu. Tous corrigés dans les composants.
7. **Dépendances externes** : icônes PNG chargées depuis icons8. Remplacées par des icônes SVG en ligne.
8. **Fichiers manquants** référencés par les démos : `style.css`, `code.js`, `1.png`, `dev.png.PNG`.
9. **Doublon** : `color` et `color.html` ont un contenu identique.
10. **Balisage** : `<style>` dans `<body>`, `</style>` orphelin dans `color.html`.
