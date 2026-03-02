// Disciplines paralympiques à exclure
export const PARA_DISCIPLINES = new Set([
  'PAR', 'PARA', 'WCH', 'SIT', 'BLI', 'VIS', 'AMP',
  'boccia', 'goalball', 'sitting-volleyball', 'wheelchair-basketball',
  'wheelchair-fencing', 'wheelchair-rugby', 'wheelchair-tennis',
  'para-archery', 'para-athletics', 'para-badminton', 'para-canoe',
  'para-cycling', 'para-equestrian', 'para-judo', 'para-powerlifting',
  'para-rowing', 'para-shooting', 'para-swimming', 'para-table-tennis',
  'para-taekwondo', 'para-triathlon',
]);

const PARA_NAME_KEYWORDS = [
  'para', 'paralymp', 'wheelchair', 'boccia', 'goalball', 'blind',
  'sitting volleyball', 'sitting volley', 'powerlifting', 'visually',
  'intellectual', 'amputee', 'cerebral',
];

export function isParaOlympic(discipline) {
  const name = (discipline.name || '').toLowerCase();
  const id = (discipline.id || '').toLowerCase();
  const code = (discipline.code || '').toLowerCase();
  return (
    PARA_NAME_KEYWORDS.some(kw => name.includes(kw)) ||
    id.includes('para') || id.includes('sitting') ||
    code.includes('para') ||
    PARA_DISCIPLINES.has(code) ||
    PARA_DISCIPLINES.has(id)
  );
}

// Traductions françaises des disciplines
export const DISCIPLINES_FR = {
  // Codes courts
  'AQU': 'Natation', 'ATH': 'Athlétisme', 'BAD': 'Badminton',
  'BKB': 'Basketball', 'BOX': 'Boxe', 'BKB3': 'Basketball 3x3',
  'CAN': 'Canoë-kayak', 'CYC': 'Cyclisme sur route', 'DIV': 'Plongeon',
  'EQU': 'Équitation', 'FEN': 'Escrime', 'GAR': 'Gymnastique artistique',
  'GRY': 'Gymnastique rythmique', 'GOL': 'Golf', 'HAN': 'Handball',
  'HOC': 'Hockey sur gazon', 'JUD': 'Judo', 'MPN': 'Pentathlon moderne',
  'ROW': 'Aviron', 'RU7': 'Rugby à 7', 'SAI': 'Voile',
  'SHO': 'Tir sportif', 'SKB': 'Skateboard', 'SPO': 'Escalade sportive',
  'CLB': 'Escalade', 'SRF': 'Surf', 'SWM': 'Natation synchronisée',
  'TAE': 'Taekwondo', 'TEN': 'Tennis', 'TTB': 'Tennis de table',
  'TRI': 'Triathlon', 'VOL': 'Volleyball', 'BVO': 'Volleyball de plage',
  'WLF': 'Haltérophilie', 'WRE': 'Lutte', 'ARC': "Tir à l'arc",
  'TRB': 'Trampoline', 'MWP': 'Water-polo', 'BMX': 'BMX Racing',
  'BRK': 'Breaking', 'MAR': 'Marathon natation', 'MTB': 'VTT',
  'TRK': 'Cyclisme sur piste', 'BMF': 'BMX Freestyle',
  // LA28 nouveaux sports
  'BSB': 'Baseball / Softball', 'CRK': 'Cricket',
  'FLF': 'Football américain à 7', 'LAX': 'Lacrosse', 'SQU': 'Squash',
  // Noms complets (API Codante)
  'aquatics': 'Natation', 'athletics': 'Athlétisme',
  'badminton': 'Badminton', 'basketball': 'Basketball',
  'boxing': 'Boxe', 'basketball-3x3': 'Basketball 3x3',
  'canoe': 'Canoë-kayak', 'canoe-slalom': 'Canoë slalom',
  'canoe-sprint': 'Canoë sprint', 'cycling': 'Cyclisme',
  'cycling-road': 'Cyclisme sur route', 'cycling-track': 'Cyclisme sur piste',
  'cycling-mountain-bike': 'VTT', 'cycling-bmx-racing': 'BMX Racing',
  'cycling-bmx-freestyle': 'BMX Freestyle', 'diving': 'Plongeon',
  'equestrian': 'Équitation', 'fencing': 'Escrime',
  'football': 'Football', 'golf': 'Golf',
  'gymnastics-artistic': 'Gymnastique artistique',
  'gymnastics-rhythmic': 'Gymnastique rythmique',
  'gymnastics-trampoline': 'Trampoline',
  'handball': 'Handball', 'hockey': 'Hockey sur gazon',
  'judo': 'Judo', 'marathon-swimming': 'Marathon natation',
  'modern-pentathlon': 'Pentathlon moderne',
  'rowing': 'Aviron', 'rugby-sevens': 'Rugby à 7',
  'sailing': 'Voile', 'shooting': 'Tir sportif',
  'skateboarding': 'Skateboard', 'sport-climbing': 'Escalade sportive',
  'surfing': 'Surf', 'swimming': 'Natation',
  'artistic-swimming': 'Natation artistique',
  'table-tennis': 'Tennis de table', 'taekwondo': 'Taekwondo',
  'tennis': 'Tennis', 'triathlon': 'Triathlon',
  'volleyball': 'Volleyball', 'beach-volleyball': 'Volleyball de plage',
  'water-polo': 'Water-polo', 'weightlifting': 'Haltérophilie',
  'wrestling': 'Lutte', 'archery': "Tir à l'arc",
  'breaking': 'Breaking',
  // LA28
  'baseball-softball': 'Baseball / Softball', 'cricket': 'Cricket',
  'flag-football': 'Football américain à 7', 'lacrosse': 'Lacrosse',
  'squash': 'Squash',
};

