import { useState, useEffect, useCallback } from 'react';
import { bingoApi } from '../lib/api';
import TileContent from './TileContent';

function readImage(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({
      base64: String(r.result).split(',')[1],
      contentType: file.type || 'image/png',
      preview: r.result,
    });
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });
}

// Vue admin : toutes les cases, édition (texte et/ou image) et révélation.
export default function BingoAdmin() {
  const [grid, setGrid]       = useState({ cols: 5, rows: 5 });
  const [active, setActive]   = useState(false);   // grille ouverte aux joueurs ?
  const [toggling, setToggling] = useState(false);
  const [cells, setCells]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [editing, setEditing] = useState(null);   // position en cours d'édition
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await bingoApi.adminCells();
      setGrid({ cols: d.cols, rows: d.rows });
      setActive(!!d.active);
      setCells(Object.fromEntries(d.cells.map(c => [c.position, c])));
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Rafraîchit toutes les 10 s (plusieurs admins) — sauf pendant une édition
  useEffect(() => {
    if (editing !== null) return;
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [editing, load]);

  const openEdit = (pos) => {
    const c = cells[pos];
    setForm({
      text: c?.text || '',
      image_url: c?.image_url || null,
      newImage: null,
      removeImage: false,
      revealed: !!c?.revealed,
    });
    setEditing(pos);
    setError(null);
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const img = await readImage(file);
      setForm(f => ({ ...f, newImage: img, removeImage: false }));
    } catch (err) { setError(err.message); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { text: form.text };
      if (form.newImage) payload.image = { base64: form.newImage.base64, contentType: form.newImage.contentType };
      else if (form.removeImage) payload.remove_image = true;

      let saved = await bingoApi.saveCell(editing, payload);
      if (form.revealed !== !!saved.revealed) saved = await bingoApi.reveal(editing, form.revealed);
      setCells(prev => ({ ...prev, [editing]: saved }));
      setEditing(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async () => {
    if (active && !confirm("Fermer la grille ? Les joueurs reviendront à l'écran d'attente.")) return;
    setToggling(true);
    try {
      const r = await bingoApi.setActive(!active);
      setActive(!!r.active);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setToggling(false); }
  };

  const toggleReveal = async (pos, e) => {
    e.stopPropagation();
    try {
      const r = await bingoApi.reveal(pos, !cells[pos]?.revealed);
      setCells(prev => ({ ...prev, [pos]: r }));
      setError(null);
    } catch (err) { setError(err.message); }
  };

  if (loading) return <div className="owner-loading">Chargement...</div>;

  const total = grid.cols * grid.rows;
  const revealedCount = Object.values(cells).filter(c => c.revealed && c.position < total).length;
  const preview = form && !form.removeImage ? (form.newImage?.preview || form.image_url) : null;

  return (
    <div className="bingo-wrap">
      {error && editing === null && <div className="owner-error" onClick={() => setError(null)}>{error} ✕</div>}
      <div className="bingo-adminbar">
        <span className={`bingo-state-badge${active ? ' on' : ''}`}>
          {active ? '🟢 Grille ouverte aux joueurs' : '🔴 Grille fermée — les joueurs attendent'}
        </span>
        <button className={active ? 'owner-btn-cancel' : 'owner-btn-primary'} onClick={toggleActive} disabled={toggling}>
          {toggling ? '...' : active ? 'Fermer la grille' : '🎉 Ouvrir la grille'}
        </button>
      </div>
      <div className="bingo-status">
        {revealedCount} / {total} cases {active ? 'révélées aux joueurs' : 'marquées (visibles pour les joueurs à l\'ouverture)'} · clique une case pour la modifier
      </div>

      <div className="bingo-grid" style={{ '--cols': grid.cols }}>
        {Array.from({ length: total }, (_, pos) => {
          const c = cells[pos];
          const has = c && (c.text || c.image_url);
          return (
            <div key={pos}
              className={`bingo-tile admin${c?.revealed ? ' revealed' : ''}${has ? '' : ' empty'}`}
              onClick={() => openEdit(pos)}>
              {has ? <TileContent text={c.text} image_url={c.image_url} /> : <span className="bingo-tile-plus">+</span>}
              <span className="bingo-tile-num">{pos + 1}</span>
              {has && (
                <button className={`bingo-eye${c.revealed ? ' on' : ''}`}
                  title={c.revealed ? 'Cacher aux joueurs' : 'Révéler aux joueurs'}
                  onClick={(e) => toggleReveal(pos, e)}>
                  {c.revealed ? '👁' : '🔒'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing !== null && form && (
        <div className="owner-modal-overlay" onClick={() => setEditing(null)}>
          <div className="owner-modal" onClick={e => e.stopPropagation()}>
            <h3 className="owner-modal-title">Case {editing + 1}</h3>

            <div className="owner-field">
              <label>Texte</label>
              <textarea className="owner-input note-textarea" rows={4} value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))} autoFocus />
            </div>

            <div className="owner-field">
              <label>Image</label>
              {preview && <img src={preview} alt="" className="bingo-edit-preview" />}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="owner-btn-cancel" style={{ cursor: 'pointer' }}>
                  {preview ? 'Changer l\'image' : 'Choisir une image'}
                  <input type="file" accept="image/*" hidden onChange={onPickFile} />
                </label>
                {preview && (
                  <button className="owner-btn-cancel"
                    onClick={() => setForm(f => ({ ...f, newImage: null, removeImage: true }))}>
                    Retirer l'image
                  </button>
                )}
              </div>
            </div>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.revealed}
                onChange={e => setForm(f => ({ ...f, revealed: e.target.checked }))} />
              Révélée aux joueurs
            </label>

            {error && <div className="owner-error">{error}</div>}

            <div className="owner-modal-actions">
              <button className="owner-btn-cancel" onClick={() => setEditing(null)}>Annuler</button>
              <button className="owner-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
