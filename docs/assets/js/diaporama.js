/* ==========================================================================
   Diaporamas du cours : un « PowerPoint » dans le site
   - galerie des diaporamas (window.LX_DIAPOS, produit par tools/diapos.py) ;
   - vue normale : vignettes, diapositive, notes de l'enseignant ;
   - projection plein écran : clavier, clic, points qui apparaissent un à un, réponses, minuteur ;
   - mode présentateur : une seconde fenêtre (notes, diapositive suivante, chronomètre) qui pilote la première ;
   - export PowerPoint (.pptx, avec PptxGenJS) et PDF (impression).
   Adresse : diaporamas.html#seance-3/5 ouvre la diapositive 5 de la séance 3.
   ========================================================================== */
(function () {
  "use strict";

  var racine = document.getElementById("outil-diaporamas");
  if (!racine) return;

  var BASE = racine.getAttribute("data-base") || "";
  var LANGUE = racine.getAttribute("data-langue") || "fr";
  var RTL = document.documentElement.dir === "rtl";
  var DECKS = Array.isArray(window.LX_DIAPOS) ? window.LX_DIAPOS : [];
  var PRESENTATEUR = /[?&]presentateur\b/.test(location.search);
  var LARGEUR = 1280, HAUTEUR = 720;
  var SVG = "http://www.w3.org/2000/svg";

  var TEXTES = {
    fr: {
      tous: "Tous les diaporamas", ouvrir: "Ouvrir", presenter: "Présenter", presentateur: "Mode présentateur",
      pptx: "PowerPoint (.pptx)", pdf: "PDF / imprimer", fiche: "Fiche de séance", lecon: "Leçon du cours",
      notes: "Notes de l'enseignant", aucune_note: "Pas de note pour cette diapositive.",
      precedente: "Diapositive précédente", suivante: "Diapositive suivante", position: "Diapositive {n} sur {t}",
      vignettes: "Diapositives", reponse: "Réponse", afficher_reponse: "Afficher la réponse", masquer_reponse: "Masquer la réponse",
      question: "Question", minuteur: "Minuteur", demarrer: "Démarrer", pause: "Pause", reinitialiser: "Remettre à zéro",
      temps_ecoule: "Temps écoulé !", materiel: "Matériel", exemple: "Exemple", seance: "Séance {n}", nb_diapos: "{n} diapositives",
      aide_clavier: "← → espace : avancer · F : plein écran · B : écran noir · N : notes · T : minuteur · Échap : quitter",
      quitter: "Quitter", plein_ecran: "Plein écran", ecran_noir: "Écran noir",
      pptx_prepa: "Préparation du fichier PowerPoint…", pptx_erreur: "Le fichier PowerPoint n'a pas pu être préparé.",
      aucun_deck: "Aucun diaporama pour l'instant : lancez « python3 tools/assembler.py ».",
      introuvable: "Ce diaporama n'existe pas.", diapo_suivante: "Ensuite", fin: "Fin du diaporama",
      chrono: "Chronomètre", heure: "Heure", presentateur_aide: "Cette fenêtre pilote la projection. Placez l'autre fenêtre sur l'écran du vidéoprojecteur et appuyez sur F pour le plein écran.",
      popup_bloquee: "Le navigateur a bloqué la fenêtre du présentateur : autorisez les fenêtres surgissantes pour ce site.",
      galerie_aide: "Une présentation par séance du guide de l'enseignant, plus le lancement du mini-projet. Ouvrez-en une pour la parcourir avec vos notes, puis « Présenter » pour projeter.",
      duree: "Durée", minutes: "{n} min", sortie: "Sortie", mini_projet: "Mini-projet"
    },
    en: {
      tous: "All slide decks", ouvrir: "Open", presenter: "Present", presentateur: "Presenter view",
      pptx: "PowerPoint (.pptx)", pdf: "PDF / print", fiche: "Lesson plan", lecon: "Course lesson",
      notes: "Teacher's notes", aucune_note: "No notes for this slide.",
      precedente: "Previous slide", suivante: "Next slide", position: "Slide {n} of {t}",
      vignettes: "Slides", reponse: "Answer", afficher_reponse: "Show the answer", masquer_reponse: "Hide the answer",
      question: "Question", minuteur: "Timer", demarrer: "Start", pause: "Pause", reinitialiser: "Reset",
      temps_ecoule: "Time's up!", materiel: "Materials", exemple: "Example", seance: "Session {n}", nb_diapos: "{n} slides",
      aide_clavier: "← → space: move on · F: full screen · B: black screen · N: notes · T: timer · Esc: exit",
      quitter: "Exit", plein_ecran: "Full screen", ecran_noir: "Black screen",
      pptx_prepa: "Preparing the PowerPoint file…", pptx_erreur: "The PowerPoint file could not be prepared.",
      aucun_deck: "No slide decks yet: run “python3 tools/assembler.py”.",
      introuvable: "This slide deck does not exist.", diapo_suivante: "Next", fin: "End of the deck",
      chrono: "Stopwatch", heure: "Time", presentateur_aide: "This window controls the projection. Put the other window on the projector screen and press F for full screen.",
      popup_bloquee: "The browser blocked the presenter window: allow pop-ups for this site.",
      galerie_aide: "One presentation per session of the teacher's guide, plus the mini-project launch. Open one to go through it with your notes, then “Present” to project it.",
      duree: "Duration", minutes: "{n} min", sortie: "Output", mini_projet: "Mini-project"
    },
    ar: {
      tous: "كل العروض", ouvrir: "فتح", presenter: "عرض", presentateur: "وضع المقدِّم",
      pptx: "\u2066PowerPoint (.pptx)\u2069", pdf: "PDF / طباعة", fiche: "مذكرة الحصة", lecon: "درس المقياس",
      notes: "ملاحظات الأستاذ", aucune_note: "لا توجد ملاحظات لهذه الشريحة.",
      precedente: "الشريحة السابقة", suivante: "الشريحة التالية", position: "الشريحة {n} من {t}",
      vignettes: "الشرائح", reponse: "الجواب", afficher_reponse: "إظهار الجواب", masquer_reponse: "إخفاء الجواب",
      question: "سؤال", minuteur: "المؤقّت", demarrer: "ابدأ", pause: "توقّف", reinitialiser: "إعادة الضبط",
      temps_ecoule: "انتهى الوقت!", materiel: "الوسائل", exemple: "مثال", seance: "الحصة {n}", nb_diapos: "عدد الشرائح: {n}",
      aide_clavier: "← → المسافة: تنقّل · F: ملء الشاشة · B: شاشة سوداء · N: الملاحظات · T: المؤقّت · Esc: خروج",
      quitter: "خروج", plein_ecran: "ملء الشاشة", ecran_noir: "شاشة سوداء",
      pptx_prepa: "جارٍ تحضير ملف PowerPoint…", pptx_erreur: "تعذّر تحضير ملف PowerPoint.",
      aucun_deck: "لا توجد عروض بعد: شغّلوا «python3 tools/assembler.py».",
      introuvable: "هذا العرض غير موجود.", diapo_suivante: "التالية", fin: "نهاية العرض",
      chrono: "الميقاتية", heure: "الساعة", presentateur_aide: "هذه النافذة تتحكّم في العرض. ضعوا النافذة الأخرى على شاشة جهاز العرض واضغطوا F لملء الشاشة.",
      popup_bloquee: "منع المتصفح نافذة المقدِّم: اسمحوا بالنوافذ المنبثقة لهذا الموقع.",
      galerie_aide: "عرض لكل حصة من حصص دليل الأستاذ، إضافة إلى عرض إطلاق المشروع المصغَّر. افتحوا عرضًا لتصفّحه مع ملاحظاتكم، ثم «عرض» لإسقاطه على الشاشة.",
      duree: "المدة", minutes: "{n} د", sortie: "المُخرَج", mini_projet: "المشروع المصغَّر"
    }
  };
  var T = TEXTES[LANGUE] || TEXTES.fr;

  /* ---------- Outils ---------- */

  function tpl(texte, v) { return String(texte).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function h(balise, props) {
    var el = document.createElement(balise);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) ajouter(el, arguments[i]);
    return el;
  }
  function ajouter(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { ajouter(el, x); }); return; }
    el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
  function vider(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function icone(nom) {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("class", "icone"); s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(SVG, "use"); u.setAttribute("href", "#" + nom);
    s.appendChild(u);
    return s;
  }
  function bouton(texte, action, options) {
    options = options || {};
    return h("button", { type: "button", class: options.classe || "bouton bouton--petit", onclick: action,
      "aria-label": options.seulIcone ? texte : null, title: options.seulIcone ? texte : options.titre },
      options.icone ? icone(options.icone) : null, options.seulIcone ? null : texte);
  }
  function chargerScript(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { ko(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  // **gras**, *italique*, `code` → nœuds DOM (jamais d'HTML brut).
  var MARQUES = /(`[^`]+`|\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*)/g;
  function enrichir(texte) {
    var frag = document.createDocumentFragment();
    String(texte == null ? "" : texte).split(MARQUES).forEach(function (morceau) {
      if (!morceau) return;
      if (/^`[^`]+`$/.test(morceau)) frag.appendChild(h("code", { dir: "ltr", text: morceau.slice(1, -1) }));
      else if (/^\*\*[^*]+\*\*$/.test(morceau)) frag.appendChild(h("strong", { text: morceau.slice(2, -2) }));
      else if (/^\*[^*]+\*$/.test(morceau)) frag.appendChild(h("em", { text: morceau.slice(1, -1) }));
      else frag.appendChild(document.createTextNode(morceau));
    });
    return frag;
  }
  function brut(texte) { return String(texte == null ? "" : texte).replace(/\*\*([^*]+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*([^*\s][^*]*?)\*/g, "$1"); }
  function deckParId(id) { return DECKS.filter(function (d) { return d.id === id; })[0] || null; }
  function etiquetteDeck(d) { return d.numero ? tpl(T.seance, { n: d.numero }) : T.mini_projet; }
  var LETTRES = LANGUE === "ar" ? ["أ", "ب", "ج", "د", "هـ"] : ["A", "B", "C", "D", "E"];

  /* ---------- Rendu d'une diapositive ---------- */

  // options.vignette : pas de minuteur actif ; options.tout : fragments et réponses visibles (impression, vue normale)
  function rendreDiapo(deck, i, options) {
    options = options || {};
    var d = deck.diapos[i];
    var el = h("section", { class: "diapo diapo--" + d.type, "data-type": d.type, "aria-roledescription": "slide",
      "aria-label": tpl(T.position, { n: i + 1, t: deck.diapos.length }) });
    var corps = h("div", { class: "diapo__corps" });
    var titre = function (t) { return t ? h("h2", { class: "diapo__titre" }, enrichir(t)) : null; };
    var fragment = function (actif) { return actif ? "fragment" : null; };

    function points(liste, progressif) {
      return h("ul", { class: "diapo__points" }, (liste || []).map(function (p) {
        var texte = typeof p === "string" ? p : p.texte;
        return h("li", { class: fragment(progressif) }, enrichir(texte),
          p.sous && p.sous.length ? h("ul", null, p.sous.map(function (s) { return h("li", null, enrichir(s)); })) : null);
      }));
    }

    switch (d.type) {
      case "titre":
        ajouter(corps, [
          d.surtitre ? h("p", { class: "diapo__surtitre" }, enrichir(d.surtitre)) : null,
          h("h1", { class: "diapo__grand-titre" }, enrichir(d.titre)),
          d.sousTitre ? h("p", { class: "diapo__sous-titre" }, enrichir(d.sousTitre)) : null]);
        el.appendChild(h("span", { class: "diapo__anneau", "aria-hidden": "true" }));
        break;
      case "section":
        ajouter(corps, [
          d.numero != null ? h("p", { class: "diapo__numero-section", text: String(d.numero) }) : null,
          h("h2", { class: "diapo__grand-titre" }, enrichir(d.titre)),
          d.sousTitre ? h("p", { class: "diapo__sous-titre" }, enrichir(d.sousTitre)) : null]);
        break;
      case "points":
        ajouter(corps, [titre(d.titre), points(d.points, d.progressif)]);
        break;
      case "deux":
        ajouter(corps, [titre(d.titre), h("div", { class: "diapo__colonnes" }, d.colonnes.map(function (c) {
          return h("div", { class: "diapo__colonne " + (fragment(d.progressif) || "") },
            c.titre ? h("h3", null, enrichir(c.titre)) : null, points(c.points, false));
        }))]);
        break;
      case "definition":
        ajouter(corps, [
          h("p", { class: "diapo__terme" }, enrichir(d.terme)),
          d.traduction ? h("p", { class: "diapo__traduction", lang: LANGUE === "fr" ? "en" : "fr" }, enrichir(d.traduction)) : null,
          h("p", { class: "diapo__definition" }, enrichir(d.definition)),
          d.exemple ? h("p", { class: "diapo__exemple" }, h("span", { class: "diapo__etiquette", text: T.exemple }), enrichir(d.exemple)) : null]);
        break;
      case "citation":
        ajouter(corps, h("figure", { class: "diapo__citation" },
          h("blockquote", null, h("p", null, enrichir(d.texte))),
          h("figcaption", null, enrichir(d.source))));
        break;
      case "code":
        var code = h("code", { class: "language-python", text: d.code });
        ajouter(corps, [titre(d.titre),
          h("pre", { class: "diapo__code", dir: "ltr" }, code),
          d.sortie ? h("div", { class: "diapo__sortie" }, h("span", { class: "diapo__etiquette", text: T.sortie }), h("pre", { dir: "ltr", text: d.sortie })) : null,
          d.legende ? h("p", { class: "diapo__legende" }, enrichir(d.legende)) : null]);
        if (window.Prism && Prism.highlightElement) { try { Prism.highlightElement(code); } catch (e) { /* coloration facultative */ } }
        break;
      case "tableau":
        ajouter(corps, [titre(d.titre), h("table", { class: "diapo__tableau" },
          h("thead", null, h("tr", null, d.entetes.map(function (x) { return h("th", { scope: "col" }, enrichir(x)); }))),
          h("tbody", null, d.lignes.map(function (l) {
            return h("tr", null, l.map(function (x, j) { return h(j === 0 ? "th" : "td", j === 0 ? { scope: "row" } : null, enrichir(x)); }));
          }))),
          d.legende ? h("p", { class: "diapo__legende" }, enrichir(d.legende)) : null]);
        break;
      case "etapes":
        // Beaucoup d'étapes ou de texte : deux rangées plutôt qu'une ligne de colonnes étroites.
        var longueur = d.etapes.reduce(function (n, e) { return n + e.titre.length + (e.texte || "").length; }, 0);
        var colonnes = d.etapes.length >= 4 && longueur > 260 ? Math.ceil(d.etapes.length / 2) : d.etapes.length;
        ajouter(corps, [titre(d.titre), h("ol", { class: "diapo__etapes" + (colonnes < d.etapes.length ? " diapo__etapes--rangees" : ""), style: "--colonnes:" + colonnes }, d.etapes.map(function (e, k) {
          return h("li", { class: fragment(d.progressif) }, h("span", { class: "diapo__etape-num", text: String(k + 1) }),
            h("p", { class: "diapo__etape-titre" }, enrichir(e.titre)), e.texte ? h("p", { class: "diapo__etape-texte" }, enrichir(e.texte)) : null);
        }))]);
        break;
      case "question":
        var rep = h("div", { class: "diapo__reponse fragment" + (options.tout ? "" : " diapo__reponse--cachee") },
          h("span", { class: "diapo__etiquette", text: T.reponse }), h("p", null, enrichir(d.reponse)),
          d.explication ? h("p", { class: "diapo__explication" }, enrichir(d.explication)) : null);
        ajouter(corps, [titre(d.titre || T.question), h("p", { class: "diapo__question" }, enrichir(d.question)),
          d.choix ? h("ol", { class: "diapo__choix" }, d.choix.map(function (c, k) {
            return h("li", null, h("span", { class: "diapo__lettre", text: LETTRES[k] }), h("span", null, enrichir(c)));
          })) : null, rep]);
        break;
      case "activite":
        ajouter(corps, [titre(d.titre),
          h("div", { class: "diapo__activite" },
            h("ol", { class: "diapo__consignes" }, d.consignes.map(function (c) { return h("li", null, enrichir(c)); })),
            minuteur(deck.id + "/" + i, d.duree, options.vignette)),
          d.materiel ? h("p", { class: "diapo__materiel" }, h("span", { class: "diapo__etiquette", text: T.materiel }), enrichir(d.materiel)) : null]);
        break;
      case "chiffre":
        ajouter(corps, [h("p", { class: "diapo__chiffre" }, enrichir(d.valeur)), h("p", { class: "diapo__chiffre-legende" }, enrichir(d.legende)),
          d.source ? h("p", { class: "diapo__source" }, enrichir(d.source)) : null]);
        break;
      case "chronologie":
        ajouter(corps, [titre(d.titre), h("ol", { class: "diapo__frise" }, d.evenements.map(function (e) {
          return h("li", null, h("span", { class: "diapo__frise-date", text: e.date }), h("p", null, enrichir(e.texte)));
        }))]);
        break;
      case "fin":
        ajouter(corps, [h("h2", { class: "diapo__titre diapo__titre--fin" }, enrichir(d.titre)),
          d.points ? points(d.points, false) : null, d.texte ? h("p", { class: "diapo__texte" }, enrichir(d.texte)) : null]);
        break;
    }
    if (options.tout) Array.prototype.forEach.call(el.querySelectorAll(".fragment"), function (f) { f.classList.add("fragment--visible"); });
    // En arabe, un texte sans lettre arabe (formule, ensemble, code, titre latin) se lit de gauche à droite.
    if (RTL) Array.prototype.forEach.call(el.querySelectorAll("td, th, .diapo__points li, .diapo__choix li > span:last-child, .diapo__etape-titre, .diapo__etape-texte, .diapo__frise p, .diapo__chiffre"), function (x) {
      if (!/[\u0600-\u06FF]/.test(x.textContent)) x.setAttribute("dir", "ltr");
    });
    el.appendChild(corps);
    el.appendChild(h("footer", { class: "diapo__pied" },
      h("span", { class: "diapo__pied-titre", text: etiquetteDeck(deck) + " · " + brut(deck.titre) }),
      h("span", { class: "diapo__pied-num", text: (i + 1) + " / " + deck.diapos.length })));
    return el;
  }

  // Réduit le texte d'une diapositive jusqu'à ce qu'il tienne (sans descendre sous 55 % environ).
  function ajuster(el) {
    var corps = el.querySelector(".diapo__corps");
    if (!corps || !corps.clientHeight) return;
    var taille = 1;
    el.style.setProperty("--taille", "1");
    el.classList.add("diapo--mesure");   // les fragments cachés sont décalés pour leur apparition : on mesure sans ce décalage
    while ((corps.scrollHeight > corps.clientHeight + 1 || corps.scrollWidth > corps.clientWidth + 1) && taille > 0.54) {
      taille = Math.round((taille - 0.04) * 100) / 100;
      el.style.setProperty("--taille", String(taille));
    }
    el.classList.remove("diapo--mesure");
  }

  // Une scène 16:9 qui contient une diapositive de 1280 × 720 mise à l'échelle.
  var observateur = window.ResizeObserver ? new ResizeObserver(function (entrees) {
    entrees.forEach(function (e) { echelonner(e.target); });
  }) : null;
  function echelonner(scene) {
    var w = scene.clientWidth, hh = scene.clientHeight;
    if (!w) return;
    var k = scene.classList.contains("scene--contenir") ? Math.min(w / LARGEUR, hh / HAUTEUR) : w / LARGEUR;
    scene.style.setProperty("--k", String(k));
  }
  function scene(classe) {
    var s = h("div", { class: "scene" + (classe ? " " + classe : "") });
    if (observateur) observateur.observe(s); else window.addEventListener("resize", function () { echelonner(s); });
    return s;
  }
  function placer(sc, diapo) {
    vider(sc).appendChild(diapo);
    echelonner(sc);
    ajuster(diapo);
  }

  /* ---------- Minuteurs des activités ---------- */

  var minuteurs = {};
  function etatMinuteur(cle, duree) {
    return minuteurs[cle] || (minuteurs[cle] = { total: duree * 60, restant: duree * 60, fin: null });
  }
  function restant(m) { return m.fin ? Math.max(0, Math.round((m.fin - Date.now()) / 1000)) : m.restant; }
  function mmss(s) { var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function minuteur(cle, duree, inerte) {
    var m = etatMinuteur(cle, duree);
    var affichage = h("p", { class: "minuteur__temps", "data-minuteur": cle, dir: "ltr", text: mmss(restant(m)) });
    var boite = h("div", { class: "minuteur", "data-cle": cle },
      h("p", { class: "minuteur__titre" }, icone("i-horloge"), T.minuteur + " · " + tpl(T.minutes, { n: duree })), affichage);
    if (!inerte) {
      boite.appendChild(h("div", { class: "minuteur__commandes" },
        bouton(T.demarrer, function (e) { e.stopPropagation(); piloterMinuteur(cle, duree, "bascule", true); }, { classe: "minuteur__bouton", icone: "i-lecture" }),
        bouton(T.reinitialiser, function (e) { e.stopPropagation(); piloterMinuteur(cle, duree, "zero", true); }, { classe: "minuteur__bouton", icone: "i-retour", seulIcone: true })));
    }
    majMinuteurs();
    return boite;
  }
  function piloterMinuteur(cle, duree, action, diffuser) {
    var m = etatMinuteur(cle, duree);
    if (action === "bascule") {
      if (m.fin) { m.restant = restant(m); m.fin = null; }
      else { if (m.restant <= 0) m.restant = m.total; m.fin = Date.now() + m.restant * 1000; }
    } else if (action === "zero") { m.fin = null; m.restant = m.total; }
    if (diffuser) envoyer({ type: "minuteur", cle: cle, duree: duree, action: action });
    majMinuteurs();
  }
  function majMinuteurs() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-minuteur]"), function (el) {
      var cle = el.getAttribute("data-minuteur"), m = minuteurs[cle];
      if (!m) return;
      var r = restant(m);
      if (m.fin && r <= 0) { m.fin = null; m.restant = 0; }
      el.textContent = r <= 0 ? T.temps_ecoule : mmss(r);
      var boite = el.closest(".minuteur");
      if (boite) {
        boite.classList.toggle("minuteur--marche", !!m.fin);
        boite.classList.toggle("minuteur--fini", r <= 0);
        var b = boite.querySelector(".minuteur__bouton");
        if (b && b.lastChild) b.lastChild.textContent = m.fin ? T.pause : T.demarrer;
        var u = b && b.querySelector("use");
        if (u) u.setAttribute("href", m.fin ? "#i-pause" : "#i-lecture");
      }
    });
  }
  setInterval(function () {
    if (Object.keys(minuteurs).some(function (k) { return minuteurs[k].fin; })) majMinuteurs();
  }, 250);

  /* ---------- Synchronisation entre fenêtres (mode présentateur) ---------- */

  var canal = window.BroadcastChannel ? new BroadcastChannel("lx-diaporamas") : null;
  var moi = Math.random().toString(36).slice(2);
  function envoyer(msg) { if (canal) { msg.de = moi; canal.postMessage(msg); } }
  if (canal) canal.onmessage = function (e) {
    var m = e.data || {};
    if (m.de === moi) return;
    if (m.type === "aller" && vue.deck && m.deck === vue.deck.id) aller(m.index, m.etape, false);
    else if (m.type === "aller" && m.deck !== (vue.deck && vue.deck.id)) { ouvrirDeck(m.deck, m.index, false); aller(m.index, m.etape, false); }
    else if (m.type === "minuteur") piloterMinuteur(m.cle, m.duree, m.action, false);
    else if (m.type === "noir") basculerNoir(m.valeur, false);
  };

  /* ---------- Vues ---------- */

  var vue = { deck: null, index: 0, etape: 0, projection: null, notes: true, noir: false, debut: null };

  function fragments(el) { return el ? el.querySelectorAll(".fragment") : []; }
  function nbEtapes(i) {
    // Le nombre de fragments d'une diapositive, sans la dessiner : points progressifs, colonnes, étapes, réponse.
    var d = vue.deck.diapos[i];
    if (!d) return 0;
    if (d.type === "question") return 1;
    if (!d.progressif) return 0;
    if (d.type === "points") return d.points.length;
    if (d.type === "deux") return 2;
    if (d.type === "etapes") return d.etapes.length;
    return 0;
  }

  function afficherGalerie() {
    vue.deck = null;
    vider(racine);
    if (!DECKS.length) { racine.appendChild(h("p", { class: "outil-message", text: T.aucun_deck })); return; }
    racine.appendChild(h("p", { class: "galerie-aide", text: T.galerie_aide }));
    var grille = h("ol", { class: "galerie" });
    DECKS.forEach(function (deck) {
      var sc = scene("scene--vignette");
      var carte = h("li", { class: "carte-deck" },
        h("a", { class: "carte-deck__apercu", href: "#" + deck.id, "aria-hidden": "true", tabindex: "-1" }, sc),
        h("div", { class: "carte-deck__corps" },
          h("p", { class: "surtitre", text: etiquetteDeck(deck) + (deck.duree ? " · " + deck.duree : "") }),
          h("h2", { class: "carte-deck__titre" }, h("a", { href: "#" + deck.id }, enrichir(deck.titre))),
          h("p", { class: "carte-deck__resume" }, enrichir(deck.resume)),
          h("p", { class: "carte-deck__nb", text: tpl(T.nb_diapos, { n: deck.diapos.length }) })),
        h("div", { class: "carte-deck__actions" },
          h("a", { class: "bouton bouton--petit bouton--prisme", href: "#" + deck.id }, icone("i-ecran"), T.ouvrir),
          bouton(T.presenter, function () { ouvrirDeck(deck.id, 0, true); projeter(); }, { icone: "i-lecture" }),
          bouton(T.pptx, function () { exporterPptx(deck); }, { icone: "i-telecharger", classe: "bouton bouton--petit bouton--discret" })));
      grille.appendChild(carte);
      requestAnimationFrame(function () { placer(sc, rendreDiapo(deck, 0, { vignette: true, tout: true })); });
    });
    racine.appendChild(grille);
  }

  var zones = {};
  function ouvrirDeck(id, index, majAdresse) {
    var deck = deckParId(id);
    if (!deck) { afficherGalerie(); racine.insertBefore(h("p", { class: "outil-message outil-message--erreur", text: T.introuvable }), racine.firstChild); return; }
    vue.deck = deck;
    vider(racine);
    zones.principale = scene("scene--principale");
    zones.vignettes = h("ol", { class: "vignettes", "aria-label": T.vignettes });
    zones.notes = h("div", { class: "notes-panneau__texte" });
    zones.position = h("span", { class: "visionneuse__position", "aria-live": "polite" });
    zones.reponse = bouton(T.afficher_reponse, basculerReponse, { icone: "i-ampoule", classe: "bouton bouton--petit visionneuse__reponse" });

    var liens = [];
    if (deck.fiche) liens.push(h("a", { class: "bouton bouton--petit bouton--discret", href: deck.fiche }, icone("i-crayon"), T.fiche));
    if (deck.lien) liens.push(h("a", { class: "bouton bouton--petit bouton--discret", href: deck.lien }, icone("i-livre"), T.lecon));

    var barre = h("div", { class: "visionneuse__barre" },
      h("a", { class: "bouton bouton--petit bouton--discret", href: "#" }, icone("i-retour"), T.tous),
      h("div", { class: "visionneuse__nav" },
        bouton(T.precedente, function () { reculer(); }, { icone: "i-precedent", classe: "bouton-verre", seulIcone: true }),
        zones.position,
        bouton(T.suivante, function () { avancer(); }, { icone: "i-suivant", classe: "bouton-verre", seulIcone: true })),
      h("div", { class: "visionneuse__actions" },
        bouton(T.presenter, function () { projeter(); }, { icone: "i-lecture", classe: "bouton bouton--petit bouton--prisme" }),
        bouton(T.presentateur, ouvrirPresentateur, { icone: "i-ecran" }),
        bouton(T.pptx, function () { exporterPptx(deck); }, { icone: "i-telecharger" }),
        bouton(T.pdf, function () { imprimer(deck); }, { icone: "i-imprimer" })));

    deck.diapos.forEach(function (d, i) {
      var sc = scene("scene--vignette");
      zones.vignettes.appendChild(h("li", null, h("button", { type: "button", class: "vignette", "data-index": i,
        "aria-label": tpl(T.position, { n: i + 1, t: deck.diapos.length }) + " · " + brut(d.titre || d.terme || d.question || d.valeur || ""),
        onclick: function () { aller(i, null, true); } }, h("span", { class: "vignette__num", text: String(i + 1) }), sc)));
    });

    ajouter(racine, [
      h("header", { class: "visionneuse__tete" },
        h("p", { class: "surtitre", text: etiquetteDeck(deck) + (deck.duree ? " · " + deck.duree : "") }),
        h("h2", { class: "visionneuse__titre" }, enrichir(deck.titre))),
      barre,
      h("div", { class: "visionneuse" },
        h("nav", { class: "visionneuse__vignettes", "aria-label": T.vignettes }, zones.vignettes),
        h("div", { class: "visionneuse__principal" },
          zones.principale,
          h("div", { class: "visionneuse__sous-scene" }, zones.reponse, liens),
          h("section", { class: "notes-panneau", "aria-label": T.notes }, h("h3", { text: T.notes }), zones.notes))),
      h("p", { class: "visionneuse__aide", text: T.aide_clavier })]);

    // Les vignettes se dessinent après coup, pour afficher tout de suite la diapositive principale.
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(zones.vignettes.querySelectorAll(".scene"), function (sc, i) {
        placer(sc, rendreDiapo(deck, i, { vignette: true, tout: true }));
      });
    });
    aller(Math.max(0, Math.min(deck.diapos.length - 1, index || 0)), null, majAdresse);
    if (PRESENTATEUR) modePresentateur();
  }

  function aller(i, etape, diffuser) {
    var deck = vue.deck;
    if (!deck) return;
    i = Math.max(0, Math.min(deck.diapos.length - 1, i));
    var changement = i !== vue.index || !zones.principale.firstChild;
    vue.index = i;
    // Par défaut tout est visible, sauf la réponse d'une question.
    vue.etape = etape == null ? (deck.diapos[i].type === "question" ? 0 : nbEtapes(i)) : Math.max(0, Math.min(nbEtapes(i), etape));
    if (changement || !zones.principale.firstChild) placer(zones.principale, rendreDiapo(deck, i, { tout: false }));
    appliquerEtape(zones.principale.firstChild, vue.etape, !vue.projection);
    zones.position.textContent = tpl(T.position, { n: i + 1, t: deck.diapos.length });
    vider(zones.notes).appendChild(deck.diapos[i].notes ? enrichir(deck.diapos[i].notes) : h("em", { text: T.aucune_note }));
    zones.reponse.hidden = deck.diapos[i].type !== "question";
    majBoutonReponse();
    Array.prototype.forEach.call(zones.vignettes.querySelectorAll(".vignette"), function (b, k) {
      if (k === i) { b.setAttribute("aria-current", "true"); b.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      else b.removeAttribute("aria-current");
    });
    if (vue.projection) majProjection();
    if (vue.presentateur) majPresentateur();
    var adresse = "#" + deck.id + (i ? "/" + (i + 1) : "");
    if (location.hash !== adresse) history.replaceState(null, "", adresse + "");
    if (diffuser !== false) envoyer({ type: "aller", deck: deck.id, index: i, etape: vue.etape });
  }

  // Fragments : en projection, visibles jusqu'à l'étape courante ; la réponse d'une question reste cachée tant qu'on ne l'a pas demandée.
  function appliquerEtape(el, etape, vueNormale) {
    if (!el) return;
    var frs = fragments(el);
    Array.prototype.forEach.call(frs, function (f, k) {
      var reponse = f.classList.contains("diapo__reponse");
      var visible = reponse ? etape > k : (vueNormale || etape > k);
      f.classList.toggle("fragment--visible", visible);
      if (reponse) f.classList.toggle("diapo__reponse--cachee", !visible);
    });
  }
  function basculerReponse() {
    var i = vue.index;
    vue.etape = vue.etape >= nbEtapes(i) ? 0 : nbEtapes(i);
    appliquerEtape(zones.principale.firstChild, vue.etape, true);
    majBoutonReponse();
    envoyer({ type: "aller", deck: vue.deck.id, index: i, etape: vue.etape });
  }
  function majBoutonReponse() {
    var visible = vue.deck && vue.deck.diapos[vue.index].type === "question" && vue.etape >= 1;
    zones.reponse.lastChild.textContent = visible ? T.masquer_reponse : T.afficher_reponse;
  }

  function avancer() {
    if (!vue.deck) return;
    if (vue.projection || vue.presentateur) {
      if (vue.etape < nbEtapes(vue.index)) { aller(vue.index, vue.etape + 1); return; }
      if (vue.index < vue.deck.diapos.length - 1) aller(vue.index + 1, 0);
      return;
    }
    // Vue normale : une question passe par sa réponse avant la diapositive suivante.
    if (vue.deck.diapos[vue.index].type === "question" && vue.etape < 1) { basculerReponse(); return; }
    if (vue.index < vue.deck.diapos.length - 1) aller(vue.index + 1, null);
  }
  function reculer() {
    if (!vue.deck) return;
    if ((vue.projection || vue.presentateur) && vue.etape > 0) { aller(vue.index, vue.etape - 1); return; }
    if (vue.index > 0) aller(vue.index - 1, vue.projection || vue.presentateur ? nbEtapes(vue.index - 1) : null);
  }

  /* ---------- Projection plein écran ---------- */

  function projeter(sansPleinEcran) {
    if (!vue.deck || vue.projection) return;
    var sc = scene("scene--contenir");
    var compteur = h("span", { class: "projection__compteur" });
    var commandes = h("div", { class: "projection__commandes" },
      bouton(T.precedente, function (e) { e.stopPropagation(); reculer(); }, { icone: "i-precedent", classe: "bouton-verre", seulIcone: true }),
      compteur,
      bouton(T.suivante, function (e) { e.stopPropagation(); avancer(); }, { icone: "i-suivant", classe: "bouton-verre", seulIcone: true }),
      bouton(T.plein_ecran, function (e) { e.stopPropagation(); pleinEcran(); }, { icone: "i-plein-ecran", classe: "bouton-verre", seulIcone: true }),
      bouton(T.ecran_noir, function (e) { e.stopPropagation(); basculerNoir(!vue.noir, true); }, { icone: "i-contraste", classe: "bouton-verre", seulIcone: true }),
      bouton(T.quitter, function (e) { e.stopPropagation(); quitterProjection(); }, { icone: "i-fermer", classe: "bouton-verre", seulIcone: true }));
    var el = h("div", { class: "projection", role: "dialog", "aria-modal": "true", "aria-label": brut(vue.deck.titre), tabindex: "-1" },
      sc, h("div", { class: "projection__progression", "aria-hidden": "true" }, h("span")),
      h("div", { class: "projection__noir", "aria-hidden": "true" }), commandes);
    el.addEventListener("click", function (e) {
      if (e.target.closest("button, a, .minuteur")) return;
      var x = e.clientX / window.innerWidth;
      if (RTL ? x > 0.75 : x < 0.25) reculer(); else avancer();
    });
    var delai;
    el.addEventListener("mousemove", function () {
      el.classList.add("projection--active");
      clearTimeout(delai);
      delai = setTimeout(function () { el.classList.remove("projection--active"); }, 2200);
    });
    var depart = null;
    el.addEventListener("touchstart", function (e) { depart = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (depart == null) return;
      var dx = e.changedTouches[0].clientX - depart;
      depart = null;
      if (Math.abs(dx) < 50) return;
      if ((dx < 0) !== RTL) avancer(); else reculer();
    });
    document.body.appendChild(el);
    document.documentElement.classList.add("lx-projection");
    vue.projection = { el: el, scene: sc, compteur: compteur };
    aller(vue.index, 0, true);
    el.focus();
    if (!sansPleinEcran) pleinEcran();
  }
  function majProjection() {
    var p = vue.projection;
    placer(p.scene, rendreDiapo(vue.deck, vue.index, {}));
    appliquerEtape(p.scene.firstChild, vue.etape, false);
    p.compteur.textContent = (vue.index + 1) + " / " + vue.deck.diapos.length;
    p.el.querySelector(".projection__progression span").style.inlineSize = ((vue.index + 1) / vue.deck.diapos.length * 100) + "%";
    // La diapositive principale de la vue normale suit, avec les mêmes fragments.
    appliquerEtape(zones.principale.firstChild, vue.etape, false);
  }
  function pleinEcran() {
    var el = vue.projection ? vue.projection.el : document.documentElement;
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(function () { /* refusé : la projection reste en surimpression */ });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }
  function quitterProjection() {
    if (!vue.projection) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    vue.projection.el.remove();
    vue.projection = null;
    vue.noir = false;
    document.documentElement.classList.remove("lx-projection");
    aller(vue.index, null, false);
  }
  function basculerNoir(valeur, diffuser) {
    vue.noir = !!valeur;
    if (vue.projection) vue.projection.el.classList.toggle("projection--noir", vue.noir);
    if (diffuser) envoyer({ type: "noir", valeur: vue.noir });
  }
  document.addEventListener("fullscreenchange", function () {
    // Sortie du plein écran par Échap : la projection s'arrête aussi (sauf fenêtre projetée par le présentateur).
    if (!document.fullscreenElement && vue.projection && !vue.projection.pilotee) quitterProjection();
  });

  /* ---------- Mode présentateur ---------- */

  function ouvrirPresentateur() {
    var adresse = location.pathname + "?presentateur#" + vue.deck.id + "/" + (vue.index + 1);
    var w = window.open(adresse, "lx-presentateur", "width=1100,height=720");
    if (!w) { window.alert(T.popup_bloquee); return; }
    // Cette fenêtre-ci devient l'écran projeté ; F la met en plein écran une fois sur le vidéoprojecteur.
    projeter(true);
    vue.projection.pilotee = true;
  }
  function modePresentateur() {
    document.documentElement.classList.add("lx-presentateur");
    vue.presentateur = true;
    vue.debut = Date.now();
    var suivante = scene("scene--vignette");
    var chrono = h("span", { class: "presentateur__chrono", dir: "ltr", text: "00:00" });
    var heure = h("span", { class: "presentateur__heure", dir: "ltr" });
    var el = h("div", { class: "presentateur" },
      h("p", { class: "presentateur__aide", text: T.presentateur_aide }),
      h("div", { class: "presentateur__horloges" },
        h("p", null, h("span", { class: "surtitre", text: T.chrono }), chrono,
          bouton(T.reinitialiser, function () { vue.debut = Date.now(); }, { icone: "i-retour", classe: "bouton-verre", seulIcone: true })),
        h("p", null, h("span", { class: "surtitre", text: T.heure }), heure)),
      h("div", { class: "presentateur__suivante" }, h("p", { class: "surtitre", text: T.diapo_suivante }), suivante));
    zones.presentateur = { el: el, suivante: suivante };
    var principal = racine.querySelector(".visionneuse__principal");
    principal.insertBefore(el, principal.querySelector(".notes-panneau"));
    setInterval(function () {
      var s = Math.floor((Date.now() - vue.debut) / 1000);
      chrono.textContent = mmss(s);
      heure.textContent = new Intl.DateTimeFormat(LANGUE === "ar" ? "ar-DZ" : LANGUE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
    }, 1000);
    majPresentateur();
    envoyer({ type: "aller", deck: vue.deck.id, index: vue.index, etape: vue.etape });
  }
  function majPresentateur() {
    if (!zones.presentateur) return;
    var i = vue.index + 1;
    if (i < vue.deck.diapos.length) placer(zones.presentateur.suivante, rendreDiapo(vue.deck, i, { vignette: true, tout: true }));
    else vider(zones.presentateur.suivante).appendChild(h("p", { class: "presentateur__fin", text: T.fin }));
    appliquerEtape(zones.principale.firstChild, vue.etape, false);
  }

  /* ---------- Clavier ---------- */

  document.addEventListener("keydown", function (e) {
    if (!vue.deck || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    var suivant = RTL ? "ArrowLeft" : "ArrowRight", precedent = RTL ? "ArrowRight" : "ArrowLeft";
    var k = e.key;
    if (k === suivant || k === "ArrowDown" || k === "PageDown" || (k === " " && vue.projection) || (k === "Enter" && vue.projection)) { e.preventDefault(); avancer(); }
    else if (k === precedent || k === "ArrowUp" || k === "PageUp" || k === "Backspace") { e.preventDefault(); reculer(); }
    else if (k === "Home") { e.preventDefault(); aller(0, 0); }
    else if (k === "End") { e.preventDefault(); aller(vue.deck.diapos.length - 1, null); }
    else if (k === "f" || k === "F") { e.preventDefault(); if (!vue.projection) projeter(); else pleinEcran(); }
    else if ((k === "b" || k === "B" || k === ".") && vue.projection) { e.preventDefault(); basculerNoir(!vue.noir, true); }
    else if (k === "n" || k === "N") { e.preventDefault(); racine.classList.toggle("sans-notes"); }
    else if (k === "t" || k === "T") {
      var d = vue.deck.diapos[vue.index];
      if (d.type === "activite") { e.preventDefault(); piloterMinuteur(vue.deck.id + "/" + vue.index, d.duree, "bascule", true); }
    }
    else if (k === "Escape" && vue.projection) { e.preventDefault(); quitterProjection(); }
  });

  /* ---------- Impression / PDF ---------- */

  function imprimer(deck) {
    var feuille = h("div", { class: "impression-diapos" });
    document.body.appendChild(feuille);
    deck.diapos.forEach(function (d, i) {
      var page = h("div", { class: "impression-diapos__page" });
      feuille.appendChild(page);
      var el = rendreDiapo(deck, i, { vignette: true, tout: true });
      page.appendChild(el);
      appliquerEtape(el, 99, true);
      el.querySelectorAll(".diapo__reponse").forEach(function (r) { r.classList.remove("diapo__reponse--cachee"); });
      ajuster(el);
    });
    document.documentElement.classList.add("lx-impression-diapos");
    function nettoyer() {
      document.documentElement.classList.remove("lx-impression-diapos");
      feuille.remove();
      window.removeEventListener("afterprint", nettoyer);
    }
    window.addEventListener("afterprint", nettoyer);
    setTimeout(function () { window.print(); }, 50);
  }

  /* ---------- Export PowerPoint ---------- */

  var pptxPret = null;
  function chargerPptx() {
    if (window.PptxGenJS) return Promise.resolve();
    return pptxPret || (pptxPret = chargerScript(BASE + "assets/vendor/pptxgenjs/pptxgen.bundle.js"));
  }
  function exporterPptx(deck) {
    var message = h("p", { class: "toast", role: "status", text: T.pptx_prepa });
    document.body.appendChild(message);
    chargerPptx().then(function () { return construirePptx(deck); }).then(function () {
      message.remove();
    }).catch(function (e) {
      message.textContent = T.pptx_erreur;
      setTimeout(function () { message.remove(); }, 4000);
      if (window.console) console.error(e);
    });
  }

  function construirePptx(deck) {
    var clair = document.documentElement.getAttribute("data-theme") === "light" ||
      (!document.documentElement.getAttribute("data-theme") && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
    var C = clair
      ? { fond: "FFFFFF", texte: "121216", doux: "55555F", surface: "E9E9EE", code: "F4F4F6", ligne: "D0D0D8", accent: "1C64FF", accent2: "DD2476" }
      : { fond: "151515", texte: "F5F5F5", doux: "A9A9B6", surface: "1F1F25", code: "07070A", ligne: "2E2E35", accent: "87CEEB", accent2: "F472A8" };
    var PRISME = ["FFFF00", "87CEEB", "FF512F", "DD2476", "1C64FF"];
    var AR = LANGUE === "ar";
    var F_TITRE = AR ? "Arial" : "Georgia", F_TEXTE = AR ? "Arial" : "Calibri", F_CODE = "Consolas";
    var W = 13.333, H = 7.5, M = 0.6;
    var ALIGN = AR ? "right" : "left";
    var pptx = new window.PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.title = brut(deck.titre);
    pptx.subject = "Intelligence artificielle · Master LGC";
    pptx.company = "Université Yahia Farès, Médéa";
    if (AR) pptx.rtlMode = true;

    function X(x, w) { return AR ? W - x - w : x; }
    function base(extra) {
      var o = { fontFace: F_TEXTE, color: C.texte, align: ALIGN, valign: "top", margin: 0, paraSpaceAfter: 6 };
      if (AR) { o.rtlMode = true; o.lang = "ar-DZ"; }
      Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }
    // Texte avec **gras**, *italique*, `code` → fragments PptxGenJS.
    function runs(texte, options) {
      var r = [];
      String(texte == null ? "" : texte).split(MARQUES).forEach(function (m) {
        if (!m) return;
        if (/^`[^`]+`$/.test(m)) r.push({ text: m.slice(1, -1), options: { fontFace: F_CODE, color: C.accent } });
        else if (/^\*\*[^*]+\*\*$/.test(m)) r.push({ text: m.slice(2, -2), options: { bold: true } });
        else if (/^\*[^*]+\*$/.test(m)) r.push({ text: m.slice(1, -1), options: { italic: true } });
        else r.push({ text: m, options: {} });
      });
      if (!r.length) r.push({ text: "", options: {} });
      if (options) r.forEach(function (x) { Object.keys(options).forEach(function (k) { if (x.options[k] == null) x.options[k] = options[k]; }); });
      // Les propriétés du paragraphe (sens de lecture, alignement) sont lues sur son premier morceau.
      if (AR) r.forEach(function (x) { if (x.options.rtlMode == null) x.options.rtlMode = true; if (!x.options.lang) x.options.lang = "ar-DZ"; });
      return r;
    }
    function paragraphe(texte, options) {
      var r = runs(texte, options);
      r[r.length - 1].options.breakLine = true;
      return r;
    }
    function taille(textes, grand, petit, seuil) {
      var n = textes.join(" ").length;
      return n <= seuil ? grand : Math.max(petit, Math.round(grand * Math.sqrt(seuil / n)));
    }
    function cadre(s, i) {
      s.background = { color: C.fond };
      PRISME.forEach(function (c, k) { s.addShape(pptx.ShapeType.rect, { x: k * W / 5, y: 0, w: W / 5, h: 0.07, fill: { color: c }, line: { color: c, width: 0 } }); });
      s.addText(etiquetteDeck(deck) + " · " + brut(deck.titre), base({ x: X(M, 9), y: H - 0.45, w: 9, h: 0.3, fontSize: 10, color: C.doux }));
      s.addText((i + 1) + " / " + deck.diapos.length, base({ x: X(W - M - 2, 2), y: H - 0.45, w: 2, h: 0.3, fontSize: 10, color: C.doux, align: AR ? "left" : "right" }));
    }
    function titre(s, t) {
      s.addText(runs(t), base({ x: M, y: 0.4, w: W - 2 * M, h: 0.9, fontFace: F_TITRE, fontSize: 30, valign: "middle" }));
      s.addShape(pptx.ShapeType.rect, { x: X(M, 1.6), y: 1.32, w: 1.6, h: 0.05, fill: { color: C.accent }, line: { color: C.accent, width: 0 } });
    }
    function puces(liste, x, y, w, hh, grand) {
      var textes = [], paras = [];
      (liste || []).forEach(function (p) {
        var t = typeof p === "string" ? p : p.texte;
        textes.push(t);
        paras.push({ t: t, niveau: 0 });
        (p.sous || []).forEach(function (s) { textes.push(s); paras.push({ t: s, niveau: 1 }); });
      });
      var fs = taille(textes, grand || 24, 14, 260);
      var contenu = [];
      paras.forEach(function (p) {
        var r = runs(p.t, { fontSize: p.niveau ? fs - 4 : fs, color: p.niveau ? C.doux : C.texte });
        r[0].options.bullet = p.niveau ? { indent: 18 } : { code: "25CF", indent: 22 };
        r[0].options.indentLevel = p.niveau;
        r[r.length - 1].options.breakLine = true;
        r[0].options.paraSpaceBefore = p.niveau ? 2 : 8;
        contenu = contenu.concat(r);
      });
      return { contenu: contenu, options: base({ x: x, y: y, w: w, h: hh, fontSize: fs }) };
    }
    function notes(s, d, extra) {
      var t = brut(d.notes || "");
      if (extra) t = extra + (t ? "\n\n" + t : "");
      if (t) s.addNotes(t);
    }

    deck.diapos.forEach(function (d, i) {
      var s = pptx.addSlide();
      cadre(s, i);
      var y0 = 1.6, hMax = H - y0 - 0.7, wMax = W - 2 * M;
      switch (d.type) {
        case "titre":
          if (d.surtitre) s.addText(runs(d.surtitre), base({ x: M, y: 2.0, w: wMax, h: 0.5, fontSize: 16, color: C.accent, bold: true, charSpacing: 2 }));
          s.addText(runs(d.titre), base({ x: M, y: 2.55, w: wMax, h: 1.9, fontFace: F_TITRE, fontSize: taille([brut(d.titre)], 44, 30, 60), valign: "middle" }));
          if (d.sousTitre) s.addText(runs(d.sousTitre), base({ x: M, y: 4.6, w: wMax, h: 1, fontSize: 18, color: C.doux }));
          break;
        case "section":
          if (d.numero != null) s.addText(String(d.numero), base({ x: M, y: 1.6, w: wMax, h: 1.4, fontFace: F_TITRE, fontSize: 80, color: C.accent }));
          s.addText(runs(d.titre), base({ x: M, y: 3.1, w: wMax, h: 1.4, fontFace: F_TITRE, fontSize: 38, valign: "middle" }));
          if (d.sousTitre) s.addText(runs(d.sousTitre), base({ x: M, y: 4.6, w: wMax, h: 1, fontSize: 20, color: C.doux }));
          break;
        case "points":
          titre(s, d.titre);
          var p = puces(d.points, M, y0, wMax, hMax);
          s.addText(p.contenu, p.options);
          break;
        case "fin":
          titre(s, d.titre);
          var yy = y0;
          if (d.points) { var pf = puces(d.points, M, yy, wMax, d.texte ? hMax - 1.2 : hMax); s.addText(pf.contenu, pf.options); yy += d.texte ? hMax - 1.1 : hMax; }
          if (d.texte) s.addText(runs(d.texte), base({ x: M, y: d.points ? yy : y0, w: wMax, h: 1, fontSize: 20, italic: true, color: C.doux }));
          break;
        case "deux":
          titre(s, d.titre);
          var wc = (wMax - 0.5) / 2;
          d.colonnes.forEach(function (c, k) {
            var x = X(M + k * (wc + 0.5), wc);
            s.addShape(pptx.ShapeType.roundRect, { x: x, y: y0, w: wc, h: hMax, fill: { color: C.surface }, line: { color: C.ligne, width: 1 }, rectRadius: 0.12 });
            if (c.titre) s.addText(runs(c.titre), base({ x: x + 0.25, y: y0 + 0.2, w: wc - 0.5, h: 0.6, fontSize: 20, bold: true, color: k ? C.accent2 : C.accent }));
            var pc = puces(c.points, x + 0.25, y0 + (c.titre ? 0.85 : 0.25), wc - 0.5, hMax - 1.1, 20);
            s.addText(pc.contenu, pc.options);
          });
          break;
        case "definition":
          s.addText(runs(d.terme), base({ x: M, y: 1.2, w: wMax, h: 1.1, fontFace: F_TITRE, fontSize: 40, color: C.accent, valign: "middle" }));
          if (d.traduction) s.addText(runs(d.traduction), base({ x: M, y: 2.3, w: wMax, h: 0.5, fontSize: 18, italic: true, color: C.doux, rtlMode: false, align: ALIGN }));
          s.addText(runs(d.definition), base({ x: M, y: 3.0, w: wMax, h: d.exemple ? 1.9 : 3.3, fontSize: taille([d.definition], 26, 18, 160) }));
          if (d.exemple) {
            s.addShape(pptx.ShapeType.roundRect, { x: M, y: 5.05, w: wMax, h: 1.4, fill: { color: C.surface }, line: { color: C.ligne, width: 1 }, rectRadius: 0.1 });
            s.addText([{ text: T.exemple + " · ", options: { bold: true, color: C.accent2 } }].concat(runs(d.exemple)), base({ x: M + 0.25, y: 5.2, w: wMax - 0.5, h: 1.1, fontSize: 18, valign: "middle" }));
          }
          break;
        case "citation":
          s.addText("«", base({ x: M, y: 0.9, w: 1.5, h: 1.4, fontFace: F_TITRE, fontSize: 96, color: C.accent }));
          s.addText(runs(d.texte), base({ x: M + 0.6, y: 1.9, w: wMax - 1.2, h: 3.2, fontFace: F_TITRE, fontSize: taille([d.texte], 30, 20, 140), italic: !AR, valign: "middle" }));
          s.addText(runs("— " + d.source), base({ x: M + 0.6, y: 5.3, w: wMax - 1.2, h: 0.8, fontSize: 18, color: C.doux }));
          break;
        case "code":
          titre(s, d.titre);
          var lignes = d.code.split("\n").length, lsortie = d.sortie ? d.sortie.split("\n").length : 0;
          var fsCode = Math.max(11, Math.min(18, Math.floor(260 / (lignes + lsortie + 2))));
          var hCode = Math.min(hMax - (d.sortie ? 0.9 + lsortie * fsCode / 60 : 0) - (d.legende ? 0.5 : 0), lignes * fsCode / 52 + 0.4);
          s.addShape(pptx.ShapeType.roundRect, { x: M, y: y0, w: wMax, h: hCode, fill: { color: C.code }, line: { color: C.ligne, width: 1 }, rectRadius: 0.08 });
          s.addText(d.code, { x: M + 0.2, y: y0 + 0.1, w: wMax - 0.4, h: hCode - 0.2, fontFace: F_CODE, fontSize: fsCode, color: C.texte, align: "left", valign: "top", margin: 0, rtlMode: false });
          var yc = y0 + hCode + 0.15;
          if (d.sortie) {
            var hs = 0.35 + lsortie * fsCode / 55;
            s.addText(T.sortie, base({ x: M, y: yc, w: 3, h: 0.3, fontSize: 11, bold: true, color: C.doux }));
            s.addText(d.sortie, { x: M + 0.2, y: yc + 0.3, w: wMax - 0.4, h: hs, fontFace: F_CODE, fontSize: fsCode, color: C.accent, align: "left", valign: "top", margin: 0, rtlMode: false });
            yc += hs + 0.4;
          }
          if (d.legende) s.addText(runs(d.legende), base({ x: M, y: Math.min(yc, H - 1.1), w: wMax, h: 0.5, fontSize: 15, italic: true, color: C.doux }));
          break;
        case "tableau":
          titre(s, d.titre);
          var cellules = d.lignes.map(function (l) { return l.join(" "); }).concat(d.entetes);
          var fsT = taille(cellules, 18, 11, 380);
          var rows = [d.entetes.map(function (e) { return { text: runs(e, { bold: true, color: C.texte }), options: { fill: { color: C.surface } } }; })]
            .concat(d.lignes.map(function (l) { return l.map(function (c, j) { return { text: runs(c, j === 0 ? { bold: true } : {}) }; }); }));
          if (AR) rows = rows.map(function (r) { return r.slice().reverse(); });
          s.addTable(rows, { x: M, y: y0, w: wMax, fontFace: F_TEXTE, fontSize: fsT, color: C.texte, border: { type: "solid", pt: 1, color: C.ligne },
            align: ALIGN, valign: "middle", margin: 0.08, autoPage: false });
          if (d.legende) s.addText(runs(d.legende), base({ x: M, y: H - 1.1, w: wMax, h: 0.45, fontSize: 14, italic: true, color: C.doux }));
          break;
        case "etapes":
          titre(s, d.titre);
          var n = d.etapes.length, gap = 0.25, we = (wMax - gap * (n - 1)) / n;
          var fsE = n > 4 ? 13 : 16;
          d.etapes.forEach(function (e, k) {
            var x = X(M + k * (we + gap), we);
            s.addShape(pptx.ShapeType.roundRect, { x: x, y: y0 + 0.3, w: we, h: hMax - 0.4, fill: { color: C.surface }, line: { color: PRISME[k % 5], width: 2 }, rectRadius: 0.12 });
            s.addShape(pptx.ShapeType.ellipse, { x: x + we / 2 - 0.3, y: y0, w: 0.6, h: 0.6, fill: { color: PRISME[k % 5] }, line: { color: C.fond, width: 2 } });
            s.addText(String(k + 1), { x: x + we / 2 - 0.3, y: y0, w: 0.6, h: 0.6, fontFace: F_TITRE, fontSize: 18, bold: true, color: "121216", align: "center", valign: "middle", margin: 0 });
            s.addText(runs(e.titre), base({ x: x + 0.15, y: y0 + 0.8, w: we - 0.3, h: 0.9, fontSize: fsE + 2, bold: true, align: "center", valign: "middle" }));
            if (e.texte) s.addText(runs(e.texte), base({ x: x + 0.15, y: y0 + 1.7, w: we - 0.3, h: hMax - 2.0, fontSize: fsE, color: C.doux, align: "center" }));
          });
          break;
        case "question":
          var fsQ = taille([d.question], 28, 18, 140);
          var dessinerQuestion = function (sl) {
            titre(sl, d.titre || T.question);
            sl.addText(runs(d.question), base({ x: M, y: y0, w: wMax, h: 1.4, fontSize: fsQ, bold: true, valign: "middle" }));
            if (d.choix) {
              var contenu = [];
              d.choix.forEach(function (c, k) { contenu = contenu.concat([{ text: LETTRES[k] + ".  ", options: { bold: true, color: C.accent } }].concat(paragraphe(c))); });
              sl.addText(contenu, base({ x: M + 0.3, y: y0 + 1.5, w: wMax - 0.3, h: 2.3, fontSize: 20 }));
            }
          };
          dessinerQuestion(s);
          notes(s, d, T.reponse + " : " + brut(d.reponse));
          // La réponse sur la diapositive suivante : un clic la dévoile, comme en classe.
          s = pptx.addSlide();
          cadre(s, i);
          dessinerQuestion(s);
          var yr = d.choix ? y0 + 3.9 : y0 + 1.6;
          s.addShape(pptx.ShapeType.roundRect, { x: M, y: yr, w: wMax, h: H - yr - 0.7, fill: { color: C.surface }, line: { color: C.accent, width: 2 }, rectRadius: 0.1 });
          s.addText([{ text: T.reponse + " · ", options: { bold: true, color: C.accent } }].concat(runs(d.reponse, { bold: true }))
            .concat(d.explication ? [{ text: "", options: { breakLine: true } }].concat(runs(d.explication, { color: C.doux, fontSize: 16 })) : []),
            base({ x: M + 0.25, y: yr + 0.15, w: wMax - 0.5, h: H - yr - 1.0, fontSize: 20, valign: "middle" }));
          break;
        case "activite":
          titre(s, d.titre);
          s.addShape(pptx.ShapeType.roundRect, { x: X(W - M - 2.6, 2.6), y: y0, w: 2.6, h: 1.4, fill: { color: C.surface }, line: { color: C.accent2, width: 2 }, rectRadius: 0.15 });
          s.addText(tpl(T.minutes, { n: d.duree }), { x: X(W - M - 2.6, 2.6), y: y0, w: 2.6, h: 1.4, fontFace: F_TITRE, fontSize: 36, color: C.accent2, align: "center", valign: "middle", margin: 0 });
          var contenuA = [];
          d.consignes.forEach(function (c, k) { contenuA = contenuA.concat([{ text: (k + 1) + ".  ", options: { bold: true, color: C.accent } }].concat(paragraphe(c))); });
          s.addText(contenuA, base({ x: X(M, wMax - 3), y: y0, w: wMax - 3, h: hMax - (d.materiel ? 0.8 : 0), fontSize: taille(d.consignes, 22, 14, 260) }));
          if (d.materiel) s.addText([{ text: T.materiel + " · ", options: { bold: true } }].concat(runs(d.materiel)), base({ x: M, y: H - 1.25, w: wMax, h: 0.55, fontSize: 15, color: C.doux }));
          break;
        case "chiffre":
          s.addText(runs(d.valeur), base({ x: M, y: 1.3, w: wMax, h: 2.4, fontFace: F_TITRE, fontSize: 110, color: C.accent, align: "center", valign: "middle" }));
          s.addText(runs(d.legende), base({ x: M + 1, y: 3.9, w: wMax - 2, h: 1.5, fontSize: 26, align: "center" }));
          if (d.source) s.addText(runs(d.source), base({ x: M + 1, y: 5.5, w: wMax - 2, h: 0.6, fontSize: 14, color: C.doux, align: "center" }));
          break;
        case "chronologie":
          titre(s, d.titre);
          var ne = d.evenements.length, wv = wMax / ne, yl = y0 + 1.0;
          s.addShape(pptx.ShapeType.line, { x: M, y: yl, w: wMax, h: 0, line: { color: C.ligne, width: 2 } });
          d.evenements.forEach(function (e, k) {
            var x = X(M + k * wv, wv);
            s.addShape(pptx.ShapeType.ellipse, { x: x + wv / 2 - 0.12, y: yl - 0.12, w: 0.24, h: 0.24, fill: { color: PRISME[k % 5] }, line: { color: C.fond, width: 1 } });
            s.addText(e.date, { x: x, y: y0 + 0.1, w: wv, h: 0.6, fontFace: F_TITRE, fontSize: 20, bold: true, color: PRISME[k % 5] === "FFFF00" && clair ? "8A7A00" : PRISME[k % 5], align: "center", valign: "bottom", margin: 0 });
            s.addText(runs(e.texte), base({ x: x + 0.08, y: yl + 0.35, w: wv - 0.16, h: hMax - 1.4, fontSize: ne > 5 ? 13 : 15, align: "center" }));
          });
          break;
      }
      if (d.type !== "question") notes(s, d);
    });
    return pptx.writeFile({ fileName: deck.id + (LANGUE === "fr" ? "" : "-" + LANGUE) + ".pptx" });
  }

  /* ---------- Adresse ---------- */

  function lireAdresse() {
    var m = /^#([\w-]+)(?:\/(\d+))?$/.exec(location.hash);
    if (!m || !deckParId(m[1])) {
      if (vue.projection) quitterProjection();
      if (vue.deck || !racine.querySelector(".galerie")) afficherGalerie();
      return;
    }
    var index = m[2] ? parseInt(m[2], 10) - 1 : 0;
    if (vue.deck && vue.deck.id === m[1]) { if (index !== vue.index) aller(index, null, false); return; }
    ouvrirDeck(m[1], index, false);
  }
  window.addEventListener("hashchange", lireAdresse);
  lireAdresse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    Array.prototype.forEach.call(document.querySelectorAll(".diapo"), ajuster);
  });
})();
