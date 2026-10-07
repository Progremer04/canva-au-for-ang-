#!/usr/bin/env python3
"""Crée (ou met à jour) la base des « Questions » dans Supabase : exécute supabase/questions.sql.

  QUESTIONS_DATABASE_URL=postgresql://postgres:MOT_DE_PASSE@db.<ref>.supabase.co:5432/postgres \
      python3 tools/questions_db.py

Sur Render, tools/lancer.py l'appelle au démarrage quand la variable QUESTIONS_DATABASE_URL est définie
(Render → le service → Environment) : la base se met en place toute seule à chaque déploiement. Le script
peut être relancé autant de fois qu'on veut (questions.sql ne fait que créer ou remplacer).

L'adresse directe de Supabase (db.<ref>.supabase.co) n'a qu'une adresse IPv6, que beaucoup d'hébergeurs
ne savent pas joindre : le script essaie alors le « pooler » IPv4 de Supabase (aws-0/aws-1-<région>
.pooler.supabase.com, utilisateur postgres.<ref>), région par région. Le mot de passe n'est jamais affiché.
Le pilote PostgreSQL (psycopg) est installé à la demande dans .questions-pg/ s'il manque.
"""
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

RACINE = Path(__file__).resolve().parent.parent
SQL = RACINE / "supabase" / "questions.sql"
PILOTE = RACINE / ".questions-pg"
REGIONS = ["eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-2", "eu-north-1", "us-east-1", "us-east-2",
           "us-west-1", "us-west-2", "ca-central-1", "sa-east-1", "ap-south-1", "ap-southeast-1", "ap-southeast-2",
           "ap-northeast-1", "ap-northeast-2"]


def dire(texte):
    print(f"  [questions] {texte}", flush=True)


def pilote():
    try:
        import psycopg  # noqa: F401
        return True
    except ImportError:
        pass
    sys.path.insert(0, str(PILOTE))
    try:
        import psycopg  # noqa: F401
        return True
    except ImportError:
        pass
    dire("installation du pilote PostgreSQL (psycopg)…")
    r = subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check",
                        "--target", str(PILOTE), "psycopg[binary]"], capture_output=True, text=True)
    if r.returncode:
        dire("échec de l'installation de psycopg : " + (r.stderr.strip().splitlines() or ["?"])[-1])
        return False
    import importlib
    importlib.invalidate_caches()
    try:
        import psycopg  # noqa: F401
        return True
    except ImportError as e:
        dire(f"psycopg introuvable après installation : {e}")
        return False


def candidats(url):
    """L'adresse donnée, puis les poolers IPv4 de Supabase si c'est une adresse directe db.<ref>.supabase.co."""
    u = urlsplit(url)
    base = {"user": unquote(u.username or "postgres"), "password": unquote(u.password or ""),
            "dbname": (u.path or "/postgres").lstrip("/") or "postgres"}
    hote = u.hostname or ""
    yield dict(base, host=hote, port=u.port or 5432)
    if hote.startswith("db.") and hote.endswith(".supabase.co"):
        ref = hote[3:-len(".supabase.co")]
        for prefixe in ("aws-0", "aws-1"):
            for region in REGIONS:
                yield dict(base, host=f"{prefixe}-{region}.pooler.supabase.com", port=5432, user=f"postgres.{ref}")


def appliquer(url=None):
    url = url or os.environ.get("QUESTIONS_DATABASE_URL", "").strip()
    if not url:
        dire("QUESTIONS_DATABASE_URL n'est pas définie : base non touchée.")
        return False
    if not pilote():
        return False
    import psycopg
    sql = SQL.read_text(encoding="utf-8")
    derniere = ""
    for c in candidats(url):
        try:
            with psycopg.connect(connect_timeout=8, sslmode="require", **c) as con:
                con.execute(sql)   # sans paramètres : protocole simple, plusieurs instructions d'un coup
                con.commit()
                n = con.execute("select count(*) from public.qr_conversation").fetchone()[0]
            dire(f"base prête sur {c['host']} ({n} conversation(s)).")
            return True
        except Exception as e:  # noqa: BLE001 — on essaie l'hôte suivant
            derniere = f"{c['host']} : {str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__}"
            if "password authentication failed" in str(e):
                dire("mot de passe refusé par Supabase : vérifiez QUESTIONS_DATABASE_URL.")
                return False
    dire("impossible de joindre la base. Dernière erreur : " + derniere)
    return False


if __name__ == "__main__":
    sys.exit(0 if appliquer(sys.argv[1] if len(sys.argv) > 1 else None) else 1)
