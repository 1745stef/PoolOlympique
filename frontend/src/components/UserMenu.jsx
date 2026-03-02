import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../lib/api';
import ImageCropper from './ImageCropper';

// ── Avatar display (réutilisable partout) ─────────────────────────────────
export function Avatar({ user, size = 36 }) {
  if (!user) return null;
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.username}
        className="avatar-img"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const letter = (user.username || '?')[0].toUpperCase();
  const bg   = user.avatar_color      || '#000000';
  const text = user.avatar_text_color || '#FFFFFF';
  return (
    <div className="avatar-letter" style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.45,
      fontWeight: 700, flexShrink: 0, userSelect: 'none',
    }}>
      {letter}
    </div>
  );
}

// ── Modal changement de mot de passe ─────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError('');
    if (next.length < 6)      return setError('Minimum 6 caractères');
    if (next !== confirm)     return setError('Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      await authApi.changePassword(next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>🔒 Changer le mot de passe</h3>
        {success ? (
          <p style={{ color: '#4ade80', textAlign: 'center', padding: '12px 0' }}>✓ Mot de passe changé !</p>
        ) : (
          <>
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Min. 6 caractères" />
            </div>
            <div className="field">
              <label>Confirmer</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter le mot de passe" />
            </div>
            {error && <p className="field-error">{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
              <button className="btn-primary" onClick={handle} disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : 'Changer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal avatar ──────────────────────────────────────────────────────────
function AvatarModal({ onClose }) {
  const { user, updateAvatarFields, uploadAvatarFile } = useAuth();

  // Détecter le bon onglet de départ selon l'avatar actuel
  const defaultTab = !user?.avatar_url ? 'upload' : 'upload'; // toujours upload au départ

  const [tab, setTab]           = useState(defaultTab);
  // Pré-remplir l'URL si l'avatar actuel est une URL externe (pas Supabase Storage)
  const isSupabaseUrl = user?.avatar_url?.includes('/storage/v1/object/');
  const [urlInput, setUrlInput] = useState(!isSupabaseUrl && user?.avatar_url ? user.avatar_url : '');
  const [bgColor, setBgColor]   = useState(user?.avatar_color || '#1a1a2e');
  const [txtColor, setTxtColor] = useState(user?.avatar_text_color || '#FFFFFF');
  const [loading, setLoading]   = useState(false);
  const [loadingCrop, setLoadingCrop] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [cropSrc, setCropSrc]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const originalRef = useRef({ base64: null, contentType: null });
  const fileRef  = useRef(null);
  const letter   = (user?.username || '?')[0].toUpperCase();
  const ALLOWED  = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/avif'];

  // Charger une URL via le proxy backend (évite CORS sur canvas)
  const openCropFromUrl = async (url) => {
    setLoadingCrop(true); setError('');
    try {
      const data = await authApi.fetchImageAsBase64(url);
      originalRef.current = { base64: data.base64, contentType: data.contentType };
      setCropSrc(data.dataUrl);
    } catch (e) {
      setError("Impossible de charger l'image : " + e.message);
    } finally { setLoadingCrop(false); }
  };

  // Au chargement : PAS d'ouverture automatique du cropper
  // L'utilisateur clique sur la photo pour recadrer

  const loadFile = (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { setError('Format non supporté (JPG, PNG, GIF, WEBP, AVIF)'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image trop grande (max 10MB)'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      originalRef.current = { base64: dataUrl.split(',')[1], contentType: file.type };
      setCropSrc(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = ()  => setIsDragging(false);
  const onDrop      = (e) => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files?.[0]); };

  const handleCropped = async (base64, contentType) => {
    setLoading(true); setError('');
    try {
      const { base64: origB64, contentType: origCT } = originalRef.current;
      await uploadAvatarFile(base64, contentType, origB64, origCT);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) { setError(e.message); setCropSrc(null); }
    finally { setLoading(false); }
  };

  // Quand l'URL est confirmée : charger via proxy → cropper
  const handleUrlConfirm = async () => {
    if (!urlInput.trim()) { setError('Entre une URL'); return; }
    await openCropFromUrl(urlInput.trim());
  };

  // Sauvegarder initiale — restaurer l'avatar photo si annule implicitement
  const saveLetter = async () => {
    setLoading(true); setError('');
    try {
      // On garde avatar_original_url intact, on remet juste avatar_url à null
      await updateAvatarFields({ avatar_url: null, avatar_color: bgColor, avatar_text_color: txtColor });
      setSuccess(true); setTimeout(onClose, 1200);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Annuler sur onglet initiale : restaurer la photo précédente si elle existe
  const handleCancelLetter = async () => {
    if (user?.avatar_url) {
      // L'utilisateur avait une photo — la remettre silencieusement
      try { await updateAvatarFields({ avatar_url: user.avatar_url }); } catch {}
    }
    onClose();
  };

  // Mode crop : plein écran modal
  if (cropSrc) {
    return (
      <div className="modal-overlay" onClick={() => setCropSrc(null)}>
        <div className="modal-box avatar-modal" onClick={e => e.stopPropagation()}>
          <h3 style={{ marginBottom: 12 }}>✂️ Recadrer la photo</h3>
          <ImageCropper imageSrc={cropSrc} onCrop={handleCropped} onCancel={() => setCropSrc(null)} />
          {loading && <p style={{ textAlign:'center', color:'var(--muted)', marginTop:8 }}>Envoi en cours...</p>}
          {error   && <p className="field-error" style={{ marginTop:8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box avatar-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 14 }}>🖼️ Mon avatar</h3>

        {/* Preview — toujours visible, montre l'état actuel ou l'aperçu selon l'onglet */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          {tab === 'letter' ? (
            /* Aperçu live de l'initiale en cours de config */
            <div style={{ width:72, height:72, borderRadius:'50%', background:bgColor, color:txtColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:32, fontWeight:700 }}>{letter}</div>
          ) : user?.avatar_url ? (
            /* Photo actuelle — cliquable pour recadrer */
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => openCropFromUrl(user.avatar_original_url || user.avatar_url)} title="Cliquer pour recadrer">
              <img src={user.avatar_url} alt="avatar actuel" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--la-coral)' }} />
              {loadingCrop
                ? <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⏳</div>
                : <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, opacity:0, transition:'all 0.2s' }} className="avatar-crop-hover">✂️</div>
              }
            </div>
          ) : user?.avatar_original_url ? (
            /* Pas de photo active (initiale en cours) mais une ancienne photo existe → l'afficher comme référence */
            <div style={{ position:'relative', cursor:'pointer' }} onClick={() => openCropFromUrl(user.avatar_original_url)} title="Cliquer pour recadrer cette photo">
              <img src={user.avatar_original_url} alt="dernière photo" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'2px dashed var(--la-coral)', opacity:0.75 }} />
              {loadingCrop
                ? <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⏳</div>
                : <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, opacity:0, transition:'all 0.2s' }} className="avatar-crop-hover">✂️</div>
              }
            </div>
          ) : user?.avatar_color ? (
            /* Initiale existante, aucune photo jamais uploadée */
            <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color, color:user.avatar_text_color || '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:32, fontWeight:700 }}>{letter}</div>
          ) : (
            /* Aucun avatar encore */
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--bg2)', border:'2px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:28 }}>?</div>
          )}
        </div>

        <div className="avatar-tabs">
          <button className={tab==='upload' ? 'active':''} onClick={()=>setTab('upload')}>📁 Fichier</button>
          <button className={tab==='url'    ? 'active':''} onClick={()=>setTab('url')}>🔗 URL</button>
          <button className={tab==='letter' ? 'active':''} onClick={()=>setTab('letter')}>🔤 Initiale</button>
        </div>

        {tab === 'upload' && (
          <div className="avatar-tab-content">
            <div
              className={`avatar-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <span className="dropzone-icon">📷</span>
              <span className="dropzone-text"><strong>Glisse une photo ici</strong><span> ou clique pour parcourir</span></span>
              <span className="dropzone-sub">JPG · PNG · GIF · WEBP · AVIF · Max 10MB</span>
            </div>
            <input ref={fileRef} type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
              onChange={e => loadFile(e.target.files?.[0])}
              style={{ display:'none' }} />
            {error && <p className="field-error" style={{ marginTop:8 }}>{error}</p>}
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button className="avatar-btn-cancel" onClick={onClose}>Annuler</button>
              {/* Visible seulement si une ancienne photo existe mais n'est pas active (mode initiale) */}
              {!user?.avatar_url && user?.avatar_original_url && (
                <button className="avatar-btn-save" disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await updateAvatarFields({ avatar_url: user.avatar_original_url });
                      setTimeout(onClose, 800);
                    } catch(e) { setError(e.message); }
                    finally { setLoading(false); }
                  }}>
                  {loading ? '...' : '✓ Utiliser cette photo'}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="avatar-tab-content">
            <div className="field">
              <label>Lien de la photo</label>
              <input type="url" value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://..." />
            </div>
            {urlInput && (
              <div style={{ marginTop:6, borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                <img src={urlInput} alt="preview url" style={{ width:'100%', maxHeight:80, objectFit:'cover', display:'block' }}
                  onError={e => e.target.style.display='none'} />
              </div>
            )}
            {error && <p className="field-error" style={{ marginTop:4 }}>{error}</p>}
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="avatar-btn-cancel" onClick={onClose}>Annuler</button>
              <button className="avatar-btn-save" disabled={loadingCrop || loading} onClick={handleUrlConfirm}>
                {loadingCrop ? '⏳...' : 'Continuer →'}
              </button>
            </div>
          </div>
        )}

        {tab === 'letter' && (
          <div className="avatar-tab-content">
            {/* Rappel de la photo précédente si disponible */}
            {user?.avatar_url && (
              <div style={{ textAlign:'center', marginBottom:10 }}>
                <p style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:6 }}>Photo précédente (Annuler la restaure)</p>
                <img src={user.avatar_url} alt="photo précédente" style={{ width:48, height:48, borderRadius:'50%', objectFit:'cover', border:'1px solid var(--border)', opacity:0.6 }} />
              </div>
            )}
            <div className="color-pickers-row">
              <div className="color-picker-group">
                <label>Fond</label>
                <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)} className="big-color-picker" />
              </div>
              <div className="color-picker-group">
                <label>Lettre</label>
                <input type="color" value={txtColor} onChange={e=>setTxtColor(e.target.value)} className="big-color-picker" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="avatar-btn-cancel" onClick={handleCancelLetter}>Annuler</button>
              <button className="avatar-btn-save" disabled={loading} onClick={saveLetter}>
                {loading ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {error   && <p className="field-error" style={{marginTop:8}}>{error}</p>}
        {success && <p style={{color:'#4ade80',textAlign:'center',marginTop:8}}>✓ Avatar mis à jour !</p>}
      </div>
    </div>
  );
}

// ── Menu dropdown principal ───────────────────────────────────────────────
export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen]         = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const menuRef = useRef(null);

  // Fermer si clic ailleurs
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="user-menu-wrap" ref={menuRef}>
        <button className="user-menu-trigger" onClick={() => setOpen(v => !v)}>
          <Avatar user={user} size={32} />
          <span className="user-menu-name">{user.username}</span>
          <span className={`user-menu-chevron ${open ? 'open' : ''}`}>▼</span>
        </button>

        {open && (
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <Avatar user={user} size={44} />
              <div>
                <div className="user-menu-username">{user.username}</div>
                {user.is_admin && <span className="admin-badge-sm">Admin</span>}
              </div>
            </div>
            <div className="user-menu-divider" />
            <button className="user-menu-item" onClick={() => { setShowAvatar(true); setOpen(false); }}>
              🖼️ Modifier l'avatar
            </button>
            <button className="user-menu-item" onClick={() => { setShowPwd(true); setOpen(false); }}>
              🔒 Changer le mot de passe
            </button>
            <div className="user-menu-divider" />
            <button className="user-menu-item user-menu-logout" onClick={() => { setOpen(false); logout(); }}>
              🚪 Se déconnecter
            </button>
          </div>
        )}
      </div>

      {showPwd    && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
      {showAvatar && <AvatarModal onClose={() => setShowAvatar(false)} />}
    </>
  );
}
