import { useEffect, useState } from 'react';
import { LogOut, Trophy, Target, Hash, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRY_FLAGS, TEAM_FLAGS } from '../lib/constants';

interface Stats {
  totalPoints: number;
  predictionsCount: number;
  globalRank: number;
  matchCount: number;
  bestMatchScore: number;
  exactScores: number;
  correctResults: number;
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPoints: 0, predictionsCount: 0, globalRank: 0, matchCount: 0,
    bestMatchScore: 0, exactScores: 0, correctResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    const [pointsRes, rankRes, matchCountRes, finishedRes] = await Promise.all([
      supabase.from('predictions').select('points_awarded, match_id, predicted_home_score, predicted_away_score').eq('user_id', user.id),
      supabase.from('predictions').select('user_id, points_awarded').neq('user_id', user.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('id, home_score, away_score').eq('status', 'finished'),
    ]);

    const predictions = pointsRes.data || [];
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points_awarded || 0), 0);
    const predictionsCount = predictions.length;

    // Global rank
    const userTotals: Record<string, number> = {};
    rankRes.data?.forEach(p => {
      userTotals[p.user_id] = (userTotals[p.user_id] || 0) + (p.points_awarded || 0);
    });
    const globalRank = Object.values(userTotals).filter(pts => pts > totalPoints).length + 1;

    // Best match score
    const bestMatchScore = predictions.reduce((max, p) => Math.max(max, p.points_awarded || 0), 0);

    // Exact scores and correct results
    const matchScores: Record<string, { home: number; away: number }> = {};
    finishedRes.data?.forEach(m => {
      if (m.home_score !== null && m.away_score !== null) {
        matchScores[m.id] = { home: m.home_score, away: m.away_score };
      }
    });

    let exactScores = 0;
    let correctResults = 0;
    predictions.forEach(p => {
      const actual = matchScores[p.match_id];
      if (!actual) return;
      if (p.predicted_home_score === actual.home && p.predicted_away_score === actual.away) {
        exactScores++;
      }
      const predResult = Math.sign(p.predicted_home_score - p.predicted_away_score);
      const actualResult = Math.sign(actual.home - actual.away);
      if (predResult === actualResult) correctResults++;
    });

    setStats({
      totalPoints,
      predictionsCount,
      globalRank,
      matchCount: matchCountRes.count || 0,
      bestMatchScore,
      exactScores,
      correctResults,
    });
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-display text-white mb-6">PROFILE</h2>

      {profile && (
        <>
          <div className="card mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-display text-accent">
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{profile.display_name}</h3>
                <p className="text-sm text-gray-400">
                  {COUNTRY_FLAGS[profile.country] || ''} {profile.country}
                </p>
                <p className="text-sm text-gray-400">
                  {TEAM_FLAGS[profile.favourite_team] || ''} {profile.favourite_team}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center">
                  <Trophy className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-display text-white">{stats.totalPoints}</p>
                  <p className="text-xs text-gray-500">Total Points</p>
                </div>
                <div className="card text-center">
                  <Hash className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-display text-white">#{stats.globalRank}</p>
                  <p className="text-xs text-gray-500">Global Rank</p>
                </div>
                <div className="card text-center">
                  <Target className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-xl font-display text-white">{stats.predictionsCount}/{stats.matchCount}</p>
                  <p className="text-xs text-gray-500">Predicted</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="card text-center">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-display text-white">{stats.bestMatchScore}</p>
                  <p className="text-xs text-gray-500">Best Score</p>
                </div>
                <div className="card text-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-xl font-display text-white">{stats.exactScores}</p>
                  <p className="text-xs text-gray-500">Exact Scores</p>
                </div>
                <div className="card text-center">
                  <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-xl font-display text-white">{stats.correctResults}</p>
                  <p className="text-xs text-gray-500">Correct Results</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Link to="/rules" className="card block hover:border-accent/30 transition-colors">
              <p className="text-sm font-medium text-white">Rules & Scoring</p>
              <p className="text-xs text-gray-500">How points are calculated</p>
            </Link>

            <button
              onClick={signOut}
              className="card w-full text-left flex items-center gap-3 hover:border-red-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Sign Out</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
