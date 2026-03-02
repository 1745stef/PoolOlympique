import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { leaderboardApi, olympicApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { getCountryName } from '../data/translations';
import { LA28_DISCIPLINES, getTodayGameDay, getDefaultDay, GAME_DATES, DISPLAY_DAYS } from '../data/disciplines';


// ── DayNav : composant isolé pour éviter les re-renders du parent ──────────
// memo() empêche le re-render si les props ne changent pas
// Le scroll est géré uniquement ICI, jamais depuis le parent
const DayNav = memo(({ selectedDay, todayDay, pickMap, onDayClick }) => {
  const navRef    = useRef(null);
  const activeRef = useRef(null);

  // À chaque fois que selectedDay change, scroll vers le bouton actif
  // On utilise scrollIntoView avec inline:'start' qui positionne à GAUCHE du container
  useEffect(() => {
    if (activeRef.current && navRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
        inline: 'start',
      });
      // Ajuster pour avoir 16px de marge gauche
      if (navRef.current.scrollLeft > 0) {
        navRef.current.scrollLeft = Math.max(0, navRef.current.scrollLeft - 16);
      }
    }
  }, [selectedDay]);

  return (
    <div className="day-nav" ref={navRef}>
      {DISPLAY_DAYS.map(day => {
        const isSelected = day === selectedDay;
        const isToday    = day === todayDay;
        const discsDay   = LA28_DISCIPLINES.filter(d => d.days.includes(day));
        const hasPick    = discsDay.some(d => pickMap[d.id]);
        const hasPoints  = discsDay.some(d => (pickMap[d.id]?.points || 0) > 0);
        return (
          <button
            key={day}
            ref={isSelected ? activeRef : null}
            className={`day-btn ${isSelected ? 'active' : ''} ${hasPoints ? 'has-points' : ''} ${isToday ? 'is-today' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <span className="day-num">J{day}</span>
            <span className="day-date-mini">{GAME_DATES[String(day)]?.replace(' juillet', '/07')}</span>
            {hasPick && !isSelected && <span className="day-pick-dot" />}
          </button>
        );
      })}
    </div>
  );
});

export default function MyResultsPage() {
  const { user } = useAuth();
  const [allPicks, setAllPicks]       = useState([]);
  const [results,  setResults]        = useState({});
  const [countries, setCountries]     = useState({});
  const [loading,  setLoading]        = useState(true);
  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  const [filter, setFilter]           = useState('all');
  const [tableOpen, setTableOpen]     = useState(true); // fold/extend
  useEffect(() => {
    Promise.all([leaderboardApi.get(), leaderboardApi.getResults(), olympicApi.getCountries()])
      .then(([picks, res, ctries]) => {
        setAllPicks(picks);
        const rMap = {};
        res.forEach(r => { rMap[r.discipline_id] = r; });
        setResults(rMap);
        const cMap = {};
        ctries.forEach(c => { cMap[c.id] = c; });
        setCountries(cMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDayClick = useCallback((day) => {
    setSelectedDay(day);
  }, []);

  const myPicks = allPicks.filter(p =>
    p.users?.username === user?.username || p.user_id === user?.id
  );
  const pickMap = {};
  myPicks.forEach(p => { pickMap[p.discipline_id] = p; });

  // Stats globales
  const totalPts = myPicks.reduce((sum, p) => sum + (p.points || 0), 0);
  let goldCount = 0, silverCount = 0, bronzeCount = 0;
  myPicks.forEach(p => {
    const r = results[p.discipline_id];
    if (!r) return;
    if (p.country_id === r.gold_country_id)   goldCount++;
    if (p.country_id === r.silver_country_id) silverCount++;
    if (p.country_id === r.bronze_country_id) bronzeCount++;
  });

  // Tableau filtré (#4)
  const withPoints  = myPicks.filter(p => (p.points || 0) > 0);
  const withPending = myPicks.filter(p => !results[p.discipline_id]);
  const tableRows = filter === 'points' ? withPoints
                  : filter === 'pending' ? withPending
                  : myPicks;

  // Liste du jour (#5) — résumé uniquement si jour de médaille
  const todayDay    = getTodayGameDay();
  const discsForDay = LA28_DISCIPLINES.filter(d => d.days.includes(selectedDay));
  const hasMedalToday = discsForDay.some(d => d.medalDay === selectedDay);
  const dayPts    = hasMedalToday ? discsForDay.reduce((sum, d) => sum + (pickMap[d.id]?.points || 0), 0) : null;
  const dayScored = hasMedalToday ? discsForDay.filter(d => (pickMap[d.id]?.points || 0) > 0).length : null;
  const dayPicked = discsForDay.filter(d => pickMap[d.id]).length;

  const getMedals = (pick) => {
    const r = results[pick.discipline_id];
    if (!r) return [];
    const m = [];
    if (pick.country_id === r.gold_country_id)   m.push({ icon: '🥇', label: 'Or',     cls: 'medal-or',     pts: 5 });
    if (pick.country_id === r.silver_country_id) m.push({ icon: '🥈', label: 'Argent', cls: 'medal-argent', pts: 3 });
    if (pick.country_id === r.bronze_country_id) m.push({ icon: '🥉', label: 'Bronze', cls: 'medal-bronze', pts: 1 });
    return m;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="my-results-page">

      {/* ══ 1. PASTILLES ══ */}
      <div className="medal-badges-row">
        <div className="medal-badge-card gold-card">
          <span className="medal-badge-icon">🥇</span>
          <span className="medal-badge-count">{goldCount}</span>
          <span className="medal-badge-label">Or</span>
        </div>
        <div className="medal-badge-card silver-card">
          <span className="medal-badge-icon">🥈</span>
          <span className="medal-badge-count">{silverCount}</span>
          <span className="medal-badge-label">Argent</span>
        </div>
        <div className="medal-badge-card bronze-card">
          <span className="medal-badge-icon">🥉</span>
          <span className="medal-badge-count">{bronzeCount}</span>
          <span className="medal-badge-label">Bronze</span>
        </div>
        <div className="medal-badge-card pts-card">
          <span className="medal-badge-icon">⭐</span>
          <span className="medal-badge-count">{totalPts}</span>
          <span className="medal-badge-label">Points</span>
        </div>
      </div>

      {/* ══ 2. BANDEAU J1–J19 ══ */}
      <DayNav
        selectedDay={selectedDay}
        todayDay={todayDay}
        pickMap={pickMap}
        onDayClick={handleDayClick}
      />

      {/* ══ 3. FILTRES (filtrent tableau #4) ══ */}
      <div className="lb-filters">
        <button className={filter === 'all'     ? 'active' : ''} onClick={() => setFilter('all')}>
          Tous ({myPicks.length})
        </button>
        <button className={filter === 'points'  ? 'active' : ''} onClick={() => setFilter('points')}>
          ✅ Avec points ({withPoints.length})
        </button>
        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
          ⏳ En attente ({withPending.length})
        </button>
      </div>

      {/* ══ 4. TABLEAU avec fold/extend ══ */}
      <div className="v6-table">
        {/* En-tête cliquable pour fold/extend */}
        <button className="v6-table-toggle" onClick={() => setTableOpen(v => !v)}>
          <div className="v6-table-header" style={{ flex: 1 }}>
            <span>Discipline</span>
            <span>Pays choisi</span>
            <span>Médailles</span>
            <span>Pts</span>
          </div>
          <span className={`v6-toggle-arrow ${tableOpen ? 'open' : ''}`}>▼</span>
        </button>

        {tableOpen && (
          <>
            {tableRows.length === 0 && (
              <div className="v6-table-empty">Aucun pronostic pour ce filtre.</div>
            )}
            {tableRows.map(pick => {
              const disc    = LA28_DISCIPLINES.find(d => d.id === pick.discipline_id);
              const result  = results[pick.discipline_id];
              const country = countries[pick.country_id];
              const pts     = pick.points || 0;
              const medals  = getMedals(pick);
              if (!disc) return null;
              return (
                <div key={pick.discipline_id} className={`v6-table-row ${pts > 0 ? 'v6-scored' : ''}`}>
                  <div className="v6-disc">
                    <span className="v6-emoji">{disc.emoji}</span>
                    <span className="v6-disc-name">{disc.nameFR}</span>
                  </div>
                  <div className="v6-country">
                    {country?.flag_url && <img src={country.flag_url} alt="" className="slot-flag" />}
                    <span>{getCountryName(pick.country_id, country?.name)}</span>
                  </div>
                  <div className="v6-medals">
                    {!result && <span className="v6-pending">⏳</span>}
                    {result && medals.length === 0 && <span className="v6-miss">✗ Raté</span>}
                    {medals.map((m, i) => (
                      <span key={i} className={`v6-medal-pill ${m.cls}`}>{m.icon} +{m.pts}pts</span>
                    ))}
                  </div>
                  <div className="v6-pts">
                    {pts > 0 && <strong className="v6-pts-val">{pts} PTS</strong>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ══ 5. LISTE DU JOUR ══ */}
      <div className={`day-header ${todayDay === selectedDay ? 'today' : ''}`} style={{ marginTop: 24 }}>
        <span className="day-label">Jour {selectedDay} — {GAME_DATES[String(selectedDay)]}</span>
        {todayDay !== null && todayDay === selectedDay && (
          <span className="today-badge">Aujourd'hui</span>
        )}
        {/* Résumé : médailles et points seulement si jour de médaille */}
        <span className="day-summary-mini">
          {dayPicked} pronostics
          {hasMedalToday && dayScored !== null && ` · ${dayScored} corrects · ${dayPts} pts`}
        </span>
      </div>

      <div className="day-disciplines">
        {discsForDay.length === 0 && (
          <div className="empty-state"><p>Aucune discipline ce jour.</p></div>
        )}
        {discsForDay.map(disc => {
          const pick    = pickMap[disc.id];
          const result  = results[disc.id];
          const pts     = pick?.points || 0;
          const country = pick ? countries[pick.country_id] : null;
          const isMedalDay = disc.medalDay === selectedDay;
          const medals  = pick ? getMedals(pick) : [];
          return (
            <div key={disc.id} className={`day-disc-row ${pts > 0 ? 'scored' : ''} ${!pick ? 'no-pick-row' : ''}`}>
              <div className="ddr-disc">
                <span className="disc-emoji-sm">{disc.emoji}</span>
                <div className="ddr-disc-text">
                  <span className="ddr-name">{disc.nameFR}</span>
                  {isMedalDay && <span className="medal-day-tag">🏅 Médaille</span>}
                </div>
              </div>
              <div className="ddr-pick">
                {pick ? (
                  <>
                    {country?.flag_url && <img src={country.flag_url} alt="" className="slot-flag" />}
                    <span className="ddr-country">{getCountryName(pick.country_id, country?.name)}</span>
                  </>
                ) : <span className="ddr-no-pick">—</span>}
              </div>
              <div className="ddr-result">
                {/* Résultat seulement si jour de médaille */}
                {isMedalDay && !result && pick && <span className="mr-pending">⏳</span>}
                {isMedalDay && result && medals.length === 0 && pick && <span className="mr-miss">✗ Raté</span>}
                {isMedalDay && medals.map((m, i) => (
                  <span key={i} className={`mr-medal-badge ${m.cls}`}>{m.icon} {m.label} +{m.pts}pts</span>
                ))}
              </div>
              <div className="ddr-pts">
                {isMedalDay && pts > 0 && <span className="pts-badge">{pts}pts</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
