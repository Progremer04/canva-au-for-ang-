/* ==========================================================================
   « Mes groupes » : la classe de l'enseignant
   - groupes (six par défaut), étudiants, observations datées sur chaque étudiant ;
   - séances de chaque groupe : planning modifiable et cahier de textes (ce qui a été fait) ;
   - appel (présences) et notes des évaluations.
   Les données sont une base SQLite, lue et écrite par sql.js dans la page :
   - lancé par run.bat (tools/lancer.py), le site l'enregistre dans donnees/classe.sqlite ;
   - ailleurs (fichier ouvert directement, GitHub Pages), elle reste dans ce navigateur (IndexedDB).
   ========================================================================== */
(function () {
  "use strict";

  var racine = document.getElementById("outil-classe");
  if (!racine) return;

  var BASE = racine.getAttribute("data-base") || "";
  var LANGUE = racine.getAttribute("data-langue") || "fr";
  var LOCALE = { fr: "fr-DZ", en: "en-GB", ar: "ar-DZ" }[LANGUE] || "fr";
  var SVG = "http://www.w3.org/2000/svg";
  var COULEURS = ["soleil", "ciel", "braise", "fuchsia", "cobalt", "juste"];
  var TABLES = ["groupe", "etudiant", "observation", "seance", "presence", "evaluation", "note"];
  var CLE_ETAT = "lx-classe-etat";
  // Emploi du temps 2025–2026 de l'enseignant (Labo 02) : les six groupes créés avec une base neuve.
  // Jours comme Date.getDay() : 0 dimanche, 2 mardi, 4 jeudi.
  var EMPLOI = [
    { nom: "M02 ANG · 1", specialite: "ANG", jour: 2, debut: "09:30", fin: "11:00" },
    { nom: "M02 ANG · 2", specialite: "ANG", jour: 2, debut: "11:00", fin: "12:30" },
    { nom: "M02 LGC", specialite: "LGC", jour: 2, debut: "12:30", fin: "14:00" },
    { nom: "M02 DID · 1", specialite: "DID", jour: 4, debut: "08:00", fin: "09:30" },
    { nom: "M02 DID · 2", specialite: "DID", jour: 4, debut: "09:30", fin: "11:00" },
    { nom: "M02 DID · 3", specialite: "DID", jour: 4, debut: "12:30", fin: "14:00" }
  ];
  var SALLE_EMPLOI = "Labo 02";
  var CRENEAUX = [["08:00", "09:30"], ["09:30", "11:00"], ["11:00", "12:30"], ["12:30", "14:00"], ["14:00", "15:30"], ["15:30", "17:00"]];
  var SEMAINE = [0, 1, 2, 3, 4, 5, 6];   // dimanche → samedi : la semaine universitaire algérienne commence le dimanche
  var CLE_IDB = "classe.sqlite";

  /* ---------- Textes ---------- */

  var TEXTES = {
    fr: {
      chargement: "Ouverture de la base…", etape_moteur: "Chargement du moteur SQLite…", etape_base: "Lecture de la base…",
      erreur_moteur: "Le moteur SQLite n'a pas pu être chargé (dossier assets/vendor/sqljs). Rechargez la page.",
      onglet_groupes: "Groupes", onglet_etudiants: "Étudiants", onglet_seances: "Séances", onglet_notes: "Notes", onglet_donnees: "Données",
      onglets: "Parties de la page", filtre: "Groupe affiché", tous: "Tous les groupes", sans_groupe: "Sans groupe",
      mode_serveur: "Base SQLite sur cet ordinateur", mode_navigateur: "Base SQLite gardée dans ce navigateur",
      mode_navigateur_aide: "Lancez run.bat pour l'enregistrer dans un fichier.",
      enregistre: "Enregistré à {h}", enregistrement: "Enregistrement…", non_enregistre: "Modifications non enregistrées",
      erreur_serveur: "Le serveur local ne répond plus : la fenêtre de run.bat a-t-elle été fermée ? Relancez run.bat, puis cliquez sur « Réessayer ». Tant que cette page reste ouverte, rien n'est perdu.",
      erreur_navigateur: "Ce navigateur refuse d'enregistrer la base (navigation privée ?). Téléchargez une copie pour ne rien perdre.",
      conflit: "La base a été modifiée dans une autre fenêtre. Rechargez la page pour voir la dernière version ; les modifications faites ici depuis ne sont pas enregistrées.",
      reessayer: "Réessayer", recharger: "Recharger", telecharger_copie: "Télécharger une copie",
      ajouter_groupe: "Ajouter un groupe", modifier: "Modifier", supprimer: "Supprimer", enregistrer: "Enregistrer", annuler: "Annuler", fermer: "Fermer",
      voir_etudiants: "Étudiants", voir_seances: "Séances", emargement: "Feuille d'émargement",
      prochaine: "Prochaine séance", derniere: "Dernière séance faite", assiduite: "Assiduité", aucune: "aucune",
      horaire_vide: "Horaire non renseigné", glisser: "Glissez un nom sur un autre groupe pour l'y déplacer.",
      specialite: "Spécialité", jour: "Jour", vue_cartes: "Cartes", vue_emploi: "Emploi du temps", sans_horaire: "Sans jour ni horaire",
      emploi_aide: "Cliquez sur un groupe pour changer son jour, son horaire ou sa salle.",
      appliquer_emploi: "Remplir avec l'emploi du temps 2025–2026",
      confirmer_emploi: "Donner aux six premiers groupes les noms, jours et horaires de l'emploi du temps 2025–2026 (M02 ANG, M02 LGC, M02 DID, Labo 02) ? Les étudiants, séances et notes sont gardés.",
      gen_portee: "Pour", gen_un: "Un groupe", gen_tous: "Tous les groupes, chacun à son jour et à son horaire",
      debut_semestre: "Début du semestre (première semaine)", gen_ligne: "{g} : {n}, du {d1} au {d2}", gen_ignores: "Sans jour ni horaire, donc ignorés : {liste}.",
      nom_groupe_defaut: "Groupe {n}", nouveau_groupe: "Nouveau groupe", modifier_groupe: "Modifier le groupe",
      nom: "Nom", prenom: "Prénom", matricule: "Matricule", email: "E-mail", telephone: "Téléphone", groupe: "Groupe",
      responsable: "Chef de groupe", remarque: "Remarques", horaire: "Horaire", salle: "Salle",
      sujet: "Sujet du mini-projet", couleur: "Couleur", aucun: "— aucun —",
      nom_obligatoire: "Le nom est obligatoire.", date_obligatoire: "La date est obligatoire.",
      confirmer_suppr_groupe: "Supprimer le groupe « {nom} » et toutes ses séances ? Ses étudiants sont gardés, sans groupe.",
      rechercher: "Rechercher (nom, prénom, matricule)", ajouter_etudiant: "Ajouter un étudiant", ajouter_liste: "Coller une liste",
      exporter_csv: "Exporter (CSV)", absences: "Absences", moyenne: "Moyenne /20", observations: "Observations", fiche: "Fiche",
      aucun_etudiant: "Aucun étudiant pour l'instant. Ajoutez-les un par un, ou collez la liste copiée depuis Excel.",
      aucun_resultat: "Aucun étudiant ne correspond à « {q} ».",
      nouvel_etudiant: "Nouvel étudiant", fiche_etudiant: "Fiche de l'étudiant",
      confirmer_suppr_etudiant: "Supprimer {nom} ainsi que ses présences, notes et observations ?",
      infos: "Informations", ajouter_obs: "Ajouter", aucune_obs: "Aucune observation pour l'instant.", texte_obs: "Observation",
      genre_obs: { remarque: "Remarque", progres: "Progrès", difficulte: "Difficulté", participation: "Participation" },
      presences: "Présences", notes: "Notes", aucune_note: "Aucune note.", aucune_absence: "Aucune absence.",
      liste_titre: "Coller une liste d'étudiants",
      liste_aide: "Une ligne par étudiant. Collez une colonne ou un tableau copié depuis Excel : Nom, Prénom, Matricule, E-mail, séparés par une tabulation, un point-virgule ou une virgule. Une ligne « NOM Prénom » suffit.",
      liste_vers: "Dans le groupe", liste_apercu: "Aperçu", liste_ajouter: "Ajouter ces étudiants", liste_vide: "Collez au moins un nom.",
      seances_vue: "Séances affichées", a_venir: "À venir", passees: "Passées", toutes: "Toutes",
      nouvelle_seance: "Nouvelle séance", generer: "Générer le planning", aujourdhui: "Aujourd'hui",
      aucune_seance: "Aucune séance ici. Ajoutez une séance, ou générez le planning du semestre pour un groupe.",
      appel: "Appel", appel_non_fait: "appel non fait", presents: "présents", ouvrir: "Ouvrir", presenter: "Diaporama",
      seance: "Séance", date: "Date", debut: "Début", fin: "Fin", genre: "Type", titre_seance: "Sujet prévu", diaporama: "Diaporama",
      statut: "État", contenu: "Ce qui a été fait", devoirs: "Travail personnel donné",
      genre_seance: { cours: "Cours", td: "TD", tp: "TP", examen: "Examen", autre: "Autre" },
      statut_seance: { prevue: "Prévue", faite: "Faite", reportee: "Reportée", annulee: "Annulée" },
      presence: { present: "Présent", absent: "Absent", retard: "Retard", excuse: "Excusé" },
      tous_presents: "Tous présents", effacer_appel: "Effacer l'appel",
      dupliquer: "Dupliquer (+7 jours)", decaler: "Décaler", decaler_aide: "Décaler cette séance et toutes les suivantes du groupe de",
      jours: "jours", confirmer_decaler: "Décaler {n} séance(s) de {j} jour(s) ?",
      confirmer_suppr_seance: "Supprimer cette séance et son appel ?",
      generer_titre: "Générer le planning d'un groupe", premiere_date: "Date de la première séance", nb_semaines: "Nombre de semaines",
      progression: "Reprendre la progression du cours (sujet et diaporama de chaque semaine)",
      generer_n: "Créer ces séances", deja_seances: "Ce groupe a déjà {n} séance(s) : les nouvelles s'y ajoutent.",
      semaine: "Semaine {n}",
      nouvelle_eval: "Nouvelle évaluation", modifier_eval: "Modifier l'évaluation", titre_eval: "Intitulé", bareme: "Barème", coefficient: "Coefficient",
      genre_eval: { td: "TD", tp: "TP", "mini-projet": "Mini-projet", examen: "Examen", participation: "Participation", autre: "Autre" },
      aucune_eval: "Aucune évaluation. Créez-en une (TD, mini-projet, examen…), puis saisissez les notes dans le tableau.",
      moyenne_groupe: "Moyenne", etudiant: "Étudiant", note_invalide: "Note entre 0 et {b}.",
      confirmer_suppr_eval: "Supprimer l'évaluation « {t} » et toutes ses notes ?",
      ou_donnees: "Où sont vos données ?", fichier: "Fichier", taille: "Taille",
      sauvegardes: "Une copie de sauvegarde par jour, dans {dossier} ({n} pour l'instant).",
      navigateur_explication: "La page n'a pas été ouverte par run.bat : la base est gardée dans ce navigateur, sur cet ordinateur seulement. Téléchargez-en une copie de temps en temps, ou lancez run.bat pour l'enregistrer dans le fichier donnees/classe.sqlite.",
      telecharger_base: "Télécharger la base (.sqlite)", importer_base: "Importer une base (.sqlite)",
      confirmer_import: "Remplacer toutes les données actuelles par celles de « {f} » ?",
      import_invalide: "Ce fichier n'est pas une base de « Mes groupes ».", import_ok: "Base importée.",
      exports: "Exporter vers Excel (CSV)", csv_etudiants: "Étudiants", csv_seances: "Cahier de textes", csv_presences: "Présences",
      csv_notes: "Notes", csv_observations: "Observations",
      python_titre: "Lire la base avec Python",
      python_aide: "La base est un fichier SQLite ordinaire. pandas la lit en quelques lignes, comme au chapitre 2 :",
      tables_titre: "Les tables de la base",
      tables_aide: {
        groupe: "les groupes : nom, horaire, salle, sujet du mini-projet",
        etudiant: "les étudiants et leur groupe",
        observation: "les observations datées sur chaque étudiant",
        seance: "les séances : date, horaire, sujet prévu, ce qui a été fait, travail donné",
        presence: "l'appel : une ligne par étudiant et par séance",
        evaluation: "les évaluations : intitulé, barème, coefficient",
        note: "les notes : une ligne par étudiant et par évaluation",
        conge: "les vacances et jours fériés : aucune séance n'y est créée",
        reglage: "les réglages : seuils d'absences, début du semestre 2"
      },
      vie_privee_titre: "Données personnelles",
      vie_privee: "Noms, notes et observations sont des données personnelles de vos étudiants (loi 18-07). Elles restent sur cet ordinateur : rien n'est envoyé sur Internet, et le dossier donnees/ est exclu de git.",
      tout_effacer: "Tout effacer", confirmer_effacer: "Tout effacer : groupes, étudiants, séances, présences, notes ? Tapez EFFACER pour confirmer.",
      mot_effacer: "EFFACER",
      resume: "{g} · {e} · {p} · {f}",
      emargement_titre: "Feuille d'émargement", signature: "Émargement", cours: "Intelligence artificielle · Master LGC",
      num: "N°",
      mp: ["Analyse de sentiments sur les réseaux sociaux", "Clustering des comportements sociaux dans des enquêtes",
           "Extraction d'informations dans des discours politiques", "Modélisation prédictive à partir de données de consommation",
           "Analyse des réseaux sociaux"],
      sujet_court: "Sujet {n}",
      plan: [
        ["Chapitre 1 : définitions, histoire, agents d'IA, types d'apprentissage", "seance-1"],
        ["Chapitre 2 : atelier de prompts ; fondamentaux de Python, NumPy et pandas", "seance-4"],
        ["Chapitre 2 : objets, fichiers texte, rapports ; distribution des sujets du mini-projet", "seance-5"],
        ["Chapitre 3 : IA symbolique, systèmes experts, chaînage avant", "seance-6"],
        ["Chapitre 3 : apprentissage automatique, classification, k-moyennes", "seance-7"],
        ["Chapitre 3 : régression linéaire, descente de gradient", "seance-7"],
        ["Chapitre 3 : apprentissage profond ; table ronde 2", ""],
        ["Chapitre 3 : Transformers et génération de texte", "seance-8"],
        ["Chapitre 3 : apprentissage par renforcement, synthèse ; table ronde 3", ""],
        ["Soutenances des mini-projets", "mini-projet"],
        ["Table ronde 4 : perspectives de l'IA ; synthèse du cours", ""],
        ["Révision ; examen blanc", ""],
        ["Examen (date fixée par la faculté)", ""]
      ],
      onglet_presences: "Présences", aujourdhui_titre: "Aujourd'hui · {date}", aucune_seance_auj: "Pas de séance aujourd'hui.",
      prochaine_le: "Prochaine séance : {d} · {g}.", faire_appel: "Faire l'appel", modifier_appel: "Modifier l'appel",
      appel_fait: "Appel fait : {p}/{n} présents", en_cours: "En cours", a_faire: "Appel à faire",
      appels_retard: "Appels à rattraper", appels_retard_aide: "Séances passées sans appel : faites-le maintenant, ou marquez la séance annulée.",
      annee_invitation: "Aucune séance prévue. Créez d'un coup les séances de l'année pour tous vos groupes, chacun à son jour et à son horaire, sans les vacances ni les jours fériés.",
      preparer_annee: "Préparer l'année", annee_titre: "Préparer l'année : une séance par semaine pour chaque groupe",
      annee_aide: "Chaque groupe coché reçoit une séance par semaine, à son jour et à son horaire, du premier au dernier jour, sauf pendant les vacances et les jours fériés ci-dessous.",
      premier_jour: "Premier jour", dernier_jour: "Dernier jour", groupes_concernes: "Groupes",
      remplacer: "Remplacer les séances prévues sans appel à partir du premier jour ({n})", sautees: "{n} semaine(s) sautée(s) (congés)",
      creer_seances: "Créer les séances ({n})", aucun_groupe_horaire: "Donnez d'abord un jour et un horaire à vos groupes (onglet Groupes).",
      conges: "Vacances et jours fériés", conge_libelle: "Libellé", conge_exemple: "Vacances d'hiver", du: "Du", au: "Au", du_au: "du {d1} au {d2}",
      ajouter_conge: "Ajouter", aucun_conge: "Aucune période.",
      conges_aide: "Aucune séance n'est créée pendant ces périodes. Ajoutez les vacances d'hiver et de printemps dès que la faculté publie son calendrier. Les dates des fêtes religieuses sont approximatives : corrigez-les au besoin.",
      changer_horaire: "Changer l'horaire", horaire_titre: "Changer l'horaire d'un groupe", a_partir_du: "À partir du", nouveau_jour: "Nouveau jour",
      horaire_apercu: "{n} séance(s) prévue(s) passeront de « {avant} » à « {apres} ».", horaire_aucune: "Aucune séance prévue à déplacer : seul l'horaire du groupe change.",
      appliquer: "Appliquer", confirmer_horaire_groupe: "Appliquer aussi ce nouvel horaire aux {n} séance(s) prévue(s) à partir d'aujourd'hui ?",
      horaire_conge: "tombe pendant un congé : annulée",
      periode: "Période", semestre1: "Semestre 1", semestre2: "Semestre 2", annee: "Année",
      registre: "Registre des présences", choisir_groupe: "Choisissez un groupe ci-dessus pour voir son registre des présences.",
      lettres: { present: "P", absent: "A", excuse: "J", retard: "R" },
      col_presents: "Présents", col_absences: "Absences", col_justifiees: "Justifiées", col_retards: "Retards", taux: "Taux de présence",
      seances_faites: "Séances faites", en_alerte: "En alerte", exclus: "Exclusion", a_suivre: "Étudiants à suivre", aucun_suivi: "Aucun étudiant en alerte sur cette période.",
      niveau: { alerte: "Alerte", exclusion: "Seuil d'exclusion" },
      regles: "Règles d'assiduité", seuil_alerte: "Alerte à partir de … absences non justifiées", seuil_exclusion: "Exclusion à partir de … absences non justifiées",
      seuil_total: "… ou à partir de … absences au total (justifiées ou non)", debut_s2: "Début du semestre 2",
      regles_aide: "Règle souvent appliquée : exclusion de la matière après 3 absences non justifiées ou 5 absences au total en TD. Vérifiez le règlement de votre faculté. Les alertes sont calculées sur le semestre.",
      legende: "P présent · A absent · J absence justifiée · R retard · case vide : appel non fait. Cliquez sur une case pour la changer.",
      ajouter_rapide: "Ajouter un étudiant à ce groupe", exemple_nom: "NOM Prénom", ajouter_court: "Ajouter",
      defaut_present: "Tout le monde est présent par défaut : touchez seulement les absents.", seance_annulee: "Séance annulée",
      confirmer_annulee: "Marquer cette séance comme annulée ? Son appel est effacé et elle ne compte plus dans les présences.",
      enregistrer_appel: "Enregistrer l'appel", cumul: "sem. : {a} abs. · {j} just.",
      rappel_en_cours: "Séance en cours : {g} {h}", rappel_a_faire: "Appel à faire : {g} {h}",
      imprimer_registre: "Imprimer le registre", semaine_courte: "S{n}",
      conges_defaut: { revolution: "Fête de la Révolution", nouvel_an: "Nouvel An", yennayer: "Yennayer", travail: "Fête du Travail", independance: "Fête de l'Indépendance",
        fitr: "Aïd el-Fitr (dates à confirmer)", adha: "Aïd el-Adha (dates à confirmer)", moharram: "Awal Moharram (date à confirmer)", achoura: "Achoura (date à confirmer)" },
      formes: {
        groupe: ["groupe", "groupes"], etudiant: ["étudiant", "étudiants"], seance: ["séance", "séances"],
        avenir: ["séance à venir", "séances à venir"], faite: ["séance faite", "séances faites"]
      }
    },
    en: {
      chargement: "Opening the database…", etape_moteur: "Loading the SQLite engine…", etape_base: "Reading the database…",
      erreur_moteur: "The SQLite engine could not be loaded (folder assets/vendor/sqljs). Please reload the page.",
      onglet_groupes: "Groups", onglet_etudiants: "Students", onglet_seances: "Sessions", onglet_notes: "Grades", onglet_donnees: "Data",
      onglets: "Parts of the page", filtre: "Group shown", tous: "All groups", sans_groupe: "No group",
      mode_serveur: "SQLite database on this computer", mode_navigateur: "SQLite database kept in this browser",
      mode_navigateur_aide: "Start run.bat to save it to a file.",
      enregistre: "Saved at {h}", enregistrement: "Saving…", non_enregistre: "Unsaved changes",
      erreur_serveur: "The local server is not answering: was the run.bat window closed? Start run.bat again, then click “Try again”. As long as this page stays open, nothing is lost.",
      erreur_navigateur: "This browser refuses to store the database (private browsing?). Download a copy so that nothing is lost.",
      conflit: "The database was changed in another window. Reload the page to see the latest version; changes made here since then are not saved.",
      reessayer: "Try again", recharger: "Reload", telecharger_copie: "Download a copy",
      ajouter_groupe: "Add a group", modifier: "Edit", supprimer: "Delete", enregistrer: "Save", annuler: "Cancel", fermer: "Close",
      voir_etudiants: "Students", voir_seances: "Sessions", emargement: "Sign-in sheet",
      prochaine: "Next session", derniere: "Last session held", assiduite: "Attendance", aucune: "none",
      horaire_vide: "No timetable yet", glisser: "Drag a name onto another group to move it there.",
      specialite: "Programme", jour: "Day", vue_cartes: "Cards", vue_emploi: "Timetable", sans_horaire: "No day or time",
      emploi_aide: "Click a group to change its day, time or room.",
      appliquer_emploi: "Fill in the 2025–2026 timetable",
      confirmer_emploi: "Give the first six groups the names, days and times of the 2025–2026 timetable (M02 ANG, M02 LGC, M02 DID, Labo 02)? Students, sessions and grades are kept.",
      gen_portee: "For", gen_un: "One group", gen_tous: "All groups, each on its own day and time",
      debut_semestre: "Start of the semester (first week)", gen_ligne: "{g}: {n}, from {d1} to {d2}", gen_ignores: "No day or time, so skipped: {liste}.",
      nom_groupe_defaut: "Group {n}", nouveau_groupe: "New group", modifier_groupe: "Edit group",
      nom: "Surname", prenom: "First name", matricule: "Student number", email: "Email", telephone: "Phone", groupe: "Group",
      responsable: "Group leader", remarque: "Remarks", horaire: "Timetable", salle: "Room",
      sujet: "Mini-project subject", couleur: "Colour", aucun: "— none —",
      nom_obligatoire: "The surname is required.", date_obligatoire: "The date is required.",
      confirmer_suppr_groupe: "Delete the group “{nom}” and all its sessions? Its students are kept, with no group.",
      rechercher: "Search (surname, first name, number)", ajouter_etudiant: "Add a student", ajouter_liste: "Paste a list",
      exporter_csv: "Export (CSV)", absences: "Absences", moyenne: "Average /20", observations: "Notes", fiche: "Record",
      aucun_etudiant: "No students yet. Add them one by one, or paste the list copied from Excel.",
      aucun_resultat: "No student matches “{q}”.",
      nouvel_etudiant: "New student", fiche_etudiant: "Student record",
      confirmer_suppr_etudiant: "Delete {nom} together with their attendance, grades and notes?",
      infos: "Details", ajouter_obs: "Add", aucune_obs: "No notes yet.", texte_obs: "Note",
      genre_obs: { remarque: "Remark", progres: "Progress", difficulte: "Difficulty", participation: "Participation" },
      presences: "Attendance", notes: "Grades", aucune_note: "No grades.", aucune_absence: "No absences.",
      liste_titre: "Paste a list of students",
      liste_aide: "One line per student. Paste a column or a table copied from Excel: Surname, First name, Student number, Email, separated by a tab, a semicolon or a comma. A line “SURNAME First name” is enough.",
      liste_vers: "Into group", liste_apercu: "Preview", liste_ajouter: "Add these students", liste_vide: "Paste at least one name.",
      seances_vue: "Sessions shown", a_venir: "Upcoming", passees: "Past", toutes: "All",
      nouvelle_seance: "New session", generer: "Generate the schedule", aujourdhui: "Today",
      aucune_seance: "No sessions here. Add a session, or generate the semester schedule for a group.",
      appel: "Roll call", appel_non_fait: "roll not taken", presents: "present", ouvrir: "Open", presenter: "Slides",
      seance: "Session", date: "Date", debut: "Start", fin: "End", genre: "Type", titre_seance: "Planned topic", diaporama: "Slides",
      statut: "Status", contenu: "What was done", devoirs: "Homework set",
      genre_seance: { cours: "Lecture", td: "Tutorial", tp: "Lab", examen: "Exam", autre: "Other" },
      statut_seance: { prevue: "Planned", faite: "Held", reportee: "Postponed", annulee: "Cancelled" },
      presence: { present: "Present", absent: "Absent", retard: "Late", excuse: "Excused" },
      tous_presents: "All present", effacer_appel: "Clear the roll",
      dupliquer: "Duplicate (+7 days)", decaler: "Shift", decaler_aide: "Shift this session and all the group's later sessions by",
      jours: "days", confirmer_decaler: "Shift {n} session(s) by {j} day(s)?",
      confirmer_suppr_seance: "Delete this session and its roll call?",
      generer_titre: "Generate a group's schedule", premiere_date: "Date of the first session", nb_semaines: "Number of weeks",
      progression: "Follow the course plan (topic and slides for each week)",
      generer_n: "Create these sessions", deja_seances: "This group already has {n} session(s): the new ones are added.",
      semaine: "Week {n}",
      nouvelle_eval: "New assessment", modifier_eval: "Edit assessment", titre_eval: "Title", bareme: "Out of", coefficient: "Weight",
      genre_eval: { td: "Tutorial", tp: "Lab", "mini-projet": "Mini-project", examen: "Exam", participation: "Participation", autre: "Other" },
      aucune_eval: "No assessments. Create one (tutorial, mini-project, exam…), then enter the grades in the table.",
      moyenne_groupe: "Average", etudiant: "Student", note_invalide: "Grade between 0 and {b}.",
      confirmer_suppr_eval: "Delete the assessment “{t}” and all its grades?",
      ou_donnees: "Where is your data?", fichier: "File", taille: "Size",
      sauvegardes: "One backup copy per day, in {dossier} ({n} so far).",
      navigateur_explication: "This page was not opened by run.bat: the database is kept in this browser, on this computer only. Download a copy from time to time, or start run.bat to save it to the file donnees/classe.sqlite.",
      telecharger_base: "Download the database (.sqlite)", importer_base: "Import a database (.sqlite)",
      confirmer_import: "Replace all current data with the data in “{f}”?",
      import_invalide: "This file is not a “My groups” database.", import_ok: "Database imported.",
      exports: "Export to Excel (CSV)", csv_etudiants: "Students", csv_seances: "Class log", csv_presences: "Attendance",
      csv_notes: "Grades", csv_observations: "Notes on students",
      python_titre: "Read the database with Python",
      python_aide: "The database is an ordinary SQLite file. pandas reads it in a few lines, as in chapter 2:",
      tables_titre: "The tables in the database",
      tables_aide: {
        groupe: "the groups: name, timetable, room, mini-project subject",
        etudiant: "the students and their group",
        observation: "dated notes on each student",
        seance: "the sessions: date, time, planned topic, what was done, homework",
        presence: "the roll call: one row per student and session",
        evaluation: "the assessments: title, out of, weight",
        note: "the grades: one row per student and assessment",
        conge: "holidays: no session is created during them",
        reglage: "settings: absence thresholds, start of semester 2"
      },
      vie_privee_titre: "Personal data",
      vie_privee: "Names, grades and notes are your students' personal data (Algerian law 18-07). They stay on this computer: nothing is sent over the Internet, and the donnees/ folder is excluded from git.",
      tout_effacer: "Erase everything", confirmer_effacer: "Erase everything: groups, students, sessions, attendance, grades? Type ERASE to confirm.",
      mot_effacer: "ERASE",
      resume: "{g} · {e} · {p} · {f}",
      emargement_titre: "Sign-in sheet", signature: "Signature", cours: "Artificial intelligence · Master LGC",
      num: "No.",
      mp: ["Sentiment analysis on social media", "Clustering social behaviour in surveys",
           "Information extraction from political speeches", "Predictive modelling from consumption data",
           "Social network analysis"],
      sujet_court: "Subject {n}",
      plan: [
        ["Chapter 1: definitions, history, AI agents, types of learning", "seance-1"],
        ["Chapter 2: prompt crafting; Python basics, NumPy and pandas", "seance-4"],
        ["Chapter 2: objects, text files, reports; mini-project subjects handed out", "seance-5"],
        ["Chapter 3: symbolic AI, expert systems, forward chaining", "seance-6"],
        ["Chapter 3: machine learning, classification, k-means", "seance-7"],
        ["Chapter 3: linear regression, gradient descent", "seance-7"],
        ["Chapter 3: deep learning; round table 2", ""],
        ["Chapter 3: Transformers and text generation", "seance-8"],
        ["Chapter 3: reinforcement learning, synthesis; round table 3", ""],
        ["Mini-project presentations", "mini-projet"],
        ["Round table 4: the outlook for AI; course synthesis", ""],
        ["Revision; mock exam", ""],
        ["Exam (date set by the faculty)", ""]
      ],
      onglet_presences: "Attendance", aujourdhui_titre: "Today · {date}", aucune_seance_auj: "No session today.",
      prochaine_le: "Next session: {d} · {g}.", faire_appel: "Take the roll", modifier_appel: "Edit the roll",
      appel_fait: "Roll taken: {p}/{n} present", en_cours: "In progress", a_faire: "Roll to take",
      appels_retard: "Roll calls to catch up", appels_retard_aide: "Past sessions without a roll call: take it now, or mark the session as cancelled.",
      annee_invitation: "No session planned. Create all the year's sessions for every group at once, each on its own day and time, skipping holidays.",
      preparer_annee: "Prepare the year", annee_titre: "Prepare the year: one session a week for each group",
      annee_aide: "Each ticked group gets one session a week, on its day and at its time, from the first to the last day, except during the holidays below.",
      premier_jour: "First day", dernier_jour: "Last day", groupes_concernes: "Groups",
      remplacer: "Replace the planned sessions without a roll call from the first day ({n})", sautees: "{n} week(s) skipped (holidays)",
      creer_seances: "Create the sessions ({n})", aucun_groupe_horaire: "First give your groups a day and a time (Groups tab).",
      conges: "Holidays", conge_libelle: "Label", conge_exemple: "Winter break", du: "From", au: "To", du_au: "{d1} to {d2}",
      ajouter_conge: "Add", aucun_conge: "No period.",
      conges_aide: "No session is created during these periods. Add the winter and spring breaks as soon as the faculty publishes its calendar. Religious holiday dates are approximate: correct them if needed.",
      changer_horaire: "Change the schedule", horaire_titre: "Change a group's schedule", a_partir_du: "From", nouveau_jour: "New day",
      horaire_apercu: "{n} planned session(s) will move from “{avant}” to “{apres}”.", horaire_aucune: "No planned session to move: only the group's schedule changes.",
      appliquer: "Apply", confirmer_horaire_groupe: "Also apply this new schedule to the {n} planned session(s) from today?",
      horaire_conge: "falls on a holiday: cancelled",
      periode: "Period", semestre1: "Semester 1", semestre2: "Semester 2", annee: "Year",
      registre: "Attendance register", choisir_groupe: "Choose a group above to see its attendance register.",
      lettres: { present: "P", absent: "A", excuse: "E", retard: "L" },
      col_presents: "Present", col_absences: "Absences", col_justifiees: "Excused", col_retards: "Late", taux: "Attendance rate",
      seances_faites: "Sessions held", en_alerte: "Warning", exclus: "Exclusion", a_suivre: "Students to watch", aucun_suivi: "No student at risk in this period.",
      niveau: { alerte: "Warning", exclusion: "Exclusion threshold" },
      regles: "Attendance rules", seuil_alerte: "Warning from … unexcused absences", seuil_exclusion: "Exclusion from … unexcused absences",
      seuil_total: "… or from … absences in total (excused or not)", debut_s2: "Semester 2 starts",
      regles_aide: "A rule often applied: exclusion from the subject after 3 unexcused absences or 5 absences in total in tutorials. Check your faculty's regulations. Warnings are computed per semester.",
      legende: "P present · A absent · E excused absence · L late · empty: no roll call. Click a box to change it.",
      ajouter_rapide: "Add a student to this group", exemple_nom: "SURNAME First name", ajouter_court: "Add",
      defaut_present: "Everyone is present by default: tap only the absent students.", seance_annulee: "Session cancelled",
      confirmer_annulee: "Mark this session as cancelled? Its roll call is deleted and it no longer counts for attendance.",
      enregistrer_appel: "Save the roll call", cumul: "sem.: {a} abs. · {j} exc.",
      rappel_en_cours: "Session in progress: {g} {h}", rappel_a_faire: "Roll call to take: {g} {h}",
      imprimer_registre: "Print the register", semaine_courte: "W{n}",
      conges_defaut: { revolution: "Revolution Day", nouvel_an: "New Year's Day", yennayer: "Yennayer", travail: "Labour Day", independance: "Independence Day",
        fitr: "Eid al-Fitr (dates to confirm)", adha: "Eid al-Adha (dates to confirm)", moharram: "Islamic New Year (date to confirm)", achoura: "Ashura (date to confirm)" },
      formes: {
        groupe: ["group", "groups"], etudiant: ["student", "students"], seance: ["session", "sessions"],
        avenir: ["upcoming session", "upcoming sessions"], faite: ["session held", "sessions held"]
      }
    },
    ar: {
      chargement: "جارٍ فتح قاعدة البيانات…", etape_moteur: "جارٍ تحميل محرّك SQLite…", etape_base: "جارٍ قراءة القاعدة…",
      erreur_moteur: "تعذّر تحميل محرّك SQLite (المجلد assets/vendor/sqljs). أعيدوا تحميل الصفحة.",
      onglet_groupes: "الأفواج", onglet_etudiants: "الطلبة", onglet_seances: "الحصص", onglet_notes: "العلامات", onglet_donnees: "البيانات",
      onglets: "أقسام الصفحة", filtre: "الفوج المعروض", tous: "كل الأفواج", sans_groupe: "دون فوج",
      mode_serveur: "قاعدة SQLite على هذا الحاسوب", mode_navigateur: "قاعدة SQLite محفوظة في هذا المتصفح",
      mode_navigateur_aide: "شغّلوا run.bat لحفظها في ملف.",
      enregistre: "حُفظ على الساعة {h}", enregistrement: "جارٍ الحفظ…", non_enregistre: "تعديلات غير محفوظة",
      erreur_serveur: "الخادم المحلي لا يستجيب: هل أُغلقت نافذة run.bat؟ أعيدوا تشغيل run.bat ثم انقروا «إعادة المحاولة». لن يضيع شيء ما دامت هذه الصفحة مفتوحة.",
      erreur_navigateur: "يرفض هذا المتصفح حفظ القاعدة (تصفّح خاص؟). نزّلوا نسخة منها حتى لا يضيع شيء.",
      conflit: "عُدّلت القاعدة في نافذة أخرى. أعيدوا تحميل الصفحة لرؤية آخر نسخة؛ التعديلات التي أُجريت هنا منذ ذلك الحين لم تُحفظ.",
      reessayer: "إعادة المحاولة", recharger: "إعادة التحميل", telecharger_copie: "تنزيل نسخة",
      ajouter_groupe: "إضافة فوج", modifier: "تعديل", supprimer: "حذف", enregistrer: "حفظ", annuler: "إلغاء", fermer: "إغلاق",
      voir_etudiants: "الطلبة", voir_seances: "الحصص", emargement: "ورقة الحضور",
      prochaine: "الحصة القادمة", derniere: "آخر حصة أُنجزت", assiduite: "المواظبة", aucune: "لا توجد",
      horaire_vide: "التوقيت غير محدَّد", glisser: "اسحبوا اسمًا إلى فوج آخر لنقله إليه.",
      specialite: "التخصص", jour: "اليوم", vue_cartes: "البطاقات", vue_emploi: "التوقيت الأسبوعي", sans_horaire: "دون يوم أو توقيت",
      emploi_aide: "انقروا على فوج لتغيير يومه أو توقيته أو قاعته.",
      appliquer_emploi: "ملء التوقيت الأسبوعي 2025–2026",
      confirmer_emploi: "إعطاء الأفواج الستة الأولى أسماء التوقيت الأسبوعي 2025–2026 وأيامه وساعاته (M02 ANG وM02 LGC وM02 DID، المخبر 02)؟ يُحتفظ بالطلبة والحصص والعلامات.",
      gen_portee: "لـ", gen_un: "فوج واحد", gen_tous: "كل الأفواج، كلٌّ في يومه وتوقيته",
      debut_semestre: "بداية السداسي (الأسبوع الأول)", gen_ligne: "{g}: {n}، من {d1} إلى {d2}", gen_ignores: "دون يوم أو توقيت، فلم تُبرمج: {liste}.",
      nom_groupe_defaut: "الفوج {n}", nouveau_groupe: "فوج جديد", modifier_groupe: "تعديل الفوج",
      nom: "اللقب", prenom: "الاسم", matricule: "رقم التسجيل", email: "البريد الإلكتروني", telephone: "الهاتف", groupe: "الفوج",
      responsable: "رئيس الفوج", remarque: "ملاحظات", horaire: "التوقيت", salle: "القاعة",
      sujet: "موضوع المشروع المصغَّر", couleur: "اللون", aucun: "— لا شيء —",
      nom_obligatoire: "اللقب إلزامي.", date_obligatoire: "التاريخ إلزامي.",
      confirmer_suppr_groupe: "حذف الفوج «{nom}» وكل حصصه؟ يبقى طلبته دون فوج.",
      rechercher: "بحث (اللقب، الاسم، رقم التسجيل)", ajouter_etudiant: "إضافة طالب", ajouter_liste: "لصق قائمة",
      exporter_csv: "تصدير (CSV)", absences: "الغيابات", moyenne: "المعدل /20", observations: "الملاحظات", fiche: "البطاقة",
      aucun_etudiant: "لا يوجد طلبة بعد. أضيفوهم واحدًا واحدًا، أو الصقوا القائمة المنسوخة من Excel.",
      aucun_resultat: "لا يوجد طالب يطابق «{q}».",
      nouvel_etudiant: "طالب جديد", fiche_etudiant: "بطاقة الطالب",
      confirmer_suppr_etudiant: "حذف {nom} مع حضوره وعلاماته والملاحظات عليه؟",
      infos: "المعلومات", ajouter_obs: "إضافة", aucune_obs: "لا توجد ملاحظات بعد.", texte_obs: "الملاحظة",
      genre_obs: { remarque: "ملاحظة", progres: "تقدّم", difficulte: "صعوبة", participation: "مشاركة" },
      presences: "الحضور", notes: "العلامات", aucune_note: "لا توجد علامات.", aucune_absence: "لا توجد غيابات.",
      liste_titre: "لصق قائمة طلبة",
      liste_aide: "سطر لكل طالب. الصقوا عمودًا أو جدولًا منسوخًا من Excel: اللقب، الاسم، رقم التسجيل، البريد، مفصولة بمسافة جدولة أو فاصلة منقوطة أو فاصلة. يكفي سطر «اللقب الاسم».",
      liste_vers: "في الفوج", liste_apercu: "معاينة", liste_ajouter: "إضافة هؤلاء الطلبة", liste_vide: "الصقوا اسمًا واحدًا على الأقل.",
      seances_vue: "الحصص المعروضة", a_venir: "القادمة", passees: "الماضية", toutes: "الكل",
      nouvelle_seance: "حصة جديدة", generer: "إنشاء الرزنامة", aujourdhui: "اليوم",
      aucune_seance: "لا توجد حصص هنا. أضيفوا حصة، أو أنشئوا رزنامة السداسي لفوج ما.",
      appel: "المناداة", appel_non_fait: "لم تتم المناداة", presents: "حاضرون", ouvrir: "فتح", presenter: "العرض",
      seance: "الحصة", date: "التاريخ", debut: "البداية", fin: "النهاية", genre: "النوع", titre_seance: "الموضوع المقرَّر", diaporama: "العرض التقديمي",
      statut: "الحالة", contenu: "ما تم إنجازه", devoirs: "العمل الشخصي المطلوب",
      genre_seance: { cours: "محاضرة", td: "أعمال موجَّهة", tp: "أعمال تطبيقية", examen: "امتحان", autre: "أخرى" },
      statut_seance: { prevue: "مبرمجة", faite: "أُنجزت", reportee: "مؤجَّلة", annulee: "ملغاة" },
      presence: { present: "حاضر", absent: "غائب", retard: "متأخر", excuse: "غياب مبرَّر" },
      tous_presents: "الكل حاضر", effacer_appel: "مسح المناداة",
      dupliquer: "نسخ (+7 أيام)", decaler: "تأجيل", decaler_aide: "تأجيل هذه الحصة وكل الحصص اللاحقة للفوج بـ",
      jours: "يومًا", confirmer_decaler: "تأجيل الحصص المعنية ({n}) بـ {j} يومًا؟",
      confirmer_suppr_seance: "حذف هذه الحصة ومناداتها؟",
      generer_titre: "إنشاء رزنامة فوج", premiere_date: "تاريخ الحصة الأولى", nb_semaines: "عدد الأسابيع",
      progression: "اتباع تدرّج المقياس (موضوع كل أسبوع وعرضه التقديمي)",
      generer_n: "إنشاء هذه الحصص", deja_seances: "لهذا الفوج حصص سابقة ({n}): تُضاف الحصص الجديدة إليها.",
      semaine: "الأسبوع {n}",
      nouvelle_eval: "تقييم جديد", modifier_eval: "تعديل التقييم", titre_eval: "العنوان", bareme: "العلامة القصوى", coefficient: "المعامل",
      genre_eval: { td: "أعمال موجَّهة", tp: "أعمال تطبيقية", "mini-projet": "مشروع مصغَّر", examen: "امتحان", participation: "مشاركة", autre: "أخرى" },
      aucune_eval: "لا توجد تقييمات. أنشئوا تقييمًا (أعمال موجَّهة، مشروع مصغَّر، امتحان…) ثم أدخلوا العلامات في الجدول.",
      moyenne_groupe: "المعدل", etudiant: "الطالب", note_invalide: "علامة بين 0 و{b}.",
      confirmer_suppr_eval: "حذف التقييم «{t}» وكل علاماته؟",
      ou_donnees: "أين بياناتكم؟", fichier: "الملف", taille: "الحجم",
      sauvegardes: "نسخة احتياطية كل يوم في {dossier} (عددها الآن: {n}).",
      navigateur_explication: "لم تُفتح هذه الصفحة عبر run.bat: القاعدة محفوظة في هذا المتصفح وعلى هذا الحاسوب فقط. نزّلوا منها نسخة من حين لآخر، أو شغّلوا run.bat لحفظها في الملف donnees/classe.sqlite.",
      telecharger_base: "تنزيل القاعدة (.sqlite)", importer_base: "استيراد قاعدة (.sqlite)",
      confirmer_import: "استبدال كل البيانات الحالية ببيانات «{f}»؟",
      import_invalide: "هذا الملف ليس قاعدة «أفواجي».", import_ok: "استُوردت القاعدة.",
      exports: "تصدير إلى \u2066Excel (CSV)\u2069", csv_etudiants: "الطلبة", csv_seances: "دفتر النصوص", csv_presences: "الحضور",
      csv_notes: "العلامات", csv_observations: "الملاحظات",
      python_titre: "قراءة القاعدة ببايثون",
      python_aide: "القاعدة ملف SQLite عادي، تقرؤه مكتبة pandas في بضعة أسطر كما في الفصل 2:",
      tables_titre: "جداول القاعدة",
      tables_aide: {
        groupe: "الأفواج: الاسم، التوقيت، القاعة، موضوع المشروع المصغَّر",
        etudiant: "الطلبة وأفواجهم",
        observation: "الملاحظات المؤرَّخة على كل طالب",
        seance: "الحصص: التاريخ، التوقيت، الموضوع المقرَّر، ما تم إنجازه، العمل المطلوب",
        presence: "المناداة: سطر لكل طالب في كل حصة",
        evaluation: "التقييمات: العنوان، العلامة القصوى، المعامل",
        note: "العلامات: سطر لكل طالب في كل تقييم",
        conge: "العطل والأعياد: لا تُنشأ فيها أيّ حصة",
        reglage: "الإعدادات: حدود الغيابات، بداية السداسي الثاني"
      },
      vie_privee_titre: "المعطيات الشخصية",
      vie_privee: "الأسماء والعلامات والملاحظات معطيات شخصية لطلبتكم (القانون 18-07). تبقى على هذا الحاسوب: لا يُرسل شيء عبر الإنترنت، والمجلد donnees/ مستثنى من git.",
      tout_effacer: "مسح كل شيء", confirmer_effacer: "مسح كل شيء: الأفواج والطلبة والحصص والحضور والعلامات؟ اكتبوا «مسح» للتأكيد.",
      mot_effacer: "مسح",
      resume: "{g} · {e} · القادمة: {p} · المنجزة: {f}",
      emargement_titre: "ورقة الحضور", signature: "الإمضاء", cours: "الذكاء الاصطناعي · ماستر الأدب العام والمقارن",
      num: "الرقم",
      mp: ["تحليل المشاعر في شبكات التواصل الاجتماعي", "عنقدة السلوكيات الاجتماعية في الاستبيانات",
           "استخراج المعلومات من الخطابات السياسية", "النمذجة التنبؤية انطلاقًا من بيانات الاستهلاك",
           "تحليل الشبكات الاجتماعية"],
      sujet_court: "الموضوع {n}",
      plan: [
        ["الفصل 1: التعريفات، التاريخ، وكلاء الذكاء الاصطناعي، أنواع التعلّم", "seance-1"],
        ["الفصل 2: ورشة صياغة الأوامر؛ أساسيات بايثون، NumPy وpandas", "seance-4"],
        ["الفصل 2: الكائنات، الملفات النصية، التقارير؛ توزيع مواضيع المشروع المصغَّر", "seance-5"],
        ["الفصل 3: الذكاء الرمزي، الأنظمة الخبيرة، التسلسل الأمامي", "seance-6"],
        ["الفصل 3: التعلّم الآلي، التصنيف، k-المتوسطات", "seance-7"],
        ["الفصل 3: الانحدار الخطي، الانحدار التدرّجي", "seance-7"],
        ["الفصل 3: التعلّم العميق؛ المائدة المستديرة 2", ""],
        ["الفصل 3: المحوّلات وتوليد النصوص", "seance-8"],
        ["الفصل 3: التعلّم المعزَّز، التركيب؛ المائدة المستديرة 3", ""],
        ["مناقشة المشاريع المصغَّرة", "mini-projet"],
        ["المائدة المستديرة 4: آفاق الذكاء الاصطناعي؛ تركيب المقياس", ""],
        ["مراجعة؛ امتحان تجريبي", ""],
        ["الامتحان (في التاريخ الذي تحدّده الكلية)", ""]
      ],
      onglet_presences: "الحضور والغياب", aujourdhui_titre: "اليوم · {date}", aucune_seance_auj: "لا توجد حصة اليوم.",
      prochaine_le: "الحصة القادمة: {d} · {g}.", faire_appel: "تسجيل الحضور", modifier_appel: "تعديل الحضور",
      appel_fait: "سُجّل الحضور: {p} من {n} حاضرون", en_cours: "جارية الآن", a_faire: "لم يُسجَّل الحضور",
      appels_retard: "حصص فاتها تسجيل الحضور", appels_retard_aide: "حصص مضت دون تسجيل الحضور: سجّلوه الآن، أو اعتبروا الحصة ملغاة.",
      annee_invitation: "لا توجد حصص مبرمجة. أنشئوا دفعة واحدة حصص السنة لكل أفواجكم، كلٌّ في يومه وتوقيته، دون العطل والأعياد.",
      preparer_annee: "تحضير السنة", annee_titre: "تحضير السنة: حصة كل أسبوع لكل فوج",
      annee_aide: "يحصل كل فوج مؤشَّر على حصة كل أسبوع، في يومه وتوقيته، من اليوم الأول إلى اليوم الأخير، ما عدا العطل والأعياد المذكورة أدناه.",
      premier_jour: "اليوم الأول", dernier_jour: "اليوم الأخير", groupes_concernes: "الأفواج",
      remplacer: "تعويض الحصص المبرمجة التي لم يُسجَّل فيها الحضور ابتداءً من اليوم الأول ({n})", sautees: "أسابيع متخطّاة بسبب العطل: {n}",
      creer_seances: "إنشاء الحصص ({n})", aucun_groupe_horaire: "حدّدوا أولًا يومًا وتوقيتًا لأفواجكم (قسم الأفواج).",
      conges: "العطل والأعياد", conge_libelle: "التسمية", conge_exemple: "عطلة الشتاء", du: "من", au: "إلى", du_au: "من {d1} إلى {d2}",
      ajouter_conge: "إضافة", aucun_conge: "لا توجد فترات.",
      conges_aide: "لا تُنشأ أيّ حصة خلال هذه الفترات. أضيفوا عطلتي الشتاء والربيع حين تنشر الكلية رزنامتها. تواريخ الأعياد الدينية تقريبية: صحّحوها عند الحاجة.",
      changer_horaire: "تغيير التوقيت", horaire_titre: "تغيير توقيت فوج", a_partir_du: "ابتداءً من", nouveau_jour: "اليوم الجديد",
      horaire_apercu: "ستنتقل الحصص المبرمجة ({n}) من «{avant}» إلى «{apres}».", horaire_aucune: "لا توجد حصص مبرمجة لنقلها: يتغيّر توقيت الفوج فقط.",
      appliquer: "تطبيق", confirmer_horaire_groupe: "تطبيق هذا التوقيت الجديد أيضًا على الحصص المبرمجة ({n}) ابتداءً من اليوم؟",
      horaire_conge: "تصادف عطلة: أُلغيت",
      periode: "الفترة", semestre1: "السداسي الأول", semestre2: "السداسي الثاني", annee: "السنة كاملة",
      registre: "سجلّ الحضور", choisir_groupe: "اختاروا فوجًا أعلاه لعرض سجلّ حضوره.",
      lettres: { present: "ح", absent: "غ", excuse: "م", retard: "ت" },
      col_presents: "حضور", col_absences: "غيابات", col_justifiees: "مبرَّرة", col_retards: "تأخّرات", taux: "نسبة الحضور",
      seances_faites: "الحصص المنجزة", en_alerte: "إنذار", exclus: "إقصاء", a_suivre: "طلبة يستدعون المتابعة", aucun_suivi: "لا يوجد طالب في حالة إنذار خلال هذه الفترة.",
      niveau: { alerte: "إنذار", exclusion: "بلغ حدّ الإقصاء" },
      regles: "قواعد المواظبة", seuil_alerte: "إنذار ابتداءً من … غيابات غير مبرَّرة", seuil_exclusion: "إقصاء ابتداءً من … غيابات غير مبرَّرة",
      seuil_total: "… أو ابتداءً من … غيابات إجمالًا (مبرَّرة أو لا)", debut_s2: "بداية السداسي الثاني",
      regles_aide: "قاعدة شائعة التطبيق: الإقصاء من المقياس بعد 3 غيابات غير مبرَّرة أو 5 غيابات إجمالًا في الأعمال الموجَّهة. تحقّقوا من نظام كليتكم. تُحسب الإنذارات على السداسي.",
      legende: "ح حاضر · غ غائب · م غياب مبرَّر · ت متأخر · خانة فارغة: لم يُسجَّل الحضور. انقروا على خانة لتغييرها.",
      ajouter_rapide: "إضافة طالب إلى هذا الفوج", exemple_nom: "اللقب الاسم", ajouter_court: "إضافة",
      defaut_present: "الجميع حاضرون افتراضيًا: انقروا على الغائبين فقط.", seance_annulee: "حصة ملغاة",
      confirmer_annulee: "اعتبار هذه الحصة ملغاة؟ يُحذف تسجيل حضورها ولا تُحتسب في المواظبة.",
      enregistrer_appel: "حفظ الحضور", cumul: "السداسي: غ {a} · م {j}",
      rappel_en_cours: "حصة جارية الآن: {g} {h}", rappel_a_faire: "حضور لم يُسجَّل: {g} {h}",
      imprimer_registre: "طباعة السجلّ", semaine_courte: "أ{n}",
      conges_defaut: { revolution: "عيد الثورة", nouvel_an: "رأس السنة الميلادية", yennayer: "يناير، رأس السنة الأمازيغية", travail: "عيد العمال", independance: "عيد الاستقلال",
        fitr: "عيد الفطر (تواريخ تقريبية)", adha: "عيد الأضحى (تواريخ تقريبية)", moharram: "رأس السنة الهجرية (تاريخ تقريبي)", achoura: "عاشوراء (تاريخ تقريبي)" },
      formes: {
        /* صفر، واحد، اثنان، 3–10، 11–99، غير ذلك */
        groupe: ["لا أفواج", "فوج واحد", "فوجان", "{n} أفواج", "{n} فوجًا", "{n} فوج"],
        etudiant: ["لا طلبة", "طالب واحد", "طالبان", "{n} طلبة", "{n} طالبًا", "{n} طالب"],
        seance: ["لا حصص", "حصة واحدة", "حصتان", "{n} حصص", "{n} حصة", "{n} حصة"]
      }
    }
  };
  var T = TEXTES[LANGUE] || TEXTES.fr;

  function tpl(texte, valeurs) {
    return String(texte).replace(/\{(\w+)\}/g, function (m, k) { return valeurs && valeurs[k] != null ? valeurs[k] : m; });
  }
  function nombre(n) { return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(n); }
  function compte(n, cle) {
    var f = T.formes[cle];
    if (f.length === 2) return nombre(n) + " " + ((LANGUE === "en" ? n !== 1 : n > 1) ? f[1] : f[0]);
    var r = n % 100, i = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : r >= 3 && r <= 10 ? 3 : r >= 11 && r <= 99 ? 4 : 5;
    return tpl(f[i], { n: nombre(n) });
  }

  /* ---------- Petits outils ---------- */

  function h(balise, props) {
    var el = document.createElement(balise);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "value") el.value = v;
        else if (k === "checked") el.checked = !!v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
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
    s.setAttribute("class", "icone");
    s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(SVG, "use");
    u.setAttribute("href", "#" + nom);
    s.appendChild(u);
    return s;
  }
  function bouton(texte, action, options) {
    options = options || {};
    return h("button", { type: "button", class: "bouton bouton--petit" + (options.classe ? " " + options.classe : ""),
      onclick: action, title: options.titre, "aria-pressed": options.presse }, options.icone ? icone(options.icone) : null, texte);
  }
  function champ(libelle, controle, classe) {
    var id = controle.id || ("c-" + Math.random().toString(36).slice(2, 9));
    controle.id = id;
    return h("div", { class: "champ" + (classe ? " " + classe : "") }, h("label", { for: id, text: libelle }), controle);
  }
  function saisie(nom, valeur, type, options) {
    options = options || {};
    return h("input", { type: type || "text", name: nom, value: valeur == null ? "" : valeur, required: options.requis,
      autocomplete: "off", inputmode: options.inputmode, min: options.min, max: options.max, step: options.step, dir: options.dir });
  }
  function zoneTexte(nom, valeur, lignes) { return h("textarea", { name: nom, rows: lignes || 3, value: valeur || "" }); }
  function liste(nom, options, valeur) {
    var s = h("select", { name: nom });
    options.forEach(function (o) {
      var opt = h("option", { value: String(o[0]), text: o[1] });
      if (String(o[0]) === String(valeur == null ? "" : valeur)) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  }
  function lireFormulaire(form) {
    var r = {};
    Array.prototype.forEach.call(form.elements, function (e) {
      if (!e.name) return;
      r[e.name] = e.type === "checkbox" ? e.checked : e.value.trim();
    });
    return r;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function aujourdhui() { return isoDate(new Date()); }
  function versDate(iso) { var p = String(iso).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function plusJours(iso, n) { var d = versDate(iso); d.setDate(d.getDate() + n); return isoDate(d); }
  function dateValide(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(versDate(iso).getTime()); }
  function formatDate(iso, options) {
    if (!dateValide(iso)) return iso || "";
    return new Intl.DateTimeFormat(LOCALE, options || { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(versDate(iso));
  }
  function heureMaintenant() { return new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()); }
  var trieur = new Intl.Collator(LOCALE, { sensitivity: "base", numeric: true });
  function nomJour(j, format) { return new Intl.DateTimeFormat(LOCALE, { weekday: format || "long" }).format(new Date(2024, 0, 7 + (+j), 12)); }
  function aUnJour(g) { return g && g.jour != null && g.jour !== ""; }
  function horaireGroupe(g) {
    if (!aUnJour(g)) return g.horaire || T.horaire_vide;
    return nomJour(g.jour) + (g.debut ? " " + g.debut + (g.fin ? "–" + g.fin : "") : "");
  }
  function premierJour(iso, jour) { var d = versDate(iso); while (d.getDay() !== +jour) d.setDate(d.getDate() + 1); return isoDate(d); }
  function nomComplet(e) { return (e.nom + " " + (e.prenom || "")).trim(); }
  function parNom(a, b) { return trieur.compare(a.nom, b.nom) || trieur.compare(a.prenom || "", b.prenom || ""); }
  function lireLocal(cle) { try { return window.localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrireLocal(cle, v) { try { window.localStorage.setItem(cle, v); } catch (e) { /* stockage indisponible */ } }
  function teinte(i) { return "teinte-" + COULEURS[((+i || 0) % COULEURS.length + COULEURS.length) % COULEURS.length]; }
  function taille(octets) { return octets < 1024 ? octets + " o" : octets < 1048576 ? nombre(octets / 1024) + " Ko" : nombre(octets / 1048576) + " Mo"; }
  function chargerScript(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { ko(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function telecharger(nom, contenu, type) {
    var url = URL.createObjectURL(new Blob([contenu], { type: type }));
    var a = h("a", { href: url, download: nom });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csv(lignes) {
    return "﻿" + lignes.map(function (l) {
      return l.map(function (v) {
        v = v == null ? "" : String(v);
        if (/^[=+@]/.test(v)) v = "'" + v;   // pas de formule involontaire dans Excel
        return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(";");
    }).join("\r\n") + "\r\n";
  }
  function lireNote(texte) {
    texte = String(texte).trim().replace(",", ".");
    if (texte === "") return null;
    var v = Number(texte);
    return isFinite(v) ? v : NaN;
  }

  /* ---------- Base SQLite ---------- */

  var SQL = null, db = null;
  var SCHEMA = [
    "CREATE TABLE groupe (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, horaire TEXT NOT NULL DEFAULT '', salle TEXT NOT NULL DEFAULT '', sujet INTEGER NOT NULL DEFAULT 0, couleur INTEGER NOT NULL DEFAULT 0, remarque TEXT NOT NULL DEFAULT '', ordre INTEGER NOT NULL DEFAULT 0)",
    "CREATE TABLE etudiant (id INTEGER PRIMARY KEY, groupe_id INTEGER REFERENCES groupe(id) ON DELETE SET NULL, nom TEXT NOT NULL, prenom TEXT NOT NULL DEFAULT '', matricule TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', telephone TEXT NOT NULL DEFAULT '', responsable INTEGER NOT NULL DEFAULT 0, remarque TEXT NOT NULL DEFAULT '', cree_le TEXT NOT NULL DEFAULT (datetime('now', 'localtime')))",
    "CREATE TABLE observation (id INTEGER PRIMARY KEY, etudiant_id INTEGER NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE, date TEXT NOT NULL, genre TEXT NOT NULL DEFAULT 'remarque', texte TEXT NOT NULL)",
    "CREATE TABLE seance (id INTEGER PRIMARY KEY, groupe_id INTEGER NOT NULL REFERENCES groupe(id) ON DELETE CASCADE, date TEXT NOT NULL, debut TEXT NOT NULL DEFAULT '', fin TEXT NOT NULL DEFAULT '', salle TEXT NOT NULL DEFAULT '', genre TEXT NOT NULL DEFAULT 'cours', titre TEXT NOT NULL DEFAULT '', diaporama TEXT NOT NULL DEFAULT '', statut TEXT NOT NULL DEFAULT 'prevue', contenu TEXT NOT NULL DEFAULT '', devoirs TEXT NOT NULL DEFAULT '', remarque TEXT NOT NULL DEFAULT '')",
    "CREATE TABLE presence (seance_id INTEGER NOT NULL REFERENCES seance(id) ON DELETE CASCADE, etudiant_id INTEGER NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE, statut TEXT NOT NULL DEFAULT 'present', PRIMARY KEY (seance_id, etudiant_id))",
    "CREATE TABLE evaluation (id INTEGER PRIMARY KEY, titre TEXT NOT NULL, genre TEXT NOT NULL DEFAULT 'td', date TEXT NOT NULL DEFAULT '', bareme REAL NOT NULL DEFAULT 20, coefficient REAL NOT NULL DEFAULT 1)",
    "CREATE TABLE note (evaluation_id INTEGER NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE, etudiant_id INTEGER NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE, valeur REAL, commentaire TEXT NOT NULL DEFAULT '', PRIMARY KEY (evaluation_id, etudiant_id))",
    "CREATE INDEX etudiant_groupe ON etudiant(groupe_id)",
    "CREATE INDEX observation_etudiant ON observation(etudiant_id)",
    "CREATE INDEX seance_groupe_date ON seance(groupe_id, date)",
    "CREATE INDEX presence_etudiant ON presence(etudiant_id)",
    "CREATE INDEX note_etudiant ON note(etudiant_id)"
  ];

  function tout(sql, params) {
    var st = db.prepare(sql), r = [];
    try {
      st.bind(params || []);
      while (st.step()) r.push(st.getAsObject());
    } finally { st.free(); }
    return r;
  }
  function un(sql, params) { return tout(sql, params)[0] || null; }
  function executer(sql, params) { db.run(sql, params || []); }
  function dernierId() { return un("SELECT last_insert_rowid() AS id").id; }
  function transaction(fn) {
    db.run("BEGIN");
    try { fn(); db.run("COMMIT"); } catch (e) { db.run("ROLLBACK"); throw e; }
    modifie();
  }

  function creerBase() {
    db.run("PRAGMA foreign_keys = ON");
    SCHEMA.forEach(function (s) { db.run(s); });
    db.run("PRAGMA user_version = 1");
    migrer();
    EMPLOI.forEach(function (g, i) {
      executer("INSERT INTO groupe (nom, specialite, jour, debut, fin, salle, couleur, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [g.nom, g.specialite, g.jour, g.debut, g.fin, SALLE_EMPLOI, i, i + 1]);
    });
  }
  // Version 2 : chaque groupe a une spécialité, un jour et un horaire (l'emploi du temps).
  // Version 3 : vacances et jours fériés (conge), réglages de l'assiduité (reglage).
  function migrer() {
    var v = un("PRAGMA user_version").user_version;
    if (v >= 3) return false;
    if (v < 2) {
      ["jour INTEGER", "debut TEXT NOT NULL DEFAULT ''", "fin TEXT NOT NULL DEFAULT ''", "specialite TEXT NOT NULL DEFAULT ''"].forEach(function (c) {
        db.run("ALTER TABLE groupe ADD COLUMN " + c);
      });
    }
    db.run("CREATE TABLE IF NOT EXISTS conge (id INTEGER PRIMARY KEY, debut TEXT NOT NULL, fin TEXT NOT NULL, libelle TEXT NOT NULL DEFAULT '')");
    db.run("CREATE TABLE IF NOT EXISTS reglage (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL)");
    if (!un("SELECT COUNT(*) AS n FROM conge").n) congesParDefaut();
    db.run("PRAGMA user_version = 3");
    return true;
  }
  var baseMigree = false;
  function baseReconnue(base) {
    try {
      var noms = [];
      var st = base.prepare("SELECT name FROM sqlite_master WHERE type = 'table'");
      while (st.step()) noms.push(st.get()[0]);
      st.free();
      return TABLES.every(function (t) { return noms.indexOf(t) >= 0; });
    } catch (e) { return false; }
  }
  function ouvrirBase(octets) {
    if (db) db.close();
    db = octets ? new SQL.Database(octets) : new SQL.Database();
    if (!octets) { creerBase(); return true; }
    if (!baseReconnue(db)) return false;
    db.run("PRAGMA foreign_keys = ON");
    if (migrer()) baseMigree = true;
    return true;
  }
  function exporter() {
    var octets = db.export();
    db.run("PRAGMA foreign_keys = ON");   // export() rouvre la base : les PRAGMA reviennent à leur valeur par défaut
    return octets;
  }

  /* ---------- Stockage : serveur local (run.bat) ou navigateur ---------- */

  var stockage = { mode: "navigateur", version: null, etat: null, enCours: false, sale: false, minuteur: null, erreur: null };

  function detecterServeur() {
    var local = /^https?:$/.test(location.protocol) && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
    if (!local) return Promise.resolve(false);
    return fetch("/api/classe/etat", { cache: "no-store" }).then(function (r) {
      if (!r.ok) return false;
      return r.json().then(function (j) { stockage.etat = j; return true; });
    }).catch(function () { return false; });
  }
  function lireServeur() {
    return fetch("/api/classe", { cache: "no-store" }).then(function (r) {
      stockage.version = r.headers.get("X-Version") || "0";
      if (r.status === 204) return null;
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    });
  }
  function ecrireServeur(octets) {
    return fetch("/api/classe", {
      method: "PUT", body: octets,
      headers: { "Content-Type": "application/vnd.sqlite3", "X-Version-Base": stockage.version || "0" }
    }).then(function (r) {
      if (r.status === 409) { var e = new Error("conflit"); e.conflit = true; throw e; }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().then(function (j) { stockage.etat = j; stockage.version = j.version; });
    });
  }
  function idb() {
    return new Promise(function (ok, ko) {
      if (!window.indexedDB) { ko(new Error("indexedDB")); return; }
      var req = indexedDB.open("lumineux-classe", 1);
      req.onupgradeneeded = function () { req.result.createObjectStore("fichiers"); };
      req.onsuccess = function () { ok(req.result); };
      req.onerror = function () { ko(req.error); };
    });
  }
  function lireNavigateur() {
    return idb().then(function (base) {
      return new Promise(function (ok, ko) {
        var req = base.transaction("fichiers").objectStore("fichiers").get(CLE_IDB);
        req.onsuccess = function () { ok(req.result ? new Uint8Array(req.result) : null); };
        req.onerror = function () { ko(req.error); };
      });
    }).catch(function () { return null; });
  }
  function ecrireNavigateur(octets) {
    return idb().then(function (base) {
      return new Promise(function (ok, ko) {
        var tx = base.transaction("fichiers", "readwrite");
        tx.objectStore("fichiers").put(octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength), CLE_IDB);
        tx.oncomplete = function () { ok(); };
        tx.onerror = function () { ko(tx.error); };
      });
    });
  }

  function modifie() {
    stockage.sale = true;
    afficherEtat();
    clearTimeout(stockage.minuteur);
    stockage.minuteur = setTimeout(enregistrer, 400);
  }
  function enregistrer() {
    if (!stockage.sale || stockage.erreur === "conflit") return;
    if (stockage.enCours) { stockage.minuteur = setTimeout(enregistrer, 300); return; }
    stockage.enCours = true;
    stockage.sale = false;
    afficherEtat();
    var octets = exporter();
    var promesse = stockage.mode === "serveur" ? ecrireServeur(octets) : ecrireNavigateur(octets);
    promesse.then(function () {
      stockage.erreur = null;
      stockage.heure = heureMaintenant();
    }).catch(function (e) {
      stockage.sale = true;
      stockage.erreur = e && e.conflit ? "conflit" : stockage.mode;
    }).then(function () {
      stockage.enCours = false;
      afficherEtat();
    });
  }
  window.addEventListener("beforeunload", function (e) {
    if (stockage.sale || stockage.enCours) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- État de l'interface ---------- */

  var etat = { onglet: "groupes", groupe: 0, vue: "a-venir", recherche: "", periode: "" };
  try {
    var memo = JSON.parse(lireLocal(CLE_ETAT) || "{}");
    ["onglet", "groupe", "vue", "vueGroupes", "periode"].forEach(function (k) { if (memo[k] != null) etat[k] = memo[k]; });
  } catch (e) { /* état illisible : valeurs par défaut */ }
  function memoriser() { ecrireLocal(CLE_ETAT, JSON.stringify({ onglet: etat.onglet, groupe: etat.groupe, vue: etat.vue, vueGroupes: etat.vueGroupes, periode: etat.periode })); }

  var zones = {};
  function construireCadre() {
    vider(racine);
    zones.etat = h("div", { class: "classe-etat", role: "status", "aria-live": "polite" });
    zones.alerte = h("div", { class: "classe-alerte", hidden: true, role: "alert" });
    zones.resume = h("p", { class: "classe-resume" });
    zones.rappel = h("div", { class: "classe-rappel", role: "status", hidden: true });
    zones.onglets = h("div", { class: "onglets", role: "tablist", "aria-label": T.onglets });
    zones.filtre = h("div", { class: "filtre-groupes", role: "group", "aria-label": T.filtre });
    zones.panneau = h("div", { class: "classe-panneau", role: "tabpanel", id: "classe-panneau" });
    zones.fenetre = h("dialog", { class: "fenetre", "aria-labelledby": "fenetre-titre" });
    zones.fenetre.addEventListener("close", function () { vider(zones.fenetre); });
    ajouter(racine, [zones.etat, zones.alerte, zones.resume, zones.rappel, zones.onglets, zones.filtre, zones.panneau]);
    document.body.appendChild(zones.fenetre);
  }

  function afficherEtat() {
    if (!zones.etat) return;
    vider(zones.etat);
    var serveur = stockage.mode === "serveur";
    var texte = serveur ? T.mode_serveur : T.mode_navigateur;
    ajouter(zones.etat, [icone("i-base"), h("span", { class: "classe-etat__mode" }, texte,
      serveur && stockage.etat ? [" : ", h("code", { dir: "ltr", text: stockage.etat.chemin })] : [" · ", T.mode_navigateur_aide])]);
    var statut = stockage.enCours ? T.enregistrement : stockage.sale ? T.non_enregistre : stockage.heure ? tpl(T.enregistre, { h: stockage.heure }) : "";
    if (statut) ajouter(zones.etat, h("span", { class: "classe-etat__statut" + (stockage.sale && !stockage.enCours ? " classe-etat__statut--sale" : "") }, statut));

    vider(zones.alerte);
    zones.alerte.hidden = !stockage.erreur;
    if (stockage.erreur === "conflit") {
      ajouter(zones.alerte, [h("p", { text: T.conflit }), bouton(T.recharger, function () { location.reload(); }, { classe: "bouton--prisme" })]);
    } else if (stockage.erreur) {
      ajouter(zones.alerte, [h("p", { text: stockage.erreur === "serveur" ? T.erreur_serveur : T.erreur_navigateur }),
        h("div", { class: "classe-actions" },
          bouton(T.reessayer, function () { stockage.sale = true; enregistrer(); }, { classe: "bouton--prisme" }),
          bouton(T.telecharger_copie, telechargerBase, { icone: "i-telecharger" }))]);
    }
  }

  /* ---------- Requêtes ---------- */

  function groupes() {
    return tout("SELECT g.*, (SELECT COUNT(*) FROM etudiant e WHERE e.groupe_id = g.id) AS nb FROM groupe g ORDER BY g.ordre, g.id");
  }
  function groupeParId(id) { return un("SELECT * FROM groupe WHERE id = ?", [id]); }
  function nomGroupe(id) { var g = id ? groupeParId(id) : null; return g ? g.nom : T.sans_groupe; }
  function etudiants(filtre) {
    var sql = "SELECT e.*, g.nom AS groupe_nom, g.couleur AS groupe_couleur," +
      " (SELECT COUNT(*) FROM presence p WHERE p.etudiant_id = e.id AND p.statut = 'absent') AS absences," +
      " (SELECT COUNT(*) FROM observation o WHERE o.etudiant_id = e.id) AS nb_obs" +
      " FROM etudiant e LEFT JOIN groupe g ON g.id = e.groupe_id";
    var params = [];
    if (filtre === -1) sql += " WHERE e.groupe_id IS NULL";
    else if (filtre) { sql += " WHERE e.groupe_id = ?"; params.push(filtre); }
    return tout(sql, params).sort(parNom);
  }
  function moyennes() {
    var m = {};
    tout("SELECT n.etudiant_id, n.valeur, ev.bareme, ev.coefficient FROM note n JOIN evaluation ev ON ev.id = n.evaluation_id WHERE n.valeur IS NOT NULL")
      .forEach(function (r) {
        if (!(r.bareme > 0)) return;
        var x = m[r.etudiant_id] || (m[r.etudiant_id] = { somme: 0, coef: 0 });
        x.somme += r.valeur / r.bareme * 20 * r.coefficient;
        x.coef += r.coefficient;
      });
    Object.keys(m).forEach(function (k) { m[k] = m[k].coef > 0 ? m[k].somme / m[k].coef : null; });
    return m;
  }
  function seances(filtre, vue) {
    var sql = "SELECT s.*, g.nom AS groupe_nom, g.couleur AS groupe_couleur," +
      " (SELECT COUNT(*) FROM presence p WHERE p.seance_id = s.id) AS nb_appel," +
      " (SELECT COUNT(*) FROM presence p WHERE p.seance_id = s.id AND p.statut IN ('present', 'retard')) AS nb_presents" +
      " FROM seance s JOIN groupe g ON g.id = s.groupe_id WHERE 1 = 1";
    var params = [];
    if (filtre > 0) { sql += " AND s.groupe_id = ?"; params.push(filtre); }
    if (vue === "a-venir") { sql += " AND s.date >= ?"; params.push(aujourdhui()); }
    if (vue === "passees") { sql += " AND s.date < ?"; params.push(aujourdhui()); }
    sql += vue === "passees" ? " ORDER BY s.date DESC, s.debut DESC, g.ordre" : " ORDER BY s.date, s.debut, g.ordre";
    return tout(sql, params);
  }

  /* ---------- Rendu général ---------- */

  var ONGLETS = [["groupes", "onglet_groupes", "i-groupe"], ["etudiants", "onglet_etudiants", "i-fiche"],
    ["seances", "onglet_seances", "i-calendrier"], ["presences", "onglet_presences", "i-horloge"], ["notes", "onglet_notes", "i-coche"], ["donnees", "onglet_donnees", "i-base"]];

  function rendre() {
    if (!ONGLETS.some(function (o) { return o[0] === etat.onglet; })) etat.onglet = "groupes";
    var gs = groupes();
    if (etat.groupe > 0 && !gs.some(function (g) { return g.id === etat.groupe; })) etat.groupe = 0;
    memoriser();

    var nbEtudiants = un("SELECT COUNT(*) AS n FROM etudiant").n;
    var nbAvenir = un("SELECT COUNT(*) AS n FROM seance WHERE date >= ? AND statut IN ('prevue', 'reportee')", [aujourdhui()]).n;
    var nbFaites = un("SELECT COUNT(*) AS n FROM seance WHERE statut = 'faite'").n;
    resumerPourAccueil(gs.length, nbEtudiants);
    zones.resume.textContent = tpl(T.resume, { g: compte(gs.length, "groupe"), e: compte(nbEtudiants, "etudiant"),
      p: T.formes.avenir ? compte(nbAvenir, "avenir") : nombre(nbAvenir), f: T.formes.faite ? compte(nbFaites, "faite") : nombre(nbFaites) });

    vider(zones.onglets);
    ONGLETS.forEach(function (o) {
      var actif = etat.onglet === o[0];
      zones.onglets.appendChild(h("button", { type: "button", role: "tab", class: "onglet", "aria-selected": actif ? "true" : "false",
        "aria-controls": "classe-panneau", tabindex: actif ? "0" : "-1", "data-onglet": o[0],
        onclick: function () { changerOnglet(o[0]); } }, icone(o[2]), T[o[1]]));
    });

    vider(zones.filtre);
    zones.filtre.hidden = etat.onglet === "groupes" || etat.onglet === "donnees";
    if (!zones.filtre.hidden) {
      var sansGroupe = un("SELECT COUNT(*) AS n FROM etudiant WHERE groupe_id IS NULL").n;
      var choix = [[0, T.tous, null]].concat(gs.map(function (g) { return [g.id, g.nom, g.couleur]; }));
      var parSeance = etat.onglet === "seances" || etat.onglet === "presences";
      if (sansGroupe && !parSeance) choix.push([-1, T.sans_groupe, null]);
      if (etat.groupe === -1 && parSeance) etat.groupe = 0;
      choix.forEach(function (c) {
        zones.filtre.appendChild(h("button", { type: "button", class: "filtre-groupe" + (c[2] != null ? " " + teinte(c[2]) : ""),
          "aria-pressed": etat.groupe === c[0] ? "true" : "false", onclick: function () { etat.groupe = c[0]; rendre(); } },
          c[2] != null ? h("span", { class: "pastille-couleur", "aria-hidden": "true" }) : null, c[1]));
      });
    }

    vider(zones.panneau);
    zones.panneau.setAttribute("aria-label", T["onglet_" + etat.onglet]);
    ({ groupes: rendreGroupes, etudiants: rendreEtudiants, seances: rendreSeances, presences: rendrePresences, notes: rendreNotes, donnees: rendreDonnees })[etat.onglet](zones.panneau);
    majRappel();
  }
  // Un petit résumé pour la page d'accueil, qui l'affiche sans charger la base (aucune attente).
  function resumerPourAccueil(nbGroupes, nbEtudiants) {
    var s = un("SELECT s.date, s.debut, g.nom AS groupe, s.titre FROM seance s JOIN groupe g ON g.id = s.groupe_id " +
      "WHERE s.date >= ? AND s.statut IN ('prevue', 'reportee') ORDER BY s.date, s.debut LIMIT 1", [aujourdhui()]);
    ecrireLocal("lx-classe-resume", JSON.stringify({ groupes: nbGroupes, etudiants: nbEtudiants, prochaine: s }));
  }
  function changerOnglet(nom, groupe) {
    etat.onglet = nom;
    if (groupe != null) etat.groupe = groupe;
    rendre();
    var b = zones.onglets.querySelector('[data-onglet="' + nom + '"]');
    if (b) b.focus();
  }
  // Onglets au clavier : flèches, Début, Fin.
  function clavierOnglets(e) {
    var i = ONGLETS.map(function (o) { return o[0]; }).indexOf(etat.onglet), n = ONGLETS.length;
    var rtl = document.documentElement.dir === "rtl";
    var suivant = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (suivant) i = (i + suivant + n) % n;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else return;
    e.preventDefault();
    changerOnglet(ONGLETS[i][0]);
  }

  /* ---------- Onglet Groupes ---------- */

  function rendreGroupes(p) {
    var gs = groupes();
    var auj = aujourdhui();
    var vues = h("div", { class: "segmente", role: "group", "aria-label": T.onglet_groupes });
    [["cartes", T.vue_cartes], ["emploi", T.vue_emploi]].forEach(function (v) {
      vues.appendChild(h("button", { type: "button", "aria-pressed": (etat.vueGroupes || "cartes") === v[0] ? "true" : "false",
        onclick: function () { etat.vueGroupes = v[0]; rendre(); }, text: v[1] }));
    });
    ajouter(p, h("div", { class: "classe-outils" }, vues,
      bouton(T.ajouter_groupe, function () { fenetreGroupe(null); }, { icone: "i-plus", classe: "bouton--prisme" }),
      h("p", { class: "classe-aide", text: etat.vueGroupes === "emploi" ? T.emploi_aide : T.glisser })));
    if (etat.vueGroupes === "emploi") { rendreEmploi(p, gs); return; }
    var grille = h("div", { class: "grille-groupes" });
    var sansGroupe = etudiants(-1);
    gs.forEach(function (g) { grille.appendChild(carteGroupe(g, etudiants(g.id), auj)); });
    if (sansGroupe.length) grille.appendChild(carteGroupe(null, sansGroupe, auj));
    p.appendChild(grille);
  }

  // La semaine en grille, comme l'emploi du temps papier : un jour par ligne, un créneau par colonne.
  function rendreEmploi(p, gs) {
    var creneaux = CRENEAUX.map(function (c) { return c.slice(); });
    gs.forEach(function (g) {
      if (aUnJour(g) && g.debut && !creneaux.some(function (c) { return c[0] === g.debut; })) creneaux.push([g.debut, g.fin]);
    });
    creneaux.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var jours = [0, 1, 2, 3, 4].concat([5, 6].filter(function (j) { return gs.some(function (g) { return aUnJour(g) && +g.jour === j; }); }));
    var table = h("table", { class: "tableau tableau--emploi" },
      h("thead", null, h("tr", null, h("th", { scope: "col", text: T.jour }), creneaux.map(function (c) {
        return h("th", { scope: "col", dir: "ltr", text: c[0] + "–" + c[1] });
      }))),
      h("tbody", null, jours.map(function (j) {
        return h("tr", null, h("th", { scope: "row", text: nomJour(j) }), creneaux.map(function (c) {
          var ici = gs.filter(function (g) { return aUnJour(g) && +g.jour === j && g.debut === c[0]; });
          return h("td", null, ici.map(function (g) {
            return h("button", { type: "button", class: "case-emploi " + teinte(g.couleur), onclick: function () { fenetreGroupe(g.id); } },
              h("strong", { text: g.nom }), g.salle ? h("span", { text: g.salle }) : null,
              h("span", { text: compte(g.nb, "etudiant") }));
          }));
        }));
      })));
    ajouter(p, h("div", { class: "tableau-defilant" }, table));
    var sans = gs.filter(function (g) { return !aUnJour(g); });
    if (sans.length) p.appendChild(h("p", { class: "classe-aide" }, T.sans_horaire + " : ", sans.map(function (g, i) {
      return [i ? ", " : "", h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreGroupe(g.id); }, text: g.nom })];
    })));
    p.appendChild(h("div", { class: "classe-actions" }, bouton(T.appliquer_emploi, appliquerEmploi, { icone: "i-calendrier" })));
  }
  function appliquerEmploi() {
    if (!window.confirm(T.confirmer_emploi)) return;
    var gs = groupes();
    transaction(function () {
      EMPLOI.forEach(function (e, i) {
        var params = [e.nom, e.specialite, e.jour, e.debut, e.fin, SALLE_EMPLOI];
        if (gs[i]) executer("UPDATE groupe SET nom = ?, specialite = ?, jour = ?, debut = ?, fin = ?, salle = ? WHERE id = ?", params.concat([gs[i].id]));
        else executer("INSERT INTO groupe (nom, specialite, jour, debut, fin, salle, couleur, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(ordre), 0) + 1 FROM groupe))", params.concat([i]));
      });
    });
    rendre();
  }

  function carteGroupe(g, membres, auj) {
    var id = g ? g.id : -1;
    var carte = h("article", { class: "carte-groupe " + (g ? teinte(g.couleur) : "carte-groupe--sans"), "data-groupe": id });
    var tete = h("header", { class: "carte-groupe__tete" },
      h("span", { class: "pastille-couleur", "aria-hidden": "true" }),
      h("h3", { class: "carte-groupe__nom", text: g ? g.nom : T.sans_groupe }),
      g && g.specialite ? h("span", { class: "puce", text: g.specialite }) : null,
      h("span", { class: "carte-groupe__nb", text: compte(membres.length, "etudiant") }));
    carte.appendChild(tete);
    if (g) {
      var prochaine = un("SELECT * FROM seance WHERE groupe_id = ? AND date >= ? AND statut IN ('prevue', 'reportee') ORDER BY date, debut LIMIT 1", [g.id, auj]);
      var derniere = un("SELECT * FROM seance WHERE groupe_id = ? AND statut = 'faite' ORDER BY date DESC, debut DESC LIMIT 1", [g.id]);
      var ass = un("SELECT SUM(p.statut IN ('present', 'retard')) AS ok, COUNT(*) AS n FROM presence p JOIN seance s ON s.id = p.seance_id WHERE s.groupe_id = ?", [g.id]);
      var infos = h("dl", { class: "carte-groupe__infos" });
      function ligne(nom, valeur) { infos.appendChild(h("div", null, h("dt", { text: nom }), h("dd", null, valeur))); }
      ligne(T.horaire, [horaireGroupe(g), g.salle ? " · " + g.salle : ""]);
      if (g.sujet >= 1 && g.sujet <= 5) ligne(T.sujet, tpl(T.sujet_court, { n: g.sujet }) + " · " + T.mp[g.sujet - 1]);
      ligne(T.prochaine, prochaine ? formatDate(prochaine.date, { weekday: "short", day: "numeric", month: "short" }) + (prochaine.debut ? " " + prochaine.debut : "") + (prochaine.titre ? " · " + prochaine.titre : "") : T.aucune);
      ligne(T.derniere, derniere ? formatDate(derniere.date, { day: "numeric", month: "short" }) + " · " + (derniere.contenu || derniere.titre || T.statut_seance.faite) : T.aucune);
      if (ass.n) ligne(T.assiduite, nombre(Math.round(ass.ok / ass.n * 100)) + " %");
      carte.appendChild(infos);
    }
    var ol = h("ol", { class: "carte-groupe__membres" });
    membres.forEach(function (e) {
      ol.appendChild(h("li", { draggable: "true", "data-etudiant": e.id,
        ondragstart: function (ev) { ev.dataTransfer.setData("text/plain", "etudiant:" + e.id); ev.dataTransfer.effectAllowed = "move"; } },
        h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreEtudiant(e.id); } },
          e.responsable ? h("span", { class: "etoile", title: T.responsable }, icone("i-etoile")) : null, nomComplet(e))));
    });
    carte.appendChild(ol);
    carte.addEventListener("dragover", function (ev) { ev.preventDefault(); carte.classList.add("carte-groupe--cible"); });
    carte.addEventListener("dragleave", function () { carte.classList.remove("carte-groupe--cible"); });
    carte.addEventListener("drop", function (ev) {
      ev.preventDefault();
      carte.classList.remove("carte-groupe--cible");
      var m = /^etudiant:(\d+)$/.exec(ev.dataTransfer.getData("text/plain"));
      if (!m) return;
      executer("UPDATE etudiant SET groupe_id = ? WHERE id = ?", [id > 0 ? id : null, +m[1]]);
      modifie();
      rendre();
    });
    if (g) {
      carte.appendChild(h("div", { class: "carte-groupe__actions" },
        bouton(T.voir_etudiants, function () { changerOnglet("etudiants", g.id); }, { icone: "i-fiche", classe: "bouton--discret" }),
        bouton(T.voir_seances, function () { changerOnglet("seances", g.id); }, { icone: "i-calendrier", classe: "bouton--discret" }),
        bouton(T.emargement, function () { imprimerEmargement(g); }, { icone: "i-imprimer", classe: "bouton--discret" }),
        bouton(T.modifier, function () { fenetreGroupe(g.id); }, { icone: "i-crayon", classe: "bouton--discret" })));
    }
    return carte;
  }

  /* ---------- Fenêtres (dialog) ---------- */

  function ouvrirFenetre(titre, corps, boutons, options) {
    var f = zones.fenetre;
    if (f.open) f.close();
    vider(f);
    f.className = "fenetre" + (options && options.large ? " fenetre--large" : "");
    var form = h("form", { class: "fenetre__form", novalidate: true });
    var principal = boutons.filter(function (b) { return b.principal; })[0];
    form.addEventListener("submit", function (e) { e.preventDefault(); if (principal) principal.action(form); });
    ajouter(form, [
      h("header", { class: "fenetre__tete" }, h("h2", { id: "fenetre-titre", text: titre }),
        h("button", { type: "button", class: "bouton-verre", "aria-label": T.fermer, onclick: function () { f.close(); } }, icone("i-fermer"))),
      h("div", { class: "fenetre__corps" }, corps),
      h("p", { class: "fenetre__erreur", role: "alert", hidden: true }),
      h("footer", { class: "fenetre__pied" }, boutons.map(function (b) {
        return h("button", { type: b.principal ? "submit" : "button", class: "bouton bouton--petit" + (b.principal ? " bouton--prisme" : "") + (b.danger ? " bouton--danger" : ""),
          onclick: b.principal ? null : function () { b.action(form); } }, b.icone ? icone(b.icone) : null, b.texte);
      }))
    ]);
    f.appendChild(form);
    if (typeof f.showModal === "function") f.showModal(); else f.setAttribute("open", "");
    var premier = form.querySelector(".fenetre__corps input, .fenetre__corps select, .fenetre__corps textarea");
    if (premier && !(options && options.sansFocus)) premier.focus();
    return form;
  }
  function erreurFenetre(form, texte) {
    var p = form.querySelector(".fenetre__erreur");
    p.textContent = texte;
    p.hidden = false;
  }
  function fermerFenetre() { if (zones.fenetre.open) zones.fenetre.close(); }

  function fenetreGroupe(id) {
    var g = id ? groupeParId(id) : { nom: "", horaire: "", salle: "", sujet: 0, couleur: (un("SELECT COUNT(*) AS n FROM groupe").n) % COULEURS.length, remarque: "",
      specialite: "", jour: null, debut: "", fin: "" };
    var couleurs = h("div", { class: "choix-couleurs", role: "radiogroup", "aria-label": T.couleur });
    COULEURS.forEach(function (c, i) {
      couleurs.appendChild(h("label", { class: "choix-couleur " + teinte(i) },
        h("input", { type: "radio", name: "couleur", value: String(i), checked: +g.couleur === i }),
        h("span", { class: "pastille-couleur" }), h("span", { class: "visuellement-cache", text: c })));
    });
    var sujets = [[0, T.aucun]].concat(T.mp.map(function (t, i) { return [i + 1, tpl(T.sujet_court, { n: i + 1 }) + " · " + t]; }));
    var corps = h("div", { class: "grille-champs" },
      champ(T.nom, saisie("nom", g.nom, "text", { requis: true })),
      champ(T.specialite, h("input", { type: "text", name: "specialite", value: g.specialite || "", list: "liste-specialites", autocomplete: "off" })),
      h("datalist", { id: "liste-specialites" }, ["ANG", "LGC", "DID"].map(function (x) { return h("option", { value: x }); })),
      champ(T.jour, liste("jour", [["", T.aucun]].concat(SEMAINE.map(function (j) { return [j, nomJour(j)]; })), aUnJour(g) ? g.jour : "")),
      champ(T.debut, saisie("debut", g.debut, "time")),
      champ(T.fin, saisie("fin", g.fin, "time")),
      champ(T.salle, saisie("salle", g.salle)),
      champ(T.sujet, liste("sujet", sujets, g.sujet)),
      h("div", { class: "champ" }, h("span", { class: "champ__nom", text: T.couleur }), couleurs),
      champ(T.remarque, zoneTexte("remarque", g.remarque, 3), "champ--large"));
    var boutons = [
      { texte: T.enregistrer, principal: true, action: function (form) {
        var v = lireFormulaire(form);
        var couleur = form.querySelector('input[name="couleur"]:checked');
        if (!v.nom) { erreurFenetre(form, T.nom_obligatoire); return; }
        var params = [v.nom, v.specialite, v.jour === "" ? null : +v.jour, v.debut, v.fin, v.salle, +v.sujet || 0, couleur ? +couleur.value : 0, v.remarque];
        var change = id && v.jour !== "" && (String(g.jour) !== String(v.jour) || g.debut !== v.debut || g.fin !== v.fin || g.salle !== v.salle);
        var aDeplacer = change ? seancesADeplacer(id, aujourdhui()).length : 0;
        if (aDeplacer && window.confirm(tpl(T.confirmer_horaire_groupe, { n: nombre(aDeplacer) }))) deplacerSeances(id, aujourdhui(), +v.jour, v.debut, v.fin, v.salle);
        if (id) executer("UPDATE groupe SET nom = ?, specialite = ?, jour = ?, debut = ?, fin = ?, salle = ?, sujet = ?, couleur = ?, remarque = ? WHERE id = ?", params.concat([id]));
        else executer("INSERT INTO groupe (nom, specialite, jour, debut, fin, salle, sujet, couleur, remarque, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(ordre), 0) + 1 FROM groupe))", params);
        modifie(); fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ];
    if (id) boutons.push({ texte: T.supprimer, danger: true, icone: "i-poubelle", action: function () {
      if (!window.confirm(tpl(T.confirmer_suppr_groupe, { nom: g.nom }))) return;
      executer("DELETE FROM groupe WHERE id = ?", [id]);
      if (etat.groupe === id) etat.groupe = 0;
      modifie(); fermerFenetre(); rendre();
    } });
    ouvrirFenetre(id ? T.modifier_groupe : T.nouveau_groupe, corps, boutons);
  }

  /* ---------- Onglet Étudiants ---------- */

  function rendreEtudiants(p) {
    var recherche = h("input", { type: "search", class: "recherche", placeholder: T.rechercher, "aria-label": T.rechercher, value: etat.recherche });
    var tableau = h("div", { class: "tableau-defilant" });
    recherche.addEventListener("input", function () { etat.recherche = recherche.value; remplir(); });
    ajouter(p, h("div", { class: "classe-outils" },
      h("div", { class: "recherche-boite" }, icone("i-recherche"), recherche),
      bouton(T.ajouter_etudiant, function () { fenetreEtudiant(null); }, { icone: "i-plus", classe: "bouton--prisme" }),
      bouton(T.ajouter_liste, fenetreListe, { icone: "i-copier" }),
      bouton(T.exporter_csv, function () { exporterCsv("etudiants"); }, { icone: "i-telecharger" })));
    p.appendChild(tableau);

    function remplir() {
      vider(tableau);
      var tous = etudiants(etat.groupe);
      var q = etat.recherche.trim().toLowerCase();
      var liste = q ? tous.filter(function (e) { return (e.nom + " " + e.prenom + " " + e.prenom + " " + e.nom + " " + e.matricule + " " + e.email).toLowerCase().indexOf(q) >= 0; }) : tous;
      if (!liste.length) { tableau.appendChild(h("p", { class: "classe-vide", text: q ? tpl(T.aucun_resultat, { q: etat.recherche }) : T.aucun_etudiant })); return; }
      var moy = moyennes();
      var gs = groupes();
      var sem = periodeDe(aujourdhui()), bs = bilans(sem.du, sem.au, 0);
      var t = h("table", { class: "tableau tableau--classe" },
        h("thead", null, h("tr", null, [[T.num, 1], [T.nom], [T.prenom], [T.matricule], [T.groupe], [T.absences, 1], [T.moyenne, 1], [T.observations, 1], [""]].map(function (x) {
          return h("th", { scope: "col", class: x[1] ? "nombre" : null, text: x[0] });
        }))));
      var corps = h("tbody");
      liste.forEach(function (e, i) {
        var choix = liste_groupes(gs, e.groupe_id);
        choix.setAttribute("aria-label", T.groupe + " · " + nomComplet(e));
        choix.addEventListener("change", function () {
          executer("UPDATE etudiant SET groupe_id = ? WHERE id = ?", [choix.value ? +choix.value : null, e.id]);
          modifie();
          if (etat.groupe) rendre();
        });
        corps.appendChild(h("tr", null,
          h("td", { class: "nombre", text: nombre(i + 1) }),
          h("th", { scope: "row" }, e.responsable ? h("span", { class: "etoile", title: T.responsable }, icone("i-etoile")) : null,
            h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreEtudiant(e.id); }, text: e.nom })),
          h("td", { text: e.prenom }),
          h("td", null, h("bdi", { dir: "ltr", text: e.matricule })),
          h("td", null, choix),
          h("td", { class: "nombre" }, e.absences ? nombre(e.absences) : "",
            bs[e.id] && bs[e.id].niveau ? h("span", { class: "puce puce--" + bs[e.id].niveau, title: T.niveau[bs[e.id].niveau], text: T.niveau[bs[e.id].niveau] }) : null),
          h("td", { class: "nombre", text: moy[e.id] != null ? nombre(moy[e.id]) : "" }),
          h("td", { class: "nombre", text: e.nb_obs ? nombre(e.nb_obs) : "" }),
          h("td", null, bouton(T.fiche, function () { fenetreEtudiant(e.id); }, { classe: "bouton--discret" }))));
      });
      t.appendChild(corps);
      tableau.appendChild(t);
    }
    remplir();
  }
  function liste_groupes(gs, valeur) {
    return liste("groupe", [["", T.sans_groupe]].concat(gs.map(function (g) { return [g.id, g.nom]; })), valeur == null ? "" : valeur);
  }

  function fenetreEtudiant(id) {
    var e = id ? un("SELECT * FROM etudiant WHERE id = ?", [id]) : { nom: "", prenom: "", matricule: "", email: "", telephone: "", responsable: 0, remarque: "", groupe_id: etat.groupe > 0 ? etat.groupe : null };
    if (!e) return;
    var gs = groupes();
    var infos = h("div", { class: "grille-champs" },
      champ(T.nom, saisie("nom", e.nom, "text", { requis: true })),
      champ(T.prenom, saisie("prenom", e.prenom)),
      champ(T.matricule, saisie("matricule", e.matricule, "text", { dir: "ltr" })),
      champ(T.groupe, liste_groupes(gs, e.groupe_id)),
      champ(T.email, saisie("email", e.email, "email", { dir: "ltr" })),
      champ(T.telephone, saisie("telephone", e.telephone, "tel", { dir: "ltr" })),
      h("label", { class: "case" }, h("input", { type: "checkbox", name: "responsable", checked: !!e.responsable }), T.responsable),
      champ(T.remarque, zoneTexte("remarque", e.remarque, 2), "champ--large"));
    var corps = [h("section", { class: "fenetre__partie" }, h("h3", { text: T.infos }), infos)];
    if (id) corps.push(partieObservations(id), partiePresences(id), partieNotes(id));

    var boutons = [
      { texte: T.enregistrer, principal: true, action: function (form) {
        var v = lireFormulaire(form);
        if (!v.nom) { erreurFenetre(form, T.nom_obligatoire); return; }
        var params = [v.groupe ? +v.groupe : null, v.nom, v.prenom, v.matricule, v.email, v.telephone, v.responsable ? 1 : 0, v.remarque];
        if (id) executer("UPDATE etudiant SET groupe_id = ?, nom = ?, prenom = ?, matricule = ?, email = ?, telephone = ?, responsable = ?, remarque = ? WHERE id = ?", params.concat([id]));
        else executer("INSERT INTO etudiant (groupe_id, nom, prenom, matricule, email, telephone, responsable, remarque) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", params);
        modifie(); fermerFenetre(); rendre();
      } },
      { texte: T.fermer, action: fermerFenetre }
    ];
    if (id) boutons.push({ texte: T.supprimer, danger: true, icone: "i-poubelle", action: function () {
      if (!window.confirm(tpl(T.confirmer_suppr_etudiant, { nom: nomComplet(e) }))) return;
      executer("DELETE FROM etudiant WHERE id = ?", [id]);
      modifie(); fermerFenetre(); rendre();
    } });
    ouvrirFenetre(id ? nomComplet(e) : T.nouvel_etudiant, corps, boutons, { large: !!id });
  }

  // Les observations sont enregistrées tout de suite : elles ne dépendent pas du bouton « Enregistrer » de la fiche.
  function partieObservations(id) {
    var section = h("section", { class: "fenetre__partie" }, h("h3", { text: T.observations }));
    var date = saisie("obs_date", aujourdhui(), "date");
    var genre = liste("obs_genre", Object.keys(T.genre_obs).map(function (k) { return [k, T.genre_obs[k]]; }), "remarque");
    var texte = h("textarea", { name: "obs_texte", rows: 2 });
    var journal = h("ol", { class: "journal" });
    date.name = genre.name = texte.name = "";   // hors du formulaire de la fiche
    function remplir() {
      vider(journal);
      var obs = tout("SELECT * FROM observation WHERE etudiant_id = ? ORDER BY date DESC, id DESC", [id]);
      if (!obs.length) { journal.appendChild(h("li", { class: "classe-vide", text: T.aucune_obs })); return; }
      obs.forEach(function (o) {
        journal.appendChild(h("li", { class: "journal__entree journal__entree--" + o.genre },
          h("p", { class: "journal__meta" }, h("time", { datetime: o.date, text: formatDate(o.date, { day: "numeric", month: "long", year: "numeric" }) }),
            " · ", T.genre_obs[o.genre] || o.genre),
          h("p", { class: "journal__texte", text: o.texte }),
          h("button", { type: "button", class: "bouton-icone", "aria-label": T.supprimer, title: T.supprimer, onclick: function () {
            executer("DELETE FROM observation WHERE id = ?", [o.id]); modifie(); remplir();
          } }, icone("i-poubelle"))));
      });
    }
    ajouter(section, [
      h("div", { class: "ajout-observation" },
        champ(T.date, date), champ(T.genre, genre), champ(T.texte_obs, texte, "champ--large"),
        bouton(T.ajouter_obs, function () {
          if (!texte.value.trim()) { texte.focus(); return; }
          executer("INSERT INTO observation (etudiant_id, date, genre, texte) VALUES (?, ?, ?, ?)", [id, dateValide(date.value) ? date.value : aujourdhui(), genre.value, texte.value.trim()]);
          modifie(); texte.value = ""; remplir();
        }, { icone: "i-plus" })),
      journal]);
    remplir();
    return section;
  }
  function partiePresences(id) {
    var lignes = tout("SELECT p.statut, s.date, s.titre FROM presence p JOIN seance s ON s.id = p.seance_id WHERE p.etudiant_id = ? ORDER BY s.date DESC", [id]);
    var n = { present: 0, absent: 0, retard: 0, excuse: 0 };
    lignes.forEach(function (l) { if (n[l.statut] != null) n[l.statut]++; });
    var manques = lignes.filter(function (l) { return l.statut !== "present"; });
    var sem = periodeDe(aujourdhui()), b = bilans(sem.du, sem.au, 0)[id];
    return h("section", { class: "fenetre__partie" }, h("h3", { text: T.presences }),
      b ? h("p", { class: "classe-aide" }, (sem.id === "s1" ? T.semestre1 : T.semestre2) + " · " + T.taux + " : " + pourcent(b.taux) + " ",
        b.niveau ? h("span", { class: "puce puce--" + b.niveau, text: T.niveau[b.niveau] }) : null) : null,
      h("p", { class: "bilan-presences" }, Object.keys(n).map(function (k) {
        return h("span", { class: "puce puce--" + k }, T.presence[k] + " : " + nombre(n[k]));
      })),
      manques.length ? h("ul", { class: "liste-simple" }, manques.map(function (l) {
        return h("li", null, h("strong", { text: T.presence[l.statut] }), " · ", formatDate(l.date, { weekday: "short", day: "numeric", month: "short" }), l.titre ? " · " + l.titre : "");
      })) : h("p", { class: "classe-vide", text: T.aucune_absence }));
  }
  function partieNotes(id) {
    var lignes = tout("SELECT ev.titre, ev.bareme, ev.coefficient, ev.date, n.valeur FROM note n JOIN evaluation ev ON ev.id = n.evaluation_id WHERE n.etudiant_id = ? AND n.valeur IS NOT NULL ORDER BY ev.date, ev.id", [id]);
    var moy = moyennes()[id];
    return h("section", { class: "fenetre__partie" }, h("h3", { text: T.notes }),
      lignes.length ? h("ul", { class: "liste-simple" }, lignes.map(function (l) {
        return h("li", null, l.titre + " : ", h("strong", { text: nombre(l.valeur) + " / " + nombre(l.bareme) }), l.coefficient !== 1 ? " (" + T.coefficient + " " + nombre(l.coefficient) + ")" : "");
      }).concat(moy != null ? [h("li", { class: "liste-simple__total" }, T.moyenne + " : ", h("strong", { text: nombre(moy) }))] : []))
        : h("p", { class: "classe-vide", text: T.aucune_note }));
  }

  /* Coller une liste depuis Excel ou un document. */
  function decouperListe(texte) {
    var lignes = texte.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var r = [];
    lignes.forEach(function (l, i) {
      var cols = l.indexOf("\t") >= 0 ? l.split("\t") : l.indexOf(";") >= 0 ? l.split(";") : l.indexOf(",") >= 0 ? l.split(",") : null;
      var nom, prenom = "", matricule = "", email = "";
      if (cols) {
        cols = cols.map(function (c) { return c.trim(); });
        // Numéro d'ordre en première colonne (« 1 », « 12. ») : ignoré.
        if (/^\d{1,3}[.)]?$/.test(cols[0]) && cols.length > 1) cols.shift();
        nom = cols[0]; prenom = cols[1] || ""; matricule = cols[2] || ""; email = cols[3] || "";
      } else {
        var mots = l.replace(/^\d{1,3}[.)-]?\s+/, "").split(/\s+/);
        // « NOM Prénom » : les mots en capitales forment le nom ; sinon le premier mot.
        var n = 0;
        while (n < mots.length - 1 && /[A-ZÀ-Ý]/.test(mots[n]) && mots[n] === mots[n].toUpperCase()) n++;
        if (n === 0) n = 1;
        nom = mots.slice(0, n).join(" "); prenom = mots.slice(n).join(" ");
      }
      // En-tête de tableau (« Nom ; Prénom … ») : ignoré.
      if (i === 0 && /^(nom|name|surname|last ?name|اللقب|الاسم)$/i.test(nom)) return;
      if (nom) r.push({ nom: nom, prenom: prenom, matricule: matricule, email: email });
    });
    return r;
  }
  function fenetreListe() {
    var gs = groupes();
    var zone = h("textarea", { name: "liste", rows: 8, class: "zone-liste", spellcheck: "false" });
    var apercu = h("div", { class: "apercu-liste" });
    function majApercu() {
      vider(apercu);
      var l = decouperListe(zone.value);
      if (!l.length) return;
      apercu.appendChild(h("p", { class: "champ__nom", text: T.liste_apercu + " · " + compte(l.length, "etudiant") }));
      apercu.appendChild(h("div", { class: "tableau-defilant" }, h("table", { class: "tableau tableau--classe" },
        h("thead", null, h("tr", null, [T.nom, T.prenom, T.matricule, T.email].map(function (x) { return h("th", { scope: "col", text: x }); }))),
        h("tbody", null, l.slice(0, 50).map(function (e) {
          return h("tr", null, h("td", { text: e.nom }), h("td", { text: e.prenom }), h("td", { dir: "ltr", text: e.matricule }), h("td", { dir: "ltr", text: e.email }));
        })))));
    }
    zone.addEventListener("input", majApercu);
    var corps = [h("p", { class: "classe-aide", text: T.liste_aide }),
      champ(T.liste_vers, liste_groupes(gs, etat.groupe > 0 ? etat.groupe : (gs[0] ? gs[0].id : ""))),
      champ(T.liste_apercu, zone), apercu];
    ouvrirFenetre(T.liste_titre, corps, [
      { texte: T.liste_ajouter, principal: true, icone: "i-plus", action: function (form) {
        var l = decouperListe(zone.value);
        if (!l.length) { erreurFenetre(form, T.liste_vide); return; }
        var groupe = form.elements.groupe.value ? +form.elements.groupe.value : null;
        transaction(function () {
          l.forEach(function (e) {
            executer("INSERT INTO etudiant (groupe_id, nom, prenom, matricule, email) VALUES (?, ?, ?, ?, ?)", [groupe, e.nom, e.prenom, e.matricule, e.email]);
          });
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ], { large: true });
  }

  /* ---------- Onglet Séances : planning et cahier de textes ---------- */

  function decks() { return Array.isArray(window.LX_DIAPOS) ? window.LX_DIAPOS : []; }
  function titreDeck(id) {
    var d = decks().filter(function (x) { return x.id === id; })[0];
    return d ? (d.numero ? d.numero + ". " : "") + d.titre : id;
  }

  function rendreSeances(p) {
    var vues = h("div", { class: "segmente", role: "group", "aria-label": T.seances_vue });
    [["a-venir", T.a_venir], ["passees", T.passees], ["toutes", T.toutes]].forEach(function (v) {
      vues.appendChild(h("button", { type: "button", "aria-pressed": etat.vue === v[0] ? "true" : "false", onclick: function () { etat.vue = v[0]; rendre(); }, text: v[1] }));
    });
    ajouter(p, h("div", { class: "classe-outils" }, vues,
      bouton(T.nouvelle_seance, function () { fenetreSeance(null); }, { icone: "i-plus", classe: "bouton--prisme" }),
      bouton(T.preparer_annee, fenetreAnnee, { icone: "i-calendrier" }),
      bouton(T.generer, fenetreGenerer, { icone: "i-calendrier" }),
      bouton(T.changer_horaire, function () { fenetreHoraire(etat.groupe); }, { icone: "i-horloge" }),
      bouton(T.exporter_csv, function () { exporterCsv("seances"); }, { icone: "i-telecharger" })));

    var liste = seances(etat.groupe, etat.vue);
    if (!liste.length) { p.appendChild(h("p", { class: "classe-vide", text: T.aucune_seance })); return; }
    var auj = aujourdhui(), mois = null, conteneur = null;
    liste.forEach(function (s) {
      var m = s.date.slice(0, 7);
      if (m !== mois) {
        mois = m;
        p.appendChild(h("h3", { class: "titre-mois", text: formatDate(m + "-01", { month: "long", year: "numeric" }) }));
        conteneur = h("ol", { class: "liste-seances" });
        p.appendChild(conteneur);
      }
      conteneur.appendChild(ligneSeance(s, auj));
    });
  }

  function ligneSeance(s, auj) {
    var d = versDate(s.date);
    var appel = s.nb_appel ? nombre(s.nb_presents) + "/" + nombre(s.nb_appel) + " " + T.presents : (s.statut === "faite" ? T.appel_non_fait : "");
    return h("li", { class: "seance seance--" + s.statut + (s.date === auj ? " seance--aujourdhui" : "") + " " + teinte(s.groupe_couleur) },
      h("div", { class: "seance__date", "aria-hidden": "true" },
        h("span", { class: "seance__jour", text: new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(d) }),
        h("span", { class: "seance__num", text: new Intl.DateTimeFormat(LOCALE, { day: "numeric" }).format(d) }),
        h("span", { class: "seance__mois", text: new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(d) })),
      h("div", { class: "seance__corps" },
        h("p", { class: "seance__meta" },
          h("span", { class: "visuellement-cache", text: formatDate(s.date) }),
          s.date === auj ? h("span", { class: "puce puce--aujourdhui", text: T.aujourdhui }) : null,
          h("span", { class: "puce puce--groupe" }, h("span", { class: "pastille-couleur", "aria-hidden": "true" }), s.groupe_nom),
          h("span", { class: "puce", text: T.genre_seance[s.genre] || s.genre }),
          s.debut ? h("span", { dir: "ltr", text: s.debut + (s.fin ? "–" + s.fin : "") }) : null,
          s.salle ? h("span", { text: s.salle }) : null,
          h("span", { class: "puce puce--" + s.statut, text: T.statut_seance[s.statut] || s.statut })),
        h("p", { class: "seance__titre", text: s.titre || "—" }),
        s.contenu ? h("p", { class: "seance__contenu" }, h("strong", { text: T.contenu + " : " }), s.contenu) : null,
        s.devoirs ? h("p", { class: "seance__contenu" }, h("strong", { text: T.devoirs + " : " }), s.devoirs) : null,
        appel ? h("p", { class: "seance__appel", text: appel }) : null),
      h("div", { class: "seance__actions" },
        bouton(T.ouvrir, function () { fenetreSeance(s.id); }, { icone: "i-crayon" }),
        s.diaporama ? h("a", { class: "bouton bouton--petit bouton--discret", href: "diaporamas.html#" + s.diaporama }, icone("i-ecran"), T.presenter) : null));
  }

  function fenetreSeance(id) {
    var gs = groupes();
    if (!gs.length) return;
    var s = id ? un("SELECT * FROM seance WHERE id = ?", [id]) : {
      groupe_id: etat.groupe > 0 ? etat.groupe : gs[0].id, date: aujourdhui(), debut: "", fin: "", salle: "", genre: "cours",
      titre: "", diaporama: "", statut: "prevue", contenu: "", devoirs: "", remarque: "" };
    if (!s) return;
    if (!id) { var gg = groupeParId(s.groupe_id); if (gg) s.salle = gg.salle; }
    var optionsDecks = [["", T.aucun]].concat(decks().map(function (d) { return [d.id, (d.numero ? d.numero + ". " : "") + d.titre]; }));
    if (s.diaporama && !optionsDecks.some(function (o) { return o[0] === s.diaporama; })) optionsDecks.push([s.diaporama, s.diaporama]);

    var champs = h("div", { class: "grille-champs" },
      champ(T.groupe, liste("groupe_id", gs.map(function (g) { return [g.id, g.nom]; }), s.groupe_id)),
      champ(T.date, saisie("date", s.date, "date", { requis: true })),
      champ(T.debut, saisie("debut", s.debut, "time")),
      champ(T.fin, saisie("fin", s.fin, "time")),
      champ(T.salle, saisie("salle", s.salle)),
      champ(T.genre, liste("genre", Object.keys(T.genre_seance).map(function (k) { return [k, T.genre_seance[k]]; }), s.genre)),
      champ(T.statut, liste("statut", Object.keys(T.statut_seance).map(function (k) { return [k, T.statut_seance[k]]; }), s.statut)),
      champ(T.diaporama, liste("diaporama", optionsDecks, s.diaporama)),
      champ(T.titre_seance, saisie("titre", s.titre), "champ--large"),
      champ(T.contenu, zoneTexte("contenu", s.contenu, 3), "champ--large"),
      champ(T.devoirs, zoneTexte("devoirs", s.devoirs, 2), "champ--large"),
      champ(T.remarque, zoneTexte("remarque", s.remarque, 2), "champ--large"));
    var corps = [h("section", { class: "fenetre__partie" }, champs)];
    var appel = id ? partieAppel(s) : null;
    if (appel) corps.push(appel.section);
    if (id) corps.push(partieDecalage(s));

    var boutons = [
      { texte: T.enregistrer, principal: true, action: function (form) {
        var v = lireFormulaire(form);
        if (!dateValide(v.date)) { erreurFenetre(form, T.date_obligatoire); return; }
        var params = [+v.groupe_id, v.date, v.debut, v.fin, v.salle, v.genre, v.titre, v.diaporama, v.statut, v.contenu, v.devoirs, v.remarque];
        transaction(function () {
          if (id) executer("UPDATE seance SET groupe_id = ?, date = ?, debut = ?, fin = ?, salle = ?, genre = ?, titre = ?, diaporama = ?, statut = ?, contenu = ?, devoirs = ?, remarque = ? WHERE id = ?", params.concat([id]));
          else executer("INSERT INTO seance (groupe_id, date, debut, fin, salle, genre, titre, diaporama, statut, contenu, devoirs, remarque) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params);
          if (appel) appel.enregistrer(id);
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.fermer, action: fermerFenetre }
    ];
    if (id) {
      boutons.push({ texte: T.dupliquer, icone: "i-copier", action: function () {
        executer("INSERT INTO seance (groupe_id, date, debut, fin, salle, genre, titre, diaporama, statut) SELECT groupe_id, date(date, '+7 days'), debut, fin, salle, genre, titre, diaporama, 'prevue' FROM seance WHERE id = ?", [id]);
        modifie(); fermerFenetre(); rendre();
      } });
      boutons.push({ texte: T.supprimer, danger: true, icone: "i-poubelle", action: function () {
        if (!window.confirm(T.confirmer_suppr_seance)) return;
        executer("DELETE FROM seance WHERE id = ?", [id]);
        modifie(); fermerFenetre(); rendre();
      } });
    }
    var titre = id ? T.seance + " · " + nomGroupe(s.groupe_id) + " · " + formatDate(s.date, { weekday: "long", day: "numeric", month: "long" }) : T.nouvelle_seance;
    ouvrirFenetre(titre, corps, boutons, { large: true, sansFocus: !!id });
  }

  // L'appel : les étudiants du groupe (et ceux qui y étaient ce jour-là), un statut chacun.
  function partieAppel(s, options) {
    options = options || {};
    var membres = tout("SELECT e.* FROM etudiant e WHERE e.groupe_id = ? OR e.id IN (SELECT etudiant_id FROM presence WHERE seance_id = ?)", [s.groupe_id, s.id]).sort(parNom);
    var statuts = {};
    tout("SELECT etudiant_id, statut FROM presence WHERE seance_id = ?", [s.id]).forEach(function (r) { statuts[r.etudiant_id] = r.statut; });
    // Appel rapide : sans appel enregistré, tout le monde part « présent » ; on ne touche que les absents.
    if (options.defautPresent && !Object.keys(statuts).length) membres.forEach(function (e) { statuts[e.id] = "present"; });
    var per = options.cumul ? periodeDe(s.date) : null;
    var cumul = per ? bilans(per.du, per.au, 0, s.id) : {};
    var seuils = lireSeuils();
    var section = h("section", { class: "fenetre__partie" });
    var bilan = h("p", { class: "bilan-presences" });
    var lignes = h("ol", { class: "appel" });
    function majBilan() {
      vider(bilan);
      var n = { present: 0, absent: 0, retard: 0, excuse: 0 };
      Object.keys(statuts).forEach(function (k) { if (n[statuts[k]] != null) n[statuts[k]]++; });
      Object.keys(n).forEach(function (k) { bilan.appendChild(h("span", { class: "puce puce--" + k }, T.presence[k] + " : " + nombre(n[k]))); });
    }
    function rendreLignes() {
      vider(lignes);
      membres.forEach(function (e) {
        var groupe = h("div", { class: "segmente segmente--appel", role: "group", "aria-label": nomComplet(e) });
        Object.keys(T.presence).forEach(function (k) {
          groupe.appendChild(h("button", { type: "button", class: "appel__" + k, "aria-pressed": statuts[e.id] === k ? "true" : "false", text: T.presence[k],
            onclick: function () {
              if (statuts[e.id] === k) delete statuts[e.id]; else statuts[e.id] = k;
              rendreLignes(); majBilan();
            } }));
        });
        var info = null;
        if (options.cumul) {
          // Le semestre jusqu'ici, plus le statut choisi aujourd'hui : l'alerte s'allume dès qu'on touche « absent ».
          var b = cumul[e.id] ? Object.assign({}, cumul[e.id]) : vide();
          if (statuts[e.id]) b[statuts[e.id]]++;
          completer(b, seuils);
          info = h("span", { class: "appel__cumul" }, tpl(T.cumul, { a: nombre(b.absent), j: nombre(b.excuse) }),
            b.niveau ? h("span", { class: "puce puce--" + b.niveau, text: T.niveau[b.niveau] }) : null);
        }
        lignes.appendChild(h("li", { class: "appel__ligne" + (statuts[e.id] ? " appel__ligne--" + statuts[e.id] : "") },
          h("span", { class: "appel__nom" }, nomComplet(e), info), groupe));
      });
    }
    var ajout = null, vide0 = h("p", { class: "classe-vide", text: T.aucun_etudiant, hidden: !!membres.length });
    if (options.ajout) {
      var entree = h("input", { type: "text", class: "saisie-libre", placeholder: T.exemple_nom, "aria-label": T.ajouter_rapide, autocomplete: "off" });
      var ajouterEtudiant = function () {
        var x = decouperListe(entree.value)[0];
        if (!x) { entree.focus(); return; }
        executer("INSERT INTO etudiant (groupe_id, nom, prenom, matricule, email) VALUES (?, ?, ?, ?, ?)", [s.groupe_id, x.nom, x.prenom, x.matricule, x.email]);
        var e = un("SELECT * FROM etudiant WHERE id = ?", [dernierId()]);
        membres.push(e); membres.sort(parNom); statuts[e.id] = "present";
        modifie(); entree.value = ""; vide0.hidden = true; bilan.hidden = false;
        rendreLignes(); majBilan(); entree.focus();
      };
      // Entrée ajoute l'étudiant (et n'enregistre pas l'appel).
      entree.addEventListener("keydown", function (k) { if (k.key === "Enter") { k.preventDefault(); ajouterEtudiant(); } });
      ajout = h("div", { class: "appel__ajout" }, h("p", { class: "appel__ajout-titre", text: T.ajouter_rapide }),
        h("div", { class: "appel__ajout-ligne" }, entree, bouton(T.ajouter_court, ajouterEtudiant, { icone: "i-plus" })));
    }
    bilan.hidden = !membres.length;
    ajouter(section, [h("div", { class: "fenetre__partie-tete" }, h("h3", { text: T.appel }),
      bouton(T.tous_presents, function () { membres.forEach(function (e) { statuts[e.id] = "present"; }); rendreLignes(); majBilan(); }, { icone: "i-coche" }),
      bouton(T.effacer_appel, function () { statuts = {}; rendreLignes(); majBilan(); }, { classe: "bouton--discret" })),
      options.defautPresent ? h("p", { class: "classe-aide", text: T.defaut_present }) : null,
      bilan, vide0, lignes, ajout]);
    rendreLignes(); majBilan();
    return {
      section: section,
      enregistrer: function (seanceId) {
        executer("DELETE FROM presence WHERE seance_id = ?", [seanceId]);
        Object.keys(statuts).forEach(function (k) {
          executer("INSERT INTO presence (seance_id, etudiant_id, statut) VALUES (?, ?, ?)", [seanceId, +k, statuts[k]]);
        });
      }
    };
  }

  // Modifier le planning plus tard : repousser (ou avancer) une séance et toutes les suivantes du groupe.
  function partieDecalage(s) {
    var jours = h("input", { type: "number", value: "7", step: "1", min: "-60", max: "120", class: "saisie-courte", "aria-label": T.jours });
    return h("section", { class: "fenetre__partie fenetre__partie--decalage" },
      h("p", { class: "decalage" }, h("span", { text: T.decaler_aide + " " }), jours, h("span", { text: " " + T.jours }),
        bouton(T.decaler, function () {
          var j = parseInt(jours.value, 10);
          if (!j) return;
          var n = un("SELECT COUNT(*) AS n FROM seance WHERE groupe_id = ? AND (date > ? OR (date = ? AND debut >= ?))", [s.groupe_id, s.date, s.date, s.debut]).n;
          if (!window.confirm(tpl(T.confirmer_decaler, { n: nombre(n), j: nombre(j) }))) return;
          executer("UPDATE seance SET date = date(date, ?) WHERE groupe_id = ? AND (date > ? OR (date = ? AND debut >= ?))",
            [(j > 0 ? "+" : "") + j + " days", s.groupe_id, s.date, s.date, s.debut]);
          modifie(); fermerFenetre(); rendre();
        }, { icone: "i-calendrier" })));
  }

  function fenetreGenerer() {
    var gs = groupes();
    if (!gs.length) return;
    var g0 = etat.groupe > 0 ? groupeParId(etat.groupe) : gs[0];
    var portee = liste("portee", [["tous", T.gen_tous], ["un", T.gen_un]], etat.groupe > 0 ? "un" : "tous");
    var choixGroupe = liste("groupe_id", gs.map(function (g) { return [g.id, g.nom]; }), g0.id);
    var premiere = saisie("date", aujourdhui(), "date", { requis: true });
    var semaines = saisie("semaines", "13", "number", { min: 1, max: 30 });
    var debut = saisie("debut", g0.debut || "08:00", "time"), fin = saisie("fin", g0.fin || "09:30", "time");
    var salle = saisie("salle", g0.salle);
    var genre = liste("genre", Object.keys(T.genre_seance).map(function (k) { return [k, T.genre_seance[k]]; }), "td");
    var suivre = h("input", { type: "checkbox", name: "progression", checked: true });
    var apercu = h("ol", { class: "apercu-planning" });
    var info = h("p", { class: "classe-aide" });
    var champsUn = [champ(T.groupe, choixGroupe), champ(T.debut, debut), champ(T.fin, fin), champ(T.salle, salle)];
    var libelleDate = h("label", { for: "" });

    function tous() { return portee.value === "tous"; }
    function nbSemaines() { return Math.max(1, Math.min(30, parseInt(semaines.value, 10) || 13)); }
    // Les séances d'un groupe : une par semaine à partir de « depart », avec la progression du cours si demandé.
    function plan(depart) {
      var r = [];
      if (!dateValide(depart)) return r;
      for (var i = 0; i < nbSemaines(); i++) {
        var modele = suivre.checked && T.plan[i] ? T.plan[i] : null;
        r.push({ date: plusJours(depart, 7 * i), titre: modele ? modele[0] : tpl(T.semaine, { n: i + 1 }), diaporama: modele ? modele[1] : "",
          genre: modele && i === T.plan.length - 1 ? "examen" : genre.value });
      }
      return r;
    }
    // Pour « tous les groupes » : chaque groupe à son jour, à partir de la semaine de départ.
    function plans() {
      if (!tous()) {
        return [{ groupe: +choixGroupe.value, nom: (groupeParId(+choixGroupe.value) || {}).nom, seances: plan(premiere.value),
          debut: debut.value, fin: fin.value, salle: salle.value.trim() }];
      }
      return gs.filter(aUnJour).map(function (g) {
        return { groupe: g.id, nom: g.nom, seances: dateValide(premiere.value) ? plan(premierJour(premiere.value, g.jour)) : [],
          debut: g.debut, fin: g.fin, salle: g.salle };
      });
    }
    function maj() {
      champsUn.forEach(function (c) { c.hidden = tous(); });
      libelleDate.textContent = tous() ? T.debut_semestre : T.premiere_date;
      vider(apercu);
      var court = { weekday: "short", day: "numeric", month: "short" };
      var ps = plans();
      if (tous()) {
        ps.forEach(function (x) {
          if (!x.seances.length) return;
          apercu.appendChild(h("li", null, tpl(T.gen_ligne, { g: x.nom, n: compte(x.seances.length, "seance"),
            d1: formatDate(x.seances[0].date, court), d2: formatDate(x.seances[x.seances.length - 1].date, court) }) + (x.debut ? " · " + x.debut + "–" + x.fin : "")));
        });
        var ignores = gs.filter(function (g) { return !aUnJour(g); }).map(function (g) { return g.nom; });
        info.textContent = ignores.length ? tpl(T.gen_ignores, { liste: ignores.join(", ") }) : "";
        info.hidden = !ignores.length;
      } else {
        (ps[0] ? ps[0].seances : []).forEach(function (x, i) {
          apercu.appendChild(h("li", null, h("strong", { text: tpl(T.semaine, { n: i + 1 }) + " · " + formatDate(x.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) }), " · ", x.titre));
        });
        var n = un("SELECT COUNT(*) AS n FROM seance WHERE groupe_id = ?", [+choixGroupe.value]).n;
        info.textContent = n ? tpl(T.deja_seances, { n: nombre(n) }) : "";
        info.hidden = !n;
      }
    }
    choixGroupe.addEventListener("change", function () {
      var g = groupeParId(+choixGroupe.value);
      if (g) { salle.value = g.salle; if (g.debut) debut.value = g.debut; if (g.fin) fin.value = g.fin; if (aUnJour(g)) premiere.value = premierJour(premiere.value, g.jour); }
      maj();
    });
    [portee, premiere, semaines, suivre, genre].forEach(function (c) { c.addEventListener("input", maj); c.addEventListener("change", maj); });
    var champDate = champ(T.premiere_date, premiere);
    champDate.replaceChild(libelleDate, champDate.querySelector("label"));
    libelleDate.setAttribute("for", premiere.id);
    var corps = [h("div", { class: "grille-champs" },
      champ(T.gen_portee, portee, "champ--large"), champsUn[0], champDate, champ(T.nb_semaines, semaines),
      champsUn[1], champsUn[2], champsUn[3], champ(T.genre, genre),
      h("label", { class: "case champ--large" }, suivre, T.progression)), info, apercu];
    ouvrirFenetre(T.generer_titre, corps, [
      { texte: T.generer_n, principal: true, icone: "i-calendrier", action: function (form) {
        var ps = plans().filter(function (x) { return x.seances.length; });
        if (!ps.length) { erreurFenetre(form, T.date_obligatoire); return; }
        transaction(function () {
          ps.forEach(function (x) {
            x.seances.forEach(function (se) {
              executer("INSERT INTO seance (groupe_id, date, debut, fin, salle, genre, titre, diaporama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [x.groupe, se.date, x.debut, x.fin, x.salle, se.genre, se.titre, se.diaporama]);
            });
          });
        });
        etat.groupe = tous() ? 0 : +choixGroupe.value; etat.vue = "toutes";
        fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ], { large: true });
    maj();
  }

  /* ---------- Assiduité : réglages, congés, bilans ---------- */

  var SEUILS = { seuil_alerte: 2, seuil_exclusion: 3, seuil_total: 5 };
  function reglage(cle) {
    var r = un("SELECT valeur FROM reglage WHERE cle = ?", [cle]);
    if (r) return r.valeur;
    return cle === "debut_s2" ? anneeUniversitaire().debut_s2 : String(SEUILS[cle]);
  }
  function ecrireReglage(cle, valeur) {
    executer("INSERT INTO reglage (cle, valeur) VALUES (?, ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur", [cle, String(valeur)]);
  }
  function lireSeuils() {
    var r = {};
    Object.keys(SEUILS).forEach(function (k) { var n = parseInt(reglage(k), 10); r[k] = n > 0 ? n : SEUILS[k]; });
    return r;
  }
  // L'année universitaire va de septembre à juillet ; le semestre 2 commence en février (réglable).
  function anneeUniversitaire(iso) {
    var d = versDate(iso || aujourdhui()), y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return { y: y, debut: y + "-09-01", fin: (y + 1) + "-07-31", debut_s2: (y + 1) + "-02-01" };
  }
  function ajouterMois(iso, n) { var d = versDate(iso); d.setMonth(d.getMonth() + n); return isoDate(d); }
  function periodes() {
    var a = anneeUniversitaire(), s2 = reglage("debut_s2");
    var r = [{ id: "s1", nom: T.semestre1, du: a.debut, au: plusJours(s2, -1) }, { id: "s2", nom: T.semestre2, du: s2, au: a.fin },
      { id: "annee", nom: T.annee, du: a.debut, au: a.fin }];
    for (var m = 0; m < 11; m++) {
      var d = new Date(a.y, 8 + m, 1, 12);
      r.push({ id: isoDate(d).slice(0, 7), nom: new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(d), du: isoDate(d),
        au: isoDate(new Date(a.y, 9 + m, 0, 12)), mois: true });
    }
    return r;
  }
  // Le semestre qui contient une date : c'est sur lui que les alertes sont calculées.
  function periodeDe(iso) {
    var a = anneeUniversitaire(iso), s2 = reglage("debut_s2");
    return iso >= s2 ? { id: "s2", du: s2, au: a.fin } : { id: "s1", du: a.debut, au: plusJours(s2, -1) };
  }
  function conges() { return tout("SELECT * FROM conge ORDER BY debut, fin"); }
  function congeDu(iso, liste) { return (liste || conges()).filter(function (c) { return iso >= c.debut && iso <= c.fin; })[0] || null; }
  // Jours fériés algériens à date fixe ; fêtes religieuses de 2026–2027 à dates approximatives (à confirmer).
  function congesParDefaut() {
    var y = anneeUniversitaire().y, L = T.conges_defaut;
    var c = [[y + "-11-01", y + "-11-01", L.revolution], [(y + 1) + "-01-01", (y + 1) + "-01-01", L.nouvel_an], [(y + 1) + "-01-12", (y + 1) + "-01-12", L.yennayer],
      [(y + 1) + "-05-01", (y + 1) + "-05-01", L.travail], [(y + 1) + "-07-05", (y + 1) + "-07-05", L.independance]];
    if (y === 2026) c.push(["2027-03-09", "2027-03-11", L.fitr], ["2027-05-16", "2027-05-18", L.adha], ["2027-06-06", "2027-06-06", L.moharram], ["2027-06-15", "2027-06-15", L.achoura]);
    c.forEach(function (x) { executer("INSERT INTO conge (debut, fin, libelle) VALUES (?, ?, ?)", x); });
  }

  function vide() { return { present: 0, absent: 0, excuse: 0, retard: 0 }; }
  function completer(x, seuils) {
    x.total = x.present + x.absent + x.excuse + x.retard;
    x.taux = x.total ? (x.present + x.retard) / x.total : null;
    x.niveau = x.absent >= seuils.seuil_exclusion || x.absent + x.excuse >= seuils.seuil_total ? "exclusion"
      : x.absent >= seuils.seuil_alerte || x.absent + x.excuse >= seuils.seuil_total - 1 ? "alerte" : "";
    return x;
  }
  // Bilan de chaque étudiant sur une période (séances annulées exclues) ; « sauf » : une séance à ne pas compter.
  function bilans(du, au, groupeId, sauf) {
    var sql = "SELECT p.etudiant_id, p.statut, COUNT(*) AS n FROM presence p JOIN seance s ON s.id = p.seance_id WHERE s.date BETWEEN ? AND ? AND s.statut <> 'annulee'";
    var params = [du, au];
    if (groupeId > 0) { sql += " AND s.groupe_id = ?"; params.push(groupeId); }
    if (sauf) { sql += " AND s.id <> ?"; params.push(sauf); }
    var b = {}, seuils = lireSeuils();
    tout(sql + " GROUP BY p.etudiant_id, p.statut", params).forEach(function (r) {
      var x = b[r.etudiant_id] || (b[r.etudiant_id] = vide());
      if (x[r.statut] != null) x[r.statut] = r.n;
    });
    Object.keys(b).forEach(function (k) { completer(b[k], seuils); });
    return b;
  }
  function pourcent(x) { return x == null ? "" : new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 }).format(x); }
  function minutes(hhmm) { var p = String(hhmm || "").split(":"); return p.length === 2 ? +p[0] * 60 + +p[1] : null; }
  function maintenant() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function horaire(s) { return s.debut ? s.debut + (s.fin ? "–" + s.fin : "") : ""; }

  function seancesDuJour(iso) {
    return tout("SELECT s.*, g.nom AS groupe_nom, g.couleur AS groupe_couleur," +
      " (SELECT COUNT(*) FROM presence p WHERE p.seance_id = s.id) AS nb_appel," +
      " (SELECT COUNT(*) FROM presence p WHERE p.seance_id = s.id AND p.statut IN ('present', 'retard')) AS nb_presents" +
      " FROM seance s JOIN groupe g ON g.id = s.groupe_id WHERE s.date = ? AND s.statut NOT IN ('annulee', 'reportee') ORDER BY s.debut, g.ordre", [iso]);
  }
  function enCours(s) {
    var m = maintenant(), d = minutes(s.debut), f = minutes(s.fin);
    return s.date === aujourdhui() && d != null && m >= d && (f == null || m <= f);
  }
  // Séances passées (ou finies aujourd'hui) sans aucun appel, pour un groupe qui a des étudiants.
  function appelsEnRetard() {
    var auj = aujourdhui(), m = maintenant();
    return tout("SELECT s.*, g.nom AS groupe_nom, g.couleur AS groupe_couleur FROM seance s JOIN groupe g ON g.id = s.groupe_id" +
      " WHERE s.statut IN ('prevue', 'faite') AND s.date <= ? AND NOT EXISTS (SELECT 1 FROM presence p WHERE p.seance_id = s.id)" +
      " AND EXISTS (SELECT 1 FROM etudiant e WHERE e.groupe_id = s.groupe_id) ORDER BY s.date DESC, s.debut", [auj])
      .filter(function (s) { var f = minutes(s.fin); return s.date < auj || (f != null && f < m); });
  }

  // Bandeau du jour, sur toutes les pages de « Mes groupes » : la séance en cours (ou qui commence) dont l'appel n'est pas fait.
  function majRappel() {
    if (!zones.rappel || !db) return;
    vider(zones.rappel);
    var m = maintenant();
    var jour = seancesDuJour(aujourdhui()).filter(function (s) { return !s.nb_appel; });
    var cible = jour.filter(enCours)[0] || jour.filter(function (s) { var d = minutes(s.debut); return d == null || d <= m + 15; })[0] || null;
    zones.rappel.hidden = !cible;
    if (!cible) return;
    ajouter(zones.rappel, [icone("i-horloge"),
      h("span", { class: "classe-rappel__texte" }, tpl(enCours(cible) ? T.rappel_en_cours : T.rappel_a_faire, { g: cible.groupe_nom, h: "" }), h("bdi", { dir: "ltr", text: horaire(cible) })),
      bouton(T.faire_appel, function () { fenetreAppel(cible.id); }, { icone: "i-coche", classe: "bouton--prisme" })]);
  }

  /* ---------- Onglet Présences ---------- */

  function rendrePresences(p) {
    var auj = aujourdhui(), court = { weekday: "short", day: "numeric", month: "short" };
    // 1. Aujourd'hui
    var jour = seancesDuJour(auj);
    var carte = h("section", { class: "carte carte-jour" }, h("h3", { text: tpl(T.aujourdhui_titre, { date: formatDate(auj, { weekday: "long", day: "numeric", month: "long" }) }) }));
    if (jour.length) {
      carte.appendChild(h("ul", { class: "jour__liste" }, jour.map(function (s) {
        var fait = s.nb_appel > 0, cours = enCours(s);
        return h("li", { class: "jour__seance " + teinte(s.groupe_couleur) + (cours ? " jour__seance--en-cours" : "") },
          h("bdi", { class: "jour__heure", dir: "ltr", text: horaire(s) || "—" }),
          h("span", { class: "jour__groupe" }, h("span", { class: "pastille-couleur", "aria-hidden": "true" }), s.groupe_nom),
          h("span", { class: "puce " + (fait ? "puce--faite" : cours ? "puce--aujourdhui" : "puce--prevue"),
            text: fait ? tpl(T.appel_fait, { p: nombre(s.nb_presents), n: nombre(s.nb_appel) }) : cours ? T.en_cours : T.a_faire }),
          bouton(fait ? T.modifier_appel : T.faire_appel, function () { fenetreAppel(s.id); }, { icone: "i-coche", classe: fait ? "bouton--discret" : "bouton--prisme" }));
      })));
    } else {
      var proch = un("SELECT s.date, s.debut, g.nom AS groupe_nom FROM seance s JOIN groupe g ON g.id = s.groupe_id WHERE s.date > ? AND s.statut IN ('prevue', 'reportee') ORDER BY s.date, s.debut LIMIT 1", [auj]);
      carte.appendChild(h("p", { class: "classe-vide", text: T.aucune_seance_auj + (proch ? " " + tpl(T.prochaine_le, {
        d: formatDate(proch.date, { weekday: "long", day: "numeric", month: "long" }) + (proch.debut ? " · " + proch.debut : ""), g: proch.groupe_nom }) : "") }));
    }
    if (!un("SELECT COUNT(*) AS n FROM seance WHERE date >= ?", [auj]).n) {
      carte.appendChild(h("div", { class: "jour__annee" }, h("p", { text: T.annee_invitation }),
        bouton(T.preparer_annee, fenetreAnnee, { icone: "i-calendrier", classe: "bouton--prisme" })));
    }
    p.appendChild(carte);

    // 2. Appels oubliés
    var retard = appelsEnRetard();
    if (retard.length) {
      p.appendChild(h("section", { class: "carte carte-jour carte-jour--retard" }, h("h3", { text: T.appels_retard + " (" + nombre(retard.length) + ")" }),
        h("p", { class: "classe-aide", text: T.appels_retard_aide }),
        h("ul", { class: "jour__liste" }, retard.slice(0, 6).map(function (s) {
          return h("li", { class: "jour__seance " + teinte(s.groupe_couleur) },
            h("span", { class: "jour__heure", text: formatDate(s.date, court) }),
            h("span", { class: "jour__groupe" }, h("span", { class: "pastille-couleur", "aria-hidden": "true" }), s.groupe_nom, " ", h("bdi", { dir: "ltr", text: horaire(s) })),
            bouton(T.faire_appel, function () { fenetreAppel(s.id); }, { icone: "i-coche" }));
        }))));
    }

    // 3. Outils
    var g = etat.groupe > 0 ? groupeParId(etat.groupe) : null;
    var pers = periodes();
    if (!pers.some(function (x) { return x.id === etat.periode; })) etat.periode = periodeDe(auj).id;
    var per = pers.filter(function (x) { return x.id === etat.periode; })[0];
    ajouter(p, h("div", { class: "classe-outils" },
      bouton(T.preparer_annee, fenetreAnnee, { icone: "i-calendrier" }),
      bouton(T.changer_horaire, function () { fenetreHoraire(etat.groupe); }, { icone: "i-horloge" }),
      bouton(T.conges, fenetreConges, { icone: "i-calendrier" }),
      bouton(T.regles, fenetreRegles, { icone: "i-outil" }),
      g ? bouton(T.exporter_csv, function () { exporterRegistre(g, per); }, { icone: "i-telecharger" }) : null,
      g ? bouton(T.imprimer_registre, function () { imprimerRegistre(g, per); }, { icone: "i-imprimer" }) : null));

    // 4. Période
    var principales = h("div", { class: "segmente", role: "group", "aria-label": T.periode });
    var mois = h("div", { class: "segmente segmente--mois", role: "group", "aria-label": T.periode });
    pers.forEach(function (x) {
      (x.mois ? mois : principales).appendChild(h("button", { type: "button", "aria-pressed": x.id === etat.periode ? "true" : "false",
        onclick: function () { etat.periode = x.id; rendre(); }, text: x.nom }));
    });
    p.appendChild(h("div", { class: "periodes" }, principales, mois));

    // 5. Registre d'un groupe, ou synthèse de tous les groupes
    if (g) rendreRegistre(p, g, per); else rendreSynthese(p, per);
  }

  // Le registre : étudiants en lignes, séances de la période en colonnes, bilans et alertes à droite.
  function donneesRegistre(g, per) {
    var ss = tout("SELECT * FROM seance WHERE groupe_id = ? AND date BETWEEN ? AND ? ORDER BY date, debut", [g.id, per.du, per.au]);
    var membres = tout("SELECT e.* FROM etudiant e WHERE e.groupe_id = ? OR e.id IN (SELECT p.etudiant_id FROM presence p JOIN seance s ON s.id = p.seance_id WHERE s.groupe_id = ? AND s.date BETWEEN ? AND ?)",
      [g.id, g.id, per.du, per.au]).sort(parNom);
    var statuts = {};
    tout("SELECT p.* FROM presence p JOIN seance s ON s.id = p.seance_id WHERE s.groupe_id = ? AND s.date BETWEEN ? AND ?", [g.id, per.du, per.au])
      .forEach(function (r) { statuts[r.seance_id + ":" + r.etudiant_id] = r.statut; });
    return { ss: ss, membres: membres, statuts: statuts, seuils: lireSeuils() };
  }
  function bilanLigne(d, e) {
    var b = vide();
    d.ss.forEach(function (s) { var x = d.statuts[s.id + ":" + e.id]; if (x && s.statut !== "annulee" && b[x] != null) b[x]++; });
    return completer(b, d.seuils);
  }
  function rendreRegistre(p, g, per) {
    var d = donneesRegistre(g, per), auj = aujourdhui(), court = { weekday: "short", day: "numeric", month: "short" };
    p.appendChild(h("h3", { class: "titre-mois", text: T.registre + " · " + g.nom + " · " + per.nom }));
    if (!d.ss.length) { p.appendChild(h("p", { class: "classe-vide", text: T.aucune_seance })); return; }
    if (!d.membres.length) p.appendChild(h("p", { class: "classe-vide", text: T.aucun_etudiant }));
    var ordre = ["", "present", "absent", "excuse", "retard"];
    var tete = h("tr", null, h("th", { scope: "col", class: "nombre", text: T.num }), h("th", { scope: "col", class: "registre__nom", text: T.etudiant }),
      d.ss.map(function (s) {
        var futur = s.date > auj, cl = "registre__date" + (futur ? " registre__date--futur" : "") + (s.statut === "annulee" ? " registre__date--annulee" : "") + (s.date === auj ? " registre__date--aujourdhui" : "");
        return h("th", { scope: "col", class: cl, title: formatDate(s.date, { weekday: "long", day: "numeric", month: "long" }) + (s.titre ? " · " + s.titre : "") + " · " + (T.statut_seance[s.statut] || s.statut) },
          h("button", { type: "button", class: "registre__lien", disabled: futur || s.statut === "annulee", onclick: function () { fenetreAppel(s.id); } },
            h("span", { text: new Intl.DateTimeFormat(LOCALE, { weekday: "short" }).format(versDate(s.date)) }),
            h("span", { dir: "ltr", text: s.date.slice(8, 10) + "/" + s.date.slice(5, 7) })));
      }),
      [T.col_presents, T.col_absences, T.col_justifiees, T.col_retards, T.taux].map(function (x) { return h("th", { scope: "col", class: "registre__total", text: x }); }));
    var corps = h("tbody");
    var pieds = {};
    d.membres.forEach(function (e, i) {
      var totaux = [h("td", { class: "registre__total" }), h("td", { class: "registre__total" }), h("td", { class: "registre__total" }), h("td", { class: "registre__total" }), h("td", { class: "registre__total" })];
      var puce = h("span");
      var ligne = h("tr", null, h("td", { class: "nombre", text: nombre(i + 1) }),
        h("th", { scope: "row", class: "registre__nom" }, h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreEtudiant(e.id); }, text: nomComplet(e) }), puce));
      function majTotaux() {
        var b = bilanLigne(d, e);
        [b.present + b.retard, b.absent, b.excuse, b.retard].forEach(function (n, k) { totaux[k].textContent = n ? nombre(n) : ""; });
        totaux[4].textContent = pourcent(b.taux);
        ligne.className = b.niveau ? "registre__ligne--" + b.niveau : "";
        vider(puce);
        if (b.niveau) puce.appendChild(h("span", { class: "puce puce--" + b.niveau, text: T.niveau[b.niveau] }));
      }
      d.ss.forEach(function (s) {
        if (s.statut === "annulee") { ligne.appendChild(h("td", { class: "registre__vide", text: "—" })); return; }
        if (s.date > auj) { ligne.appendChild(h("td", { class: "registre__vide" })); return; }
        var cle = s.id + ":" + e.id;
        var c = h("button", { type: "button", class: "cellule" });
        function peindre() {
          var x = d.statuts[cle] || "";
          c.className = "cellule" + (x ? " cellule--" + x : "");
          c.textContent = x ? T.lettres[x] : "";
          c.setAttribute("aria-label", nomComplet(e) + " · " + formatDate(s.date, court) + " : " + (x ? T.presence[x] : T.appel_non_fait));
        }
        c.addEventListener("click", function () {
          var x = ordre[(ordre.indexOf(d.statuts[cle] || "") + 1) % ordre.length];
          if (x) d.statuts[cle] = x; else delete d.statuts[cle];
          ecrireStatut(s.id, e.id, x);
          peindre(); majTotaux(); majPied(s);
        });
        peindre();
        ligne.appendChild(h("td", { class: "registre__case" }, c));
      });
      ajouter(ligne, totaux);
      majTotaux();
      corps.appendChild(ligne);
    });
    function majPied(s) {
      var td = pieds[s.id];
      if (!td) return;
      var n = 0, ok = 0;
      d.membres.forEach(function (e) { var x = d.statuts[s.id + ":" + e.id]; if (x) { n++; if (x === "present" || x === "retard") ok++; } });
      td.textContent = n ? nombre(ok) + "/" + nombre(n) : "";
    }
    var pied = h("tr", null, h("td"), h("th", { scope: "row", class: "registre__nom", text: T.col_presents }), d.ss.map(function (s) {
      var td = h("td", { class: "registre__pied" }); pieds[s.id] = td; return td;
    }), h("td", { colspan: "5" }));
    d.ss.forEach(majPied);
    p.appendChild(h("div", { class: "tableau-defilant tableau-defilant--registre" },
      h("table", { class: "tableau tableau--registre" }, h("thead", null, tete), corps, h("tfoot", null, pied))));
    p.appendChild(h("p", { class: "legende-registre", text: T.legende }));
    // Le registre s'ouvre sur les séances d'aujourd'hui (ou les dernières) : défilement jusqu'à elles.
    var defilant = p.querySelector(".tableau-defilant--registre"), cible = p.querySelector(".registre__date--aujourdhui") || p.querySelector(".registre__date--futur");
    function centrer() {
      var a = cible.getBoundingClientRect(), b = defilant.getBoundingClientRect();
      defilant.scrollLeft += (a.left + a.width / 2) - (b.left + b.width / 2);   // même calcul de gauche à droite et de droite à gauche
    }
    if (defilant && cible) {
      requestAnimationFrame(centrer);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(centrer); });   // les polices changent la largeur des colonnes
    }
  }
  function ecrireStatut(seanceId, etudiantId, statut) {
    if (statut) executer("INSERT INTO presence (seance_id, etudiant_id, statut) VALUES (?, ?, ?) ON CONFLICT (seance_id, etudiant_id) DO UPDATE SET statut = excluded.statut", [seanceId, etudiantId, statut]);
    else executer("DELETE FROM presence WHERE seance_id = ? AND etudiant_id = ?", [seanceId, etudiantId]);
    // Un appel enregistré : la séance a eu lieu.
    executer("UPDATE seance SET statut = 'faite' WHERE id = ? AND statut IN ('prevue', 'reportee') AND EXISTS (SELECT 1 FROM presence WHERE seance_id = ?)", [seanceId, seanceId]);
    modifie();
  }

  // Tous les groupes : un tableau par groupe, puis les étudiants en alerte.
  function rendreSynthese(p, per) {
    var gs = groupes(), b = bilans(per.du, per.au, 0), seuils = lireSeuils();
    var tous = etudiants(0);
    var parGroupe = {};
    tous.forEach(function (e) { (parGroupe[e.groupe_id] = parGroupe[e.groupe_id] || []).push(e); });
    var lignes = gs.map(function (g) {
      var membres = parGroupe[g.id] || [], ok = 0, total = 0, alerte = 0, exclusion = 0;
      membres.forEach(function (e) {
        var x = b[e.id];
        if (!x) return;
        ok += x.present + x.retard; total += x.total;
        if (x.niveau === "alerte") alerte++; else if (x.niveau === "exclusion") exclusion++;
      });
      var faites = un("SELECT COUNT(*) AS n FROM seance WHERE groupe_id = ? AND date BETWEEN ? AND ? AND statut = 'faite'", [g.id, per.du, per.au]).n;
      return h("tr", { class: teinte(g.couleur) },
        h("th", { scope: "row" }, h("button", { type: "button", class: "lien-nom", onclick: function () { etat.groupe = g.id; rendre(); } },
          h("span", { class: "pastille-couleur", "aria-hidden": "true" }), " ", g.nom)),
        h("td", { class: "nombre", text: nombre(membres.length) }), h("td", { class: "nombre", text: nombre(faites) }),
        h("td", { class: "nombre", text: total ? pourcent(ok / total) : "" }),
        h("td", { class: "nombre" }, alerte ? h("span", { class: "puce puce--alerte", text: nombre(alerte) }) : ""),
        h("td", { class: "nombre" }, exclusion ? h("span", { class: "puce puce--exclusion", text: nombre(exclusion) }) : ""));
    });
    p.appendChild(h("div", { class: "tableau-defilant" }, h("table", { class: "tableau tableau--classe" },
      h("thead", null, h("tr", null, [[T.groupe], [T.onglet_etudiants, 1], [T.seances_faites, 1], [T.taux, 1], [T.en_alerte, 1], [T.exclus, 1]].map(function (x) {
        return h("th", { scope: "col", class: x[1] ? "nombre" : null, text: x[0] });
      }))), h("tbody", null, lignes))));

    p.appendChild(h("h3", { class: "titre-mois", text: T.a_suivre }));
    var suivis = tous.filter(function (e) { return b[e.id] && b[e.id].niveau; }).sort(function (x, y) {
      var bx = b[x.id], by = b[y.id];
      return (by.niveau === "exclusion") - (bx.niveau === "exclusion") || (by.absent + by.excuse) - (bx.absent + bx.excuse) || parNom(x, y);
    });
    if (!suivis.length) { p.appendChild(h("p", { class: "classe-vide", text: T.aucun_suivi })); return; }
    p.appendChild(h("div", { class: "tableau-defilant" }, h("table", { class: "tableau tableau--classe" },
      h("thead", null, h("tr", null, [[T.etudiant], [T.groupe], [T.col_absences, 1], [T.col_justifiees, 1], [T.col_retards, 1], [T.taux, 1], [""]].map(function (x) {
        return h("th", { scope: "col", class: x[1] ? "nombre" : null, text: x[0] });
      }))),
      h("tbody", null, suivis.map(function (e) {
        var x = b[e.id];
        return h("tr", { class: "registre__ligne--" + x.niveau },
          h("th", { scope: "row" }, h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreEtudiant(e.id); }, text: nomComplet(e) })),
          h("td", { text: e.groupe_nom || T.sans_groupe }),
          h("td", { class: "nombre", text: nombre(x.absent) }), h("td", { class: "nombre", text: nombre(x.excuse) }), h("td", { class: "nombre", text: nombre(x.retard) }),
          h("td", { class: "nombre", text: pourcent(x.taux) }),
          h("td", null, h("span", { class: "puce puce--" + x.niveau, text: T.niveau[x.niveau] })));
      })))));
  }

  // L'appel rapide : tout le monde présent par défaut, un étudiant s'ajoute sur-le-champ, la séance passe « faite ».
  function fenetreAppel(id) {
    var s = un("SELECT s.*, g.nom AS groupe_nom FROM seance s JOIN groupe g ON g.id = s.groupe_id WHERE s.id = ?", [id]);
    if (!s) return;
    var appel = partieAppel(s, { defautPresent: true, cumul: true, ajout: true });
    var contenu = zoneTexte("contenu", s.contenu, 2);
    var corps = [h("p", { class: "classe-aide" }, h("bdi", { dir: "ltr", text: horaire(s) }), [s.salle, s.titre].filter(Boolean).map(function (x) { return " · " + x; }).join("")),
      appel.section, h("div", { class: "grille-champs" }, champ(T.contenu, contenu, "champ--large"))];
    ouvrirFenetre(T.appel + " · " + s.groupe_nom + " · " + formatDate(s.date, { weekday: "long", day: "numeric", month: "long" }), corps, [
      { texte: T.enregistrer_appel, principal: true, icone: "i-coche", action: function () {
        transaction(function () {
          appel.enregistrer(id);
          executer("UPDATE seance SET contenu = ?, statut = CASE WHEN statut IN ('prevue', 'reportee') AND EXISTS (SELECT 1 FROM presence WHERE seance_id = ?) THEN 'faite' ELSE statut END WHERE id = ?", [contenu.value, id, id]);
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.seance_annulee, action: function () {
        if (!window.confirm(T.confirmer_annulee)) return;
        transaction(function () {
          executer("DELETE FROM presence WHERE seance_id = ?", [id]);
          executer("UPDATE seance SET statut = 'annulee' WHERE id = ?", [id]);
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.fermer, action: fermerFenetre }
    ], { large: true, sansFocus: true });
  }

  // Préparer l'année : une séance par semaine pour chaque groupe, du premier au dernier jour, sans les congés.
  function fenetreAnnee() {
    var gs = groupes().filter(aUnJour);
    if (!gs.length) { window.alert(T.aucun_groupe_horaire); return; }
    var demain = plusJours(aujourdhui(), 1);
    var premier = saisie("premier", demain, "date", { requis: true });
    var dernier = saisie("dernier", plusJours(ajouterMois(demain, 10), -1), "date", { requis: true });
    var genre = liste("genre", Object.keys(T.genre_seance).map(function (k) { return [k, T.genre_seance[k]]; }), "td");
    var suivre = h("input", { type: "checkbox", name: "progression", checked: true });
    var remplacer = h("input", { type: "checkbox", name: "remplacer", checked: true });
    var texteRemplacer = h("span");
    var caseRemplacer = h("label", { class: "case champ--large" }, remplacer, texteRemplacer);
    var cases = gs.map(function (g) {
      var c = h("input", { type: "checkbox", value: String(g.id), checked: true });
      c.addEventListener("change", maj);
      return { g: g, c: c, el: h("label", { class: "case " + teinte(g.couleur) }, c, h("span", { class: "pastille-couleur", "aria-hidden": "true" }),
        g.nom + " · " + nomJour(g.jour) + " ", h("bdi", { dir: "ltr", text: horaire(g) })) };
    });
    var apercu = h("ol", { class: "apercu-planning" });
    var bouton0 = null;
    function choisis() { return cases.filter(function (x) { return x.c.checked; }).map(function (x) { return x.g; }); }
    function plan(g, listeConges) {
      var r = [], sautees = 0;
      if (!dateValide(premier.value) || !dateValide(dernier.value)) return { dates: r, sautees: 0 };
      for (var d = premierJour(premier.value, g.jour); d <= dernier.value; d = plusJours(d, 7)) {
        if (congeDu(d, listeConges)) sautees++; else r.push(d);
      }
      return { dates: r, sautees: sautees };
    }
    function existantes() {
      var ids = choisis().map(function (g) { return g.id; });
      if (!ids.length || !dateValide(premier.value)) return 0;
      return un("SELECT COUNT(*) AS n FROM seance s WHERE s.groupe_id IN (" + ids.map(function () { return "?"; }).join(",") + ") AND s.date >= ? AND s.statut IN ('prevue', 'reportee')" +
        " AND NOT EXISTS (SELECT 1 FROM presence p WHERE p.seance_id = s.id)", ids.concat([premier.value])).n;
    }
    function maj() {
      vider(apercu);
      var lc = conges(), total = 0, court = { day: "numeric", month: "short", year: "numeric" };
      choisis().forEach(function (g) {
        var x = plan(g, lc);
        total += x.dates.length;
        if (!x.dates.length) return;
        apercu.appendChild(h("li", null, tpl(T.gen_ligne, { g: g.nom, n: compte(x.dates.length, "seance"), d1: formatDate(x.dates[0], court), d2: formatDate(x.dates[x.dates.length - 1], court) }) +
          (x.sautees ? " · " + tpl(T.sautees, { n: nombre(x.sautees) }) : "")));
      });
      var n = existantes();
      texteRemplacer.textContent = tpl(T.remplacer, { n: nombre(n) });
      caseRemplacer.hidden = !n;
      if (bouton0) bouton0.lastChild.textContent = tpl(T.creer_seances, { n: nombre(total) });
    }
    [premier, dernier].forEach(function (c) { c.addEventListener("change", maj); c.addEventListener("input", maj); });
    var corps = [h("p", { class: "classe-aide", text: T.annee_aide }),
      h("div", { class: "grille-champs" }, champ(T.premier_jour, premier), champ(T.dernier_jour, dernier), champ(T.genre, genre),
        h("div", { class: "champ champ--large" }, h("span", { class: "champ__nom", text: T.groupes_concernes }), h("div", { class: "cases-groupes" }, cases.map(function (x) { return x.el; }))),
        h("label", { class: "case champ--large" }, suivre, T.progression), caseRemplacer),
      apercu, editeurConges(maj)];
    var form = ouvrirFenetre(T.annee_titre, corps, [
      { texte: tpl(T.creer_seances, { n: "…" }), principal: true, icone: "i-calendrier", action: function (f) {
        var gg = choisis(), lc = conges();
        if (!gg.length || !dateValide(premier.value) || !dateValide(dernier.value) || dernier.value < premier.value) { erreurFenetre(f, T.date_obligatoire); return; }
        transaction(function () {
          if (remplacer.checked && !caseRemplacer.hidden) {
            gg.forEach(function (g) {
              executer("DELETE FROM seance WHERE groupe_id = ? AND date >= ? AND statut IN ('prevue', 'reportee') AND NOT EXISTS (SELECT 1 FROM presence p WHERE p.seance_id = seance.id)", [g.id, premier.value]);
            });
          }
          gg.forEach(function (g) {
            plan(g, lc).dates.forEach(function (d, i) {
              var modele = suivre.checked && T.plan[i] ? T.plan[i] : null;
              executer("INSERT INTO seance (groupe_id, date, debut, fin, salle, genre, titre, diaporama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [g.id, d, g.debut, g.fin, g.salle, genre.value, modele ? modele[0] : tpl(T.semaine, { n: i + 1 }), modele ? modele[1] : ""]);
            });
          });
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ], { large: true, sansFocus: true });
    bouton0 = form.querySelector(".fenetre__pied .bouton--prisme");
    maj();
  }

  // Les vacances et jours fériés : liste, suppression, ajout d'une période.
  function editeurConges(apresChangement) {
    var boite = h("div", { class: "conges" }), court = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
    function remplir() {
      vider(boite);
      var cs = conges();
      var lib = h("input", { type: "text", class: "saisie-libre", placeholder: T.conge_exemple, "aria-label": T.conge_libelle, autocomplete: "off" });
      var du = h("input", { type: "date", class: "saisie-libre", "aria-label": T.du }), au = h("input", { type: "date", class: "saisie-libre", "aria-label": T.au });
      function ajouterConge() {
        if (!dateValide(du.value)) { du.focus(); return; }
        var fin = dateValide(au.value) && au.value >= du.value ? au.value : du.value;
        executer("INSERT INTO conge (debut, fin, libelle) VALUES (?, ?, ?)", [du.value, fin, lib.value.trim() || T.conges]);
        modifie(); remplir();
        if (apresChangement) apresChangement();
      }
      [lib, du, au].forEach(function (c) { c.addEventListener("keydown", function (k) { if (k.key === "Enter") { k.preventDefault(); ajouterConge(); } }); });
      ajouter(boite, [cs.length ? h("ul", { class: "conges__liste" }, cs.map(function (c) {
        return h("li", null,
          h("span", { class: "conges__dates", text: c.debut === c.fin ? formatDate(c.debut, court) : tpl(T.du_au, { d1: formatDate(c.debut, court), d2: formatDate(c.fin, court) }) }),
          h("span", { class: "conges__libelle", text: c.libelle }),
          h("button", { type: "button", class: "bouton bouton--petit bouton--discret", "aria-label": T.supprimer + " · " + c.libelle, title: T.supprimer, onclick: function () {
            executer("DELETE FROM conge WHERE id = ?", [c.id]); modifie(); remplir();
            if (apresChangement) apresChangement();
          } }, icone("i-poubelle")));
      })) : h("p", { class: "classe-vide", text: T.aucun_conge }),
        h("div", { class: "conges__ajout" }, lib, h("label", { class: "conges__date" }, T.du + " ", du), h("label", { class: "conges__date" }, T.au + " ", au),
          bouton(T.ajouter_conge, ajouterConge, { icone: "i-plus" }))]);
    }
    remplir();
    return h("section", { class: "fenetre__partie" }, h("h3", { text: T.conges }), h("p", { class: "classe-aide", text: T.conges_aide }), boite);
  }
  function fenetreConges() {
    ouvrirFenetre(T.conges, [editeurConges(null)], [{ texte: T.fermer, principal: true, action: function () { fermerFenetre(); rendre(); } }], { large: true, sansFocus: true });
  }

  // Changer l'horaire d'un groupe à partir d'une date : les séances prévues (sans appel) suivent.
  function seancesADeplacer(groupeId, depuis) {
    return tout("SELECT s.* FROM seance s WHERE s.groupe_id = ? AND s.date >= ? AND s.statut IN ('prevue', 'reportee') AND NOT EXISTS (SELECT 1 FROM presence p WHERE p.seance_id = s.id) ORDER BY s.date",
      [groupeId, depuis]);
  }
  function deplacerSeances(groupeId, depuis, jour, debut, fin, salle) {
    var lc = conges(), ss = seancesADeplacer(groupeId, depuis);
    ss.forEach(function (s) {
      // Même semaine (du dimanche au samedi), nouveau jour ; jamais avant la date de départ.
      var d = plusJours(s.date, jour - versDate(s.date).getDay());
      if (d < depuis) d = plusJours(d, 7);
      var c = congeDu(d, lc);
      executer("UPDATE seance SET date = ?, debut = ?, fin = ?, salle = ?, statut = ?, remarque = ? WHERE id = ?",
        [d, debut, fin, salle, c ? "annulee" : s.statut, c ? (c.libelle + " : " + T.horaire_conge) : s.remarque, s.id]);
    });
    modifie();
    return ss.length;
  }
  function fenetreHoraire(id) {
    var gs = groupes();
    if (!gs.length) return;
    var g0 = (id > 0 && groupeParId(id)) || gs[0];
    var choix = liste("groupe_id", gs.map(function (g) { return [g.id, g.nom]; }), g0.id);
    var depuis = saisie("depuis", aujourdhui(), "date", { requis: true });
    var jour = liste("jour", SEMAINE.map(function (j) { return [j, nomJour(j)]; }), aUnJour(g0) ? g0.jour : 0);
    var debut = saisie("debut", g0.debut, "time"), fin = saisie("fin", g0.fin, "time"), salle = saisie("salle", g0.salle);
    var info = h("p", { class: "classe-aide" });
    function maj() {
      var g = groupeParId(+choix.value), n = dateValide(depuis.value) ? seancesADeplacer(g.id, depuis.value).length : 0;
      var avant = (aUnJour(g) ? nomJour(g.jour) + " " : "") + horaire(g), apres = nomJour(jour.value) + " " + horaire({ debut: debut.value, fin: fin.value });
      info.textContent = n ? tpl(T.horaire_apercu, { n: nombre(n), avant: avant.trim() || "—", apres: apres.trim() }) : T.horaire_aucune;
    }
    choix.addEventListener("change", function () {
      var g = groupeParId(+choix.value);
      if (aUnJour(g)) jour.value = String(g.jour);
      debut.value = g.debut || ""; fin.value = g.fin || ""; salle.value = g.salle || "";
      maj();
    });
    [depuis, jour, debut, fin].forEach(function (c) { c.addEventListener("change", maj); c.addEventListener("input", maj); });
    ouvrirFenetre(T.horaire_titre, [h("div", { class: "grille-champs" },
      champ(T.groupe, choix), champ(T.a_partir_du, depuis), champ(T.nouveau_jour, jour), champ(T.debut, debut), champ(T.fin, fin), champ(T.salle, salle)), info], [
      { texte: T.appliquer, principal: true, icone: "i-horloge", action: function (f) {
        if (!dateValide(depuis.value)) { erreurFenetre(f, T.date_obligatoire); return; }
        var gid = +choix.value;
        transaction(function () {
          executer("UPDATE groupe SET jour = ?, debut = ?, fin = ?, salle = ? WHERE id = ?", [+jour.value, debut.value, fin.value, salle.value.trim(), gid]);
          deplacerSeances(gid, depuis.value, +jour.value, debut.value, fin.value, salle.value.trim());
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ]);
    maj();
  }

  function fenetreRegles() {
    var s = lireSeuils();
    var champs = [["seuil_alerte", s.seuil_alerte], ["seuil_exclusion", s.seuil_exclusion], ["seuil_total", s.seuil_total]].map(function (x) {
      return champ(T[x[0]], saisie(x[0], x[1], "number", { min: 1, max: 60 }));
    });
    var s2 = saisie("debut_s2", reglage("debut_s2"), "date");
    ouvrirFenetre(T.regles, [h("p", { class: "classe-aide", text: T.regles_aide }), h("div", { class: "grille-champs" }, champs, champ(T.debut_s2, s2))], [
      { texte: T.enregistrer, principal: true, action: function (f) {
        var v = lireFormulaire(f);
        transaction(function () {
          ["seuil_alerte", "seuil_exclusion", "seuil_total"].forEach(function (k) { var n = parseInt(v[k], 10); if (n > 0) ecrireReglage(k, n); });
          if (dateValide(v.debut_s2)) ecrireReglage("debut_s2", v.debut_s2);
        });
        fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ]);
  }

  function exporterRegistre(g, per) {
    var d = donneesRegistre(g, per);
    var ss = d.ss.filter(function (s) { return s.statut !== "annulee"; });
    var lignes = [[T.num, T.nom, T.prenom, T.matricule].concat(ss.map(function (s) { return s.date; }), [T.col_presents, T.col_absences, T.col_justifiees, T.col_retards, T.taux, T.niveau.alerte])]
      .concat(d.membres.map(function (e, i) {
        var b = bilanLigne(d, e);
        return [i + 1, e.nom, e.prenom, e.matricule].concat(ss.map(function (s) { var x = d.statuts[s.id + ":" + e.id]; return x ? T.lettres[x] : ""; }),
          [b.present + b.retard, b.absent, b.excuse, b.retard, pourcent(b.taux), b.niveau ? T.niveau[b.niveau] : ""]);
      }));
    telecharger("registre-" + g.nom.replace(/[^\w؀-ۿ-]+/g, "_") + "-" + per.id + ".csv", csv(lignes), "text/csv;charset=utf-8");
  }
  function imprimerRegistre(g, per) {
    var d = donneesRegistre(g, per), ss = d.ss.filter(function (s) { return s.statut !== "annulee"; });
    var feuille = h("div", { class: "impression impression--registre", dir: document.documentElement.dir || "ltr" },
      h("p", { class: "impression__cours", text: T.cours }),
      h("h1", { text: T.registre + " · " + g.nom + " · " + per.nom }),
      h("p", { text: [aUnJour(g) ? nomJour(g.jour) : "", horaire(g), g.salle].filter(Boolean).join(" · ") + " · " + T.legende.split(".")[0] }),
      h("table", null,
        h("thead", null, h("tr", null, [T.num, T.etudiant].map(function (x) { return h("th", { text: x }); })
          .concat(ss.map(function (s) { return h("th", { class: "impression__date", text: s.date.slice(8, 10) + "/" + s.date.slice(5, 7) }); }),
            [T.lettres.absent, T.lettres.excuse, T.lettres.retard, "%"].map(function (x) { return h("th", { text: x }); })))),
        h("tbody", null, d.membres.map(function (e, i) {
          var b = bilanLigne(d, e);
          return h("tr", null, [nombre(i + 1), nomComplet(e)].map(function (x) { return h("td", { text: x }); })
            .concat(ss.map(function (s) { var x = d.statuts[s.id + ":" + e.id]; return h("td", { class: "impression__case", text: x ? T.lettres[x] : "" }); }),
              [nombre(b.absent), nombre(b.excuse), nombre(b.retard), pourcent(b.taux)].map(function (x) { return h("td", { class: "impression__case", text: x }); })));
        }))));
    document.body.appendChild(feuille);
    document.documentElement.classList.add("lx-impression");
    function nettoyer() {
      document.documentElement.classList.remove("lx-impression");
      feuille.remove();
      window.removeEventListener("afterprint", nettoyer);
    }
    window.addEventListener("afterprint", nettoyer);
    window.print();
    setTimeout(function () { if (document.body.contains(feuille) && !window.matchMedia("print").matches) nettoyer(); }, 1500);
  }

  /* ---------- Onglet Notes ---------- */

  function rendreNotes(p) {
    ajouter(p, h("div", { class: "classe-outils" },
      bouton(T.nouvelle_eval, function () { fenetreEvaluation(null); }, { icone: "i-plus", classe: "bouton--prisme" }),
      bouton(T.exporter_csv, function () { exporterCsv("notes"); }, { icone: "i-telecharger" })));
    var evals = tout("SELECT * FROM evaluation ORDER BY date, id");
    var membres = etudiants(etat.groupe);
    if (!evals.length) { p.appendChild(h("p", { class: "classe-vide", text: T.aucune_eval })); return; }
    if (!membres.length) { p.appendChild(h("p", { class: "classe-vide", text: T.aucun_etudiant })); return; }
    var notes = {};
    tout("SELECT * FROM note").forEach(function (n) { notes[n.evaluation_id + ":" + n.etudiant_id] = n.valeur; });
    var moy = moyennes();
    var tete = h("tr", null, h("th", { scope: "col", text: T.etudiant }), evals.map(function (ev) {
      return h("th", { scope: "col", class: "nombre" },
        h("button", { type: "button", class: "lien-nom", onclick: function () { fenetreEvaluation(ev.id); }, text: ev.titre }),
        h("span", { class: "sous-titre-col", text: (T.genre_eval[ev.genre] || ev.genre) + " · /" + nombre(ev.bareme) + (ev.coefficient !== 1 ? " · ×" + nombre(ev.coefficient) : "") }));
    }), h("th", { scope: "col", class: "nombre", text: T.moyenne }));
    var corps = h("tbody");
    membres.forEach(function (e) {
      var cellMoy = h("td", { class: "nombre moyenne", text: moy[e.id] != null ? nombre(moy[e.id]) : "" });
      corps.appendChild(h("tr", null, h("th", { scope: "row", text: nomComplet(e) }), evals.map(function (ev) {
        var v = notes[ev.id + ":" + e.id];
        var entree = h("input", { type: "text", inputmode: "decimal", class: "saisie-note", value: v == null ? "" : String(v).replace(".", LANGUE === "en" ? "." : ","),
          "aria-label": nomComplet(e) + " · " + ev.titre, dir: "ltr" });
        entree.addEventListener("change", function () {
          var x = lireNote(entree.value);
          if (x !== null && (isNaN(x) || x < 0 || x > ev.bareme)) {
            entree.setAttribute("aria-invalid", "true");
            entree.title = tpl(T.note_invalide, { b: nombre(ev.bareme) });
            return;
          }
          entree.removeAttribute("aria-invalid"); entree.title = "";
          if (x === null) executer("DELETE FROM note WHERE evaluation_id = ? AND etudiant_id = ?", [ev.id, e.id]);
          else executer("INSERT INTO note (evaluation_id, etudiant_id, valeur) VALUES (?, ?, ?) ON CONFLICT (evaluation_id, etudiant_id) DO UPDATE SET valeur = excluded.valeur", [ev.id, e.id, x]);
          modifie();
          var m = moyennes()[e.id];
          cellMoy.textContent = m != null ? nombre(m) : "";
        });
        entree.addEventListener("keydown", function (k) {
          if (k.key !== "Enter") return;
          k.preventDefault();
          // Entrée : la même évaluation, étudiant suivant (comme dans un tableur).
          var col = Array.prototype.indexOf.call(entree.closest("tr").querySelectorAll(".saisie-note"), entree);
          var suivante = entree.closest("tr").nextElementSibling;
          if (suivante) suivante.querySelectorAll(".saisie-note")[col].focus();
        });
        return h("td", { class: "nombre" }, entree);
      }), cellMoy));
    });
    var pied = h("tfoot", null, h("tr", null, h("th", { scope: "row", text: T.moyenne_groupe }), evals.map(function (ev) {
      var vals = membres.map(function (e) { return notes[ev.id + ":" + e.id]; }).filter(function (v) { return v != null; });
      return h("td", { class: "nombre", text: vals.length ? nombre(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : "" });
    }), h("td")));
    p.appendChild(h("div", { class: "tableau-defilant" }, h("table", { class: "tableau tableau--classe tableau--notes" }, h("thead", null, tete), corps, pied)));
  }

  function fenetreEvaluation(id) {
    var ev = id ? un("SELECT * FROM evaluation WHERE id = ?", [id]) : { titre: "", genre: "td", date: aujourdhui(), bareme: 20, coefficient: 1 };
    var corps = h("div", { class: "grille-champs" },
      champ(T.titre_eval, saisie("titre", ev.titre, "text", { requis: true }), "champ--large"),
      champ(T.genre, liste("genre", Object.keys(T.genre_eval).map(function (k) { return [k, T.genre_eval[k]]; }), ev.genre)),
      champ(T.date, saisie("date", ev.date, "date")),
      champ(T.bareme, saisie("bareme", ev.bareme, "number", { min: 1, step: "any" })),
      champ(T.coefficient, saisie("coefficient", ev.coefficient, "number", { min: 0, step: "any" })));
    var boutons = [
      { texte: T.enregistrer, principal: true, action: function (form) {
        var v = lireFormulaire(form);
        if (!v.titre) { erreurFenetre(form, T.nom_obligatoire); return; }
        var bareme = lireNote(v.bareme), coef = lireNote(v.coefficient);
        var params = [v.titre, v.genre, v.date, bareme > 0 ? bareme : 20, coef >= 0 ? coef : 1];
        if (id) executer("UPDATE evaluation SET titre = ?, genre = ?, date = ?, bareme = ?, coefficient = ? WHERE id = ?", params.concat([id]));
        else executer("INSERT INTO evaluation (titre, genre, date, bareme, coefficient) VALUES (?, ?, ?, ?, ?)", params);
        modifie(); fermerFenetre(); rendre();
      } },
      { texte: T.annuler, action: fermerFenetre }
    ];
    if (id) boutons.push({ texte: T.supprimer, danger: true, icone: "i-poubelle", action: function () {
      if (!window.confirm(tpl(T.confirmer_suppr_eval, { t: ev.titre }))) return;
      executer("DELETE FROM evaluation WHERE id = ?", [id]);
      modifie(); fermerFenetre(); rendre();
    } });
    ouvrirFenetre(id ? T.modifier_eval : T.nouvelle_eval, corps, boutons);
  }

  /* ---------- Onglet Données ---------- */

  function rendreDonnees(p) {
    var serveur = stockage.mode === "serveur";
    var ou = h("section", { class: "carte carte-donnees" }, h("h3", { text: T.ou_donnees }));
    if (serveur && stockage.etat) {
      ajouter(ou, [
        h("dl", { class: "definitions" },
          h("div", null, h("dt", { text: T.fichier }), h("dd", null, h("code", { dir: "ltr", text: stockage.etat.chemin }))),
          h("div", null, h("dt", { text: T.taille }), h("dd", { text: taille(stockage.etat.taille || 0) }))),
        h("p", { text: tpl(T.sauvegardes, { dossier: stockage.etat.sauvegardes, n: nombre(stockage.etat.nb_sauvegardes || 0) }) })]);
    } else {
      ou.appendChild(h("p", { text: T.navigateur_explication }));
    }
    var entree = h("input", { type: "file", accept: ".sqlite,.sqlite3,.db,application/vnd.sqlite3", class: "visuellement-cache", tabindex: "-1" });
    entree.addEventListener("change", function () { if (entree.files[0]) importerBase(entree.files[0]); entree.value = ""; });
    ajouter(ou, h("div", { class: "classe-actions" },
      bouton(T.telecharger_base, telechargerBase, { icone: "i-telecharger", classe: "bouton--prisme" }),
      bouton(T.importer_base, function () { entree.click(); }, { icone: "i-importer" }), entree));

    var exports = h("section", { class: "carte carte-donnees" }, h("h3", { text: T.exports }),
      h("div", { class: "classe-actions" }, [["etudiants", T.csv_etudiants], ["seances", T.csv_seances], ["presences", T.csv_presences], ["notes", T.csv_notes], ["observations", T.csv_observations]]
        .map(function (x) { return bouton(x[1], function () { exporterCsv(x[0]); }, { icone: "i-telecharger" }); })));

    var code = 'import sqlite3\nimport pandas as pd\n\ncon = sqlite3.connect("donnees/classe.sqlite")\netudiants = pd.read_sql("SELECT nom, prenom, groupe_id FROM etudiant", con)\nprint(etudiants.groupby("groupe_id").size())\n\npresences = pd.read_sql("SELECT statut, COUNT(*) AS n FROM presence GROUP BY statut", con)\nprint(presences)';
    var python = h("section", { class: "carte carte-donnees" }, h("h3", { text: T.python_titre }),
      h("p", { text: T.python_aide }),
      h("pre", { dir: "ltr" }, h("code", { class: "language-python", text: code })),
      h("h4", { text: T.tables_titre }),
      h("ul", { class: "liste-simple" }, TABLES.concat(["conge", "reglage"]).map(function (t) {
        var cols = tout("PRAGMA table_info(" + t + ")").map(function (c) { return c.name; }).join(", ");
        var n = un("SELECT COUNT(*) AS n FROM " + t).n;
        return h("li", null, h("code", { dir: "ltr", text: t }), " (" + nombre(n) + ") : " + T.tables_aide[t] + ". ", h("small", { dir: "ltr", class: "colonnes", text: cols }));
      })));

    var prive = h("aside", { class: "encadre encadre--attention" }, h("p", { class: "encadre-titre", text: T.vie_privee_titre }), h("p", { text: T.vie_privee }));
    var danger = h("div", { class: "classe-actions" }, bouton(T.tout_effacer, function () {
      var r = window.prompt(T.confirmer_effacer);
      if (r == null || r.trim().toUpperCase() !== T.mot_effacer.toUpperCase()) return;
      ouvrirBase(null);
      modifie(); rendre();
    }, { icone: "i-poubelle", classe: "bouton--danger" }));
    ajouter(p, h("div", { class: "grille-donnees" }, ou, exports, python, h("div", null, prive, danger)));
  }

  function telechargerBase() {
    telecharger("classe-" + aujourdhui() + ".sqlite", exporter(), "application/vnd.sqlite3");
  }
  function importerBase(fichier) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      var octets = new Uint8Array(lecteur.result);
      var essai;
      try { essai = new SQL.Database(octets); } catch (e) { window.alert(T.import_invalide); return; }
      var ok = baseReconnue(essai);
      essai.close();
      if (!ok) { window.alert(T.import_invalide); return; }
      if (!window.confirm(tpl(T.confirmer_import, { f: fichier.name }))) return;
      ouvrirBase(octets);
      modifie(); rendre();
      window.alert(T.import_ok);
    };
    lecteur.readAsArrayBuffer(fichier);
  }

  function exporterCsv(quoi) {
    var filtre = etat.groupe, lignes, suffixe = filtre > 0 ? "-" + nomGroupe(filtre).replace(/[^\w؀-ۿ-]+/g, "_") : "";
    if (quoi === "etudiants") {
      var moy = moyennes();
      lignes = [[T.nom, T.prenom, T.matricule, T.email, T.telephone, T.groupe, T.responsable, T.absences, T.moyenne, T.remarque]]
        .concat(etudiants(filtre).map(function (e) {
          return [e.nom, e.prenom, e.matricule, e.email, e.telephone, e.groupe_nom || T.sans_groupe, e.responsable ? "✓" : "", e.absences, moy[e.id] != null ? nombre(moy[e.id]) : "", e.remarque];
        }));
    } else if (quoi === "seances") {
      lignes = [[T.date, T.debut, T.fin, T.groupe, T.genre, T.titre_seance, T.statut, T.contenu, T.devoirs, T.appel, T.remarque]]
        .concat(seances(filtre > 0 ? filtre : 0, "toutes").map(function (s) {
          return [s.date, s.debut, s.fin, s.groupe_nom, T.genre_seance[s.genre] || s.genre, s.titre, T.statut_seance[s.statut] || s.statut, s.contenu, s.devoirs,
            s.nb_appel ? s.nb_presents + "/" + s.nb_appel : "", s.remarque];
        }));
    } else if (quoi === "presences") {
      var params = [], sql = "SELECT s.date, s.titre, g.nom AS groupe_nom, e.nom, e.prenom, e.matricule, p.statut FROM presence p JOIN seance s ON s.id = p.seance_id JOIN groupe g ON g.id = s.groupe_id JOIN etudiant e ON e.id = p.etudiant_id";
      if (filtre > 0) { sql += " WHERE s.groupe_id = ?"; params.push(filtre); }
      lignes = [[T.date, T.titre_seance, T.groupe, T.nom, T.prenom, T.matricule, T.presences]]
        .concat(tout(sql + " ORDER BY s.date, e.nom", params).map(function (r) { return [r.date, r.titre, r.groupe_nom, r.nom, r.prenom, r.matricule, T.presence[r.statut] || r.statut]; }));
    } else if (quoi === "notes") {
      var evals = tout("SELECT * FROM evaluation ORDER BY date, id");
      var notes = {};
      tout("SELECT * FROM note").forEach(function (n) { notes[n.evaluation_id + ":" + n.etudiant_id] = n.valeur; });
      var m = moyennes();
      lignes = [[T.nom, T.prenom, T.matricule, T.groupe].concat(evals.map(function (ev) { return ev.titre + " /" + ev.bareme; }), [T.moyenne])]
        .concat(etudiants(filtre).map(function (e) {
          return [e.nom, e.prenom, e.matricule, e.groupe_nom || T.sans_groupe].concat(evals.map(function (ev) {
            var v = notes[ev.id + ":" + e.id]; return v == null ? "" : nombre(v);
          }), [m[e.id] != null ? nombre(m[e.id]) : ""]);
        }));
    } else {
      var p2 = [], sql2 = "SELECT o.date, o.genre, o.texte, e.nom, e.prenom, g.nom AS groupe_nom FROM observation o JOIN etudiant e ON e.id = o.etudiant_id LEFT JOIN groupe g ON g.id = e.groupe_id";
      if (filtre > 0) { sql2 += " WHERE e.groupe_id = ?"; p2.push(filtre); }
      lignes = [[T.date, T.nom, T.prenom, T.groupe, T.genre, T.texte_obs]]
        .concat(tout(sql2 + " ORDER BY o.date, e.nom", p2).map(function (r) { return [r.date, r.nom, r.prenom, r.groupe_nom || T.sans_groupe, T.genre_obs[r.genre] || r.genre, r.texte]; }));
    }
    telecharger(quoi + suffixe + "-" + aujourdhui() + ".csv", csv(lignes), "text/csv;charset=utf-8");
  }

  /* ---------- Feuille d'émargement imprimable ---------- */

  function imprimerEmargement(g) {
    var membres = etudiants(g.id);
    var dates = tout("SELECT date FROM seance WHERE groupe_id = ? AND date >= ? AND statut IN ('prevue', 'reportee') ORDER BY date, debut LIMIT 8", [g.id, aujourdhui()])
      .map(function (s) { return formatDate(s.date, { day: "numeric", month: "short" }); });
    while (dates.length < 8) dates.push("");
    var feuille = h("div", { class: "impression", dir: document.documentElement.dir || "ltr" },
      h("p", { class: "impression__cours", text: T.cours }),
      h("h1", { text: T.emargement_titre + " · " + g.nom }),
      h("p", { text: [g.horaire, g.salle].filter(Boolean).join(" · ") }),
      h("table", null,
        h("thead", null, h("tr", null, [T.num, T.nom, T.prenom, T.matricule].map(function (x) { return h("th", { text: x }); }).concat(dates.map(function (d) { return h("th", { class: "impression__date", text: d }); })))),
        h("tbody", null, membres.map(function (e, i) {
          return h("tr", null, [nombre(i + 1), e.nom, e.prenom, e.matricule].map(function (x) { return h("td", { text: x }); }).concat(dates.map(function () { return h("td"); })));
        }))));
    document.body.appendChild(feuille);
    document.documentElement.classList.add("lx-impression");
    function nettoyer() {
      document.documentElement.classList.remove("lx-impression");
      feuille.remove();
      window.removeEventListener("afterprint", nettoyer);
    }
    window.addEventListener("afterprint", nettoyer);
    window.print();
    setTimeout(function () { if (document.body.contains(feuille) && !window.matchMedia("print").matches) nettoyer(); }, 1500);
  }

  /* ---------- Démarrage ---------- */

  function chargerMoteur() {
    // Page ouverte comme fichier (file://) : le navigateur refuse de charger le .wasm, on prend la version JavaScript pure.
    var dossier = BASE + "assets/vendor/sqljs/";
    function asm() {
      return chargerScript(dossier + "sql-asm.js").then(function () { return window.initSqlJs(); });
    }
    if (location.protocol === "file:" || typeof WebAssembly === "undefined") return asm();
    return chargerScript(dossier + "sql-wasm.js")
      .then(function () { return window.initSqlJs({ locateFile: function (f) { return dossier + f; } }); })
      .catch(function () { window.initSqlJs = undefined; return asm(); });
  }

  function etape(texte) {
    var el = racine.querySelector(".chargement__texte");
    if (el) el.textContent = texte;
  }
  function demarrer() {
    etape(T.etape_moteur);
    // Les titres des diaporamas, pour les proposer dans les séances (facultatif).
    chargerScript(BASE + "assets/diapos/diapos-" + LANGUE + ".js").catch(function () { /* pas de diaporamas : liste vide */ });
    Promise.all([chargerMoteur(), detecterServeur()]).then(function (r) {
      SQL = r[0];
      stockage.mode = r[1] ? "serveur" : "navigateur";
      etape(T.etape_base);
      return stockage.mode === "serveur" ? lireServeur() : lireNavigateur();
    }).then(function (octets) {
      var neuve = !octets;
      if (!ouvrirBase(octets)) {
        // Fichier illisible ou d'une autre application : on ne l'écrase pas, on travaille sur une base neuve en mémoire.
        stockage.erreur = null;
        ouvrirBase(null);
        neuve = true;
      }
      construireCadre();
      zones.onglets.addEventListener("keydown", clavierOnglets);
      afficherEtat();
      if (neuve || baseMigree) modifie();
      rendre();
      setInterval(majRappel, 60000);
    }).catch(function (e) {
      vider(racine).appendChild(h("p", { class: "outil-message outil-message--erreur", text: T.erreur_moteur }));
      if (window.console) console.error(e);
    });
  }

  demarrer();
})();
