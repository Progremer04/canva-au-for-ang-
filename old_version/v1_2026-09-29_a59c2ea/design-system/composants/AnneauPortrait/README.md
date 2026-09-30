# AnneauPortrait

Un portrait rond cerclé de grenat qui respire lentement : pour une personne (enseignant, auteur étudié).

Repris de `.img` (anneau `darkred` de 12 px, `@keyframes img` 7 s) et de `.dev` (avatar rond du pied de page). L'amplitude passe de `scale(.8)` à `scale(.94)`.

## Ce que vous fournissez

```html
<figure class="anneau-portrait"><img src="…" alt="Portrait de …"></figure>
```

- `.anneau-portrait--petit` : 56 px, trait de 4 px, sans animation (listes, pied de page).
- Sans photo, mettez des initiales dans l'anneau.

## Règles

- Bord `trait-anneau` en `grenat` : décoratif, il ne porte aucune information.
- L'image a toujours un `alt` qui nomme la personne.
- Le souffle s'arrête sous `prefers-reduced-motion`.
