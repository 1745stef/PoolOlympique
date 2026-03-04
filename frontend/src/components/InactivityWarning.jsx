import { useState, useEffect } from 'react';
import { useLang } from '../hooks/useLanguage';

export default function InactivityWarning({ warningMin = 2, onStayConnected, onLogout }) {
  const { t } = useLang();
  const [seconds, setSeconds] = useState(warningMin * 60);

  useEffect(() => {
    setSeconds(warningMin * 60);
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(interval); onLogout(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [warningMin, onLogout]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card inactivity-modal">
        <div className="inactivity-icon">⏱️</div>
        <h3>{t('inactivityTitle')}</h3>
        <p>{t('inactivityMessage')}</p>
        <div className="inactivity-countdown">{display}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onStayConnected}>
            {t('inactivityStay')}
          </button>
          <button className="btn-edit" onClick={onLogout}>
            {t('inactivityLogout')}
          </button>
        </div>
      </div>
    </div>
  );
}
