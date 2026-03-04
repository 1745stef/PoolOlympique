import { useState } from 'react';
import { authApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';

export default function ChangePasswordPage() {
  const { updateUser } = useAuth();
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EyeIcon = ({ show }) => show ? (
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
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError(t('passwordMismatch'));
    if (password.length < 6) return setError(t('passwordTooShort'));
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
          <img src="/la28-logo.png" alt="LA28" className="auth-la28-logo" />
          <h1>{t('newPassword')}</h1>
          <p className="auth-subtitle change-pwd-notice">
            {t('tempPasswordDetected')}<br/>
            {t('chooseNewPassword')}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>{t('newPassword')}</label>
            <div className="pwd-wrapper">
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoFocus />
              <button type="button" className="pwd-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                <EyeIcon show={showPwd} />
              </button>
            </div>
          </div>
          <div className="field">
            <label>{t('confirmPassword')}</label>
            <div className="pwd-wrapper">
              <input type={showConfirm ? 'text' : 'password'} value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
              <button type="button" className="pwd-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '...' : t('savePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
