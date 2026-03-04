import { useState, useEffect } from 'react';
import { leaderboardApi, groupsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLanguage';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
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
    const userScores = {};
    picks.forEach(pick => {
      const uid      = pick.user_id;
      const username = pick.users?.username || uid;
      if (filterUserIds && !filterUserIds.has(uid)) return;
      if (!userScores[uid]) userScores[uid] = { uid, username, score: 0 };
      userScores[uid].score += (pick.points || 0);
    });
    const sorted = Object.values(userScores).sort((a, b) =>
      b.score - a.score || a.username.localeCompare(b.username)
    );
    let currentRank = 1;
    return sorted.map((entry, i) => {
      if (i > 0 && entry.score < sorted[i - 1].score) currentRank = i + 1;
      return { ...entry, rank: currentRank };
    });
  };

  const scores = computeScores(allPicks, getFilteredIds());

  if (loading) return <div className="loading">{t('loadingLeaderboard')}</div>;

  return (
    <div className="leaderboard-page">
      {groups.length > 0 && (
        <div className="lb-filters">
          <button className={selectedGroup === 'all' ? 'active' : ''} onClick={() => setSelectedGroup('all')}>
            {t('leaderboardGeneral')}
          </button>
          {groups.map(g => (
            <button key={g.id} className={selectedGroup === g.id ? 'active' : ''} onClick={() => setSelectedGroup(g.id)}>
              👥 {g.name}
            </button>
          ))}
        </div>
      )}

      <div className="lb-legend">
        <span>{t('pointsLegendGold')}</span>
        <span>{t('pointsLegendSilver')}</span>
        <span>{t('pointsLegendBronze')}</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{t('pointsLegendNote')}</span>
      </div>

      {scores.length === 0 ? (
        <div className="empty-state">
          <p>{selectedGroup === 'all' ? t('noPlayers') : t('noGroupMembers')}</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="lb-header lb-header-simple">
            <span>#</span><span>{t('leaderboardHeader')}</span><span>{t('points')}</span>
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
                  {isMe && <span className="you-badge">{t('youBadge')}</span>}
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
