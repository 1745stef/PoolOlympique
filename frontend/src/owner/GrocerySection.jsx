import { useState, useEffect, useRef } from 'react';
import { familyApi } from '../lib/api';

const LIST_COLORS = [
  '#2d7dd2','#1DD1A1','#FF6B6B','#FF9F43','#C44BE8',
  '#48DBFB','#FECA57','#54A0FF','#FF6BA8','#A29BFE',
];

export default function GrocerySection() {
  const [lists, setLists]           = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Formulaire nouvelle liste
  const [showListForm, setShowListForm] = useState(false);
  const [listForm, setListForm]         = useState({ title: '', color: '#2d7dd2' });
  const [savingList, setSavingList]     = useState(false);

  // Nouvel item
  const [newItem, setNewItem]   = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const newItemRef = useRef(null);

  // Édition item
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText]       = useState('');

  const [error, setError]           = useState(null);
  const [sortBy, setSortBy]         = useState('oldest');   // 'newest' | 'oldest' | 'color'
  const [filterColor, setFilterColor] = useState(null);      // null = tous
  const [editingList, setEditingList]   = useState(null); // list en cours d'édition
  const [listEditForm, setListEditForm] = useState({ title: '', color: '' });

  // Charger les listes
  useEffect(() => {
    setLoading(true);
    familyApi.getLists(showArchived)
      .then(data => {
        setLists(data);
        if (!showArchived && data.length > 0 && !activeList) {
          selectList(data[0]);
        }
      })
      .catch(() => setError('Erreur chargement'))
      .finally(() => setLoading(false));
  }, [showArchived]);

  const selectList = async (list) => {
    setActiveList(list);
    setLoadingItems(true);
    setItems([]);
    try {
      const data = await familyApi.getItems(list.id);
      setItems(data);
    } catch { setError('Erreur chargement items'); }
    finally { setLoadingItems(false); }
  };

  // Ouvrir édition liste
  const openEditList = (list, e) => {
    e.stopPropagation();
    setEditingList(list.id);
    setListEditForm({ title: list.title, color: list.color });
  };

  // Sauvegarder édition liste
  const handleSaveList = async () => {
    if (!listEditForm.title.trim()) return;
    const updated = await familyApi.updateList(editingList, {
      title: listEditForm.title.trim(),
      color: listEditForm.color,
    });
    setLists(prev => prev.map(l => l.id === editingList ? { ...updated, grocery_items: l.grocery_items } : l));
    if (activeList?.id === editingList) setActiveList(updated);
    setEditingList(null);
  };

  // Créer liste
  const handleCreateList = async () => {
    if (!listForm.title.trim()) return;
    setSavingList(true);
    try {
      const created = await familyApi.createList({ ...listForm, sort_order: lists.length });
      setLists(prev => [...prev, { ...created, grocery_items: [] }]);
      setShowListForm(false);
      setListForm({ title: '', color: '#2d7dd2' });
      selectList(created);
    } catch (e) { setError(e.message); }
    finally { setSavingList(false); }
  };

  // Archiver/désarchiver liste
  const handleArchiveList = async (list) => {
    const updated = await familyApi.updateList(list.id, { archived: !list.archived_at });
    setLists(prev => prev.filter(l => l.id !== list.id));
    if (activeList?.id === list.id) { setActiveList(null); setItems([]); }
  };

  // Supprimer liste
  const handleDeleteList = async (list) => {
    if (!confirm(`Supprimer la liste "${list.title}" ?`)) return;
    await familyApi.deleteList(list.id);
    setLists(prev => prev.filter(l => l.id !== list.id));
    if (activeList?.id === list.id) { setActiveList(null); setItems([]); }
  };

  // Ajouter item
  const handleAddItem = async () => {
    if (!newItem.trim() || !activeList) return;
    setAddingItem(true);
    try {
      const created = await familyApi.createItem(activeList.id, { content: newItem.trim() });
      setItems(prev => [...prev, created]);
      setNewItem('');
      // Mettre à jour compteur dans la liste
      setLists(prev => prev.map(l => l.id === activeList.id
        ? { ...l, grocery_items: [...(l.grocery_items || []), { id: created.id, checked: false }] }
        : l
      ));
      newItemRef.current?.focus();
    } catch (e) { setError(e.message); }
    finally { setAddingItem(false); }
  };

  // Cocher/décocher item
  const handleCheck = async (item) => {
    const updated = await familyApi.checkItem(item.id);
    setItems(prev => prev.map(x => x.id === item.id ? updated : x));
    setLists(prev => prev.map(l => l.id === activeList.id
      ? { ...l, grocery_items: (l.grocery_items || []).map(x => x.id === item.id ? { ...x, checked: updated.checked } : x) }
      : l
    ));
  };

  // Supprimer item
  const handleDeleteItem = async (id) => {
    await familyApi.deleteItem(id);
    setItems(prev => prev.filter(x => x.id !== id));
    setLists(prev => prev.map(l => l.id === activeList.id
      ? { ...l, grocery_items: (l.grocery_items || []).filter(x => x.id !== id) }
      : l
    ));
  };

  // Éditer item
  const handleEditItem = async (item) => {
    if (!editText.trim()) return;
    const updated = await familyApi.updateItem(item.id, { content: editText.trim() });
    setItems(prev => prev.map(x => x.id === item.id ? updated : x));
    setEditingItem(null);
  };

  // Tout décocher
  const handleUncheckAll = async () => {
    const checked = items.filter(i => i.checked);
    await Promise.all(checked.map(i => familyApi.checkItem(i.id)));
    const fresh = await familyApi.getItems(activeList.id);
    setItems(fresh);
  };

  // Compter items par liste
  const getCount = (list) => {
    const all = list.grocery_items || [];
    const done = all.filter(i => i.checked).length;
    return { total: all.length, done };
  };

  if (loading) return <div className="owner-loading">Chargement...</div>;

  // Filtrer + trier les listes
  const filteredLists = [...lists]
    .filter(l => !filterColor || l.color === filterColor)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'color')  return a.color.localeCompare(b.color);
      return a.sort_order - b.sort_order;
    });

  // Couleurs uniques présentes dans les listes
  const usedColors = [...new Set(lists.map(l => l.color))];

  return (
    <div className="grocery-section">
      {error && <div className="owner-error" onClick={() => setError(null)}>{error} ✕</div>}

      <div className="grocery-layout">

        {/* ── Colonne gauche — listes ── */}
        <div className="grocery-sidebar">
          <div className="grocery-sidebar-header">
            <span className="section-title">📋 Listes</span>
            <button className="owner-btn-primary sm" onClick={() => setShowListForm(v => !v)}>+</button>
          </div>

          {/* Filtre et tri */}
          <div className="lists-filter-bar">
            <select
              className="lists-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="oldest">Plus ancien</option>
              <option value="newest">Plus récent</option>
              <option value="color">Par couleur</option>
            </select>
            <div className="lists-color-filter">
              <button
                className={`filter-color-btn all${!filterColor ? ' active' : ''}`}
                onClick={() => setFilterColor(null)}
                title="Toutes les couleurs"
              >✦</button>
              {usedColors.map(c => (
                <button
                  key={c}
                  className={`filter-color-btn${filterColor === c ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setFilterColor(filterColor === c ? null : c)}
                  title="Filtrer par couleur"
                />
              ))}
            </div>
          </div>

          {/* Formulaire nouvelle liste */}
          {showListForm && (
            <div className="list-form">
              <input
                className="owner-input"
                placeholder="Nom de la liste..."
                value={listForm.title}
                onChange={e => setListForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                autoFocus
              />
              <div className="color-grid" style={{ marginTop: 8 }}>
                {LIST_COLORS.map(c => (
                  <button key={c} className={`color-swatch${listForm.color === c ? ' selected' : ''}`}
                    style={{ background: c }} onClick={() => setListForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="owner-btn-cancel" style={{ flex: 1 }}
                  onClick={() => setShowListForm(false)}>Annuler</button>
                <button className="owner-btn-primary" style={{ flex: 1 }}
                  onClick={handleCreateList} disabled={savingList}>
                  {savingList ? '...' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* Listes actives */}
          <div className="lists-nav">
            {filteredLists.map(list => {
              const { total, done } = getCount(list);
              const isActive = activeList?.id === list.id;
              return (
                <div key={list.id}
                  className={`list-nav-item${isActive ? ' active' : ''}`}
                  style={{ '--list-color': list.color }}
                  onClick={() => selectList(list)}
                >
                  <div className="list-nav-dot" style={{ background: list.color }} />
                  <div className="list-nav-info">
                    <span className="list-nav-title">{list.title}</span>
                    {total > 0 && (
                      <span className="list-nav-count">{done}/{total}</span>
                    )}
                  </div>
                  <div className="list-nav-actions" onClick={e => e.stopPropagation()}>
                    <button className="owner-btn-icon" onClick={(e) => openEditList(list, e)}
                      title="Renommer">✏️</button>
                    <button className="owner-btn-icon" onClick={() => handleArchiveList(list)}
                      title="Archiver">📦</button>
                    <button className="owner-btn-icon danger" onClick={() => handleDeleteList(list)}
                      title="Supprimer">🗑</button>
                  </div>
                </div>
              );
            })}
            {filteredLists.length === 0 && (
              <div className="owner-empty" style={{ padding: '20px 12px', fontSize: '0.82rem' }}>
                Aucune liste
              </div>
            )}
          </div>

          {/* Toggle archives */}
          <button className="archived-toggle" onClick={() => setShowArchived(v => !v)}>
            {showArchived ? '← Listes actives' : '📦 Archives'}
          </button>
        </div>

        {/* ── Colonne droite — items ── */}
        <div className="grocery-main">
          {!activeList ? (
            <div className="owner-coming-soon">Sélectionnez ou créez une liste</div>
          ) : (
            <>
              {/* Header liste active */}
              <div className="grocery-list-header">
                <div className="grocery-list-title-row">
                  <div className="grocery-list-dot" style={{ background: activeList.color }} />
                  <h2 className="grocery-list-title">{activeList.title}</h2>
                  {items.some(i => i.checked) && (
                    <button className="owner-btn-cancel sm" onClick={handleUncheckAll}
                      title="Tout décocher">↺ Réinitialiser</button>
                  )}
                </div>
                <span className="grocery-count">
                  {items.filter(i => i.checked).length}/{items.length} articles
                </span>
              </div>

              {/* Barre de progression */}
              {items.length > 0 && (
                <div className="grocery-progress-bar">
                  <div className="grocery-progress-fill"
                    style={{
                      width: `${Math.round(items.filter(i => i.checked).length / items.length * 100)}%`,
                      background: activeList.color,
                    }} />
                </div>
              )}

              {/* Champ ajout */}
              <div className="item-add-row">
                <input
                  ref={newItemRef}
                  className="owner-input"
                  placeholder="Ajouter un article..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                />
                <button className="owner-btn-primary"
                  onClick={handleAddItem} disabled={!newItem.trim() || addingItem}>
                  {addingItem ? '...' : 'Ajouter'}
                </button>
              </div>

              {/* Items */}
              {loadingItems ? (
                <div className="owner-loading">Chargement...</div>
              ) : (
                <div className="items-list">
                  {/* Non cochés d'abord */}
                  {[...items].sort((a, b) => a.checked - b.checked).map(item => (
                    <div key={item.id} className={`item-row${item.checked ? ' checked' : ''}`}>
                      <button
                        className={`item-check-btn${item.checked ? ' done' : ''}`}
                        style={{ '--item-color': activeList.color }}
                        onClick={() => handleCheck(item)}
                      >
                        {item.checked ? '✓' : ''}
                      </button>

                      {editingItem === item.id ? (
                        <input
                          className="owner-input item-edit-input"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditItem(item);
                            if (e.key === 'Escape') setEditingItem(null);
                          }}
                          autoFocus
                          onBlur={() => handleEditItem(item)}
                        />
                      ) : (
                        <span
                          className="item-content"
                          onDoubleClick={() => { setEditingItem(item.id); setEditText(item.content); }}
                        >
                          {item.content}
                        </span>
                      )}

                      <button className="owner-btn-icon danger item-delete"
                        onClick={() => handleDeleteItem(item.id)}>✕</button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="owner-empty">Liste vide — ajoutez votre premier article !</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Modal édition liste */}
      {editingList && (
        <div className="owner-modal-overlay" onClick={() => setEditingList(null)}>
          <div className="owner-modal" onClick={e => e.stopPropagation()}>
            <h3 className="owner-modal-title">Modifier la liste</h3>
            <div className="owner-field">
              <label>Nom</label>
              <input
                className="owner-input"
                value={listEditForm.title}
                onChange={e => setListEditForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSaveList()}
                autoFocus
              />
            </div>
            <div className="owner-field">
              <label>Couleur</label>
              <div className="color-grid">
                {LIST_COLORS.map(c => (
                  <button key={c}
                    className={`color-swatch${listEditForm.color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setListEditForm(f => ({ ...f, color: c }))}
                  />
                ))}
                <input type="color" className="color-custom" value={listEditForm.color}
                  onChange={e => setListEditForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div className="owner-modal-actions">
              <button className="owner-btn-cancel" onClick={() => setEditingList(null)}>Annuler</button>
              <button className="owner-btn-primary" onClick={handleSaveList}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
