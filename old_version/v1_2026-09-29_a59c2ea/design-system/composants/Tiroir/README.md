# Tiroir

Le menu latéral des petits écrans : il glisse depuis la gauche au-dessus d'un voile sombre.

Repris de `.sidenav` et des fonctions `openNav()` / `closeNav()` (`ins.html`). L'animation passe de `height` à `transform` (500 ms), le focus entre dans le tiroir à l'ouverture et revient au bouton à la fermeture, Échap et un clic sur le voile ferment.

## Ce que vous fournissez

```html
<button class="bouton-verre" data-ouvre-tiroir="tiroir-nav" aria-controls="tiroir-nav" aria-label="Ouvrir le menu">…</button>
<div class="tiroir-voile" data-voile-tiroir="tiroir-nav"></div>
<aside class="tiroir" id="tiroir-nav" aria-label="Menu du cours">
  <div class="tiroir__tete"><p class="tiroir__titre">Sommaire du cours</p>
    <button class="bouton-verre" data-ferme-tiroir aria-label="Fermer le menu">…</button></div>
  <!-- le même contenu que le RailCapsule -->
</aside>
```

## Règles

- Largeur `min(340px, 88vw)`, fond `surface`, ombre `ombre-carte`.
- Les marges tiennent compte de `env(safe-area-inset-*)`.
- Un lien interne cliqué ferme le tiroir.
