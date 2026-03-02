import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import PicksPage from './pages/PicksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MyResultsPage from './pages/MyResultsPage';
import UserMenu from './components/UserMenu';
import MedalsPage from './pages/MedalsPage';
import './styles.css';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState('picks');

  if (loading) return (
    <div className="splash">
      <img src="/la28-logo.png" alt="LA28" className="splash-logo" />
    </div>
  );

  if (!user) return <AuthPage />;
  if (user.must_change_password) return <ChangePasswordPage />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <img src="/la28-logo.png" alt="LA28" className="header-logo" />
          <div>
            <h1>Pool Olympique</h1>
            <span className="edition">Los Angeles 2028</span>
          </div>
        </div>
        <div className="header-right"><UserMenu /></div>
      </header>

      <nav className="app-nav">
        <button className={tab === 'picks' ? 'active' : ''} onClick={() => setTab('picks')}>🎯 Pronostics</button>
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>📊 Mes résultats</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>🏆 Classement</button>
        <button className={tab === 'medals' ? 'active' : ''} onClick={() => setTab('medals')}>🥇 Médailles</button>
        {user.is_admin && (
          <button className={`${tab === 'admin' ? 'active' : ''} admin-tab`} onClick={() => setTab('admin')}>🔑 Administration</button>
        )}
      </nav>

      <main className="app-main">
        {tab === 'picks'       && <PicksPage />}
        {tab === 'results'     && <MyResultsPage />}
        {tab === 'leaderboard' && <LeaderboardPage />}
        {tab === 'medals'      && <MedalsPage />}
        {tab === 'admin'       && user.is_admin && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
