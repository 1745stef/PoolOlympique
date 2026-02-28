const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const OLYMPIC_API = 'https://apis.codante.io/olympic-games';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('token');
}

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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (username, password) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => apiFetch('/auth/me'),
};

// ─── Picks ────────────────────────────────────────────────────────────────────
export const picksApi = {
  getAll: () => apiFetch('/picks'),
  upsert: (discipline_id, country_id) =>
    apiFetch('/picks', { method: 'POST', body: JSON.stringify({ discipline_id, country_id }) }),
  delete: (discipline_id) =>
    apiFetch(`/picks/${discipline_id}`, { method: 'DELETE' }),
};

export const leaderboardApi = {
  get: () => apiFetch('/leaderboard'),
  getResults: () => apiFetch('/results'),
};

export const adminApi = {
  getUsers: () => apiFetch('/admin/users'),
  getAllPicks: () => apiFetch('/admin/picks'),
  getResults: () => apiFetch('/results'),
  upsertResult: (discipline_id, gold_country_id, silver_country_id, bronze_country_id) =>
    apiFetch('/results', {
      method: 'POST',
      body: JSON.stringify({ discipline_id, gold_country_id, silver_country_id, bronze_country_id }),
    }),
  deleteResult: (discipline_id) =>
    apiFetch(`/results/${discipline_id}`, { method: 'DELETE' }),
  toggleAdmin: (userId, is_admin) =>
    apiFetch(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ is_admin }) }),
};

// ─── Olympic Data (Codante.io) ────────────────────────────────────────────────
async function fetchAllPages(endpoint) {
  let page = 1;
  let allData = [];
  while (true) {
    const res = await fetch(`${OLYMPIC_API}/${endpoint}?page=${page}`);
    const json = await res.json();
    allData = [...allData, ...json.data];
    if (!json.meta?.next_page_url) break;
    page++;
    if (page > 20) break; // safety
  }
  return allData;
}

export const olympicApi = {
  getDisciplines: () => fetchAllPages('disciplines'),
  getCountries: () => fetchAllPages('countries'),

  // Pour une discipline donnée, on récupère les pays participants
  getCountriesForDiscipline: async (disciplineCode) => {
    const res = await fetch(
      `${OLYMPIC_API}/events?discipline=${disciplineCode}&page=1`
    );
    const json = await res.json();
    const countrySet = new Map();
    json.data?.forEach((event) => {
      event.competitors?.forEach((c) => {
        if (c.country_id && !countrySet.has(c.country_id)) {
          countrySet.set(c.country_id, {
            id: c.country_id,
            name: c.country_id,
            flag_url: c.country_flag_url,
          });
        }
      });
    });
    return Array.from(countrySet.values());
  },
};
