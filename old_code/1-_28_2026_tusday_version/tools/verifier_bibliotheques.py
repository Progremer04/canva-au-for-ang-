#!/usr/bin/env python3
"""Vérifie que les bibliothèques du cours s'importent, et affiche leur version.

  python tools/verifier_bibliotheques.py

Code de sortie : 0 si tout est présent, 1 s'il manque au moins une bibliothèque.
"""
import importlib
import sys

# (module à importer, nom du paquet pip, à quoi il sert dans le cours)
BIBLIOTHEQUES = [
    ("numpy", "numpy", "chapitre 2 : tableaux et calcul"),
    ("pandas", "pandas", "chapitre 2 : tableaux de données"),
    ("matplotlib", "matplotlib", "graphiques"),
    ("seaborn", "seaborn", "graphiques statistiques (sujets 2 et 4)"),
    ("sklearn", "scikit-learn", "chapitre 3 : apprentissage automatique"),
    ("openpyxl", "openpyxl", "chapitre 2 : rapports Excel"),
    ("fpdf", "fpdf2", "chapitre 2 : rapports PDF"),
    ("pypdf", "pypdf", "chapitre 2 : lire un PDF"),
    ("spacy", "spacy", "sujet 3 : entités nommées"),
    ("gensim", "gensim", "sujet 3 : thèmes (LDA)"),
    ("networkx", "networkx", "sujet 5 : réseaux"),
    ("textblob", "textblob", "sujet 1 : sentiments"),
    ("vaderSentiment", "vaderSentiment", "sujet 1 : sentiments (VADER)"),
    ("wordcloud", "wordcloud", "sujet 3 : nuage de mots"),
    ("tweepy", "tweepy", "sujet 1 : API de X/Twitter"),
    ("geopandas", "geopandas", "sujet 1 : cartes"),
    ("notebook", "notebook", "Jupyter Notebook"),
    ("transformers", "transformers", "chapitre 3 : Transformers (BERT, GPT-2)"),
    ("torch", "torch", "moteur de calcul des Transformers"),
]


def main():
    manquantes = []
    print(f"Python {sys.version.split()[0]} ({sys.executable})\n")
    for module, paquet, usage in BIBLIOTHEQUES:
        try:
            m = importlib.import_module(module)
            version = getattr(m, "__version__", "?")
            print(f"  [ok]    {paquet:<16} {version:<12} {usage}")
        except Exception as e:  # ImportError, mais aussi une DLL manquante sous Windows
            manquantes.append(paquet)
            print(f"  [--]    {paquet:<16} {'absent':<12} {usage}  ({type(e).__name__})")
    try:
        import spacy
        spacy.load("fr_core_news_sm")
        print(f"  [ok]    {'fr_core_news_sm':<16} {'':<12} modèle français de spaCy")
    except Exception:
        manquantes.append("fr_core_news_sm")
        print(f"  [--]    {'fr_core_news_sm':<16} {'absent':<12} modèle français de spaCy")

    print()
    if manquantes:
        print("Manquant : " + ", ".join(manquantes))
        return 1
    print("Toutes les bibliothèques du cours sont installées.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
