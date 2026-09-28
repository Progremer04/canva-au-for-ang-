#!/usr/bin/env python3
"""Lance le site du cours en local et l'ouvre dans le navigateur.

  python tools/lancer.py                 → sert docs/ sur http://127.0.0.1:8000 (ou le premier port libre)
  python tools/lancer.py --port 8080     → port de départ différent
  python tools/lancer.py --no-browser    → ne pas ouvrir le navigateur
  python tools/lancer.py --rebuild       → reconstruit d'abord le site depuis ses sources
  python tools/lancer.py --page classe.html  → ouvre directement une autre page
  python tools/lancer.py --public        → hébergement (Render, serveur) : écoute sur 0.0.0.0:$PORT

Hébergement : sur Render (variable RENDER définie) ou avec --public, le serveur écoute sur toutes les
interfaces, au port donné par la variable PORT (10000 par défaut), sans ouvrir de navigateur. L'API de la
base « Mes groupes » y est désactivée : chaque visiteur garde ses propres données dans son navigateur.

La page « Mes groupes » (classe.html) enregistre ses données dans une base SQLite sur cet
ordinateur : donnees/classe.sqlite, avec une copie de sauvegarde par jour dans donnees/sauvegardes/.
Le serveur n'écoute que sur 127.0.0.1 : rien n'est accessible depuis un autre ordinateur.

Arrêt : Ctrl+C, ou fermer la fenêtre.
Aucune dépendance : seulement la bibliothèque standard de Python 3.
"""
import argparse
import datetime
import errno
import functools
import http.server
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
HOTE = "127.0.0.1"
ETAPES_CONSTRUCTION = ["build_tokens.py", "construire_systeme.py", "assembler.py"]

# Base de la page « Mes groupes ». Hors de docs/ : jamais servie comme un fichier, jamais publiée.
DONNEES = RACINE / "donnees"
BASE_CLASSE = DONNEES / "classe.sqlite"
SAUVEGARDES = DONNEES / "sauvegardes"
SAUVEGARDES_GARDEES = 60
TAILLE_MAX = 50 * 1024 * 1024
ENTETE_SQLITE = b"SQLite format 3\x00"
VERROU_BASE = threading.Lock()


def version_base():
    """Version de la base : la date de modification du fichier (0 s'il n'existe pas)."""
    try:
        return str(BASE_CLASSE.stat().st_mtime_ns)
    except FileNotFoundError:
        return "0"


def sauvegarde_du_jour():
    """Avant la première écriture de la journée, copie la base actuelle dans donnees/sauvegardes/."""
    if not BASE_CLASSE.exists():
        return
    SAUVEGARDES.mkdir(parents=True, exist_ok=True)
    cible = SAUVEGARDES / f"classe-{datetime.date.today().isoformat()}.sqlite"
    if not cible.exists():
        shutil.copy2(BASE_CLASSE, cible)
    anciennes = sorted(SAUVEGARDES.glob("classe-*.sqlite"))
    for f in anciennes[:-SAUVEGARDES_GARDEES]:
        f.unlink(missing_ok=True)


def base_valide(chemin):
    """Vérifie qu'un fichier est une base SQLite intacte."""
    try:
        con = sqlite3.connect(f"file:{chemin}?mode=ro", uri=True)
        try:
            return con.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        finally:
            con.close()
    except sqlite3.Error:
        return False


def reconstruire():
    """Regénère le site. Une erreur est signalée mais n'empêche pas le lancement."""
    for script in ETAPES_CONSTRUCTION:
        resultat = subprocess.run([sys.executable, str(RACINE / "tools" / script)], cwd=RACINE)
        if resultat.returncode != 0:
            print(f"[!] {script} a échoué : le site déjà présent dans docs/ sera servi tel quel.")
            return False
    return True


