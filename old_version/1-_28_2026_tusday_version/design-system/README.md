Lumineux reprend les démos « Cadre Lumineux », « menu capsule » et « slider » de ce dépôt et en fait un système complet pour des pages de cours à lire longtemps. Une idée le porte : **la presse et la machine**. Un caractère d'imprimerie du XVIIIᵉ siècle (IM Fell DW Pica SC) rencontre le spectre lumineux d'un écran (le dégradé à cinq arrêts des démos). Tout le reste est calme pour que ces deux signes restent lisibles.

## Principes

- **Un seul objet lumineux par écran.** Le dégradé prisme s'emploie une fois par vue : le `Cadre lumineux` du héros, ou le bord d'un `Bouton` principal, ou la barre de progression. Jamais sur un fond de texte, jamais sur deux cartes voisines.
- **Nuit d'abord, Jour à égalité.** Le thème `dark` (Nuit) est le thème d'origine et le premier thème des jetons. Le thème `light` (Jour) reçoit le même soin : chaque jeton de texte y tient 4,5:1 sur ses fonds.
- **Lire avant de briller.** Le texte courant est en `corps` (Literata 17/28) sur `fond` ou `surface`, 68 caractères par ligne au plus. Les effets (halo, lueur, rotation) décorent les bords, jamais le texte.
- **Chaque forme vient du code d'origine.** Les rayons 20, 27, 70 et 50 %, les traits de 1, 4, 12 et 27 px, les trois lueurs blanches et les cinq couleurs du prisme sont repris à l'identique. Les valeurs nouvelles comblent des manques (neutres du thème Jour, textes teintés lisibles, focus).

## Contenu et ton

