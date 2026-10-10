import { useState } from 'react';
import '../owner.css';
import '../bingo.css';
import BingoAdmin from '../bingo/BingoAdmin';
import BingoPlayer from '../bingo/BingoPlayer';

// role : 'admin' (édite et révèle) ou 'player' (voit les cases révélées en direct)
export default function BingoPage({ role, label, onExit }) {
  const [view, setView] = useState(role === 'admin' ? 'admin' : 'player');

  return (
    <div className="owner-page">
      <div className="owner-topbar">
        <div className="owner-topbar-brand">
          <span className="owner-topbar-logo">🎯</span>
          <span className="owner-topbar-title">{label || 'Bingo'}</span>
        </div>
        <div style={{ flex: 1 }} />
        {role === 'admin' && (
          <button className="owner-exit-btn" style={{ marginRight: 8 }}
            onClick={() => setView(v => (v === 'admin' ? 'player' : 'admin'))}>
            {view === 'admin' ? '👀 Vue joueur' : '🛠 Vue admin'}
          </button>
        )}
        <button className="owner-exit-btn" onClick={onExit}>← App</button>
      </div>
      <div className="owner-main">
        {view === 'admin' ? <BingoAdmin /> : <BingoPlayer />}
      </div>
    </div>
  );
}
