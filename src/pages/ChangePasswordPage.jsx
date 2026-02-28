import { useState } from 'react';
import { authApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function ChangePasswordPage() {
  const { updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas');
    if (password.length < 6) return setError('Minimum 6 caractères');
    setLoading(true);
    try {
      const data = await authApi.changePassword(password);
      localStorage.setItem('token', data.token);
      updateUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/la28-logo.svg" alt="LA28" className="auth-la28-logo" />
          <h1>Nouveau mot de passe</h1>
          <p className="auth-subtitle change-pwd-notice">
            🔒 Tu utilises un mot de passe temporaire.<br />
            Choisis un nouveau mot de passe pour continuer.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoFocus />
          </div>
          <div className="field">
            <label>Confirmer le mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : 'Enregistrer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