- Écrire en français, vouvoyer le lecteur : « Cochez les faits présents au départ, puis avancez pas à pas. »
- Phrases courtes et actives. Un bouton dit ce qu'il fait : « Examiner la règle suivante », « Voir le corrigé », « Copier ».
- Casse de phrase pour les titres (« Survol historique de l'intelligence artificielle »). Les capitales sont réservées au style `signal` (surtitres, puces, en-têtes de tableau) : « CHAPITRE 3 · 6 SEMAINES ».
- Pas d'emoji, pas de points d'exclamation dans l'interface.
- Un terme technique est défini à sa première apparition avec `<dfn>`, l'équivalent anglais suit une fois en `.terme-en` : « apprentissage automatique (*machine learning*) ».
- Les chiffres suivent l'usage français : virgule décimale (« 0,74 »), espace avant `:` `;` `?` `!`.

## Couleur

- Posez le fond de page en `fond`, les objets en `surface`, les objets imbriqués (en-têtes de tableau, code en ligne, options de quiz) en `surface-2`.
- Texte principal en `texte` ; légendes et métadonnées en `texte-doux`. Les deux tiennent au moins 6:1 sur `fond`, `surface` et `surface-2` dans les deux thèmes.
- Filets décoratifs en `ligne`. Tout bord qui délimite un contrôle (bouton, champ, option) prend `ligne-forte` (3:1 minimum).
- Liens et élément actif du rail en `lien` (bleu ciel la nuit, cobalt le jour).
- Le prisme se compose toujours dans cet ordre : `soleil` → `ciel` → `braise` → `fuchsia` → `cobalt` (variable CSS `--prisme`). Ces cinq jetons sont des **remplissages** ; ils ne portent jamais de texte en thème Jour (le jaune y tombe à 1,02:1).
- Pour du texte teinté, utilisez la variante `-texte` sur la variante `-voile` de la même teinte : `ciel-texte` sur `ciel-voile` (Définition), `soleil-texte` sur `soleil-voile` (Exemple), `braise-texte` sur `braise-voile` (Attention), `fuchsia-texte` sur `fuchsia-voile` (À retenir), `cobalt-texte` sur `cobalt-voile` (Lettres & SHS).
- Réponse juste : `juste` sur `juste-voile`, toujours accompagnée du mot « Juste ». Réponse fausse : `braise-texte` sur `braise-voile` et le mot « Non ». La couleur ne porte jamais seule l'information.
- `grenat` (le `darkred` de l'anneau d'origine) reste décoratif : 2,1:1 sur noir, il ne signale rien.
- Le verre : `verre-blanc` pour le fond des boutons ronds la nuit ; `voile` (verre sombre à 70 %) sous tout texte posé sur le prisme, avec `sur-voile` pour le texte.

## Typographie

| Style | Famille | Taille / interligne | Usage |
| --- | --- | --- | --- |
| `affiche-xl` | IM Fell DW Pica SC | 60/60 (jusqu'à 84 px en héros) | Le titre du héros, une fois par page |
| `affiche-l` | IM Fell DW Pica SC | 40/44 | Titres de section, `Pastille titre` |
| `affiche-m` | IM Fell DW Pica SC | 28/34 | Titres de leçon (h3), citations |
| `titre-s` | Literata 600 | 21/28 | Sous-titres (h4), titres de carte |
| `corps` | Literata 400 | 17/28 | Texte courant |
| `corps-s` | Literata 400 | 15/24 | Légendes, cellules, encadrés denses |
| `signal` | Rajdhani 600, capitales, +0,08 em | 13/16 | Surtitres, puces, en-têtes de tableau |
| `signal-l` | Rajdhani 600 | 17/20 | Boutons, rail, tiroir |
| `code-bloc` | JetBrains Mono | 14/22 | Code |

- IM Fell DW Pica SC n'a qu'une graisse et que des petites capitales : ne la mettez jamais en gras, ni en italique, ni sous 24 px.
- Les titres prennent `text-wrap: balance` ; les paragraphes `text-wrap: pretty`.
- Le texte arabe passe en `--font-arabe` (El Messiri, déjà importée par les démos d'origine) via `:lang(ar)`.
- Les chiffres alignés en colonne (tableaux, dates, scores) prennent `font-variant-numeric: tabular-nums`.

## Espacement, rayons, traits

- Base 4 px : `espace-1` (4) à `espace-9` (96). Marge latérale de page : `espace-4` sur téléphone, `espace-6` sur ordinateur.
- Espacez les groupes frères avec `gap` (flex ou grid), pas avec des marges individuelles.
- Rayons : `rayon-s` (6) pour le code en ligne et les champs, `rayon-m` (14) pour cartes, encadrés, blocs de code, `rayon-l` (20) pour la légende du carrousel, `rayon-pilule` (27) pour puces, boutons et pastille, `rayon-capsule` (70) pour le rail, `rayon-rond` pour les boutons ronds et l'anneau.
- Traits : `trait-fin` (1) pour les filets, `trait-controle` (2) pour les contrôles et le focus, `trait-cadre` (4) pour le rail, `trait-prisme` (6) pour le cadre lumineux, `trait-anneau` (12) pour l'anneau portrait et le carrousel, `trait-affiche` (27) pour un cadre d'affiche seulement.

## Ombres et lueurs

- `halo` : bouton rond au repos (la lueur blanche de `.chevronbs`). En thème Jour, elle devient un filet.
- `halo-survol` : survol des icônes du rail et des boutons ronds (l'ombre double de `.icon:hover`).
- `lueur-interne` : la légende du carrousel (le `.h1` du slider).
- `ombre-carte` : cartes flottantes et tiroir. Les cartes posées dans le texte n'ont pas d'ombre, seulement un filet `ligne`.
- `anneau-focus` : variante en `box-shadow` du focus, pour les éléments à rayon.

## Mouvement

- Durées : 150 ms (états), 500 ms (tiroir, repris de `.sidenav`), 700 ms (survol, repris de `.icon:hover`), 6 s (rotation du cadre lumineux, ralentie depuis 2,5 s), 7 s (souffle de l'anneau, conservé ; défilement automatique du carrousel).
- Courbe par défaut : `cubic-bezier(.2, .7, .2, 1)`.
- Sous `prefers-reduced-motion: reduce`, la rotation, le miroitement et le souffle s'arrêtent et le carrousel ne défile plus seul.
- Rien ne clignote : le dégradé de la pastille glisse sur 9 s au lieu de s'inverser chaque seconde.

## Focus et accessibilité

- Focus clavier : contour plein de 2 px (`trait-controle`) en `focus`, décalé de 2 px. `focus` vaut `soleil` la nuit (15:1 ou plus sur toutes les surfaces) et `cobalt` le jour (4:1 ou plus).
- Cibles tactiles de 44 px minimum (boutons, options de quiz, résumé des corrigés).
- Tout bouton icône porte un `aria-label` ; tout carrousel a des commandes précédent / suivant / pause.

## Iconographie

- Icônes au trait, dessinées pour Lumineux : grille 24 px, trait 1,8 px, extrémités arrondies, `stroke: currentColor` (classe `.icone`). Elles s'insèrent en SVG en ligne (`<svg class="icone"><use href="#i-maison"/></svg>`) pour hériter de la couleur du texte.
- Jeu actuel : `menu`, `fermer`, `contraste`, `maison`, `fiche`, `calendrier`, `ampoule`, `crayon`, `bulle`, `livre`, `outil`.
- **Substitution signalée** : les démos d'origine chargeaient des PNG d'icons8 par URL (maison, contraste, service, utilisateur, exclamation, menu, fermer). Ils n'étaient pas dans le dépôt et dépendent d'une licence tierce ; ils sont remplacés par les icônes ci-dessus, de sens équivalent (`maison`, `contraste`, `outil`, `menu`, `fermer`).
- Le marqueur « vivant » est l'`anneau-prisme` : un petit anneau conique aux couleurs du prisme devant toute démonstration interactive. Ne l'employez pas ailleurs.

## Images

- Le groupe `Photos` contient les cinq photographies du slider d'origine : cinq photos de café (barista, café turc et baklava, latte art, café et gaufrette, latte macchiato). Le slider les légendait « Himalaya », « Aurores boréales », « Arctique », « Amazon », « Desert », sans rapport avec les images. Elles servent d'exemple au `Carrousel` et à l'`AnneauPortrait` ; elles ne sont pas liées au sujet du cours.
- Une photo se recadre en `object-fit: cover` au format 4:3 dans le carrousel. Chaque image informative a un `alt` qui décrit ce qu'on voit.

## Composants

Repris des démos d'origine :

- `CadreLumineux` : le cadre au bord prisme en rotation (`.card`). Un par écran.
- `PastilleTitre` : titre en petites capitales sur verre sombre, dans une pilule prisme (`.title` + `.h1`).
- `BoutonVerre` : bouton rond en verre avec halo (`.chevronbs`, `.icon`).
- `RailCapsule` : navigation verticale en capsule (`.menu`, `.item`).
- `Tiroir` : menu latéral pour petits écrans (`.sidenav`, `openNav()`).
- `Carrousel` : diaporama à cadre blanc épais et légende lumineuse (`.slider`, `.slid`).
- `AnneauPortrait` : portrait rond cerclé de grenat qui respire (`.img`, `.dev`).

Ajouts intentionnels, nécessaires à un site de cours et absents des démos :

- `Bouton` : action en texte (pilule), avec une variante `--prisme` pour l'action principale.
- `Encadre` : définition, exemple, attention, à retenir, lettres & SHS.
- `Puce` : étiquette courte (durée, outil).
- `BlocCode` : code Python avec légende, bouton Copier et sortie console.
- `Exercice` : énoncé et corrigé repliable.
- `Quiz` : question d'auto-évaluation à réponse unique.
- `Chronologie` : suite datée.
- `Tableau` : tableau défilant avec légende.

## Mise en page

- Colonne de lecture de 780 px au plus, rail de 236 px à gauche au-delà de 1080 px ; en dessous, le rail disparaît au profit du `Tiroir`.
- En-tête collant de 64 px (`top: env(safe-area-inset-top, 0px)`), traversé en bas par la barre de progression prisme de 2 px.
- Le héros se dimensionne à son contenu, jamais à `100vh`.
- Grilles de cartes à 2 ou 3 colonnes selon le nombre de cartes, pour que les rangées soient pleines ; une seule colonne sous 640 px.
