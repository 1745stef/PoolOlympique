import { useState, useEffect } from 'react';
import { leaderboardApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const POINTS = { 5: { label: '🥇', cls: 'pts-gold' }, 3: { label: '🥈', cls: 'pts-silver' }, 1: { label: '🥉', cls: 'pts-bronze' } };

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get()
      .then((picks) => {
        const userScores = {};
        picks.forEach((pick) => {
          const username = pick.users?.username || pick.user_id;
          if (!userScores[username]) userScores[username] = { username, total: 0, gold: 0, silver: 0, bronze: 0, score: 0 };
          userScores[username].total++;
          const pts = pick.points || 0;
          if (pts === 5) userScores[username].gold++;
          else if (pts === 3) userScores[username].silver++;
          else if (pts === 1) userScores[username].bronze++;
          userScores[username].score += pts;
        });
        const sorted = Object.values(userScores).sort((a, b) =>
          b.score - a.score || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze
        );
        setScores(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Chargement du classement...</div>;

  return (
    <div className="leaderboard-page">
      <div className="lb-legend">
        <span>🥇 Or = 5 pts</span>
        <span>🥈 Argent = 3 pts</span>
        <span>🥉 Bronze = 1 pt</span>
      </div>

      {scores.length === 0 ? (
        <div className="empty-state">
          <p>Les résultats apparaîtront une fois les compétitions terminées.</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="lb-header">
            <span>#</span>
            <span>Joueur</span>
            <span>🥇</span>
            <span>🥈</span>
            <span>🥉</span>
            <span>Total</span>
          </div>
          {scores.map((entry, i) => (
            <div key={entry.username} className={`lb-row ${entry.username === user?.username ? 'me' : ''} rank-${i + 1}`}>
              <span className="rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span className="lb-username">
                {entry.username}
                {entry.username === user?.username && <span className="you-badge"> (toi)</span>}
              </span>
              <span className="lb-medal-count gold-count">{entry.gold || '—'}</span>
              <span className="lb-medal-count silver-count">{entry.silver || '—'}</span>
              <span className="lb-medal-count bronze-count">{entry.bronze || '—'}</span>
              <span className="lb-score">{entry.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
