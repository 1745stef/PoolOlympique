// ─── Pool Olympique LA 2028 — Système i18n ────────────────────────────────────
// Langues : fr-fr | fr-ca | en-us | en-gb | en-ca | als

export const LANGUAGES = [
  { code: 'fr-fr', label: 'Français',        flag: '🇫🇷' },
  { code: 'fr-ca', label: 'Québécois',        flag: 'qc'  }, // SVG inline dans LanguagePicker
  { code: 'en-us', label: 'English (US)',     flag: '🇺🇸' },
  { code: 'en-gb', label: 'English (UK)',     flag: '🇬🇧' },
  { code: 'en-ca', label: 'English (CA)',     flag: '🇨🇦' },
  { code: 'als',   label: 'Elsässisch',       flag: 'als' },
];

export const DEFAULT_LANG = 'fr-fr';

// ─── Dictionnaire principal ────────────────────────────────────────────────────
const T = {
  // Auth
  login:              { 'fr-fr':'Connexion',    'fr-ca':'Connexion',    'en-us':'Log In',    'en-gb':'Log In',    'en-ca':'Log In', 'als': 'Aamelde'    },
  register:           { 'fr-fr':'Inscription',  'fr-ca':'Inscription',  'en-us':'Sign Up',   'en-gb':'Register',  'en-ca':'Sign Up', 'als': 'Iinschriibung'   },
  username:           { 'fr-fr':"Nom d'utilisateur", 'fr-ca':"Nom d'utilisateur", 'en-us':'Username', 'en-gb':'Username', 'en-ca':'Username' },
  usernamePlaceholder:{ 'fr-fr':'ton_pseudo',   'fr-ca':'ton_pseudo',   'en-us':'your_username','en-gb':'your_username','en-ca':'your_username', 'als': 'dìn_nàmme' },
  password:           { 'fr-fr':'Mot de passe', 'fr-ca':'Mot de passe', 'en-us':'Password',  'en-gb':'Password',  'en-ca':'Password', 'als': 'Passwort'  },
  loginBtn:           { 'fr-fr':'Se connecter', 'fr-ca':'Se connecter', 'en-us':'Log In',    'en-gb':'Log In',    'en-ca':'Log In', 'als': 'Aamelde'    },
  registerBtn:        { 'fr-fr':"S'inscrire",   'fr-ca':"S'inscrire",   'en-us':'Sign Up',   'en-gb':'Register',  'en-ca':'Sign Up'   },
  orDivider:          { 'fr-fr':'ou',            'fr-ca':'ou',           'en-us':'or',        'en-gb':'or',        'en-ca':'or', 'als': 'oder'        },
  faceIdLogin:        { 'fr-fr':'Se connecter avec Face ID / Touch ID', 'fr-ca':'Se connecter avec Face ID / Touch ID', 'en-us':'Sign in with Face ID / Touch ID', 'en-gb':'Sign in with Face ID / Touch ID', 'en-ca':'Sign in with Face ID / Touch ID', 'als': 'Mit Face ID / Touch ID aamelde' },
  faceIdEnable:       { 'fr-fr':'🔐 Activer Face ID / Touch ID', 'fr-ca':'🔐 Activer Face ID / Touch ID', 'en-us':'🔐 Enable Face ID / Touch ID', 'en-gb':'🔐 Enable Face ID / Touch ID', 'en-ca':'🔐 Enable Face ID / Touch ID', 'als': '🔐 Face ID / Touch ID aktiviere' },
  enterUsernameFirst: { 'fr-fr':"Entre ton nom d'utilisateur d'abord", 'fr-ca':"Entre ton nom d'utilisateur d'abord", 'en-us':'Enter your username first', 'en-gb':'Enter your username first', 'en-ca':'Enter your username first' },
  authCancelled:      { 'fr-fr':'Authentification annulée', 'fr-ca':'Authentification annulée', 'en-us':'Authentication canceled', 'en-gb':'Authentication cancelled', 'en-ca':'Authentication cancelled', 'als': 'Authentifizierig abbroche' },
  faceIdNotAvailable: { 'fr-fr':'Face ID / Touch ID non disponible sur cet appareil', 'fr-ca':'Face ID / Touch ID non disponible sur cet appareil', 'en-us':'Face ID / Touch ID not available on this device', 'en-gb':'Face ID / Touch ID not available on this device', 'en-ca':'Face ID / Touch ID not available on this device', 'als': 'Net verfìegbar uf dìm Geriät' },
  faceIdActivated:    { 'fr-fr':'✅ Face ID / Touch ID activé pour ce compte !', 'fr-ca':'✅ Face ID / Touch ID activé pour ce compte !', 'en-us':'✅ Face ID / Touch ID enabled for this account!', 'en-gb':'✅ Face ID / Touch ID enabled for this account!', 'en-ca':'✅ Face ID / Touch ID enabled for this account!', 'als': '✅ Aktiviert fer des Konto !' },
  faceIdActivationCancelled: { 'fr-fr':'Activation annulée', 'fr-ca':'Activation annulée', 'en-us':'Activation canceled', 'en-gb':'Activation cancelled', 'en-ca':'Activation cancelled', 'als': 'Aktivierig abbroche' },
  faceIdCannotActivate: { 'fr-fr':"Impossible d'activer Face ID sur cet appareil", 'fr-ca':"Impossible d'activer Face ID sur cet appareil", 'en-us':'Cannot enable Face ID on this device', 'en-gb':'Cannot enable Face ID on this device', 'en-ca':'Cannot enable Face ID on this device' },
  passkeyNoSession:   { 'fr-fr':'Passkey valide mais aucune session sauvegardée. Connecte-toi une fois avec ton mot de passe.', 'fr-ca':'Passkey valide mais aucune session sauvegardée. Connecte-toi une fois avec ton mot de passe.', 'en-us':'Passkey valid but no session saved. Log in once with your password.', 'en-gb':'Passkey valid but no session saved. Log in once with your password.', 'en-ca':'Passkey valid but no session saved. Log in once with your password.', 'als': 'Passkey giltig, awer kei Sitzung gspeichert. Mol mit dìm Passwort aamelde.' },

  // Change Password Page
  newPassword:        { 'fr-fr':'Nouveau mot de passe', 'fr-ca':'Nouveau mot de passe', 'en-us':'New Password', 'en-gb':'New Password', 'en-ca':'New Password', 'als': 'Nejs Passwort' },
  tempPasswordDetected:{ 'fr-fr':'🔒 Mot de passe temporaire détecté.', 'fr-ca':'🔒 Mot de passe temporaire détecté.', 'en-us':'🔒 Temporary password detected.', 'en-gb':'🔒 Temporary password detected.', 'en-ca':'🔒 Temporary password detected.', 'als': '🔒 Temporär Passwort entdeckt.' },
  chooseNewPassword:  { 'fr-fr':'Choisis un nouveau mot de passe pour continuer.', 'fr-ca':'Choisis un nouveau mot de passe pour continuer.', 'en-us':'Please choose a new password to continue.', 'en-gb':'Please choose a new password to continue.', 'en-ca':'Please choose a new password to continue.', 'als': 'Wähl e nej Passwort zum wìdermache.' },
  confirmPassword:    { 'fr-fr':'Confirmer le mot de passe', 'fr-ca':'Confirmer le mot de passe', 'en-us':'Confirm Password', 'en-gb':'Confirm Password', 'en-ca':'Confirm Password', 'als': 'Passwort bestätige' },
  savePassword:       { 'fr-fr':'Enregistrer mon mot de passe', 'fr-ca':'Sauvegarder mon mot de passe', 'en-us':'Save My Password', 'en-gb':'Save My Password', 'en-ca':'Save My Password', 'als': 'Min Passwort speichere' },
  passwordMismatch:   { 'fr-fr':'Les mots de passe ne correspondent pas', 'fr-ca':'Les mots de passe ne correspondent pas', 'en-us':'Passwords do not match', 'en-gb':'Passwords do not match', 'en-ca':'Passwords do not match', 'als': 'D Passwörter stimme net iwwerai' },
  passwordTooShort:   { 'fr-fr':'Minimum 6 caractères', 'fr-ca':'Minimum 6 caractères', 'en-us':'Minimum 6 characters', 'en-gb':'Minimum 6 characters', 'en-ca':'Minimum 6 characters', 'als': 'Mindeschtens 6 Zeiche' },
  repeatPassword:     { 'fr-fr':'Répéter le mot de passe', 'fr-ca':'Répéter le mot de passe', 'en-us':'Repeat Password', 'en-gb':'Repeat Password', 'en-ca':'Repeat Password', 'als': 'Passwort widderhole' },

  // Navigation
  navPicks:       { 'fr-fr':'🎯 Pronostics', 'fr-ca':'🎯 Pronostics', 'en-us':'🎯 My Picks', 'en-gb':'🎯 My Picks', 'en-ca':'🎯 My Picks', 'als': '🎯 Tipp' },
  navResults:     { 'fr-fr':'📊 Mes résultats', 'fr-ca':'📊 Mes résultats', 'en-us':'📊 My Results', 'en-gb':'📊 My Results', 'en-ca':'📊 My Results', 'als': '📊 Mini Resultat' },
  navLeaderboard: { 'fr-fr':'🏆 Classement', 'fr-ca':'🏆 Classement', 'en-us':'🏆 Leaderboard', 'en-gb':'🏆 Leaderboard', 'en-ca':'🏆 Leaderboard', 'als': '🏆 Ranglischt' },
  navMedals:      { 'fr-fr':'🥇 Médailles', 'fr-ca':'🥇 Médailles', 'en-us':'🥇 Medals', 'en-gb':'🥇 Medals', 'en-ca':'🥇 Medals', 'als': '🥇 Medaile' },
  navAdmin:       { 'fr-fr':'🔑 Administration', 'fr-ca':'🔑 Administration', 'en-us':'🔑 Admin', 'en-gb':'🔑 Admin', 'en-ca':'🔑 Admin', 'als': '🔑 Verwaltung' },
  // Chat
  navChat:           { 'fr-fr':'💬 Chat', 'fr-ca':'💬 Chat', 'en-us':'💬 Chat', 'en-gb':'💬 Chat', 'en-ca':'💬 Chat', 'als': '💬 Chat' },
  chatRooms:         { 'fr-fr':'Salons', 'fr-ca':'Salons', 'en-us':'Rooms', 'en-gb':'Rooms', 'en-ca':'Rooms', 'als': 'Ruum' },
  chatGeneral:       { 'fr-fr':'Général', 'fr-ca':'Général', 'en-us':'General', 'en-gb':'General', 'en-ca':'General', 'als': 'Allgemein' },
  chatEmpty:         { 'fr-fr':"Aucun message pour l'instant. Soyez le premier !", 'fr-ca':"Aucun message pour l'instant. Soyez le premier !", 'en-us':'No messages yet. Be the first!', 'en-gb':'No messages yet. Be the first!', 'en-ca':'No messages yet. Be the first!', 'als': "Kei Nochricht fer d'Augeblick" },
  chatNoRooms:       { 'fr-fr':'Aucun salon disponible', 'fr-ca':'Aucun salon disponible', 'en-us':'No rooms available', 'en-gb':'No rooms available', 'en-ca':'No rooms available', 'als': 'Kei Ruum verfìegbar' },
  chatPlaceholder:   { 'fr-fr':'Écrire un message... (Entrée pour envoyer)', 'fr-ca':'Écrire un message... (Entrée pour envoyer)', 'en-us':'Write a message... (Enter to send)', 'en-gb':'Write a message... (Enter to send)', 'en-ca':'Write a message... (Enter to send)', 'als': 'Nochricht schriibe... (Enter zum schicke)' },
  chatDelete:        { 'fr-fr':'Supprimer le message', 'fr-ca':'Supprimer le message', 'en-us':'Delete message', 'en-gb':'Delete message', 'en-ca':'Delete message', 'als': 'Nochricht lösche' },
  chatDeleteConfirm: { 'fr-fr':'Supprimer ce message ?', 'fr-ca':'Supprimer ce message ?', 'en-us':'Delete this message?', 'en-gb':'Delete this message?', 'en-ca':'Delete this message?', 'als': 'Die Nochricht lösche ?' },
  mentionAll:       { 'fr-fr':'tous', 'fr-ca':'tous', 'en-us':'all', 'en-gb':'all', 'en-ca':'all', 'als': 'alli' },
  reportApprove:     { 'fr-fr':'Approuver', 'fr-ca':'Approuver', 'en-us':'Approve', 'en-gb':'Approve', 'en-ca':'Approve', 'als':'Genehmige' },
  reportMsg:         { 'fr-fr':'Signaler', 'fr-ca':'Signaler', 'en-us':'Report', 'en-gb':'Report', 'en-ca':'Report', 'als':'Melde' },
  reportConfirm:     { 'fr-fr':'Signaler ce message aux admins ?', 'fr-ca':'Signaler ce message aux admins ?', 'en-us':'Report this message to admins?', 'en-gb':'Report this message to admins?', 'en-ca':'Report this message to admins?', 'als':'Die Nochricht de Admins melde?' },
  reportSent:        { 'fr-fr':'Message signalé aux admins.', 'fr-ca':'Message signalé aux admins.', 'en-us':'Message reported to admins.', 'en-gb':'Message reported to admins.', 'en-ca':'Message reported to admins.', 'als':'Nochricht gmeld.' },
  pinMsg:            { 'fr-fr':'Épingler', 'fr-ca':'Épingler', 'en-us':'Pin', 'en-gb':'Pin', 'en-ca':'Pin', 'als':'Anhefte' },
  unpinMsg:          { 'fr-fr':'Désépingler', 'fr-ca':'Désépingler', 'en-us':'Unpin', 'en-gb':'Unpin', 'en-ca':'Unpin', 'als':'Abhefte' },
  newMessages:       { 'fr-fr':'Nouveaux messages', 'fr-ca':'Nouveaux messages', 'en-us':'New messages', 'en-gb':'New messages', 'en-ca':'New messages', 'als':'Neji Nachrichte' },
  msgEdited:         { 'fr-fr':'modifié', 'fr-ca':'modifié', 'en-us':'edited', 'en-gb':'edited', 'en-ca':'edited', 'als':'geändert' },
  adminModeOn:        { 'fr-fr':'Mode Admin actif — cliquer pour désactiver', 'fr-ca':'Mode Admin actif — cliquer pour désactiver', 'en-us':'Admin mode on — click to disable', 'en-gb':'Admin mode on — click to disable', 'en-ca':'Admin mode on — click to disable', 'als': 'Admin-Modus aktiv — klicke zum deaktiviere' },
  adminModeOff:       { 'fr-fr':'Activer le mode Admin', 'fr-ca':'Activer le mode Admin', 'en-us':'Enable admin mode', 'en-gb':'Enable admin mode', 'en-ca':'Enable admin mode', 'als': 'Admin-Modus aktiviere' },
  emojiBlocked:      { 'fr-fr':'Cet emoji n\'est pas autorisé 🚫', 'fr-ca':'Cet emoji n\'est pas autorisé 🚫', 'en-us':'This emoji is not allowed 🚫', 'en-gb':'This emoji is not allowed 🚫', 'en-ca':'This emoji is not allowed 🚫', 'als': 'Dà Emoji isch net erlaubt 🚫' },
  adminModePlaceholder: { 'fr-fr':'Message Admin (visible par tous)...', 'fr-ca':'Message Admin (visible par tous)...', 'en-us':'Admin message (visible to all)...', 'en-gb':'Admin message (visible to all)...', 'en-ca':'Admin message (visible to all)...', 'als': 'Admin-Nachricht (sichtbar fer alli)...' },

  appTitle:       { 'fr-fr':'Pool Olympique', 'fr-ca':'Pool Olympique', 'en-us':'Olympic Pool', 'en-gb':'Olympic Pool', 'en-ca':'Olympic Pool', 'als': 'Olympisch Pool' },
  appEdition:     { 'fr-fr':'Los Angeles 2028', 'fr-ca':'Los Angeles 2028', 'en-us':'Los Angeles 2028', 'en-gb':'Los Angeles 2028', 'en-ca':'Los Angeles 2028', 'als': 'Los Angeles 2028' },

  // User Menu
  editAvatar:     { 'fr-fr':"🖼️ Modifier l'avatar", 'fr-ca':"🖼️ Modifier l'avatar", 'en-us':'🖼️ Edit Avatar', 'en-gb':'🖼️ Edit Avatar', 'en-ca':'🖼️ Edit Avatar' },
  changePassword: { 'fr-fr':'🔒 Changer le mot de passe', 'fr-ca':'🔒 Changer le mot de passe', 'en-us':'🔒 Change Password', 'en-gb':'🔒 Change Password', 'en-ca':'🔒 Change Password', 'als': '🔒 Passwort ändere' },
  changeLanguage: { 'fr-fr':'🌐 Langue', 'fr-ca':'🌐 Langue', 'en-us':'🌐 Language', 'en-gb':'🌐 Language', 'en-ca':'🌐 Language', 'als': '🌐 Sproch' },
  logout:         { 'fr-fr':'🚪 Se déconnecter', 'fr-ca':'🚪 Se déconnecter', 'en-us':'🚪 Log Out', 'en-gb':'🚪 Log Out', 'en-ca':'🚪 Log Out', 'als': '🚪 Abmelde' },

  // Modals communs
  cancel:         { 'fr-fr':'Annuler',     'fr-ca':'Annuler',     'en-us':'Cancel', 'en-gb':'Cancel', 'en-ca':'Cancel', 'als': 'Abbreche' },
  change:         { 'fr-fr':'Changer',     'fr-ca':'Changer',     'en-us':'Change', 'en-gb':'Change', 'en-ca':'Change', 'als': 'Ändere' },
  save:           { 'fr-fr':'Enregistrer', 'fr-ca':'Sauvegarder', 'en-us':'Save',   'en-gb':'Save',   'en-ca':'Save', 'als': 'Speichere'   },
  close:          { 'fr-fr':'Fermer',      'fr-ca':'Fermer',      'en-us':'Close',  'en-gb':'Close',  'en-ca':'Close', 'als': 'Zumache'  },
  loading:        { 'fr-fr':'Chargement...','fr-ca':'Chargement...','en-us':'Loading...','en-gb':'Loading...','en-ca':'Loading...', 'als': 'Lade...' },

  // Change Password Modal
  changePasswordTitle: { 'fr-fr':'🔒 Changer le mot de passe', 'fr-ca':'🔒 Changer le mot de passe', 'en-us':'🔒 Change Password', 'en-gb':'🔒 Change Password', 'en-ca':'🔒 Change Password', 'als': '🔒 Passwort ändere' },
  passwordChanged:     { 'fr-fr':'✓ Mot de passe changé !', 'fr-ca':'✓ Mot de passe changé !', 'en-us':'✓ Password changed!', 'en-gb':'✓ Password changed!', 'en-ca':'✓ Password changed!', 'als': '✓ Passwort geändert !' },
  minCharsPassword:    { 'fr-fr':'Minimum 6 caractères', 'fr-ca':'Minimum 6 caractères', 'en-us':'Minimum 6 characters', 'en-gb':'Minimum 6 characters', 'en-ca':'Minimum 6 characters', 'als': 'Mindeschtens 6 Zeiche' },

  // Avatar Modal
  avatarTitle:         { 'fr-fr':'🖼️ Mon avatar', 'fr-ca':'🖼️ Mon avatar', 'en-us':'🖼️ My Avatar', 'en-gb':'🖼️ My Avatar', 'en-ca':'🖼️ My Avatar', 'als': '🖼️ Min Avatar' },
  avatarTabFile:       { 'fr-fr':'📁 Fichier', 'fr-ca':'📁 Fichier', 'en-us':'📁 File', 'en-gb':'📁 File', 'en-ca':'📁 File', 'als': '📁 Datei' },
  avatarTabUrl:        { 'fr-fr':'🔗 URL', 'fr-ca':'🔗 URL', 'en-us':'🔗 URL', 'en-gb':'🔗 URL', 'en-ca':'🔗 URL', 'als': '🔗 URL' },
  avatarTabLetter:     { 'fr-fr':'🔤 Initiale', 'fr-ca':'🔤 Initiale', 'en-us':'🔤 Initial', 'en-gb':'🔤 Initial', 'en-ca':'🔤 Initial', 'als': '🔤 Initial' },
  avatarDropzoneTitle: { 'fr-fr':'Glisse une photo ici', 'fr-ca':'Glisse une photo ici', 'en-us':'Drag a photo here', 'en-gb':'Drag a photo here', 'en-ca':'Drag a photo here', 'als': 'Zieh e Foto do häre' },
  avatarDropzoneSub:   { 'fr-fr':'ou clique pour choisir un fichier', 'fr-ca':'ou clique pour choisir un fichier', 'en-us':'or click to browse files', 'en-gb':'or click to browse files', 'en-ca':'or click to browse files', 'als': 'oder klick zum e Datei wähle' },
  avatarDropzoneFormats:{ 'fr-fr':'JPG · PNG · GIF · WEBP · AVIF · Max 10MB', 'fr-ca':'JPG · PNG · GIF · WEBP · AVIF · Max 10MB', 'en-us':'JPG · PNG · GIF · WEBP · AVIF · Max 10MB', 'en-gb':'JPG · PNG · GIF · WEBP · AVIF · Max 10MB', 'en-ca':'JPG · PNG · GIF · WEBP · AVIF · Max 10MB', 'als': 'JPG · PNG · GIF · WEBP · AVIF · Max 10MB' },
  avatarUseThisPhoto:  { 'fr-fr':'✓ Utiliser cette photo', 'fr-ca':'✓ Utiliser cette photo', 'en-us':'✓ Use This Photo', 'en-gb':'✓ Use This Photo', 'en-ca':'✓ Use This Photo', 'als': '✓ Des Foto benutze' },
  avatarPhotoLink:     { 'fr-fr':'Lien de la photo', 'fr-ca':'Lien de la photo', 'en-us':'Photo Link', 'en-gb':'Photo Link', 'en-ca':'Photo Link', 'als': 'Link vum Foto' },
  avatarContinue:      { 'fr-fr':'Continuer →', 'fr-ca':'Continuer →', 'en-us':'Continue →', 'en-gb':'Continue →', 'en-ca':'Continue →', 'als': 'Wìder →' },
  avatarColorBg:       { 'fr-fr':'Fond', 'fr-ca':'Fond', 'en-us':'Background', 'en-gb':'Background', 'en-ca':'Background', 'als': 'Hintergrund' },
  avatarColorLetter:   { 'fr-fr':'Lettre', 'fr-ca':'Lettre', 'en-us':'Letter', 'en-gb':'Letter', 'en-ca':'Letter', 'als': 'Buchstàb' },
  avatarUpdated:       { 'fr-fr':'✓ Avatar mis à jour !', 'fr-ca':'✓ Avatar mis à jour !', 'en-us':'✓ Avatar updated!', 'en-gb':'✓ Avatar updated!', 'en-ca':'✓ Avatar updated!', 'als': '✓ Avatar aktualisiert !' },
  avatarImageLoadFail: { 'fr-fr':"Impossible de charger l'image : ", 'fr-ca':"Impossible de charger l'image : ", 'en-us':'Unable to load image: ', 'en-gb':'Unable to load image: ', 'en-ca':'Unable to load image: ' },
  avatarFormatError:   { 'fr-fr':'Format non supporté (JPG, PNG, GIF, WEBP, AVIF)', 'fr-ca':'Format non supporté (JPG, PNG, GIF, WEBP, AVIF)', 'en-us':'Unsupported format (JPG, PNG, GIF, WEBP, AVIF)', 'en-gb':'Unsupported format (JPG, PNG, GIF, WEBP, AVIF)', 'en-ca':'Unsupported format (JPG, PNG, GIF, WEBP, AVIF)', 'als': 'Format net unterstützt (JPG, PNG, GIF, WEBP, AVIF)' },
  avatarTooLarge:      { 'fr-fr':'Image trop grande (max 10MB)', 'fr-ca':'Image trop grande (max 10MB)', 'en-us':'Image too large (max 10MB)', 'en-gb':'Image too large (max 10MB)', 'en-ca':'Image too large (max 10MB)', 'als': 'Bild z’groß (max 10MB)' },
  avatarEnterUrl:      { 'fr-fr':'Entre une URL', 'fr-ca':'Entre une URL', 'en-us':'Enter a URL', 'en-gb':'Enter a URL', 'en-ca':'Enter a URL', 'als': 'Gib e URL ì' },
  avatarSending:       { 'fr-fr':'Envoi en cours...', 'fr-ca':'Envoi en cours...', 'en-us':'Uploading...', 'en-gb':'Uploading...', 'en-ca':'Uploading...', 'als': 'Werd gschickt...' },

  // Cropper
  cropTitle:   { 'fr-fr':'✂️ Recadrer la photo', 'fr-ca':'✂️ Recadrer la photo', 'en-us':'✂️ Crop Photo', 'en-gb':'✂️ Crop Photo', 'en-ca':'✂️ Crop Photo', 'als': '✂️ Foto zuschneide' },

  // Picks Page
  myPicksTitle:     { 'fr-fr':'Mes pronostics', 'fr-ca':'Mes pronostics', 'en-us':'My Picks', 'en-gb':'My Picks', 'en-ca':'My Picks', 'als': 'Mini Tipp' },
  picksCompleted:   { 'fr-fr':'{picked} / {total} disciplines complétées', 'fr-ca':'{picked} / {total} disciplines complétées', 'en-us':'{picked} / {total} disciplines completed', 'en-gb':'{picked} / {total} disciplines completed', 'en-ca':'{picked} / {total} disciplines completed' },
  searchDiscipline: { 'fr-fr':'🔍 Rechercher une discipline...', 'fr-ca':'🔍 Rechercher une discipline...', 'en-us':'🔍 Search a discipline...', 'en-gb':'🔍 Search a discipline...', 'en-ca':'🔍 Search a discipline...', 'als': '🔍 E Disziplin sueche...' },
  filterUnpicked:   { 'fr-fr':'Non complétés', 'fr-ca':'Non complétés', 'en-us':'Unpicked', 'en-gb':'Unpicked', 'en-ca':'Unpicked', 'als': 'Net fertig' },
  filterCountry:    { 'fr-fr':'Filtrer par pays...', 'fr-ca':'Filtrer par pays...', 'en-us':'Filter by country...', 'en-gb':'Filter by country...', 'en-ca':'Filter by country...', 'als': 'Noch Land filtere...' },
  pickChoose:       { 'fr-fr':'Choisir', 'fr-ca':'Choisir', 'en-us':'Pick', 'en-gb':'Pick', 'en-ca':'Pick', 'als': 'Wähle' },
  pickUntil:        { 'fr-fr':"jusqu'au {date}", 'fr-ca':"jusqu'au {date}", 'en-us':'until {date}', 'en-gb':'until {date}', 'en-ca':'until {date}' },
  noResults:        { 'fr-fr':'Aucun résultat', 'fr-ca':'Aucun résultat', 'en-us':'No results', 'en-gb':'No results', 'en-ca':'No results', 'als': 'Kei Resultat' },

  // My Results
  gold:           { 'fr-fr':'Or',     'fr-ca':'Or',     'en-us':'Gold',   'en-gb':'Gold',   'en-ca':'Gold', 'als': 'Gold'   },
  silver:         { 'fr-fr':'Argent', 'fr-ca':'Argent', 'en-us':'Silver', 'en-gb':'Silver', 'en-ca':'Silver', 'als': 'Sìlwer' },
  bronze:         { 'fr-fr':'Bronze', 'fr-ca':'Bronze', 'en-us':'Bronze', 'en-gb':'Bronze', 'en-ca':'Bronze', 'als': 'Bronz' },
  points:         { 'fr-fr':'Points', 'fr-ca':'Points', 'en-us':'Points', 'en-gb':'Points', 'en-ca':'Points', 'als': 'Punkt' },
  filterAll:      { 'fr-fr':'Tous ({count})', 'fr-ca':'Tous ({count})', 'en-us':'All ({count})', 'en-gb':'All ({count})', 'en-ca':'All ({count})' },
  filterWithPoints:{ 'fr-fr':'✅ Avec points ({count})', 'fr-ca':'✅ Avec points ({count})', 'en-us':'✅ With points ({count})', 'en-gb':'✅ With points ({count})', 'en-ca':'✅ With points ({count})' },
  filterPending:  { 'fr-fr':'⏳ En attente ({count})', 'fr-ca':'⏳ En attente ({count})', 'en-us':'⏳ Pending ({count})', 'en-gb':'⏳ Pending ({count})', 'en-ca':'⏳ Pending ({count})' },
  tableColDiscipline:{ 'fr-fr':'Discipline', 'fr-ca':'Discipline', 'en-us':'Discipline', 'en-gb':'Discipline', 'en-ca':'Discipline', 'als': 'Disziplin' },
  tableColCountry:{ 'fr-fr':'Pays choisi', 'fr-ca':'Pays choisi', 'en-us':'Your Pick', 'en-gb':'Your Pick', 'en-ca':'Your Pick', 'als': 'Gwählts Land' },
  tableColMedals: { 'fr-fr':'Médailles', 'fr-ca':'Médailles', 'en-us':'Medals', 'en-gb':'Medals', 'en-ca':'Medals', 'als': 'Medaile' },
  tableColPts:    { 'fr-fr':'Pts', 'fr-ca':'Pts', 'en-us':'Pts', 'en-gb':'Pts', 'en-ca':'Pts', 'als': 'Pkt' },
  tableEmpty:     { 'fr-fr':'Aucun pronostic pour ce filtre.', 'fr-ca':'Aucun pronostic pour ce filtre.', 'en-us':'No picks for this filter.', 'en-gb':'No picks for this filter.', 'en-ca':'No picks for this filter.', 'als': 'Kei Tipp fer die Filter.' },
  resultMissed:   { 'fr-fr':'✗ Raté', 'fr-ca':'✗ Raté', 'en-us':'✗ Missed', 'en-gb':'✗ Missed', 'en-ca':'✗ Missed', 'als': '✗ Verpasst' },
  today:          { 'fr-fr':"Aujourd'hui", 'fr-ca':"Aujourd'hui", 'en-us':'Today', 'en-gb':'Today', 'en-ca':'Today' },
  daySummary:     { 'fr-fr':'{picked} pronostics', 'fr-ca':'{picked} pronostics', 'en-us':'{picked} picks', 'en-gb':'{picked} picks', 'en-ca':'{picked} picks' },
  daySummaryScored:{ 'fr-fr':'· {scored} corrects · {pts} pts', 'fr-ca':'· {scored} corrects · {pts} pts', 'en-us':'· {scored} correct · {pts} pts', 'en-gb':'· {scored} correct · {pts} pts', 'en-ca':'· {scored} correct · {pts} pts' },
  medalDayTag:    { 'fr-fr':'🏅 Médaille', 'fr-ca':'🏅 Médaille', 'en-us':'🏅 Medal', 'en-gb':'🏅 Medal', 'en-ca':'🏅 Medal', 'als': '🏅 Medaile' },
  noDisciplineDay:{ 'fr-fr':'Aucune discipline ce jour.', 'fr-ca':'Aucune discipline ce jour.', 'en-us':'No disciplines on this day.', 'en-gb':'No disciplines on this day.', 'en-ca':'No disciplines on this day.', 'als': 'Heit kei Disziplin.' },

  // Leaderboard
  loadingLeaderboard:{ 'fr-fr':'Chargement du classement...', 'fr-ca':'Chargement du classement...', 'en-us':'Loading leaderboard...', 'en-gb':'Loading leaderboard...', 'en-ca':'Loading leaderboard...', 'als': 'Ranglischt wird glade...' },
  loadingMedals:  { 'fr-fr':'Chargement des médailles...', 'fr-ca':'Chargement des médailles...', 'en-us':'Loading medals...', 'en-gb':'Loading medals...', 'en-ca':'Loading medals...', 'als': 'Medaile werde glade...' },
  leaderboardGeneral:{ 'fr-fr':'🌍 Classement général', 'fr-ca':'🌍 Classement général', 'en-us':'🌍 Overall Standings', 'en-gb':'🌍 Overall Standings', 'en-ca':'🌍 Overall Standings', 'als': '🌍 Gsamt-Ranglischt' },
  leaderboardHeader:{ 'fr-fr':'Joueur', 'fr-ca':'Joueur', 'en-us':'Player', 'en-gb':'Player', 'en-ca':'Player', 'als': 'Spieler' },
  youBadge:       { 'fr-fr':' (toi)', 'fr-ca':' (toi)', 'en-us':' (you)', 'en-gb':' (you)', 'en-ca':' (you)', 'als': '(du)' },
  noPlayers:      { 'fr-fr':'Aucun joueur inscrit.', 'fr-ca':'Aucun joueur inscrit.', 'en-us':'No players registered.', 'en-gb':'No players registered.', 'en-ca':'No players registered.', 'als': 'Kei Spieler iigschriibe.' },
  noGroupMembers: { 'fr-fr':'Aucun membre dans ce groupe.', 'fr-ca':'Aucun membre dans ce groupe.', 'en-us':'No members in this group.', 'en-gb':'No members in this group.', 'en-ca':'No members in this group.', 'als': 'Kei Mitglied in dere Grupp.' },
  pointsLegendGold:  { 'fr-fr':'🥇 Or = 5 pts', 'fr-ca':'🥇 Or = 5 pts', 'en-us':'🥇 Gold = 5 pts', 'en-gb':'🥇 Gold = 5 pts', 'en-ca':'🥇 Gold = 5 pts', 'als': '🥇 Gold = 5 Punkt' },
  pointsLegendSilver:{ 'fr-fr':'🥈 Argent = 3 pts', 'fr-ca':'🥈 Argent = 3 pts', 'en-us':'🥈 Silver = 3 pts', 'en-gb':'🥈 Silver = 3 pts', 'en-ca':'🥈 Silver = 3 pts', 'als': '🥈 Sìlwer = 3 Punkt' },
  pointsLegendBronze:{ 'fr-fr':'🥉 Bronze = 1 pt', 'fr-ca':'🥉 Bronze = 1 pt', 'en-us':'🥉 Bronze = 1 pt', 'en-gb':'🥉 Bronze = 1 pt', 'en-ca':'🥉 Bronze = 1 pt', 'als': '🥉 Bronz = 1 Punkt' },
  pointsLegendNote:  { 'fr-fr':'• Plusieurs médailles = points cumulés', 'fr-ca':'• Plusieurs médailles = points cumulés', 'en-us':'• Multiple medals = points added together', 'en-gb':'• Multiple medals = points added together', 'en-ca':'• Multiple medals = points added together', 'als': '• Mehreri Medaile = Punkt kumuliert' },

  // Medals
  medalTableTitle:   { 'fr-fr':'🌍 Tableau des médailles', 'fr-ca':'🌍 Tableau des médailles', 'en-us':'🌍 Medal Table', 'en-gb':'🌍 Medal Table', 'en-ca':'🌍 Medal Table', 'als': '🌍 Medaile-Tabell' },
  sortOlympic:       { 'fr-fr':'Classement olympique', 'fr-ca':'Classement olympique', 'en-us':'Olympic Ranking', 'en-gb':'Olympic Ranking', 'en-ca':'Olympic Ranking', 'als': 'Olympisch Rangordnig' },
  sortTotal:         { 'fr-fr':'Total médailles', 'fr-ca':'Total médailles', 'en-us':'Total Medals', 'en-gb':'Total Medals', 'en-ca':'Total Medals', 'als': 'Total Medaile' },
  totalMedals:       { 'fr-fr':'Total', 'fr-ca':'Total', 'en-us':'Total', 'en-gb':'Total', 'en-ca':'Total', 'als': 'Total' },
  favoriteCountryTitle:{ 'fr-fr':'🔍 Mon pays favori', 'fr-ca':'🔍 Mon pays favori', 'en-us':'🔍 My Favorite Country', 'en-gb':'🔍 My Favourite Country', 'en-ca':'🔍 My Favourite Country', 'als': '🔍 Min Lieblingsland' },
  favoriteCountrySaving:{ 'fr-fr':'💾 Sauvegarde...', 'fr-ca':'💾 Sauvegarde...', 'en-us':'💾 Saving...', 'en-gb':'💾 Saving...', 'en-ca':'💾 Saving...', 'als': '💾 Speichere...' },
  favoriteCountryLabel:{ 'fr-fr':'Ton pays favori — sauvegardé sur ton compte', 'fr-ca':'Ton pays favori — sauvegardé sur ton compte', 'en-us':'Your favorite country — saved to your account', 'en-gb':'Your favourite country — saved to your account', 'en-ca':'Your favourite country — saved to your account', 'als': 'Dì Lieblingsland — uf dìm Konto gspeichert' },
  selectCountry:     { 'fr-fr':'— Sélectionner un pays —', 'fr-ca':'— Sélectionner un pays —', 'en-us':'— Select a Country —', 'en-gb':'— Select a Country —', 'en-ca':'— Select a Country —', 'als': '— E Land wähle —' },
  noMedalsYet:       { 'fr-fr':"Aucune médaille pour ce pays pour l'instant.", 'fr-ca':"Aucune médaille pour ce pays pour l'instant.", 'en-us':'No medals for this country yet.', 'en-gb':'No medals for this country yet.', 'en-ca':'No medals for this country yet.' },
  selectFavoritePrompt:{ 'fr-fr':'Sélectionne ton pays favori pour suivre ses médailles.', 'fr-ca':'Sélectionne ton pays favori pour suivre ses médailles.', 'en-us':'Select your favorite country to follow its medals.', 'en-gb':'Select your favourite country to follow its medals.', 'en-ca':'Select your favourite country to follow its medals.', 'als': 'Wähl dì Lieblingsland zum sini Medaile verfolge.' },
  noMedalsAdmin:     { 'fr-fr':"Les médailles apparaîtront ici une fois les résultats saisis par l'administrateur.", 'fr-ca':"Les médailles apparaîtront ici une fois les résultats saisis par l'administrateur.", 'en-us':'Medals will appear here once results are entered by the admin.', 'en-gb':'Medals will appear here once results are entered by the admin.', 'en-ca':'Medals will appear here once results are entered by the admin.' },

  // Admin
  adminPodiumsEntered:{ 'fr-fr':'Podiums saisis', 'fr-ca':'Podiums saisis', 'en-us':'Podiums Entered', 'en-gb':'Podiums Entered', 'en-ca':'Podiums Entered', 'als': 'Podium ìg’träje' },
  adminRemaining:    { 'fr-fr':'Restants', 'fr-ca':'Restants', 'en-us':'Remaining', 'en-gb':'Remaining', 'en-ca':'Remaining', 'als': 'No übrig' },
  adminCompleted:    { 'fr-fr':'% complété', 'fr-ca':'% complété', 'en-us':'% completed', 'en-gb':'% completed', 'en-ca':'% completed', 'als': '% fertig' },
  adminTabResults:   { 'fr-fr':'🥇 Résultats ({done}/{total})', 'fr-ca':'🥇 Résultats ({done}/{total})', 'en-us':'🥇 Results ({done}/{total})', 'en-gb':'🥇 Results ({done}/{total})', 'en-ca':'🥇 Results ({done}/{total})' },
  adminTabUsers:     { 'fr-fr':'👥 Joueurs ({count})', 'fr-ca':'👥 Joueurs ({count})', 'en-us':'👥 Players ({count})', 'en-gb':'👥 Players ({count})', 'en-ca':'👥 Players ({count})' },
  adminTabGroups:    { 'fr-fr':'🏟 Groupes ({count})', 'fr-ca':'🏟 Groupes ({count})', 'en-us':'🏟 Groups ({count})', 'en-gb':'🏟 Groups ({count})', 'en-ca':'🏟 Groups ({count})' },
  adminImportBtn:    { 'fr-fr':'🔄 Importer résultats (API)', 'fr-ca':'🔄 Importer résultats (API)', 'en-us':'🔄 Import Results (API)', 'en-gb':'🔄 Import Results (API)', 'en-ca':'🔄 Import Results (API)', 'als': '🔄 Resultat importiere (API)' },
  adminImporting:    { 'fr-fr':'⏳ Importation...', 'fr-ca':'⏳ Importation...', 'en-us':'⏳ Importing...', 'en-gb':'⏳ Importing...', 'en-ca':'⏳ Importing...', 'als': '⏳ Import wird gmacht...' },
  adminImported:     { 'fr-fr':"✓ {count} résultats importés depuis l'API !", 'fr-ca':"✓ {count} résultats importés depuis l'API !", 'en-us':'✓ {count} results imported from API!', 'en-gb':'✓ {count} results imported from API!', 'en-ca':'✓ {count} results imported from API!' },
  adminChoose:       { 'fr-fr':'+ Choisir', 'fr-ca':'+ Choisir', 'en-us':'+ Choose', 'en-gb':'+ Choose', 'en-ca':'+ Choose', 'als': '+ Wähle' },
  adminFilter:       { 'fr-fr':'Filtrer...', 'fr-ca':'Filtrer...', 'en-us':'Filter...', 'en-gb':'Filter...', 'en-ca':'Filter...', 'als': 'Filtere...' },
  adminUsersHeader:  { 'fr-fr':'Utilisateur', 'fr-ca':'Utilisateur', 'en-us':'User', 'en-gb':'User', 'en-ca':'User', 'als': 'Benutzer' },
  adminUsersRegistered:{ 'fr-fr':'Inscription', 'fr-ca':'Inscription', 'en-us':'Registered', 'en-gb':'Registered', 'en-ca':'Registered', 'als': 'Iinschriibung' },
  adminUsersRole:    { 'fr-fr':'Rôle', 'fr-ca':'Rôle', 'en-us':'Role', 'en-gb':'Role', 'en-ca':'Role', 'als': 'Roll' },
  adminUsersActions: { 'fr-fr':'Actions', 'fr-ca':'Actions', 'en-us':'Actions', 'en-gb':'Actions', 'en-ca':'Actions', 'als': 'Aktione' },
  adminRolePlayer:   { 'fr-fr':'👤 Joueur', 'fr-ca':'👤 Joueur', 'en-us':'👤 Player', 'en-gb':'👤 Player', 'en-ca':'👤 Player', 'als': '👤 Spieler' },
  adminDeleteUserConfirm:{ 'fr-fr':'Supprimer {username} ? Tous ses pronostics seront effacés.', 'fr-ca':'Supprimer {username} ? Tous ses pronostics seront effacés.', 'en-us':'Delete {username}? All their picks will be erased.', 'en-gb':'Delete {username}? All their picks will be erased.', 'en-ca':'Delete {username}? All their picks will be erased.' },
  adminDeletedUser:  { 'fr-fr':'{username} supprimé', 'fr-ca':'{username} supprimé', 'en-us':'{username} deleted', 'en-gb':'{username} deleted', 'en-ca':'{username} deleted' },
  adminRoleUpdated:  { 'fr-fr':'Rôle mis à jour', 'fr-ca':'Rôle mis à jour', 'en-us':'Role updated', 'en-gb':'Role updated', 'en-ca':'Role updated', 'als': 'Roll aktualisiert' },
  adminTempPwdTitle: { 'fr-fr':'Mot de passe temporaire', 'fr-ca':'Mot de passe temporaire', 'en-us':'Temporary Password', 'en-gb':'Temporary Password', 'en-ca':'Temporary Password', 'als': 'Temporär Passwort' },
  adminTempPwdFor:   { 'fr-fr':'Pour :', 'fr-ca':'Pour :', 'en-us':'For:', 'en-gb':'For:', 'en-ca':'For:', 'als': 'Fer :' },
  adminTempPwdNote:  { 'fr-fr':"L'utilisateur devra changer ce mot de passe à sa prochaine connexion.", 'fr-ca':"L'utilisateur devra changer ce mot de passe à sa prochaine connexion.", 'en-us':'The user will need to change this password on their next login.', 'en-gb':'The user will need to change this password on their next login.', 'en-ca':'The user will need to change this password on their next login.' },
  adminTempPwdLabel: { 'fr-fr':'Mot de passe temporaire', 'fr-ca':'Mot de passe temporaire', 'en-us':'Temporary password', 'en-gb':'Temporary password', 'en-ca':'Temporary password', 'als': 'Temporär Passwort' },
  adminTempPwdPlaceholder:{ 'fr-fr':'Min. 4 caractères', 'fr-ca':'Min. 4 caractères', 'en-us':'Min. 4 characters', 'en-gb':'Min. 4 characters', 'en-ca':'Min. 4 characters', 'als': 'Mind. 4 Zeiche' },
  adminTempPwdMinChars:{ 'fr-fr':'Minimum 4 caractères', 'fr-ca':'Minimum 4 caractères', 'en-us':'Minimum 4 characters', 'en-gb':'Minimum 4 characters', 'en-ca':'Minimum 4 characters', 'als': 'Mindeschtens 4 Zeiche' },
  adminPodiumSaved:  { 'fr-fr':'✓ Podium enregistré !', 'fr-ca':'✓ Podium enregistré !', 'en-us':'✓ Podium saved!', 'en-gb':'✓ Podium saved!', 'en-ca':'✓ Podium saved!', 'als': '✓ Podium gspeichert !' },
  adminResultErased: { 'fr-fr':'Résultat effacé', 'fr-ca':'Résultat effacé', 'en-us':'Result deleted', 'en-gb':'Result deleted', 'en-ca':'Result deleted', 'als': 'Resultat gelöscht' },
  adminNewGroupPlaceholder:{ 'fr-fr':'Nom du nouveau groupe...', 'fr-ca':'Nom du nouveau groupe...', 'en-us':'New group name...', 'en-gb':'New group name...', 'en-ca':'New group name...', 'als': 'Nàmme vun dr neje Grupp...' },
  adminCreateGroup:  { 'fr-fr':'+ Créer', 'fr-ca':'+ Créer', 'en-us':'+ Create', 'en-gb':'+ Create', 'en-ca':'+ Create', 'als': '+ Erstelle' },
  adminGroupCreated: { 'fr-fr':'✓ Groupe créé !', 'fr-ca':'✓ Groupe créé !', 'en-us':'✓ Group created!', 'en-gb':'✓ Group created!', 'en-ca':'✓ Group created!', 'als': '✓ Grupp erstellt !' },
  adminGroupDeleted: { 'fr-fr':'Groupe supprimé', 'fr-ca':'Groupe supprimé', 'en-us':'Group deleted', 'en-gb':'Group deleted', 'en-ca':'Group deleted', 'als': 'Grupp gelöscht' },
  adminMemberAdded:  { 'fr-fr':'Membre ajouté !', 'fr-ca':'Membre ajouté !', 'en-us':'Member added!', 'en-gb':'Member added!', 'en-ca':'Member added!', 'als': 'Mitglied dezuegfüegt !' },
  adminAddMember:    { 'fr-fr':'+ Ajouter un membre...', 'fr-ca':'+ Ajouter un membre...', 'en-us':'+ Add a member...', 'en-gb':'+ Add a member...', 'en-ca':'+ Add a member...', 'als': '+ E Mitglied dezuefüege...' },
  adminNoGroups:     { 'fr-fr':'Aucun groupe créé.', 'fr-ca':'Aucun groupe créé.', 'en-us':'No groups created.', 'en-gb':'No groups created.', 'en-ca':'No groups created.', 'als': 'Kei Grupp erstellt.' },
  adminLoading:      { 'fr-fr':'Chargement...', 'fr-ca':'Chargement...', 'en-us':'Loading...', 'en-gb':'Loading...', 'en-ca':'Loading...', 'als': 'Lade...' },
  adminTempBadge:    { 'fr-fr':'MDP TEMPORAIRE', 'fr-ca':'MDP TEMPORAIRE', 'en-us':'TEMP PASSWORD', 'en-gb':'TEMP PASSWORD', 'en-ca':'TEMP PASSWORD', 'als': 'TEMPORÄR PASSWORT' },
  adminSearchDiscipline:{ 'fr-fr':'🔍 Rechercher une discipline...', 'fr-ca':'🔍 Rechercher une discipline...', 'en-us':'🔍 Search a discipline...', 'en-gb':'🔍 Search a discipline...', 'en-ca':'🔍 Search a discipline...', 'als': '🔍 E Disziplin sueche...' },




  // Règles pronostics
  rulesTitle:           { 'fr-fr':'Comment ça marche ?', 'fr-ca':'Comment ça marche ?', 'en-us':'How does it work?', 'en-gb':'How does it work?', 'en-ca':'How does it work?', 'als': "Wie funktioniert's ?" },
  ruleOneCountryTitle:  { 'fr-fr':'Un pays par discipline', 'fr-ca':'Un pays par discipline', 'en-us':'One country per event', 'en-gb':'One country per event', 'en-ca':'One country per event', 'als': 'Ei Land pro Disziplin' },
  ruleOneCountryDesc:   { 'fr-fr':'Pour chaque discipline olympique, choisis le pays que tu crois le plus susceptible de monter sur le podium.', 'fr-ca':'Pour chaque discipline olympique, choisis le pays que tu crois le plus susceptible de monter sur le podium.', 'en-us':'For each Olympic event, pick the country you think is most likely to reach the podium.', 'en-gb':'For each Olympic event, pick the country you think is most likely to reach the podium.', 'en-ca':'For each Olympic event, pick the country you think is most likely to reach the podium.', 'als': "Fer jedi Disziplin wähl des Land, wu am ehschte uf s'Podium kummt." },
  rulePointsTitle:      { 'fr-fr':'Points selon la médaille', 'fr-ca':'Points selon la médaille', 'en-us':'Points by medal', 'en-gb':'Points by medal', 'en-ca':'Points by medal', 'als': 'Punkt je noch Medaile' },
  rulePointsDesc:       { 'fr-fr':'Tu gagnes des points selon la médaille remportée par ton pays choisi :', 'fr-ca':'Tu gagnes des points selon la médaille remportée par ton pays choisi :', 'en-us':'You earn points based on the medal won by your chosen country:', 'en-gb':'You earn points based on the medal won by your chosen country:', 'en-ca':'You earn points based on the medal won by your chosen country:', 'als': 'Du kriegsch Punkt je noch Medaile vum gwählte Land :' },
  ruleMultiMedalTitle:  { 'fr-fr':'Plusieurs médailles pour un même pays', 'fr-ca':'Plusieurs médailles pour un même pays', 'en-us':'Multiple medals for the same country', 'en-gb':'Multiple medals for the same country', 'en-ca':'Multiple medals for the same country', 'als': 'Mehreri Medaile fer sëlwe Land' },
  ruleMultiMedalDesc:   { 'fr-fr':'Si ton pays gagne plusieurs médailles dans la même discipline, les points de chaque médaille s\'additionnent. Ex: or + bronze = 5 + 1 = 6 pts.', 'fr-ca':'Si ton pays gagne plusieurs médailles dans la même discipline, les points de chaque médaille s\'additionnent. Ex: or + bronze = 5 + 1 = 6 pts.', 'en-us':'If your country wins multiple medals in the same event, points from each medal are added together. Ex: gold + bronze = 5 + 1 = 6 pts.', 'en-gb':'If your country wins multiple medals in the same event, points from each medal are added together. Ex: gold + bronze = 5 + 1 = 6 pts.', 'en-ca':'If your country wins multiple medals in the same event, points from each medal are added together. Ex: gold + bronze = 5 + 1 = 6 pts.', 'als': 'Wenn dìn Land mehri Medaile gewinnt, werre alli Punkt zämmezählt' },
  ruleExampleTitle:     { 'fr-fr':'Exemple concret', 'fr-ca':'Exemple concret', 'en-us':'Concrete example', 'en-gb':'Concrete example', 'en-ca':'Concrete example', 'als': 'Konkretes Bispiel' },
  ruleExampleDescDynamic: { 'fr-fr':"Tu choisis {country} en natation 100m. {country} remporte l'or et le bronze → tu gagnes 5 + 1 = 6 pts.", 'fr-ca':"Tu choisis {country} en natation 100m. {country} remporte l'or et le bronze → tu gagnes 5 + 1 = 6 pts.", 'en-us':'You pick {country} in 100m swimming. {country} wins gold and bronze → you earn 5 + 1 = 6 pts.', 'en-gb':'You pick {country} in 100m swimming. {country} wins gold and bronze → you earn 5 + 1 = 6 pts.', 'en-ca':'You pick {country} in 100m swimming. {country} wins gold and bronze → you earn 5 + 1 = 6 pts.' },

  // Rôles
  role_superadmin: { 'fr-fr':'Super Admin', 'fr-ca':'Super Admin', 'en-us':'Super Admin', 'en-gb':'Super Admin', 'en-ca':'Super Admin', 'als': 'Super-Admin' },
  role_admin:      { 'fr-fr':'Admin',       'fr-ca':'Admin',       'en-us':'Admin',       'en-gb':'Admin',       'en-ca':'Admin', 'als': 'Admin' },
  role_captain:    { 'fr-fr':'Capitaine',   'fr-ca':'Capitaine',   'en-us':'Captain',     'en-gb':'Captain',     'en-ca':'Captain', 'als': 'Kapitäin' },
  adminRoleUpdated:{ 'fr-fr':'Rôle mis à jour', 'fr-ca':'Rôle mis à jour', 'en-us':'Role updated', 'en-gb':'Role updated', 'en-ca':'Role updated', 'als': 'Roll aktualisiert' },

  // Inactivity timer
  inactivityTitle:   { 'fr-fr':'Session inactive', 'fr-ca':'Session inactive', 'en-us':'Inactive Session', 'en-gb':'Inactive Session', 'en-ca':'Inactive Session', 'als': 'Sitzung inaktiv' },
  inactivityMessage: { 'fr-fr':'Vous serez déconnecté automatiquement dans :', 'fr-ca':'Vous serez déconnecté automatiquement dans :', 'en-us':'You will be automatically logged out in:', 'en-gb':'You will be automatically logged out in:', 'en-ca':'You will be automatically logged out in:', 'als': "Automatisch abg'meldt in :" },
  inactivityStay:    { 'fr-fr':'Je suis là !', 'fr-ca':'Je suis là !', 'en-us':"I'm here!", 'en-gb':"I'm here!", 'en-ca':"I'm here!" },
  inactivityLogout:  { 'fr-fr':'Se déconnecter', 'fr-ca':'Se déconnecter', 'en-us':'Log Out', 'en-gb':'Log Out', 'en-ca':'Log Out', 'als': 'Abmelde' },

  // Admin Settings tab
  adminTabSettings:  { 'fr-fr':'⚙️ Paramètres', 'fr-ca':'⚙️ Paramètres', 'en-us':'⚙️ Settings', 'en-gb':'⚙️ Settings', 'en-ca':'⚙️ Settings', 'als': '⚙️ Iistellige' },
  settingsInactivityTitle: { 'fr-fr':'Déconnexion par inactivité', 'fr-ca':'Déconnexion par inactivité', 'en-us':'Inactivity Logout', 'en-gb':'Inactivity Logout', 'en-ca':'Inactivity Logout', 'als': 'Abmelde noch Inaktivität' },
  settingsInactivityDesc:  { 'fr-fr':'Déconnecte automatiquement les utilisateurs après une période d\'inactivité.', 'fr-ca':'Déconnecte automatiquement les utilisateurs après une période d\'inactivité.', 'en-us':'Automatically log out users after a period of inactivity.', 'en-gb':'Automatically log out users after a period of inactivity.', 'en-ca':'Automatically log out users after a period of inactivity.', 'als': 'Meldt Benutzer automatisch ab noch e Zit vun Inaktivität.' },
  settingsEnabled:   { 'fr-fr':'Activé', 'fr-ca':'Activé', 'en-us':'Enabled', 'en-gb':'Enabled', 'en-ca':'Enabled', 'als': 'Aktiviert' },
  settingsOn:        { 'fr-fr':'✓ Activé', 'fr-ca':'✓ Activé', 'en-us':'✓ On', 'en-gb':'✓ On', 'en-ca':'✓ On', 'als': '✓ Aktiviert' },
  settingsOff:       { 'fr-fr':'Désactivé', 'fr-ca':'Désactivé', 'en-us':'Off', 'en-gb':'Off', 'en-ca':'Off', 'als': 'Deaktiviert' },
  settingsTimeout:   { 'fr-fr':'Délai d\'inactivité', 'fr-ca':'Délai d\'inactivité', 'en-us':'Inactivity timeout', 'en-gb':'Inactivity timeout', 'en-ca':'Inactivity timeout', 'als': 'Zitlimit' },
  settingsWarning:   { 'fr-fr':'Avertissement avant', 'fr-ca':'Avertissement avant', 'en-us':'Warning before', 'en-gb':'Warning before', 'en-ca':'Warning before', 'als': 'Warnig vorhär' },
  settingsMinutes:   { 'fr-fr':'min', 'fr-ca':'min', 'en-us':'min', 'en-gb':'min', 'en-ca':'min', 'als': 'min' },
  settingsSave:      { 'fr-fr':'Enregistrer', 'fr-ca':'Sauvegarder', 'en-us':'Save', 'en-gb':'Save', 'en-ca':'Save', 'als': 'Speichere' },
  settingsSaved:     { 'fr-fr':'Paramètres sauvegardés !', 'fr-ca':'Paramètres sauvegardés !', 'en-us':'Settings saved!', 'en-gb':'Settings saved!', 'en-ca':'Settings saved!', 'als': 'Iistellige gspeichert !' },

  // Language picker

  languageModalTitle:{ 'fr-fr':'🌐 Choisir la langue', 'fr-ca':'🌐 Choisir la langue', 'en-us':'🌐 Choose Language', 'en-gb':'🌐 Choose Language', 'en-ca':'🌐 Choose Language', 'als': '🌐 Sproch wähle' },
  languageSaving:    { 'fr-fr':'Sauvegarde...', 'fr-ca':'Sauvegarde...', 'en-us':'Saving...', 'en-gb':'Saving...', 'en-ca':'Saving...', 'als': 'Speichere...' },
  languageSaved:     { 'fr-fr':'✓ Langue mise à jour !', 'fr-ca':'✓ Langue mise à jour !', 'en-us':'✓ Language updated!', 'en-gb':'✓ Language updated!', 'en-ca':'✓ Language updated!', 'als': '✓ Sproch aktualisiert !' },
};

