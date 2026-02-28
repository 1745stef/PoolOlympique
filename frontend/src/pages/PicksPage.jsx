import { useState, useEffect, useCallback } from 'react';
import { picksApi, olympicApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { getDisciplineName, getCountryName } from '../data/translations';

const LOCK_DATE = new Date(import.meta.env.VITE_LOCK_DATE || '2028-07-18T00:00:00Z');

export default function PicksPage() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState([]);
  const [picks, setPicks] = useState({});
  const [openDisc, setOpenDisc] = useState(null);
  const [discCountries, setDiscCountries] = useState({});
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [search, setSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLocked = new Date() >= LOCK_DATE;

  useEffect(() => {
    Promise.all([olympicApi.getDisciplines(), picksApi.getAll()])
      .then(([discs, myPicks]) => {
        setDisciplines(discs);
        const map = {};
        myPicks.forEach(p => { map[p.discipline_id] = p.country_id; });
        setPicks(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDisc = useCallback(async (discId) => {
    if (openDisc === discId) { setOpenDisc(null); return; }
    setOpenDisc(discId);
    setCountrySearch('');
    if (!discCountries[discId]) {
      setLoadingCountries(true);
      try {
        // Try discipline-specific countries first, fallback to all
        const disc = disciplines.find(d => d.id === discId);
        let countries = [];
        if (disc?.code) {
          countries = await olympicApi.getCountriesForDiscipline(disc.code);
        }
        if (!countries.length) {
          countries = await olympicApi.getDisciplines(); // fallback — will use cached
          countries = await olympicApi.getCountries();
        }
        setDiscCountries(prev => ({ ...prev, [discId]: countries }));
      } catch {
        const all = await olympicApi.getCountries();
        setDiscCountries(prev => ({ ...prev, [discId]: all }));
      } finally {
        setLoadingCountries(false);
      }
    }
  }, [openDisc, discCountries, disciplines]);

  const handlePick = async (disciplineId, countryId) => {
    if (isLocked) return;
    const prev = picks[disciplineId];
    if (prev === countryId) {
      setSaving(disciplineId);
      try {
        await picksApi.delete(disciplineId);
        setPicks(p => { const n = { ...p }; delete n[disciplineId]; return n; });
      } finally { setSaving(null); }
    } else {
      setSaving(disciplineId);
      try {
        await picksApi.upsert(disciplineId, countryId);
        setPicks(p => ({ ...p, [disciplineId]: countryId }));
      } finally { setSaving(null); }
    }
    setOpenDisc(null);
  };

  const pickedCount = Object.keys(picks).length;
  const total = disciplines.length;
  const pct = total > 0 ? Math.round((pickedCount / total) * 100) : 0;
  const circumference = 2 * Math.PI * 32;

  const filtered = disciplines.filter(d => {
    const nameFR = getDisciplineName(d.code, d.name);
    return nameFR.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="loading">Chargement des disciplines...</div>;

  return (
    <div className="picks-page">
      <div className="picks-header">
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ring-bg)" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--la-coral)" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (pct / 100) * circumference}
              strokeLinecap="round" transform="rotate(-90 40 40)" />
          </svg>
          <div className="progress-text">{pct}%<span>/{total}</span></div>
        </div>
        <div>
          <h2>Mes pronostics</h2>
          <p className="lock-info">
            {isLocked
              ? '🔒 Pronostics verrouillés'
              : `🎯 ${pickedCount} / ${total} disciplines complétées`}
          </p>
        </div>
      </div>

      <input className="search-input" type="text" placeholder="🔍 Rechercher une discipline..."
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="disciplines-list">
        {filtered.map(disc => {
          const pickedId = picks[disc.id];
          const countries = discCountries[disc.id] || [];
          const isOpen = openDisc === disc.id;
          const isSaving = saving === disc.id;
          const nameFR = getDisciplineName(disc.code, disc.name);

          const pickedCountry = pickedId ? countries.find(c => c.id === pickedId) : null;
          const pickedNameFR = pickedCountry ? getCountryName(pickedId, pickedCountry.name) : null;

          const filteredCountries = countries.filter(c => {
            const nameFRc = getCountryName(c.id, c.name);
            return nameFRc.toLowerCase().includes(countrySearch.toLowerCase());
          });

          return (
            <div key={disc.id} className={`discipline-card ${pickedId ? 'has-pick' : ''} ${isOpen ? 'open' : ''}`}>
              <button className="discipline-header" onClick={() => handleOpenDisc(disc.id)} disabled={isLocked && !pickedId}>
                <div className="disc-left">
                  {disc.pictogram_url && <img src={disc.pictogram_url} alt={nameFR} className="disc-pictogram" />}
                  <span className="disc-name">{nameFR}</span>
                </div>
                <div className="disc-right">
                  {isSaving ? (
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>⏳</span>
                  ) : pickedId ? (
                    <div className="picked-badge">
                      {pickedCountry?.flag_url && <img src={pickedCountry.flag_url} alt="" />}
                      <span>{pickedNameFR || pickedId}</span>
                    </div>
                  ) : (
                    <span className="no-pick">Choisir un pays</span>
                  )}
                  {!isLocked && <span className="chevron">{isOpen ? '▲' : '▼'}</span>}
                </div>
              </button>

              {isOpen && (
                <div className="discipline-countries">
                  <input className="country-search" type="text" placeholder="Filtrer un pays..."
                    value={countrySearch} onChange={e => setCountrySearch(e.target.value)} autoFocus />
                  {loadingCountries && !countries.length ? (
                    <div className="loading-countries">Chargement des pays...</div>
                  ) : (
                    <div className="country-grid">
                      {filteredCountries.map(country => {
                        const countryNameFR = getCountryName(country.id, country.name);
                        return (
                          <button key={country.id}
                            className={`country-btn ${pickedId === country.id ? 'selected' : ''}`}
                            onClick={() => handlePick(disc.id, country.id)}
                            disabled={isSaving}>
                            {country.flag_url
                              ? <img src={country.flag_url} alt={countryNameFR} className="flag" />
                              : <span className="flag-placeholder">🏳</span>}
                            <span className="country-name">{countryNameFR}</span>
                          </button>
                        );
                      })}
                      {filteredCountries.length === 0 && <span className="no-results">Aucun résultat</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
