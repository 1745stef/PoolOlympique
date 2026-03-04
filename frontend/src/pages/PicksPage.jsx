import { useState, useEffect, useCallback } from 'react';
import { picksApi, olympicApi } from '../lib/api';
import { useLang } from '../hooks/useLanguage';
import { getDisciplineNameLang, getCountryNameLang } from '../data/i18n';
import { LA28_DISCIPLINES, isPickLocked, GAME_DATES } from '../data/disciplines';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function PicksPage() {
  const { t, lang } = useLang();
  const [picks, setPicks] = useState({});
  const [openDisc, setOpenDisc] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [search, setSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterUnpicked, setFilterUnpicked] = useState(false);

  useEffect(() => {
    Promise.all([picksApi.getAll(), olympicApi.getCountries()])
      .then(([myPicks, countries]) => {
        const map = {};
        myPicks.forEach(p => { map[p.discipline_id] = p.country_id; });
        setPicks(map);
        setAllCountries(countries);
      })
      .finally(() => { setLoading(false); setLoadingCountries(false); });
  }, []);

  const handleOpenDisc = useCallback((discId) => {
    setOpenDisc(prev => prev === discId ? null : discId);
    setCountrySearch('');
  }, []);

  const handlePick = async (disciplineId, countryId) => {
    if (isPickLocked(disciplineId)) return;
    const prev = picks[disciplineId];
    setSaving(disciplineId);
    try {
      if (prev === countryId) {
        await picksApi.delete(disciplineId);
        setPicks(p => { const n = { ...p }; delete n[disciplineId]; return n; });
      } else {
        await picksApi.upsert(disciplineId, countryId);
        setPicks(p => ({ ...p, [disciplineId]: countryId }));
      }
    } finally { setSaving(null); }
    setOpenDisc(null);
  };

  const pickedCount = Object.keys(picks).length;
  const total = LA28_DISCIPLINES.length;
  const pct = total > 0 ? Math.round((pickedCount / total) * 100) : 0;
  const circumference = 2 * Math.PI * 32;

  const filtered = LA28_DISCIPLINES.filter(d => {
    const discName = getDisciplineNameLang(d, lang);
    const matchSearch = discName.toLowerCase().includes(search.toLowerCase())
      || d.sport.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filterUnpicked || !picks[d.id];
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="loading">{t('loading')}</div>;

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
          <div className="progress-text">{pct}%</div>
        </div>
        <div>
          <h2>{t('myPicksTitle')}</h2>
          <p className="lock-info">🎯 {t('picksCompleted', { picked: pickedCount, total })}</p>
        </div>
      </div>

      <div className="picks-toolbar">
        <input className="search-input" style={{ flex: 1 }} type="text"
          placeholder={t('searchDiscipline')}
          value={search} onChange={e => setSearch(e.target.value)} />
        <button
          className={`btn-filter-unpicked ${filterUnpicked ? 'active' : ''}`}
          onClick={() => setFilterUnpicked(v => !v)}>
          {filterUnpicked ? `✓ ${t('filterUnpicked')}` : t('filterUnpicked')}
        </button>
      </div>

      <div className="disciplines-list">
        {filtered.map(disc => {
          const discName = getDisciplineNameLang(disc, lang);
          const pickedId = picks[disc.id];
          const locked = isPickLocked(disc.id);
          const isOpen = openDisc === disc.id;
          const isSaving = saving === disc.id;
          const pickedCountry = pickedId ? allCountries.find(c => c.id === pickedId) : null;
          const pickedNameLang = pickedCountry ? getCountryNameLang(pickedId, pickedCountry.name, lang) : null;
          const firstDate = GAME_DATES[String(disc.firstDay)];
          const filteredCountries = allCountries.filter(c =>
            getCountryNameLang(c.id, c.name, lang).toLowerCase().includes(countrySearch.toLowerCase())
          );

          return (
            <div key={disc.id} className={`discipline-card ${pickedId ? 'has-pick' : ''} ${isOpen ? 'open' : ''} ${locked && !pickedId ? 'locked-disc' : ''}`}>
              <button className="discipline-header" onClick={() => !locked && handleOpenDisc(disc.id)} disabled={locked && !pickedId}>
                <div className="disc-left">
                  <span className="disc-emoji">{disc.emoji}</span>
                  <div className="disc-text">
                    <span className="disc-name">{discName}</span>
                    <span className="disc-sport-tag">{disc.sport}</span>
                  </div>
                </div>
                <div className="disc-right">
                  {locked ? (
                    <span className="lock-badge">🔒</span>
                  ) : (
                    <span className="disc-deadline">{t('pickUntil', { date: firstDate })}</span>
                  )}
                  {isSaving
                    ? <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>⏳</span>
                    : pickedId ? (
                      <div className="picked-badge">
                        {pickedCountry?.flag_url && <img src={pickedCountry.flag_url} alt="" />}
                        <span>{pickedNameLang || pickedId}</span>
                      </div>
                    ) : !locked
                      ? <span className="no-pick">{t('pickChoose')}</span>
                      : null}
                  {!locked && <span className="chevron">{isOpen ? '▲' : '▼'}</span>}
                </div>
              </button>

              {isOpen && !locked && (
                <div className="discipline-countries">
                  <input
                    className="country-search"
                    type="text"
                    placeholder={t('filterCountry')}
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    autoFocus={!isMobile()}
                  />
                  {loadingCountries
                    ? <div className="loading-countries">{t('loading')}</div>
                    : (
                      <div className="country-grid">
                        {filteredCountries.map(country => (
                          <button key={country.id}
                            className={`country-btn ${pickedId === country.id ? 'selected' : ''}`}
                            onClick={() => handlePick(disc.id, country.id)} disabled={isSaving}>
                            {country.flag_url
                              ? <img src={country.flag_url} alt="" className="flag" />
                              : <span className="flag-placeholder">🏳</span>}
                            <span className="country-name">{getCountryNameLang(country.id, country.name, lang)}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && <span className="no-results">{t('noResults')}</span>}
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
