# Encadre

Un encart teinté qui sort une idée du fil du texte : définition, exemple, mise en garde, points à retenir, application aux lettres et SHS.

Ajout intentionnel. Chaque variante prend une couleur du prisme, en version lisible (`-texte` sur `-voile`) ; le titre porte aussi une forme (anneau, losange, disque) pour ne pas dépendre de la couleur seule.

## Ce que vous fournissez

```html
<aside class="encadre encadre--definition">
  <p class="encadre-titre">Définition</p>
  <p>…</p>
</aside>
```

| Variante | Teinte | Usage |
| --- | --- | --- |
| `encadre--definition` | `ciel-texte` / `ciel-voile` | Définir un terme |
| `encadre--exemple` | `soleil-texte` / `soleil-voile` | Un cas concret |
| `encadre--attention` | `braise-texte` / `braise-voile` | Piège, limite, risque |
| `encadre--retenir` | `fuchsia-texte` / `fuchsia-voile` | Résumé en fin de leçon |
| `encadre--shs` | `cobalt-texte` / `cobalt-voile` | Application aux lettres et SHS |

## Règles

- Pas de barre colorée sur le bord gauche : la teinte du fond suffit.
- Deux encadrés ne se suivent jamais directement.
