import { useState, useEffect } from 'react';
import { leaderboardApi, groupsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [allPicks, setAllPicks]     = useState([]);
  const [groups, setGroups]         = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([leaderboardApi.get(), groupsApi.getAll()])
      .then(([picks, grps]) => { setAllPicks(picks); setGroups(grps); })
      .finally(() => setLoading(false));
  }, []);

  const getFilteredIds = () => {
    if (selectedGroup === 'all') return null;
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return null;
    return new Set(group.group_members.map(m => m.user_id));
  };

  const computeScores = (picks, filterUserIds = null) => {
    // Agréger points par user
    const userScores = {};
    picks.forEach(pick => {
      const uid      = pick.user_id;
      const username = pick.users?.username || uid;
      if (filterUserIds && !filterUserIds.has(uid)) return;
      if (!userScores[uid]) userScores[uid] = { uid, username, score: 0 };
      userScores[uid].score += (pick.points || 0);
    });

    // Trier par score décroissant
    const sorted = Object.values(userScores).sort((a, b) =>
      b.score - a.score || a.username.localeCompare(b.username)
    );

    // Attribuer les rangs ex-aequo
    let currentRank = 1;
    return sorted.map((entry, i) => {
      if (i > 0 && entry.score < sorted[i - 1].score) currentRank = i + 1;
      return { ...entry, rank: currentRank };
    });
  };

  const scores = computeScores(allPicks, getFilteredIds());

  if (loading) return <div className="loading">Chargement du classement...</div>;

  return (
    <div className="leaderboard-page">
      {groups.length > 0 && (
        <div className="lb-filters">
          <button className={selectedGroup === 'all' ? 'active' : ''} onClick={() => setSelectedGroup('all')}>
            🌍 Classement général
          </button>
          {groups.map(g => (
            <button key={g.id} className={selectedGroup === g.id ? 'active' : ''} onClick={() => setSelectedGroup(g.id)}>
              👥 {g.name}
            </button>
          ))}
        </div>
      )}

      <div className="lb-legend">
        <span>🥇 Or = 5 pts</span>
        <span>🥈 Argent = 3 pts</span>
        <span>🥉 Bronze = 1 pt</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>• Plusieurs médailles = points additionnés</span>
      </div>

      {scores.length === 0 ? (
        <div className="empty-state">
          <p>{selectedGroup === 'all' ? 'Aucun joueur inscrit.' : 'Aucun membre dans ce groupe.'}</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="lb-header lb-header-simple">
            <span>#</span><span>Joueur</span><span>Points</span>
          </div>
          {scores.map((entry) => {
            const isMe = entry.username === user?.username;
            const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
            return (
              <div key={entry.uid}
                className={`lb-row lb-row-simple ${isMe ? 'me' : ''} rank-${entry.rank <= 3 ? entry.rank : 'other'}`}>
                <span className="rank">{rankIcon}</span>
                <span className="lb-username">
                  {entry.username}
                  {isMe && <span className="you-badge"> (toi)</span>}
                </span>
                <span className="lb-score">{entry.score} pts</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
