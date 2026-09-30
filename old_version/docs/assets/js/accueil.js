/* ==========================================================================
   Page d'accueil
   - affiche, sans rien charger de lourd, la prochaine séance (résumé laissé par « Mes groupes »)
     et le dernier diaporama ouvert ;
   - pendant que la page est au repos, précharge le cours et les outils : le clic suivant est immédiat.
   ========================================================================== */
(function () {
  "use strict";

  var racine = document.querySelector(".portail");
  if (!racine) return;
  var BASE = racine.getAttribute("data-base") || "";
  var LANGUE = racine.getAttribute("data-langue") || "fr";
  var LOCALE = { fr: "fr-DZ", en: "en-GB", ar: "ar-DZ" }[LANGUE] || "fr";
  var T = {
    fr: { prochaine: "Prochaine séance : ", reprendre: "Reprendre : ", seance: "séance {n}", diapo: "diapositive {n}", etudiants: "{n} étudiants" },
    en: { prochaine: "Next session: ", reprendre: "Resume: ", seance: "session {n}", diapo: "slide {n}", etudiants: "{n} students" },
    ar: { prochaine: "الحصة القادمة: ", reprendre: "متابعة: ", seance: "الحصة {n}", diapo: "الشريحة {n}", etudiants: "عدد الطلبة: {n}" }
  }[LANGUE] || {};

  function lire(cle) {
    try { return JSON.parse(window.localStorage.getItem(cle) || "null"); } catch (e) { return null; }
  }
  function tpl(t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  function info(nom, texte) {
    var tuile = racine.querySelector('[data-info="' + nom + '"]');
    var el = tuile && tuile.querySelector(".tuile__info");
    if (!el || !texte) return null;
    el.textContent = texte;
    el.hidden = false;
    return tuile;
  }

  // « Mes groupes » : prochaine séance et nombre d'étudiants.
  var classe = lire("lx-classe-resume");
  if (classe) {
    var morceaux = [];
    if (classe.prochaine && /^\d{4}-\d{2}-\d{2}$/.test(classe.prochaine.date)) {
      var p = classe.prochaine.date.split("-");
      var jour = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" })
        .format(new Date(+p[0], +p[1] - 1, +p[2], 12));
      morceaux.push(T.prochaine + [jour, classe.prochaine.debut, classe.prochaine.groupe].filter(Boolean).join(" · "));
    } else if (classe.etudiants) {
      morceaux.push(tpl(T.etudiants, { n: classe.etudiants }));
    }
    info("classe", morceaux.join(""));
  }

  // Diaporamas : reprendre là où on s'était arrêté.
  var dernier = lire("lx-diapos-dernier");
  if (dernier && /^[\w-]+$/.test(dernier.id)) {
    var etiquette = (dernier.numero ? tpl(T.seance, { n: dernier.numero }) + " · " : "") + tpl(T.diapo, { n: (dernier.index || 0) + 1 });
    var tuile = info("diaporamas", T.reprendre + etiquette);
    if (tuile) tuile.setAttribute("href", "diaporamas.html#" + dernier.id + (dernier.index ? "/" + (dernier.index + 1) : ""));
  }

  // Préchargement discret des pages et des fichiers lourds, une fois la page affichée.
  var connexion = navigator.connection || {};
  if (connexion.saveData || /2g/.test(connexion.effectiveType || "")) return;
  var fichiers = [
    "cours.html", "enseignant.html", "classe.html", "diaporamas.html", BASE + "chapitr1_first_lesson.html",
    BASE + "assets/js/cours.js", BASE + "assets/js/classe.js", BASE + "assets/js/diaporama.js",
    BASE + "assets/diapos/diapos-" + LANGUE + ".js", BASE + "assets/css/outils.css",
    BASE + "assets/vendor/sqljs/sql-wasm.js", BASE + "assets/vendor/sqljs/sql-wasm.wasm"
  ];
  function precharger() {
    fichiers.forEach(function (f) {
      var l = document.createElement("link");
      l.rel = "prefetch";
      l.href = f;
      document.head.appendChild(l);
    });
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(precharger, { timeout: 3000 });
  else window.addEventListener("load", function () { setTimeout(precharger, 800); });
})();