// ─── Fonction t() avec remplacement de variables {key} ────────────────────────
export function translate(lang, key, vars = {}) {
  const entry = T[key];
  if (!entry) { console.warn(`[i18n] Missing key: "${key}"`); return key; }
  let str = entry[lang] || entry[DEFAULT_LANG] || key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return str;
}

// ─── Noms des disciplines par langue ──────────────────────────────────────────
const DISCIPLINES_MAP_LANG = {
  'fr-fr': {
    'AQU':'Sports aquatiques','ATH':'Athlétisme','BAD':'Badminton','BKB':'Basketball','BOX':'Boxe',
    'BKB3':'Basketball 3×3','CAN':'Canoë-kayak','CYC':'Cyclisme sur route','DIV':'Plongeon',
    'EQU':'Équitation','FEN':'Escrime','GAR':'Gymnastique artistique','GRY':'Gymnastique rythmique',
    'GOL':'Golf','HAN':'Handball','HOC':'Hockey sur gazon','JUD':'Judo','MPN':'Pentathlon moderne',
    'ROW':'Aviron','RU7':'Rugby à 7','SAI':'Voile','SHO':'Tir sportif','SKB':'Skateboard',
    'SPO':'Escalade sportive','CLB':'Escalade sportive','SRF':'Surf','SWM':'Natation artistique',
    'TAE':'Taekwondo','TEN':'Tennis','TTB':'Tennis de table','TRI':'Triathlon','VOL':'Volleyball',
    'BVO':'Volleyball de plage','WLF':'Haltérophilie','WRE':'Lutte','ARC':"Tir à l'arc",
    'TRB':'Trampoline','MWP':'Water-polo','BMX':'BMX Racing','BRK':'Breaking',
    'MAR':'Marathon de natation','MTB':'VTT','TRK':'Cyclisme sur piste','BMF':'BMX Freestyle',
    'BSB':'Baseball / Softball','CRK':'Cricket','FLF':'Football américain à 7','LAX':'Lacrosse','SQU':'Squash',
    'aquatics':'Sports aquatiques','athletics':'Athlétisme','badminton':'Badminton','basketball':'Basketball',
    'boxing':'Boxe','basketball-3x3':'Basketball 3×3','canoe':'Canoë-kayak','canoe-slalom':'Canoë slalom',
    'canoe-sprint':'Canoë sprint','cycling':'Cyclisme','cycling-road':'Cyclisme sur route',
    'cycling-track':'Cyclisme sur piste','cycling-mountain-bike':'VTT','cycling-bmx-racing':'BMX Racing',
    'cycling-bmx-freestyle':'BMX Freestyle','diving':'Plongeon','equestrian':'Équitation',
    'fencing':'Escrime','football':'Football','golf':'Golf','gymnastics-artistic':'Gymnastique artistique',
    'gymnastics-rhythmic':'Gymnastique rythmique','gymnastics-trampoline':'Trampoline',
    'handball':'Handball','hockey':'Hockey sur gazon','judo':'Judo',
    'marathon-swimming':'Marathon de natation','modern-pentathlon':'Pentathlon moderne','rowing':'Aviron',
    'rugby-sevens':'Rugby à 7','sailing':'Voile','shooting':'Tir sportif','skateboarding':'Skateboard',
    'sport-climbing':'Escalade sportive','surfing':'Surf','swimming':'Natation',
    'artistic-swimming':'Natation artistique','table-tennis':'Tennis de table','taekwondo':'Taekwondo',
    'tennis':'Tennis','triathlon':'Triathlon','volleyball':'Volleyball','beach-volleyball':'Volleyball de plage',
    'water-polo':'Water-polo','weightlifting':'Haltérophilie','wrestling':'Lutte','archery':"Tir à l'arc",
    'breaking':'Breaking','baseball-softball':'Baseball / Softball','cricket':'Cricket',
    'flag-football':'Football américain à 7','lacrosse':'Lacrosse','squash':'Squash',
  },
  'fr-ca': {
    'AQU':'Sports aquatiques','ATH':'Athlétisme','BAD':'Badminton','BKB':'Basketball','BOX':'Boxe',
    'BKB3':'Basketball 3×3','CAN':'Canot-kayak','CYC':'Cyclisme sur route','DIV':'Plongeon',
    'EQU':'Équitation','FEN':'Escrime','GAR':'Gymnastique artistique','GRY':'Gymnastique rythmique',
    'GOL':'Golf','HAN':'Handball','HOC':'Hockey sur gazon','JUD':'Judo','MPN':'Pentathlon moderne',
    'ROW':'Aviron','RU7':'Rugby à 7','SAI':'Voile','SHO':'Tir sportif','SKB':'Planche à roulettes',
    'SPO':'Escalade sportive','CLB':'Escalade sportive','SRF':'Surf','SWM':'Natation artistique',
    'TAE':'Taekwondo','TEN':'Tennis','TTB':'Tennis de table','TRI':'Triathlon','VOL':'Volleyball',
    'BVO':'Volleyball de plage','WLF':'Haltérophilie','WRE':'Lutte','ARC':"Tir à l'arc",
    'TRB':'Trampoline','MWP':'Water-polo','BMX':'BMX Racing','BRK':'Breaking',
    'MAR':'Marathon de natation','MTB':'Vélo de montagne','TRK':'Cyclisme sur piste','BMF':'BMX Freestyle',
    'BSB':'Baseball / Balle molle','CRK':'Cricket','FLF':'Football à toucher','LAX':'Crosse','SQU':'Squash',
    'aquatics':'Sports aquatiques','athletics':'Athlétisme','badminton':'Badminton','basketball':'Basketball',
    'boxing':'Boxe','basketball-3x3':'Basketball 3×3','canoe':'Canot-kayak','canoe-slalom':'Canot slalom',
    'canoe-sprint':'Canot sprint','cycling':'Cyclisme','cycling-road':'Cyclisme sur route',
    'cycling-track':'Cyclisme sur piste','cycling-mountain-bike':'Vélo de montagne',
    'cycling-bmx-racing':'BMX Racing','cycling-bmx-freestyle':'BMX Freestyle','diving':'Plongeon',
    'equestrian':'Équitation','fencing':'Escrime','football':'Soccer','golf':'Golf',
    'gymnastics-artistic':'Gymnastique artistique','gymnastics-rhythmic':'Gymnastique rythmique',
    'gymnastics-trampoline':'Trampoline','handball':'Handball','hockey':'Hockey sur gazon','judo':'Judo',
    'marathon-swimming':'Marathon de natation','modern-pentathlon':'Pentathlon moderne','rowing':'Aviron',
    'rugby-sevens':'Rugby à 7','sailing':'Voile','shooting':'Tir sportif',
    'skateboarding':'Planche à roulettes','sport-climbing':'Escalade sportive','surfing':'Surf',
    'swimming':'Natation','artistic-swimming':'Natation artistique','table-tennis':'Tennis de table',
    'taekwondo':'Taekwondo','tennis':'Tennis','triathlon':'Triathlon','volleyball':'Volleyball',
    'beach-volleyball':'Volleyball de plage','water-polo':'Water-polo','weightlifting':'Haltérophilie',
    'wrestling':'Lutte','archery':"Tir à l'arc",'breaking':'Breaking',
    'baseball-softball':'Baseball / Balle molle','cricket':'Cricket',
    'flag-football':'Football à toucher','lacrosse':'Crosse','squash':'Squash',
  },
  'en-us': {
    'AQU':'Aquatics','ATH':'Athletics','BAD':'Badminton','BKB':'Basketball','BOX':'Boxing',
    'BKB3':'3×3 Basketball','CAN':'Canoe/Kayak','CYC':'Road Cycling','DIV':'Diving',
    'EQU':'Equestrian','FEN':'Fencing','GAR':'Artistic Gymnastics','GRY':'Rhythmic Gymnastics',
    'GOL':'Golf','HAN':'Handball','HOC':'Field Hockey','JUD':'Judo','MPN':'Modern Pentathlon',
    'ROW':'Rowing','RU7':'Rugby Sevens','SAI':'Sailing','SHO':'Shooting','SKB':'Skateboarding',
    'SPO':'Sport Climbing','CLB':'Sport Climbing','SRF':'Surfing','SWM':'Artistic Swimming',
    'TAE':'Taekwondo','TEN':'Tennis','TTB':'Table Tennis','TRI':'Triathlon','VOL':'Volleyball',
    'BVO':'Beach Volleyball','WLF':'Weightlifting','WRE':'Wrestling','ARC':'Archery',
    'TRB':'Trampoline Gymnastics','MWP':'Water Polo','BMX':'BMX Racing','BRK':'Breaking',
    'MAR':'Marathon Swimming','MTB':'Mountain Bike','TRK':'Track Cycling','BMF':'BMX Freestyle',
    'BSB':'Baseball/Softball','CRK':'Cricket','FLF':'Flag Football','LAX':'Lacrosse','SQU':'Squash',
    'aquatics':'Aquatics','athletics':'Athletics','badminton':'Badminton','basketball':'Basketball',
    'boxing':'Boxing','basketball-3x3':'3×3 Basketball','canoe':'Canoe/Kayak',
    'canoe-slalom':'Canoe Slalom','canoe-sprint':'Canoe Sprint','cycling':'Cycling',
    'cycling-road':'Road Cycling','cycling-track':'Track Cycling',
    'cycling-mountain-bike':'Mountain Bike','cycling-bmx-racing':'BMX Racing',
    'cycling-bmx-freestyle':'BMX Freestyle','diving':'Diving','equestrian':'Equestrian',
    'fencing':'Fencing','football':'Soccer','golf':'Golf',
    'gymnastics-artistic':'Artistic Gymnastics','gymnastics-rhythmic':'Rhythmic Gymnastics',
    'gymnastics-trampoline':'Trampoline Gymnastics','handball':'Handball','hockey':'Field Hockey',
    'judo':'Judo','marathon-swimming':'Marathon Swimming','modern-pentathlon':'Modern Pentathlon',
    'rowing':'Rowing','rugby-sevens':'Rugby Sevens','sailing':'Sailing','shooting':'Shooting',
    'skateboarding':'Skateboarding','sport-climbing':'Sport Climbing','surfing':'Surfing',
    'swimming':'Swimming','artistic-swimming':'Artistic Swimming','table-tennis':'Table Tennis',
    'taekwondo':'Taekwondo','tennis':'Tennis','triathlon':'Triathlon','volleyball':'Volleyball',
    'beach-volleyball':'Beach Volleyball','water-polo':'Water Polo','weightlifting':'Weightlifting',
    'wrestling':'Wrestling','archery':'Archery','breaking':'Breaking',
    'baseball-softball':'Baseball/Softball','cricket':'Cricket',
    'flag-football':'Flag Football','lacrosse':'Lacrosse','squash':'Squash',
  },
};
// en-gb: comme en-us mais Football (pas Soccer), Hockey (pas Field Hockey), Flag Football → American Flag Football
DISCIPLINES_MAP_LANG['en-gb'] = {
  ...DISCIPLINES_MAP_LANG['en-us'],
  'football':'Football',
  'HOC':'Hockey',
  'hockey':'Hockey',
  'FLF':'Flag Football',
  'flag-football':'Flag Football',
  'TRB':'Trampoline',
  'gymnastics-trampoline':'Trampoline',
};
// en-ca: comme en-us (Football = Soccer, Field Hockey, etc.)
DISCIPLINES_MAP_LANG['en-ca'] = { ...DISCIPLINES_MAP_LANG['en-us'] };
DISCIPLINES_MAP_LANG['als'] = {
  'AQU':'Wassersporte',
  'ATH':'Leichtathletik',
  'BAD':'Badminton',
  'BKB':'Basketball',
  'BOX':'Boxe',
  'BKB3':'Basketball 3×3',
  'CAN':'Kanu-Kajak',
  'CYC':'Radsport uf dr Stroß',
  'DIV':'Wasserspringe',
  'EQU':'Reitsport',
  'FEN':'Fechte',
  'GAR':'Kunschtturne',
  'GRY':'Rhythmischi Gymnastik',
  'GOL':'Golf',
  'HAN':'Handball',
  'HOC':'Hockey uf em Rase',
  'JUD':'Judo',
  'MPN':'Moderner Fünfkampf',
  'ROW':'Rudere',
  'RU7':'Rugby 7er',
  'SAI':'Segle',
  'SHO':'Sportschieße',
  'SKB':'Skateboard',
  'SPO':'Sportklettern',
  'CLB':'Sportklettern',
  'SRF':'Surf',
  'SWM':'Artistischi Schwimme',
  'TAE':'Taekwondo',
  'TEN':'Tennis',
  'TTB':'Tischtennis',
  'TRI':'Triathlon',
  'VOL':'Volleyball',
  'BVO':'Beach-Volleyball',
  'WLF':'Gewichthebe',
  'WRE':'Ringe',
  'TRB':'Trampolin',
  'MWP':'Wasserball',
  'BMX':'BMX Racing',
  'BRK':'Breaking',
  'MAR':'Schwimm-Marathon',
  'MTB':'Mountainbike',
  'TRK':'Bahnrad',
  'BMF':'BMX Freestyle',
  'BSB':'Baseball / Softball',
  'CRK':'Cricket',
  'FLF':'Amerikanischi Fußball 7er',
  'LAX':'Lacrosse',
  'SQU':'Squash',
  'aquatics':'Wassersporte',
  'athletics':'Leichtathletik',
  'badminton':'Badminton',
  'basketball':'Basketball',
  'boxing':'Boxe',
  'basketball-3x3':'Basketball 3×3',
  'canoe':'Kanu-Kajak',
  'canoe-slalom':'Kanu-Slalom',
  'canoe-sprint':'Kanu-Sprint',
  'cycling':'Radsport',
  'cycling-road':'Radsport uf dr Stroß',
  'cycling-track':'Bahnrad',
  'cycling-mountain-bike':'Mountainbike',
  'cycling-bmx-racing':'BMX Racing',
  'cycling-bmx-freestyle':'BMX Freestyle',
  'diving':'Wasserspringe',
  'equestrian':'Reitsport',
  'fencing':'Fechte',
  'football':'Fußball',
  'golf':'Golf',
  'gymnastics-artistic':'Kunschtturne',
  'gymnastics-rhythmic':'Rhythmischi Gymnastik',
  'gymnastics-trampoline':'Trampolin',
  'handball':'Handball',
  'hockey':'Hockey uf em Rase',
  'judo':'Judo',
  'marathon-swimming':'Schwimm-Marathon',
  'modern-pentathlon':'Moderner Fünfkampf',
  'rowing':'Rudere',
  'rugby-sevens':'Rugby 7er',
  'sailing':'Segle',
  'shooting':'Sportschieße',
  'skateboarding':'Skateboard',
  'sport-climbing':'Sportklettern',
  'surfing':'Surf',
  'swimming':'Schwimme',
  'artistic-swimming':'Artistischi Schwimme',
  'table-tennis':'Tischtennis',
  'taekwondo':'Taekwondo',
  'tennis':'Tennis',
  'triathlon':'Triathlon',
  'volleyball':'Volleyball',
  'beach-volleyball':'Beach-Volleyball',
  'water-polo':'Wasserball',
  'weightlifting':'Gewichthebe',
  'wrestling':'Ringe',
  'breaking':'Breaking',
  'baseball-softball':'Baseball / Softball',
  'cricket':'Cricket',
  'flag-football':'Amerikanischi Fußball 7er',
  'lacrosse':'Lacrosse',
  'squash':'Squash',
};

