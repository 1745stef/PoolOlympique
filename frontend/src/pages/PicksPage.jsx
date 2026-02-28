import { useState, useEffect, useCallback } from 'react';
import { olympicApi, picksApi } from '../lib/api';
import CountrySelector from '../components/CountrySelector';

const LOCK_DATE = new Date(import.meta.env.VITE_LOCK_DATE || '2028-07-18T00:00:00Z');

export default function PicksPage() {
  const [disciplines, setDisciplines] = useState([]);
  const [countries, setCountries] = useState([]);
  const [picks, setPicks] = useState({}); // { discipline_id: country_id }
  const [activeDiscipline, setActiveDiscipline] = useState(null);
  const [disciplineCountries, setDisciplineCountries] = useState([]);
  const [loadingDiscipline, setLoadingDiscipline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  const locked = new Date() >= LOCK_DATE;
  const completed = Object.keys(picks).length;

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2500);
  };

  useEffect(() => {
    Promise.all([
      olympicApi.getDisciplines(),
      olympicApi.getCountries(),
      picksApi.getAll(),
    ]).then(([discs, ctries, userPicks]) => {
      setDisciplines(discs);
      setCountries(ctries);
      const map = {};
      userPicks.forEach((p) => { map[p.discipline_id] = p.country_id; });
      setPicks(map);
    });
  }, []);

  const openDiscipline = useCallback(async (disc) => {
    if (activeDiscipline?.id === disc.id) {
      setActiveDiscipline(null);
      return;
    }
    setActiveDiscipline(disc);
    setLoadingDiscipline(true);
    try {
      const dc = await olympicApi.getCountriesForDiscipline(disc.id);
      setDisciplineCountries(dc.length > 0 ? dc : countries.slice(0, 30));
    } catch {
      setDisciplineCountries(countries.slice(0, 30));
    } finally {
      setLoadingDiscipline(false);
    }
  }, [activeDiscipline, countries]);

  const handlePick = async (disciplineId, countryId) => {
    if (locked) return;
    setSaving(true);
    try {
      if (picks[disciplineId] === countryId) {
        await picksApi.delete(disciplineId);
        setPicks((prev) => { const n = { ...prev }; delete n[disciplineId]; return n; });
        notify('Pronostic retiré', 'info');
      } else {
        await picksApi.upsert(disciplineId, countryId);
        setPicks((prev) => ({ ...prev, [disciplineId]: countryId }));
        notify('✓ Pronostic enregistré !');
      }
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = disciplines.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPickedCountry = (disciplineId) => {
    const countryId = picks[disciplineId];
    if (!countryId) return null;
    return countries.find((c) => c.id === countryId) || { id: countryId, name: countryId };
  };

  return (
    <div className="picks-page">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <div className="picks-header">
        <div className="progress-ring-container">
          <svg className="progress-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--ring-bg)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none" stroke="var(--gold)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - completed / Math.max(disciplines.length, 1))}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="progress-text">{completed}<span>/{disciplines.length}</span></span>
        </div>
        <div>
          <h2>Tes pronostics</h2>
          <p className="lock-info">
            {locked
              ? '🔒 Les pronostics sont verrouillés'
              : `🔓 Modifiable jusqu'au ${LOCK_DATE.toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`}
          </p>
        </div>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="🔍 Rechercher une discipline..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="disciplines-list">
        {filtered.map((disc) => {
          const picked = getPickedCountry(disc.id);
          const isOpen = activeDiscipline?.id === disc.id;

          return (
            <div key={disc.id} className={`discipline-card ${isOpen ? 'open' : ''} ${picked ? 'has-pick' : ''}`}>
              <button
                className="discipline-header"
                onClick={() => openDiscipline(disc)}
                disabled={locked && !picked}
              >
                <div className="disc-left">
                  {disc.pictogram_url && (
                    <img src={disc.pictogram_url} alt={disc.name} className="disc-pictogram" />
                  )}
                  <span className="disc-name">{disc.name}</span>
                </div>
                <div className="disc-right">
                  {picked ? (
                    <div className="picked-badge">
                      {picked.flag_url && <img src={picked.flag_url} alt={picked.name} />}
                      <span>{picked.name}</span>
                    </div>
                  ) : (
                    <span className="no-pick">— Choisir —</span>
                  )}
                  <span className="chevron">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="discipline-countries">
                  {loadingDiscipline ? (
                    <div className="loading-countries">Chargement des pays...</div>
                  ) : (
                    <CountrySelector
                      countries={disciplineCountries}
                      selected={picks[disc.id]}
                      onSelect={(countryId) => handlePick(disc.id, countryId)}
                      locked={locked}
                      saving={saving}
                    />
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
