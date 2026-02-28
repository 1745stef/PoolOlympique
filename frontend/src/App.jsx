import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import PicksPage from './pages/PicksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
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

  // Forcer le changement de mot de passe
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
        <div className="header-right">
          <span className="welcome">Bonjour, <strong>{user.username}</strong></span>
          <button className="btn-logout" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <nav className="app-nav">
        <button className={tab === 'picks' ? 'active' : ''} onClick={() => setTab('picks')}>🎯 Mes pronostics</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>🏆 Classement</button>
        {user.is_admin && (
          <button className={`${tab === 'admin' ? 'active' : ''} admin-tab`} onClick={() => setTab('admin')}>🔑 Administration</button>
        )}
      </nav>

      <main className="app-main">
        {tab === 'picks' && <PicksPage />}
        {tab === 'leaderboard' && <LeaderboardPage />}
        {tab === 'admin' && user.is_admin && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