// ─── Noms des pays par langue ──────────────────────────────────────────────────
const COUNTRIES_FR = {
  'AFG':'Afghanistan','ALB':'Albanie','ALG':'Algérie','AND':'Andorre','ANG':'Angola',
  'ANT':'Antigua-et-Barbuda','ARG':'Argentine','ARM':'Arménie','ARU':'Aruba',
  'AUS':'Australie','AUT':'Autriche','AZE':'Azerbaïdjan','BAH':'Bahamas','BAN':'Bangladesh',
  'BAR':'Barbade','BDI':'Burundi','BEL':'Belgique','BEN':'Bénin','BER':'Bermudes',
  'BHU':'Bhoutan','BIH':'Bosnie-Herzégovine','BIZ':'Belize','BLR':'Bélarus',
  'BOL':'Bolivie','BOT':'Botswana','BRA':'Brésil','BRN':'Bahreïn','BRU':'Brunéi',
  'BUL':'Bulgarie','BUR':'Burkina Faso','CAF':'Rép. centrafricaine','CAM':'Cambodge',
  'CAN':'Canada','CAY':'Îles Caïmans','CGO':'Congo','CHA':'Tchad','CHI':'Chili',
  'CHN':'Chine','CIV':"Côte d'Ivoire",'CMR':'Cameroun','COD':'RD Congo','COK':'Îles Cook',
  'COL':'Colombie','COM':'Comores','CPV':'Cap-Vert','CRC':'Costa Rica','CRO':'Croatie',
  'CUB':'Cuba','CYP':'Chypre','CZE':'Tchéquie','DEN':'Danemark','DJI':'Djibouti',
  'DMA':'Dominique','DOM':'Rép. dominicaine','ECU':'Équateur','EGY':'Égypte',
  'ERI':'Érythrée','ESA':'El Salvador','ESP':'Espagne','EST':'Estonie','ETH':'Éthiopie',
  'FIJ':'Fidji','FIN':'Finlande','FRA':'France','FSM':'Micronésie','GAB':'Gabon',
  'GAM':'Gambie','GBR':'Grande-Bretagne','GBS':'Guinée-Bissau','GEO':'Géorgie',
  'GEQ':'Guinée équatoriale','GER':'Allemagne','GHA':'Ghana','GRE':'Grèce',
  'GRN':'Grenade','GUA':'Guatemala','GUI':'Guinée','GUM':'Guam','GUY':'Guyana',
  'HAI':'Haïti','HKG':'Hong Kong','HON':'Honduras','HUN':'Hongrie','INA':'Indonésie',
  'IND':'Inde','IRI':'Iran','IRL':'Irlande','IRQ':'Irak','ISL':'Islande','ISR':'Israël',
  'ISV':'Îles Vierges américaines','ITA':'Italie','IVB':'Îles Vierges britanniques',
  'JAM':'Jamaïque','JOR':'Jordanie','JPN':'Japon','KAZ':'Kazakhstan','KEN':'Kenya',
  'KGZ':'Kirghizistan','KIR':'Kiribati','KOR':'Corée du Sud','KOS':'Kosovo',
  'KSA':'Arabie saoudite','KUW':'Koweït','LAO':'Laos','LAT':'Lettonie','LBA':'Libye',
  'LBR':'Liberia','LCA':'Sainte-Lucie','LES':'Lesotho','LIE':'Liechtenstein',
  'LTU':'Lituanie','LUX':'Luxembourg','MAD':'Madagascar','MAR':'Maroc','MAS':'Malaisie',
  'MAW':'Malawi','MDA':'Moldova','MDV':'Maldives','MEX':'Mexique','MGL':'Mongolie',
  'MHL':'Îles Marshall','MKD':'Macédoine du Nord','MLI':'Mali','MLT':'Malte',
  'MNE':'Monténégro','MON':'Monaco','MOZ':'Mozambique','MRI':'Maurice','MTN':'Mauritanie',
  'MYA':'Myanmar','NAM':'Namibie','NCA':'Nicaragua','NED':'Pays-Bas','NEP':'Népal',
  'NGR':'Nigéria','NIG':'Niger','NOR':'Norvège','NRU':'Nauru','NZL':'Nouvelle-Zélande',
  'OMA':'Oman','PAK':'Pakistan','PAN':'Panama','PAR':'Paraguay','PER':'Pérou',
  'PHI':'Philippines','PLE':'Palestine','PLW':'Palaos','PNG':'Papouasie-Nouvelle-Guinée',
  'POL':'Pologne','POR':'Portugal','PRK':'Corée du Nord','PUR':'Porto Rico','QAT':'Qatar',
  'ROC':'Comité olympique russe','ROU':'Roumanie','RSA':'Afrique du Sud','RUS':'Russie',
  'RWA':'Rwanda','SAM':'Samoa','SEN':'Sénégal','SEY':'Seychelles','SGP':'Singapour',
  'SKN':'Saint-Christophe-et-Niévès','SLE':'Sierra Leone','SLO':'Slovénie',
  'SMR':'Saint-Marin','SOL':'Îles Salomon','SOM':'Somalie','SRB':'Serbie',
  'SRI':'Sri Lanka','SSD':'Soudan du Sud','STP':'São Tomé-et-Príncipe','SUD':'Soudan',
  'SUI':'Suisse','SUR':'Suriname','SVK':'Slovaquie','SWE':'Suède','SWZ':'Eswatini',
  'SYR':'Syrie','TAN':'Tanzanie','TGA':'Tonga','THA':'Thaïlande','TJK':'Tadjikistan',
  'TKM':'Turkménistan','TLS':'Timor-Leste','TOG':'Togo','TPE':'Taipei chinois',
  'TTO':'Trinité-et-Tobago','TUN':'Tunisie','TUR':'Turquie','TUV':'Tuvalu',
  'UAE':'Émirats arabes unis','UGA':'Ouganda','UKR':'Ukraine','URU':'Uruguay',
  'USA':'États-Unis','UZB':'Ouzbékistan','VAN':'Vanuatu','VEN':'Venezuela',
  'VIE':'Viêt Nam','VIN':'Saint-Vincent-et-les-Grenadines','YEM':'Yémen',
  'ZAM':'Zambie','ZIM':'Zimbabwe',
};

