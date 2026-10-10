import { useState, useEffect } from 'react';
import { familyApi } from '../lib/api';

// Palette "post-it" — couleurs pastel
const NOTE_COLORS = [
  '#FFF3B0', '#FFD8A8', '#FFB3C1', '#D8B4FE',
  '#B4D4FF', '#A8E6CF', '#C4F1BE', '#FFC9C9',
];
const DEFAULT_FORM = { title: '', content: '', color: NOTE_COLORS[0], member_id: '' };

export default function NotesSection() {
  const [notes, setNotes]           = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError]           = useState(null);

  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null); // note en cours d'édition, null = création
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    loadNotes();
    familyApi.getMembers().then(setMembers).catch(() => {});
  }, [showArchived]);

  const loadNotes = () => {
    setLoading(true);
    familyApi.getNotes(showArchived)
      .then(setNotes)
      .catch(() => setError('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  const openNew = () => { setForm(DEFAULT_FORM); setEditing(null); setShowForm(true); };

  const openEdit = (note) => {
    setForm({
      title: note.title || '',
      content: note.content || '',
      color: note.color || NOTE_COLORS[0],
      member_id: note.member_id || '',
    });
    setEditing(note);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim() || null,
        color: form.color,
        member_id: form.member_id || null,
      };
      if (editing) {
        const updated = await familyApi.updateNote(editing.id, payload);
        setNotes(prev => prev.map(n => n.id === editing.id ? updated : n));
      } else {
        const created = await familyApi.createNote(payload);
        setNotes(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleTogglePin = async (note, e) => {
    e.stopPropagation();
    const updated = await familyApi.updateNote(note.id, { pinned: !note.pinned });
    setNotes(prev => prev.map(n => n.id === note.id ? updated : n)
      .sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updated_at) - new Date(a.updated_at))));
  };

  const handleArchive = async (note, e) => {
    e.stopPropagation();
    await familyApi.updateNote(note.id, { archived: !showArchived });
    setNotes(prev => prev.filter(n => n.id !== note.id));
  };

  const handleDelete = async (note, e) => {
    e.stopPropagation();
    if (!confirm(`Supprimer la note "${note.title}" ?`)) return;
    await familyApi.deleteNote(note.id);
    setNotes(prev => prev.filter(n => n.id !== note.id));
  };

  if (loading) return <div className="owner-loading">Chargement...</div>;

  return (
    <div className="notes-section">
      {error && <div className="owner-error" onClick={() => setError(null)}>{error} ✕</div>}

      <div className="section-header">
        <h2 className="section-title">📝 Notes</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="archived-toggle" onClick={() => setShowArchived(v => !v)}>
            {showArchived ? '← Notes actives' : '📦 Archives'}
          </button>
          {!showArchived && (
            <button className="owner-btn-primary" onClick={openNew}>+ Nouvelle note</button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="owner-empty">
          {showArchived ? 'Aucune note archivée' : 'Aucune note — créez-en une !'}
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map(note => {
            const member = note.family_members;
            return (
              <div
                key={note.id}
                className={`note-card${note.pinned ? ' pinned' : ''}`}
                style={{ background: note.color || NOTE_COLORS[0] }}
                onClick={() => openEdit(note)}
              >
                <div className="note-card-top">
                  <h3 className="note-card-title">{note.title}</h3>
                  <button
                    className={`note-pin-btn${note.pinned ? ' active' : ''}`}
                    title={note.pinned ? 'Désépingler' : 'Épingler'}
                    onClick={(e) => handleTogglePin(note, e)}
                  >📌</button>
                </div>

                {note.content && <p className="note-card-content">{note.content}</p>}

                <div className="note-card-footer">
                  {member ? (
                    <span className="note-member-badge" style={{ '--m-color': member.color }}>
                      {member.emoji || '👤'} {member.name}
                    </span>
                  ) : <span />}

                  <div className="note-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="owner-btn-icon" title={showArchived ? 'Désarchiver' : 'Archiver'}
                      onClick={(e) => handleArchive(note, e)}>📦</button>
                    <button className="owner-btn-icon danger" title="Supprimer"
                      onClick={(e) => handleDelete(note, e)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showForm && (
        <div className="owner-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="owner-modal" onClick={e => e.stopPropagation()}>
            <h3 className="owner-modal-title">{editing ? 'Modifier la note' : 'Nouvelle note'}</h3>

            <div className="owner-field">
              <label>Titre</label>
              <input
                className="owner-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="owner-field">
              <label>Contenu</label>
              <textarea
                className="owner-input note-textarea"
                rows={5}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="owner-field">
              <label>Couleur</label>
              <div className="color-grid">
                {NOTE_COLORS.map(c => (
                  <button key={c}
                    className={`color-swatch${form.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>

            {members.length > 0 && (
              <div className="owner-field">
                <label>Membre associé (optionnel)</label>
                <select
                  className="owner-input"
                  value={form.member_id}
                  onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                >
                  <option value="">— Aucun —</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.emoji ? `${m.emoji} ` : ''}{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="owner-modal-actions">
              <button className="owner-btn-cancel" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="owner-btn-primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
