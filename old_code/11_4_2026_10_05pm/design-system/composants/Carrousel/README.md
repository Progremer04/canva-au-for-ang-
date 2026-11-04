# Carrousel

Un diaporama au cadre épais et à la légende lumineuse, qui avance seul et s'arrête dès qu'on le touche.

Repris de `.slider`, `.slid` et `@keyframes slid` (`slidre2.html`, cinq photos). Le défilement CSS de 14 s, sans commande, devient une piste à accroche (`scroll-snap`) avec précédent, suivant, points et pause ; il avance toutes les 7 s sauf sous `prefers-reduced-motion`.

## Ce que vous fournissez

```html
<div class="carrousel" data-carrousel data-auto aria-roledescription="carrousel" aria-label="Photos">
  <div class="carrousel__piste">
    <figure class="carrousel__diapo"><img src="…" alt="…"><figcaption class="carrousel__legende">Latte art</figcaption></figure>
  </div>
  <div class="carrousel__commandes">
    <button class="bouton-verre" data-carrousel-precedent aria-label="Diapositive précédente">…</button>
    <ol class="carrousel__points"></ol>
    <button class="bouton bouton--petit" data-carrousel-pause>Pause</button>
    <button class="bouton-verre" data-carrousel-suivant aria-label="Diapositive suivante">…</button>
  </div>
</div>
```

- Sans `data-auto`, le carrousel ne défile qu'à la demande.
- Les points sont créés par `Lumineux.init()`.

## Règles

- Cadre `trait-anneau` en `texte`, rayon `rayon-l`.
- Légende en `affiche`, fond `surface`, lueur `lueur-interne`, une ligne.
- Une légende par image, en `figcaption` (pas de `h1`), qui décrit vraiment l'image : les légendes du slider d'origine (« Himalaya », « Désert »…) ne correspondaient pas aux photos.
