import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { COUNTRY_FLAGS, TEAM_FLAGS } from '../lib/constants';

interface LeaderboardEntry {
  id: string;
  display_name: string;
  team_name: string | null;
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
  const [myRanks, setMyRanks] = useState<{
    global: number; globalTotal: number;
    country: number; countryTotal: number; countryName: string;
    team: number; teamTotal: number; teamName: string;
    points: number;
  } | null>(null);
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
      const t = data.map((d: any) => d.private_tournaments).filter(Boolean);
      setTournaments(t);
      if (t.length > 0 && !selectedTournament) setSelectedTournament(t[0].id);
    }
  }

  async function loadLeaderboard() {
    setLoading(true);

    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, team_name, country, favourite_team, created_at');

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

    const sortFn = (a: LeaderboardEntry, b: LeaderboardEntry) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.exact_score_points !== a.exact_score_points) return b.exact_score_points - a.exact_score_points;
      if (b.correct_results !== a.correct_results) return b.correct_results - a.correct_results;
      if (b.half_predictions_correct !== a.half_predictions_correct) return b.half_predictions_correct - a.half_predictions_correct;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    };

    // Build full (unfiltered) leaderboard so we can derive league ranks
    const allEntries: LeaderboardEntry[] = users.map(u => {
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
        if (homeCorrect && awayCorrect) { exactScores++; exactScorePoints += 1; }
        else if (homeCorrect || awayCorrect) { exactScorePoints += 0.5; }
        const predResult = Math.sign(p.predicted_home_score - p.predicted_away_score);
        const actualResult = Math.sign(actual.home - actual.away);
        if (predResult === actualResult) correctResults++;
      });

      return {
        id: u.id,
        display_name: u.display_name,
        team_name: u.team_name || null,
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
    allEntries.sort(sortFn);

    // Derive the current user's rank in each league (global / country / team)
    if (user) {
      const me = allEntries.find(e => e.id === user.id);
      if (me) {
        const countryList = allEntries.filter(e => e.country === me.country);
        const teamList = allEntries.filter(e => e.favourite_team === me.favourite_team);
        setMyRanks({
          global: allEntries.indexOf(me) + 1, globalTotal: allEntries.length,
          country: countryList.indexOf(me) + 1, countryTotal: countryList.length, countryName: me.country,
          team: teamList.indexOf(me) + 1, teamTotal: teamList.length, teamName: me.favourite_team,
          points: me.total_points,
        });
      } else {
        setMyRanks(null);
      }
    }

    // Filter for the active tab's display
    let display = allEntries;
    if (tab === 'country' && profile) {
      display = allEntries.filter(e => e.country === profile.country);
    } else if (tab === 'team' && profile) {
      display = allEntries.filter(e => e.favourite_team === profile.favourite_team);
    } else if (tab === 'private' && selectedTournament) {
      const { data: members } = await supabase
        .from('tournament_members')
        .select('user_id')
        .eq('tournament_id', selectedTournament);
      const memberIds = new Set((members || []).map(m => m.user_id));
      display = allEntries.filter(e => memberIds.has(e.id));
    }

    const leaderboard = display;
    setEntries(leaderboard);
    setLoading(false);

    if (tab === 'global' && user && !rankNotifiedRef.current) {
      const myIndex = leaderboard.findIndex(e => e.id === user.id);
      if (myIndex >= 0) {
        const currentRank = myIndex + 1;
        const storageKey = `kicksti_last_rank_${user.id}`;
        const lastRank = localStorage.getItem(storageKey);
        if (lastRank && currentRank < parseInt(lastRank)) {
          notify('info', `You moved up to #${currentRank} on the Global Leaderboard!`);
        }
        localStorage.setItem(storageKey, currentRank.toString());
        rankNotifiedRef.current = true;
      }
    }
  }

  const shareRankCard = useCallback(async (entry: LeaderboardEntry, rank: number) => {
    const text = `I'm ranked #${rank} with ${entry.total_points} points on Kicksti!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Kicksti - My Rank', text, url: 'https://kicksti.com' });
      }
    } catch { /* cancelled */ }
  }, []);

  const myEntry = entries.find(e => e.id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'global',  label: 'Global' },
    { key: 'country', label: profile?.country || 'Country' },
    { key: 'team',    label: profile?.favourite_team || 'Team' },
    { key: 'private', label: 'Private' },
  ];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-display text-text-primary">LEADERBOARD</h2>
        <button
          onClick={() => { if (myEntry && myRank) shareRankCard(myEntry, myRank); }}
          className="p-2 text-text-muted hover:text-accent transition-colors"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-base font-semibold whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Private tournament selector */}
      {tab === 'private' && (
        <div className="mb-5">
          {tournaments.length > 0 ? (
            <select
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
              className="input-field text-base"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-text-muted text-base">Join a private tournament from the Leagues tab to see rankings here.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative">
          {/* My standings across the three leagues */}
          {myRanks && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-display text-text-primary">MY STANDINGS</h3>
                <span className="text-sm text-text-muted">{myRanks.points} pts</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <RankCard label="Global" rank={myRanks.global} total={myRanks.globalTotal} sub="🌍" />
                <RankCard label={myRanks.countryName} rank={myRanks.country} total={myRanks.countryTotal} sub={COUNTRY_FLAGS[myRanks.countryName] || '🏳️'} />
                <RankCard label={myRanks.teamName} rank={myRanks.team} total={myRanks.teamTotal} sub={TEAM_FLAGS[myRanks.teamName] || '⚽'} />
              </div>
            </div>
          )}

          {/* Ad slot */}
          <div id="ad-slot-leaderboard" className="mb-5 h-16 bg-elevated border border-dashed border-border rounded-xl flex items-center justify-center">
            <span className="text-sm text-text-faint">Ad Space</span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm font-semibold text-text-muted uppercase tracking-wide border-b border-border">
            <span className="col-span-1">#</span>
            <span className="col-span-6">Player</span>
            <span className="col-span-2 text-center">Pts</span>
            <span className="col-span-2 text-center">Exact</span>
            <span className="col-span-1 text-center">Results</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`grid grid-cols-12 gap-2 items-center px-4 py-4 transition-colors ${
                  entry.id === user?.id
                    ? 'bg-accent/8 border-l-4 border-l-accent'
                    : 'hover:bg-elevated'
                }`}
              >
                <span className={`col-span-1 text-base font-bold ${
                  idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-text-faint'
                }`}>{idx + 1}</span>

                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{COUNTRY_FLAGS[entry.country] || ''}</span>
                  {entry.id === user?.id ? (
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-text-primary truncate">
                        {entry.team_name || entry.display_name}
                      </p>
                      {entry.team_name && (
                        <p className="text-sm text-text-muted truncate">{entry.display_name}</p>
                      )}
                    </div>
                  ) : (
                    <Link to={`/user/${entry.id}`} className="min-w-0 group">
                      <p className="text-base font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                        {entry.team_name || entry.display_name}
                      </p>
                      {entry.team_name && (
                        <p className="text-sm text-text-muted truncate">{entry.display_name}</p>
                      )}
                    </Link>
                  )}
                  {entry.id === user?.id && (
                    <button
                      onClick={() => shareRankCard(entry, idx + 1)}
                      className="shrink-0 p-1.5 text-text-muted hover:text-accent transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <span className="col-span-2 text-center text-lg font-bold text-accent">{entry.total_points}</span>
                <span className="col-span-2 text-center text-base text-text-muted">{entry.exact_scores}</span>
                <span className="col-span-1 text-center text-base text-text-muted">{entry.correct_results}</span>
              </div>
            ))}
          </div>

          {/* Pinned user row */}
          {myEntry && myRank && myRank > 5 && (
            <div className="sticky bottom-0 mt-4 bg-surface border-t-2 border-accent shadow-lg">
              <div className="grid grid-cols-12 gap-2 items-center px-4 py-4">
                <span className="col-span-1 text-base font-bold text-accent">{myRank}</span>
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  <span className="text-xl">{COUNTRY_FLAGS[myEntry.country] || ''}</span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-text-primary truncate">
                      {myEntry.team_name || myEntry.display_name}
                    </p>
                    {myEntry.team_name && (
                      <p className="text-sm text-text-muted truncate">{myEntry.display_name}</p>
                    )}
                  </div>
                </div>
                <span className="col-span-2 text-center text-lg font-bold text-accent">{myEntry.total_points}</span>
                <span className="col-span-2 text-center text-base text-text-muted">{myEntry.exact_scores}</span>
                <span className="col-span-1 text-center text-base text-text-muted">{myEntry.correct_results}</span>
              </div>
            </div>
          )}

          {entries.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-14 h-14 text-text-faint mx-auto mb-4" />
              <p className="text-lg text-text-muted">No entries yet. Start predicting to appear here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RankCard({ label, rank, total, sub }: { label: string; rank: number; total: number; sub: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl mb-1">{sub}</p>
      <p className="text-3xl font-display text-accent leading-none">#{rank}</p>
      <p className="text-xs text-text-faint mt-1">of {total}</p>
      <p className="text-sm font-semibold text-text-muted mt-2 truncate">{label}</p>
    </div>
  );
}
