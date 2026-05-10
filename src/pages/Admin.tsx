import { useEffect, useState } from 'react';
import { Lock, RefreshCw, Users, Target, Globe, Activity, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'kicksti2026admin';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_score_ht: number | null;
  away_score_ht: number | null;
  et_home_score: number | null;
  et_away_score: number | null;
  et_home_score_ht: number | null;
  et_away_score_ht: number | null;
  pen_home_score: number | null;
  pen_away_score: number | null;
  match_type: string;
}

interface MatchScoreState {
  home: string;
  away: string;
  home_ht: string;
  away_ht: string;
  et_home: string;
  et_away: string;
  et_home_ht: string;
  et_away_ht: string;
  pen_home: string;
  pen_away: string;
  match_type: 'group' | 'knockout';
  status: 'finished_90' | 'finished_et' | 'finished_pen';
}

interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface Analytics {
  totalUsers: number;
  totalPredictions: number;
  topCountries: { country: string; count: number }[];
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, MatchScoreState>>({});
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [lastSync, setLastSync] = useState<{ timestamp: string; matches_updated: number; scores_calculated: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  async function loadData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });

    if (matchData) {
      setMatches(matchData);
      const overrides: Record<string, MatchScoreState> = {};
      matchData.forEach(m => {
        overrides[m.id] = {
          home: m.home_score?.toString() || '',
          away: m.away_score?.toString() || '',
          home_ht: m.home_score_ht?.toString() || '',
          away_ht: m.away_score_ht?.toString() || '',
          et_home: m.et_home_score?.toString() || '',
          et_away: m.et_away_score?.toString() || '',
          et_home_ht: m.et_home_score_ht?.toString() || '',
          et_away_ht: m.et_away_score_ht?.toString() || '',
          pen_home: m.pen_home_score?.toString() || '',
          pen_away: m.pen_away_score?.toString() || '',
          match_type: (m.match_type as 'group' | 'knockout') || 'group',
          status: mapStatus(m.status),
        };
      });
      setScoreOverrides(overrides);
    }

    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalPredictions } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
    const { data: users } = await supabase.from('users').select('country');

    const countryCounts: Record<string, number> = {};
    users?.forEach(u => {
      countryCounts[u.country] = (countryCounts[u.country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    setAnalytics({
      totalUsers: totalUsers || 0,
      totalPredictions: totalPredictions || 0,
      topCountries,
    });

    const { data: logData } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logData) setActivityLog(logData);

    const { data: syncSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'last_sync')
      .maybeSingle();

    if (syncSetting?.value) setLastSync(syncSetting.value);
    setLoading(false);
  }

  function mapStatus(s: string): 'finished_90' | 'finished_et' | 'finished_pen' {
    if (s === 'finished_et') return 'finished_et';
    if (s === 'finished_pen') return 'finished_pen';
    return 'finished_90';
  }

  async function saveScore(matchId: string) {
    const scores = scoreOverrides[matchId];
    if (!scores || scores.home === '' || scores.away === '') return;
    setSavingMatch(matchId);

    const payload: Record<string, unknown> = {
      match_id: matchId,
      match_type: scores.match_type,
      status: scores.status,
      home_score: parseInt(scores.home),
      away_score: parseInt(scores.away),
      home_score_ht: parseInt(scores.home_ht) || 0,
      away_score_ht: parseInt(scores.away_ht) || 0,
      et_home_score: scores.et_home !== '' ? parseInt(scores.et_home) : null,
      et_away_score: scores.et_away !== '' ? parseInt(scores.et_away) : null,
      et_home_score_ht: scores.et_home_ht !== '' ? parseInt(scores.et_home_ht) : null,
      et_away_score_ht: scores.et_away_ht !== '' ? parseInt(scores.et_away_ht) : null,
      pen_home_score: scores.pen_home !== '' ? parseInt(scores.pen_home) : null,
      pen_away_score: scores.pen_away !== '' ? parseInt(scores.pen_away) : null,
      admin_password: ADMIN_PASSWORD,
    };

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-scores`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    setSavingMatch(null);
    loadData();
  }

  async function recalculateScores() {
    setRecalculating(true);
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recalculate-scores`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ admin_password: ADMIN_PASSWORD }),
    });
    setRecalculating(false);
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-live-scores`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ admin_password: ADMIN_PASSWORD }),
      });
      const result = await response.json();
      if (result.success) {
        setSyncResult(`Synced: ${result.matches_updated} updated, ${result.scores_calculated} scored`);
        loadData();
      } else {
        setSyncResult(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSyncResult(`Error: ${(err as Error).message}`);
    }
    setSyncing(false);
  }

  function getSyncAge(): { minutes: number; color: string } {
    if (!lastSync?.timestamp) return { minutes: -1, color: 'bg-red-500' };
    const mins = Math.floor((Date.now() - new Date(lastSync.timestamp).getTime()) / 60000);
    if (mins < 2) return { minutes: mins, color: 'bg-green-500' };
    if (mins <= 10) return { minutes: mins, color: 'bg-amber-500' };
    return { minutes: mins, color: 'bg-red-500' };
  }

  function updateField(matchId: string, field: keyof MatchScoreState, value: string) {
    setScoreOverrides(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }));
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h2 className="text-2xl font-display text-white">ADMIN ACCESS</h2>
          </div>
          <form onSubmit={e => { e.preventDefault(); if (password === ADMIN_PASSWORD) setAuthenticated(true); }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="input-field mb-3"
            />
            <button type="submit" className="btn-primary w-full">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-display text-white">ADMIN PANEL</h2>
        <button
          onClick={recalculateScores}
          disabled={recalculating}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate Scores'}
        </button>
      </div>

      {/* Live Scores Sync */}
      <div className="card mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-display text-white">LIVE SCORES</h3>
            <span className={`w-2.5 h-2.5 rounded-full ${getSyncAge().color}`} />
          </div>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="px-3 py-1.5 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {lastSync?.timestamp
            ? `Last sync: ${getSyncAge().minutes} minute${getSyncAge().minutes === 1 ? '' : 's'} ago — ${lastSync.matches_updated} matches updated — ${lastSync.scores_calculated} scores calculated`
            : 'Never synced'}
        </p>
        {syncResult && (
          <p className={`text-xs mt-2 ${syncResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {syncResult}
          </p>
        )}
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="card text-center">
            <Users className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display text-white">{analytics.totalUsers}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </div>
          <div className="card text-center">
            <Target className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display text-white">{analytics.totalPredictions}</p>
            <p className="text-xs text-gray-500">Total Predictions</p>
          </div>
          <div className="card">
            <Globe className="w-5 h-5 text-accent mb-2" />
            <p className="text-xs text-gray-500 mb-2">Top Countries</p>
            <div className="space-y-1">
              {analytics.topCountries.map((c, i) => (
                <div key={c.country} className="flex justify-between text-xs">
                  <span className="text-gray-300">{i + 1}. {c.country}</span>
                  <span className="text-white font-medium">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-display text-white">ACTIVITY LOG</h3>
          </div>
          <select
            value={activityFilter}
            onChange={e => setActivityFilter(e.target.value)}
            className="text-xs bg-navy-700 border border-navy-500 rounded px-2 py-1 text-white focus:border-accent focus:outline-none"
          >
            <option value="all">All</option>
            <option value="signups">Signups</option>
            <option value="predictions">Predictions</option>
            <option value="rate_limited">Rate Limited</option>
          </select>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="text-left py-2 px-2 text-gray-400 font-medium">Time</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">User ID</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">Action</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {activityLog
                .filter(entry => {
                  if (activityFilter === 'all') return true;
                  if (activityFilter === 'signups') return entry.action === 'signup';
                  if (activityFilter === 'predictions') return entry.action === 'prediction';
                  if (activityFilter === 'rate_limited') return entry.action === 'rate_limited';
                  return true;
                })
                .map(entry => (
                  <tr
                    key={entry.id}
                    className={`border-b border-navy-700 ${
                      entry.action === 'rate_limited' ? 'bg-amber-500/5' :
                      entry.action === 'suspicious' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-gray-300 font-mono truncate max-w-[100px]">
                      {entry.user_id?.slice(0, 8) || '-'}
                    </td>
                    <td className={`py-2 px-2 font-medium ${
                      entry.action === 'rate_limited' ? 'text-amber-400' :
                      entry.action === 'suspicious' ? 'text-red-400' :
                      'text-gray-300'
                    }`}>
                      {entry.action}
                    </td>
                    <td className="py-2 px-2 text-gray-500 truncate max-w-[200px]">
                      {entry.metadata ? JSON.stringify(entry.metadata) : '-'}
                    </td>
                  </tr>
                ))}
              {activityLog.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">No activity logged yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches */}
      <h3 className="text-xl font-display text-white mb-4">MATCH SCORES</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map(match => {
            const scores = scoreOverrides[match.id];
            if (!scores) return null;
            const isKnockout = scores.match_type === 'knockout';

            return (
              <div key={match.id} className="card">
                {/* Header row */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-xs text-gray-500 w-16">Grp {match.group_name}</span>
                  <span className="text-sm text-white flex-1 min-w-0 truncate">
                    {match.home_team} vs {match.away_team}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    match.status.startsWith('finished') ? 'bg-green-500/10 text-green-400' :
                    match.status === 'live' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {match.status}
                  </span>
                </div>

                {/* Match type and status selectors */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  <select
                    value={scores.match_type}
                    onChange={e => updateField(match.id, 'match_type', e.target.value)}
                    className="text-xs bg-navy-700 border border-navy-500 rounded px-2 py-1 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="group">Group</option>
                    <option value="knockout">Knockout</option>
                  </select>
                  <select
                    value={scores.status}
                    onChange={e => updateField(match.id, 'status', e.target.value)}
                    className="text-xs bg-navy-700 border border-navy-500 rounded px-2 py-1 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="finished_90">Finished 90min</option>
                    <option value="finished_et">Finished ET</option>
                    <option value="finished_pen">Finished Pens</option>
                  </select>
                </div>

                {/* FT Score */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] text-gray-500 w-12 uppercase font-medium">FT</span>
                  <input
                    type="number"
                    min="0"
                    value={scores.home}
                    onChange={e => updateField(match.id, 'home', e.target.value)}
                    className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                  />
                  <span className="text-gray-500 text-xs">-</span>
                  <input
                    type="number"
                    min="0"
                    value={scores.away}
                    onChange={e => updateField(match.id, 'away', e.target.value)}
                    className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                  />

                  <span className="text-[10px] text-gray-500 ml-3 uppercase font-medium">HT</span>
                  <input
                    type="number"
                    min="0"
                    value={scores.home_ht}
                    onChange={e => updateField(match.id, 'home_ht', e.target.value)}
                    className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                  />
                  <span className="text-gray-500 text-xs">-</span>
                  <input
                    type="number"
                    min="0"
                    value={scores.away_ht}
                    onChange={e => updateField(match.id, 'away_ht', e.target.value)}
                    className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Knockout-only fields */}
                {isKnockout && (
                  <>
                    {/* ET Score */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 w-12 uppercase font-medium">ET</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.et_home}
                        onChange={e => updateField(match.id, 'et_home', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />
                      <span className="text-gray-500 text-xs">-</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.et_away}
                        onChange={e => updateField(match.id, 'et_away', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />

                      <span className="text-[10px] text-gray-500 ml-3 uppercase font-medium">ET HT</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.et_home_ht}
                        onChange={e => updateField(match.id, 'et_home_ht', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />
                      <span className="text-gray-500 text-xs">-</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.et_away_ht}
                        onChange={e => updateField(match.id, 'et_away_ht', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />
                    </div>

                    {/* Penalties */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 w-12 uppercase font-medium">PEN</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.pen_home}
                        onChange={e => updateField(match.id, 'pen_home', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />
                      <span className="text-gray-500 text-xs">-</span>
                      <input
                        type="number"
                        min="0"
                        value={scores.pen_away}
                        onChange={e => updateField(match.id, 'pen_away', e.target.value)}
                        className="w-12 h-8 bg-navy-700 border border-navy-500 rounded text-center text-white text-xs focus:border-accent focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Save button */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => saveScore(match.id)}
                    disabled={savingMatch === match.id}
                    className="px-3 py-1.5 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 disabled:opacity-50 font-medium"
                  >
                    {savingMatch === match.id ? 'Saving...' : 'Save & Calculate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