// Traductions françaises des pays (codes IOC)
export const COUNTRIES_FR = {
  'AFG': 'Afghanistan', 'ALB': 'Albanie', 'ALG': 'Algérie', 'AND': 'Andorre',
  'ANG': 'Angola', 'ANT': 'Antigua-et-Barbuda', 'ARG': 'Argentine', 'ARM': 'Arménie',
  'ARU': 'Aruba', 'AUS': 'Australie', 'AUT': 'Autriche', 'AZE': 'Azerbaïdjan',
  'BAH': 'Bahamas', 'BAN': 'Bangladesh', 'BAR': 'Barbade', 'BDI': 'Burundi',
  'BEL': 'Belgique', 'BEN': 'Bénin', 'BER': 'Bermudes', 'BHU': 'Bhoutan',
  'BIH': 'Bosnie-Herzégovine', 'BIZ': 'Belize', 'BLR': 'Biélorussie', 'BOL': 'Bolivie',
  'BOT': 'Botswana', 'BRA': 'Brésil', 'BRN': 'Bahreïn', 'BRU': 'Brunéi',
  'BUL': 'Bulgarie', 'BUR': 'Burkina Faso', 'CAF': 'Rép. centrafricaine',
  'CAM': 'Cambodge', 'CAN': 'Canada', 'CAY': 'Îles Caïmans', 'CGO': 'Congo',
  'CHA': 'Tchad', 'CHI': 'Chili', 'CHN': 'Chine', 'CIV': "Côte d'Ivoire",
  'CMR': 'Cameroun', 'COD': 'RD Congo', 'COK': 'Îles Cook', 'COL': 'Colombie',
  'COM': 'Comores', 'CPV': 'Cap-Vert', 'CRC': 'Costa Rica', 'CRO': 'Croatie',
  'CUB': 'Cuba', 'CYP': 'Chypre', 'CZE': 'Rép. tchèque', 'DEN': 'Danemark',
  'DJI': 'Djibouti', 'DMA': 'Dominique', 'DOM': 'Rép. dominicaine',
  'ECU': 'Équateur', 'EGY': 'Égypte', 'ERI': 'Érythrée', 'ESA': 'El Salvador',
  'ESP': 'Espagne', 'EST': 'Estonie', 'ETH': 'Éthiopie', 'FIJ': 'Fidji',
  'FIN': 'Finlande', 'FRA': 'France', 'FSM': 'Micronésie', 'GAB': 'Gabon',
  'GAM': 'Gambie', 'GBR': 'Grande-Bretagne', 'GBS': 'Guinée-Bissau', 'GEO': 'Géorgie',
  'GEQ': 'Guinée équatoriale', 'GER': 'Allemagne', 'GHA': 'Ghana', 'GRE': 'Grèce',
  'GRN': 'Grenade', 'GUA': 'Guatemala', 'GUI': 'Guinée', 'GUM': 'Guam',
  'GUY': 'Guyana', 'HAI': 'Haïti', 'HKG': 'Hong Kong', 'HON': 'Honduras',
  'HUN': 'Hongrie', 'INA': 'Indonésie', 'IND': 'Inde', 'IRI': 'Iran',
  'IRL': 'Irlande', 'IRQ': 'Irak', 'ISL': 'Islande', 'ISR': 'Israël',
  'ISV': 'Îles Vierges américaines', 'ITA': 'Italie', 'IVB': 'Îles Vierges britanniques',
  'JAM': 'Jamaïque', 'JOR': 'Jordanie', 'JPN': 'Japon', 'KAZ': 'Kazakhstan',
  'KEN': 'Kenya', 'KGZ': 'Kirghizistan', 'KIR': 'Kiribati', 'KOR': 'Corée du Sud',
  'KOS': 'Kosovo', 'KSA': 'Arabie saoudite', 'KUW': 'Koweït', 'LAO': 'Laos',
  'LAT': 'Lettonie', 'LBA': 'Libye', 'LBR': 'Liberia', 'LCA': 'Sainte-Lucie',
  'LES': 'Lesotho', 'LIE': 'Liechtenstein', 'LTU': 'Lituanie', 'LUX': 'Luxembourg',
  'MAD': 'Madagascar', 'MAR': 'Maroc', 'MAS': 'Malaisie', 'MAW': 'Malawi',
  'MDA': 'Moldavie', 'MDV': 'Maldives', 'MEX': 'Mexique', 'MGL': 'Mongolie',
  'MHL': 'Îles Marshall', 'MKD': 'Macédoine du Nord', 'MLI': 'Mali', 'MLT': 'Malte',
  'MNE': 'Monténégro', 'MON': 'Monaco', 'MOZ': 'Mozambique', 'MRI': 'Maurice',
  'MTN': 'Mauritanie', 'MYA': 'Myanmar', 'NAM': 'Namibie', 'NCA': 'Nicaragua',
  'NED': 'Pays-Bas', 'NEP': 'Népal', 'NGR': 'Nigéria', 'NIG': 'Niger',
  'NOR': 'Norvège', 'NRU': 'Nauru', 'NZL': 'Nouvelle-Zélande', 'OMA': 'Oman',
  'PAK': 'Pakistan', 'PAN': 'Panama', 'PAR': 'Paraguay', 'PER': 'Pérou',
  'PHI': 'Philippines', 'PLE': 'Palestine', 'PLW': 'Palaos', 'PNG': 'Papouasie-Nvl-Guinée',
  'POL': 'Pologne', 'POR': 'Portugal', 'PRK': 'Corée du Nord', 'PUR': 'Porto Rico',
  'QAT': 'Qatar', 'ROC': 'Comité olympique russe', 'ROU': 'Roumanie', 'RSA': 'Afrique du Sud',
  'RUS': 'Russie', 'RWA': 'Rwanda', 'SAM': 'Samoa', 'SEN': 'Sénégal',
  'SEY': 'Seychelles', 'SGP': 'Singapour', 'SKN': 'Saint-Christophe-et-Niévès',
  'SLE': 'Sierra Leone', 'SLO': 'Slovénie', 'SMR': 'Saint-Marin', 'SOL': 'Îles Salomon',
  'SOM': 'Somalie', 'SRB': 'Serbie', 'SRI': 'Sri Lanka', 'SSD': 'Soudan du Sud',
  'STP': 'São Tomé-et-Príncipe', 'SUD': 'Soudan', 'SUI': 'Suisse', 'SUR': 'Suriname',
  'SVK': 'Slovaquie', 'SWE': 'Suède', 'SWZ': 'Eswatini', 'SYR': 'Syrie',
  'TAN': 'Tanzanie', 'TGA': 'Tonga', 'THA': 'Thaïlande', 'TJK': 'Tadjikistan',
  'TKM': 'Turkménistan', 'TLS': 'Timor-Leste', 'TOG': 'Togo', 'TPE': 'Taipei chinois',
  'TTO': 'Trinité-et-Tobago', 'TUN': 'Tunisie', 'TUR': 'Turquie', 'TUV': 'Tuvalu',
  'UAE': 'Émirats arabes unis', 'UGA': 'Ouganda', 'UKR': 'Ukraine', 'URU': 'Uruguay',
  'USA': 'États-Unis', 'UZB': 'Ouzbékistan', 'VAN': 'Vanuatu', 'VEN': 'Venezuela',
  'VIE': 'Viêt Nam', 'VIN': 'Saint-Vincent-et-les-Grenadines', 'YEM': 'Yémen',
  'ZAM': 'Zambie', 'ZIM': 'Zimbabwe',
};

export function getDisciplineName(discipline) {
  if (!discipline) return '';
  const code = discipline.code || discipline.id || '';
  const name = discipline.name || '';
  // Try code first, then slug from name, then original name
  return DISCIPLINES_FR[code]
    || DISCIPLINES_FR[name.toLowerCase().replace(/\s+/g, '-')]
    || DISCIPLINES_FR[name.toLowerCase()]
    || name;
}

export function getCountryName(id, fallback) {
  if (!id) return fallback || '';
  return COUNTRIES_FR[id.toUpperCase()] || fallback || id;
}
