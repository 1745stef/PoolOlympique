import { useState, useEffect } from 'react';
import { adminApi, groupsApi, olympicApi } from '../lib/api';
import { useLang } from '../hooks/useLanguage';
import { getCountryNameLang } from '../data/i18n';
import { LA28_DISCIPLINES } from '../data/disciplines';

const MEDALS_BASE = [
  { key: 'gold',   points: 5, color: '#d4a017' },
  { key: 'silver', points: 3, color: '#b8c0cc' },
  { key: 'bronze', points: 1, color: '#cd7f32' },
];

export default function AdminPage({ onSettingsChange }) {
  const { t, lang } = useLang();

  const MEDALS = [
    { ...MEDALS_BASE[0], label: t('gold'),   icon: '🥇' },
    { ...MEDALS_BASE[1], label: t('silver'), icon: '🥈' },
    { ...MEDALS_BASE[2], label: t('bronze'), icon: '🥉' },
  ];

  const myLevel = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 99;
      // base64url → base64 standard
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.role_level ?? (payload.is_admin ? 2 : 99);
    } catch { return 99; }
  })();

  const isSuperAdmin = myLevel <= 1;
  const isAdmin      = myLevel <= 2;
  const isCaptain    = myLevel <= 3;

  const [tab, setTab]               = useState(myLevel <= 2 ? 'results' : 'groups');
  const [disciplines, setDisciplines] = useState([]);
  const [countries, setCountries]   = useState([]);
  const [results, setResults]       = useState({});
  const [users, setUsers]           = useState([]);
  const [groups, setGroups]         = useState([]);
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [saving, setSaving]         = useState(null);
  const [notification, setNotification] = useState(null);
  const [editing, setEditing]       = useState(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [fetchingResults, setFetchingResults] = useState(false);
  const [tempPwdUser, setTempPwdUser] = useState(null);
  const [tempPwd, setTempPwd]       = useState('');
  const [generatedPwd, setGeneratedPwd] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [settings, setSettings]     = useState({ inactivity_enabled: true, inactivity_timeout: 30, inactivity_warning: 2 });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Rôle de l'utilisateur courant depuis le JWT (injecté via useAuth → App)

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    setDisciplines(LA28_DISCIPLINES);

    // Appels selon le niveau
    // Tous les niveaux ont besoin de users (pour ajouter des membres aux groupes)
    const backendCalls = [groupsApi.getAll(), adminApi.getUsers()];
    if (isAdmin) backendCalls.push(adminApi.getResults(), adminApi.getRoles());
    if (isSuperAdmin) backendCalls.push(adminApi.getSettings());

    Promise.all(backendCalls)
      .then((results_arr) => {
        let idx = 0;
        const grps = results_arr[idx++];
        const usrs = results_arr[idx++];
        setGroups(grps);
        setUsers(usrs);
        if (isAdmin) {
          const res = results_arr[idx++];
          const rls = results_arr[idx++];
          const map = {};
          res.forEach(r => { map[r.discipline_id] = r; });
          setResults(map);
          setRoles(rls);
        }
        if (isSuperAdmin) {
          const s = results_arr[idx++];
          if (s) setSettings(s);
        }
      })
      .catch(e => console.error('Erreur chargement admin:', e))
      .finally(() => setLoading(false));

    olympicApi.getCountries()
      .then(ctries => setCountries(ctries))
      .catch(() => {});
  }, []);

  // ── Podiums ─────────────────────────────────────────────────────────────────
  const savePodium = async (disciplineId, podium) => {
    setSaving(disciplineId);
    try {
      await adminApi.upsertResult(disciplineId, podium.gold || null, podium.silver || null, podium.bronze || null);
      setResults(prev => ({ ...prev, [disciplineId]: { discipline_id: disciplineId, gold_country_id: podium.gold || null, silver_country_id: podium.silver || null, bronze_country_id: podium.bronze || null } }));
      notify(t('adminPodiumSaved'));
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(null); }
  };

  const handlePickMedal = async (disciplineId, medalKey, countryId) => {
    const current = results[disciplineId] || {};
    const podium = { gold: current.gold_country_id || null, silver: current.silver_country_id || null, bronze: current.bronze_country_id || null };
    podium[medalKey] = podium[medalKey] === countryId ? null : countryId;
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try { await adminApi.deleteResult(disciplineId); setResults(prev => { const n = { ...prev }; delete n[disciplineId]; return n; }); notify(t('adminResultErased'), 'info'); }
      catch (e) { notify(e.message, 'error'); } finally { setSaving(null); }
    } else { await savePodium(disciplineId, podium); }
    setEditing(null);
  };

  const clearMedal = async (disciplineId, medalKey) => {
    const current = results[disciplineId] || {};
    const podium = { gold: current.gold_country_id || null, silver: current.silver_country_id || null, bronze: current.bronze_country_id || null };
    podium[medalKey] = null;
    if (!podium.gold && !podium.silver && !podium.bronze) {
      setSaving(disciplineId);
      try { await adminApi.deleteResult(disciplineId); setResults(prev => { const n = { ...prev }; delete n[disciplineId]; return n; }); notify(t('adminResultErased'), 'info'); }
      catch (e) { notify(e.message, 'error'); } finally { setSaving(null); }
      return;
    }
    await savePodium(disciplineId, podium);
  };

  const handleFetchResults = async () => {
    setFetchingResults(true);
    try {
      const data = await adminApi.fetchResults();
      notify(t('adminImported', { count: data.imported }));
      const fresh = await adminApi.getResults();
      const map = {};
      fresh.forEach(r => { map[r.discipline_id] = r; });
      setResults(map);
    } catch (e) { notify(e.message, 'error'); }
    finally { setFetchingResults(false); }
  };

  // ── Rôles ────────────────────────────────────────────────────────────────────
  const handleSetRole = async (userId, roleId) => {
    try {
      const updated = await adminApi.setUserRole(userId, roleId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: updated.role_id, roles: updated.roles } : u));
      notify(t('adminRoleUpdated'));
    } catch (e) { notify(e.message, 'error'); }
  };

  // Rôles attribuables par l'utilisateur courant (seulement les niveaux > myLevel)
  const assignableRoles = roles.filter(r => r.level > myLevel);
  // Rôle "joueur" (sans rôle) — toujours assignable
  const playerOption = { id: null, name: t('adminRolePlayer'), level: 99 };

  // ── Users ────────────────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(t('adminDeleteUserConfirm', { username }))) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      notify(t('adminDeletedUser', { username }), 'info');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleSetTempPassword = async () => {
    if (!tempPwd || tempPwd.length < 4) return notify(t('adminTempPwdMinChars'), 'error');
    try {
      await adminApi.setTempPassword(tempPwdUser.id, tempPwd);
      setGeneratedPwd(tempPwd);
      setUsers(prev => prev.map(u => u.id === tempPwdUser.id ? { ...u, must_change_password: true } : u));
    } catch (e) { notify(e.message, 'error'); }
  };

  // ── Groups ───────────────────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const g = await groupsApi.create(newGroupName.trim());
      setGroups(prev => [...prev, { ...g, group_members: [] }]);
      setNewGroupName('');
      notify(t('adminGroupCreated'));
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await groupsApi.delete(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      notify(t('adminGroupDeleted'), 'info');
    } catch (e) { notify(e.message, 'error'); }
  };

  const handleAddMember = async (groupId, userId) => {
    try {
      await groupsApi.addMember(groupId, userId);
      const user = users.find(u => u.id === userId);
      setGroups(prev => prev.map(g => g.id === groupId
        ? { ...g, group_members: [...(g.group_members || []), { user_id: userId, users: { username: user?.username } }] }
        : g));
      notify(t('adminMemberAdded'));
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

  // ── Settings ─────────────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      if (onSettingsChange) onSettingsChange(updated);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e) { notify(e.message, 'error'); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getCountry = id => countries.find(c => c.id === id);
  const getCountryLang = id => { const c = countries.find(x => x.id === id); return getCountryNameLang(id, c?.name, lang); };
  const getRoleName = (user) => {
    if (user.roles?.name) return t(`role_${user.roles.name}`) || user.roles.name;
    return t('adminRolePlayer');
  };
  const getRoleBadgeClass = (level) => {
    if (level === 1) return 'role-badge superadmin';
    if (level === 2) return 'role-badge admin';
    if (level === 3) return 'role-badge captain';
    return 'role-badge player';
  };
  const canManageUser = (targetUser) => {
    const targetLevel = targetUser.roles?.level ?? 99;
    return targetLevel > myLevel && targetUser.id !== undefined;
  };

  const completedCount = Object.keys(results).length;
  const filteredDisciplines = disciplines.filter(d => {
    const name = lang.startsWith('fr') ? d.nameFR : (d.nameEN || d.nameFR);
    return name.toLowerCase().includes(search.toLowerCase()) || d.sport.toLowerCase().includes(search.toLowerCase());
  });
  const filteredCountries = countries.filter(c => getCountryNameLang(c.id, c.name, lang).toLowerCase().includes(countrySearch.toLowerCase()));

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>{t('adminLoading')}</p></div>;

  return (
    <div className="admin-page">
      {notification && <div className={`notification notification-${notification.type}`}>{notification.msg}</div>}

      {/* Mot de passe temporaire */}
      {tempPwdUser && (
        <div className="modal-overlay" onClick={() => { setTempPwdUser(null); setTempPwd(''); setGeneratedPwd(null); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{t('adminTempPwdTitle')}</h3>
            <p>{t('adminTempPwdFor')} <strong>{tempPwdUser.username}</strong></p>
            {generatedPwd ? (
              <>
                <div className="temp-pwd-display">{generatedPwd}</div>
                <p className="temp-pwd-note">{t('adminTempPwdNote')}</p>
                <button className="btn-primary" onClick={() => { setTempPwdUser(null); setTempPwd(''); setGeneratedPwd(null); }}>{t('close')}</button>
              </>
            ) : (
              <>
                <div className="field">
                  <label>{t('adminTempPwdLabel')}</label>
                  <input type="text" value={tempPwd} onChange={e => setTempPwd(e.target.value)} placeholder={t('adminTempPwdPlaceholder')} autoFocus />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" onClick={handleSetTempPassword}>{t('save')}</button>
                  <button className="btn-edit" onClick={() => { setTempPwdUser(null); setTempPwd(''); }}>{t('cancel')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barre d'onglets */}
      <div className="admin-tabs">
        {isAdmin   && <button className={tab === 'results'  ? 'active' : ''} onClick={() => setTab('results')}>{t('adminTabResults', { done: completedCount, total: disciplines.length })}</button>}
        {isAdmin   && <button className={tab === 'users'    ? 'active' : ''} onClick={() => setTab('users')}>{t('adminTabUsers', { count: users.length })}</button>}
        {isCaptain && <button className={tab === 'groups'   ? 'active' : ''} onClick={() => setTab('groups')}>{t('adminTabGroups', { count: groups.length })}</button>}
        {isSuperAdmin && <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>{t('adminTabSettings')}</button>}
      </div>

      {/* ── Onglet Résultats ── */}
      {tab === 'results' && (
        <div className="admin-results">
          <div className="admin-stats">
            <div className="stat-card"><span className="stat-value gold">{completedCount}</span><span className="stat-label">{t('adminPodiumsEntered')}</span></div>
            <div className="stat-card"><span className="stat-value">{disciplines.length - completedCount}</span><span className="stat-label">{t('adminRemaining')}</span></div>
            <div className="stat-card"><span className="stat-value">{users.length}</span><span className="stat-label">{t('adminParticipants')}</span></div>
            <div className="stat-card">
              <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: `${(completedCount / Math.max(disciplines.length, 1)) * 100}%` }} /></div>
              <span className="stat-label">{Math.round((completedCount / Math.max(disciplines.length, 1)) * 100)}{t('adminCompleted')}</span>
            </div>
          </div>
          <div className="points-legend">
            <span className="legend-title">{t('adminScale')}</span>
            {MEDALS.map(m => <span key={m.key} className="legend-item" style={{ '--medal-color': m.color }}>{m.icon} {m.label} = <strong>{m.points} pts</strong></span>)}
            <span className="legend-note">{t('adminScaleNote')}</span>
          </div>
          <div className="results-toolbar">
            <input className="search-input" style={{ flex: 1 }} type="text" placeholder={t('adminSearchDiscipline')} value={search} onChange={e => setSearch(e.target.value)} />
            <button className={`btn-fetch ${fetchingResults ? 'loading' : ''}`} onClick={handleFetchResults} disabled={fetchingResults}>
              {fetchingResults ? t('adminImporting') : t('adminImportBtn')}
            </button>
          </div>
          <div className="results-grid">
            {filteredDisciplines.map(disc => {
              const r = results[disc.id];
              const podium = { gold: r?.gold_country_id || null, silver: r?.silver_country_id || null, bronze: r?.bronze_country_id || null };
              const isSaving = saving === disc.id;
              const discName = lang.startsWith('fr') ? disc.nameFR : (disc.nameEN || disc.nameFR);
              return (
                <div key={disc.id} className={`result-card ${r ? 'has-result' : ''} ${editing?.discId === disc.id ? 'editing' : ''}`}>
                  <div className="result-card-header">
                    <div className="disc-info">
                      {disc.pictogram_url && <img src={disc.pictogram_url} alt={disc.name} className="disc-picto-sm" />}
                      <span className="disc-name-sm">{discName}</span>
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
                              <span className="slot-name">{getCountryLang(countryId)}</span>
                              <button className="slot-clear" onClick={() => clearMedal(disc.id, medal.key)} disabled={isSaving}>×</button>
                            </div>
                          ) : (
                            <button className="slot-empty" onClick={() => { setEditing(isOpenSlot ? null : { discId: disc.id, medalKey: medal.key }); setCountrySearch(''); }} disabled={isSaving}>{t('adminChoose')}</button>
                          )}
                          {isOpenSlot && (
                            <div className="slot-picker">
                              <input className="country-search" type="text" placeholder={t('adminFilter')} value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                              <div className="picker-grid">
                                {filteredCountries.map(c => (
                                  <button key={c.id} className={`pick-country-btn ${podium[medal.key] === c.id ? 'selected' : ''}`} onClick={() => handlePickMedal(disc.id, medal.key, c.id)} disabled={isSaving}>
                                    {c.flag_url ? <img src={c.flag_url} alt={c.name} className="flag-sm" /> : <span>🏳</span>}
                                    <span>{getCountryNameLang(c.id, c.name, lang)}</span>
                                  </button>
                                ))}
                              </div>
                              <button className="btn-edit" style={{ marginTop: 8, width: '100%' }} onClick={() => setEditing(null)}>{t('close')}</button>
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

      {/* ── Onglet Joueurs ── */}
      {tab === 'users' && (
        <div className="admin-users">
          <div className="users-table">
            <div className="users-header">
              <span>{t('adminUsersHeader')}</span>
              <span>{t('adminUsersRegistered')}</span>
              <span>{t('adminUsersRole')}</span>
              <span>{t('adminUsersActions')}</span>
            </div>
            {users.map(u => {
              const targetLevel = u.roles?.level ?? 99;
              const canManage = canManageUser(u);
              return (
                <div key={u.id} className={`user-row role-level-${targetLevel}`}>
                  <span className="user-name">
                    {u.username}
                    {targetLevel <= 3 && <span className={getRoleBadgeClass(targetLevel)}>{getRoleName(u)}</span>}
                    {u.must_change_password && <span className="temp-badge">{t('adminTempBadge')}</span>}
                  </span>
                  <span className="user-date">{new Date(u.created_at).toLocaleDateString(lang)}</span>
                  <span className="user-role">{getRoleName(u)}</span>
                  <div className="user-actions">
                    {canManage && (
                      <>
                        <button className="btn-temp-pwd" onClick={() => { setTempPwdUser(u); setTempPwd(''); setGeneratedPwd(null); }} title={t('adminTempPwdTitle')}>🔑</button>
                        <select
                          className="role-select"
                          value={u.role_id || ''}
                          onChange={e => handleSetRole(u.id, e.target.value || null)}
                          title={t('adminUsersRole')}
                        >
                          <option value="">{t('adminRolePlayer')}</option>
                          {assignableRoles.map(r => (
                            <option key={r.id} value={r.id}>{t(`role_${r.name}`) || r.name}</option>
                          ))}
                        </select>
                        <button className="btn-delete-user" onClick={() => handleDeleteUser(u.id, u.username)} title="Supprimer">🗑</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Onglet Groupes ── */}
      {tab === 'groups' && (
        <div className="admin-groups">
          <div className="create-group-row">
            <input className="search-input" style={{ flex: 1 }} type="text" placeholder={t('adminNewGroupPlaceholder')}
              value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} />
            <button className="btn-create-group" onClick={handleCreateGroup}>{t('adminCreateGroup')}</button>
          </div>
          <div className="groups-list">
            {groups.length === 0 && <div className="empty-state"><p>{t('adminNoGroups')}</p></div>}
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
                        <option value="">{t('adminAddMember')}</option>
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

      {/* ── Onglet Paramètres (superadmin seulement) ── */}
      {tab === 'settings' && isSuperAdmin && (
        <div className="admin-settings">
          <div className="settings-card">
            <h3 className="settings-title">⏱️ {t('settingsInactivityTitle')}</h3>
            <p className="settings-desc">{t('settingsInactivityDesc')}</p>
            <div className="settings-row">
              <label className="settings-label">{t('settingsEnabled')}</label>
              <button className={`toggle-btn ${settings.inactivity_enabled ? 'on' : 'off'}`}
                onClick={() => setSettings(s => ({ ...s, inactivity_enabled: !s.inactivity_enabled }))}>
                {settings.inactivity_enabled ? t('settingsOn') : t('settingsOff')}
              </button>
            </div>
            <div className={`settings-fields ${!settings.inactivity_enabled ? 'disabled' : ''}`}>
              <div className="settings-row">
                <label className="settings-label">{t('settingsTimeout')}</label>
                <div className="settings-input-group">
                  <input type="number" min="1" className="settings-input" value={settings.inactivity_timeout}
                    disabled={!settings.inactivity_enabled}
                    onChange={e => setSettings(s => ({ ...s, inactivity_timeout: parseInt(e.target.value) || 1 }))} />
                  <span className="settings-unit">{t('settingsMinutes')}</span>
                </div>
              </div>
              <div className="settings-row">
                <label className="settings-label">{t('settingsWarning')}</label>
                <div className="settings-input-group">
                  <input type="number" min="1" className="settings-input" value={settings.inactivity_warning}
                    disabled={!settings.inactivity_enabled}
                    onChange={e => setSettings(s => ({ ...s, inactivity_warning: parseInt(e.target.value) || 1 }))} />
                  <span className="settings-unit">{t('settingsMinutes')}</span>
                </div>
              </div>
            </div>
            <div className="settings-footer">
              {settingsSaved && <span className="settings-saved">✓ {t('settingsSaved')}</span>}
              <button className="btn-primary" onClick={handleSaveSettings}>{t('settingsSave')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
