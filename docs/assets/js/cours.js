/* ==========================================================================
   Démonstrations interactives du cours « Intelligence artificielle »
   - sentiment        : lecteur de sentiments à lexique (héros)
   - chainage-avant   : moteur d'inférence du TD du chapitre 3
   - descente-gradient: J(w) = (w − 3)²
   - kmeans           : k-moyennes sur un petit corpus fictif
   ========================================================================== */
(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";

  function el(nom, attrs, enfants) {
    var n = document.createElement(nom);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "texte") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(e); });
    return n;
  }
  function svg(nom, attrs) {
    var n = document.createElementNS(SVG, nom);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function nombre(x, d) { return x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function enTete(conteneur, titre) {
    conteneur.appendChild(el("div", { "class": "demo__tete" }, [
      el("span", { "class": "anneau-prisme", "aria-hidden": "true" }),
      el("p", { "class": "demo__etiquette", texte: "Démonstration interactive" })
    ]));
    conteneur.appendChild(el("h4", { "class": "demo__titre", texte: titre }));
  }

  /* ======================================================================
     1. Lecteur de sentiments (inspiré de VADER, Hutto & Gilbert, 2014)
     ====================================================================== */
  var LEXIQUE = {
    "beau": 2, "belle": 2, "magnifique": 3, "merveilleux": 3, "merveilleuse": 3, "excellent": 3, "excellente": 3,
    "bon": 1.5, "bonne": 1.5, "bien": 1.5, "heureux": 2.5, "heureuse": 2.5, "joie": 2.5, "joyeux": 2.5, "joyeuse": 2.5,
    "aime": 2, "aimer": 2, "adore": 3, "adorer": 3, "amour": 2.5, "espoir": 2, "lumineux": 2, "lumineuse": 2,
    "réussi": 2, "réussie": 2, "réussite": 2, "brillant": 2.5, "brillante": 2.5, "touchant": 2, "touchante": 2,
    "émouvant": 2, "émouvante": 2, "captivant": 2.5, "captivante": 2.5, "passionnant": 2.5, "passionnante": 2.5,
    "intéressant": 1.5, "intéressante": 1.5, "génial": 3, "géniale": 3, "superbe": 3, "parfait": 2.5, "parfaite": 2.5,
    "plaisir": 2, "sourire": 1.5, "rire": 1.5, "paix": 1.5, "liberté": 1.5, "fier": 1.5, "fière": 1.5,
    "convaincu": 1.5, "convaincue": 1.5, "convaincant": 2, "convaincante": 2, "doux": 1, "douce": 1, "calme": 1,
    "confiance": 1.5, "victoire": 2, "merci": 1.5, "bravo": 2.5, "chef-d'œuvre": 3, "sublime": 3, "clair": 1, "claire": 1,
    "mort": -2.5, "morte": -2.5, "mourir": -2.5, "triste": -2, "tristesse": -2.5, "malheur": -2.5, "malheureux": -2.5,
    "malheureuse": -2.5, "mauvais": -2, "mauvaise": -2, "mal": -1.5, "horrible": -3, "terrible": -2.5, "affreux": -3,
    "affreuse": -3, "décevant": -2, "décevante": -2, "déçu": -2, "déçue": -2, "déception": -2, "ennui": -1.5,
    "ennuyeux": -2, "ennuyeuse": -2, "haine": -3, "déteste": -2.5, "détester": -2.5, "peur": -2, "colère": -2,
    "crise": -2, "guerre": -2.5, "violence": -2.5, "échec": -2, "raté": -2, "ratée": -2, "faible": -1, "pire": -2.5,
    "douleur": -2, "souffrance": -2.5, "injuste": -2, "injustice": -2.5, "inquiet": -1.5, "inquiète": -1.5,
    "inquiétude": -1.5, "danger": -2, "dangereux": -2, "corruption": -2.5, "mensonge": -2, "confus": -1.5,
    "confuse": -1.5, "absurde": -1, "solitude": -1.5, "larmes": -2, "pleurer": -2, "pleure": -2, "lourd": -1, "lourde": -1
  };
  var NEGATIONS = { "pas": 1, "jamais": 1, "rien": 1, "aucun": 1, "aucune": 1, "ni": 1, "sans": 1, "guère": 1, "point": 1 };
  var AMPLIFICATEURS = { "très": 0.293, "trop": 0.293, "vraiment": 0.293, "tellement": 0.293, "extrêmement": 0.293,
    "absolument": 0.293, "profondément": 0.293, "si": 0.293, "totalement": 0.293, "plutôt": -0.293, "peu": -0.293, "assez": -0.15 };

  function chercher(mot) {
    if (LEXIQUE.hasOwnProperty(mot)) return LEXIQUE[mot];
    var essais = [mot.replace(/s$/, ""), mot.replace(/x$/, ""), mot.replace(/es$/, "e"), mot.replace(/es$/, "")];
    for (var i = 0; i < essais.length; i++) if (essais[i] !== mot && LEXIQUE.hasOwnProperty(essais[i])) return LEXIQUE[essais[i]];
    return null;
  }

  function analyser(phrase) {
    var jetons = [];
    var re = /[\p{L}\p{M}]+(?:-[\p{L}\p{M}']+)*'?|[!?.,;:]/gu;
    var m;
    while ((m = re.exec(phrase)) !== null) {
      var brut = m[0];
      // Élisions : l', d', n', j', qu', s', c', m', t'
      var elision = /^(qu|[ldnjsmtc])'(.+)$/i.exec(brut);
      if (elision) {
        jetons.push({ brut: elision[1] + "'", mot: elision[1].toLowerCase() + "'" });
        jetons.push({ brut: elision[2], mot: elision[2].toLowerCase() });
      } else {
        jetons.push({ brut: brut, mot: brut.toLowerCase().replace(/'$/, "") });
      }
    }
    var indexMais = -1;
    jetons.forEach(function (j, i) { if (j.mot === "mais") indexMais = i; });
    var somme = 0;
    jetons.forEach(function (j, i) {
      var v = chercher(j.mot);
      if (v === null) return;
      var valeur = v;
      var avant = jetons.slice(Math.max(0, i - 3), i).map(function (x) { return x.mot; });
      var amp = avant.slice(-2).reduce(function (acc, w) { return acc + (AMPLIFICATEURS[w] || 0); }, 0);
      if (amp) { valeur += valeur > 0 ? amp : -amp; j.amplifie = true; }
      if (avant.some(function (w) { return NEGATIONS[w]; })) { valeur *= -0.74; j.inverse = true; }
      if (indexMais >= 0) valeur *= i < indexMais ? 0.5 : 1.5;
      j.valeur = valeur;
      somme += valeur;
    });
    var exclam = Math.min(4, (phrase.match(/!/g) || []).length);
    if (somme !== 0) somme += (somme > 0 ? 1 : -1) * exclam * 0.292;
    var compose = somme / Math.sqrt(somme * somme + 15);
    return { jetons: jetons, somme: somme, compose: compose, mais: indexMais };
  }

  function initSentiment(racine) {
    var zone = racine.querySelector("textarea");
    var curseur = racine.querySelector(".lecteur__curseur");
    var etiquette = racine.querySelector(".lecteur__etiquette");
    var score = racine.querySelector(".lecteur__score");
    var mots = racine.querySelector(".lecteur__mots");
    if (!zone) return;
    function rendre() {
      var r = analyser(zone.value);
      var c = r.compose;
      curseur.style.left = ((c + 1) / 2 * 100) + "%";
      etiquette.textContent = c >= 0.05 ? "Positif" : c <= -0.05 ? "Négatif" : "Neutre";
      score.textContent = "score composé " + (c >= 0 ? "+" : "−") + nombre(Math.abs(c), 2);
      mots.textContent = "";
      r.jetons.forEach(function (j, i) {
        var classe = "mot";
        if (typeof j.valeur === "number") classe += j.valeur > 0 ? " mot--pos" : " mot--neg";
        if (NEGATIONS[j.mot] || AMPLIFICATEURS.hasOwnProperty(j.mot) || j.mot === "mais") classe += " mot--mod";
        var s = el("span", { "class": classe, texte: j.brut });
        if (typeof j.valeur === "number") s.appendChild(el("sup", { texte: (j.valeur > 0 ? "+" : "−") + nombre(Math.abs(j.valeur), 1) }));
        mots.appendChild(s);
        if (i < r.jetons.length - 1 && !/^[,.;:!?]$/.test(r.jetons[i + 1].brut) && !/'$/.test(j.brut)) mots.appendChild(document.createTextNode(" "));
      });
    }
    zone.addEventListener("input", rendre);
    racine.querySelectorAll("[data-phrase]").forEach(function (b) {
      b.addEventListener("click", function () { zone.value = b.getAttribute("data-phrase"); rendre(); });
    });
    rendre();
  }

  /* ======================================================================
     2. Chaînage avant — exercice du TD, chapitre 3
     ====================================================================== */
  var REGLES = {
    R1: { si: ["A"], alors: ["E"] },
    R2: { si: ["B"], alors: ["D"] },
    R3: { si: ["H"], alors: ["A", "F"] },
    R4: { si: ["E", "G"], alors: ["C"] },
    R5: { si: ["E", "K"], alors: ["B"] },
    R6: { si: ["D", "E", "K"], alors: ["C"] },
    R7: { si: ["G", "K", "F"], alors: ["A"] }
  };
  var ORDRE = ["R3", "R7", "R1", "R4", "R5", "R2", "R6"];
  var FAITS = ["A", "B", "C", "D", "E", "F", "G", "H", "K"];
  var NON_DEDUCTIBLES = ["H", "G", "K"];
  var BUT = "C";

  function initChainage(racine) {
    racine.textContent = "";
    enTete(racine, "Dérouler le chaînage avant, règle par règle");
    racine.appendChild(el("p", { html: "Ordre d'examen : <strong>R3 R7 R1 R4 R5 R2 R6</strong>. But : <strong>C</strong>. Cochez les faits non déductibles présents au départ, puis avancez pas à pas." }));

    var options = el("fieldset", { "class": "options-faits" }, [el("legend", { texte: "Base de faits initiale" })]);
    var cases = {};
    NON_DEDUCTIBLES.forEach(function (f) {
      var id = "demo-fait-" + f;
      var c = el("input", { type: "checkbox", id: id });
      c.checked = f === "H" || f === "K";
      cases[f] = c;
      options.appendChild(el("label", { "for": id }, [c, document.createTextNode(f)]));
    });
    racine.appendChild(options);

    var listeFaits = el("ul", { "class": "faits", "aria-label": "Faits" });
    var puces = {};
    FAITS.forEach(function (f) {
      var li = el("li", { "class": "fait" + (f === BUT ? " est-but" : ""), texte: f, title: f === BUT ? "But" : "" });
      puces[f] = li;
      listeFaits.appendChild(li);
    });
    racine.appendChild(listeFaits);

    var listeRegles = el("ol", { "class": "regles" });
    var lignes = {};
    ORDRE.forEach(function (nom) {
      var r = REGLES[nom];
      var etat = el("span", { "class": "regle__etat", texte: "en attente" });
      var li = el("li", { "class": "regle" }, [
        el("span", { "class": "regle__nom", texte: nom }),
        el("span", { texte: r.si.join(" ∧ ") + " → " + r.alors.join(" ∧ ") }),
        etat
      ]);
      lignes[nom] = { li: li, etat: etat };
      listeRegles.appendChild(li);
    });
    racine.appendChild(listeRegles);

    var journal = el("p", { "class": "journal", "aria-live": "polite" });
    var bSuivant = el("button", { type: "button", "class": "bouton bouton--prisme", texte: "Examiner la règle suivante" });
    var bTout = el("button", { type: "button", "class": "bouton", texte: "Dérouler jusqu'au bout" });
    var bZero = el("button", { type: "button", "class": "bouton bouton--discret", texte: "Recommencer" });
    racine.appendChild(el("div", { "class": "demo__commandes" }, [bSuivant, bTout, bZero]));
    racine.appendChild(journal);
    var trace = el("p", { "class": "demo__note" });
    racine.appendChild(trace);

    var etat;
    function reinitialiser() {
      var base = {};
      NON_DEDUCTIBLES.forEach(function (f) { if (cases[f].checked) base[f] = true; });
      etat = { base: base, nouveaux: {}, declenchees: {}, pointeur: 0, cycle: 1, aDeclenche: false, fini: false, sequence: [] };
      ORDRE.forEach(function (n) { lignes[n].li.className = "regle"; lignes[n].etat.textContent = "en attente"; });
      journal.textContent = "Base initiale : " + (Object.keys(base).join(", ") || "vide") + ". Cliquez sur « Examiner la règle suivante ».";
      trace.textContent = "";
      dessiner();
    }
    function dessiner() {
      FAITS.forEach(function (f) {
        puces[f].className = "fait" + (f === BUT ? " est-but" : "") + (etat.base[f] ? (etat.nouveaux[f] ? " est-nouveau" : " est-connu") : "");
      });
      bSuivant.disabled = bTout.disabled = etat.fini;
      trace.textContent = etat.sequence.length ? "Règles déclenchées : " + etat.sequence.join(" → ") + "." : "";
    }
    function pas() {
      if (etat.fini) return;
      ORDRE.forEach(function (n) { lignes[n].li.classList.remove("est-examinee"); });
      etat.nouveaux = {};
      var nom = ORDRE[etat.pointeur];
      var r = REGLES[nom];
      var ligne = lignes[nom];
      ligne.li.classList.add("est-examinee");
      var prefixe = "Cycle " + etat.cycle + " · " + nom + " : ";
      if (etat.declenchees[nom]) {
        journal.textContent = prefixe + "déjà " + (etat.sequence.indexOf(nom) >= 0 ? "déclenchée" : "écartée") + ", on passe.";
      } else {
        var manquants = r.si.filter(function (f) { return !etat.base[f]; });
        var ajoutsPossibles = r.alors.filter(function (f) { return !etat.base[f]; });
        if (manquants.length === 0 && ajoutsPossibles.length === 0) {
          etat.declenchees[nom] = true;
          ligne.li.classList.add("est-bloquee");
          ligne.etat.textContent = "inutile";
          journal.textContent = prefixe + "conditions vraies, mais " + r.alors.join(", ") + (r.alors.length > 1 ? " sont" : " est") + " déjà dans la base : la règle n'apporte rien, on ne la déclenche pas.";
        } else if (manquants.length === 0) {
          etat.declenchees[nom] = true;
          etat.aDeclenche = true;
          etat.sequence.push(nom);
          var ajouts = r.alors.filter(function (f) { return !etat.base[f]; });
          ajouts.forEach(function (f) { etat.base[f] = true; etat.nouveaux[f] = true; });
          ligne.li.classList.remove("est-bloquee");
          ligne.li.classList.add("est-declenchee");
          ligne.etat.textContent = "déclenchée";
          journal.textContent = prefixe + r.si.join(", ") + (r.si.length > 1 ? " sont" : " est") + " dans la base → on ajoute " + (ajouts.join(", ") || "rien de nouveau") + ".";
          if (etat.base[BUT]) {
            etat.fini = true;
            journal.textContent += " Le but C est atteint : on s'arrête.";
            dessiner();
            return;
          }
        } else {
          ligne.li.classList.add("est-bloquee");
          ligne.etat.textContent = "bloquée";
          var nd = manquants.filter(function (f) { return NON_DEDUCTIBLES.indexOf(f) >= 0; });
          journal.textContent = prefixe + "il manque " + manquants.join(", ") + (nd.length ? " (" + nd.join(", ") + " non déductible" + (nd.length > 1 ? "s" : "") + ")" : "") + ".";
        }
      }
      etat.pointeur += 1;
      if (etat.pointeur >= ORDRE.length) {
        if (!etat.aDeclenche) {
          etat.fini = true;
          journal.textContent += " Un cycle complet sans déclenchement : le but C n'est pas démontrable avec cette base.";
        } else {
          etat.pointeur = 0;
          etat.cycle += 1;
          etat.aDeclenche = false;
        }
      }
      dessiner();
    }
    bSuivant.addEventListener("click", pas);
    bTout.addEventListener("click", function () { var garde = 0; while (!etat.fini && garde++ < 100) pas(); });
    bZero.addEventListener("click", reinitialiser);
    NON_DEDUCTIBLES.forEach(function (f) { cases[f].addEventListener("change", reinitialiser); });
    reinitialiser();
  }

  /* ======================================================================
     3. Descente de gradient sur J(w) = (w − 3)²
     ====================================================================== */
  function initGradient(racine) {
    racine.textContent = "";
    enTete(racine, "Descendre la pente de J(w) = (w − 3)²");
    var L = 560, H = 290, g = 44, d = 16, h = 30, b = 36;
    var wMin = -5, wMax = 11, jMax = 70;
    function X(w) { return g + (w - wMin) / (wMax - wMin) * (L - g - d); }
    function Y(j) { return H - b - Math.min(j, jMax) / jMax * (H - b - h); }

    var eta = el("input", { type: "range", id: "demo-gd-eta", min: "0.01", max: "1.05", step: "0.01", value: "0.1" });
    var w0 = el("input", { type: "range", id: "demo-gd-w0", min: "-4", max: "10", step: "0.5", value: "0" });
    var sEta = el("output", { "for": "demo-gd-eta" });
    var sW0 = el("output", { "for": "demo-gd-w0" });
    racine.appendChild(el("div", { "class": "reglages" }, [
      el("div", { "class": "champ" }, [el("label", { "for": "demo-gd-eta", html: "Taux d'apprentissage <span style=\"text-transform:none\">η</span>" }), eta, sEta]),
      el("div", { "class": "champ" }, [el("label", { "for": "demo-gd-w0", texte: "Point de départ w₀" }), w0, sW0])
    ]));

    var graphe = svg("svg", { viewBox: "0 0 " + L + " " + H, "class": "graphe-demo", role: "img", "aria-label": "Courbe de la fonction de coût et trajectoire de la descente" });
    for (var j = 0; j <= jMax; j += 10) {
      graphe.appendChild(svg("line", { x1: g, x2: L - d, y1: Y(j), y2: Y(j), "class": "grille" }));
      var t = svg("text", { x: g - 8, y: Y(j) + 4, "text-anchor": "end" }); t.textContent = j; graphe.appendChild(t);
    }
    for (var w = -4; w <= 10; w += 2) {
      var tx = svg("text", { x: X(w), y: H - b + 20, "text-anchor": "middle" }); tx.textContent = w; graphe.appendChild(tx);
    }
    graphe.appendChild(svg("line", { x1: g, x2: L - d, y1: Y(0), y2: Y(0), "class": "axe" }));
    var lx = svg("text", { x: L - d, y: H - 4, "text-anchor": "end" }); lx.textContent = "w"; graphe.appendChild(lx);
    var ly = svg("text", { x: g - 8, y: 16, "text-anchor": "start" }); ly.textContent = "J(w)"; graphe.appendChild(ly);
    var pts = [];
    for (var k = 0; k <= 160; k++) {
      var wk = wMin + k / 160 * (wMax - wMin);
      var jk = (wk - 3) * (wk - 3);
      if (jk <= jMax) pts.push(X(wk).toFixed(1) + "," + Y(jk).toFixed(1));
    }
    graphe.appendChild(svg("polyline", { points: pts.join(" "), "class": "courbe" }));
    var trajet = svg("polyline", { points: "", "class": "trace" });
    graphe.appendChild(trajet);
    var nuage = svg("g", {});
    graphe.appendChild(nuage);
    var courant = svg("circle", { r: 8, "class": "point-courant" });
    graphe.appendChild(courant);
    racine.appendChild(graphe);

    var mIter = el("strong"), mW = el("strong"), mJ = el("strong"), mPente = el("strong");
    racine.appendChild(el("ul", { "class": "mesures" }, [
      el("li", {}, [document.createTextNode("itération "), mIter]),
      el("li", {}, [document.createTextNode("w = "), mW]),
      el("li", {}, [document.createTextNode("J(w) = "), mJ]),
      el("li", {}, [document.createTextNode("pente 2(w − 3) = "), mPente])
    ]));
    var b1 = el("button", { type: "button", "class": "bouton bouton--prisme", texte: "Un pas" });
    var b10 = el("button", { type: "button", "class": "bouton", texte: "Dix pas" });
    var b0 = el("button", { type: "button", "class": "bouton bouton--discret", texte: "Recommencer" });
    racine.appendChild(el("div", { "class": "demo__commandes" }, [b1, b10, b0]));
    var note = el("p", { "class": "demo__note", "aria-live": "polite" });
    racine.appendChild(note);

    var historique;
    function valeurs() { return { eta: parseFloat(eta.value), w0: parseFloat(w0.value) }; }
    function reinit() {
      var v = valeurs();
      sEta.textContent = "η = " + nombre(v.eta, 2);
      sW0.textContent = "w₀ = " + nombre(v.w0, 1);
      historique = [v.w0];
      dessiner();
    }
    function pas(n) {
      var e = valeurs().eta;
      for (var i = 0; i < n; i++) {
        var w = historique[historique.length - 1];
        if (Math.abs(w) > 1e6) break;
        historique.push(w - e * 2 * (w - 3));
      }
      dessiner();
    }
    function dessiner() {
      var w = historique[historique.length - 1];
      var jw = (w - 3) * (w - 3);
      var visibles = historique.filter(function (x) { return x >= wMin && x <= wMax && (x - 3) * (x - 3) <= jMax; });
      trajet.setAttribute("points", visibles.map(function (x) { return X(x).toFixed(1) + "," + Y((x - 3) * (x - 3)).toFixed(1); }).join(" "));
      nuage.textContent = "";
      visibles.slice(0, -1).forEach(function (x) { nuage.appendChild(svg("circle", { cx: X(x), cy: Y((x - 3) * (x - 3)), r: 4, "class": "point" })); });
      var dedans = w >= wMin && w <= wMax && jw <= jMax;
      courant.setAttribute("cx", X(Math.max(wMin, Math.min(wMax, w))));
      courant.setAttribute("cy", Y(jw));
      courant.style.display = dedans ? "" : "none";
      mIter.textContent = historique.length - 1;
      mW.textContent = Math.abs(w) > 1e5 ? w.toExponential(2) : nombre(w, 4);
      mJ.textContent = jw > 1e5 ? jw.toExponential(2) : nombre(jw, 4);
      mPente.textContent = Math.abs(w) > 1e5 ? (2 * (w - 3)).toExponential(2) : nombre(2 * (w - 3), 4);
      var e = valeurs().eta;
      if (e > 1) note.textContent = "Avec η > 1, chaque pas dépasse le minimum de plus en plus loin : la descente diverge.";
      else if (e === 1) note.textContent = "Avec η = 1, w oscille indéfiniment entre deux valeurs symétriques autour de 3.";
      else if (e > 0.5) note.textContent = "Avec 0,5 < η < 1, w saute d'un côté à l'autre du minimum mais s'en rapproche : on converge en zigzag.";
      else if (e < 0.05) note.textContent = "Avec un η très petit, la descente est sûre mais lente : il faut beaucoup d'itérations.";
      else note.textContent = "Chaque pas applique w ← w − η · 2(w − 3). Le minimum est en w = 3, où la pente est nulle.";
      b1.disabled = b10.disabled = Math.abs(w) > 1e6;
    }
    eta.addEventListener("input", reinit);
    w0.addEventListener("input", reinit);
    b1.addEventListener("click", function () { pas(1); });
    b10.addEventListener("click", function () { pas(10); });
    b0.addEventListener("click", reinit);
    reinit();
  }

  /* ======================================================================
     4. k-moyennes sur un corpus fictif
     ====================================================================== */
  function alea(graine) {
    var s = graine >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function initKmeans(racine) {
    racine.textContent = "";
    enTete(racine, "Regrouper 36 textes selon deux traits de style");
    racine.appendChild(el("p", { html: "Chaque point est un texte (données fictives) : en abscisse la <strong>longueur moyenne des phrases</strong> (en mots), en ordonnée la <strong>part de dialogue</strong> (en %). L'algorithme ne connaît aucune étiquette." }));
    var r = alea(7);
    var centres = [[12, 44], [29, 9], [19, 24]];
    var donnees = [];
    centres.forEach(function (c) {
      for (var i = 0; i < 12; i++) donnees.push([Math.max(6, c[0] + gauss(r) * 2.6), Math.max(1, Math.min(60, c[1] + gauss(r) * 5.5))]);
    });
    var L = 560, H = 330, g = 48, d = 16, h = 30, b = 40, xMin = 5, xMax = 36, yMin = 0, yMax = 60;
    function X(x) { return g + (x - xMin) / (xMax - xMin) * (L - g - d); }
    function Y(y) { return H - b - (y - yMin) / (yMax - yMin) * (H - b - h); }

    var k = el("input", { type: "range", id: "demo-km-k", min: "2", max: "4", step: "1", value: "3" });
    var sK = el("output", { "for": "demo-km-k" });
    racine.appendChild(el("div", { "class": "reglages" }, [
      el("div", { "class": "champ" }, [el("label", { "for": "demo-km-k", texte: "Nombre de groupes k" }), k, sK])
    ]));

    var graphe = svg("svg", { viewBox: "0 0 " + L + " " + H, "class": "graphe-demo", role: "img", "aria-label": "Nuage de points et centres des groupes" });
    for (var y = 0; y <= 60; y += 10) {
      graphe.appendChild(svg("line", { x1: g, x2: L - d, y1: Y(y), y2: Y(y), "class": "grille" }));
      var t = svg("text", { x: g - 8, y: Y(y) + 4, "text-anchor": "end" }); t.textContent = y; graphe.appendChild(t);
    }
    for (var x = 5; x <= 35; x += 5) {
      var tx = svg("text", { x: X(x), y: H - b + 20, "text-anchor": "middle" }); tx.textContent = x; graphe.appendChild(tx);
    }
    var lx = svg("text", { x: L - d, y: H - 4, "text-anchor": "end" }); lx.textContent = "mots par phrase"; graphe.appendChild(lx);
    var ly = svg("text", { x: g - 8, y: 16 }); ly.textContent = "% de dialogue"; graphe.appendChild(ly);
    var calqueLiens = svg("g", {}), calquePoints = svg("g", {}), calqueCentres = svg("g", {});
    graphe.appendChild(calqueLiens); graphe.appendChild(calquePoints); graphe.appendChild(calqueCentres);
    racine.appendChild(graphe);

    var mEtape = el("strong"), mInertie = el("strong"), mPhase = el("span");
    racine.appendChild(el("ul", { "class": "mesures" }, [
      el("li", {}, [document.createTextNode("itération "), mEtape]),
      el("li", {}, [document.createTextNode("inertie intra-groupes "), mInertie]),
      el("li", {}, [mPhase])
    ]));
    var bPas = el("button", { type: "button", "class": "bouton bouton--prisme", texte: "Étape suivante" });
    var bFin = el("button", { type: "button", "class": "bouton", texte: "Aller jusqu'à la convergence" });
    var bInit = el("button", { type: "button", "class": "bouton bouton--discret", texte: "Nouveaux centres de départ" });
    racine.appendChild(el("div", { "class": "demo__commandes" }, [bPas, bFin, bInit]));
    var note = el("p", { "class": "demo__note", "aria-live": "polite" });
    racine.appendChild(note);

    var formes = [
      function (cx, cy, s) { return svg("circle", { cx: cx, cy: cy, r: s }); },
      function (cx, cy, s) { return svg("rect", { x: cx - s, y: cy - s, width: 2 * s, height: 2 * s }); },
      function (cx, cy, s) { return svg("polygon", { points: [cx, cy - s * 1.25, cx + s * 1.15, cy + s * .85, cx - s * 1.15, cy + s * .85].join(" ") }); },
      function (cx, cy, s) { return svg("polygon", { points: [cx, cy - s * 1.3, cx + s * 1.3, cy, cx, cy + s * 1.3, cx - s * 1.3, cy].join(" ") }); }
    ];
    var graine = 3, etat;
    function dist2(p, c) { var dx = p[0] - c[0], dy = p[1] - c[1]; return dx * dx + dy * dy; }
    function initialiser() {
      var n = parseInt(k.value, 10);
      sK.textContent = "k = " + n;
      var rr = alea(graine);
      var choisis = [];
      while (choisis.length < n) { var i = Math.floor(rr() * donnees.length); if (choisis.indexOf(i) < 0) choisis.push(i); }
      etat = { k: n, centres: choisis.map(function (i) { return donnees[i].slice(); }), groupes: donnees.map(function () { return -1; }), iteration: 0, phase: "affecter", fini: false };
      note.textContent = "Départ : " + n + " centres tirés au hasard parmi les textes. Étape suivante : affecter chaque texte au centre le plus proche.";
      dessiner();
    }
    function inertie() {
      if (etat.groupes[0] < 0) return null;
      return donnees.reduce(function (s, p, i) { return s + dist2(p, etat.centres[etat.groupes[i]]); }, 0);
    }
    function pas() {
      if (etat.fini) return;
      if (etat.phase === "affecter") {
        var change = false;
        donnees.forEach(function (p, i) {
          var meilleur = 0;
          etat.centres.forEach(function (c, j) { if (dist2(p, c) < dist2(p, etat.centres[meilleur])) meilleur = j; });
          if (etat.groupes[i] !== meilleur) { etat.groupes[i] = meilleur; change = true; }
        });
        etat.iteration += 1;
        if (!change && etat.iteration > 1) {
          etat.fini = true;
          note.textContent = "Aucun texte n'a changé de groupe : l'algorithme a convergé.";
        } else {
          etat.phase = "recalculer";
          note.textContent = "Affectation : chaque texte rejoint le centre le plus proche (distance euclidienne). Étape suivante : recalculer les centres.";
        }
      } else {
        etat.centres = etat.centres.map(function (c, j) {
          var membres = donnees.filter(function (_, i) { return etat.groupes[i] === j; });
          if (!membres.length) return c;
          return [membres.reduce(function (s, p) { return s + p[0]; }, 0) / membres.length, membres.reduce(function (s, p) { return s + p[1]; }, 0) / membres.length];
        });
        etat.phase = "affecter";
        note.textContent = "Mise à jour : chaque centre se place à la moyenne des textes de son groupe. Étape suivante : réaffecter.";
      }
      dessiner();
    }
    function dessiner() {
      calqueLiens.textContent = ""; calquePoints.textContent = ""; calqueCentres.textContent = "";
      donnees.forEach(function (p, i) {
        var gr = etat.groupes[i];
        if (gr >= 0) {
          var c = etat.centres[gr];
          calqueLiens.appendChild(svg("line", { x1: X(p[0]), y1: Y(p[1]), x2: X(c[0]), y2: Y(c[1]), "class": "lien-centroide", stroke: "currentColor", style: "color: var(--texte-doux)" }));
        }
        var forme = (gr >= 0 ? formes[gr] : formes[0])(X(p[0]), Y(p[1]), 5.5);
        forme.setAttribute("class", gr >= 0 ? "groupe-" + gr : "sans-groupe");
        calquePoints.appendChild(forme);
      });
      etat.centres.forEach(function (c, j) {
        var f = formes[j](X(c[0]), Y(c[1]), 11);
        f.setAttribute("class", "centroide groupe-" + j);
        calqueCentres.appendChild(f);
      });
      var in_ = inertie();
      mEtape.textContent = etat.iteration;
      mInertie.textContent = in_ === null ? "—" : nombre(in_, 0);
      mPhase.textContent = etat.fini ? "convergé" : "prochaine phase : " + (etat.phase === "affecter" ? "affecter" : "recalculer les centres");
      bPas.disabled = bFin.disabled = etat.fini;
    }
    bPas.addEventListener("click", pas);
    bFin.addEventListener("click", function () { var garde = 0; while (!etat.fini && garde++ < 200) pas(); });
    bInit.addEventListener("click", function () { graine += 1; initialiser(); });
    k.addEventListener("input", initialiser);
    initialiser();
  }

  function init() {
    document.querySelectorAll("[data-lecteur]").forEach(initSentiment);
    document.querySelectorAll(".demo[data-demo]").forEach(function (d) {
      var nom = d.getAttribute("data-demo");
      if (nom === "chainage-avant") initChainage(d);
      else if (nom === "descente-gradient") initGradient(d);
      else if (nom === "kmeans") initKmeans(d);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
