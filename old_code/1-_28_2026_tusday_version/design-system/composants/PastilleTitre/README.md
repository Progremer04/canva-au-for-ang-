# PastilleTitre

Un titre en petites capitales posé sur du verre sombre, dans une pilule au dégradé prisme : l'enseigne d'une page.

Repris de `.title` et `.h1` (`color.html`, « Cadre Lumineux »). Le verre passe de 30 % à 70 % d'opacité (`voile`) : le texte blanc tient 7,1:1 même sur l'arrêt jaune. Le dégradé glisse sur 9 s au lieu de s'inverser chaque seconde.

## Quand l'utiliser

- Pour un titre d'affiche, une couverture, une page d'accueil de rubrique. Une seule par écran.
- Pas pour les titres de section courants : ils sont en `affiche-l` sans décor.

## Ce que vous fournissez

```html
<div class="pastille-titre"><h1>Cadre Lumineux</h1></div>
```

L'élément enfant (n'importe quel niveau de titre) reçoit `affiche-l`, `voile` et `sur-voile`.

## Règles

- Rayon `rayon-pilule` (27 px) ; bord `trait-fin` en `texte`.
- Taille fluide de 22 à 40 px ; le texte ne passe jamais à la ligne plus de deux fois.
