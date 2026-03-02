// ============================================================
//  Disciplines officielles LA 2028
//  Compétitions débutent le 12 juillet 2028
//  J1  = 12 juillet, J2 = 13 juillet ... J19 = 30 juillet
// ============================================================

export const GAMES_OPEN  = new Date('2028-07-12T00:00:00'); // J1 réel
export const GAMES_END   = new Date('2028-07-30T23:59:59'); // J19

// J1 = 12 juillet
export function getDayDate(day) {
  const d = new Date(GAMES_OPEN);
  d.setDate(d.getDate() + day - 1);
  return d;
}

// Bandeau J1 → J19
export const DISPLAY_DAYS = Array.from({ length: 19 }, (_, i) => i + 1);

export const GAME_DATES = {
  '1':  '12 juillet', '2':  '13 juillet', '3':  '14 juillet',
  '4':  '15 juillet', '5':  '16 juillet', '6':  '17 juillet',
  '7':  '18 juillet', '8':  '19 juillet', '9':  '20 juillet',
  '10': '21 juillet', '11': '22 juillet', '12': '23 juillet',
  '13': '24 juillet', '14': '25 juillet', '15': '26 juillet',
  '16': '27 juillet', '17': '28 juillet', '18': '29 juillet',
  '19': '30 juillet',
};

export function isPickLocked(disciplineId) {
  const disc = LA28_DISCIPLINES.find(d => d.id === disciplineId);
  if (!disc) return false;
  return new Date() >= getDayDate(disc.firstDay);
}

// null si hors Jeux (avant le 12 juillet ou après le 30 juillet)
export function getTodayGameDay() {
  const now = new Date();
  if (now < GAMES_OPEN || now > GAMES_END) return null;
  return Math.min(19, Math.floor((now - GAMES_OPEN) / 86400000) + 1);
}

// Jour par défaut : J1 avant les Jeux, jour courant pendant, J19 après
export function getDefaultDay() {
  const now = new Date();
  if (now < GAMES_OPEN) return 1;
  if (now > GAMES_END)  return 19;
  return Math.min(19, Math.floor((now - GAMES_OPEN) / 86400000) + 1);
}

