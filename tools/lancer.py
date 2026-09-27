#!/usr/bin/env python3
"""Lance le site du cours en local et l'ouvre dans le navigateur.

  python tools/lancer.py                 → sert docs/ sur http://127.0.0.1:8000 (ou le premier port libre)
  python tools/lancer.py --port 8080     → port de départ différent
  python tools/lancer.py --no-browser    → ne pas ouvrir le navigateur
  python tools/lancer.py --rebuild       → reconstruit d'abord le site depuis ses sources

Arrêt : Ctrl+C, ou fermer la fenêtre.
Aucune dépendance : seulement la bibliothèque standard de Python 3.
"""
import argparse
import errno
import functools
import http.server
import socket
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "docs"
HOTE = "127.0.0.1"
ETAPES_CONSTRUCTION = ["build_tokens.py", "construire_systeme.py", "assembler.py"]


def reconstruire():
    """Regénère le site. Une erreur est signalée mais n'empêche pas le lancement."""
    for script in ETAPES_CONSTRUCTION:
        resultat = subprocess.run([sys.executable, str(RACINE / "tools" / script)], cwd=RACINE)
        if resultat.returncode != 0:
            print(f"[!] {script} a échoué : le site déjà présent dans docs/ sera servi tel quel.")
            return False
    return True


class Gestionnaire(http.server.SimpleHTTPRequestHandler):
    # Types manquants dans certaines installations Windows (registre incomplet).
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".md": "text/markdown; charset=utf-8",
    }

    def end_headers(self):
        # Toujours la dernière version des fichiers pendant qu'on travaille.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format, *args):
        # Journal discret : seulement les erreurs.
        if len(args) > 1 and str(args[1]).startswith(("4", "5")):
            sys.stderr.write(f"  {self.address_string()} {format % args}\n")


def ouvrir_serveur(port_depart, essais=20):
    gestionnaire = functools.partial(Gestionnaire, directory=str(DOCS))
    for port in range(port_depart, port_depart + essais):
        try:
            serveur = http.server.ThreadingHTTPServer((HOTE, port), gestionnaire)
            return serveur, port
        except OSError as e:
            if e.errno in (errno.EADDRINUSE, getattr(errno, "WSAEADDRINUSE", -1), errno.EACCES, 10013, 10048):
                continue
            raise
    raise SystemExit(f"[x] Aucun port libre entre {port_depart} et {port_depart + essais - 1}.")


def main():
    p = argparse.ArgumentParser(description="Sert le site du cours d'IA en local.")
    p.add_argument("--port", type=int, default=8000)
    p.add_argument("--no-browser", action="store_true")
    p.add_argument("--rebuild", action="store_true")
    a = p.parse_args()

    if not (DOCS / "index.html").exists():
        raise SystemExit(f"[x] Site introuvable : {DOCS / 'index.html'}")
    if a.rebuild:
        reconstruire()

    serveur, port = ouvrir_serveur(a.port)
    adresse = f"http://{HOTE}:{port}/"
    print()
    print("  Cours d'IA du Master LGC")
    print(f"  Site         : {adresse}")
    print(f"  Design system: {adresse}systeme-de-design.html")
    print("  Arret        : Ctrl+C (ou fermez cette fenetre)")
    print()
    sys.stdout.flush()

    if not a.no_browser:
        # Le port est déjà réservé : le navigateur ne peut pas arriver trop tôt.
        threading.Timer(0.4, webbrowser.open, args=(adresse,)).start()
    try:
        serveur.serve_forever()
    except KeyboardInterrupt:
        print("\n  Serveur arrete.")
    finally:
        serveur.server_close()


if __name__ == "__main__":
    main()