// ─── Helpers publics ───────────────────────────────────────────────────────────
export function getDisciplineNameLang(discipline, lang) {
  if (!discipline) return '';
  const map = DISCIPLINES_MAP_LANG[lang] || DISCIPLINES_MAP_LANG['fr-fr'];
  const code = discipline.code || discipline.id || '';
  const name = discipline.name || '';
  return (
    map[code] ||
    map[name.toLowerCase().replace(/\s+/g, '-')] ||
    map[name.toLowerCase()] ||
    name
  );
}

// Cache Intl.DisplayNames par locale pour éviter de recréer l'objet à chaque appel
const _intlCache = {};
function _getIntlNames(locale) {
  if (!_intlCache[locale]) {
    try { _intlCache[locale] = new Intl.DisplayNames([locale], { type: 'region' }); }
    catch { _intlCache[locale] = null; }
  }
  return _intlCache[locale];
}

// Correspondance code CIO (3 lettres) → code ISO 3166-1 alpha-2 (2 lettres)
// Nécessaire car Intl.DisplayNames utilise les codes ISO alpha-2
const CIO_TO_ISO2 = {
  'AFG':'AF','ALB':'AL','ALG':'DZ','AND':'AD','ANG':'AO','ANT':'AG','ARG':'AR','ARM':'AM',
  'ARU':'AW','AUS':'AU','AUT':'AT','AZE':'AZ','BAH':'BS','BAN':'BD','BAR':'BB','BDI':'BI',
  'BEL':'BE','BEN':'BJ','BER':'BM','BHU':'BT','BIH':'BA','BIZ':'BZ','BLR':'BY','BOL':'BO',
  'BOT':'BW','BRA':'BR','BRN':'BH','BRU':'BN','BUL':'BG','BUR':'BF','CAF':'CF','CAM':'KH',
  'CAN':'CA','CAY':'KY','CGO':'CG','CHA':'TD','CHI':'CL','CHN':'CN','CIV':'CI','CMR':'CM',
  'COD':'CD','COK':'CK','COL':'CO','COM':'KM','CPV':'CV','CRC':'CR','CRO':'HR','CUB':'CU',
  'CYP':'CY','CZE':'CZ','DEN':'DK','DJI':'DJ','DMA':'DM','DOM':'DO','ECU':'EC','EGY':'EG',
  'ERI':'ER','ESA':'SV','ESP':'ES','EST':'EE','ETH':'ET','FIJ':'FJ','FIN':'FI','FRA':'FR',
  'FSM':'FM','GAB':'GA','GAM':'GM','GBR':'GB','GBS':'GW','GEO':'GE','GEQ':'GQ','GER':'DE',
  'GHA':'GH','GRE':'GR','GRN':'GD','GUA':'GT','GUI':'GN','GUM':'GU','GUY':'GY','HAI':'HT',
  'HKG':'HK','HON':'HN','HUN':'HU','INA':'ID','IND':'IN','IRI':'IR','IRL':'IE','IRQ':'IQ',
  'ISL':'IS','ISR':'IL','ISV':'VI','ITA':'IT','IVB':'VG','JAM':'JM','JOR':'JO','JPN':'JP',
  'KAZ':'KZ','KEN':'KE','KGZ':'KG','KIR':'KI','KOR':'KR','KOS':'XK','KSA':'SA','KUW':'KW',
  'LAO':'LA','LAT':'LV','LBA':'LY','LBR':'LR','LCA':'LC','LES':'LS','LIE':'LI','LTU':'LT',
  'LUX':'LU','MAD':'MG','MAR':'MA','MAS':'MY','MAW':'MW','MDA':'MD','MDV':'MV','MEX':'MX',
  'MGL':'MN','MHL':'MH','MKD':'MK','MLI':'ML','MLT':'MT','MNE':'ME','MON':'MC','MOZ':'MZ',
  'MRI':'MU','MTN':'MR','MYA':'MM','NAM':'NA','NCA':'NI','NED':'NL','NEP':'NP','NGR':'NG',
  'NIG':'NE','NOR':'NO','NRU':'NR','NZL':'NZ','OMA':'OM','PAK':'PK','PAN':'PA','PAR':'PY',
  'PER':'PE','PHI':'PH','PLE':'PS','PLW':'PW','PNG':'PG','POL':'PL','POR':'PT','PRK':'KP',
  'PUR':'PR','QAT':'QA','ROU':'RO','RSA':'ZA','RUS':'RU','RWA':'RW','SAM':'WS','SEN':'SN',
  'SEY':'SC','SGP':'SG','SKN':'KN','SLE':'SL','SLO':'SI','SMR':'SM','SOL':'SB','SOM':'SO',
  'SRB':'RS','SRI':'LK','SSD':'SS','STP':'ST','SUD':'SD','SUI':'CH','SUR':'SR','SVK':'SK',
  'SWE':'SE','SWZ':'SZ','SYR':'SY','TAN':'TZ','TGA':'TO','THA':'TH','TJK':'TJ','TKM':'TM',
  'TLS':'TL','TOG':'TG','TPE':'TW','TTO':'TT','TUN':'TN','TUR':'TR','TUV':'TV','UAE':'AE',
  'UGA':'UG','UKR':'UA','URU':'UY','USA':'US','UZB':'UZ','VAN':'VU','VEN':'VE','VIE':'VN',
  'VIN':'VC','YEM':'YE','ZAM':'ZM','ZIM':'ZW',
};

