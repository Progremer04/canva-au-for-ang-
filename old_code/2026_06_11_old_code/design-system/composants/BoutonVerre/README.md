# BoutonVerre

Le bouton rond en verre, pour une icône seule : menu, fermer, thème, précédent, suivant.

Repris de `.chevronbs` (verre blanc à 30 %, bord blanc, halo) et de `.icon:hover` (agrandissement, double lueur). Le défaut d'origine `.chevronbs:hover { opacity: 0 }`, qui faisait disparaître le bouton, est corrigé.

## Ce que vous fournissez

```html
<button type="button" class="bouton-verre" aria-label="Ouvrir le menu">
  <svg class="icone" aria-hidden="true">…</svg>
</button>
```

## Règles

- 44 × 44 px, `rayon-rond`, fond `verre-blanc`, ombre `halo` ; survol `halo-survol` et `scale(1.08)` en 700 ms.
- Un `aria-label` obligatoire : le bouton n'a pas de texte visible.
- Icône `.icone` : trait 1,8 px en `currentColor`.
