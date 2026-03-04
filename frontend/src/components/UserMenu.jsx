import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';
import { authApi } from '../lib/api';
import ImageCropper from './ImageCropper';
import LanguagePickerModal, { LangFlag } from './LanguagePicker';

// ── Avatar display ────────────────────────────────────────────────────────────
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

// ── Modal changement de mot de passe ─────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const { t } = useLang();
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError('');
    if (next.length < 6)  return setError(t('minCharsPassword'));
    if (next !== confirm) return setError(t('passwordMismatch'));
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
        <h3 style={{ marginBottom: 16 }}>{t('changePasswordTitle')}</h3>
        {success ? (
          <p style={{ color: '#4ade80', textAlign: 'center', padding: '12px 0' }}>{t('passwordChanged')}</p>
        ) : (
          <>
            <div className="field">
              <label>{t('newPassword')}</label>
              <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder={t('minCharsPassword')} />
            </div>
            <div className="field">
              <label>{t('confirmPassword')}</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t('repeatPassword')} />
            </div>
            {error && <p className="field-error">{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>{t('cancel')}</button>
              <button className="btn-primary" onClick={handle} disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : t('change')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal avatar ──────────────────────────────────────────────────────────────
function AvatarModal({ onClose }) {
  const { user, updateAvatarFields, uploadAvatarFile } = useAuth();
  const { t } = useLang();

  const [tab, setTab] = useState(user?.avatar_type || 'letter');
  const [urlInput, setUrlInput] = useState(user?.avatar_url_external || '');
  const [bgColor,  setBgColor]  = useState(user?.avatar_color       || '#1a1a2e');
  const [txtColor, setTxtColor] = useState(user?.avatar_text_color  || '#FFFFFF');

  const [loading,     setLoading]     = useState(false);
  const [loadingCrop, setLoadingCrop] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [cropSrc,     setCropSrc]     = useState(null);
  const [isDragging,  setIsDragging]  = useState(false);

  const originalRef = useRef({ base64: null, contentType: null });
  const fileRef     = useRef(null);
  const letter      = (user?.username || '?')[0].toUpperCase();
  const ALLOWED     = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/avif'];

  const openCropFromUrl = async (url) => {
    setLoadingCrop(true); setError('');
    try {
      const data = await authApi.fetchImageAsBase64(url);
      originalRef.current = { base64: data.base64, contentType: data.contentType };
      setCropSrc(data.dataUrl);
    } catch (e) {
      setError(t('avatarImageLoadFail') + e.message);
    } finally { setLoadingCrop(false); }
  };

  const loadFile = (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { setError(t('avatarFormatError')); return; }
    if (file.size > 10 * 1024 * 1024) { setError(t('avatarTooLarge')); return; }
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

  const handleUrlConfirm = async () => {
    if (!urlInput.trim()) { setError(t('avatarEnterUrl')); return; }
    await openCropFromUrl(urlInput.trim());
  };

  const handleCroppedFromUrl = async (base64, contentType) => {
    setLoading(true); setError('');
    try {
      const { base64: origB64, contentType: origCT } = originalRef.current;
      await uploadAvatarFile(base64, contentType, origB64, origCT);
      await updateAvatarFields({ avatar_type: 'url', avatar_url_external: urlInput.trim() });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) { setError(e.message); setCropSrc(null); }
    finally { setLoading(false); }
  };

  const saveLetter = async () => {
    setLoading(true); setError('');
    try {
      await updateAvatarFields({ avatar_url: null, avatar_color: bgColor, avatar_text_color: txtColor, avatar_type: 'letter' });
      setSuccess(true); setTimeout(onClose, 1200);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const previewFromTab = () => {
    if (tab === 'letter') {
      return <div style={{ width:72, height:72, borderRadius:'50%', background:bgColor, color:txtColor, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:32, fontWeight:700 }}>{letter}</div>;
    }
    const photoUrl = user?.avatar_url || user?.avatar_original_url;
    if (tab === 'url') {
      const previewUrl = urlInput || user?.avatar_url_external;
      if (previewUrl) return (
        <img src={previewUrl} alt="preview" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--la-coral)' }}
          onError={e => e.target.style.display='none'} />
      );
    }
    if (photoUrl) return (
      <div style={{ position:'relative', cursor:'pointer' }} onClick={() => openCropFromUrl(user.avatar_original_url || user.avatar_url)} title="Recadrer">
        <img src={photoUrl} alt="avatar" style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border: user?.avatar_url ? '2px solid var(--la-coral)' : '2px dashed var(--la-coral)', opacity: user?.avatar_url ? 1 : 0.75 }} />
        {loadingCrop
          ? <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⏳</div>
          : <div className="avatar-crop-hover" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, opacity:0, transition:'all 0.2s' }}>✂️</div>
        }
      </div>
    );
    if (user?.avatar_color) return (
      <div style={{ width:72, height:72, borderRadius:'50%', background:user.avatar_color, color:user.avatar_text_color||'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:32, fontWeight:700 }}>{letter}</div>
    );
    return <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--bg2)', border:'2px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:28 }}>?</div>;
  };

  const isCropFromUrl = tab === 'url';

  if (cropSrc) {
    return (
      <div className="modal-overlay" onClick={() => setCropSrc(null)}>
        <div className="modal-box avatar-modal" onClick={e => e.stopPropagation()}>
          <h3 style={{ marginBottom: 12 }}>{t('cropTitle')}</h3>
          <ImageCropper imageSrc={cropSrc} onCrop={isCropFromUrl ? handleCroppedFromUrl : handleCropped} onCancel={() => setCropSrc(null)} />
          {loading && <p style={{ textAlign:'center', color:'var(--muted)', marginTop:8 }}>{t('avatarSending')}</p>}
          {error   && <p className="field-error" style={{ marginTop:8 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box avatar-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 14 }}>{t('avatarTitle')}</h3>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          {previewFromTab()}
        </div>

        <div className="avatar-tabs">
          <button className={tab==='upload' ? 'active':''} onClick={()=>{ setTab('upload'); setError(''); }}>{t('avatarTabFile')}</button>
          <button className={tab==='url'    ? 'active':''} onClick={()=>{ setTab('url');    setError(''); }}>{t('avatarTabUrl')}</button>
          <button className={tab==='letter' ? 'active':''} onClick={()=>{ setTab('letter'); setError(''); }}>{t('avatarTabLetter')}</button>
        </div>

        {tab === 'upload' && (
          <div className="avatar-tab-content">
            <div
              className={`avatar-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <span className="dropzone-icon">📷</span>
              <span className="dropzone-text"><strong>{t('avatarDropzoneTitle')}</strong><span> {t('avatarDropzoneSub')}</span></span>
              <span className="dropzone-sub">{t('avatarDropzoneFormats')}</span>
            </div>
            <input ref={fileRef} type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
              onChange={e => loadFile(e.target.files?.[0])}
              style={{ display:'none' }} />
            {error && <p className="field-error" style={{ marginTop:8 }}>{error}</p>}
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button className="avatar-btn-cancel" onClick={onClose}>{t('cancel')}</button>
              {!user?.avatar_url && user?.avatar_original_url && (
                <button className="avatar-btn-save" disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await updateAvatarFields({ avatar_url: user.avatar_original_url, avatar_type: 'upload' });
                      setTimeout(onClose, 800);
                    } catch(e) { setError(e.message); }
                    finally { setLoading(false); }
                  }}>
                  {loading ? '...' : t('avatarUseThisPhoto')}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="avatar-tab-content">
            <div className="field">
              <label>{t('avatarPhotoLink')}</label>
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
              <button className="avatar-btn-cancel" onClick={onClose}>{t('cancel')}</button>
              <button className="avatar-btn-save" disabled={loadingCrop || loading} onClick={handleUrlConfirm}>
                {loadingCrop ? '⏳...' : t('avatarContinue')}
              </button>
            </div>
          </div>
        )}

        {tab === 'letter' && (
          <div className="avatar-tab-content">
            <div className="color-pickers-row">
              <div className="color-picker-group">
                <label>{t('avatarColorBg')}</label>
                <input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)} className="big-color-picker" />
              </div>
              <div className="color-picker-group">
                <label>{t('avatarColorLetter')}</label>
                <input type="color" value={txtColor} onChange={e=>setTxtColor(e.target.value)} className="big-color-picker" />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="avatar-btn-cancel" onClick={onClose}>{t('cancel')}</button>
              <button className="avatar-btn-save" disabled={loading} onClick={saveLetter}>
                {loading ? '...' : t('save')}
              </button>
            </div>
          </div>
        )}

        {error   && <p className="field-error" style={{marginTop:8}}>{error}</p>}
        {success && <p style={{color:'#4ade80',textAlign:'center',marginTop:8}}>{t('avatarUpdated')}</p>}
      </div>
    </div>
  );
}

// ── Menu dropdown principal ───────────────────────────────────────────────────
export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t, lang } = useLang();
  const [open, setOpen]         = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const menuRef = useRef(null);

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
              {t('editAvatar')}
            </button>
            <button className="user-menu-item" onClick={() => { setShowPwd(true); setOpen(false); }}>
              {t('changePassword')}
            </button>
            <button className="user-menu-item user-menu-lang" onClick={() => { setShowLang(true); setOpen(false); }}>
              <span>{t('changeLanguage')}</span>
              <LangFlag code={lang} size={18} />
            </button>
            <div className="user-menu-divider" />
            <button className="user-menu-item user-menu-logout" onClick={() => { setOpen(false); logout(); }}>
              {t('logout')}
            </button>
          </div>
        )}
      </div>

      {showPwd    && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
      {showAvatar && <AvatarModal onClose={() => setShowAvatar(false)} />}
      {showLang   && <LanguagePickerModal onClose={() => setShowLang(false)} />}
    </>
  );
}
