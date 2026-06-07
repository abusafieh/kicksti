import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { GitBranch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePredictions } from '../contexts/PredictionsContext';
import { TEAM_ISO_CODES, toEnglishName } from '../lib/constants';
import BracketGraph from '../components/BracketGraph';
import {
  calculateGroupStandings,
  R32_MATCHUPS,
  formatSource,
  buildBracket,
  emptyScore,
  getKnockoutWinner,
  type KnockoutScore,
  type TeamStanding,
} from '../lib/bracket';

// Enforce knockout scoring rules so list & graph stay consistent:
//  • FT not a draw  → no extra time / penalties (cleared)
//  • FT is a draw   → ET carries the FT score forward (floor = FT; increase only)
//  • ET still level → penalties auto-populate to 0-0 (editable)
//  • ET decided     → penalties greyed out / cleared
function normalizeKnockoutScore(s: KnockoutScore): KnockoutScore {
  const ftH = parseInt(s.ft_home), ftA = parseInt(s.ft_away);
  const ftDraw = !isNaN(ftH) && !isNaN(ftA) && ftH === ftA;

  if (!ftDraw) {
    return { ...s, et_home: '', et_away: '', pen_home: '', pen_away: '' };
  }

  // FT draw → ET cannot drop below the FT score (carried forward)
  let etH = parseInt(s.et_home);
  let etA = parseInt(s.et_away);
  etH = isNaN(etH) || etH < ftH ? ftH : etH;
  etA = isNaN(etA) || etA < ftA ? ftA : etA;

  const etDraw = etH === etA;
  let { pen_home, pen_away } = s;
  if (!etDraw) {
    pen_home = '';
    pen_away = '';
  } else {
    if (pen_home === '') pen_home = '0';
    if (pen_away === '') pen_away = '0';
  }

  return { ...s, et_home: String(etH), et_away: String(etA), pen_home, pen_away };
}

const ROUNDS = ['R32', 'R16', 'QF', 'SF', 'F'] as const;
const ROUND_LABELS: Record<string, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF:  'Quarter Finals',
  SF:  'Semi Finals',
  '3rd': 'Third Place',
  F:   'Final',
};

