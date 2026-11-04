# Tableau

Un tableau de données ou de comparaison, dans un conteneur qui défile seul sur petit écran.

Ajout intentionnel.

## Ce que vous fournissez

```html
<div class="tableau-defilant">
  <table class="tableau">
    <caption>…</caption>
    <thead><tr><th scope="col">…</th></tr></thead>
    <tbody>…</tbody>
  </table>
</div>
```

## Règles

- Légende et en-têtes en `signal` ; cellules en `corps-s` ; chiffres en `tabular-nums`.
- Le tableau garde 540 px de large minimum : c'est le conteneur qui défile, jamais la page.
