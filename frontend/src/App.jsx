import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider, useLang } from './hooks/useLanguage';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import AuthPage from './pages/AuthPage';
import PicksPage from './pages/PicksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MyResultsPage from './pages/MyResultsPage';
import UserMenu from './components/UserMenu';
import MedalsPage from './pages/MedalsPage';
import InactivityWarning from './components/InactivityWarning';
import { settingsApi, authApi } from './lib/api';
import './styles.css';

function getMyLevel(user) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 99;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.role_level ?? (payload.is_admin ? 2 : 99);
  } catch { return 99; }
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState('picks');
  const [showWarning, setShowWarning] = useState(false);
  const [settings, setSettings] = useState({ inactivity_enabled: false, inactivity_timeout: 30, inactivity_warning: 2 });

  // Charger les settings au démarrage
  useEffect(() => {
    settingsApi.get()
      .then(s => setSettings(s))
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    try { await authApi.logout(); } catch {}
    logout();
  }, [logout]);

  const handleWarn = useCallback(() => {
    setShowWarning(true);
  }, []);

  const handleStayConnected = useCallback(() => {
    setShowWarning(false);
    resetTimers();
  }, []);

  const { resetTimers } = useInactivityTimer({
    enabled: !!user && settings.inactivity_enabled,
    timeoutMin: settings.inactivity_timeout,
    warningMin: settings.inactivity_warning,
    onWarn: handleWarn,
    onLogout: handleLogout,
  });

  if (loading) return (
    <div className="splash">
      <img src="/la28-logo.png" alt="LA28" className="splash-logo" />
    </div>
  );

  if (!user) return <AuthPage />;
  if (user.must_change_password) return <ChangePasswordPage />;

  return (
    <div className="app">
      {showWarning && (
        <InactivityWarning
          warningMin={settings.inactivity_warning}
          onStayConnected={handleStayConnected}
          onLogout={handleLogout}
        />
      )}

      <header className="app-header">
        <div className="header-left">
          <img src="/la28-logo.png" alt="LA28" className="header-logo" />
          <div>
            <h1>{t('appTitle')}</h1>
            <span className="edition">{t('appEdition')}</span>
          </div>
        </div>
        <div className="header-right"><UserMenu /></div>
      </header>

      <nav className="app-nav">
        <button className={tab === 'picks' ? 'active' : ''} onClick={() => setTab('picks')}>{t('navPicks')}</button>
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>{t('navResults')}</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>{t('navLeaderboard')}</button>
        <button className={tab === 'medals' ? 'active' : ''} onClick={() => setTab('medals')}>{t('navMedals')}</button>
        {getMyLevel(user) <= 3 && (
          <button className={`${tab === 'admin' ? 'active' : ''} admin-tab`} onClick={() => setTab('admin')}>{t('navAdmin')}</button>
        )}
      </nav>

      <main className="app-main">
        {tab === 'picks'       && <PicksPage />}
        {tab === 'results'     && <MyResultsPage />}
        {tab === 'leaderboard' && <LeaderboardPage />}
        {tab === 'medals'      && <MedalsPage />}
        {tab === 'admin'       && getMyLevel(user) <= 3 && <AdminPage onSettingsChange={setSettings} />}
      </main>
    </div>
  );
}

function AppWithProviders() {
  const [userLang, setUserLang] = useState(null);
  const handleUserLang = useCallback((lang) => setUserLang(lang), []);

  return (
    <LanguageProvider initialLang={userLang}>
      <AuthProvider onUserLang={handleUserLang}>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default function App() {
  return <AppWithProviders />;
}