// J1=12 juil, donc firstDay et medalDay sont recalculés :
// ancienne logique : J1=15 juil → nouvelle : J1=12 juil (décalage +3)
// firstDay: 1=12 juil, 2=13 juil, 3=14 juil, 4=15 juil...
export const LA28_DISCIPLINES = [
  { id: 'archery',               nameFR: "Tir à l'arc",            sport: "Tir à l'arc",      emoji: '🏹', firstDay: 4,  medalDay: 6,  days: [4,5,6,7,8,9,10] },
  { id: 'artistic-swimming',     nameFR: 'Natation artistique',     sport: 'Aquatiques',       emoji: '🏊', firstDay: 14, medalDay: 15, days: [14,15,16,17,18] },
  { id: 'athletics',             nameFR: 'Athlétisme',              sport: 'Athlétisme',       emoji: '🏃', firstDay: 4,  medalDay: 4,  days: [4,5,6,7,8,9,10,11] },
  { id: 'badminton',             nameFR: 'Badminton',               sport: 'Badminton',        emoji: '🏸', firstDay: 4,  medalDay: 16, days: [4,5,6,7,8,9,10,11,12,13,14,15,16] },
  { id: 'baseball',              nameFR: 'Baseball',                sport: 'Baseball/Softball',emoji: '⚾', firstDay: 2,  medalDay: 8,  days: [2,3,4,5,6,7,8] },
  { id: 'basketball',            nameFR: 'Basketball',              sport: 'Basketball',       emoji: '🏀', firstDay: 1,  medalDay: 17, days: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
  { id: 'basketball-3x3',        nameFR: 'Basketball 3×3',          sport: 'Basketball',       emoji: '🏀', firstDay: 4,  medalDay: 11, days: [4,5,6,7,8,9,10,11] },
  { id: 'beach-volleyball',      nameFR: 'Volleyball de plage',     sport: 'Volleyball',       emoji: '🏐', firstDay: 4,  medalDay: 17, days: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'boxing',                nameFR: 'Boxe',                    sport: 'Boxe',             emoji: '🥊', firstDay: 5,  medalDay: 18, days: [5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'canoe-slalom',          nameFR: 'Canoë slalom',            sport: 'Canoë',            emoji: '🛶', firstDay: 3,  medalDay: 6,  days: [3,4,5,6,7] },
  { id: 'canoe-sprint',          nameFR: 'Canoë sprint',            sport: 'Canoë',            emoji: '🛶', firstDay: 12, medalDay: 14, days: [12,13,14,15,16,18] },
  { id: 'cricket',               nameFR: 'Cricket',                 sport: 'Cricket',          emoji: '🏏', firstDay: 1,  medalDay: 9,  days: [1,2,3,4,5,6,7,8,9,18] },
  { id: 'cycling-bmx-freestyle', nameFR: 'BMX Freestyle',           sport: 'Cyclisme',         emoji: '🚵', firstDay: 15, medalDay: 15, days: [15,16,18] },
  { id: 'cycling-bmx-racing',    nameFR: 'BMX Racing',              sport: 'Cyclisme',         emoji: '🚵', firstDay: 8,  medalDay: 9,  days: [8,9] },
  { id: 'cycling-mountain-bike', nameFR: 'VTT',                     sport: 'Cyclisme',         emoji: '🚵', firstDay: 7,  medalDay: 8,  days: [7,8] },
  { id: 'cycling-road',          nameFR: 'Cyclisme sur route',       sport: 'Cyclisme',         emoji: '🚴', firstDay: 4,  medalDay: 5,  days: [4,5] },
  { id: 'cycling-track',         nameFR: 'Cyclisme sur piste',       sport: 'Cyclisme',         emoji: '🚴', firstDay: 10, medalDay: 10, days: [10,11,12,13,14,15,18] },
  { id: 'diving',                nameFR: 'Plongeon',                sport: 'Aquatiques',       emoji: '🤽', firstDay: 6,  medalDay: 8,  days: [6,7,8,9,10,11,12,13,14,15] },
  { id: 'equestrian',            nameFR: 'Équitation',              sport: 'Équitation',       emoji: '🏇', firstDay: 4,  medalDay: 8,  days: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'fencing',               nameFR: 'Escrime',                 sport: 'Escrime',          emoji: '🤺', firstDay: 4,  medalDay: 4,  days: [4,5,6,7,8,9,10,11,12] },
  { id: 'flag-football',         nameFR: 'Football américain à 7',  sport: 'Flag Football',    emoji: '🏈', firstDay: 4,  medalDay: 10, days: [4,5,6,7,8,9,10,11] },
  { id: 'football',              nameFR: 'Football',                sport: 'Football',         emoji: '⚽', firstDay: 1,  medalDay: 17, days: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
  { id: 'golf',                  nameFR: 'Golf',                    sport: 'Golf',             emoji: '⛳', firstDay: 9,  medalDay: 12, days: [9,10,11,12,13,16,17,18] },
  { id: 'gymnastics-artistic',   nameFR: 'Gymnastique artistique',  sport: 'Gymnastique',      emoji: '🤸', firstDay: 4,  medalDay: 5,  days: [4,5,6,7,8,9,10,11,14] },
  { id: 'gymnastics-rhythmic',   nameFR: 'Gymnastique rythmique',   sport: 'Gymnastique',      emoji: '🤸', firstDay: 16, medalDay: 16, days: [16,17,18] },
  { id: 'gymnastics-trampoline', nameFR: 'Trampoline',              sport: 'Gymnastique',      emoji: '🤸', firstDay: 12, medalDay: 12, days: [12,13] },
  { id: 'handball',              nameFR: 'Handball',                sport: 'Handball',         emoji: '🤾', firstDay: 1,  medalDay: 16, days: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
  { id: 'hockey',                nameFR: 'Hockey sur gazon',        sport: 'Hockey',           emoji: '🏑', firstDay: 1,  medalDay: 16, days: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
  { id: 'judo',                  nameFR: 'Judo',                    sport: 'Judo',             emoji: '🥋', firstDay: 4,  medalDay: 4,  days: [4,5,6,7,8,9,10,11] },
  { id: 'lacrosse',              nameFR: 'Lacrosse',                sport: 'Lacrosse',         emoji: '🥍', firstDay: 6,  medalDay: 18, days: [6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'marathon-swimming',     nameFR: 'Marathon natation',       sport: 'Aquatiques',       emoji: '🏊', firstDay: 8,  medalDay: 8,  days: [8,9] },
  { id: 'modern-pentathlon',     nameFR: 'Pentathlon moderne',      sport: 'Pentathlon',       emoji: '🏅', firstDay: 13, medalDay: 16, days: [13,14,15,16] },
  { id: 'rowing',                nameFR: 'Aviron',                  sport: 'Aviron',           emoji: '🚣', firstDay: 4,  medalDay: 8,  days: [4,5,6,7,8,9,10,11,14] },
  { id: 'rugby-sevens',          nameFR: 'Rugby à 7',               sport: 'Rugby',            emoji: '🏉', firstDay: 1,  medalDay: 5,  days: [1,2,3,4,5] },
  { id: 'sailing',               nameFR: 'Voile',                   sport: 'Voile',            emoji: '⛵', firstDay: 6,  medalDay: 14, days: [6,7,8,9,10,11,12,13,14,15] },
  { id: 'shooting',              nameFR: 'Tir sportif',             sport: 'Tir',              emoji: '🎯', firstDay: 4,  medalDay: 4,  days: [4,5,6,7,8,9,10,11] },
  { id: 'skateboarding',         nameFR: 'Skateboard',              sport: 'Skateboard',       emoji: '🛹', firstDay: 5,  medalDay: 5,  days: [5,6,7,8,9,10] },
  { id: 'softball',              nameFR: 'Softball',                sport: 'Baseball/Softball',emoji: '🥎', firstDay: 2,  medalDay: 18, days: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'sport-climbing',        nameFR: 'Escalade sportive',       sport: 'Escalade',         emoji: '🧗', firstDay: 13, medalDay: 15, days: [13,14,15,16,17,18] },
  { id: 'squash',                nameFR: 'Squash',                  sport: 'Squash',           emoji: '🎾', firstDay: 4,  medalDay: 12, days: [4,5,6,7,8,9,10,11,12,13] },
  { id: 'surfing',               nameFR: 'Surf',                    sport: 'Surf',             emoji: '🏄', firstDay: 4,  medalDay: 8,  days: [4,5,6,7,8,9,10,11] },
  { id: 'swimming',              nameFR: 'Natation',                sport: 'Aquatiques',       emoji: '🏊', firstDay: 12, medalDay: 12, days: [12,13,14,15,16,17,18,19] },
  { id: 'table-tennis',          nameFR: 'Tennis de table',         sport: 'Tennis de table',  emoji: '🏓', firstDay: 4,  medalDay: 11, days: [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] },
  { id: 'taekwondo',             nameFR: 'Taekwondo',               sport: 'Taekwondo',        emoji: '🥋', firstDay: 13, medalDay: 13, days: [13,14,15,16,17,18] },
  { id: 'tennis',                nameFR: 'Tennis',                  sport: 'Tennis',           emoji: '🎾', firstDay: 4,  medalDay: 11, days: [4,5,6,7,8,9,10,11] },
  { id: 'triathlon',             nameFR: 'Triathlon',               sport: 'Triathlon',        emoji: '🏊', firstDay: 4,  medalDay: 4,  days: [4,5,6] },
  { id: 'volleyball',            nameFR: 'Volleyball',              sport: 'Volleyball',       emoji: '🏐', firstDay: 4,  medalDay: 17, days: [4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
  { id: 'water-polo',            nameFR: 'Water-polo',              sport: 'Aquatiques',       emoji: '🤽', firstDay: 2,  medalDay: 17, days: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17] },
  { id: 'weightlifting',         nameFR: 'Haltérophilie',           sport: 'Haltérophilie',    emoji: '🏋', firstDay: 11, medalDay: 11, days: [11,12,13,14,15,16,17,18] },
  { id: 'wrestling',             nameFR: 'Lutte',                   sport: 'Lutte',            emoji: '🤼', firstDay: 12, medalDay: 12, days: [12,13,14,15,16,17,18] },
];

export const DISCIPLINES_MAP = Object.fromEntries(LA28_DISCIPLINES.map(d => [d.id, d]));
