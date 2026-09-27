/* ==========================================================================
   Lumineux — comportements des composants
   Aucune dépendance. Chaque initialisation est idempotente.
   ========================================================================== */
(function () {
  "use strict";

  var mouvementReduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Marque un élément comme initialisé ; renvoie true s'il l'était déjà. */
  function dejaPret(n) {
    if (n.hasAttribute("data-lx-pret")) return true;
    n.setAttribute("data-lx-pret", "");
    return false;
  }

  function lire(cle) { try { return window.localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, valeur) { try { window.localStorage.setItem(cle, valeur); } catch (e) { /* stockage indisponible */ } }

  /* ---------- Thème Nuit / Jour ---------- */
  function initTheme() {
    var racine = document.documentElement;
    var memo = lire("lumineux-theme");
    if (memo === "light" || memo === "dark") racine.setAttribute("data-theme", memo);
    document.querySelectorAll("[data-bascule-theme]").forEach(function (bouton) {
      if (dejaPret(bouton)) return;
      function actuel() {
        var t = racine.getAttribute("data-theme");
        if (t === "light" || t === "dark") return t;
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      function etiquette() {
        var t = actuel();
        bouton.setAttribute("aria-label", t === "dark" ? "Passer au thème Jour" : "Passer au thème Nuit");
        bouton.setAttribute("title", t === "dark" ? "Thème Jour" : "Thème Nuit");
      }
      etiquette();
      bouton.addEventListener("click", function () {
        var suivant = actuel() === "dark" ? "light" : "dark";
        racine.setAttribute("data-theme", suivant);
        ecrire("lumineux-theme", suivant);
        etiquette();
      });
    });
  }

  /* ---------- Tiroir ---------- */
  function initTiroirs() {
    document.querySelectorAll("[data-ouvre-tiroir]").forEach(function (declencheur) {
      if (dejaPret(declencheur)) return;
      var tiroir = document.getElementById(declencheur.getAttribute("data-ouvre-tiroir"));
      if (!tiroir) return;
      var voile = document.querySelector("[data-voile-tiroir='" + tiroir.id + "']");
      var dernierFocus = null;

      function ouvrir() {
        dernierFocus = document.activeElement;
        tiroir.classList.add("est-ouvert");
        tiroir.removeAttribute("aria-hidden");
        if (voile) voile.classList.add("est-visible");
        declencheur.setAttribute("aria-expanded", "true");
        var premier = tiroir.querySelector("button, a[href]");
        if (premier) window.setTimeout(function () { premier.focus(); }, 50);
      }
      function fermer() {
        tiroir.classList.remove("est-ouvert");
        tiroir.setAttribute("aria-hidden", "true");
        if (voile) voile.classList.remove("est-visible");
        declencheur.setAttribute("aria-expanded", "false");
        if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
      }
      tiroir.setAttribute("aria-hidden", "true");
      declencheur.setAttribute("aria-expanded", "false");
      declencheur.addEventListener("click", ouvrir);
      if (voile) voile.addEventListener("click", fermer);
      tiroir.querySelectorAll("[data-ferme-tiroir]").forEach(function (b) { b.addEventListener("click", fermer); });
      tiroir.querySelectorAll("a[href^='#']").forEach(function (a) { a.addEventListener("click", fermer); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && tiroir.classList.contains("est-ouvert")) fermer();
      });
    });
  }

  /* ---------- Carrousel ---------- */
  function initCarrousels() {
    document.querySelectorAll("[data-carrousel]").forEach(function (racine) {
      if (dejaPret(racine)) return;
      var piste = racine.querySelector(".carrousel__piste");
      var diapos = Array.prototype.slice.call(racine.querySelectorAll(".carrousel__diapo"));
      var points = racine.querySelector(".carrousel__points");
      var precedent = racine.querySelector("[data-carrousel-precedent]");
      var suivant = racine.querySelector("[data-carrousel-suivant]");
      var pause = racine.querySelector("[data-carrousel-pause]");
      if (!piste || !diapos.length) return;
      var index = 0;
      var minuterie = null;
      var enLecture = !mouvementReduit && racine.hasAttribute("data-auto");

      diapos.forEach(function (d, i) {
        d.setAttribute("role", "group");
        d.setAttribute("aria-roledescription", "diapositive");
        d.setAttribute("aria-label", (i + 1) + " sur " + diapos.length);
        if (points) {
          var li = document.createElement("li");
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", "Aller à la diapositive " + (i + 1));
          b.addEventListener("click", function () { aller(i); arreter(); });
          li.appendChild(b);
          points.appendChild(li);
        }
      });

      function marquer() {
        if (!points) return;
        points.querySelectorAll("button").forEach(function (b, i) {
          if (i === index) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
        });
      }
      function aller(i) {
        index = (i + diapos.length) % diapos.length;
        piste.scrollTo({ left: diapos[index].offsetLeft - piste.offsetLeft, behavior: mouvementReduit ? "auto" : "smooth" });
        marquer();
      }
      function demarrer() {
        if (minuterie || mouvementReduit) return;
        enLecture = true;
        minuterie = window.setInterval(function () { aller(index + 1); }, 7000);
        if (pause) { pause.setAttribute("aria-pressed", "false"); pause.textContent = "Pause"; }
      }
      function arreter() {
        enLecture = false;
        if (minuterie) window.clearInterval(minuterie);
        minuterie = null;
        if (pause) { pause.setAttribute("aria-pressed", "true"); pause.textContent = "Lecture"; }
      }

      var attente = null;
      piste.addEventListener("scroll", function () {
        window.clearTimeout(attente);
        attente = window.setTimeout(function () {
          var largeur = piste.clientWidth || 1;
          var i = Math.round(piste.scrollLeft / largeur);
          if (i !== index) { index = Math.max(0, Math.min(diapos.length - 1, i)); marquer(); }
        }, 80);
      }, { passive: true });

      if (precedent) precedent.addEventListener("click", function () { aller(index - 1); arreter(); });
      if (suivant) suivant.addEventListener("click", function () { aller(index + 1); arreter(); });
      if (pause) pause.addEventListener("click", function () { if (enLecture) arreter(); else demarrer(); });
      racine.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { aller(index + 1); arreter(); }
        if (e.key === "ArrowLeft") { aller(index - 1); arreter(); }
      });
      racine.addEventListener("focusin", function () { if (minuterie) { window.clearInterval(minuterie); minuterie = null; } });

      marquer();
      if (enLecture) demarrer(); else if (pause) { pause.setAttribute("aria-pressed", "true"); pause.textContent = "Lecture"; }
    });
  }

  /* ---------- Quiz ---------- */
  function initQuiz() {
    document.querySelectorAll(".quiz").forEach(function (quiz) {
      if (dejaPret(quiz)) return;
      var explication = quiz.querySelector(".quiz-explication");
      var annonce = document.createElement("p");
      annonce.className = "visuellement-cache";
      annonce.setAttribute("aria-live", "polite");
      quiz.appendChild(annonce);
      quiz.querySelectorAll(".quiz-option").forEach(function (option) {
        option.addEventListener("click", function () {
          if (option.hasAttribute("data-correct")) {
            option.classList.add("est-juste");
            option.classList.remove("est-faux");
            if (explication) explication.hidden = false;
            annonce.textContent = "Bonne réponse.";
          } else {
            option.classList.add("est-faux");
            annonce.textContent = "Ce n'est pas la bonne réponse. Essayez encore.";
          }
        });
      });
    });
  }

  /* ---------- Copier le code ---------- */
  function initCopie() {
    document.querySelectorAll("figure.code").forEach(function (figure) {
      if (figure.querySelector(".bouton-copier")) return;
      var code = figure.querySelector("pre code");
      if (!code) return;
      var legende = figure.querySelector(".code-legende");
      if (!legende) {
        legende = document.createElement("figcaption");
        legende.className = "code-legende";
        legende.textContent = "Python";
        figure.insertBefore(legende, figure.firstChild);
      }
      var bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "bouton-copier";
      bouton.textContent = "Copier";
      bouton.addEventListener("click", function () {
        var texte = code.textContent;
        function ok() { bouton.textContent = "Copié"; window.setTimeout(function () { bouton.textContent = "Copier"; }, 1600); }
        function repli() {
          var selection = window.getSelection();
          var plage = document.createRange();
          plage.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(plage);
          bouton.textContent = "Sélectionné : Ctrl+C";
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(ok, repli);
          else repli();
        } catch (e) { repli(); }
      });
      legende.appendChild(bouton);
    });
  }

  /* ---------- Rail : section active + barre de progression ---------- */
  var railPret = false;
  function initRail() {
    if (railPret) return;
    railPret = true;
    var liens = Array.prototype.slice.call(document.querySelectorAll("[data-rail] a[href^='#']"));
    var cibles = liens.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var barre = document.querySelector(".progression");
    function maj() {
      var haut = window.scrollY + 120;
      var actif = 0;
      cibles.forEach(function (c, i) { if (c && c.offsetTop <= haut) actif = i; });
      var hrefActif = liens[actif] ? liens[actif].getAttribute("href") : null;
      liens.forEach(function (a) {
        if (a.getAttribute("href") === hrefActif) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      if (barre) {
        var total = document.documentElement.scrollHeight - window.innerHeight;
        barre.style.setProperty("--progression", total > 0 ? Math.min(1, window.scrollY / total).toFixed(4) : 0);
      }
    }
    var enAttente = false;
    window.addEventListener("scroll", function () {
      if (enAttente) return;
      enAttente = true;
      window.requestAnimationFrame(function () { enAttente = false; maj(); });
    }, { passive: true });
    window.addEventListener("resize", maj);
    maj();
  }

  function init() {
    initTheme();
    initTiroirs();
    initCarrousels();
    initQuiz();
    initCopie();
    initRail();
  }

  window.Lumineux = { init: init, initQuiz: initQuiz, initCopie: initCopie };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
