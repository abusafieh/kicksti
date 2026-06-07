import { useEffect, useState, useRef, useCallback } from 'react';
import { Lock, Check, AlertCircle, Target, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePredictions } from '../contexts/PredictionsContext';
import { useNotifications } from '../contexts/NotificationContext';
import { TEAM_ISO_CODES, toEnglishName } from '../lib/constants';
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
  const { updatePrediction } = usePredictions();
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
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  async function savePrediction(matchId: string, directHome?: string, directAway?: string) {
    if (!user) return;
    const home = directHome ?? localScores[matchId]?.home;
    const away = directAway ?? localScores[matchId]?.away;
    if (home === '' || home === undefined || away === '' || away === undefined) return;
    const scores = { home, away };

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
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-display text-text-primary">PREDICTIONS</h2>
          <p className="text-sm text-text-muted">{predictedCount} of {matches.length} matches predicted</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={sharePredictions}
            className="p-2 text-text-muted hover:text-accent transition-colors"
            title="Share predictions"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <div className="bg-elevated border border-border rounded-lg px-3 py-2 text-center">
            <span className="text-2xl font-display text-accent">{predictedCount}</span>
            <span className="text-xs text-text-muted block">/{matches.length}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-elevated rounded-full mb-6 overflow-hidden border border-border">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${matches.length > 0 ? (predictedCount / matches.length) * 100 : 0}%` }}
        />
      </div>

      {/* Urgent notification */}
      {urgentMatches.length > 0 && (
        <div className="bg-warning-bg border border-warning-border rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-warning">
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
                ? 'bg-accent text-white'
                : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
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
              <div className={`card p-5 transition-all ${locked ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-text-muted font-medium">
                    {new Date(match.kickoff_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {new Date(match.kickoff_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {match.status === 'finished' && pred && (
                      <span className="text-sm font-bold text-accent bg-accent-dim border border-accent-border px-3 py-1 rounded-lg">
                        +{pred.points_awarded} pts
                      </span>
                    )}
                    {locked ? (
                      <Lock className="w-4 h-4 text-text-faint" />
                    ) : timeLeft ? (
                      <span className="text-sm text-warning font-semibold">Locks in {timeLeft}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Home team */}
                  <div className="flex-1 text-right flex items-center justify-end gap-2">
                    <span className="text-base font-semibold text-text-primary">{toEnglishName(match.home_team)}</span>
                    {TEAM_ISO_CODES[match.home_team] && (
                      <img
                        src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[match.home_team]}.png`}
                        width={28}
                        alt={toEnglishName(match.home_team)}
                        className="inline-block rounded shrink-0"
                      />
                    )}
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={scores.home}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setLocalScores(prev => {
                          const away = prev[match.id]?.away ?? '';
                          if (val !== '' && away !== '') {
                            updatePrediction(match.id, val, away);
                            clearTimeout(debounceTimers.current[match.id]);
                            debounceTimers.current[match.id] = setTimeout(() => savePrediction(match.id, val, away), 800);
                          }
                          return { ...prev, [match.id]: { ...prev[match.id], home: val } };
                        });
                      }}
                      disabled={locked}
                      className="w-14 h-14 bg-surface border-2 border-border rounded-xl text-center text-text-primary text-xl font-bold
                                 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-text-faint text-lg font-bold">-</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={scores.away}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setLocalScores(prev => {
                          const home = prev[match.id]?.home ?? '';
                          if (val !== '' && home !== '') {
                            updatePrediction(match.id, home, val);
                            clearTimeout(debounceTimers.current[match.id]);
                            debounceTimers.current[match.id] = setTimeout(() => savePrediction(match.id, home, val), 800);
                          }
                          return { ...prev, [match.id]: { ...prev[match.id], away: val } };
                        });
                      }}
                      disabled={locked}
                      className="w-14 h-14 bg-surface border-2 border-border rounded-xl text-center text-text-primary text-xl font-bold
                                 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Away team */}
                  <div className="flex-1 flex items-center gap-2">
                    {TEAM_ISO_CODES[match.away_team] && (
                      <img
                        src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[match.away_team]}.png`}
                        width={28}
                        alt={match.away_team}
                        className="inline-block rounded shrink-0"
                      />
                    )}
                    <span className="text-base font-semibold text-text-primary">{toEnglishName(match.away_team)}</span>
                  </div>
                </div>

                {/* Actual score for finished matches */}
                {match.status === 'finished' && match.home_score !== null && (
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <span className="text-sm text-text-muted">Final: </span>
                    <span className="text-sm font-bold text-text-primary">
                      {match.home_score} - {match.away_score}
                    </span>
                  </div>
                )}

                {/* Autosave indicator */}
                {!locked && (
                  <div className="mt-3 flex justify-end items-center h-5">
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    ) : pred && scores.home && scores.away ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : null}
                  </div>
                )}
              </div>

              {/* Ad slot every 4 matches */}
              {(idx + 1) % 4 === 0 && idx < groupMatches.length - 1 && (
                <div id={`ad-slot-${Math.floor(idx / 4) + 1}`} className="my-3 h-20 bg-elevated border border-dashed border-border rounded-lg flex items-center justify-center">
                  <span className="text-xs text-text-faint">Ad Space</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-text-faint mx-auto mb-4" />
          <p className="text-text-muted">Matches will appear here once the tournament schedule is loaded.</p>
        </div>
      )}
    </div>
  );
}
