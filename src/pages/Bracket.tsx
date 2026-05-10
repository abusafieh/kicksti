import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { GitBranch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TEAM_FLAGS } from '../lib/constants';
import {
  calculateGroupStandings,
  R32_MATCHUPS,
  getTeamFromSource,
  getWinner,
  type TeamStanding,
} from '../lib/bracket';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
}

interface KnockoutScore {
  ft_home: string;
  ft_away: string;
  et_home: string;
  et_away: string;
  pen_home: string;
  pen_away: string;
}

function emptyScore(): KnockoutScore {
  return { ft_home: '', ft_away: '', et_home: '', et_away: '', pen_home: '', pen_away: '' };
}

function getKnockoutWinner(score: KnockoutScore, home: string | null, away: string | null): string | null {
  const ftWinner = getWinner(score.ft_home, score.ft_away, home, away);
  if (ftWinner) return ftWinner;

  const ftH = parseInt(score.ft_home);
  const ftA = parseInt(score.ft_away);
  if (isNaN(ftH) || isNaN(ftA) || ftH !== ftA) return null;

  const etWinner = getWinner(score.et_home, score.et_away, home, away);
  if (etWinner) return etWinner;

  const etH = parseInt(score.et_home);
  const etA = parseInt(score.et_away);
  if (isNaN(etH) || isNaN(etA) || etH !== etA) return null;

  const penWinner = getWinner(score.pen_home, score.pen_away, home, away);
  return penWinner;
}

const ROUNDS = ['R32', 'R16', 'QF', 'SF', 'F'] as const;
const ROUND_LABELS: Record<string, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter Finals',
  SF: 'Semi Finals',
  '3rd': 'Third Place',
  F: 'Final',
};

