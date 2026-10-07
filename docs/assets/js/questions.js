/* ==========================================================================
   « Questions » : une messagerie entre les étudiants et l'enseignant.
   - questions.html (étudiant) : nom complet et groupe, puis une conversation avec l'enseignant :
     texte, message vocal, photo ou fichier (avec légende), réponse à un message précis ;
   - messages.html (enseignant) : toutes les conversations, par groupe, avec les non-lus ; il répond
     de la même façon. Le code de l'enseignant est demandé une fois par onglet.
   Les messages sont dans Supabase (supabase/questions.sql), lus et écrits par les fonctions qr_*.
   La page interroge la base toutes les quelques secondes : les nouveaux messages arrivent seuls.
   ========================================================================== */
(function () {
  "use strict";

  var racine = document.getElementById("outil-questions") || document.getElementById("outil-messages");
  if (!racine) return;

  var PROF = racine.id === "outil-messages";
  var LANGUE = racine.getAttribute("data-langue") || "fr";
  var LOCALE = { fr: "fr-DZ", en: "en-GB", ar: "ar-DZ" }[LANGUE] || "fr";
  var CONF = window.LX_QUESTIONS || {};
  var CLE_ELEVE = "lx-questions-eleve";
  var CLE_CODE = "lx-questions-code";
  var MAX_OCTETS = 5 * 1024 * 1024;
  var MAX_AUDIO = 5 * 60;   // secondes
  var IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  var GROUPES = ["M02 ANG · 1", "M02 ANG · 2", "M02 LGC", "M02 DID · 1", "M02 DID · 2", "M02 DID · 3"];

  /* ---------- Textes ---------- */

  var TEXTES = {
    fr: {
      nom: "Nom complet", nom_aide: "Prénom et nom, comme sur la liste du groupe.", groupe: "Groupe", autre: "Autre…",
      autre_groupe: "Votre groupe", premiere: "Votre question", premiere_aide: "Écrivez la question en entier : ce que vous avez essayé, où vous bloquez.",
      commencer: "Envoyer à l'enseignant", suite: "Ensuite, la conversation s'ouvre : vous pourrez envoyer des photos, des messages vocaux et des fichiers.", intro: "Écrivez à l'enseignant : il voit votre nom et votre groupe, et vous répond ici.",
      vous: "Vous", prof: "Enseignant", pas_vous: "Ce n'est pas vous ? Recommencer", confirmer_recommencer: "Quitter cette conversation sur ce navigateur ? Vous ne pourrez plus la rouvrir ici.",
      ecrire: "Écrire un message…", legende: "Ajouter une légende…", envoyer: "Envoyer", joindre: "Joindre un fichier", photo: "Envoyer une photo",
      micro: "Enregistrer un message vocal", arreter: "Arrêter", annuler: "Annuler", repondre: "Répondre", reponse_a: "Réponse à",
      vu: "Vu", envoi: "Envoi…", vide: "Pas encore de message. Posez votre question ci-dessous.",
      vide_prof: "Choisissez une conversation à gauche.", aucune_conv: "Aucune question pour l'instant.",
      telecharger: "Télécharger", image: "Photo", audio: "Message vocal", fichier: "Fichier",
      trop_lourd: "Fichier trop lourd (5 Mo au plus).", micro_refuse: "Le micro n'est pas disponible : autorisez-le dans le navigateur.",
      erreur_reseau: "Connexion impossible avec le serveur des questions. Vérifiez Internet ; nouvel essai dans quelques secondes.",
      erreur: "Le message n'a pas pu être envoyé.", non_configure: "Le service des questions n'est pas encore configuré (supabase/questions.sql).",
      perdue: "Cette conversation n'existe plus. Vous pouvez en commencer une nouvelle.",
      code: "Code de l'enseignant", code_aide: "Le même code que pour les notes et l'espace de l'enseignant.", entrer: "Ouvrir",
      code_faux: "Code incorrect (ou trop d'essais : attendez 10 minutes).", deconnexion: "Verrouiller",
      rechercher: "Rechercher un nom…", tous: "Tous les groupes", supprimer: "Supprimer la conversation",
      confirmer_supprimer: "Supprimer définitivement la conversation avec {nom} (tous ses messages et fichiers) ?",
      retour: "Conversations", non_lus: "{n} non lu(s)", enregistrement: "Enregistrement… {t}", lien_eleve: "Lien à donner aux étudiants :"
    },
    en: {
      nom: "Full name", nom_aide: "First and last name, as on the group list.", groupe: "Group", autre: "Other…",
      autre_groupe: "Your group", premiere: "Your question", premiere_aide: "Write the whole question: what you tried and where you are stuck.",
      commencer: "Send to the teacher", suite: "Then the conversation opens: you can send photos, voice messages and files.", intro: "Write to the teacher: they see your name and group, and answer you here.",
      vous: "You", prof: "Teacher", pas_vous: "Not you? Start again", confirmer_recommencer: "Leave this conversation on this browser? You won't be able to reopen it here.",
      ecrire: "Write a message…", legende: "Add a caption…", envoyer: "Send", joindre: "Attach a file", photo: "Send a photo",
      micro: "Record a voice message", arreter: "Stop", annuler: "Cancel", repondre: "Reply", reponse_a: "Reply to",
      vu: "Seen", envoi: "Sending…", vide: "No messages yet. Ask your question below.",
      vide_prof: "Pick a conversation on the left.", aucune_conv: "No questions yet.",
      telecharger: "Download", image: "Photo", audio: "Voice message", fichier: "File",
      trop_lourd: "File too large (5 MB at most).", micro_refuse: "The microphone is not available: allow it in the browser.",
      erreur_reseau: "Cannot reach the questions server. Check the Internet connection; retrying in a few seconds.",
      erreur: "The message could not be sent.", non_configure: "The questions service is not set up yet (supabase/questions.sql).",
      perdue: "This conversation no longer exists. You can start a new one.",
      code: "Teacher code", code_aide: "The same code as for the notes and the teacher area.", entrer: "Open",
      code_faux: "Wrong code (or too many tries: wait 10 minutes).", deconnexion: "Lock",
      rechercher: "Search a name…", tous: "All groups", supprimer: "Delete the conversation",
      confirmer_supprimer: "Permanently delete the conversation with {nom} (all its messages and files)?",
      retour: "Conversations", non_lus: "{n} unread", enregistrement: "Recording… {t}", lien_eleve: "Link to give the students:"
    },
    ar: {
      nom: "الاسم الكامل", nom_aide: "الاسم واللقب كما في قائمة الفوج.", groupe: "الفوج", autre: "آخر…",
      autre_groupe: "فوجك", premiere: "سؤالك", premiere_aide: "اكتب السؤال كاملًا: ما الذي جرّبته وأين توقفت.",
      commencer: "أرسل إلى الأستاذ", suite: "بعدها تُفتح المحادثة: يمكنك إرسال صور ورسائل صوتية وملفات.", intro: "راسل الأستاذ: يرى اسمك وفوجك، ويجيبك هنا.",
      vous: "أنت", prof: "الأستاذ", pas_vous: "لست أنت؟ ابدأ من جديد", confirmer_recommencer: "مغادرة هذه المحادثة على هذا المتصفح؟ لن تتمكن من فتحها هنا مرة أخرى.",
      ecrire: "اكتب رسالة…", legende: "أضف تعليقًا…", envoyer: "إرسال", joindre: "إرفاق ملف", photo: "إرسال صورة",
      micro: "تسجيل رسالة صوتية", arreter: "إيقاف", annuler: "إلغاء", repondre: "رد", reponse_a: "ردًّا على",
      vu: "شوهدت", envoi: "جارٍ الإرسال…", vide: "لا توجد رسائل بعد. اطرح سؤالك في الأسفل.",
      vide_prof: "اختر محادثة من القائمة.", aucune_conv: "لا توجد أسئلة حاليًا.",
      telecharger: "تنزيل", image: "صورة", audio: "رسالة صوتية", fichier: "ملف",
      trop_lourd: "الملف كبير جدًّا (5 ميغابايت على الأكثر).", micro_refuse: "الميكروفون غير متاح: اسمح به في المتصفح.",
      erreur_reseau: "تعذّر الاتصال بخادم الأسئلة. تحقّق من الإنترنت؛ ستُعاد المحاولة بعد ثوانٍ.",
      erreur: "تعذّر إرسال الرسالة.", non_configure: "خدمة الأسئلة غير مهيّأة بعد (supabase/questions.sql).",
      perdue: "هذه المحادثة لم تعد موجودة. يمكنك بدء محادثة جديدة.",
      code: "رمز الأستاذ", code_aide: "نفس رمز الملاحظات وفضاء الأستاذ.", entrer: "فتح",
      code_faux: "الرمز غير صحيح (أو محاولات كثيرة: انتظر 10 دقائق).", deconnexion: "قفل",
      rechercher: "ابحث عن اسم…", tous: "كل الأفواج", supprimer: "حذف المحادثة",
      confirmer_supprimer: "حذف المحادثة مع {nom} نهائيًا (كل رسائلها وملفاتها)؟",
      retour: "المحادثات", non_lus: "{n} غير مقروءة", enregistrement: "جارٍ التسجيل… {t}", lien_eleve: "الرابط الذي يُعطى للطلبة:"
    }
  };
  var T = TEXTES[LANGUE] || TEXTES.fr;
  function t(cle, valeurs) {
    return (T[cle] || cle).replace(/\{(\w+)\}/g, function (_, k) { return valeurs && k in valeurs ? valeurs[k] : ""; });
  }

  /* ---------- Petits outils ---------- */

  function el(nom, attrs, enfants) {
    var n = document.createElement(nom);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "texte") n.textContent = v;
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === "string" ? document.createTextNode(e) : e); });
    return n;
  }
  var ICONES = {
    envoyer: '<path d="M4 12 20 4l-6 16-3-7-7-1Z"/>',
    joindre: '<path d="M20 11.5 12.4 19a5 5 0 0 1-7.1-7.1l8-8a3.5 3.5 0 1 1 5 5l-8 8a2 2 0 0 1-2.9-2.9l7.3-7.2"/>',
    photo: '<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>',
    micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    arreter: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    fermer: '<path d="M6 6l12 12M18 6 6 18"/>',
    repondre: '<path d="M10 8 5 12l5 4M5 12h9a5 5 0 0 1 5 5v1"/>',
    fichier: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
    poubelle: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    retour: '<path d="M15 6l-6 6 6 6"/>'
  };
  function icone(nom) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("class", "q-icone");
    s.innerHTML = ICONES[nom] || "";
    return s;
  }
  function boutonIcone(nom, titre, action, classe) {
    var b = el("button", { type: "button", "class": "q-bouton-icone" + (classe ? " " + classe : ""), title: titre, "aria-label": titre, onclick: action });
    b.appendChild(icone(nom));
    return b;
  }
  function heure(iso) {
    var d = new Date(iso), maintenant = new Date();
    var memeJour = d.toDateString() === maintenant.toDateString();
    try {
      return memeJour ? d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
                      : d.toLocaleString(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return d.toISOString().slice(0, 16).replace("T", " "); }
  }
  function taille(o) {
    if (o < 1024) return o + " o";
    if (o < 1024 * 1024) return Math.round(o / 1024) + " Ko";
    return (o / 1024 / 1024).toFixed(1) + " Mo";
  }
  function duree(s) {
    s = Math.max(0, Math.round(s || 0));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function lire(cle, stockage) {
    try { return JSON.parse((stockage || localStorage).getItem(cle) || "null"); } catch (e) { return null; }
  }
  function ecrire(cle, valeur, stockage) {
    try {
      if (valeur === null) (stockage || localStorage).removeItem(cle);
      else (stockage || localStorage).setItem(cle, JSON.stringify(valeur));
    } catch (e) { /* stockage indisponible : la conversation durera le temps de la page */ }
  }

  /* ---------- Appels à Supabase ---------- */

  function Erreur(code, message) { this.code = code; this.message = message || code; }
  function rpc(fonction, params) {
    if (!CONF.url || !CONF.cle) return Promise.reject(new Erreur("non_configure"));
    return fetch(CONF.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fonction, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CONF.cle },
      body: JSON.stringify(params || {})
    }).then(function (r) {
      return r.text().then(function (texte) {
        var donnees = null;
        try { donnees = texte ? JSON.parse(texte) : null; } catch (e) { donnees = texte; }
        if (r.ok) return donnees;
        var msg = donnees && donnees.message || ("HTTP " + r.status);
        if (r.status === 404 && /function|schema cache/i.test(msg)) throw new Erreur("non_configure", msg);
        throw new Erreur(msg, msg);
      });
    }, function () { throw new Erreur("reseau"); });
  }

  /* ---------- Fichiers : lecture, compression des photos ---------- */

  function enBase64(blob) {
    return new Promise(function (ok, ko) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, "")); };
      r.onerror = ko;
      r.readAsDataURL(blob);
    });
  }
  function depuisBase64(b64, type) {
    var bin = atob(b64), octets = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return new Blob([octets], { type: type });
  }
  // Les photos sont réduites (1600 px, JPEG) : elles partent plus vite et tiennent sous 5 Mo.
  function preparerImage(fichier) {
    if (fichier.type === "image/gif" || IMAGES.indexOf(fichier.type) < 0) return Promise.resolve(fichier);
    return new Promise(function (ok) {
      var url = URL.createObjectURL(fichier), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        if (k === 1 && fichier.size < 1024 * 1024) { URL.revokeObjectURL(url); return ok(fichier); }
        var c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return ok(fichier);
          var nom = (fichier.name || "photo").replace(/\.\w+$/, "") + ".jpg";
          try { ok(new File([b], nom, { type: "image/jpeg" })); } catch (e) { b.name = nom; ok(b); }
        }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(fichier); };
      img.src = url;
    });
  }

  // Les fichiers des messages ne sont chargés qu'une fois, puis gardés en mémoire (adresse blob:).
  var cacheFichiers = {};
  function urlFichier(message) {
    if (cacheFichiers[message.id]) return cacheFichiers[message.id];
    var appel = PROF ? rpc("qr_prof_fichier", { p_code: etat.code, p_message: message.id })
                     : rpc("qr_eleve_fichier", { p_id: etat.eleve.id, p_jeton: etat.eleve.jeton, p_message: message.id });
    // Un fichier quelconque n'est jamais ouvert dans la page (type neutre + téléchargement) :
    // un document HTML envoyé par quelqu'un ne peut pas s'exécuter sur le site.
    var type = message.genre === "image" && IMAGES.indexOf(message.fichier_type) >= 0 ? message.fichier_type
             : message.genre === "audio" && /^audio\//.test(message.fichier_type || "") ? message.fichier_type
             : "application/octet-stream";
    cacheFichiers[message.id] = appel.then(function (b64) {
      if (!b64) throw new Erreur("fichier_absent");
      return URL.createObjectURL(depuisBase64(b64, type));
    });
    cacheFichiers[message.id].catch(function () { delete cacheFichiers[message.id]; });
    return cacheFichiers[message.id];
  }

  /* ---------- État ---------- */

  var etat = {
    eleve: PROF ? null : lire(CLE_ELEVE),
    code: PROF ? lire(CLE_CODE, sessionStorage) : null,
    conv: null,          // conversation ouverte (enseignant)
    messages: [],
    dernierId: 0,
    luAutre: "1970-01-01T00:00:00Z",
    reponseA: null,
    piece: null,         // { blob, genre, nom, type, duree }
    conversations: [],
    filtre: "", recherche: "",
    minuteur: null, minuteurListe: null
  };

  /* ---------- Bulles de messages ---------- */

  function estMoi(m) { return PROF ? m.auteur === "prof" : m.auteur === "eleve"; }

  function apercu(m) {
    if (m.texte) return m.texte;
    return t(m.genre) + (m.fichier_nom && m.genre === "fichier" ? " · " + m.fichier_nom : "");
  }

  function bulle(m) {
    var moi = estMoi(m);
    var b = el("article", { "class": "q-bulle" + (moi ? " q-bulle--moi" : ""), "data-id": m.id });
    if (m.citation) {
      b.appendChild(el("button", { type: "button", "class": "q-citation", onclick: function () { allerA(m.citation.id); } }, [
        el("strong", { texte: (PROF ? m.citation.auteur === "prof" : m.citation.auteur === "eleve") ? t("vous") : (PROF ? etat.conv && etat.conv.nom || "" : t("prof")) }),
        el("span", { texte: apercu(m.citation) })
      ]));
    }
    if (m.genre === "image") {
      var img = el("img", { "class": "q-image", alt: m.texte || m.fichier_nom || t("image"), loading: "lazy" });
      var lien = el("button", { type: "button", "class": "q-image-cadre", "aria-label": t("image") }, [img]);
      urlFichier(m).then(function (u) {
        img.src = u;
        lien.addEventListener("click", function () { agrandir(u, m.texte || ""); });
      }, function () { lien.classList.add("q-image-cadre--erreur"); });
      b.appendChild(lien);
    } else if (m.genre === "audio") {
      var audio = el("audio", { controls: true, preload: "metadata", "class": "q-audio" });
      // Chrome n'écrit pas la durée dans ses enregistrements WebM : on la fait calculer une fois.
      audio.addEventListener("loadedmetadata", function () {
        if (audio.duration !== Infinity) return;
        audio.addEventListener("timeupdate", function retour() { audio.removeEventListener("timeupdate", retour); audio.currentTime = 0; });
        audio.currentTime = 1e7;
      });
      urlFichier(m).then(function (u) { audio.src = u; }, function () {});
      b.appendChild(el("div", { "class": "q-audio-ligne" }, [audio, m.duree ? el("span", { "class": "q-discret", texte: duree(m.duree) }) : null]));
    } else if (m.genre === "fichier") {
      var bouton = el("button", { type: "button", "class": "q-fichier", onclick: function () {
        bouton.disabled = true;
        urlFichier(m).then(function (u) {
          var a = el("a", { href: u, download: m.fichier_nom || "fichier" });
          document.body.appendChild(a); a.click(); a.remove();
        }).catch(function () { alert(t("erreur_reseau")); }).then(function () { bouton.disabled = false; });
      } }, [icone("fichier"), el("span", { "class": "q-fichier__nom", texte: m.fichier_nom || t("fichier") }),
            el("span", { "class": "q-discret", texte: taille(m.fichier_taille || 0) + " · " + t("telecharger") })]);
      b.appendChild(bouton);
    }
    if (m.texte) b.appendChild(el("p", { "class": "q-texte", texte: m.texte }));
    var pied = el("footer", { "class": "q-pied" }, [el("time", { datetime: m.cree_le, texte: heure(m.cree_le) })]);
    if (moi && new Date(m.cree_le) <= new Date(etat.luAutre)) pied.appendChild(el("span", { "class": "q-vu", texte: "✓✓ " + t("vu") }));
    pied.appendChild(boutonIcone("repondre", t("repondre"), function () { choisirReponse(m); }, "q-bouton-repondre"));
    b.appendChild(pied);
    return b;
  }

  function allerA(id) {
    var cible = vue.fil && vue.fil.querySelector('[data-id="' + id + '"]');
    if (!cible) return;
    cible.scrollIntoView({ block: "center", behavior: "smooth" });
    cible.classList.add("q-bulle--eclair");
    setTimeout(function () { cible.classList.remove("q-bulle--eclair"); }, 1200);
  }

  function agrandir(url, legende) {
    var fond = el("div", { "class": "q-agrandi", role: "dialog", "aria-modal": "true", onclick: function (e) { if (e.target === fond || e.target.closest(".q-bouton-icone")) fermer(); } }, [
      el("img", { src: url, alt: legende }),
      legende ? el("p", { texte: legende }) : null,
      boutonIcone("fermer", t("annuler"), function () {}, "q-agrandi__fermer")
    ]);
    function fermer() { fond.remove(); document.removeEventListener("keydown", touche); }
    function touche(e) { if (e.key === "Escape") fermer(); }
    document.addEventListener("keydown", touche);
    document.body.appendChild(fond);
  }

  /* ---------- Fil et zone de saisie (communs aux deux pages) ---------- */

  var vue = {};

  function construireConversation(parent) {
    vue.fil = el("div", { "class": "q-fil", role: "log", "aria-live": "polite" });
    vue.citation = el("div", { "class": "q-saisie__citation", hidden: true });
    vue.piece = el("div", { "class": "q-saisie__piece", hidden: true });
    vue.texte = el("textarea", { "class": "q-saisie__texte", rows: "1", placeholder: t("ecrire"), "aria-label": t("ecrire"), maxlength: "8000" });
    vue.texte.addEventListener("input", ajusterHauteur);
    vue.texte.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && window.matchMedia("(pointer: fine)").matches) { e.preventDefault(); envoyer(); }
    });
    vue.entreeFichier = el("input", { type: "file", hidden: true, onchange: function () { choisirFichier(this.files[0], false); this.value = ""; } });
    vue.entreePhoto = el("input", { type: "file", accept: "image/*", hidden: true, onchange: function () { choisirFichier(this.files[0], true); this.value = ""; } });
    vue.enregistrement = el("div", { "class": "q-saisie__enregistrement", hidden: true });
    vue.boutonMicro = boutonIcone("micro", t("micro"), basculerEnregistrement);
    vue.boutonEnvoyer = boutonIcone("envoyer", t("envoyer"), envoyer, "q-bouton-icone--envoyer");
    vue.message = el("p", { "class": "q-alerte", role: "status", hidden: true });
    var saisie = el("div", { "class": "q-saisie" }, [
      vue.citation, vue.piece, vue.enregistrement,
      el("div", { "class": "q-saisie__ligne" }, [
        boutonIcone("joindre", t("joindre"), function () { vue.entreeFichier.click(); }),
        boutonIcone("photo", t("photo"), function () { vue.entreePhoto.click(); }),
        vue.texte, vue.boutonMicro, vue.boutonEnvoyer
      ]),
      vue.entreeFichier, vue.entreePhoto
    ]);
    parent.appendChild(vue.message);
    parent.appendChild(vue.fil);
    parent.appendChild(saisie);
  }

  function ajusterHauteur() {
    vue.texte.style.height = "auto";
    vue.texte.style.height = Math.min(vue.texte.scrollHeight, 180) + "px";
  }

  function alerte(texte) {
    if (!vue.message) return;
    vue.message.textContent = texte || "";
    vue.message.hidden = !texte;
  }

  function afficherMessages(nouveaux, remplacer) {
    var enBas = vue.fil.scrollHeight - vue.fil.scrollTop - vue.fil.clientHeight < 80;
    if (remplacer) { vue.fil.textContent = ""; etat.messages = []; }
    nouveaux.forEach(function (m) {
      etat.messages.push(m);
      etat.dernierId = Math.max(etat.dernierId, m.id);
      vue.fil.appendChild(bulle(m));
    });
    if (!etat.messages.length && !vue.fil.querySelector(".q-vide")) vue.fil.appendChild(el("p", { "class": "q-vide", texte: PROF ? "" : t("vide") }));
    if (etat.messages.length) { var v = vue.fil.querySelector(".q-vide"); if (v) v.remove(); }
    if (remplacer || enBas || nouveaux.some(estMoi)) vue.fil.scrollTop = vue.fil.scrollHeight;
  }

  // Les coches « Vu » suivent la lecture de l'autre côté.
  function majVu(lu) {
    if (!lu || lu === etat.luAutre) return;
    etat.luAutre = lu;
    var limite = new Date(lu);
    etat.messages.forEach(function (m) {
      if (!estMoi(m) || new Date(m.cree_le) > limite) return;
      var b = vue.fil.querySelector('[data-id="' + m.id + '"] .q-pied');
      if (b && !b.querySelector(".q-vu")) b.insertBefore(el("span", { "class": "q-vu", texte: "✓✓ " + t("vu") }), b.querySelector(".q-bouton-repondre"));
    });
  }

  function choisirReponse(m) {
    etat.reponseA = m;
    vue.citation.textContent = "";
    vue.citation.appendChild(el("div", {}, [el("strong", { texte: t("reponse_a") + " · " + (estMoi(m) ? t("vous") : PROF ? etat.conv.nom : t("prof")) }),
                                            el("span", { texte: apercu(m) })]));
    vue.citation.appendChild(boutonIcone("fermer", t("annuler"), function () { etat.reponseA = null; vue.citation.hidden = true; }));
    vue.citation.hidden = false;
    vue.texte.focus();
  }

  function choisirFichier(fichier, commePhoto) {
    if (!fichier) return;
    var image = IMAGES.indexOf(fichier.type) >= 0 && (commePhoto || /^image\//.test(fichier.type));
    (image ? preparerImage(fichier) : Promise.resolve(fichier)).then(function (f) {
      if (f.size > MAX_OCTETS) { alerte(t("trop_lourd")); return; }
      alerte("");
      definirPiece({ blob: f, genre: image ? "image" : "fichier", nom: f.name || fichier.name, type: f.type || "application/octet-stream" });
    });
  }

  function definirPiece(piece) {
    if (etat.piece && etat.piece.apercu) URL.revokeObjectURL(etat.piece.apercu);
    etat.piece = piece;
    vue.piece.textContent = "";
    vue.piece.hidden = !piece;
    vue.texte.placeholder = piece ? t("legende") : t("ecrire");
    if (!piece) return;
    piece.apercu = URL.createObjectURL(piece.blob);
    var contenu;
    if (piece.genre === "image") contenu = el("img", { src: piece.apercu, alt: "" });
    else if (piece.genre === "audio") contenu = el("audio", { src: piece.apercu, controls: true });
    else contenu = el("span", { "class": "q-fichier" }, [icone("fichier"), el("span", { "class": "q-fichier__nom", texte: piece.nom }), el("span", { "class": "q-discret", texte: taille(piece.blob.size) })]);
    vue.piece.appendChild(contenu);
    vue.piece.appendChild(boutonIcone("fermer", t("annuler"), function () { definirPiece(null); }));
    vue.texte.focus();
  }

  /* ---------- Messages vocaux ---------- */

  var micro = null;
  function basculerEnregistrement() {
    if (micro) { micro.arreter(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { alerte(t("micro_refuse")); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (flux) {
      var type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].filter(function (x) {
        return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x);
      })[0];
      var rec = type ? new MediaRecorder(flux, { mimeType: type, audioBitsPerSecond: 32000 }) : new MediaRecorder(flux);
      var morceaux = [], debut = Date.now(), annule = false;
      rec.ondataavailable = function (e) { if (e.data && e.data.size) morceaux.push(e.data); };
      rec.onstop = function () {
        flux.getTracks().forEach(function (p) { p.stop(); });
        clearInterval(micro.minuteur);
        micro = null;
        vue.enregistrement.hidden = true;
        vue.boutonMicro.classList.remove("q-bouton-icone--actif");
        if (annule || !morceaux.length) return;
        var mime = (rec.mimeType || type || "audio/webm").split(";")[0];
        var blob = new Blob(morceaux, { type: mime });
        if (blob.size > MAX_OCTETS) { alerte(t("trop_lourd")); return; }
        definirPiece({ blob: blob, genre: "audio", nom: "message-vocal." + (mime.indexOf("mp4") >= 0 ? "m4a" : mime.indexOf("ogg") >= 0 ? "ogg" : "webm"),
                       type: mime, duree: (Date.now() - debut) / 1000 });
      };
      var compteur = el("span", { texte: t("enregistrement", { t: "0:00" }) });
      vue.enregistrement.textContent = "";
      vue.enregistrement.appendChild(el("span", { "class": "q-point-rouge", "aria-hidden": "true" }));
      vue.enregistrement.appendChild(compteur);
      vue.enregistrement.appendChild(el("button", { type: "button", "class": "bouton bouton--petit", texte: t("annuler"), onclick: function () { annule = true; rec.stop(); } }));
      vue.enregistrement.appendChild(el("button", { type: "button", "class": "bouton bouton--petit bouton--prisme", texte: t("arreter"), onclick: function () { rec.stop(); } }));
      vue.enregistrement.hidden = false;
      vue.boutonMicro.classList.add("q-bouton-icone--actif");
      micro = {
        arreter: function () { if (rec.state !== "inactive") rec.stop(); },
        minuteur: setInterval(function () {
          var s = (Date.now() - debut) / 1000;
          compteur.textContent = t("enregistrement", { t: duree(s) });
          if (s >= MAX_AUDIO) rec.stop();
        }, 250)
      };
      rec.start(1000);
    }, function () { alerte(t("micro_refuse")); });
  }

  /* ---------- Envoi ---------- */

  var envoiEnCours = false;
  function envoyer() {
    if (envoiEnCours) return;
    var texte = vue.texte.value.trim(), piece = etat.piece;
    if (!texte && !piece) return;
    envoiEnCours = true;
    vue.boutonEnvoyer.disabled = true;
    alerte(t("envoi"));
    (piece ? enBase64(piece.blob) : Promise.resolve(null)).then(function (b64) {
      var p = { p_genre: piece ? piece.genre : "texte", p_texte: texte || null, p_fichier_nom: piece ? piece.nom : null,
                p_fichier_type: piece ? piece.type : null, p_donnees: b64, p_duree: piece && piece.duree || null,
                p_reponse_a: etat.reponseA ? etat.reponseA.id : null };
      if (PROF) { p.p_code = etat.code; p.p_conv = etat.conv.id; return rpc("qr_prof_envoyer", p); }
      p.p_id = etat.eleve.id; p.p_jeton = etat.eleve.jeton;
      return rpc("qr_eleve_envoyer", p);
    }).then(function (m) {
      if (m && m.erreur) throw new Erreur(m.erreur);
      if (piece && m && m.id) {   // le fichier envoyé est déjà là : pas besoin de le recharger
        cacheFichiers[m.id] = Promise.resolve(piece.apercu);
        piece.apercu = null;
      }
      vue.texte.value = ""; ajusterHauteur();
      definirPiece(null);
      etat.reponseA = null; vue.citation.hidden = true;
      alerte("");
      return rafraichir();
    }).catch(function (e) {
      if (e.code === "code") return verrouiller(true);
      alerte(e.code === "reseau" ? t("erreur_reseau") : e.code === "fichier_trop_lourd" ? t("trop_lourd") : t("erreur") + " (" + e.message + ")");
    }).then(function () { envoiEnCours = false; vue.boutonEnvoyer.disabled = false; });
  }

  /* ---------- Rafraîchissement régulier ---------- */

  var rafraichissement = null;
  function rafraichir() {
    if (rafraichissement) return rafraichissement;
    var conv = etat.conv;
    var appel = PROF ? (etat.conv ? rpc("qr_prof_fil", { p_code: etat.code, p_conv: etat.conv.id, p_apres: etat.dernierId }) : Promise.resolve(null))
                     : rpc("qr_eleve_fil", { p_id: etat.eleve.id, p_jeton: etat.eleve.jeton, p_apres: etat.dernierId });
    rafraichissement = appel.then(function (r) {
      if (!r || conv !== etat.conv) return;   // l'enseignant a changé de conversation entre-temps
      if (r.erreur === "code") return verrouiller(true);
      if (r.erreur) return;
      if (vue.message && vue.message.textContent === t("erreur_reseau")) alerte("");
      afficherMessages(r.messages || [], false);
      majVu(PROF ? r.lu_eleve_le : r.lu_prof_le);
    }).catch(function (e) {
      if (!PROF && /conversation_inconnue/.test(e.message)) { ecrire(CLE_ELEVE, null); etat.eleve = null; return accueilEleve(t("perdue")); }
      if (e.code === "reseau") alerte(t("erreur_reseau"));
      else if (e.code === "non_configure") alerte(t("non_configure"));
    }).then(function () { rafraichissement = null; });
    return rafraichissement;
  }

  function cadence(fonction, ms) {
    return setInterval(function () { if (!document.hidden) fonction(); }, ms);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (PROF ? etat.code : etat.eleve) { rafraichir(); if (PROF) chargerListe(); }
  });

  /* ==========================================================================
     Page de l'étudiant
     ========================================================================== */

  function accueilEleve(message) {
    clearInterval(etat.minuteur);
    racine.textContent = "";
    var nom = el("input", { type: "text", id: "q-nom", required: true, minlength: "2", maxlength: "120", autocomplete: "name" });
    var groupe = el("select", { id: "q-groupe", required: true }, [el("option", { value: "", texte: "—" })].concat(
      GROUPES.map(function (g) { return el("option", { value: g, texte: g }); }), [el("option", { value: "autre", texte: t("autre") })]));
    var autre = el("input", { type: "text", id: "q-autre", maxlength: "80" });
    var champAutre = el("div", { "class": "champ", hidden: true }, [el("label", { "for": "q-autre", texte: t("autre_groupe") }), autre]);
    groupe.addEventListener("change", function () { champAutre.hidden = groupe.value !== "autre"; autre.required = groupe.value === "autre"; });
    var question = el("textarea", { id: "q-question", rows: "5", maxlength: "8000" });
    var bouton = el("button", { type: "submit", "class": "bouton bouton--prisme", texte: t("commencer") });
    var info = el("p", { "class": "q-alerte", role: "status", hidden: !message, texte: message || "" });
    var form = el("form", { "class": "q-carte q-entree", onsubmit: function (e) {
      e.preventDefault();
      var classe = groupe.value === "autre" ? autre.value.trim() : groupe.value;
      bouton.disabled = true; info.hidden = false; info.textContent = t("envoi");
      rpc("qr_ouvrir", { p_nom: nom.value.trim(), p_classe: classe }).then(function (r) {
        etat.eleve = { id: r.id, jeton: r.jeton, nom: nom.value.trim(), classe: classe };
        ecrire(CLE_ELEVE, etat.eleve);
        var q = question.value.trim();
        return q ? rpc("qr_eleve_envoyer", { p_id: r.id, p_jeton: r.jeton, p_genre: "texte", p_texte: q }) : null;
      }).then(function () { conversationEleve(); }).catch(function (e) {
        bouton.disabled = false;
        info.textContent = e.code === "reseau" ? t("erreur_reseau") : e.code === "non_configure" ? t("non_configure") : t("erreur") + " (" + e.message + ")";
      });
    } }, [
      el("p", { "class": "q-intro", texte: t("intro") }),
      el("div", { "class": "champ" }, [el("label", { "for": "q-nom", texte: t("nom") }), nom, el("small", { "class": "q-discret", texte: t("nom_aide") })]),
      el("div", { "class": "champ" }, [el("label", { "for": "q-groupe", texte: t("groupe") }), groupe]),
      champAutre,
      el("div", { "class": "champ" }, [el("label", { "for": "q-question", texte: t("premiere") }), question, el("small", { "class": "q-discret", texte: t("premiere_aide") })]),
      bouton, el("small", { "class": "q-discret", texte: t("suite") }), info
    ]);
    racine.appendChild(form);
  }

  function conversationEleve() {
    racine.textContent = "";
    etat.messages = []; etat.dernierId = 0;
    var tete = el("header", { "class": "q-entete" }, [
      el("div", {}, [el("strong", { texte: etat.eleve.nom }), el("span", { "class": "q-discret", texte: etat.eleve.classe + " → " + t("prof") })]),
      el("button", { type: "button", "class": "bouton bouton--discret bouton--petit", texte: t("pas_vous"), onclick: function () {
        if (!confirm(t("confirmer_recommencer"))) return;
        ecrire(CLE_ELEVE, null); etat.eleve = null; accueilEleve();
      } })
    ]);
    var carte = el("section", { "class": "q-carte q-conversation" }, [tete]);
    racine.appendChild(carte);
    construireConversation(carte);
    afficherMessages([], true);
    rafraichir();
    etat.minuteur = cadence(rafraichir, 4000);
  }

  /* ==========================================================================
     Page de l'enseignant
     ========================================================================== */

  function verrouiller(codeFaux) {
    clearInterval(etat.minuteur); clearInterval(etat.minuteurListe);
    etat.code = null; etat.conv = null;
    ecrire(CLE_CODE, null, sessionStorage);
    racine.textContent = "";
    var code = el("input", { type: "password", id: "q-code", inputmode: "numeric", autocomplete: "current-password", required: true });
    var info = el("p", { "class": "q-alerte", role: "status", hidden: !codeFaux, texte: codeFaux ? t("code_faux") : "" });
    var bouton = el("button", { type: "submit", "class": "bouton bouton--prisme", texte: t("entrer") });
    racine.appendChild(el("form", { "class": "q-carte q-entree q-entree--code", onsubmit: function (e) {
      e.preventDefault();
      bouton.disabled = true; info.hidden = false; info.textContent = "…";
      rpc("qr_prof_conversations", { p_code: code.value.trim() }).then(function (r) {
        if (r.erreur) { info.textContent = t("code_faux"); bouton.disabled = false; code.select(); return; }
        etat.code = code.value.trim();
        ecrire(CLE_CODE, etat.code, sessionStorage);
        boiteProf(r.conversations);
      }).catch(function (e) {
        bouton.disabled = false;
        info.textContent = e.code === "reseau" ? t("erreur_reseau") : e.code === "non_configure" ? t("non_configure") : e.message;
      });
    } }, [
      el("div", { "class": "champ" }, [el("label", { "for": "q-code", texte: t("code") }), code, el("small", { "class": "q-discret", texte: t("code_aide") })]),
      bouton, info
    ]));
    code.focus();
  }

  function boiteProf(conversations) {
    racine.textContent = "";
    var lienEleve = new URL("questions.html", location.href).href;
    var recherche = el("input", { type: "search", "class": "recherche", placeholder: t("rechercher"), "aria-label": t("rechercher"), oninput: function () { etat.recherche = this.value; dessinerListe(); } });
    var filtre = el("select", { "aria-label": t("groupe"), onchange: function () { etat.filtre = this.value; dessinerListe(); } }, [el("option", { value: "", texte: t("tous") })]);
    vue.filtre = filtre;
    vue.liste = el("ul", { "class": "q-liste" });
    vue.panneau = el("section", { "class": "q-panneau" });
    racine.appendChild(el("div", { "class": "q-barre" }, [
      el("p", { "class": "q-discret" }, [t("lien_eleve") + " ", el("a", { href: lienEleve, texte: lienEleve })]),
      el("button", { type: "button", "class": "bouton bouton--petit", texte: t("deconnexion"), onclick: function () { verrouiller(false); } })
    ]));
    vue.boite = el("div", { "class": "q-boite" }, [
      el("aside", { "class": "q-carte q-cote" }, [el("div", { "class": "q-cote__outils" }, [recherche, filtre]), vue.liste]),
      vue.panneau
    ]);
    racine.appendChild(vue.boite);
    etat.conversations = conversations || [];
    dessinerListe();
    panneauVide();
    etat.minuteurListe = cadence(chargerListe, 6000);
    etat.minuteur = cadence(rafraichir, 3000);
  }

  function panneauVide() {
    vue.panneau.textContent = "";
    vue.panneau.className = "q-carte q-panneau q-panneau--vide";
    vue.panneau.appendChild(el("p", { "class": "q-vide", texte: etat.conversations.length ? t("vide_prof") : t("aucune_conv") }));
    vue.boite.classList.remove("q-boite--fil");
  }

  function chargerListe() {
    return rpc("qr_prof_conversations", { p_code: etat.code }).then(function (r) {
      if (r.erreur) return verrouiller(true);
      etat.conversations = r.conversations || [];
      dessinerListe();
      if (!etat.conv && vue.panneau.classList.contains("q-panneau--vide")) panneauVide();
    }).catch(function () {});
  }

  function dessinerListe() {
    var groupes = {};
    etat.conversations.forEach(function (c) { groupes[c.classe] = true; });
    var actuel = vue.filtre.value;
    while (vue.filtre.options.length > 1) vue.filtre.remove(1);
    Object.keys(groupes).sort().forEach(function (g) { vue.filtre.appendChild(el("option", { value: g, texte: g })); });
    vue.filtre.value = groupes[actuel] ? actuel : "";
    var cherche = etat.recherche.trim().toLowerCase(), total = 0;
    vue.liste.textContent = "";
    etat.conversations.forEach(function (c) {
      if (etat.conv && c.id === etat.conv.id) c.non_lus = 0;
      total += c.non_lus || 0;
      if (vue.filtre.value && c.classe !== vue.filtre.value) return;
      if (cherche && c.nom.toLowerCase().indexOf(cherche) < 0) return;
      var d = c.dernier;
      vue.liste.appendChild(el("li", {}, [el("button", { type: "button", "class": "q-ligne" + (etat.conv && etat.conv.id === c.id ? " q-ligne--active" : ""),
        "aria-current": etat.conv && etat.conv.id === c.id ? "true" : null, onclick: function () { ouvrirConversation(c); } }, [
        el("span", { "class": "q-ligne__haut" }, [el("strong", { texte: c.nom }), el("time", { "class": "q-discret", texte: heure(c.dernier_le) })]),
        el("span", { "class": "q-ligne__bas" }, [
          el("span", { "class": "q-ligne__classe", texte: c.classe }),
          el("span", { "class": "q-ligne__apercu", texte: d ? (d.auteur === "prof" ? t("vous") + " : " : "") + apercu(d) : "" }),
          c.non_lus ? el("span", { "class": "q-pastille", "aria-label": t("non_lus", { n: c.non_lus }), texte: String(c.non_lus) }) : null
        ])
      ])]));
    });
    document.title = document.title.replace(/^\(\d+\) /, "");
    if (total) document.title = "(" + total + ") " + document.title;
  }

  function ouvrirConversation(c) {
    etat.conv = c; etat.messages = []; etat.dernierId = 0; etat.luAutre = c.lu_eleve_le || "1970-01-01T00:00:00Z";
    etat.reponseA = null;
    if (micro) micro.arreter();
    if (etat.piece) definirPiece(null);
    vue.panneau.textContent = "";
    vue.panneau.className = "q-carte q-panneau q-conversation";
    vue.boite.classList.add("q-boite--fil");
    vue.panneau.appendChild(el("header", { "class": "q-entete" }, [
      boutonIcone("retour", t("retour"), function () { etat.conv = null; panneauVide(); dessinerListe(); }, "q-retour"),
      el("div", {}, [el("strong", { texte: c.nom }), el("span", { "class": "q-discret", texte: c.classe })]),
      boutonIcone("poubelle", t("supprimer"), function () {
        if (!confirm(t("confirmer_supprimer", { nom: c.nom }))) return;
        rpc("qr_prof_supprimer", { p_code: etat.code, p_conv: c.id }).then(function () { etat.conv = null; return chargerListe(); }).then(panneauVide);
      })
    ]));
    construireConversation(vue.panneau);
    afficherMessages([], true);
    dessinerListe();
    rafraichir();
    vue.texte.focus();
  }

  /* ---------- Démarrage ---------- */

  if (PROF) {
    if (etat.code) {
      rpc("qr_prof_conversations", { p_code: etat.code }).then(function (r) {
        if (r.erreur) verrouiller(true); else boiteProf(r.conversations);
      }).catch(function () { verrouiller(false); });
    } else verrouiller(false);
  } else if (etat.eleve && etat.eleve.id) conversationEleve();
  else accueilEleve();
})();