class Gestionnaire(http.server.SimpleHTTPRequestHandler):
    api_active = True  # False en hébergement public : la base « Mes groupes » ne quitte jamais l'ordinateur de l'enseignant
    # Types manquants dans certaines installations Windows (registre incomplet).
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".md": "text/markdown; charset=utf-8",
        ".wasm": "application/wasm",
        ".woff2": "font/woff2",
        ".ipynb": "application/x-ipynb+json",
    }

    def end_headers(self):
        # Le navigateur garde les fichiers mais vérifie à chaque fois qu'ils n'ont pas changé
        # (réponse 304, sans les retélécharger) : toujours la dernière version, sans attente.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    # --- API de la base « Mes groupes » -------------------------------------------------

    def hote_autorise(self):
        """Refuse les requêtes venues d'un autre site (en-têtes Host et Origin)."""
        port = self.server.server_address[1]
        permis = {f"127.0.0.1:{port}", f"localhost:{port}"}
        if self.headers.get("Host", "") not in permis:
            return False
        origine = self.headers.get("Origin")
        return origine is None or origine in {f"http://{h}" for h in permis}

    def repondre_json(self, code, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.send_header("X-Version", version_base())
        self.end_headers()
        self.wfile.write(corps)

    def etat_base(self):
        existe = BASE_CLASSE.exists()
        return {
            "chemin": str(BASE_CLASSE),
            "existe": existe,
            "taille": BASE_CLASSE.stat().st_size if existe else 0,
            "version": version_base(),
            "sauvegardes": str(SAUVEGARDES),
            "nb_sauvegardes": len(list(SAUVEGARDES.glob("classe-*.sqlite"))) if SAUVEGARDES.exists() else 0,
        }

    def do_GET(self):
        chemin = self.path.split("?", 1)[0]
        if chemin.startswith("/api/"):
            if not self.api_active:
                return self.repondre_json(404, {"erreur": "inconnu"})
            if not self.hote_autorise():
                return self.repondre_json(403, {"erreur": "origine refusée"})
            if chemin == "/api/classe/etat":
                return self.repondre_json(200, self.etat_base())
            if chemin == "/api/classe":
                with VERROU_BASE:
                    version = version_base()
                    contenu = BASE_CLASSE.read_bytes() if BASE_CLASSE.exists() else None
                if contenu is None:
                    self.send_response(204)
                    self.send_header("X-Version", "0")
                    self.end_headers()
                    return
                self.send_response(200)
                self.send_header("Content-Type", "application/vnd.sqlite3")
                self.send_header("Content-Length", str(len(contenu)))
                self.send_header("X-Version", version)
                self.end_headers()
                self.wfile.write(contenu)
                return
            return self.repondre_json(404, {"erreur": "inconnu"})
        return super().do_GET()

    def do_PUT(self):
        if not self.api_active or self.path.split("?", 1)[0] != "/api/classe":
            return self.repondre_json(404, {"erreur": "inconnu"})
        if not self.hote_autorise():
            return self.repondre_json(403, {"erreur": "origine refusée"})
        try:
            longueur = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            longueur = 0
        if not 0 < longueur <= TAILLE_MAX:
            return self.repondre_json(413, {"erreur": "taille refusée"})
        contenu = self.rfile.read(longueur)
        if not contenu.startswith(ENTETE_SQLITE):
            return self.repondre_json(400, {"erreur": "ce n'est pas une base SQLite"})
        with VERROU_BASE:
            # Deux onglets ouverts : le second ne doit pas effacer ce que le premier vient d'écrire.
            attendue = self.headers.get("X-Version-Base")
            if attendue is not None and attendue != version_base():
                return self.repondre_json(409, {"erreur": "modifiée ailleurs", **self.etat_base()})
            DONNEES.mkdir(parents=True, exist_ok=True)
            temporaire = BASE_CLASSE.with_suffix(".sqlite.tmp")
            temporaire.write_bytes(contenu)
            if not base_valide(temporaire):
                temporaire.unlink(missing_ok=True)
                return self.repondre_json(400, {"erreur": "base endommagée"})
            sauvegarde_du_jour()
            os.replace(temporaire, BASE_CLASSE)
            return self.repondre_json(200, self.etat_base())

    def log_message(self, format, *args):
        # Journal discret : seulement les erreurs.
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write(f"  {self.address_string()} {format % args}\n")


def ouvrir_serveur(port_depart, essais=20, hote=HOTE):
    gestionnaire = functools.partial(Gestionnaire, directory=str(DOCS))
    for port in range(port_depart, port_depart + essais):
        try:
            serveur = http.server.ThreadingHTTPServer((hote, port), gestionnaire)
            return serveur, port
        except OSError as e:
            if e.errno in (errno.EADDRINUSE, getattr(errno, "WSAEADDRINUSE", -1), errno.EACCES, 10013, 10048):
                continue
            raise
    raise SystemExit(f"[x] Aucun port libre entre {port_depart} et {port_depart + essais - 1}.")


def main():
    # Une console Windows en cp850 ne sait pas afficher un chemin en arabe : on remplace plutôt que de planter.
    for flux in (sys.stdout, sys.stderr):
        if hasattr(flux, "reconfigure"):
            flux.reconfigure(errors="replace")
    p = argparse.ArgumentParser(description="Sert le site du cours d'IA en local.")
    p.add_argument("--port", type=int, default=8000)
    p.add_argument("--no-browser", action="store_true")
    p.add_argument("--rebuild", action="store_true")
    p.add_argument("--page", default="", help="page à ouvrir, par exemple classe.html")
    p.add_argument("--public", action="store_true", help="hébergement : écoute sur 0.0.0.0:$PORT, sans navigateur")
    a = p.parse_args()
    public = a.public or bool(os.environ.get("RENDER"))

    if not (DOCS / "index.html").exists():
        raise SystemExit(f"[x] Site introuvable : {DOCS / 'index.html'}")
    if a.rebuild:
        reconstruire()

    if public:
        Gestionnaire.api_active = False
        serveur, port = ouvrir_serveur(int(os.environ.get("PORT", "10000")), essais=1, hote="0.0.0.0")
        print(f"  Cours d'IA du Master LGC : hébergement sur le port {port} (API « Mes groupes » désactivée)")
        sys.stdout.flush()
        try:
            serveur.serve_forever()
        finally:
            serveur.server_close()
        return

    serveur, port = ouvrir_serveur(a.port)
    adresse = f"http://{HOTE}:{port}/"
    print()
    print("  Cours d'IA du Master LGC")
    print(f"  Site         : {adresse}")
    print(f"  Mes groupes  : {adresse}classe.html")
    print(f"  Diaporamas   : {adresse}diaporamas.html")
    print(f"  Base SQLite  : {BASE_CLASSE}")
    print("  Arret        : Ctrl+C (ou fermez cette fenetre)")
    print()
    sys.stdout.flush()

    if not a.no_browser:
        # Le port est déjà réservé : le navigateur ne peut pas arriver trop tôt.
        threading.Timer(0.4, webbrowser.open, args=(adresse + a.page.lstrip("/"),)).start()
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\n  Serveur arrete.")
    finally:
        serveur.server_close()


if __name__ == "__main__":
    main()
