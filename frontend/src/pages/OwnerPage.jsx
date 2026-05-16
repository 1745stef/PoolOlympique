import { useState } from 'react';
import '../owner.css';
import MembersSection from '../owner/MembersSection';
import GrocerySection from '../owner/GrocerySection';

const NAV_ITEMS = [
  { id: 'members', label: 'Membres',  icon: '👨‍👩‍👧‍👦' },
  { id: 'grocery', label: 'Listes', icon: '📋' },
  { id: 'notes',   label: 'Notes',    icon: '📝' },
  { id: 'agenda',  label: 'Agenda',   icon: '📅' },
];

export default function OwnerPage({ onExit }) {
  const [section, setSection] = useState('members');

  return (
    <div className="owner-page">

      {/* Topbar */}
      <div className="owner-topbar">
        <div className="owner-topbar-brand">
          <span className="owner-topbar-logo">🏠</span>
          <span className="owner-topbar-title">Espace Famille</span>
        </div>

        <nav className="owner-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`owner-nav-btn${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span className="owner-nav-icon">{item.icon}</span>
              <span className="owner-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="owner-exit-btn" onClick={onExit}>← App</button>
      </div>

      {/* Contenu */}
      <div className="owner-main">
        {section === 'members' && <MembersSection />}
        {section === 'grocery' && <GrocerySection />}
        {section === 'notes'   && <div className="owner-coming-soon">📝 Notes — bientôt</div>}
        {section === 'agenda'  && <div className="owner-coming-soon">📅 Agenda — bientôt</div>}
      </div>

    </div>
  );
}
