import { useState } from 'react';

export default function CountrySelector({ countries, selected, onSelect, locked, saving }) {
  const [search, setSearch] = useState('');

  const filtered = countries.filter((c) =>
    (c.name || c.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="country-selector">
      <input
        className="country-search"
        type="text"
        placeholder="Filtrer un pays..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="country-grid">
        {filtered.map((country) => (
          <button
            key={country.id}
            className={`country-btn ${selected === country.id ? 'selected' : ''}`}
            onClick={() => !locked && !saving && onSelect(country.id)}
            disabled={locked || saving}
            title={country.name || country.id}
          >
            {country.flag_url ? (
              <img src={country.flag_url} alt={country.name} className="flag" />
            ) : (
              <span className="flag-placeholder">🏳</span>
            )}
            <span className="country-name">{country.name || country.id}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="no-results">Aucun pays trouvé</p>
        )}
      </div>
    </div>
  );
}
