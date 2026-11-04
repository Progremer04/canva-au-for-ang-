# Exercice

Un énoncé numéroté et son corrigé, replié tant que l'étudiant ne l'ouvre pas.

Ajout intentionnel. Le corrigé est un `<details>` natif : il fonctionne sans script et au clavier.

## Ce que vous fournissez

```html
<div class="exercice" id="td-ex-1">
  <p class="exercice-num">Exercice 1</p>
  <div class="exercice-enonce"><p>…</p></div>
  <details class="corrige"><summary>Voir le corrigé</summary>
    <div class="corrige-corps">…</div></details>
</div>
```

## Règles

- Donnez un `id` à chaque exercice pour pouvoir y renvoyer.
- Le résumé fait 44 px de haut, en `signal-l` et `lien`.
