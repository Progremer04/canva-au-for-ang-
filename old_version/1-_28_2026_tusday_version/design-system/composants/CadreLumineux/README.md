# CadreLumineux

Le cadre au bord prisme en rotation : il met en valeur l'unique objet vivant d'un écran (une démonstration, un outil).

Repris de `.card` et de `@keyframes rotate` (`color.html`). Le bord animé par `border-image`, qui sautait d'un angle à l'autre, devient un dégradé conique qui tourne en continu (`@property --lx-angle`, 6 s).

## Quand l'utiliser

- Une fois par écran, autour de ce que le lecteur doit essayer : le lecteur de sentiments du héros, par exemple.
- Pas pour un simple encadré de texte (prenez `Encadre`), ni pour une grille de cartes.

## Ce que vous fournissez

```html
<div class="cadre-lumineux">
  <div class="cadre-lumineux__contenu">…</div>
</div>
```

- Le contenu va dans `.cadre-lumineux__contenu` (fond `surface`, marge interne `espace-5`).
- `.cadre-lumineux--carre` retrouve les angles droits de la démo d'origine ; `.cadre-lumineux--affiche` son bord de 27 px (`trait-affiche`), pour une affiche seulement.

## Règles

- Bord : `trait-prisme` (6 px) ; rayon `rayon-m` ; ombre `ombre-carte`.
- La rotation s'arrête sous `prefers-reduced-motion`.
- Ne posez jamais de texte directement sur le bord prisme.
