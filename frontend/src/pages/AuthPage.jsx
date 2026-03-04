import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';
import LanguagePickerModal, { LangFlag } from '../components/LanguagePicker';
import { LANGUAGES } from '../data/i18n';

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
function base64ToBuffer(base64) {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

const WEBAUTHN_SUPPORTED = typeof window !== 'undefined' && !!window.PublicKeyCredential;
const RP_ID = window.location.hostname;
const RP_NAME = 'Pool Olympique LA 2028';

async function registerPasskey(username) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(username);
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME, id: RP_ID },
      user: { id: userId, name: username, displayName: username },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' },
      timeout: 60000,
    }
  });
  const stored = JSON.parse(localStorage.getItem('passkeys') || '{}');
  stored[username] = { credentialId: bufferToBase64(credential.rawId), type: credential.type };
  localStorage.setItem('passkeys', JSON.stringify(stored));
  return true;
}

async function authenticatePasskey(username) {
  const stored = JSON.parse(localStorage.getItem('passkeys') || '{}');
  const entry = stored[username];
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const options = { challenge, timeout: 60000, userVerification: 'required', rpId: RP_ID };
  if (entry) {
    options.allowCredentials = [{ id: base64ToBuffer(entry.credentialId), type: 'public-key' }];
  }
  const assertion = await navigator.credentials.get({ publicKey: options });
  return assertion !== null;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const { t, lang } = useLang();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const hasPasskey = (user) => {
    const stored = JSON.parse(localStorage.getItem('passkeys') || '{}');
    return !!stored[user];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.toLowerCase(), password);
      } else {
        await register(username.toLowerCase(), password);
        if (WEBAUTHN_SUPPORTED) {
          try { await registerPasskey(username.toLowerCase()); } catch { /* optional */ }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!username.trim()) { setError(t('enterUsernameFirst')); return; }
    setError('');
    setPasskeyLoading(true);
    try {
      const ok = await authenticatePasskey(username.toLowerCase());
      if (ok) {
        const token = localStorage.getItem(`remember_${username.toLowerCase()}`);
        if (token) {
          localStorage.setItem('token', token);
          window.location.reload();
        } else {
          setError(t('passkeyNoSession'));
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') setError(t('authCancelled'));
      else setError(t('faceIdNotAvailable'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!username.trim()) { setError(t('enterUsernameFirst')); return; }
    setPasskeyLoading(true);
    try {
      await registerPasskey(username.toLowerCase());
      const token = localStorage.getItem('token');
      if (token) localStorage.setItem(`remember_${username.toLowerCase()}`, token);
      setError('');
      alert(t('faceIdActivated'));
    } catch (err) {
      if (err.name === 'NotAllowedError') setError(t('faceIdActivationCancelled'));
      else setError(t('faceIdCannotActivate'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const showPasskeyBtn = WEBAUTHN_SUPPORTED && mode === 'login';
  const userHasPasskey = hasPasskey(username.toLowerCase());
  const currentLang = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Sélecteur de langue en haut à droite */}
        <button className="auth-lang-btn" onClick={() => setShowLangPicker(true)} title="Langue / Language">
          <LangFlag code={lang} size={20} />
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 4 }}>{currentLang?.label}</span>
        </button>

        <div className="auth-logo">
          <img src="/la28-logo.png" alt="LA28" className="auth-la28-logo" />
          <p className="auth-subtitle">LOS ANGELES 2028</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>{t('login')}</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>{t('register')}</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('username')}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={t('usernamePlaceholder')} required autoFocus autoCapitalize="none" />
          </div>

          <div className="field">
            <label>{t('password')}</label>
            <div className="pwd-wrapper">
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" className="pwd-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : mode === 'login' ? t('loginBtn') : t('registerBtn')}
          </button>
        </form>

        {showPasskeyBtn && (
          <div className="passkey-section">
            <div className="passkey-divider"><span>{t('orDivider')}</span></div>
            {userHasPasskey ? (
              <button className="btn-passkey" onClick={handlePasskeyLogin} disabled={passkeyLoading}>
                {passkeyLoading ? '...' : (
                  <>
                    <span className="passkey-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z"/>
                      </svg>
                    </span>
                    {t('faceIdLogin')}
                  </>
                )}
              </button>
            ) : username.trim() && (
              <button className="btn-passkey btn-passkey-setup" onClick={handlePasskeyRegister} disabled={passkeyLoading}>
                {passkeyLoading ? '...' : t('faceIdEnable')}
              </button>
            )}
          </div>
        )}
      </div>

      {showLangPicker && <LanguagePickerModal onClose={() => setShowLangPicker(false)} />}
    </div>
  );
}
