const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() { return localStorage.getItem('token'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  // Lire le corps comme texte d'abord pour éviter le crash si ce n'est pas du JSON
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Erreur serveur (${res.status}) : réponse invalide`); }
  if (!res.ok) {
    const err = data.error;
    const msg = typeof err === 'string' ? err : (err?.message || err?.details || JSON.stringify(err) || 'Erreur serveur');
    throw new Error(msg);
  }
  return data;
}

export const authApi = {
  register:       (username, password)  => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login:          (username, password)  => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify({ username, password }) }),
  me:             ()                    => apiFetch('/auth/me'),
  changePassword:    (new_password) => apiFetch('/auth/change-password',   { method: 'POST', body: JSON.stringify({ new_password }) }),
  setFavoriteCountry:(country_id)  => apiFetch('/auth/favorite-country',  { method: 'PUT',  body: JSON.stringify({ country_id }) }),
  updateAvatar:      (fields)      => apiFetch('/auth/avatar',             { method: 'PUT',  body: JSON.stringify(fields) }),
  uploadAvatar:      (base64, contentType, originalBase64, originalContentType) => apiFetch('/auth/avatar/upload', { method: 'POST', body: JSON.stringify({ base64, contentType, originalBase64, originalContentType }) }),
  fetchImageAsBase64:(url) => apiFetch('/auth/avatar/fetch-image', { method: 'POST', body: JSON.stringify({ url }) }),
  setLanguage:       (language) => apiFetch('/auth/language', { method: 'PUT', body: JSON.stringify({ language }) }),
};

export const picksApi = {
  getAll: () => apiFetch('/picks'),
  upsert: (discipline_id, country_id) =>
    apiFetch('/picks', { method: 'POST', body: JSON.stringify({ discipline_id, country_id }) }),
  delete: (discipline_id) => apiFetch(`/picks/${discipline_id}`, { method: 'DELETE' }),
};

export const leaderboardApi = {
  get:        () => apiFetch('/leaderboard'),
  getResults: () => apiFetch('/results'),
};

export const groupsApi = {
  getAll:       ()             => apiFetch('/groups'),
  create:       (name)         => apiFetch('/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  delete:       (id)           => apiFetch(`/groups/${id}`, { method: 'DELETE' }),
  addMember:    (groupId, uid) => apiFetch(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ user_id: uid }) }),
  removeMember: (groupId, uid) => apiFetch(`/groups/${groupId}/members/${uid}`, { method: 'DELETE' }),
};

export const adminApi = {
  getUsers:       ()    => apiFetch('/admin/users'),
  getAllPicks:     ()    => apiFetch('/admin/picks'),
  getResults:     ()    => apiFetch('/results'),
  upsertResult:   (discipline_id, gold, silver, bronze) =>
    apiFetch('/results', { method: 'POST', body: JSON.stringify({ discipline_id, gold_country_id: gold, silver_country_id: silver, bronze_country_id: bronze }) }),
  deleteResult:   (id)                => apiFetch(`/results/${id}`, { method: 'DELETE' }),
  toggleAdmin:    (uid, is_admin)     => apiFetch(`/admin/users/${uid}`, { method: 'PUT', body: JSON.stringify({ is_admin }) }),
  deleteUser:     (uid)               => apiFetch(`/admin/users/${uid}`, { method: 'DELETE' }),
  setTempPassword:(uid, tmp)          => apiFetch(`/admin/users/${uid}/temp-password`, { method: 'POST', body: JSON.stringify({ temp_password: tmp }) }),
  fetchResults:   ()                  => apiFetch('/admin/fetch-results', { method: 'POST' }),
};

// API Codante — uniquement pour les pays maintenant
const OLYMPIC_API = 'https://apis.codante.io/olympic-games';
async function fetchAllPages(endpoint) {
  let page = 1, allData = [];
  while (true) {
    const res = await fetch(`${OLYMPIC_API}/${endpoint}?page=${page}`);
    const json = await res.json();
    allData = [...allData, ...(json.data || [])];
    if (!json.meta?.next_page_url) break;
    page++;
    if (page > 20) break;
  }
  return allData;
}

export const olympicApi = {
  getCountries: () => fetchAllPages('countries'),
};
