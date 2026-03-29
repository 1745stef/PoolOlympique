import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { familyApi } from '../lib/api';

const PRESET_COLORS = [
  '#FF6B6B','#FF9F43','#FECA57','#48DBFB','#1DD1A1',
  '#54A0FF','#C44BE8','#FF6BA8','#A29BFE','#FD79A8',
];
const PRESET_EMOJIS = [
  // Personnes
  '👦','👧','👨','👩','👴','👵','🧒','🧑','👶','🧔','👱','👱‍♀️',
  '🧙','🧙‍♀️','🦸','🦸‍♀️','🦹','🦹‍♀️','🧚','🧚‍♀️','🧜','🧜‍♀️',
  '👸','🤴','🎅','🤶','🧑‍🚀','🧑‍🍳','🧑‍🎨','🧑‍🏫','🧑‍⚕️',
  // Animaux
  '🐱','🐶','🐰','🐻','🐼','🐨','🐯','🦁','🐸','🐧','🦊','🐺',
  '🦄','🦖','🐲','🦋','🐬','🦒','🦓','🐙','🦈','🐿️','🦔','🐝',
  // Objets / symboles
  '⭐','🌟','💫','🌈','❤️','💙','💚','💛','🍀','🎮','🎵','🏆',
  '🚀','⚽','🎨','📚','🍕','🎂','🌸','🌺',
];
const DEFAULT_FORM = { name: '', color: '#FF6B6B', emoji: '', is_child: false, birthdate: '' };

export default function MembersSection() {
  const { user } = useAuth();
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    familyApi.getMembers()
      .then(data => setMembers(data))
      .catch(() => setError('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => { setForm(DEFAULT_FORM); setEditing(null); setShowForm(true); };
  const openEdit = (m) => {
    setForm({ name: m.name, color: m.color, emoji: m.emoji || '', is_child: m.is_child, birthdate: m.birthdate || '' });
    setEditing(m.id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setError(null); };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Le nom est requis');
    setSaving(true); setError(null);
    try {
      if (editing) {
        const updated = await familyApi.updateMember(editing, form);
        setMembers(prev => prev.map(m => m.id === editing ? updated : m));
      } else {
        const created = await familyApi.createMember({ ...form, sort_order: members.length });
        setMembers(prev => [...prev, created]);
      }
      closeForm();
    } catch (e) { setError(e.message || 'Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    try {
      await familyApi.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (e) { setError(e.message); }
  };

  const handleToggleActive = async (m) => {
    const updated = await familyApi.updateMember(m.id, { is_active: !m.is_active });
    setMembers(prev => prev.map(x => x.id === m.id ? updated : x));
  };

  const handleLinkMe = async (m) => {
    try {
      const updated = await familyApi.linkMe(m.id);
      // Retirer le lien des autres membres localement
      setMembers(prev => prev.map(x => {
        if (x.id === m.id) return updated;
        if (x.user_id === user?.id) return { ...x, user_id: null };
        return x;
      }));
    } catch (e) { setError(e.message); }
  };

  const handleUnlinkMe = async (m) => {
    try {
      const updated = await familyApi.unlinkMe(m.id);
      setMembers(prev => prev.map(x => x.id === m.id ? updated : x));
    } catch (e) { setError(e.message); }
  };

  const isMe = (m) => user?.id && String(m.user_id) === String(user.id);

  if (loading) return <div className="owner-loading">Chargement...</div>;

  return (
    <div className="members-section">
      <div className="section-header">
        <h2 className="section-title">👨‍👩‍👧‍👦 Membres de la famille</h2>
        <button className="owner-btn-primary" onClick={openNew}>+ Ajouter</button>
      </div>

      {error && !showForm && <div className="owner-error">{error}</div>}

      <div className="members-grid">
        {members.length === 0 && (
          <div className="owner-empty">Aucun membre — commencez par en ajouter un !</div>
        )}
        {members.map(m => (
          <div key={m.id} className={`member-card${!m.is_active ? ' inactive' : ''}`}>
            <div className="member-avatar" style={{ background: m.color }}>
              {m.emoji || m.name.charAt(0).toUpperCase()}
            </div>
            <div className="member-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="member-name">{m.name}</span>
                {isMe(m) && <span className="member-me-badge">C'est moi</span>}
              </div>
              <span className="member-meta">
                {m.is_child ? '👶 Enfant' : '🧑 Adulte'}
                {m.birthdate && ` · ${m.birthdate.split('-').reverse().join('/')}`}
                {!m.is_active && ' · Inactif'}
              </span>
            </div>
            <div className="member-color-dot" style={{ background: m.color }} />
            <div className="member-actions">
              {/* Lier / délier mon compte */}
              {isMe(m) ? (
                <button className="owner-btn-icon" onClick={() => handleUnlinkMe(m)} title="Délier mon compte">🔗</button>
              ) : !m.is_child ? (
                <button className="owner-btn-icon" onClick={() => handleLinkMe(m)} title="C'est moi">👤</button>
              ) : null}
              <button className="owner-btn-icon" onClick={() => openEdit(m)} title="Modifier">✏️</button>
              <button className="owner-btn-icon" onClick={() => handleToggleActive(m)}
                title={m.is_active ? 'Désactiver' : 'Réactiver'}>
                {m.is_active ? '🔕' : '🔔'}
              </button>
              <button className="owner-btn-icon danger" onClick={() => handleDelete(m.id, m.name)} title="Supprimer">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="owner-modal-overlay" onClick={closeForm}>
          <div className="owner-modal" onClick={e => e.stopPropagation()}>
            <h3 className="owner-modal-title">{editing ? 'Modifier le membre' : 'Nouveau membre'}</h3>
            {error && <div className="owner-error">{error}</div>}

            <div className="owner-field">
              <label>Nom *</label>
              <input className="owner-input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Prénom" autoFocus />
            </div>

            <div className="owner-field">
              <label>Type</label>
              <div className="owner-toggle-row">
                <button className={`owner-toggle${!form.is_child ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, is_child: false }))}>🧑 Adulte</button>
                <button className={`owner-toggle${form.is_child ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, is_child: true }))}>👶 Enfant</button>
              </div>
            </div>

            <div className="owner-field">
              <label>Date de naissance</label>
              <input className="owner-input" type="date" value={form.birthdate}
                onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))} />
            </div>

            <div className="owner-field">
              <label>Couleur</label>
              <div className="color-grid">
                {PRESET_COLORS.map(c => (
                  <button key={c} className={`color-swatch${form.color === c ? ' selected' : ''}`}
                    style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
                <input type="color" className="color-custom" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))} title="Couleur personnalisée" />
              </div>
            </div>

            <div className="owner-field">
              <label>Emoji avatar</label>
              <div className="emoji-grid">
                {PRESET_EMOJIS.map(e => (
                  <button key={e} className={`emoji-swatch${form.emoji === e ? ' selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, emoji: f.emoji === e ? '' : e }))}>{e}</button>
                ))}
              </div>
            </div>

            <div className="owner-modal-actions">
              <button className="owner-btn-cancel" onClick={closeForm} disabled={saving}>Annuler</button>
              <button className="owner-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '...' : editing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
