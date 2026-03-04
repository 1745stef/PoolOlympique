import { useState, useEffect } from 'react';
import { leaderboardApi, olympicApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { getCountryName } from '../data/translations';
import { LA28_DISCIPLINES, DISCIPLINES_MAP } from '../data/disciplines';

export default function MedalsPage() {
  const { user, setFavoriteCountry } = useAuth();
  const [results, setResults]         = useState([]);
  const [countries, setCountries]     = useState({});
  const [allCountriesList, setAllCountriesList] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sort, setSort]               = useState('olympic');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    Promise.all([leaderboardApi.getResults(), olympicApi.getCountries()])
      .then(([res, ctries]) => {
        setResults(res);
        const cMap = {};
        ctries.forEach(c => { cMap[c.id] = c; });
        setCountries(cMap);
        const sorted = [...ctries].sort((a, b) =>
          getCountryName(a.id, a.name).localeCompare(getCountryName(b.id, b.name), 'fr')
        );
        setAllCountriesList(sorted);
        // Charger la préférence sauvegardée
        if (user?.favorite_country) setSelectedCountry(user.favorite_country);
      })
      .finally(() => setLoading(false));
  }, []);

  // Tableau des nations
  const nationMap = {};
  results.forEach(r => {
    const add = (id, medal) => {
      if (!id) return;
      if (!nationMap[id]) nationMap[id] = { id, gold: 0, silver: 0, bronze: 0 };
      nationMap[id][medal]++;
    };
    add(r.gold_country_id,   'gold');
    add(r.silver_country_id, 'silver');
    add(r.bronze_country_id, 'bronze');
  });

  const allNations = allCountriesList.map(c => nationMap[c.id] || { id: c.id, gold: 0, silver: 0, bronze: 0 });
  const sorted = [...allNations].sort((a, b) => {
    const aTotal = a.gold + a.silver + a.bronze;
    const bTotal = b.gold + b.silver + b.bronze;
    if (aTotal === 0 && bTotal === 0)
      return getCountryName(a.id, countries[a.id]?.name).localeCompare(getCountryName(b.id, countries[b.id]?.name), 'fr');
    if (aTotal === 0) return 1;
    if (bTotal === 0) return -1;
    if (sort === 'olympic') {
      if (b.gold   !== a.gold)   return b.gold   - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    } else {
      // Total d'abord, puis or → argent → bronze comme départage
      if (bTotal !== aTotal)   return bTotal   - aTotal;
      if (b.gold   !== a.gold)   return b.gold   - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    }
    return getCountryName(a.id, countries[a.id]?.name).localeCompare(getCountryName(b.id, countries[b.id]?.name), 'fr');
  });

  // Rang ex-aequo — la clé inclut or/argent/bronze dans les deux modes
  let currentRank = 0, prevKey = null;
  const rankedNations = sorted.map((n, i) => {
    const total = n.gold + n.silver + n.bronze;
    if (total === 0) return { ...n, rank: null };
    const key = `${total}-${n.gold}-${n.silver}-${n.bronze}`;
    if (key !== prevKey) { currentRank = i + 1; prevKey = key; }
    return { ...n, rank: currentRank };
  });

  // Détail pays sélectionné
  const countryResults = selectedCountry
    ? results.filter(r =>
        r.gold_country_id === selectedCountry ||
        r.silver_country_id === selectedCountry ||
        r.bronze_country_id === selectedCountry)
    : [];

  const handleCountryChange = async (e) => {
    const val = e.target.value;
    setSelectedCountry(val);
    setSaving(true);
    try { await setFavoriteCountry(val || null); }
    catch { /* silencieux */ }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Chargement des médailles...</div>;

  if (results.length === 0) return (
    <div className="empty-state" style={{ marginTop: 40 }}>
      <p style={{ fontSize: '2rem' }}>🏅</p>
      <p>Les médailles apparaîtront ici une fois les résultats saisis par l'admin.</p>
    </div>
  );

  return (
    <div className="medals-page">
      <div className="medals-layout">

        {/* ══ GAUCHE : Tableau des nations ══ */}
        <div className="medals-left">
          <div className="medals-header">
            <h3>🌍 Tableau des médailles</h3>
            <div className="medals-sort-btns">
              <button className={sort === 'olympic' ? 'active' : ''} onClick={() => setSort('olympic')}>Classement olympique</button>
              <button className={sort === 'total'   ? 'active' : ''} onClick={() => setSort('total')}>Total médailles</button>
            </div>
          </div>
          <div className="nations-table-wrap">
            <div className="nations-header">
              <span>#</span>
              <span>Pays</span>
              <span className="medal-col gold-col">🥇</span>
              <span className="medal-col silver-col">🥈</span>
              <span className="medal-col bronze-col">🥉</span>
              <span className="medal-col total-col">Total</span>
            </div>
            <div className="nations-scroll">
              {rankedNations.map((n) => {
                const country = countries[n.id];
                const total   = n.gold + n.silver + n.bronze;
                return (
                  <div key={n.id} className={`nation-row ${!total ? 'no-medal-row' : ''} ${n.rank === 1 ? 'top-1' : n.rank === 2 ? 'top-2' : n.rank === 3 ? 'top-3' : ''}`}>
                    <span className="nation-rank">
                      {n.rank === 1 ? '🥇' : n.rank === 2 ? '🥈' : n.rank === 3 ? '🥉' : n.rank ? `#${n.rank}` : '—'}
                    </span>
                    <span className="nation-name">
                      {country?.flag_url && <img src={country.flag_url} alt="" className="nation-flag" />}
                      {getCountryName(n.id, country?.name)}
                    </span>
                    <span className="medal-col">{n.gold   > 0 ? <span className="gold-val">{n.gold}</span>   : <span className="no-medal-dash">—</span>}</span>
                    <span className="medal-col">{n.silver > 0 ? <span className="silver-val">{n.silver}</span> : <span className="no-medal-dash">—</span>}</span>
                    <span className="medal-col">{n.bronze > 0 ? <span className="bronze-val">{n.bronze}</span> : <span className="no-medal-dash">—</span>}</span>
                    <span className="medal-col total-val">{total > 0 ? total : <span className="no-medal-dash">—</span>}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ DROITE : Médailles par pays (dropdown sauvegardé) ══ */}
        <div className="medals-right">
          <div className="medals-header">
            <h3>🔍 Mon pays favori</h3>
            {saving && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>💾 Sauvegarde...</span>}
          </div>

          <div className="country-dropdown-wrap">
            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Ton pays favori — sauvegardé sur ton compte
            </label>
            <select className="country-dropdown" value={selectedCountry} onChange={handleCountryChange}>
              <option value="">— Sélectionner un pays —</option>
              {allCountriesList.map(c => (
                <option key={c.id} value={c.id}>{getCountryName(c.id, c.name)}</option>
              ))}
            </select>
          </div>

          {selectedCountry && countryResults.length === 0 && (
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <p>Aucune médaille pour ce pays pour l'instant.</p>
            </div>
          )}

          {selectedCountry && countryResults.length > 0 && (
            <div className="country-detail">
              <div className="country-detail-header">
                {countries[selectedCountry]?.flag_url && (
                  <img src={countries[selectedCountry].flag_url} alt="" className="country-detail-flag" />
                )}
                <h4>{getCountryName(selectedCountry, countries[selectedCountry]?.name)}</h4>
                <div className="country-detail-counts">
                  {nationMap[selectedCountry]?.gold   > 0 && <span className="gold-val">🥇 {nationMap[selectedCountry].gold}</span>}
                  {nationMap[selectedCountry]?.silver > 0 && <span className="silver-val">🥈 {nationMap[selectedCountry].silver}</span>}
                  {nationMap[selectedCountry]?.bronze > 0 && <span className="bronze-val">🥉 {nationMap[selectedCountry].bronze}</span>}
                </div>
              </div>
              <div className="country-disc-list">
                {countryResults.map(r => {
                  const disc = DISCIPLINES_MAP[r.discipline_id];
                  const medals = [];
                  if (r.gold_country_id   === selectedCountry) medals.push({ icon: '🥇', cls: 'medal-or' });
                  if (r.silver_country_id === selectedCountry) medals.push({ icon: '🥈', cls: 'medal-argent' });
                  if (r.bronze_country_id === selectedCountry) medals.push({ icon: '🥉', cls: 'medal-bronze' });
                  return (
                    <div key={r.discipline_id} className="country-disc-row">
                      <span className="disc-emoji-sm">{disc?.emoji || '🏅'}</span>
                      <span className="country-disc-name">{disc?.nameFR || r.discipline_id}</span>
                      <div className="country-disc-medals">
                        {medals.map((m, i) => (
                          <span key={i} className={`v6-medal-pill ${m.cls}`}>{m.icon}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedCountry && (
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <p>Sélectionne ton pays favori pour suivre ses médailles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
