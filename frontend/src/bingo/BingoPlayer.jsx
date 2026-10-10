import { useState, useEffect, useCallback, useRef } from 'react';
import { bingoApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import TileContent from './TileContent';
import LottieCanvas from './LottieCanvas';
import { ANIM, REVEAL_MAX_MS, CONFETTI_MAX_MS, INTRO_MS, loadDotLottie, prefersReducedMotion } from './animations';

// Vue joueur.
//  • Grille fermée  → écran d'attente (sphère animée), aucune grille, aucun contenu.
//  • Un admin ouvre → confettis, puis les cases apparaissent en « zoom depuis le centre ».
//  • Case révélée en direct → baguette magique, puis la case se retourne.
// Tout se met à jour en temps réel (Supabase Realtime), sans recharger la page.
// Les cases cachées ne sont jamais envoyées au navigateur.
export default function BingoPlayer() {
  const [grid, setGrid]       = useState({ cols: 5, rows: 5 });
  const [cells, setCells]     = useState({});   // position -> { position, text, image_url, revealed_at }
  const [active, setActive]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [live, setLive]       = useState(false);
  const [zoom, setZoom]       = useState(null);
  const [intro, setIntro]     = useState(false);   // apparition des cases à l'ouverture
  const [confetti, setConfetti] = useState(false);
  const [casting, setCasting] = useState({});      // cases dont la baguette joue
  const [flipped, setFlipped] = useState({});      // cases révélées en direct (retournement)

  const activeRef = useRef(false);
  const libReady  = useRef(false);
  const timers    = useRef({});

  const endCast = useCallback((pos, flip) => {
    clearTimeout(timers.current[`c${pos}`]);
    delete timers.current[`c${pos}`];
    setCasting(c => { if (!c[pos]) return c; const n = { ...c }; delete n[pos]; return n; });
    if (flip) setFlipped(f => ({ ...f, [pos]: true }));
  }, []);

  const startCast = useCallback((pos) => {
    if (!libReady.current || prefersReducedMotion()) return;
    setCasting(c => ({ ...c, [pos]: true }));
    clearTimeout(timers.current[`c${pos}`]);
    timers.current[`c${pos}`] = setTimeout(() => endCast(pos, true), REVEAL_MAX_MS);
  }, [endCast]);

  // Bascule ouverte / fermée. celebrate = vrai seulement quand l'ouverture arrive EN DIRECT.
  const applyActive = useCallback((next, celebrate) => {
    const was = activeRef.current;
    activeRef.current = next;
    setActive(next);
    if (next && !was) {
      setIntro(true);
      clearTimeout(timers.current.intro);
      timers.current.intro = setTimeout(() => setIntro(false), INTRO_MS);
      if (celebrate && libReady.current && !prefersReducedMotion()) {
        setConfetti(true);
        clearTimeout(timers.current.confetti);
        timers.current.confetti = setTimeout(() => setConfetti(false), CONFETTI_MAX_MS);
      }
    }
    if (!next && was) {
      setCells({}); setCasting({}); setFlipped({}); setConfetti(false); setZoom(null); setIntro(false);
    }
  }, []);

  const load = useCallback(async (celebrate = false) => {
    try {
      const d = await bingoApi.player();
      setGrid({ cols: d.cols, rows: d.rows });
      setCells(Object.fromEntries(d.cells.map(c => [c.position, c])));
      applyActive(!!d.active, celebrate);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [applyActive]);

  // Précharge le lecteur d'animations (pour que la baguette / les confettis soient prêts)
  useEffect(() => {
    let alive = true;
    loadDotLottie().then(L => { if (alive && L) libReady.current = true; });
    return () => { alive = false; Object.values(timers.current).forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const channel = supabase.channel('bingo:live')
      // Ouverture / fermeture de la grille par un admin
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_state' }, (payload) => {
        if (payload.new?.active) load(true);
        else applyActive(false, false);
      })
      // Cases révélées (ignorées tant que la grille est fermée)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bingo_public' }, (payload) => {
        if (!activeRef.current) return;
        if (payload.eventType === 'DELETE') {
          const pos = payload.old?.position;
          if (pos === undefined) return;
          endCast(pos, false);
          setFlipped(f => { const n = { ...f }; delete n[pos]; return n; });
          setCells(prev => { const n = { ...prev }; delete n[pos]; return n; });
          setZoom(z => (z && z.position === pos ? null : z));
        } else if (payload.new) {
          // INSERT = nouvelle révélation → baguette ; UPDATE = contenu modifié → pas d'animation
          if (payload.eventType === 'INSERT') startCast(payload.new.position);
          setCells(prev => ({ ...prev, [payload.new.position]: payload.new }));
        }
      })
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
        // À chaque (re)connexion : on resynchronise pour ne rien rater (sans confettis)
        if (status === 'SUBSCRIBED') load(false);
      });
    load(false);
    return () => { supabase.removeChannel(channel); };
  }, [load, applyActive, startCast, endCast]);

  if (loading) return <div className="owner-loading">Chargement...</div>;

  const total = grid.cols * grid.rows;
  const revealedCount = Object.keys(cells).filter(k => Number(k) < total).length;
  // Délai d'apparition : plus la case est loin du centre, plus elle apparaît tard
  const cx = (grid.cols - 1) / 2, cy = (grid.rows - 1) / 2;
  const delayOf = (pos) => Math.round(Math.hypot((pos % grid.cols) - cx, Math.floor(pos / grid.cols) - cy) * 70);

  return (
    <div className="bingo-wrap">
      {error && <div className="owner-error">{error}</div>}

      {!active ? (
        <div className="bingo-waiting">
          <div className="bingo-waiting-orb">
            {prefersReducedMotion()
              ? <span className="bingo-waiting-static">⏳</span>
              : <LottieCanvas src={ANIM.waiting} loop maxSize={600} />}
          </div>
        </div>
      ) : (
        <>
          <div className="bingo-status">
            <span className={`bingo-live-dot${live ? ' on' : ''}`} />
            {live ? 'En direct' : 'Connexion…'} · {revealedCount} / {total} cases révélées
          </div>

          <div className={`bingo-grid${intro ? ' intro' : ''}`} style={{ '--cols': grid.cols }}>
            {Array.from({ length: total }, (_, pos) => {
              const c = cells[pos];
              const style = { '--d': `${delayOf(pos)}ms` };
              if (c && casting[pos]) {
                return (
                  <div key={`${pos}-cast`} style={style} className="bingo-tile covered casting" aria-hidden="true">
                    <div className="bingo-cast">
                      <LottieCanvas src={ANIM.reveal} maxSize={500}
                        onComplete={() => endCast(pos, true)} onError={() => endCast(pos, true)} />
                    </div>
                  </div>
                );
              }
              return c ? (
                <button key={`${pos}-${c.revealed_at}`} style={style}
                  className={`bingo-tile revealed${flipped[pos] ? ' flip' : ''}`} onClick={() => setZoom(c)}>
                  <TileContent text={c.text} image_url={c.image_url} />
                </button>
              ) : (
                <div key={pos} style={style} className="bingo-tile covered" aria-hidden="true"><span>?</span></div>
              );
            })}
          </div>
        </>
      )}

      {confetti && (
        <div className="bingo-confetti" aria-hidden="true">
          <LottieCanvas src={ANIM.confetti} maxSize={1400}
            onComplete={() => setConfetti(false)} onError={() => setConfetti(false)} />
        </div>
      )}

      {zoom && (
        <div className="owner-modal-overlay" onClick={() => setZoom(null)}>
          <div className="owner-modal bingo-zoom" onClick={e => e.stopPropagation()}>
            {zoom.image_url && <img src={zoom.image_url} alt="" className="bingo-zoom-img" />}
            {zoom.text && <div className="bingo-zoom-text">{zoom.text}</div>}
            <div className="owner-modal-actions">
              <button className="owner-btn-cancel" onClick={() => setZoom(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
