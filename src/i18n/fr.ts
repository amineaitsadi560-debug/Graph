// French is the default language and the source of truth for translation keys.
const fr = {
  // ---- common
  loading: 'Chargement…', save: 'Enregistrer', saving: 'Enregistrement…', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
  add: 'Ajouter', close: 'Fermer', yes: 'Oui', no: 'Non', saved: 'Enregistré ✓', deleted: 'Supprimé', optional: 'optionnel',
  retry: 'Réessayer', minutes: 'min', da: 'DA', language: 'Langue', required: 'Ce champ est obligatoire.',
  // ---- errors (shared)
  err_invalid_name: 'Veuillez saisir votre nom complet (2 caractères minimum).',
  err_invalid_phone: 'Numéro de téléphone invalide. Exemple : 0542 42 56 69 ou +213 542 42 56 69.',
  err_invalid_plan: 'Cette formule n’est plus disponible. Choisissez-en une autre.',
  err_invalid_service: 'Ce service n’est plus disponible. Choisissez-en un autre.',
  err_invalid_input: 'Informations incomplètes. Vérifiez le formulaire.',
  err_message_too_long: 'Le message est trop long (500 caractères maximum).',
  err_outside_hours: 'Ce créneau est en dehors des horaires d’ouverture.',
  err_blocked: 'Ce créneau n’est pas disponible (fermeture exceptionnelle).',
  err_too_soon: 'Ce créneau est trop proche ou déjà passé. Choisissez un horaire plus tard.',
  err_too_far: 'Cette date est trop éloignée. Choisissez une date plus proche.',
  err_full: 'Ce créneau vient d’être complet. Merci d’en choisir un autre.',
  err_duplicate: 'Vous avez déjà une demande pour ce créneau.',
  err_too_many_pending: 'Vous avez déjà 3 demandes en attente. Attendez qu’elles soient traitées ou appelez-nous.',
  err_invalid_transition: 'Ce changement de statut n’est pas autorisé.',
  err_hours_overlap: 'Cette plage chevauche une plage existante ce jour-là.',
  err_owner_only: 'Action réservée au propriétaire.',
  err_user_not_found: 'Aucun compte avec cet e-mail. Créez-le d’abord dans Supabase (Authentication → Users).',
  err_cannot_remove_self: 'Vous ne pouvez pas vous retirer vous-même.',
  err_forbidden: 'Accès refusé.',
  err_network: 'Problème de connexion. Vérifiez internet et réessayez.',
  err_unknown: 'Une erreur est survenue. Réessayez dans un instant.',
  err_fk: 'Impossible de supprimer : élément utilisé par des réservations. Désactivez-le plutôt.',
  // ---- config
  cfg_title: 'Configuration requise', cfg_text: 'Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ne sont pas définies. Consultez le README (section Supabase / Netlify).',
  // ---- public nav
  nav_about: 'La salle', nav_strength: 'Musculation', nav_cardio: 'Cardio', nav_plans: 'Tarifs', nav_booking: 'Réserver', nav_contact: 'Contact', nav_book_cta: 'Réserver',
  menu: 'Menu',
  // ---- hero
  hero_eyebrow: 'Bachdjerrah · Alger', hero_title_1: 'Dépassez', hero_title_2: 'vos limites.',
  hero_sub: 'Salle de Sport Milinium CHERGUI : musculation, cardio et abonnements adaptés à votre rythme. Inscrivez-vous ou réservez votre séance en quelques clics.',
  hero_cta_book: 'Réserver une séance', hero_cta_plans: 'Voir les tarifs', hero_rating: '{value}/5 · {count} avis Google',
  scroll: 'Défiler',
  // ---- about
  about_eyebrow: 'Bienvenue', about_title: 'Votre salle de sport à Bachdjerrah',
  about_p1: 'La salle Milinium CHERGUI vous accueille pour vous entraîner sérieusement, que vous débutiez ou que vous prépariez votre prochain objectif.',
  about_p2: 'Choisissez la formule qui vous convient — de la séance à l’unité jusqu’à l’abonnement illimité — puis réservez en ligne. Notre équipe confirme votre demande par téléphone.',
  about_f1_t: 'Musculation', about_f1_d: 'Renforcement et prise de masse.',
  about_f2_t: 'Cardio', about_f2_d: 'Tapis de course et vélos.',
  about_f3_t: 'Abonnements flexibles', about_f3_d: 'De la séance unique au forfait illimité.',
  about_f4_t: 'Réservation simple', about_f4_d: 'Demande en ligne, confirmation par la salle.',
  // ---- strength / cardio
  strength_eyebrow: 'Entraînement', strength_title: 'Musculation & renforcement',
  strength_text: 'Développez votre force, votre masse musculaire et votre condition physique avec des séances structurées et adaptées à votre niveau.',
  strength_b1: 'Prise de masse et force', strength_b2: 'Renforcement musculaire', strength_b3: 'Remise en forme et tonification', strength_b4: 'Séances 1 à 4 fois par semaine, ou illimitées',
  cardio_eyebrow: 'Endurance', cardio_title: 'Cardio : tapis de course & vélos',
  cardio_text: 'Améliorez votre endurance, brûlez des calories et entretenez votre cœur avec nos équipements de cardio.',
  cardio_b1: 'Tapis de course', cardio_b2: 'Vélos', cardio_b3: 'Endurance et perte de poids', cardio_b4: 'Forfaits cardio dédiés',
  photo_hint: 'Illustration',
  // ---- plans
  plans_eyebrow: 'Abonnements', plans_title: 'Tarifs & formules', plans_sub: 'Choisissez votre formule puis réservez votre inscription en ligne.',
  plans_cat_muscu: 'Musculation', plans_cat_cardio: 'Cardio', plan_choose: 'Choisir cette formule', plan_best: 'Populaire', price_tbc: 'Tarif à confirmer',
  plans_unconfirmed: 'Les tarifs seront affichés dès leur confirmation par la salle. Contactez-nous pour les connaître.',
  plans_cardio_note: 'Les forfaits cardio (tapis de course et vélos) sont proposés par la salle — contactez-nous pour le tarif.',
  plans_none: 'Les formules seront bientôt disponibles.',
  // ---- booking
  booking_eyebrow: 'Réservation', booking_title: 'Inscription & réservation', booking_sub: 'Remplissez le formulaire : la salle reçoit votre demande immédiatement et vous confirme par téléphone.',
  kind_registration: 'M’inscrire à une formule', kind_session: 'Réserver une séance / visite',
  f_plan: 'Formule', f_service: 'Service', f_date: 'Date souhaitée', f_time: 'Heure souhaitée', f_name: 'Nom complet', f_phone: 'Téléphone',
  f_message: 'Message', f_message_ph: 'Une question, un objectif, un besoin particulier…', choose: 'Choisir…',
  slots_pick_date: 'Choisissez d’abord une date.', slots_loading: 'Recherche des créneaux…', slots_none: 'Aucun créneau ce jour-là (salle fermée).',
  slot_women: 'Femmes', slot_men: 'Hommes', slot_places: '{n} place(s)', slot_full: 'Complet', slot_blocked: 'Indisponible', slot_closed: 'Passé',
  slots_legend_women: 'Créneau réservé aux femmes',
  hours_unconfigured: 'Les horaires de réservation n’ont pas encore été publiés. Appelez-nous pour réserver.',
  submit: 'Envoyer ma demande', submitting: 'Envoi…',
  conf_title: 'Demande envoyée !', conf_text: 'Merci {name}. Votre demande a bien été enregistrée. La salle la confirmera par téléphone au {phone}.',
  conf_ref: 'Référence', conf_status: 'Statut : en attente de confirmation', conf_when: 'Créneau demandé', conf_new: 'Nouvelle demande', conf_note: 'Aucun paiement en ligne : le règlement se fait à la salle.',
  // ---- hours / contact
  hours_title: 'Horaires d’ouverture', hours_none: 'Horaires bientôt disponibles — appelez-nous.', hours_closed: 'Fermé',
  aud_all: 'Mixte', aud_women: 'Femmes uniquement', aud_men: 'Hommes uniquement',
  contact_eyebrow: 'Nous trouver', contact_title: 'Contact & accès', contact_phone: 'Téléphone', contact_address: 'Adresse', contact_call: 'Appeler',
  contact_whatsapp: 'WhatsApp',
  gps_button: 'Y aller en GPS', gps_sub: 'Ouvrir l’itinéraire dans Google Maps', map_title: 'Localisation de la salle sur la carte',
  footer_rights: 'Tous droits réservés.', footer_staff: 'Espace employés',
  // ---- admin: auth
  a_title: 'Espace employés', a_login_sub: 'Accès réservé au personnel autorisé.', a_email: 'E-mail', a_password: 'Mot de passe', a_signin: 'Se connecter', a_signout: 'Déconnexion',
  a_bad_creds: 'E-mail ou mot de passe incorrect.', a_not_staff: 'Ce compte n’est pas autorisé à accéder à l’espace employés.', a_back_site: 'Retour au site',
  // ---- admin: nav
  a_nav_overview: 'Accueil', a_nav_bookings: 'Réservations', a_nav_calendar: 'Agenda', a_nav_customers: 'Clients', a_nav_manage: 'Gérer',
  m_prices: 'Tarifs', m_services: 'Services', m_hours: 'Horaires', m_settings: 'Réglages', m_staff: 'Équipe',
  // ---- admin: overview
  stat_customers: 'Clients', stat_pending: 'Nouvelles demandes', stat_confirmed: 'Confirmés', stat_upcoming: 'À venir (confirmés)', stat_today: 'Aujourd’hui', stat_completed: 'Terminés',
  ov_pending: 'Demandes à traiter', ov_no_pending: 'Aucune demande en attente 🎉', ov_memberships: 'Statistiques des formules', ov_registrations: 'inscriptions', ov_no_stats: 'Pas encore d’inscriptions.',
  ov_prices_banner: 'Les tarifs ne sont pas encore publiés sur le site. Vérifiez-les puis publiez-les.', ov_prices_btn: 'Vérifier les tarifs',
  ov_hours_banner: 'Aucun horaire d’ouverture n’est configuré : les clients ne peuvent pas réserver.', ov_hours_btn: 'Configurer les horaires',
  live: 'Mise à jour en direct', refresh: 'Actualiser',
  // ---- admin: bookings
  status_pending: 'En attente', status_confirmed: 'Confirmé', status_rejected: 'Refusé', status_cancelled: 'Annulé', status_completed: 'Terminé',
  all: 'Tous', f_status: 'Statut', f_kind: 'Type', search_ph: 'Rechercher un nom ou un téléphone…', from: 'Du', to: 'Au',
  act_confirm: 'Confirmer', act_reject: 'Refuser', act_cancel: 'Annuler', act_complete: 'Terminer', act_reopen: 'Remettre en attente',
  confirm_cancel: 'Annuler ce rendez-vous ?', confirm_reject: 'Refuser cette demande ?', no_results: 'Aucun résultat.',
  received: 'Reçu le', note: 'Note interne', note_ph: 'Note visible par l’équipe uniquement…', call: 'Appeler',
  new_booking: 'Nouvelle réservation (téléphone / sur place)', created_confirmed: 'Réservation créée et confirmée.',
  kind_reg_short: 'Inscription', kind_ses_short: 'Séance', range_all: 'Toutes les dates', range_upcoming: 'À venir', range_today: 'Aujourd’hui', range_week: 'Cette semaine',
  // ---- admin: calendar
  cal_day: 'Jour', cal_week: 'Semaine', cal_month: 'Mois', cal_today: 'Aujourd’hui', cal_blocked: 'Bloqué', cal_empty: 'Aucun rendez-vous.', cal_more: '+{n}',
  // ---- admin: customers
  cu_title: 'Clients', cu_bookings: 'réservation(s)', cu_since: 'Client depuis', cu_history: 'Historique',
  // ---- admin: prices
  pr_title: 'Tarifs des formules', pr_help: 'Modifiez les prix à tout moment. Les prix ne sont visibles du public qu’une fois publiés ci-dessous. Laissez le prix vide si inconnu (ex. cardio) : « Tarif à confirmer » s’affichera.',
  pr_state_on: 'Tarifs publiés sur le site', pr_state_off: 'Tarifs NON publiés (le site affiche « Tarif à confirmer »)', pr_publish: 'Je confirme les tarifs et je les publie', pr_unpublish: 'Dépublier les tarifs',
  pr_owner_only: 'Seul le propriétaire peut publier les tarifs.', pr_price: 'Prix (DA)', pr_cat: 'Catégorie', pr_active: 'Actif', pr_featured: 'Mis en avant', pr_add: 'Ajouter une formule', pr_unset: 'non défini',
  pr_detail: 'Détail', pr_name: 'Nom', fr: 'Français', ar: 'العربية', en: 'English', cat_musculation: 'Musculation', cat_cardio: 'Cardio',
  confirm_delete: 'Supprimer définitivement ?', sort: 'Ordre',
  // ---- admin: services
  sv_title: 'Services réservables', sv_help: 'Ces services apparaissent dans le formulaire de réservation de séance.',
  // ---- admin: hours
  hr_title: 'Horaires d’ouverture', hr_help: 'Ajoutez les plages d’ouverture réelles de chaque jour. Les créneaux sont générés automatiquement selon la durée choisie dans Réglages. Pour un horaire réservé aux femmes, ajoutez une plage « Femmes uniquement ».',
  hr_weekday: 'Jour', hr_opens: 'Ouverture', hr_closes: 'Fermeture', hr_audience: 'Public', hr_none: 'Aucune plage configurée.',
  bl_title: 'Créneaux bloqués', bl_help: 'Bloquez une journée entière ou une plage horaire (fermeture, maintenance, jour férié…).', bl_date: 'Date', bl_whole_day: 'Journée entière', bl_from: 'De', bl_to: 'À', bl_reason: 'Motif', bl_none: 'Aucun blocage à venir.',
  // ---- admin: settings
  st_title: 'Réglages de la salle', st_phone: 'Téléphone', st_address: 'Adresse', st_maps: 'Lien Google Maps (bouton GPS)', st_slot: 'Durée d’un créneau (minutes)', st_capacity: 'Places par créneau',
  st_capacity_help: 'Nombre maximum de demandes (en attente + confirmées) pour un même créneau.', st_notice: 'Délai minimum avant réservation (minutes)', st_advance: 'Réservation possible jusqu’à (jours à l’avance)',
  // ---- admin: staff
  sf_title: 'Équipe', sf_help: 'Créez d’abord le compte dans Supabase (Authentication → Users → Add user), puis ajoutez son e-mail ici pour lui donner accès.', sf_email: 'E-mail du compte', sf_name: 'Nom affiché', sf_role: 'Rôle',
  role_owner: 'Propriétaire', role_employee: 'Employé', sf_add: 'Donner l’accès', sf_remove: 'Retirer', sf_you: 'vous',
} as const;

export type Key = keyof typeof fr;
export type Dict = Record<Key, string>;
export default fr as Dict;
