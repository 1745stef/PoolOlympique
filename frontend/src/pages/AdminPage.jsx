import { useState, useEffect } from 'react';
import { adminApi, olympicApi } from '../lib/api';

const MEDALS = [
  { key: 'gold',   label: 'Or',     icon: '🥇', points: 5, color: '#d4a017' },
  { key: 'silver', label: 'Argent', icon: '🥈', points: 3, color: '#b8c0cc' },
  { key: 'bronze', label: 'Bronze', icon: '🥉', points: 1, color: '#cd7f32' },
];

export default function AdminPage() {
  const [disciplines, setDisciplines]   = useState([]);
  const [countries, setCountries]       = useState([]);
  const [results, setResults]           = useState({});
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('results');
  const [search, setSearch]             = useState('');
  const [saving, setSaving]             = useState(null);
  const [notification, setNotification] = useState(null);
  const [editing, setEditing]           = useState(null);
  const [countrySearch, setCountrySearch] = useState('');

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      olympicApi.getDisciplines(),
      olympicApi.getCountries(),
      adminApi.getResults(),
      adminApi.getUsers(),
    ]).then(([discs, ctries, res, usrs]) => {
      setDisciplines(discs);
      setCountries(ctries);
      const map = {};
      res.forEach((r) => { map[r.discipline_id] = r; });
      setResults(map);
      setUsers(usrs);
    }).finally(() => setLoading(false));
  }, []);

  const savePodium = async (disciplineId, podium) => {
    setSaving(disciplineId);
    try {
      await adminApi.upsertResult(
        disciplineId,
        podium.gold   || null,
        podium.silver || null,
        podium.bronze || null,
      );
      setResults((prev) => ({
        ...prev,
        [disciplineId]: {
          discipline_id:      disciplineId,
          gold_country_id:    podium.gold   || null,
          silver_country_id:  podium.silver || null,
          bronze_country_id:  podium.bronze || null,
        },
      }));
      notify('✓ Podium enregistré !');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  const handlePickMedal = async (disciplineId, medalKey, countryId) => {
    const current = results[disciplineId] || {};
    const podium = {
      gold:   current.gold_country_id   || null,
      silver: current.silver_country_id || null,
      bronze: current.bronze_country_id || null,
    };
    if (podium[medalKey] === countryId) {
      podium[medalKey] = null;
    } else {
      // Remove this country from other slots
      if (podium.gold   === countryId && medalKey !== 'gold')   podium.gold   = null;
      if (podium.silver === countryId && medalKey !== 'silver') podium.silver = null;
      if (podium.bronze === countryId && medalKey !== 'bronze') podium.bronze = null;
      podium[medalKey] = countryId;
    }
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try {
        await adminApi.deleteResult(disciplineId);
        setResults((prev) => { const n = { ...prev }; delete n[disciplineId]; return n; });
        notify('Résultat effacé', 'info');
      } catch (e) { notify(e.message, 'error'); }
      finally { setSaving(null); }
    } else {
      if (!podium.gold) { notify("L'or est obligatoire", 'error'); return; }
      await savePodium(disciplineId, podium);
    }
    setEditing(null);
  };

  const clearMedal = async (disciplineId, medalKey) => {
    const current = results[disciplineId] || {};
    const podium = {
      gold:   current.gold_country_id   || null,
      silver: current.silver_country_id || null,
      bronze: current.bronze_country_id || null,
    };
    podium[medalKey] = null;
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try {
        await adminApi.deleteResult(disciplineId);
        setResults((prev) => { const n = { ...prev }; delete n[disciplineId]; return n; });
        notify('Résultat effacé', 'info');
      } catch (e) { notify(e.message, 'error'); }
      finally { setSaving(null); }
      return;
    }
    if (!podium.gold) { notify("L'or est obligatoire", 'error'); return; }
    await savePodium(disciplineId, podium);
  };

  const handleToggleAdmin = async (userId, currentVal) => {
    try {
      const updated = await adminApi.toggleAdmin(userId, !currentVal);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin: updated.is_admin } : u));
      notify('Rôle mis à jour');
    } catch (e) { notify(e.message, 'error'); }
  };

  const getCountry = (id) => countries.find((c) => c.id === id);
  const completedCount = Object.keys(results).length;
  const filteredDisciplines = disciplines.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCountries = countries.filter((c) =>
    (c.name || c.id).toLowerCase().includes(countrySearch.toLowerCase())
  );

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner" />
      <p>Chargement des données...</p>
    </div>
  );

  return (
    <div className="admin-page">
      {notification && (
        <div className={`notification notification-${notification.type}`}>{notification.msg}</div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-value gold">{completedCount}</span>
          <span className="stat-label">Podiums saisis</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{disciplines.length - completedCount}</span>
          <span className="stat-label">Restantes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{users.length}</span>
          <span className="stat-label">Participants</span>
        </div>
        <div className="stat-card">
          <div className="stat-progress-bar">
            <div className="stat-progress-fill" style={{ width: `${(completedCount / Math.max(disciplines.length, 1)) * 100}%` }} />
          </div>
          <span className="stat-label">{Math.round((completedCount / Math.max(disciplines.length, 1)) * 100)}% complété</span>
        </div>
      </div>

      <div className="points-legend">
        <span className="legend-title">Barème :</span>
        {MEDALS.map((m) => (
          <span key={m.key} className="legend-item" style={{ '--medal-color': m.color }}>
            {m.icon} {m.label} = <strong>{m.points} pts</strong>
          </span>
        ))}
        <span className="legend-note">• Plusieurs médailles pour un même pays → points de la plus haute marche uniquement</span>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>
          🥇 Résultats ({completedCount}/{disciplines.length})
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          👥 Joueurs ({users.length})
        </button>
      </div>

      {tab === 'results' && (
        <div className="admin-results">
          <input className="search-input" type="text" placeholder="🔍 Rechercher une discipline..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="results-grid">
            {filteredDisciplines.map((disc) => {
              const r = results[disc.id];
              const podium = { gold: r?.gold_country_id || null, silver: r?.silver_country_id || null, bronze: r?.bronze_country_id || null };
              const isSaving = saving === disc.id;

              return (
                <div key={disc.id} className={`result-card ${r ? 'has-result' : ''} ${editing?.discId === disc.id ? 'editing' : ''}`}>
                  <div className="result-card-header">
                    <div className="disc-info">
                      {disc.pictogram_url && <img src={disc.pictogram_url} alt={disc.name} className="disc-picto-sm" />}
                      <span className="disc-name-sm">{disc.name}</span>
                    </div>
                    {isSaving && <span className="saving-indicator">⏳</span>}
                  </div>

                  <div className="podium-slots">
                    {MEDALS.map((medal) => {
                      const countryId = podium[medal.key];
                      const country = countryId ? getCountry(countryId) : null;
                      const isOpenSlot = editing?.discId === disc.id && editing?.medalKey === medal.key;

                      return (
                        <div key={medal.key} className={`podium-slot ${countryId ? 'filled' : ''}`}>
                          <div className="slot-label" style={{ color: medal.color }}>
                            {medal.icon} {medal.label}
                            <span className="slot-pts">+{medal.points}pts</span>
                          </div>

                          {countryId ? (
                            <div className="slot-country">
                              {country?.flag_url && <img src={country.flag_url} alt={country.name} className="slot-flag" />}
                              <span className="slot-name">{country?.name || countryId}</span>
                              <button className="slot-clear" onClick={() => clearMedal(disc.id, medal.key)} disabled={isSaving}>×</button>
                            </div>
                          ) : (
                            <button className="slot-empty"
                              onClick={() => { setEditing(isOpenSlot ? null : { discId: disc.id, medalKey: medal.key }); setCountrySearch(''); }}
                              disabled={isSaving}>
                              + Choisir
                            </button>
                          )}

                          {isOpenSlot && (
                            <div className="slot-picker">
                              <input className="country-search" type="text" placeholder="Filtrer..."
                                value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} autoFocus />
                              <div className="picker-grid">
                                {filteredCountries.map((c) => (
                                  <button key={c.id} className={`pick-country-btn ${podium[medal.key] === c.id ? 'selected' : ''}`}
                                    onClick={() => handlePickMedal(disc.id, medal.key, c.id)} disabled={isSaving}>
                                    {c.flag_url ? <img src={c.flag_url} alt={c.name} className="flag-sm" /> : <span>🏳</span>}
                                    <span>{c.name || c.id}</span>
                                  </button>
                                ))}
                              </div>
                              <button className="btn-edit" style={{ marginTop: 8, width: '100%' }} onClick={() => setEditing(null)}>Fermer</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-users">
          <div className="users-table">
            <div className="users-header">
              <span>Utilisateur</span><span>Inscription</span><span>Rôle</span><span>Actions</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className={`user-row ${u.is_admin ? 'is-admin' : ''}`}>
                <span className="user-name">{u.username}{u.is_admin && <span className="admin-badge">ADMIN</span>}</span>
                <span className="user-date">{new Date(u.created_at).toLocaleDateString('fr-CA')}</span>
                <span className="user-role">{u.is_admin ? '🔑 Admin' : '👤 Joueur'}</span>
                <button className={`btn-toggle-admin ${u.is_admin ? 'revoke' : 'grant'}`} onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                  {u.is_admin ? 'Révoquer admin' : 'Promouvoir admin'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