const LANG_TO_INTL_LOCALE = {
  'en-us': 'en-US',
  'en-gb': 'en-GB',
  'en-ca': 'en-CA',
  'fr-fr': 'fr-FR',
  'fr-ca': 'fr-CA',
  'als':   'de-DE',  // Alsacien — noms de pays en allemand (plus proche)
};

export function getCountryNameLang(id, fallback, lang) {
  if (!id) return fallback || '';
  const upper = id.toUpperCase();

  // Pour le français : utiliser le dictionnaire manuel (plus précis que Intl)
  if (!lang || lang.startsWith('fr')) {
    return COUNTRIES_FR[upper] || fallback || id;
  }

  // Pour l'anglais (et toute autre langue) : utiliser Intl.DisplayNames avec le code ISO alpha-2
  const iso2 = CIO_TO_ISO2[upper];
  if (iso2) {
    const intlLocale = LANG_TO_INTL_LOCALE[lang] || 'en-US';
    const names = _getIntlNames(intlLocale);
    if (names) {
      try {
        const name = names.of(iso2);
        if (name && name !== iso2) return name;
      } catch { /* ignore */ }
    }
  }

  // Fallback final : retourner le fallback (qui peut être en portugais depuis l'API)
  // mais on préfère retourner l'id propre plutôt que rien
  return fallback || id;
}
