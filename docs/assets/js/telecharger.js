/* ==========================================================================
   Télécharger un chapitre du cours (cours.html) en PowerPoint ou en PDF.
   - PowerPoint : un diaporama modifiable fait à partir du chapitre (PptxGenJS, assets/vendor/) :
     une diapositive de titre, puis une par partie (titres h3/h4, encadrés), avec l'essentiel de chaque
     paragraphe en puces, les listes, les tableaux et le code ;
   - PDF : le chapitre seul, en thème Jour, par la fenêtre d'impression (« Enregistrer au format PDF »).
   Lien direct : cours.html?telecharger=pptx#chapitre-1 (ou =pdf) lance le fichier du chapitre visé.
   ========================================================================== */
(function () {
  "use strict";

  var LANGUE = (document.documentElement.lang || "fr").slice(0, 2).toLowerCase();
  var AR = LANGUE === "ar";
  var CHAPITRES = ["methode", "chapitre-1", "chapitre-2", "chapitre-3", "mini-projet", "td-tp", "tables-rondes"];
  var SCRIPT = document.currentScript && document.currentScript.src;
  var VENDOR = SCRIPT ? new URL("../vendor/", SCRIPT).href : "assets/vendor/";
  var T = {
    fr: { pptx: "PowerPoint", pdf: "PDF", titre_pptx: "Télécharger ce chapitre en PowerPoint (.pptx)", titre_pdf: "Télécharger ce chapitre en PDF (fenêtre d'impression : « Enregistrer au format PDF »)",
          prepa: "Préparation du PowerPoint…", pret: "Fichier prêt : {f}", erreur: "Le fichier PowerPoint n'a pas pu être préparé.", suite: "(suite)",
          cours: "Intelligence artificielle · Master 2 · Université Yahia Farès, Médéa", code: "Code" },
    en: { pptx: "PowerPoint", pdf: "PDF", titre_pptx: "Download this chapter as PowerPoint (.pptx)", titre_pdf: "Download this chapter as PDF (print window: “Save as PDF”)",
          prepa: "Preparing the PowerPoint…", pret: "File ready: {f}", erreur: "The PowerPoint file could not be prepared.", suite: "(continued)",
          cours: "Artificial intelligence · Master 2 · Université Yahia Farès, Médéa", code: "Code" },
    ar: { pptx: "PowerPoint", pdf: "PDF", titre_pptx: "تنزيل هذا الفصل بصيغة PowerPoint ‏(.pptx)", titre_pdf: "تنزيل هذا الفصل بصيغة PDF (نافذة الطباعة: «حفظ بصيغة PDF»)",
          prepa: "جارٍ تحضير ملف PowerPoint…", pret: "الملف جاهز: {f}", erreur: "تعذّر تحضير ملف PowerPoint.", suite: "(تابع)",
          cours: "الذكاء الاصطناعي · ماستر 2 · جامعة يحيى فارس بالمدية", code: "الشيفرة" }
  }[LANGUE] || null;
  if (!T) return;

  // Texte d'un élément, sans les boutons ajoutés par la page (« Copier », « Afficher la solution »…).
  function texte(el) {
    if (el.querySelector && el.querySelector("button, .bouton-copier")) {
      el = el.cloneNode(true);
      Array.prototype.forEach.call(el.querySelectorAll("button, .bouton-copier"), function (b) { b.remove(); });
    }
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  function court(t, max) {
    if (t.length <= max) return t;
    return t.slice(0, max - 1).replace(/[\s,;:]+\S*$/, "") + "…";
  }
  // L'essentiel d'un paragraphe : sa première phrase (si elle dit assez), sinon son début.
  function essentiel(t, max) {
    var m = t.match(/^.+?[.!?؟](?=\s|$)/);
    return court(m && m[0].length >= 50 ? m[0] : t, max);
  }

  /* ---------- Du chapitre aux diapositives ---------- */

  function groupes(section) {
    var liste = [], h3 = "", courant = null;
    function nouveau(titre, surtitre) { courant = { titre: titre, surtitre: surtitre || "", points: [] }; liste.push(courant); return courant; }
    function parcourir(el) {
      Array.prototype.forEach.call(el.children, function (n) {
        var tag = n.tagName.toLowerCase();
        if (n.matches("[data-demo], .demo, .sommaire-chapitre, script, style, button, .affiche-lecon, .telecharger-chapitre")) return;
        if (tag === "h3") { h3 = texte(n); nouveau(h3); }
        else if (tag === "h4" || tag === "h5") nouveau(texte(n), h3);
        else if (tag === "p") { var t = texte(n); if (t) (courant || nouveau(h3)).points.push(essentiel(t, 210)); }
        else if (tag === "ul" || tag === "ol") {
          Array.prototype.forEach.call(n.children, function (li) { var t = texte(li); if (t) (courant || nouveau(h3)).points.push(court(t, 180)); });
        } else if (tag === "pre") {
          var lignes = n.textContent.replace(/\s+$/, "").split("\n");
          liste.push({ titre: (courant ? courant.titre : h3) + " · " + T.code, surtitre: h3, code: lignes.slice(0, 18).join("\n") + (lignes.length > 18 ? "\n…" : "") });
        } else if (tag === "table") {
          var g = nouveau((courant ? courant.titre : h3), h3);
          Array.prototype.slice.call(n.querySelectorAll("tr"), 0, 9).forEach(function (tr) {
            g.points.push(court(Array.prototype.map.call(tr.children, texte).filter(Boolean).join(" | "), 180));
          });
        } else if (tag === "aside") {
          var titre = n.querySelector(".encadre-titre"), avant = courant;
          var e = nouveau(titre ? texte(titre) : (courant ? courant.titre : h3), h3);
          Array.prototype.forEach.call(n.querySelectorAll("p:not(.encadre-titre), li"), function (x) {
            if (x.tagName === "P" && x.closest("li")) return;
            var t = texte(x); if (t) e.points.push(x.tagName === "LI" ? court(t, 180) : essentiel(t, 210));
          });
          // La suite du texte revient à la partie en cours.
          if (avant) { courant = { titre: avant.titre, surtitre: avant.surtitre, points: [] }; liste.push(courant); }
        } else if (/^(article|div|section|details|figure|blockquote)$/.test(tag)) {
          if (tag === "details") { var s = n.querySelector("summary"); if (s) nouveau(texte(s), h3); }
          if (tag === "figure" && !n.querySelector("pre")) { var c = n.querySelector("figcaption"); if (c && courant) courant.points.push(court(texte(c), 180)); return; }
          parcourir(n);
        }
      });
    }
    parcourir(section);
    return liste.filter(function (g) { return g.code || g.points.length; });
  }

  var PRISME = ["FFFF00", "87CEEB", "FF512F", "DD2476", "1C64FF"];
  function decor(p, diapo, n, total) {
    PRISME.forEach(function (c, i) { diapo.addShape(p.ShapeType.rect, { x: i * 2, y: 0, w: 2, h: 0.07, fill: { color: c }, line: { color: c } }); });
    diapo.addText(T.cours, { x: 0.5, y: 5.2, w: 7.5, h: 0.3, fontSize: 9, color: "7C7C88", align: AR ? "right" : "left", rtlMode: AR });
    diapo.addText(n + " / " + total, { x: 8.3, y: 5.2, w: 1.2, h: 0.3, fontSize: 9, color: "7C7C88", align: "right" });
  }
  function taillePolice(points) {
    var n = points.join(" ").length;
    return n > 900 ? 12 : n > 650 ? 14 : n > 420 ? 16 : 18;
  }

  function construire(section) {
    var p = new window.PptxGenJS();
    p.layout = "LAYOUT_16x9";
    p.rtlMode = AR;
    var titre = texte(section.querySelector(".titre-section") || section.querySelector("h2") || section);
    var surtitre = section.querySelector(".chapitre-tete .surtitre"), chapeau = section.querySelector(".chapitre-tete .chapeau");
    p.title = titre;
    var aligne = AR ? "right" : "left", diapos = [];

    diapos.push(function (d) {
      d.background = { color: "07070A" };
      if (surtitre) d.addText(texte(surtitre).toUpperCase(), { x: 0.6, y: 1.0, w: 8.8, h: 0.4, fontSize: 14, bold: true, color: "87CEEB", align: aligne, rtlMode: AR, charSpacing: 2 });
      d.addText(titre, { x: 0.6, y: 1.45, w: 8.8, h: 1.4, fontSize: 36, bold: true, color: "FFFFFF", align: aligne, valign: "top", rtlMode: AR, fit: "shrink" });
      if (chapeau) d.addText(court(texte(chapeau), 420), { x: 0.6, y: 3.0, w: 8.8, h: 1.8, fontSize: 15, color: "C9C9D2", align: aligne, valign: "top", rtlMode: AR });
    });

    groupes(section).forEach(function (g) {
      if (g.code) {
        diapos.push(function (d) {
          d.addText(g.surtitre.toUpperCase(), { x: 0.5, y: 0.3, w: 9, h: 0.3, fontSize: 11, bold: true, color: "55555F", align: aligne, rtlMode: AR });
          d.addText(g.titre, { x: 0.5, y: 0.6, w: 9, h: 0.6, fontSize: 22, bold: true, color: "121216", align: aligne, rtlMode: AR, fit: "shrink" });
          d.addText(g.code, { x: 0.5, y: 1.35, w: 9, h: 3.7, fontFace: "Consolas", fontSize: g.code.split("\n").length > 12 ? 11 : 13, color: "121216",
                              fill: { color: "F1F1F4" }, valign: "top", align: "left", margin: 10 });
        });
        return;
      }
      for (var i = 0; i < g.points.length; i += 6) {
        (function (morceau, suite) {
          diapos.push(function (d) {
            if (g.surtitre && g.surtitre !== g.titre) d.addText(g.surtitre.toUpperCase(), { x: 0.5, y: 0.3, w: 9, h: 0.3, fontSize: 11, bold: true, color: "55555F", align: aligne, rtlMode: AR });
            d.addText(g.titre + (suite ? " " + T.suite : ""), { x: 0.5, y: 0.6, w: 9, h: 0.7, fontSize: 24, bold: true, color: "121216", align: aligne, rtlMode: AR, fit: "shrink" });
            d.addShape(p.ShapeType.rect, { x: AR ? 8.3 : 0.5, y: 1.33, w: 1.2, h: 0.05, fill: { color: "1C64FF" }, line: { color: "1C64FF" } });
            d.addText(morceau.map(function (t) { return { text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } }; }),
                      { x: 0.5, y: 1.5, w: 9, h: 3.6, fontSize: taillePolice(morceau), color: "121216", valign: "top", align: aligne, rtlMode: AR });
          });
        })(g.points.slice(i, i + 6), i > 0);
      }
    });

    diapos.forEach(function (remplir, n) {
      var d = p.addSlide();
      remplir(d);
      if (n) decor(p, d, n + 1, diapos.length);
    });
    var nom = (section.id || "chapitre") + "-" + LANGUE + ".pptx";
    return p.writeFile({ fileName: nom }).then(function () { return nom; });
  }

  /* ---------- Chargement de PptxGenJS, avis, PDF ---------- */

  var pptxPret = null;
  function chargerPptx() {
    if (window.PptxGenJS) return Promise.resolve();
    return pptxPret || (pptxPret = new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = VENDOR + "pptxgenjs/pptxgen.bundle.js"; s.onload = ok; s.onerror = function () { pptxPret = null; ko(new Error(s.src)); };
      document.head.appendChild(s);
    }));
  }
  function avis(message, duree) {
    var a = document.querySelector(".avis-telechargement");
    if (!a) { a = document.createElement("p"); a.className = "avis-telechargement"; a.setAttribute("role", "status"); document.body.appendChild(a); }
    a.textContent = message;
    clearTimeout(a._minuteur);
    if (duree) a._minuteur = setTimeout(function () { a.remove(); }, duree);
  }
  function pptx(section) {
    avis(T.prepa);
    chargerPptx().then(function () { return construire(section); })
      .then(function (nom) { avis(T.pret.replace("{f}", nom), 4000); })
      .catch(function (e) { if (window.console) console.error(e); avis(T.erreur, 6000); });
  }
  function pdf(section) {
    var racine = document.documentElement, theme = racine.getAttribute("data-theme");
    racine.setAttribute("data-theme", "light");
    document.body.setAttribute("data-imprimer", section.id);
    section.classList.add("a-imprimer");
    function fin() {
      window.removeEventListener("afterprint", fin);
      document.body.removeAttribute("data-imprimer");
      section.classList.remove("a-imprimer");
      if (theme) racine.setAttribute("data-theme", theme); else racine.removeAttribute("data-theme");
    }
    window.addEventListener("afterprint", fin);
    setTimeout(function () { window.print(); }, 60);
  }

  /* ---------- Boutons dans l'en-tête de chaque chapitre ---------- */

  function bouton(libelle, titre, action) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "bouton bouton--petit"; b.title = titre; b.setAttribute("aria-label", titre);
    b.innerHTML = '<svg class="icone" aria-hidden="true"><use href="#i-telecharger"/></svg>';
    b.appendChild(document.createTextNode(libelle));
    b.addEventListener("click", action);
    return b;
  }
  CHAPITRES.forEach(function (id) {
    var section = document.getElementById(id), tete = section && section.querySelector(".chapitre-tete");
    if (!tete) return;
    var p = document.createElement("p");
    p.className = "telecharger-chapitre";
    p.appendChild(bouton(T.pptx, T.titre_pptx, function () { pptx(section); }));
    p.appendChild(bouton(T.pdf, T.titre_pdf, function () { pdf(section); }));
    var repere = tete.querySelector(".puces") || tete.querySelector(".chapeau");   // sous la présentation du chapitre
    if (repere) repere.insertAdjacentElement("afterend", p); else tete.appendChild(p);
  });

  var demande = (location.search.match(/[?&]telecharger=(pptx|pdf)\b/) || [])[1];
  var cible = demande && document.getElementById(location.hash.slice(1));
  if (cible && CHAPITRES.indexOf(cible.id) >= 0) setTimeout(function () { (demande === "pptx" ? pptx : pdf)(cible); }, 600);
})();
