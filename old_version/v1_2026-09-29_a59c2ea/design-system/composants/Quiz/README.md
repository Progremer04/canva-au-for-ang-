# Quiz

Une question d'auto-évaluation à réponse unique, corrigée immédiatement et expliquée.

Ajout intentionnel. Une réponse juste prend `juste` sur `juste-voile` et le mot « Juste » ; une réponse fausse `braise-texte` sur `braise-voile` et le mot « Non ». L'explication s'affiche à la bonne réponse et le résultat est annoncé aux lecteurs d'écran.

## Ce que vous fournissez

```html
<div class="quiz">
  <p class="quiz-question">…</p>
  <ul class="quiz-options">
    <li><button type="button" class="quiz-option">…</button></li>
    <li><button type="button" class="quiz-option" data-correct>…</button></li>
  </ul>
  <p class="quiz-explication" hidden>…</p>
</div>
```

## Règles

- Une seule option `data-correct`.
- Trois ou quatre options, de longueur comparable.
