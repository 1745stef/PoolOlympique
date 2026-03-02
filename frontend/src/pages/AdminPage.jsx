import { useState, useEffect } from 'react';
import { adminApi, groupsApi, olympicApi } from '../lib/api';
import { getCountryName } from '../data/translations';
import { LA28_DISCIPLINES } from '../data/disciplines';

const MEDALS = [
  { key: 'gold',   label: 'Or',     icon: '🥇', points: 5, color: '#d4a017' },
  { key: 'silver', label: 'Argent', icon: '🥈', points: 3, color: '#b8c0cc' },
  { key: 'bronze', label: 'Bronze', icon: '🥉', points: 1, color: '#cd7f32' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('results');
  const [disciplines, setDisciplines] = useState([]);
  const [countries, setCountries]     = useState([]);
  const [results, setResults]         = useState({});
  const [users, setUsers]             = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [saving, setSaving]           = useState(null);
  const [notification, setNotification] = useState(null);
  const [editing, setEditing]         = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [fetchingResults, setFetchingResults] = useState(false);
  // Temp password modal
  const [tempPwdUser, setTempPwdUser] = useState(null);
  const [tempPwd, setTempPwd]         = useState('');
  const [generatedPwd, setGeneratedPwd] = useState(null);
  // Groups
  const [newGroupName, setNewGroupName] = useState('');

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    Promise.all([olympicApi.getCountries(), adminApi.getResults(), adminApi.getUsers(), groupsApi.getAll()])
      .then(([ctries, res, usrs, grps]) => {
        setDisciplines(LA28_DISCIPLINES);
        setCountries(ctries);
        const map = {};
        res.forEach(r => { map[r.discipline_id] = r; });
        setResults(map);
        setUsers(usrs);
        setGroups(grps);
      }).finally(() => setLoading(false));
  }, []);

  const savePodium = async (disciplineId, podium) => {
    setSaving(disciplineId);
    try {
      await adminApi.upsertResult(disciplineId, podium.gold || null, podium.silver || null, podium.bronze || null);
      setResults(prev => ({
        ...prev,
        [disciplineId]: { discipline_id: disciplineId, gold_country_id: podium.gold || null, silver_country_id: podium.silver || null, bronze_country_id: podium.bronze || null },
      }));
      notify('✓ Podium enregistré !');
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(null); }
  };

  const handlePickMedal = async (disciplineId, medalKey, countryId) => {
    const current = results[disciplineId] || {};
    const podium = { gold: current.gold_country_id || null, silver: current.silver_country_id || null, bronze: current.bronze_country_id || null };
    // Toggle : cliquer sur le même pays/médaille l'efface
    if (podium[medalKey] === countryId) { podium[medalKey] = null; }
    else {
      // Un pays peut apparaître sur plusieurs marches du podium (points additifs)
      // On ne retire plus automatiquement le pays des autres médailles
      podium[medalKey] = countryId;
    }
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try { await adminApi.deleteResult(disciplineId); setResults(prev => { const n = { ...prev }; delete n[disciplineId]; return n; }); notify('Résultat effacé', 'info'); }
      catch (e) { notify(e.message, 'error'); } finally { setSaving(null); }
    } else {
      await savePodium(disciplineId, podium);
    }
    setEditing(null);
  };

  const clearMedal = async (disciplineId, medalKey) => {
    const current = results[disciplineId] || {};
    const podium = { gold: current.gold_country_id || null, silver: current.silver_country_id || null, bronze: current.bronze_country_id || null };
    podium[medalKey] = null;
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try { await adminApi.deleteResult(disciplineId); setResults(prev => { const n = { ...prev }; delete n[disciplineId]; return n; }); notify('Résultat effacé', 'info'); }
      catch (e) { notify(e.message, 'error'); } finally { setSaving(null); }
      return;
    }
    await savePodium(disciplineId, podium);
  };

  const handleFetchResults = async () => {
    setFetchingResults(true);
    try {
      const data = await adminApi.fetchResults();
      notify(`✓ ${data.imported} résultats importés depuis l'API !`);
      const fresh = await adminApi.getResults();
      const map = {};
      fresh.forEach(r => { map[r.discipline_id] = r; });
      setResults(map);
    } catch (e) { notify(e.message, 'error'); }
    finally { setFetchingResults(false); }
  };

  const handleToggleAdmin = async (userId, currentVal) => {
    try {
      const updated = await adminApi.toggleAdmin(userId, !currentVal);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: updated.is_admin } : u));
      notify('Rôle mis à jour');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Supprimer ${username} ? Tous ses pronostics seront effacés.`)) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      notify(`${username} supprimé`, 'info');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleSetTempPassword = async () => {
    if (!tempPwd || tempPwd.length < 4) return notify('Minimum 4 caractères', 'error');
    try {
      await adminApi.setTempPassword(tempPwdUser.id, tempPwd);
      setGeneratedPwd(tempPwd);
      setUsers(prev => prev.map(u => u.id === tempPwdUser.id ? { ...u, must_change_password: true } : u));
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const g = await groupsApi.create(newGroupName.trim());
      setGroups(prev => [...prev, { ...g, group_members: [] }]);
      setNewGroupName('');
      notify('✓ Groupe créé !');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await groupsApi.delete(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      notify('Groupe supprimé', 'info');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleAddMember = async (groupId, userId) => {
    try {
      await groupsApi.addMember(groupId, userId);
      const user = users.find(u => u.id === userId);
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, group_members: [...(g.group_members || []), { user_id: userId, users: { username: user?.username } }] }
        : g));
      notify('Membre ajouté !');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleRemoveMember = async (groupId, userId) => {
    try {
      await groupsApi.removeMember(groupId, userId);
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, group_members: (g.group_members || []).filter(m => m.user_id !== userId) }
        : g));
    } catch (e) { notify(e.message, 'error'); }
  };

  const getCountry = id => countries.find(c => c.id === id);
  const getCountryFR = id => { const c = countries.find(x => x.id === id); return getCountryName(id, c?.name); };
  const completedCount = Object.keys(results).length;
  const filteredDisciplines = disciplines.filter(d => d.nameFR.toLowerCase().includes(search.toLowerCase()) || d.sport.toLowerCase().includes(search.toLowerCase()));
  const filteredCountries = countries.filter(c => (c.name || c.id).toLowerCase().includes(countrySearch.toLowerCase()));

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Chargement...</p></div>;

  return (
    <div className="admin-page">
      {notification && <div className={`notification notification-${notification.type}`}>{notification.msg}</div>}

      {/* Temp password modal */}
      {tempPwdUser && (
        <div className="modal-overlay" onClick={() => { setTempPwdUser(null); setTempPwd(''); setGeneratedPwd(null); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Mot de passe temporaire</h3>
            <p>Pour : <strong>{tempPwdUser.username}</strong></p>
            {generatedPwd ? (
              <>
                <div className="temp-pwd-display">{generatedPwd}</div>
                <p className="temp-pwd-note">L'utilisateur devra changer ce mot de passe à sa prochaine connexion.</p>
                <button className="btn-primary" onClick={() => { setTempPwdUser(null); setTempPwd(''); setGeneratedPwd(null); }}>Fermer</button>
              </>
            ) : (
              <>
                <div className="field">
                  <label>Mot de passe temporaire</label>
                  <input type="text" value={tempPwd} onChange={e => setTempPwd(e.target.value)} placeholder="Min. 4 caractères" autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" onClick={handleSetTempPassword}>Enregistrer</button>
                  <button className="btn-edit" onClick={() => { setTempPwdUser(null); setTempPwd(''); }}>Annuler</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card"><span className="stat-value gold">{completedCount}</span><span className="stat-label">Podiums saisis</span></div>
        <div className="stat-card"><span className="stat-value">{disciplines.length - completedCount}</span><span className="stat-label">Restantes</span></div>
        <div className="stat-card"><span className="stat-value">{users.length}</span><span className="stat-label">Participants</span></div>
        <div className="stat-card">
          <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: `${(completedCount / Math.max(disciplines.length, 1)) * 100}%` }} /></div>
          <span className="stat-label">{Math.round((completedCount / Math.max(disciplines.length, 1)) * 100)}% complété</span>
        </div>
      </div>

      <div className="points-legend">
        <span className="legend-title">Barème :</span>
        {MEDALS.map(m => <span key={m.key} className="legend-item" style={{ '--medal-color': m.color }}>{m.icon} {m.label} = <strong>{m.points} pts</strong></span>)}
        <span className="legend-note">• Plusieurs médailles pour un même pays → points de la plus haute uniquement</span>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>🥇 Résultats ({completedCount}/{disciplines.length})</button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>👥 Joueurs ({users.length})</button>
        <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>🏟 Groupes ({groups.length})</button>
      </div>

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        <div className="admin-results">
          <div className="results-toolbar">
            <input className="search-input" style={{ flex: 1 }} type="text" placeholder="🔍 Rechercher une discipline..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className={`btn-fetch ${fetchingResults ? 'loading' : ''}`} onClick={handleFetchResults} disabled={fetchingResults}>
              {fetchingResults ? '⏳ Importation...' : '🔄 Importer résultats (API)'}
            </button>
          </div>

          <div className="results-grid">
            {filteredDisciplines.map(disc => {
              const r = results[disc.id];
              const podium = { gold: r?.gold_country_id || null, silver: r?.silver_country_id || null, bronze: r?.bronze_country_id || null };
              const isSaving = saving === disc.id;
              return (
                <div key={disc.id} className={`result-card ${r ? 'has-result' : ''} ${editing?.discId === disc.id ? 'editing' : ''}`}>
                  <div className="result-card-header">
                    <div className="disc-info">
                      {disc.pictogram_url && <img src={disc.pictogram_url} alt={disc.name} className="disc-picto-sm" />}
                      <span className="disc-name-sm">{disc.nameFR}</span>
                    </div>
                    {isSaving && <span className="saving-indicator">⏳</span>}
                  </div>
                  <div className="podium-slots">
                    {MEDALS.map(medal => {
                      const countryId = podium[medal.key];
                      const country = countryId ? getCountry(countryId) : null;
                      const isOpenSlot = editing?.discId === disc.id && editing?.medalKey === medal.key;
                      return (
                        <div key={medal.key} className={`podium-slot ${countryId ? 'filled' : ''}`}>
                          <div className="slot-label" style={{ color: medal.color }}>{medal.icon} {medal.label}<span className="slot-pts">+{medal.points}pts</span></div>
                          {countryId ? (
                            <div className="slot-country">
                              {country?.flag_url && <img src={country.flag_url} alt={country.name} className="slot-flag" />}
                              <span className="slot-name">{getCountryFR(countryId)}</span>
                              <button className="slot-clear" onClick={() => clearMedal(disc.id, medal.key)} disabled={isSaving}>×</button>
                            </div>
                          ) : (
                            <button className="slot-empty" onClick={() => { setEditing(isOpenSlot ? null : { discId: disc.id, medalKey: medal.key }); setCountrySearch(''); }} disabled={isSaving}>+ Choisir</button>
                          )}
                          {isOpenSlot && (
                            <div className="slot-picker">
                              <input className="country-search" type="text" placeholder="Filtrer..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                              <div className="picker-grid">
                                {filteredCountries.map(c => (
                                  <button key={c.id} className={`pick-country-btn ${podium[medal.key] === c.id ? 'selected' : ''}`} onClick={() => handlePickMedal(disc.id, medal.key, c.id)} disabled={isSaving}>
                                    {c.flag_url ? <img src={c.flag_url} alt={c.name} className="flag-sm" /> : <span>🏳</span>}
                                    <span>{getCountryName(c.id, c.name)}</span>
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

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div className="admin-users">
          <div className="users-table">
            <div className="users-header"><span>Utilisateur</span><span>Inscription</span><span>Rôle</span><span>Actions</span></div>
            {users.map(u => (
              <div key={u.id} className={`user-row ${u.is_admin ? 'is-admin' : ''}`}>
                <span className="user-name">
                  {u.username}
                  {u.is_admin && <span className="admin-badge">ADMIN</span>}
                  {u.must_change_password && <span className="temp-badge">MOT DE PASSE TEMP</span>}
                </span>
                <span className="user-date">{new Date(u.created_at).toLocaleDateString('fr-CA')}</span>
                <span className="user-role">{u.is_admin ? '🔑 Admin' : '👤 Joueur'}</span>
                <div className="user-actions">
                  <button className="btn-temp-pwd" onClick={() => { setTempPwdUser(u); setTempPwd(''); setGeneratedPwd(null); }} title="Mot de passe temporaire">🔑</button>
                  <button className={`btn-toggle-admin ${u.is_admin ? 'revoke' : 'grant'}`} onClick={() => handleToggleAdmin(u.id, u.is_admin)}>
                    {u.is_admin ? 'Révoquer' : 'Promouvoir'}
                  </button>
                  <button className="btn-delete-user" onClick={() => handleDeleteUser(u.id, u.username)} title="Supprimer">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Groups Tab ── */}
      {tab === 'groups' && (
        <div className="admin-groups">
          <div className="create-group-row">
            <input className="search-input" style={{ flex: 1 }} type="text" placeholder="Nom du nouveau groupe..."
              value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} />
            <button className="btn-create-group" onClick={handleCreateGroup}>+ Créer</button>
          </div>

          <div className="groups-list">
            {groups.length === 0 && <div className="empty-state"><p>Aucun groupe créé.</p></div>}
            {groups.map(group => {
              const memberIds = new Set((group.group_members || []).map(m => m.user_id));
              const nonMembers = users.filter(u => !memberIds.has(u.id));
              return (
                <div key={group.id} className="group-card">
                  <div className="group-header">
                    <h3 className="group-name">👥 {group.name}</h3>
                    <button className="btn-delete" onClick={() => handleDeleteGroup(group.id)} title="Supprimer le groupe">🗑</button>
                  </div>
                  <div className="group-members-list">
                    {(group.group_members || []).map(m => (
                      <div key={m.user_id} className="group-member">
                        <span>{m.users?.username || m.user_id}</span>
                        <button className="slot-clear" onClick={() => handleRemoveMember(group.id, m.user_id)}>×</button>
                      </div>
                    ))}
                  </div>
                  {nonMembers.length > 0 && (
                    <div className="group-add-member">
                      <select className="member-select" defaultValue="" onChange={e => { if (e.target.value) { handleAddMember(group.id, e.target.value); e.target.value = ''; } }}>
                        <option value="">+ Ajouter un membre...</option>
                        {nonMembers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