export default function Bracket() {
  const { user } = useAuth();
  const { matches, predictions } = usePredictions();
  const [knockoutScores, setKnockoutScores] = useState<Record<string, KnockoutScore>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRound, setActiveRound] = useState<string>('R32');
  const [view, setView] = useState<'list' | 'graph'>('list');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (user) {
      const { data: bracketData } = await supabase
        .from('bracket_predictions')
        .select('*')
        .eq('user_id', user.id);

      if (bracketData) {
        const loaded: Record<string, KnockoutScore> = {};
        bracketData.forEach(bp => {
          loaded[`${bp.round}-${bp.position}`] = normalizeKnockoutScore({
            ft_home:  bp.ft_home_score?.toString()  ?? '',
            ft_away:  bp.ft_away_score?.toString()  ?? '',
            et_home:  bp.et_home_score?.toString()  ?? '',
            et_away:  bp.et_away_score?.toString()  ?? '',
            pen_home: bp.pen_home_score?.toString() ?? '',
            pen_away: bp.pen_away_score?.toString() ?? '',
          });
        });
        setKnockoutScores(loaded);
      }
    }
    setLoading(false);
  }

  const groupStandings = useMemo(() => {
    const groups = [...new Set(matches.map(m => m.group_name))].sort();
    const standings: Record<string, TeamStanding[]> = {};
    groups.forEach(g => { standings[g] = calculateGroupStandings(matches, predictions, g); });
    return standings;
  }, [matches, predictions]);

  const bracket = useMemo(
    () => buildBracket(groupStandings, knockoutScores),
    [groupStandings, knockoutScores]
  );

  const getMatchForKey = useCallback((key: string) => {
    const [round, posStr] = key.split('-');
    const pos = parseInt(posStr);
    switch (round) {
      case 'R32': return bracket.r32[pos] || null;
      case 'R16': return bracket.r16[pos] || null;
      case 'QF':  return bracket.qf[pos]  || null;
      case 'SF':  return bracket.sf[pos]  || null;
      case 'F':   return bracket.final;
      case '3rd': return bracket.thirdPlace;
      default:    return null;
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
      const toInt = (v: string) => { const n = parseInt(v); return isNaN(n) ? null : n; };
      return {
        user_id: user.id, round, position,
        ft_home_score:  toInt(score.ft_home),  ft_away_score:  toInt(score.ft_away),
        et_home_score:  toInt(score.et_home),  et_away_score:  toInt(score.et_away),
        pen_home_score: toInt(score.pen_home), pen_away_score: toInt(score.pen_away),
        home_team: match?.home || null, away_team: match?.away || null,
        predicted_winner: match ? getKnockoutWinner(score, match.home, match.away) : null,
        updated_at: new Date().toISOString(),
      };
    });
    await supabase.from('bracket_predictions').upsert(upserts, { onConflict: 'user_id,round,position' });
    setSaving(false);
  }, [user, getMatchForKey]);

  function handleScoreChange(roundKey: string, field: keyof KnockoutScore, value: string) {
    setKnockoutScores(prev => {
      const newScores = { ...prev };
      newScores[roundKey] = normalizeKnockoutScore({ ...(newScores[roundKey] || emptyScore()), [field]: value });
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



  function getRoundMatches(round: string) {
    switch (round) {
      case 'R32': return bracket.r32;
      case 'R16': return bracket.r16;
      case 'QF':  return bracket.qf;
      case 'SF':  return bracket.sf;
      case 'F':   return [bracket.final];
      default:    return [];
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentMatches = getRoundMatches(activeRound);
  const showThirdPlace = activeRound === 'F';

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-display text-text-primary">BRACKET</h2>
          <p className="text-base text-text-muted mt-1">Your predicted standings feed into the knockout bracket</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          )}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-semibold">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 transition-colors ${view === 'list' ? 'bg-accent text-white' : 'bg-elevated text-text-muted hover:text-text-primary'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('graph')}
              className={`px-4 py-2 transition-colors ${view === 'graph' ? 'bg-accent text-white' : 'bg-elevated text-text-muted hover:text-text-primary'}`}
            >
              Bracket
            </button>
          </div>
        </div>
      </div>

      {/* Graphical bracket view */}
      {view === 'graph' && (
        <BracketGraph
          r32={bracket.r32}
          r16={bracket.r16}
          qf={bracket.qf}
          sf={bracket.sf}
          thirdPlace={bracket.thirdPlace}
          final={bracket.final}
          knockoutScores={knockoutScores}
          onScoreChange={handleScoreChange}
        />
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Round tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {ROUNDS.map(r => (
              <button
                key={r}
                onClick={() => setActiveRound(r)}
                className={`px-5 py-2.5 rounded-lg text-base font-semibold whitespace-nowrap transition-colors ${
                  activeRound === r
                    ? 'bg-accent text-white'
                    : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
                }`}
              >
                {ROUND_LABELS[r]}
              </button>
            ))}
          </div>

          {/* Match cards */}
          <div className="space-y-4">
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
                  homeSource={activeRound === 'R32' ? formatSource(R32_MATCHUPS[match.pos]?.home ?? '') : undefined}
                  awaySource={activeRound === 'R32' ? formatSource(R32_MATCHUPS[match.pos]?.away ?? '') : undefined}
                />
              );
            })}

            {showThirdPlace && (
              <>
                <div className="mt-10 mb-4">
                  <h3 className="text-2xl font-display text-text-primary">THIRD PLACE PLAYOFF</h3>
                </div>
                <MatchCard
                  matchKey="3rd-0"
                  home={bracket.thirdPlace.home}
                  away={bracket.thirdPlace.away}
                  score={knockoutScores['3rd-0'] || emptyScore()}
                  winner={getKnockoutWinner(knockoutScores['3rd-0'] || emptyScore(), bracket.thirdPlace.home, bracket.thirdPlace.away)}
                  matchNumber={1}
                  onScoreChange={handleScoreChange}
                  disabled={!bracket.thirdPlace.home || !bracket.thirdPlace.away}
                  round="3rd"
                />
              </>
            )}
          </div>

          {activeRound === 'F' && (
            <ChampionDisplay
              score={knockoutScores['F-0'] || emptyScore()}
              home={bracket.final.home}
              away={bracket.final.away}
            />
          )}

          {currentMatches.length === 0 && (
            <div className="text-center py-16">
              <GitBranch className="w-14 h-14 text-text-faint mx-auto mb-4" />
              <p className="text-lg text-text-muted">No matches in this round yet.</p>
            </div>
          )}
        </>
      )}
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
    <div className={`card p-5 transition-all ${disabled ? 'opacity-60' : ''}`}>
      {/* Match header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          {ROUND_LABELS[round]} · Match {matchNumber}
        </span>
        {winner && (
          <span className="flex items-center gap-2 text-sm font-semibold text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg">
            {TEAM_ISO_CODES[winner] && (
              <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[winner]}.png`} width={20} alt={toEnglishName(winner)} className="rounded-sm" />
            )}
            {toEnglishName(winner)} advances
          </span>
        )}
      </div>

      {/* Team names */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 text-right min-w-0">
          {home ? (
            <span className={`flex items-center justify-end gap-2 text-base font-semibold ${winner === home ? 'text-accent' : 'text-text-primary'}`}>
              {toEnglishName(home)}
              {TEAM_ISO_CODES[home] && (
                <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[home]}.png`} width={24} alt={home} className="rounded-sm shrink-0" />
              )}
            </span>
          ) : (
            <span className="text-base text-text-faint italic block text-right">{homeSource || 'TBD'}</span>
          )}
        </div>
        <span className="text-sm text-text-muted font-semibold shrink-0">vs</span>
        <div className="flex-1 min-w-0">
          {away ? (
            <span className={`flex items-center gap-2 text-base font-semibold ${winner === away ? 'text-accent' : 'text-text-primary'}`}>
              {TEAM_ISO_CODES[away] && (
                <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[away]}.png`} width={24} alt={toEnglishName(away)} className="rounded-sm shrink-0" />
              )}
              {toEnglishName(away)}
            </span>
          ) : (
            <span className="text-base text-text-faint italic block">{awaySource || 'TBD'}</span>
          )}
        </div>
      </div>

      {/* Score rows */}
      <ScoreRow
        label="Full Time"
        homeValue={score.ft_home} awayValue={score.ft_away}
        onHomeChange={v => onScoreChange(matchKey, 'ft_home', v)}
        onAwayChange={v => onScoreChange(matchKey, 'ft_away', v)}
        disabled={disabled}
      />
      {ftIsDraw && (
        <ScoreRow
          label="Extra Time"
          homeValue={score.et_home} awayValue={score.et_away}
          onHomeChange={v => onScoreChange(matchKey, 'et_home', v)}
          onAwayChange={v => onScoreChange(matchKey, 'et_away', v)}
          disabled={disabled}
        />
      )}
      {ftIsDraw && (
        <ScoreRow
          label="Penalties"
          homeValue={score.pen_home} awayValue={score.pen_away}
          onHomeChange={v => onScoreChange(matchKey, 'pen_home', v)}
          onAwayChange={v => onScoreChange(matchKey, 'pen_away', v)}
          disabled={disabled || !etIsDraw}
        />
      )}
    </div>
  );
}

