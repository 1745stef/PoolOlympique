import '../owner.css';

// Page réservée aux usagers autorisés (voir Admin → Paramètres → Bouton page privée).
// Pour protéger les données côté serveur, utilise requirePartnerAccess sur les routes
// du backend : app.get('/ma-route', authMiddleware, requirePartnerAccess, ...)
export default function PrivatePage({ label, onExit }) {
  return (
    <div className="owner-page">
      <div className="owner-topbar">
        <div className="owner-topbar-brand">
          <span className="owner-topbar-logo">🔒</span>
          <span className="owner-topbar-title">{label || 'Ma page'}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button className="owner-exit-btn" onClick={onExit}>← App</button>
      </div>
      <div className="owner-main">
        <div className="owner-coming-soon">Page à construire</div>
      </div>
    </div>
  );
}
