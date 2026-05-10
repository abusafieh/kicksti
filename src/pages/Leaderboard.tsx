import { useEffect, useState, useRef, useCallback } from 'react';
import { Trophy, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { COUNTRY_FLAGS } from '../lib/constants';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  country: string;
  favourite_team: string;
  total_points: number;
  exact_scores: number;
  exact_score_points: number;
  correct_results: number;
  half_predictions_correct: number;
  created_at: string;
}

type TabType = 'global' | 'country' | 'team' | 'private';

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const { notify } = useNotifications();
  const [tab, setTab] = useState<TabType>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const rankNotifiedRef = useRef(false);

  useEffect(() => {
    loadLeaderboard();
  }, [tab, selectedTournament, profile]);

  useEffect(() => {
    if (tab === 'private') loadTournaments();
  }, [tab]);

  async function loadTournaments() {
    if (!user) return;
    const { data } = await supabase
      .from('tournament_members')
      .select('tournament_id, private_tournaments(id, name)')
      .eq('user_id', user.id);

    if (data) {
      const t = data
        .map((d: any) => d.private_tournaments)
        .filter(Boolean);
      setTournaments(t);
      if (t.length > 0 && !selectedTournament) setSelectedTournament(t[0].id);
    }
  }

  async function loadLeaderboard() {
    setLoading(true);

    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, country, favourite_team, created_at');

    if (!users) { setLoading(false); return; }

    const { data: predictions } = await supabase
      .from('predictions')
      .select('user_id, points_awarded, predicted_home_score, predicted_away_score, match_id, locked');

    const { data: finishedMatches } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('status', 'finished');

    const matchScores: Record<string, { home: number; away: number }> = {};
    finishedMatches?.forEach(m => {
      if (m.home_score !== null && m.away_score !== null) {
        matchScores[m.id] = { home: m.home_score, away: m.away_score };
      }
    });

    let filteredUserIds: Set<string> | null = null;

    if (tab === 'country' && profile) {
      filteredUserIds = new Set(users.filter(u => u.country === profile.country).map(u => u.id));
    } else if (tab === 'team' && profile) {
      filteredUserIds = new Set(users.filter(u => u.favourite_team === profile.favourite_team).map(u => u.id));
    } else if (tab === 'private' && selectedTournament) {
      const { data: members } = await supabase
        .from('tournament_members')
        .select('user_id')
        .eq('tournament_id', selectedTournament);
      if (members) {
        filteredUserIds = new Set(members.map(m => m.user_id));
      }
    }

    const leaderboard: LeaderboardEntry[] = users
      .filter(u => !filteredUserIds || filteredUserIds.has(u.id))
      .map(u => {
        const userPreds = predictions?.filter(p => p.user_id === u.id) || [];
        const totalPoints = userPreds.reduce((sum, p) => sum + (p.points_awarded || 0), 0);

        let exactScores = 0;
        let exactScorePoints = 0;
        let correctResults = 0;

        userPreds.forEach(p => {
          const actual = matchScores[p.match_id];
          if (!actual) return;

          const homeCorrect = p.predicted_home_score === actual.home;
          const awayCorrect = p.predicted_away_score === actual.away;

          if (homeCorrect && awayCorrect) {
            exactScores++;
            exactScorePoints += 1;
          } else if (homeCorrect || awayCorrect) {
            exactScorePoints += 0.5;
          }

          const predResult = Math.sign(p.predicted_home_score - p.predicted_away_score);
          const actualResult = Math.sign(actual.home - actual.away);
          if (predResult === actualResult) correctResults++;
        });

        return {
          id: u.id,
          display_name: u.display_name,
          country: u.country,
          favourite_team: u.favourite_team,
          total_points: totalPoints,
          exact_scores: exactScores,
          exact_score_points: exactScorePoints,
          correct_results: correctResults,
          half_predictions_correct: 0,
          created_at: u.created_at,
        };
      });

    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.exact_score_points !== a.exact_score_points) return b.exact_score_points - a.exact_score_points;
      if (b.correct_results !== a.correct_results) return b.correct_results - a.correct_results;
      if (b.half_predictions_correct !== a.half_predictions_correct) return b.half_predictions_correct - a.half_predictions_correct;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setEntries(leaderboard);
    setLoading(false);

    // Check for rank improvement on global tab
    if (tab === 'global' && user && !rankNotifiedRef.current) {
      const myIndex = leaderboard.findIndex(e => e.id === user.id);
      if (myIndex >= 0) {
        const currentRank = myIndex + 1;
        const storageKey = `kicksti_last_rank_${user.id}`;
        const lastRankStr = localStorage.getItem(storageKey);
        const lastRank = lastRankStr ? parseInt(lastRankStr) : null;

        if (lastRank !== null && currentRank < lastRank) {
          notify('info', `You moved up to #${currentRank} on the Global Leaderboard!`);
        }

        localStorage.setItem(storageKey, currentRank.toString());
        rankNotifiedRef.current = true;
      }
    }
  }

  // TODO: replace with html2canvas screenshot once package is stable
  const shareRankCard = useCallback(async (entry: LeaderboardEntry, rank: number) => {
    const text = `I'm ranked #${rank} with ${entry.total_points} points on Kicksti!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Kicksti - My Rank', text, url: 'https://kicksti.com' });
      }
    } catch {
      // User cancelled share
    }
  }, []);

  const myEntry = entries.find(e => e.id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'global', label: 'Global' },
    { key: 'country', label: profile?.country || 'Country' },
    { key: 'team', label: profile?.favourite_team || 'Team' },
    { key: 'private', label: 'Private' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-display text-white">LEADERBOARD</h2>
        <button
          onClick={() => {
            if (myEntry && myRank) shareRankCard(myEntry, myRank);
          }}
          className="p-2 text-gray-400 hover:text-accent transition-colors"
          title="Share your rank"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-accent text-navy-900'
                : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Private tournament selector */}
      {tab === 'private' && (
        <div className="mb-4">
          {tournaments.length > 0 ? (
            <select
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
              className="input-field text-sm"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-gray-400 text-sm">Join a private tournament from the Leagues tab to see rankings here.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative">
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 0, 2].map(idx => {
                const e = entries[idx];
                if (!e) return null;
                const rank = idx + 1;
                const heights = ['h-24', 'h-20', 'h-16'];
                const colors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
                return (
                  <div key={e.id} className="flex flex-col items-center">
                    <span className="text-xs text-gray-400 mb-1 truncate max-w-full">{e.display_name}</span>
                    <div className={`w-full ${heights[idx]} bg-navy-700 rounded-t-lg flex flex-col items-center justify-end pb-2 border border-navy-600`}>
                      <span className={`text-2xl font-display ${colors[idx]}`}>#{rank}</span>
                      <span className="text-xs text-accent font-bold">{e.total_points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ad slot */}
          <div id="ad-slot-leaderboard" className="mb-4 h-16 bg-navy-800/50 border border-dashed border-navy-600 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-600">Ad Space</span>
          </div>

          {/* Full list */}
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Player</span>
              <span className="col-span-2 text-center">Pts</span>
              <span className="col-span-2 text-center">Exact</span>
              <span className="col-span-2 text-center">Results</span>
            </div>
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg transition-colors ${
                  entry.id === user?.id
                    ? 'bg-accent/10 border border-accent/30'
                    : 'hover:bg-navy-700'
                }`}
              >
                <span className="col-span-1 text-sm font-bold text-gray-400">{idx + 1}</span>
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{COUNTRY_FLAGS[entry.country] || ''}</span>
                  <span className="text-sm font-medium text-white truncate">{entry.display_name}</span>
                  {entry.id === user?.id && (
                    <button
                      onClick={() => shareRankCard(entry, idx + 1)}
                      className="shrink-0 p-1 text-gray-500 hover:text-accent transition-colors"
                      title="Share rank"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="col-span-2 text-center text-sm font-bold text-accent">{entry.total_points}</span>
                <span className="col-span-2 text-center text-sm text-gray-400">{entry.exact_scores}</span>
                <span className="col-span-2 text-center text-sm text-gray-400">{entry.correct_results}</span>
              </div>
            ))}
          </div>

          {/* Pinned user row */}
          {myEntry && myRank && myRank > 5 && (
            <div className="sticky bottom-16 lg:bottom-0 mt-4 bg-navy-800 border border-accent/30 rounded-lg">
              <div className="grid grid-cols-12 gap-2 items-center px-3 py-3">
                <span className="col-span-1 text-sm font-bold text-accent">{myRank}</span>
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <span className="text-sm">{COUNTRY_FLAGS[myEntry.country] || ''}</span>
                  <span className="text-sm font-medium text-white truncate">{myEntry.display_name}</span>
                </div>
                <span className="col-span-2 text-center text-sm font-bold text-accent">{myEntry.total_points}</span>
                <span className="col-span-2 text-center text-sm text-gray-400">{myEntry.exact_scores}</span>
                <span className="col-span-2 text-center text-sm text-gray-400">{myEntry.correct_results}</span>
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No entries yet. Start predicting to appear here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