function ScoreRow({ label, homeValue, awayValue, onHomeChange, onAwayChange, disabled }: {
  label: string; homeValue: string; awayValue: string;
  onHomeChange: (v: string) => void; onAwayChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4 mt-3">
      <div className="flex-1 flex justify-end">
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
          value={homeValue} onChange={e => onHomeChange(e.target.value.replace(/\D/g, ''))} disabled={disabled}
          className="w-14 h-12 bg-surface border-2 border-border rounded-xl text-center text-text-primary text-lg font-bold
                     focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex flex-col items-center shrink-0 gap-0.5">
        <span className="text-xs text-text-muted font-semibold uppercase tracking-wide leading-none">{label}</span>
        <span className="text-text-faint text-base font-bold">-</span>
      </div>
      <div className="flex-1 flex items-center">
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2}
          value={awayValue} onChange={e => onAwayChange(e.target.value.replace(/\D/g, ''))} disabled={disabled}
          className="w-14 h-12 bg-surface border-2 border-border rounded-xl text-center text-text-primary text-lg font-bold
                     focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}


function ChampionDisplay({ score, home, away }: { score: KnockoutScore; home: string | null; away: string | null }) {
  const champion = getKnockoutWinner(score, home, away);
  if (!champion) return null;
  return (
    <div className="mt-10 text-center">
      <div className="inline-block bg-gradient-to-b from-amber-500/20 to-amber-600/5 border border-amber-500/30 rounded-2xl px-10 py-8">
        <p className="text-sm text-amber-400 font-semibold uppercase tracking-widest mb-4">Your Predicted Champion</p>
        {TEAM_ISO_CODES[champion] && (
          <img
            src={`https://flagcdn.com/w80/${TEAM_ISO_CODES[champion]}.png`}
            width={80}
            alt={champion}
            className="rounded-md mx-auto mb-3"
          />
        )}
        <p className="text-3xl font-display text-text-primary">{toEnglishName(champion)}</p>
      </div>
    </div>
  );
}
