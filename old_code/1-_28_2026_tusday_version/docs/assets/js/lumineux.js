/* ==========================================================================
   Lumineux — comportements des composants
   Aucune dépendance. Chaque initialisation est idempotente.
   ========================================================================== */
(function () {
  "use strict";

  var LANGUE = (document.documentElement.lang || "fr").slice(0, 2).toLowerCase();
  var EN = LANGUE === "en", AR = LANGUE === "ar";
  var TEXTES_AR = {
    "Switch to the Day theme": "التبديل إلى المظهر النهاري", "Switch to the Night theme": "التبديل إلى المظهر الليلي",
    "Day theme": "المظهر النهاري", "Night theme": "المظهر الليلي",
    "Prompt": "أمر (prompt)",
    "slide": "شريحة", " of ": " من ", "Go to slide ": "الانتقال إلى الشريحة ", "Pause": "إيقاف مؤقت", "Play": "تشغيل",
    "Correct.": "إجابة صحيحة.", "That is not the right answer. Try again.": "ليست هذه الإجابة الصحيحة. حاول مرة أخرى.",
    "Copy": "نسخ", "Copied": "تم النسخ", "Selected: Ctrl+C": "تم التحديد: Ctrl+C"
  };
  function t(fr, en) { return AR ? (TEXTES_AR.hasOwnProperty(en) ? TEXTES_AR[en] : en) : (EN ? en : fr); }
  var libelle = t;

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
        bouton.setAttribute("aria-label", t === "dark" ? libelle("Passer au thème Jour", "Switch to the Day theme") : libelle("Passer au thème Nuit", "Switch to the Night theme"));
        bouton.setAttribute("title", t === "dark" ? libelle("Thème Jour", "Day theme") : libelle("Thème Nuit", "Night theme"));
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
        d.setAttribute("aria-roledescription", t("diapositive", "slide"));
        d.setAttribute("aria-label", (i + 1) + t(" sur ", " of ") + diapos.length);
        if (points) {
          var li = document.createElement("li");
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", t("Aller à la diapositive ", "Go to slide ") + (i + 1));
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
        if (pause) { pause.setAttribute("aria-pressed", "false"); pause.textContent = t("Pause", "Pause"); }
      }
      function arreter() {
        enLecture = false;
        if (minuterie) window.clearInterval(minuterie);
        minuterie = null;
        if (pause) { pause.setAttribute("aria-pressed", "true"); pause.textContent = t("Lecture", "Play"); }
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
      if (enLecture) demarrer(); else if (pause) { pause.setAttribute("aria-pressed", "true"); pause.textContent = t("Lecture", "Play"); }
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
            annonce.textContent = t("Bonne réponse.", "Correct.");
          } else {
            option.classList.add("est-faux");
            annonce.textContent = t("Ce n'est pas la bonne réponse. Essayez encore.", "That is not the right answer. Try again.");
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
        legende.textContent = figure.querySelector("pre.consigne") ? t("Prompt", "Prompt") : "Python";   // une consigne en langue naturelle n'est pas du code
        figure.insertBefore(legende, figure.firstChild);
      }
      var bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = "bouton-copier";
      bouton.textContent = t("Copier", "Copy");
      bouton.addEventListener("click", function () {
        var texte = code.textContent;
        function ok() { bouton.textContent = t("Copié", "Copied"); window.setTimeout(function () { bouton.textContent = t("Copier", "Copy"); }, 1600); }
        function repli() {
          var selection = window.getSelection();
          var plage = document.createRange();
          plage.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(plage);
          bouton.textContent = t("Sélectionné : Ctrl+C", "Selected: Ctrl+C");
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(ok, repli);
          else repli();
        } catch (e) { repli(); }
      });
      legende.appendChild(bouton);
    });
  }

  /* ---------- Code sur une page arabe : chaque passage arabe est isolé ---------- */
  /* Un bloc de code se lit de gauche à droite. Sans isolement, l'algorithme bidirectionnel inverse
     l'ordre des chaînes arabes voisines : ("القط", "الكلب") s'afficherait ("الكلب", "القط"). Isolé,
     chaque passage garde sa place dans le code et se lit de droite à gauche. Le texte copié ne change pas. */
  var LETTRES_AR = "\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF";
  var PASSAGE_AR = new RegExp("[" + LETTRES_AR + "]+(?:[ \u00A0]+[" + LETTRES_AR + "]+)*", "g");
  function isolerArabe(racine) {
    if (!AR || !racine) return;
    var blocs = racine.matches && racine.matches("pre, pre *") ? [racine] : racine.querySelectorAll("pre:not(.consigne)");
    Array.prototype.forEach.call(blocs, function (bloc) {
      if (bloc.closest("pre.consigne")) return;
      var parcours = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT), noeuds = [], n;
      while ((n = parcours.nextNode())) {
        if (!n.parentNode.classList || !n.parentNode.classList.contains("ar-isole")) noeuds.push(n);
      }
      noeuds.forEach(function (noeud) {
        var texte = noeud.nodeValue, m, fin = 0, morceaux = document.createDocumentFragment();
        PASSAGE_AR.lastIndex = 0;
        while ((m = PASSAGE_AR.exec(texte))) {
          if (m.index > fin) morceaux.appendChild(document.createTextNode(texte.slice(fin, m.index)));
          var s = document.createElement("span");
          s.className = "ar-isole";
          s.textContent = m[0];
          morceaux.appendChild(s);
          fin = m.index + m[0].length;
        }
        if (!fin) return;
        if (fin < texte.length) morceaux.appendChild(document.createTextNode(texte.slice(fin)));
        noeud.parentNode.replaceChild(morceaux, noeud);
      });
    });
  }
  // Prism réécrit le bloc qu'il colore : on isole de nouveau après chaque coloration.
  if (AR && window.Prism && window.Prism.hooks) window.Prism.hooks.add("complete", function (env) { isolerArabe(env.element); });

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

  /* ---------- Sauts d'ancre exacts malgré le dessin à la demande (content-visibility) ---------- */
  // Avant d'aller à une section, on dessine celles qui la précèdent : leur vraie hauteur est connue,
  // le navigateur arrive donc au bon endroit (au lieu d'une position estimée).
  var ancresPretes = false;
  function initAncres() {
    if (ancresPretes) return;
    ancresPretes = true;
    function cibleDe(hash) {
      try { return hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch (e) { return null; }
    }
    function reveler(cible) {
      var sections = document.querySelectorAll(".page__contenu > section");
      for (var i = 0; i < sections.length; i++) {
        sections[i].style.contentVisibility = "visible";
        if (sections[i].contains(cible)) break;
      }
    }
    // Quand le défilement s'arrête, les sections du dessus ont pu changer de hauteur (polices, images) :
    // on recale la cible sous l'en-tête, sauf si le lecteur a déjà bougé.
    var recalage = null;
    function aligner(cible) {
      if (recalage) recalage.fin();
      var essais = 0, minuteur = null, fini = false;
      function voulu() { return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0; }
      function verifier() {
        if (fini) return;
        var ecart = cible.getBoundingClientRect().top - voulu();
        if (Math.abs(ecart) > 3 && essais < 4) { essais++; window.scrollBy({ top: ecart, behavior: "instant" }); attendre(); }
        else if (essais < 4) { essais++; minuteur = setTimeout(verifier, 400); }
        else arreter();
      }
      function attendre() { clearTimeout(minuteur); minuteur = setTimeout(verifier, 180); }
      function arreter() {
        fini = true; clearTimeout(minuteur);
        window.removeEventListener("scroll", attendre);
        ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { window.removeEventListener(ev, arreter); });
      }
      window.addEventListener("scroll", attendre, { passive: true });
      ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, arreter, { passive: true }); });
      attendre();
      recalage = { fin: arreter };
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      var c = a && cibleDe(a.getAttribute("href"));
      if (!c) return;
      reveler(c);
      setTimeout(function () { aligner(c); }, 0);
    }, true);
    window.addEventListener("hashchange", function () {
      var c = cibleDe(location.hash);
      if (c) { reveler(c); c.scrollIntoView({ block: "start" }); aligner(c); }
    });
    var depart = cibleDe(location.hash);
    if (depart) {
      reveler(depart);
      window.requestAnimationFrame(function () { depart.scrollIntoView({ block: "start", behavior: "instant" }); aligner(depart); });
    }
  }

  /* ---------- Changer de langue en restant sur la même leçon ---------- */
  function initLangue() {
    document.querySelectorAll("[data-lien-langue]").forEach(function (lien) {
      if (dejaPret(lien)) return;
      var base = lien.getAttribute("href").split("#")[0];
      lien.addEventListener("click", function () {
        var repere = "";
        var haut = window.scrollY + 120;
        document.querySelectorAll("section.chapitre[id], article.lecon[id], section.heros[id]").forEach(function (el) {
          if (el.getBoundingClientRect().top + window.scrollY <= haut) repere = "#" + el.id;
        });
        lien.setAttribute("href", base + repere);
      });
    });
  }

  function init() {
    initLangue();
    initTheme();
    initTiroirs();
    initCarrousels();
    initQuiz();
    initCopie();
    isolerArabe(document);
    initAncres();
    initRail();
  }

  window.Lumineux = { init: init, initQuiz: initQuiz, initCopie: initCopie, isolerArabe: isolerArabe };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
