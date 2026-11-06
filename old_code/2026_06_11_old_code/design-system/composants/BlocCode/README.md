# BlocCode

Un extrait de code Python avec son nom de fichier, un bouton Copier et, si besoin, la sortie console.

Ajout intentionnel. La coloration syntaxique (Prism) reprend les teintes du prisme en version lisible : chaînes `soleil-texte`, mots-clés `fuchsia-texte`, fonctions `ciel-texte`, nombres `braise-texte`, commentaires `texte-doux`.

## Ce que vous fournissez

```html
<figure class="code">
  <figcaption class="code-legende">compter_mots.py</figcaption>
  <pre><code class="language-python">…</code></pre>
  <pre class="sortie"><samp>…</samp></pre>
</figure>
```

- Échappez `<`, `>` et `&` dans le code.
- Le bouton Copier est ajouté par `Lumineux.init()` ; il se replie sur une sélection du texte si le presse-papiers est refusé.

## Règles

- Fond `surface`, filet `ligne`, rayon `rayon-m` ; texte `code-bloc` (14/22).
- La sortie montrée doit être exactement celle que produit le code.
