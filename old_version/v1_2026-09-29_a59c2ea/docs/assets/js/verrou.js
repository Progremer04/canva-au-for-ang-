/* ==========================================================================
   Verrou — l'espace de l'enseignant, protégé par le même code que les notes de la leçon 1.

   Les pages de l'enseignant (guide, diaporamas, Mes groupes, programme) et les fichiers des
   diaporamas sont publiés chiffrés par tools/verrou.py : sans le code, le fichier ne contient
   que des octets illisibles. Clé tirée du code par PBKDF2-HMAC-SHA256 (même sel et même nombre
   d'itérations que les notes), flux SHA-256 en mode compteur, contrôle HMAC-SHA256 — le calcul
   de chiffrer() dans tools/lecon1.py. La clé (jamais le code) reste dans sessionStorage le temps
   de l'onglet : un seul déverrouillage ouvre tout l'espace de l'enseignant et les notes.
   Aucune dépendance ; marche aussi en file://.
   ========================================================================== */
(function () {
  "use strict";
  var CLE_SESSION = "lx-cle-enseignant";

  /* ---------- SHA-256, HMAC, PBKDF2 (repli sans WebCrypto) ---------- */
  var K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  var H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], W = new Uint32Array(64);
  function compresser(h, b, o) {
    var i, x, y;
    for (i = 0; i < 16; i++) W[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
    for (i = 16; i < 64; i++) {
      x = W[i - 15]; y = W[i - 2];
      W[i] = (W[i - 16] + (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)) + W[i - 7] + (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10))) | 0;
    }
    var a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7], t1, t2;
    for (i = 0; i < 64; i++) {
      t1 = (hh + (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      t2 = ((((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + bb) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  function sha256(m, etat) {
    var h = new Uint32Array(etat ? etat.h : H0), n = m.length, total = (etat ? etat.n : 0) + n;
    var taille = ((n + 72) >> 6) << 6, b = new Uint8Array(taille), bits = total * 8, i;
    b.set(m); b[n] = 0x80;
    b[taille - 5] = Math.floor(bits / 4294967296);
    b[taille - 4] = bits >>> 24; b[taille - 3] = (bits >>> 16) & 255; b[taille - 2] = (bits >>> 8) & 255; b[taille - 1] = bits & 255;
    for (i = 0; i < taille; i += 64) compresser(h, b, i);
    var s = new Uint8Array(32);
    for (i = 0; i < 8; i++) { s[4 * i] = h[i] >>> 24; s[4 * i + 1] = (h[i] >>> 16) & 255; s[4 * i + 2] = (h[i] >>> 8) & 255; s[4 * i + 3] = h[i] & 255; }
    return s;
  }
  function preparerHmac(cle) {
    if (cle.length > 64) cle = sha256(cle);
    var ip = new Uint8Array(64), op = new Uint8Array(64), hi = new Uint32Array(H0), ho = new Uint32Array(H0);
    for (var i = 0; i < 64; i++) { ip[i] = (cle[i] || 0) ^ 0x36; op[i] = (cle[i] || 0) ^ 0x5c; }
    compresser(hi, ip, 0); compresser(ho, op, 0);
    return { i: { h: hi, n: 64 }, o: { h: ho, n: 64 } };
  }
  function hmac(p, m) { return sha256(sha256(m, p.i), p.o); }
  function pbkdf2Lent(mdp, sel, iterations) {
    var p = preparerHmac(mdp), s = new Uint8Array(sel.length + 4);
    s.set(sel); s[sel.length + 3] = 1;
    var u = hmac(p, s), t = u.slice();
    for (var k = 1; k < iterations; k++) { u = hmac(p, u); for (var j = 0; j < 32; j++) t[j] ^= u[j]; }
    return t;
  }

  /* ---------- Outils ---------- */
  function joindre(a, b) { var r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; }
  function octets(t) { return new TextEncoder().encode(t); }
  function depuisHex(h) { var r = new Uint8Array(h.length / 2); for (var i = 0; i < r.length; i++) r[i] = parseInt(h.substr(2 * i, 2), 16); return r; }
  function versHex(o) { return Array.prototype.map.call(o, function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function depuisBase64(t) { var s = atob(t), r = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) r[i] = s.charCodeAt(i); return r; }

  // Clé tirée du code : WebCrypto quand il est là (rapide), sinon le calcul en JavaScript.
  function deriver(code, selHex, iterations) {
    var mdp = octets(String(code).trim()), sel = depuisHex(selHex);
    var subtil = window.crypto && window.crypto.subtle;
    if (subtil) {
      return subtil.importKey("raw", mdp, "PBKDF2", false, ["deriveBits"]).then(function (k) {
        return subtil.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sel, iterations: iterations }, k, 256);
      }).then(function (b) { return new Uint8Array(b); }, function () { return pbkdf2Lent(mdp, sel, iterations); });
    }
    return new Promise(function (ok) { setTimeout(function () { ok(pbkdf2Lent(mdp, sel, iterations)); }, 30); });
  }
  // Même calcul que chiffrer() dans tools/lecon1.py ; null si la clé est fausse.
  function dechiffrer(cle, ivB64, donneesB64) {
    var iv = depuisBase64(ivB64), donnees = depuisBase64(donneesB64);
    var kc = sha256(joindre(cle, octets("lx-chiffre"))), km = sha256(joindre(cle, octets("lx-controle")));
    var sortie = new Uint8Array(donnees.length), bloc = new Uint8Array(52), i, j, flux;
    bloc.set(kc); bloc.set(iv, 32);
    for (i = 0; i * 32 < donnees.length; i++) {
      bloc[48] = i >>> 24; bloc[49] = (i >>> 16) & 255; bloc[50] = (i >>> 8) & 255; bloc[51] = i & 255;
      flux = sha256(bloc);
      for (j = 0; j < 32 && i * 32 + j < donnees.length; j++) sortie[i * 32 + j] = donnees[i * 32 + j] ^ flux[j];
    }
    var controle = hmac(preparerHmac(km), sortie);
    for (j = 0; j < 16; j++) if (controle[j] !== iv[j]) return null;
    return new TextDecoder().decode(sortie);
  }
  function cle() {
    var h = null;
    try { h = sessionStorage.getItem(CLE_SESSION) || sessionStorage.getItem("lx-lecon1-cle"); } catch (e) { /* stockage indisponible */ }
    return h && /^[0-9a-f]{64}$/.test(h) ? depuisHex(h) : null;
  }
  function memoriser(k) { try { sessionStorage.setItem(CLE_SESSION, versHex(k)); } catch (e) { /* stockage indisponible */ } }
  function oublier() { try { sessionStorage.removeItem(CLE_SESSION); sessionStorage.removeItem("lx-lecon1-cle"); } catch (e) { /* stockage indisponible */ } }
  function ouvrir(ivB64, donneesB64) { var k = cle(); return k ? dechiffrer(k, ivB64, donneesB64) : null; }
  // Données chiffrées (diaporamas) : l'objet JSON, ou la valeur par défaut sans la clé.
  function json(ivB64, donneesB64, defaut) {
    var t = ouvrir(ivB64, donneesB64);
    try { return t === null ? defaut : JSON.parse(t); } catch (e) { return defaut; }
  }

  /* ---------- La porte d'une page de l'enseignant ---------- */
  // p : { sel, iterations, iv, donnees } ; la page déchiffrée remplace la porte, scripts compris.
  function porte(p) {
    function remplacer(html) { document.open(); document.write(html); document.close(); }
    function suite() {
      var dejaLa = ouvrir(p.iv, p.donnees);
      if (dejaLa !== null) remplacer(dejaLa); else monter();
    }
    function monter() {
      var formulaire = document.getElementById("porte"), champ = document.getElementById("porte-code"), message = document.getElementById("porte-message");
      document.documentElement.classList.add("porte-prete");
      champ.focus();
      formulaire.addEventListener("submit", function (e) {
        e.preventDefault();
        var bouton = formulaire.querySelector("button");
        bouton.disabled = true; message.hidden = false; message.textContent = message.dataset.calcul;
        deriver(champ.value, p.sel, p.iterations).then(function (k) {
          var html = dechiffrer(k, p.iv, p.donnees);
          if (html === null) {
            bouton.disabled = false; message.textContent = message.dataset.faux; champ.select();
            return;
          }
          memoriser(k);
          remplacer(html);
        });
      });
    }
    // Après le chargement complet de la porte : remplacée plus tôt, la page réécrite peut rester bloquée
    // (la base IndexedDB de « Mes groupes » ne s'ouvre plus).
    if (document.readyState !== "complete") window.addEventListener("load", function () { setTimeout(suite, 0); }); else setTimeout(suite, 0);
  }

  window.LxVerrou = { deriver: deriver, dechiffrer: dechiffrer, cle: cle, memoriser: memoriser, oublier: oublier, ouvrir: ouvrir, json: json, porte: porte, versHex: versHex };
})();
