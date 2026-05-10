import { useEffect, useState, useRef, useCallback } from 'react';
import { Lock, Check, AlertCircle, Target, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { TEAM_FLAGS } from '../lib/constants';
import { checkUpcomingLocks } from '../lib/notifications';
import { checkNewPoints } from '../lib/pointsChecker';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
  match_date: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

interface Prediction {
  id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  locked: boolean;
  points_awarded: number;
}

export default function Predict() {
  const { user, profile } = useAuth();
  const { notify } = useNotifications();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [localScores, setLocalScores] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeGroup, setActiveGroup] = useState<string>('A');
  const [loading, setLoading] = useState(true);
  const prevPredictionsRef = useRef<{ match_id: string; points_awarded: number; home_team?: string; away_team?: string }[]>([]);
  const notifiedLocksRef = useRef<Set<string>>(new Set());
  const saveTimestamps = useRef<Record<string, number>>({});
  const allSaveTimes = useRef<number[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      pollForUpdates();
    }, 60000);
    return () => clearInterval(interval);
  }, [matches, predictions]);

  async function loadData() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });

    if (matchData) setMatches(matchData);

    if (user) {
      const { data: predData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id);

      if (predData) {
        const predMap: Record<string, Prediction> = {};
        const scoreMap: Record<string, { home: string; away: string }> = {};
        predData.forEach(p => {
          predMap[p.match_id] = p;
          scoreMap[p.match_id] = {
            home: p.predicted_home_score.toString(),
            away: p.predicted_away_score.toString(),
          };
        });
        setPredictions(predMap);
        setLocalScores(scoreMap);

        // Check for new points
        if (prevPredictionsRef.current.length > 0 && matchData) {
          const currentSnapshot = predData.map(p => {
            const m = matchData.find(ma => ma.id === p.match_id);
            return {
              match_id: p.match_id,
              points_awarded: p.points_awarded || 0,
              home_team: m?.home_team,
              away_team: m?.away_team,
            };
          });
          const pointsMsgs = checkNewPoints(prevPredictionsRef.current, currentSnapshot);
          pointsMsgs.forEach(msg => notify('success', msg));
        }

        // Store current snapshot for next comparison
        prevPredictionsRef.current = predData.map(p => ({
          match_id: p.match_id,
          points_awarded: p.points_awarded || 0,
          home_team: matchData?.find(m => m.id === p.match_id)?.home_team,
          away_team: matchData?.find(m => m.id === p.match_id)?.away_team,
        }));

        // Check upcoming locks
        if (matchData) {
          const lockMsgs = checkUpcomingLocks(matchData, predMap);
          lockMsgs.forEach(msg => {
            if (!notifiedLocksRef.current.has(msg)) {
              notifiedLocksRef.current.add(msg);
              notify('warning', msg);
            }
          });
        }
      }
    }
    setLoading(false);
  }

  async function pollForUpdates() {
    if (!user) return;

    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });

    if (matchData) setMatches(matchData);

    const { data: predData } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id);

    if (predData && matchData) {
      const predMap: Record<string, Prediction> = {};
      predData.forEach(p => { predMap[p.match_id] = p; });

      // Check for new points
      const currentSnapshot = predData.map(p => {
        const m = matchData.find(ma => ma.id === p.match_id);
        return {
          match_id: p.match_id,
          points_awarded: p.points_awarded || 0,
          home_team: m?.home_team,
          away_team: m?.away_team,
        };
      });
      const pointsMsgs = checkNewPoints(prevPredictionsRef.current, currentSnapshot);
      pointsMsgs.forEach(msg => notify('success', msg));
      prevPredictionsRef.current = currentSnapshot;

      // Check upcoming locks
      const lockMsgs = checkUpcomingLocks(matchData, predMap);
      lockMsgs.forEach(msg => {
        if (!notifiedLocksRef.current.has(msg)) {
          notifiedLocksRef.current.add(msg);
          notify('warning', msg);
        }
      });

      setPredictions(predMap);
    }
  }

  function isLocked(match: Match) {
    const lockTime = new Date(match.kickoff_time);
    lockTime.setHours(lockTime.getHours() - 1);
    return new Date() >= lockTime;
  }

  function getTimeUntilLock(match: Match) {
    const lockTime = new Date(match.kickoff_time);
    lockTime.setHours(lockTime.getHours() - 1);
    const diff = lockTime.getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  async function savePrediction(matchId: string) {
    if (!user) return;
    const scores = localScores[matchId];
    if (!scores || scores.home === '' || scores.away === '') return;

    const now = Date.now();
    const lastSave = saveTimestamps.current[matchId] || 0;
    if (now - lastSave < 2000) return;
    saveTimestamps.current[matchId] = now;

    allSaveTimes.current = allSaveTimes.current.filter(t => now - t < 60000);
    if (allSaveTimes.current.length >= 20) {
      notify('warning', 'Slow down! You can save a maximum of 20 predictions per minute.');
      return;
    }
    allSaveTimes.current.push(now);

    setSaving(prev => ({ ...prev, [matchId]: true }));

    const homeScore = parseInt(scores.home);
    const awayScore = parseInt(scores.away);

    const { data, error } = await supabase
      .from('predictions')
      .upsert({
        user_id: user.id,
        match_id: matchId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,match_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      setPredictions(prev => ({ ...prev, [matchId]: data }));
    }

    setSaving(prev => ({ ...prev, [matchId]: false }));
  }

  // TODO: replace with html2canvas screenshot once package is stable
  const sharePredictions = useCallback(async () => {
    const upcoming = matches
      .filter(m => !isLocked(m) && predictions[m.id])
      .slice(0, 5);

    const lines = upcoming.map(m => {
      const scores = localScores[m.id] || { home: '', away: '' };
      return `${m.home_team} ${scores.home} - ${scores.away} ${m.away_team}`;
    });

    const text = lines.length > 0
      ? `My Kicksti predictions:\n${lines.join('\n')}`
      : 'Check out my World Cup predictions on Kicksti!';

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Kicksti - My Predictions', text, url: 'https://kicksti.com' });
      }
    } catch {
      // User cancelled share
    }
  }, [matches, predictions, localScores]);

  const groups = [...new Set(matches.map(m => m.group_name))].sort();
  const groupMatches = matches.filter(m => m.group_name === activeGroup);
  const predictedCount = Object.keys(predictions).length;

  const urgentMatches = matches.filter(m => {
    if (isLocked(m)) return false;
    const lockTime = new Date(m.kickoff_time);
    lockTime.setHours(lockTime.getHours() - 1);
    const diff = lockTime.getTime() - Date.now();
    return diff > 0 && diff < 60 * 60 * 1000 && !predictions[m.id];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-display text-white">PREDICTIONS</h2>
          <p className="text-sm text-gray-400">{predictedCount} of {matches.length} matches predicted</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={sharePredictions}
            className="p-2 text-gray-400 hover:text-accent transition-colors"
            title="Share predictions"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <div className="bg-navy-700 rounded-lg px-3 py-2 text-center">
            <span className="text-2xl font-display text-accent">{predictedCount}</span>
            <span className="text-xs text-gray-400 block">/{matches.length}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-navy-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${matches.length > 0 ? (predictedCount / matches.length) * 100 : 0}%` }}
        />
      </div>

      {/* Urgent notification */}
      {urgentMatches.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            {urgentMatches.length} match{urgentMatches.length > 1 ? 'es' : ''} lock in less than 1 hour. Submit your predictions!
          </p>
        </div>
      )}

      {/* Group tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeGroup === g
                ? 'bg-accent text-navy-900'
                : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Group {g}
          </button>
        ))}
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {groupMatches.map((match, idx) => {
          const locked = isLocked(match);
          const pred = predictions[match.id];
          const scores = localScores[match.id] || { home: '', away: '' };
          const timeLeft = getTimeUntilLock(match);
          const isSaving = saving[match.id];

          return (
            <div key={match.id}>
              <div className={`card transition-all ${locked ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    {new Date(match.kickoff_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(match.kickoff_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {match.status === 'finished' && pred && (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                        +{pred.points_awarded} pts
                      </span>
                    )}
                    {locked ? (
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                    ) : timeLeft ? (
                      <span className="text-xs text-amber-400">Locks in {timeLeft}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Home team */}
                  <div className="flex-1 text-right">
                    <span className="text-sm font-medium text-white">
                      {TEAM_FLAGS[match.home_team] || ''} {match.home_team}
                    </span>
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scores.home}
                      onChange={e => setLocalScores(prev => ({
                        ...prev,
                        [match.id]: { ...prev[match.id], home: e.target.value }
                      }))}
                      disabled={locked}
                      className="w-10 h-10 bg-navy-700 border border-navy-500 rounded-lg text-center text-white text-sm font-bold
                                 focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-500 text-xs">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scores.away}
                      onChange={e => setLocalScores(prev => ({
                        ...prev,
                        [match.id]: { ...prev[match.id], away: e.target.value }
                      }))}
                      disabled={locked}
                      className="w-10 h-10 bg-navy-700 border border-navy-500 rounded-lg text-center text-white text-sm font-bold
                                 focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Away team */}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">
                      {match.away_team} {TEAM_FLAGS[match.away_team] || ''}
                    </span>
                  </div>
                </div>

                {/* Actual score for finished matches */}
                {match.status === 'finished' && match.home_score !== null && (
                  <div className="mt-2 pt-2 border-t border-navy-600 text-center">
                    <span className="text-xs text-gray-500">Final: </span>
                    <span className="text-xs font-bold text-white">
                      {match.home_score} - {match.away_score}
                    </span>
                  </div>
                )}

                {/* Save button */}
                {!locked && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => savePrediction(match.id)}
                      disabled={isSaving || !scores.home || !scores.away}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-lg
                                 hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                      ) : pred ? (
                        <Check className="w-3 h-3" />
                      ) : null}
                      {pred ? 'Update' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* Ad slot every 4 matches */}
              {(idx + 1) % 4 === 0 && idx < groupMatches.length - 1 && (
                <div id={`ad-slot-${Math.floor(idx / 4) + 1}`} className="my-3 h-20 bg-navy-800/50 border border-dashed border-navy-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-600">Ad Space</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Matches will appear here once the tournament schedule is loaded.</p>
        </div>
      )}
    </div>
  );
}
