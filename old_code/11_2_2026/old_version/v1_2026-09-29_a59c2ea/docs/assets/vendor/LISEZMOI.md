# Bibliothèques tierces

Copiées telles quelles depuis npm, pour que le site marche hors ligne (run.bat, fichier ouvert directement).

| Dossier | Paquet | Version | Licence | Utilisé par |
| --- | --- | --- | --- | --- |
| `sqljs/` | [sql.js](https://github.com/sql-js/sql.js) (`sql-wasm.js`, `sql-wasm.wasm`, `sql-asm.js`) | 1.14.2 | MIT | `classe.html` : la base SQLite de « Mes groupes » |
| `pptxgenjs/` | [PptxGenJS](https://github.com/gitbrent/PptxGenJS) (`pptxgen.bundle.js`, JSZip inclus) | 4.0.1 | MIT | `diaporamas.html` : export PowerPoint |

## Une modification

`pptxgenjs/pptxgen.bundle.js` : dans un paragraphe fait de plusieurs morceaux de texte (un mot en gras au milieu
d'une puce, par exemple), la version d'origine écrit un `<a:pPr>` par morceau. Un paragraphe OOXML n'en admet qu'un,
en tête ; les suivants effaçaient la puce du premier (LibreOffice) ou pouvaient déclencher une « réparation » du
fichier (PowerPoint). Seul le premier morceau écrit désormais les propriétés du paragraphe :

```
avant : n=Te(r,!1),i+=n.replace("<a:pPr></a:pPr>","")
après : n=Te(r,!1),0===e&&(i+=n.replace("<a:pPr></a:pPr>",""))
```
