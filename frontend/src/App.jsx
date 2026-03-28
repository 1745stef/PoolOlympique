import { useState, useCallback, useEffect, useRef } from 'react';
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
import ChatPage from './pages/ChatPage';
import InactivityWarning from './components/InactivityWarning';
import { settingsApi, authApi, chatApi, roomReadsApi } from './lib/api';
import { supabase } from './lib/supabase';
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
  const tabRef = useRef('picks'); // ref pour éviter closure stale dans Realtime
  const [unread, setUnread]       = useState({});
  const activeRoomIdRef           = useRef(null);
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  // Sync tabRef pour le channel Realtime (évite closure stale)
  useEffect(() => { tabRef.current = tab; }, [tab]);
  const [showWarning, setShowWarning] = useState(false);
  const [settings, setSettings] = useState({ inactivity_enabled: false, inactivity_timeout: 30, inactivity_warning: 2 });



  // Calcul initial des badges depuis room_reads DB
  const initUnreadBadges = useCallback(async (rooms) => {
    if (!rooms?.length || !user?.id) return;
    // Récupérer les last_read depuis DB
    const reads = await roomReadsApi.getAll().catch(() => []);
    const readMap = Object.fromEntries((reads || []).map(r => [r.room_id, r.last_read]));
    const counts = {};
    await Promise.all(rooms.map(async (room) => {
      const lastRead = readMap[room.id];
      if (!lastRead) { counts[room.id] = 0; return; }
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .is('deleted_at', null)
        .neq('user_id', user.id)
        .gt('created_at', lastRead);
      counts[room.id] = count || 0;
    }));
    setUnread(counts);
  }, [user?.id]);

  // Channel Realtime global dans App — survit aux changements d'onglet
  useEffect(() => {
    if (!user?.id) return;
    const globalChannel = supabase.channel('app:unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new;
          if (!m || m.deleted_at) return;
          if (m.user_id === user.id) return;
          const currentRoomId = activeRoomIdRef.current;
          if (m.room_id !== currentRoomId || tabRef.current !== 'chat') {
            setUnread(prev => ({ ...prev, [m.room_id]: (prev[m.room_id] || 0) + 1 }));
          }
        })
      .subscribe();
    return () => supabase.removeChannel(globalChannel);
  }, [user?.id]);

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
    <div className={`app${tab === 'chat' ? ' chat-active' : ''}`}>
      {showWarning && (
        <InactivityWarning
          warningMin={settings.inactivity_warning}
          onStayConnected={handleStayConnected}
          onLogout={handleLogout}
        />
      )}

      <div className="app-top">
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
        <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
          {t('navChat')}
          {totalUnread > 0 && <span className="nav-unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}
        </button>
        {getMyLevel(user) <= 3 && (
          <button className={`${tab === 'admin' ? 'active' : ''} admin-tab`} onClick={() => setTab('admin')}>{t('navAdmin')}</button>
        )}
        </nav>
      </div>

      <main className={`app-main${tab === 'chat' ? ' chat-active' : ''}`}>
        {tab === 'picks'       && <PicksPage />}
        {tab === 'results'     && <MyResultsPage />}
        {tab === 'leaderboard' && <LeaderboardPage />}
        {tab === 'medals'      && <MedalsPage />}
        {tab === 'chat' && <ChatPage unread={unread} setUnread={setUnread} activeRoomIdRef={activeRoomIdRef} onInit={initUnreadBadges} />}
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
