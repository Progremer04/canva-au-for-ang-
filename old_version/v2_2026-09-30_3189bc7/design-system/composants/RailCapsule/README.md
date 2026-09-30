# RailCapsule

La navigation verticale en capsule : la liste des sections d'une longue page, collée à gauche sur grand écran.

Repris de `.menu` (150 × 500, rayon 70 px, bord blanc de 4 px) et de `.icon:hover` (agrandissement et halo). Chaque entrée gagne un libellé lisible et une marque ronde (numéro de chapitre ou icône).

## Ce que vous fournissez

```html
<nav aria-label="Sommaire du cours" data-rail>
  <ul class="rail-capsule">
    <li><a href="#chapitre-1"><span class="rail-capsule__marque" aria-hidden="true">1</span>Introduction à l'IA</a></li>
  </ul>
</nav>
```

- `data-rail` active le suivi de la section visible (`aria-current="true"`), via `Lumineux.init()`.
- La marque contient un chiffre (chapitres) ou une `.icone`.

## Règles

- Bord `trait-cadre` en `texte`, rayon `rayon-capsule`, fond `surface`.
- Entrée active : marque pleine en `lien`, libellé en `texte`.
- Au-dessous de 1080 px, masquez le rail et proposez le même contenu dans un `Tiroir`.
