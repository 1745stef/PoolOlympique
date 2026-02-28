import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ── WebAuthn helpers ──────────────────────────────────────
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
  // Store credential ID in localStorage for this user
  const stored = JSON.parse(localStorage.getItem('passkeys') || '{}');
  stored[username] = {
    credentialId: bufferToBase64(credential.rawId),
    type: credential.type,
  };
  localStorage.setItem('passkeys', JSON.stringify(stored));
  return true;
}

async function authenticatePasskey(username) {
  const stored = JSON.parse(localStorage.getItem('passkeys') || '{}');
  const entry = stored[username];
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const options = {
    challenge,
    timeout: 60000,
    userVerification: 'required',
    rpId: RP_ID,
  };
  if (entry) {
    options.allowCredentials = [{ id: base64ToBuffer(entry.credentialId), type: 'public-key' }];
  }
  const assertion = await navigator.credentials.get({ publicKey: options });
  return assertion !== null;
}

// ── Component ─────────────────────────────────────────────
export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

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
        // Offer passkey after register
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
    if (!username.trim()) { setError("Entre ton nom d'utilisateur d'abord"); return; }
    setError('');
    setPasskeyLoading(true);
    try {
      const ok = await authenticatePasskey(username.toLowerCase());
      if (ok) {
        // Passkey verified locally — log in without password via special endpoint
        // For simplicity, we use a stored "remember token" approach
        const token = localStorage.getItem(`remember_${username.toLowerCase()}`);
        if (token) {
          localStorage.setItem('token', token);
          window.location.reload();
        } else {
          setError('Passkey valide mais aucune session sauvegardée. Connecte-toi une fois avec ton mot de passe.');
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('Authentification annulée');
      else setError('Face ID / Touch ID non disponible sur cet appareil');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!username.trim()) { setError("Entre ton nom d'utilisateur d'abord"); return; }
    setPasskeyLoading(true);
    try {
      await registerPasskey(username.toLowerCase());
      // Save current token as remember token
      const token = localStorage.getItem('token');
      if (token) localStorage.setItem(`remember_${username.toLowerCase()}`, token);
      setError('');
      alert('✅ Face ID / Touch ID activé pour ce compte !');
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('Activation annulée');
      else setError("Impossible d'activer Face ID sur cet appareil");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const showPasskeyBtn = WEBAUTHN_SUPPORTED && mode === 'login';
  const userHasPasskey = hasPasskey(username.toLowerCase());

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/la28-logo.png" alt="LA28" className="auth-la28-logo" />
          <p className="auth-subtitle">LOS ANGELES 2028</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Connexion</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Inscription</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nom d'utilisateur</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="ton_pseudo" required autoFocus autoCapitalize="none" />
          </div>

          <div className="field">
            <label>Mot de passe</label>
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
            {loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        {/* Face ID / Touch ID */}
        {showPasskeyBtn && (
          <div className="passkey-section">
            <div className="passkey-divider"><span>ou</span></div>
            {userHasPasskey ? (
              <button className="btn-passkey" onClick={handlePasskeyLogin} disabled={passkeyLoading}>
                {passkeyLoading ? '...' : (
                  <>
                    <span className="passkey-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z"/>
                      </svg>
                    </span>
                    Se connecter avec Face ID / Touch ID
                  </>
                )}
              </button>
            ) : username.trim() && (
              <button className="btn-passkey btn-passkey-setup" onClick={handlePasskeyRegister} disabled={passkeyLoading}>
                {passkeyLoading ? '...' : '🔐 Activer Face ID / Touch ID'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
