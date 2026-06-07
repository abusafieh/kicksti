import { useEffect, useState } from 'react';
import { LogOut, Trophy, Target, Hash, Zap, CheckCircle, TrendingUp, Pencil, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRY_FLAGS, TEAM_FLAGS } from '../lib/constants';

// Total predictable knockout matches: R32 16 + R16 8 + QF 4 + SF 2 + Final 1 + 3rd 1
const BRACKET_TOTAL = 32;

interface Stats {
  totalPoints: number;
  predictionsCount: number;
  globalRank: number;
  matchCount: number;
  bracketCount: number;
  bestMatchScore: number;
  exactScores: number;
  correctResults: number;
}

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPoints: 0, predictionsCount: 0, globalRank: 0, matchCount: 0, bracketCount: 0,
    bestMatchScore: 0, exactScores: 0, correctResults: 0,
  });
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => { loadStats(); }, [user]);

  function openEdit() {
    setEditTeamName(profile?.team_name || '');
    setEditDisplayName(profile?.display_name || '');
    setEditEmail(profile?.email || '');
    setSaveError('');
    setSaveSuccess('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError('');
    setSaveSuccess('');
  }

  async function saveProfile() {
    if (!user || !profile) return;
    if (!editDisplayName.trim()) { setSaveError('Name is required.'); return; }
    if (!editTeamName.trim()) { setSaveError('Team name is required.'); return; }
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    // Update users table (email is not editable — verified separately later)
    const { error: profileError } = await supabase
      .from('users')
      .update({
        display_name: editDisplayName.trim(),
        team_name: editTeamName.trim(),
      })
      .eq('id', user.id);

    if (profileError) {
      setSaveError(profileError.message);
      setSaving(false);
      return;
    }

    setSaveSuccess('Profile updated successfully.');
    await refreshProfile();
    setSaving(false);
    setEditing(false);
  }

  async function loadStats() {
    if (!user) return;

    const [pointsRes, rankRes, matchCountRes, finishedRes, bracketRes] = await Promise.all([
      supabase.from('predictions').select('points_awarded, match_id, predicted_home_score, predicted_away_score').eq('user_id', user.id),
      supabase.from('predictions').select('user_id, points_awarded').neq('user_id', user.id),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('id, home_score, away_score').eq('status', 'finished'),
      supabase.from('bracket_predictions').select('ft_home_score').eq('user_id', user.id),
    ]);

    const bracketCount = (bracketRes.data || []).filter(b => b.ft_home_score !== null).length;

    const predictions = pointsRes.data || [];
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points_awarded || 0), 0);

    const userTotals: Record<string, number> = {};
    rankRes.data?.forEach(p => {
      userTotals[p.user_id] = (userTotals[p.user_id] || 0) + (p.points_awarded || 0);
    });
    const globalRank = Object.values(userTotals).filter(pts => pts > totalPoints).length + 1;
    const bestMatchScore = predictions.reduce((max, p) => Math.max(max, p.points_awarded || 0), 0);

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
      if (p.predicted_home_score === actual.home && p.predicted_away_score === actual.away) exactScores++;
      const predResult = Math.sign(p.predicted_home_score - p.predicted_away_score);
      const actualResult = Math.sign(actual.home - actual.away);
      if (predResult === actualResult) correctResults++;
    });

    setStats({ totalPoints, predictionsCount: predictions.length, globalRank, matchCount: matchCountRes.count || 0, bracketCount, bestMatchScore, exactScores, correctResults });
    setLoading(false);
  }

  return (
    <div className="px-6 py-6">
      <h2 className="text-4xl font-display text-text-primary mb-6">PROFILE</h2>

      {profile && (
        <>
          {/* Identity card */}
          <div className="card p-6 mb-6">
            {!editing ? (
              /* View mode */
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 bg-accent/10 border-2 border-accent/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-3xl font-display text-accent">
                    {(profile.team_name || profile.display_name).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-text-primary">
                    {profile.team_name || profile.display_name}
                  </h3>
                  {profile.team_name && (
                    <p className="text-base text-text-muted mt-0.5">{profile.display_name}</p>
                  )}
                  <p className="text-base text-text-muted mt-1">
                    {COUNTRY_FLAGS[profile.country] || ''} {profile.country}
                  </p>
                  <p className="text-base text-text-muted">
                    {TEAM_FLAGS[profile.favourite_team] || ''} {profile.favourite_team}
                  </p>
                  <p className="text-sm text-text-faint mt-1">{profile.email}</p>
                </div>
                <button
                  onClick={openEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              </div>
            ) : (
              /* Edit mode */
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-text-primary">Edit Profile</h3>
                  <button onClick={cancelEdit} className="text-text-muted hover:text-text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Team Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={e => setEditTeamName(e.target.value)}
                      placeholder="e.g. Rock N' Roll"
                      className="input-field"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Your Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={e => setEditDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="input-field"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                    <p className="text-xs text-text-faint mt-1">Email can't be changed.</p>
                  </div>

                  {saveError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{saveError}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                    >
                      {saving
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Check className="w-4 h-4" />
                      }
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success message shown below card after save */}
            {saveSuccess && (
              <div className="mt-4 flex items-center gap-2 text-sm text-accent bg-accent/8 border border-accent/20 rounded-lg px-4 py-2.5">
                <Check className="w-4 h-4 shrink-0" />
                {saveSuccess}
              </div>
            )}
          </div>

          {/* Stats grid */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5 text-center">
                  <Trophy className="w-7 h-7 text-accent mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">{stats.totalPoints}</p>
                  <p className="text-sm text-text-muted mt-1">Total Points</p>
                </div>
                <div className="card p-5 text-center">
                  <Hash className="w-7 h-7 text-accent mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">#{stats.globalRank}</p>
                  <p className="text-sm text-text-muted mt-1">Global Rank</p>
                </div>
                <div className="card p-5 text-center">
                  <Target className="w-7 h-7 text-accent mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">{stats.predictionsCount + stats.bracketCount}/{stats.matchCount + BRACKET_TOTAL}</p>
                  <p className="text-sm text-text-muted mt-1">Total Predicted</p>
                </div>
              </div>
              {/* Predictions breakdown: group stage vs bracket */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5 text-center">
                  <p className="text-2xl font-display text-text-primary">{stats.predictionsCount}/{stats.matchCount}</p>
                  <p className="text-sm text-text-muted mt-1">Group Stage</p>
                </div>
                <div className="card p-5 text-center">
                  <p className="text-2xl font-display text-text-primary">{stats.bracketCount}/{BRACKET_TOTAL}</p>
                  <p className="text-sm text-text-muted mt-1">Bracket</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5 text-center">
                  <Zap className="w-7 h-7 text-amber-400 mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">{stats.bestMatchScore}</p>
                  <p className="text-sm text-text-muted mt-1">Best Score</p>
                </div>
                <div className="card p-5 text-center">
                  <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">{stats.exactScores}</p>
                  <p className="text-sm text-text-muted mt-1">Exact Scores</p>
                </div>
                <div className="card p-5 text-center">
                  <TrendingUp className="w-7 h-7 text-blue-500 mx-auto mb-3" />
                  <p className="text-3xl font-display text-text-primary">{stats.correctResults}</p>
                  <p className="text-sm text-text-muted mt-1">Correct Results</p>
                </div>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="space-y-3">
            <Link to="/rules" className="card p-5 block hover:border-accent/30 transition-colors">
              <p className="text-base font-semibold text-text-primary">Rules & Scoring</p>
              <p className="text-sm text-text-muted mt-0.5">How points are calculated</p>
            </Link>

            <button
              onClick={signOut}
              className="card p-5 w-full text-left flex items-center gap-4 hover:border-red-400/30 transition-colors"
            >
              <LogOut className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <p className="text-base font-semibold text-red-400">Sign Out</p>
                <p className="text-sm text-text-muted">{profile.email}</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