export default function Bracket() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [knockoutScores, setKnockoutScores] = useState<Record<string, KnockoutScore>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRound, setActiveRound] = useState<string>('R32');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    const { data: matchData } = await supabase
      .from('matches')
      .select('id, home_team, away_team, group_name')
      .order('kickoff_time', { ascending: true });

    if (matchData) setMatches(matchData);

    if (user) {
      const { data: predData } = await supabase
        .from('predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', user.id);

      if (predData) {
        const scoreMap: Record<string, { home: string; away: string }> = {};
        predData.forEach(p => {
          scoreMap[p.match_id] = {
            home: p.predicted_home_score.toString(),
            away: p.predicted_away_score.toString(),
          };
        });
        setPredictions(scoreMap);
      }

      const { data: bracketData } = await supabase
        .from('bracket_predictions')
        .select('*')
        .eq('user_id', user.id);

      if (bracketData) {
        const loaded: Record<string, KnockoutScore> = {};
        bracketData.forEach(bp => {
          const key = `${bp.round}-${bp.position}`;
          loaded[key] = {
            ft_home: bp.ft_home_score?.toString() ?? '',
            ft_away: bp.ft_away_score?.toString() ?? '',
            et_home: bp.et_home_score?.toString() ?? '',
            et_away: bp.et_away_score?.toString() ?? '',
            pen_home: bp.pen_home_score?.toString() ?? '',
            pen_away: bp.pen_away_score?.toString() ?? '',
          };
        });
        setKnockoutScores(loaded);
      }
    }
    setLoading(false);
  }

  const groupStandings = useMemo(() => {
    const groups = [...new Set(matches.map(m => m.group_name))].sort();
    const standings: Record<string, TeamStanding[]> = {};
    groups.forEach(g => {
      standings[g] = calculateGroupStandings(matches, predictions, g);
    });
    return standings;
  }, [matches, predictions]);

  const bracket = useMemo(() => {
    const r32: { home: string | null; away: string | null; pos: number }[] = R32_MATCHUPS.map((m, i) => ({
      home: getTeamFromSource(m.home, groupStandings),
      away: getTeamFromSource(m.away, groupStandings),
      pos: i,
    }));

    const r16: { home: string | null; away: string | null; pos: number }[] = [];
    for (let i = 0; i < 16; i += 2) {
      const scoreA = knockoutScores[`R32-${i}`] || emptyScore();
      const scoreB = knockoutScores[`R32-${i + 1}`] || emptyScore();
      const winnerA = getKnockoutWinner(scoreA, r32[i].home, r32[i].away);
      const winnerB = getKnockoutWinner(scoreB, r32[i + 1].home, r32[i + 1].away);
      r16.push({ home: winnerA, away: winnerB, pos: i / 2 });
    }

    const qf: { home: string | null; away: string | null; pos: number }[] = [];
    for (let i = 0; i < 8; i += 2) {
      const scoreA = knockoutScores[`R16-${i}`] || emptyScore();
      const scoreB = knockoutScores[`R16-${i + 1}`] || emptyScore();
      const winnerA = getKnockoutWinner(scoreA, r16[i].home, r16[i].away);
      const winnerB = getKnockoutWinner(scoreB, r16[i + 1].home, r16[i + 1].away);
      qf.push({ home: winnerA, away: winnerB, pos: i / 2 });
    }

    const sf: { home: string | null; away: string | null; pos: number }[] = [];
    for (let i = 0; i < 4; i += 2) {
      const scoreA = knockoutScores[`QF-${i}`] || emptyScore();
      const scoreB = knockoutScores[`QF-${i + 1}`] || emptyScore();
      const winnerA = getKnockoutWinner(scoreA, qf[i].home, qf[i].away);
      const winnerB = getKnockoutWinner(scoreB, qf[i + 1].home, qf[i + 1].away);
      sf.push({ home: winnerA, away: winnerB, pos: i / 2 });
    }

    const sfScore0 = knockoutScores['SF-0'] || emptyScore();
    const sfScore1 = knockoutScores['SF-1'] || emptyScore();
    const sfWinner0 = getKnockoutWinner(sfScore0, sf[0].home, sf[0].away);
    const sfWinner1 = getKnockoutWinner(sfScore1, sf[1].home, sf[1].away);

    const sfLoser0 = sfWinner0 && sf[0].home && sf[0].away
      ? (sfWinner0 === sf[0].home ? sf[0].away : sf[0].home)
      : null;
    const sfLoser1 = sfWinner1 && sf[1].home && sf[1].away
      ? (sfWinner1 === sf[1].home ? sf[1].away : sf[1].home)
      : null;

    const thirdPlace = { home: sfLoser0, away: sfLoser1, pos: 0 };
    const final = { home: sfWinner0, away: sfWinner1, pos: 0 };

    return { r32, r16, qf, sf, thirdPlace, final };
  }, [groupStandings, knockoutScores]);

  const getMatchForKey = useCallback((key: string) => {
    const [round, posStr] = key.split('-');
    const pos = parseInt(posStr);
    switch (round) {
      case 'R32': return bracket.r32[pos] || null;
      case 'R16': return bracket.r16[pos] || null;
      case 'QF': return bracket.qf[pos] || null;
      case 'SF': return bracket.sf[pos] || null;
      case 'F': return bracket.final;
      case '3rd': return bracket.thirdPlace;
      default: return null;
    }
  }, [bracket]);

  const saveBracketPrediction = useCallback(async (keys: string[], scores: Record<string, KnockoutScore>) => {
    if (!user) return;
    setSaving(true);

    const upserts = keys.map(key => {
      const [round, posStr] = key.split('-');
      const position = parseInt(posStr);
      const score = scores[key] || emptyScore();
      const match = getMatchForKey(key);

      const ftHome = score.ft_home !== '' ? parseInt(score.ft_home) : null;
      const ftAway = score.ft_away !== '' ? parseInt(score.ft_away) : null;
      const etHome = score.et_home !== '' ? parseInt(score.et_home) : null;
      const etAway = score.et_away !== '' ? parseInt(score.et_away) : null;
      const penHome = score.pen_home !== '' ? parseInt(score.pen_home) : null;
      const penAway = score.pen_away !== '' ? parseInt(score.pen_away) : null;

      const winner = match ? getKnockoutWinner(score, match.home, match.away) : null;

      return {
        user_id: user.id,
        round,
        position,
        ft_home_score: isNaN(ftHome as number) ? null : ftHome,
        ft_away_score: isNaN(ftAway as number) ? null : ftAway,
        et_home_score: isNaN(etHome as number) ? null : etHome,
        et_away_score: isNaN(etAway as number) ? null : etAway,
        pen_home_score: isNaN(penHome as number) ? null : penHome,
        pen_away_score: isNaN(penAway as number) ? null : penAway,
        home_team: match?.home || null,
        away_team: match?.away || null,
        predicted_winner: winner,
        updated_at: new Date().toISOString(),
      };
    });

    await supabase
      .from('bracket_predictions')
      .upsert(upserts, { onConflict: 'user_id,round,position' });

    setSaving(false);
  }, [user, getMatchForKey]);

  function handleScoreChange(roundKey: string, field: keyof KnockoutScore, value: string) {
    setKnockoutScores(prev => {
      const newScores = { ...prev };
      const current = newScores[roundKey] || emptyScore();
      newScores[roundKey] = { ...current, [field]: value };
      clearDownstream(roundKey, newScores);

      pendingSavesRef.current.add(roundKey);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const keysToSave = Array.from(pendingSavesRef.current);
        pendingSavesRef.current.clear();
        saveBracketPrediction(keysToSave, newScores);
      }, 800);

      return newScores;
    });
  }

  function clearDownstream(changedKey: string, scores: Record<string, KnockoutScore>) {
    const [round, posStr] = changedKey.split('-');
    const pos = parseInt(posStr);

    if (round === 'R32') {
      const r16Key = `R16-${Math.floor(pos / 2)}`;
      if (scores[r16Key]) { delete scores[r16Key]; pendingSavesRef.current.add(r16Key); }
      clearDownstream(r16Key, scores);
    } else if (round === 'R16') {
      const qfKey = `QF-${Math.floor(pos / 2)}`;
      if (scores[qfKey]) { delete scores[qfKey]; pendingSavesRef.current.add(qfKey); }
      clearDownstream(qfKey, scores);
    } else if (round === 'QF') {
      const sfKey = `SF-${Math.floor(pos / 2)}`;
      if (scores[sfKey]) { delete scores[sfKey]; pendingSavesRef.current.add(sfKey); }
      clearDownstream(sfKey, scores);
    } else if (round === 'SF') {
      if (scores['F-0']) { delete scores['F-0']; pendingSavesRef.current.add('F-0'); }
      if (scores['3rd-0']) { delete scores['3rd-0']; pendingSavesRef.current.add('3rd-0'); }
    }
  }

  function getRoundMatches(round: string) {
    switch (round) {
      case 'R32': return bracket.r32;
      case 'R16': return bracket.r16;
      case 'QF': return bracket.qf;
      case 'SF': return bracket.sf;
      case 'F': return [bracket.final];
      default: return [];
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentMatches = getRoundMatches(activeRound);
  const showThirdPlace = activeRound === 'F';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-display text-white">BRACKET</h2>
          <p className="text-sm text-gray-400">Your predicted standings feed into the knockout bracket below</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      {/* Knockout Bracket */}
      <div>

        {/* Round tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
          {ROUNDS.map(r => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeRound === r
                  ? 'bg-accent text-navy-900'
                  : 'bg-navy-700 text-gray-400 hover:text-white'
              }`}
            >
              {ROUND_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Match cards for current round */}
        <div className="space-y-3">
          {currentMatches.map((match, idx) => {
            const key = `${activeRound}-${match.pos}`;
            const score = knockoutScores[key] || emptyScore();
            const hasTeams = match.home !== null && match.away !== null;
            const winner = hasTeams ? getKnockoutWinner(score, match.home, match.away) : null;

            return (
              <MatchCard
                key={key}
                matchKey={key}
                home={match.home}
                away={match.away}
                score={score}
                winner={winner}
                matchNumber={idx + 1}
                onScoreChange={handleScoreChange}
                disabled={!hasTeams}
                round={activeRound}
                homeSource={activeRound === 'R32' ? R32_MATCHUPS[match.pos]?.home : undefined}
                awaySource={activeRound === 'R32' ? R32_MATCHUPS[match.pos]?.away : undefined}
              />
            );
          })}

          {showThirdPlace && (
            <>
              <div className="mt-8 mb-3">
                <h3 className="text-xl font-display text-white">THIRD PLACE PLAYOFF</h3>
              </div>
              <MatchCard
                matchKey="3rd-0"
                home={bracket.thirdPlace.home}
                away={bracket.thirdPlace.away}
                score={knockoutScores['3rd-0'] || emptyScore()}
                winner={getKnockoutWinner(
                  knockoutScores['3rd-0'] || emptyScore(),
                  bracket.thirdPlace.home,
                  bracket.thirdPlace.away
                )}
                matchNumber={1}
                onScoreChange={handleScoreChange}
                disabled={!bracket.thirdPlace.home || !bracket.thirdPlace.away}
                round="3rd"
              />
            </>
          )}
        </div>

        {/* Champion display */}
        {activeRound === 'F' && (
          <ChampionDisplay
            score={knockoutScores['F-0'] || emptyScore()}
            home={bracket.final.home}
            away={bracket.final.away}
          />
        )}

        {currentMatches.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No matches in this round yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchCardProps {
  matchKey: string;
  home: string | null;
  away: string | null;
  score: KnockoutScore;
  winner: string | null;
  matchNumber: number;
  onScoreChange: (key: string, field: keyof KnockoutScore, value: string) => void;
  disabled: boolean;
  round: string;
  homeSource?: string;
  awaySource?: string;
}

function MatchCard({ matchKey, home, away, score, winner, matchNumber, onScoreChange, disabled, round, homeSource, awaySource }: MatchCardProps) {
  const ftH = parseInt(score.ft_home);
  const ftA = parseInt(score.ft_away);
  const ftIsDraw = !isNaN(ftH) && !isNaN(ftA) && ftH === ftA;

  const etH = parseInt(score.et_home);
  const etA = parseInt(score.et_away);
  const etIsDraw = ftIsDraw && !isNaN(etH) && !isNaN(etA) && etH === etA;

  return (
    <div className={`card transition-all ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
          {ROUND_LABELS[round]} - Match {matchNumber}
        </span>
        {winner && (
          <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
            {TEAM_FLAGS[winner]} advances
          </span>
        )}
      </div>

      {/* Team names */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 text-right min-w-0">
          {home ? (
            <span className={`text-sm font-medium truncate block ${winner === home ? 'text-accent' : 'text-white'}`}>
              {TEAM_FLAGS[home] || ''} {home}
            </span>
          ) : (
            <span className="text-sm text-gray-600 italic block">
              {homeSource || 'TBD'}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600 font-medium">vs</span>
        <div className="flex-1 min-w-0">
          {away ? (
            <span className={`text-sm font-medium truncate block ${winner === away ? 'text-accent' : 'text-white'}`}>
              {away} {TEAM_FLAGS[away] || ''}
            </span>
          ) : (
            <span className="text-sm text-gray-600 italic block">
              {awaySource || 'TBD'}
            </span>
          )}
        </div>
      </div>

      {/* Full Time */}
      <ScoreRow
        label="Full Time"
        homeValue={score.ft_home}
        awayValue={score.ft_away}
        onHomeChange={v => onScoreChange(matchKey, 'ft_home', v)}
        onAwayChange={v => onScoreChange(matchKey, 'ft_away', v)}
        disabled={disabled}
      />

      {/* Extra Time - only if FT is a draw */}
      {ftIsDraw && (
        <ScoreRow
          label="Extra Time"
          homeValue={score.et_home}
          awayValue={score.et_away}
          onHomeChange={v => onScoreChange(matchKey, 'et_home', v)}
          onAwayChange={v => onScoreChange(matchKey, 'et_away', v)}
          disabled={disabled}
        />
      )}

      {/* Penalties - only if FT and ET are both draws */}
      {etIsDraw && (
        <ScoreRow
          label="Penalties"
          homeValue={score.pen_home}
          awayValue={score.pen_away}
          onHomeChange={v => onScoreChange(matchKey, 'pen_home', v)}
          onAwayChange={v => onScoreChange(matchKey, 'pen_away', v)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function ScoreRow({ label, homeValue, awayValue, onHomeChange, onAwayChange, disabled }: {
  label: string;
  homeValue: string;
  awayValue: string;
  onHomeChange: (v: string) => void;
  onAwayChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-2">
      <span className="text-[10px] text-gray-500 w-16 text-right font-medium uppercase tracking-wide">{label}</span>
      <input
        type="number"
        min="0"
        max="20"
        value={homeValue}
        onChange={e => onHomeChange(e.target.value)}
        disabled={disabled}
        className="w-10 h-9 bg-navy-700 border border-navy-500 rounded-lg text-center text-white text-sm font-bold
                   focus:border-accent focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <span className="text-gray-500 text-xs">-</span>
      <input
        type="number"
        min="0"
        max="20"
        value={awayValue}
        onChange={e => onAwayChange(e.target.value)}
        disabled={disabled}
        className="w-10 h-9 bg-navy-700 border border-navy-500 rounded-lg text-center text-white text-sm font-bold
                   focus:border-accent focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function ChampionDisplay({ score, home, away }: { score: KnockoutScore; home: string | null; away: string | null }) {
  const champion = getKnockoutWinner(score, home, away);
  if (!champion) return null;

  return (
    <div className="mt-8 text-center">
      <div className="inline-block bg-gradient-to-b from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-2xl px-8 py-6">
        <p className="text-xs text-amber-400 font-medium uppercase tracking-widest mb-2">Your Predicted Champion</p>
        <p className="text-4xl mb-1">{TEAM_FLAGS[champion]}</p>
        <p className="text-2xl font-display text-white">{champion}</p>
      </div>
    </div>
  );
}
