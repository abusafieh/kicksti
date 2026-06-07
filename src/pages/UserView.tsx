import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Target, TableProperties, GitBranch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { COUNTRY_FLAGS, TEAM_FLAGS, TEAM_ISO_CODES, toEnglishName } from '../lib/constants';
import {
  calculateGroupStandings,
  buildBracket,
  getKnockoutWinner,
  emptyScore,
  type KnockoutScore,
  type TeamStanding,
} from '../lib/bracket';
import BracketGraph from '../components/BracketGraph';

const ROUND_LABELS: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter Finals',
  SF: 'Semi Finals', '3rd': 'Third Place', F: 'Final',
};

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

interface UserProfile {
  id: string;
  display_name: string;
  team_name: string | null;
  country: string;
  favourite_team: string;
}

type Tab = 'predictions' | 'standings' | 'bracket';

export default function UserView() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [knockoutScores, setKnockoutScores] = useState<Record<string, KnockoutScore>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('predictions');
  const [userRanks, setUserRanks] = useState<{
    global: number; country: number; team: number;
  } | null>(null);

  useEffect(() => { loadData(); }, [userId]);

  async function loadData() {
    if (!userId) return;
    setLoading(true);

    const [profileRes, matchesRes, predsRes, bracketRes, allUsersRes, allPredsRes] = await Promise.all([
      supabase.from('users').select('id, display_name, team_name, country, favourite_team').eq('id', userId).maybeSingle(),
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('predictions').select('match_id, predicted_home_score, predicted_away_score, points_awarded').eq('user_id', userId),
      supabase.from('bracket_predictions').select('*').eq('user_id', userId),
      supabase.from('users').select('id, country, favourite_team'),
      supabase.from('predictions').select('user_id, points_awarded'),
    ]);

    if (!profileRes.data) { setNotFound(true); setLoading(false); return; }
    setProfile(profileRes.data);
    if (matchesRes.data) setMatches(matchesRes.data);

    const predMap: Record<string, { home: string; away: string }> = {};
    let points = 0;
    predsRes.data?.forEach(p => {
      predMap[p.match_id] = { home: p.predicted_home_score.toString(), away: p.predicted_away_score.toString() };
      points += p.points_awarded || 0;
    });
    setPredictions(predMap);
    setTotalPoints(points);

    // Compute user's league rankings (global, country, team)
    if (allUsersRes.data && allPredsRes.data) {
      const userPoints: Record<string, number> = {};
      allPredsRes.data.forEach(p => {
        userPoints[p.user_id] = (userPoints[p.user_id] || 0) + (p.points_awarded || 0);
      });

      const me = profileRes.data;
      const globalRank = Object.entries(userPoints)
        .filter(([, pts]) => pts > points)
        .length + 1;

      const countryUsers = allUsersRes.data.filter(u => u.country === me.country);
      const countryRank = countryUsers
        .filter(u => (userPoints[u.id] || 0) > points)
        .length + 1;

      const teamUsers = allUsersRes.data.filter(u => u.favourite_team === me.favourite_team);
      const teamRank = teamUsers
        .filter(u => (userPoints[u.id] || 0) > points)
        .length + 1;

      setUserRanks({ global: globalRank, country: countryRank, team: teamRank });
    }

    const koMap: Record<string, KnockoutScore> = {};
    bracketRes.data?.forEach(bp => {
      koMap[`${bp.round}-${bp.position}`] = {
        ft_home:  bp.ft_home_score?.toString()  ?? '',
        ft_away:  bp.ft_away_score?.toString()  ?? '',
        et_home:  bp.et_home_score?.toString()  ?? '',
        et_away:  bp.et_away_score?.toString()  ?? '',
        pen_home: bp.pen_home_score?.toString() ?? '',
        pen_away: bp.pen_away_score?.toString() ?? '',
      };
    });
    setKnockoutScores(koMap);
    setLoading(false);
  }

  const groupStandings = useMemo(() => {
    const groups = [...new Set(matches.map(m => m.group_name))].sort();
    const s: Record<string, TeamStanding[]> = {};
    groups.forEach(g => { s[g] = calculateGroupStandings(matches, predictions, g); });
    return s;
  }, [matches, predictions]);

  const bracket = useMemo(() => buildBracket(groupStandings, knockoutScores), [groupStandings, knockoutScores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-lg text-text-muted mb-4">User not found.</p>
        <Link to="/leaderboard" className="text-accent font-semibold">Back to Leaderboard</Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <Link to="/leaderboard" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </Link>

      {/* Identity */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 bg-accent/10 border-2 border-accent/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-3xl font-display text-accent">
              {(profile.team_name || profile.display_name).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-text-primary">{profile.team_name || profile.display_name}</h3>
            {profile.team_name && <p className="text-base text-text-muted mt-0.5">{profile.display_name}</p>}
            <p className="text-base text-text-muted mt-1">{COUNTRY_FLAGS[profile.country] || ''} {profile.country}</p>
            <p className="text-base text-text-muted">{TEAM_FLAGS[profile.favourite_team] || ''} {profile.favourite_team}</p>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-2">
              {userRanks && [
                { label: 'Global', rank: userRanks.global },
                { label: profile.country, rank: userRanks.country },
                { label: profile.favourite_team, rank: userRanks.team },
              ].map((league, i) => (
                <div key={i} className="bg-elevated rounded-lg p-2 text-center">
                  <p className="text-2xl font-display text-accent">#{league.rank}</p>
                  <p className="text-xs text-text-muted truncate">{league.label}</p>
                </div>
              ))}
            </div>
            <p className="text-lg font-bold text-text-primary mt-3">{totalPoints} <span className="text-sm text-text-muted font-normal">pts</span></p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'predictions', label: 'Predictions', icon: Target },
          { key: 'standings',   label: 'Standings',   icon: TableProperties },
          { key: 'bracket',     label: 'Bracket',     icon: GitBranch },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-accent text-white' : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'predictions' && <PredictionsView matches={matches} predictions={predictions} />}
      {tab === 'standings' && <StandingsView groupStandings={groupStandings} />}
      {tab === 'bracket' && <BracketTab bracket={bracket} knockoutScores={knockoutScores} />}
    </div>
  );
}

// ── Predictions (group stage, read-only) ─────────────────────────────────────
function PredictionsView({ matches, predictions }: {
  matches: Match[]; predictions: Record<string, { home: string; away: string }>;
}) {
  const groups = [...new Set(matches.map(m => m.group_name))].sort();
  if (Object.keys(predictions).length === 0) {
    return <EmptyState icon={Target} text="This player hasn't made any predictions yet." />;
  }
  return (
    <div className="space-y-6">
      {groups.map(g => {
        const groupMatches = matches.filter(m => m.group_name === g);
        return (
          <div key={g}>
            <h3 className="text-lg font-display text-nav mb-2">GROUP {g}</h3>
            <div className="space-y-2">
              {groupMatches.map(m => {
                const p = predictions[m.id];
                return (
                  <div key={m.id} className="card p-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className="text-sm font-semibold text-text-primary truncate">{toEnglishName(m.home_team)}</span>
                      {TEAM_ISO_CODES[m.home_team] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[m.home_team]}.png`} width={22} className="rounded-sm shrink-0" alt="" />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-elevated border border-border font-bold text-text-primary">{p ? p.home : '–'}</span>
                      <span className="text-text-faint text-sm font-bold">-</span>
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-elevated border border-border font-bold text-text-primary">{p ? p.away : '–'}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {TEAM_ISO_CODES[m.away_team] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[m.away_team]}.png`} width={22} className="rounded-sm shrink-0" alt="" />}
                      <span className="text-sm font-semibold text-text-primary truncate">{toEnglishName(m.away_team)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Standings (read-only) ────────────────────────────────────────────────────
function StandingsView({ groupStandings }: { groupStandings: Record<string, TeamStanding[]> }) {
  const hasData = Object.values(groupStandings).some(s => s.some(t => t.played > 0));
  if (!hasData) return <EmptyState icon={TableProperties} text="No standings yet — this player hasn't predicted group matches." />;
  return (
    <div className="space-y-5">
      {Object.entries(groupStandings).sort().map(([group, standings]) => (
        <div key={group} className="bg-surface border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-5 py-3 bg-elevated border-b border-border">
            <span className="text-base font-display text-nav tracking-wide">GROUP {group}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-border">
                <th className="text-left pl-4 pr-2 py-2.5 font-semibold w-8">#</th>
                <th className="text-left px-2 py-2.5 font-semibold">Team</th>
                <th className="text-center px-2 py-2.5 font-semibold w-9">P</th>
                <th className="text-center px-2 py-2.5 font-semibold w-9">GD</th>
                <th className="text-center px-2 pr-4 py-2.5 font-semibold w-10">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, idx) => {
                const qualifies = idx < 2 && team.played > 0;
                return (
                  <tr key={team.team} className={`border-t border-border ${qualifies ? 'bg-accent/[0.04]' : idx === 2 && team.played > 0 ? 'bg-amber-500/[0.04]' : ''}`}>
                    <td className="pl-4 pr-2 py-2.5 text-text-faint font-bold">{idx + 1}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2 font-semibold text-text-primary">
                        {TEAM_ISO_CODES[team.team] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[team.team]}.png`} width={20} className="rounded-sm shrink-0" alt="" />}
                        {toEnglishName(team.team)}
                      </span>
                    </td>
                    <td className="text-center px-2 py-2.5 text-text-muted">{team.played}</td>
                    <td className="text-center px-2 py-2.5 text-text-muted">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="text-center px-2 pr-4 py-2.5 font-bold text-accent">{team.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}


// ── Bracket tab: List / Graphical toggle (read-only) ─────────────────────────
function BracketTab({ bracket, knockoutScores }: {
  bracket: ReturnType<typeof buildBracket>; knockoutScores: Record<string, KnockoutScore>;
}) {
  const [view, setView] = useState<'list' | 'graph'>('list');

  const hasAny = Object.keys(knockoutScores).length > 0 || bracket.r32.some(m => m.home || m.away);
  if (!hasAny) return <EmptyState icon={GitBranch} text="No bracket predictions yet." />;

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
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

      {view === 'graph' ? (
        <BracketGraph
          r32={bracket.r32} r16={bracket.r16} qf={bracket.qf} sf={bracket.sf}
          thirdPlace={bracket.thirdPlace} final={bracket.final}
          knockoutScores={knockoutScores} readOnly
        />
      ) : (
        <BracketList bracket={bracket} knockoutScores={knockoutScores} />
      )}
    </div>
  );
}

// ── Read-only round-by-round list ────────────────────────────────────────────
function BracketList({ bracket, knockoutScores }: {
  bracket: ReturnType<typeof buildBracket>; knockoutScores: Record<string, KnockoutScore>;
}) {
  const rounds: { key: string; slots: { home: string | null; away: string | null; pos: number }[] }[] = [
    { key: 'R32', slots: bracket.r32 },
    { key: 'R16', slots: bracket.r16 },
    { key: 'QF', slots: bracket.qf },
    { key: 'SF', slots: bracket.sf },
    { key: 'F', slots: [bracket.final] },
    { key: '3rd', slots: [bracket.thirdPlace] },
  ];
  const champion = getKnockoutWinner(knockoutScores['F-0'] || emptyScore(), bracket.final.home, bracket.final.away);

  return (
    <div className="space-y-6">
      {champion && (
        <div className="flex items-center gap-4 bg-[#fffdf7] border-[1.5px] border-amber-500/45 rounded-2xl p-4 shadow-card">
          <img src="/world-cup-trophy.jpg" alt="Trophy" style={{ height: 64, width: 'auto' }} />
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-amber-700 uppercase mb-1.5">Predicted Champion</p>
            <span className="flex items-center gap-2">
              {TEAM_ISO_CODES[champion] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[champion]}.png`} width={28} className="rounded-sm" alt="" />}
              <span className="text-xl font-extrabold text-text-primary">{toEnglishName(champion)}</span>
            </span>
          </div>
        </div>
      )}

      {rounds.map(({ key, slots }) => {
        if (!slots.some(s => s.home || s.away)) return null;
        return (
          <div key={key}>
            <h3 className="text-lg font-display text-text-primary mb-2">{ROUND_LABELS[key]}</h3>
            <div className="space-y-2">
              {slots.map((m, idx) => {
                if (!m.home && !m.away) return null;
                const k = `${key}-${m.pos ?? idx}`;
                const score = knockoutScores[k] || emptyScore();
                const winner = getKnockoutWinner(score, m.home, m.away);
                const detail = scoreDetail(score);
                return (
                  <div key={k} className="card p-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className={`text-sm font-semibold truncate ${winner === m.home && m.home ? 'text-accent' : 'text-text-primary'}`}>{m.home ? toEnglishName(m.home) : 'TBD'}</span>
                      {m.home && TEAM_ISO_CODES[m.home] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[m.home]}.png`} width={22} className="rounded-sm shrink-0" alt="" />}
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-elevated border border-border font-bold text-text-primary">{score.ft_home || '–'}</span>
                        <span className="text-text-faint text-sm font-bold">-</span>
                        <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-elevated border border-border font-bold text-text-primary">{score.ft_away || '–'}</span>
                      </div>
                      {detail && <span className="text-[10px] text-text-muted mt-1">{detail}</span>}
                    </div>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {m.away && TEAM_ISO_CODES[m.away] && <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[m.away]}.png`} width={22} className="rounded-sm shrink-0" alt="" />}
                      <span className={`text-sm font-semibold truncate ${winner === m.away && m.away ? 'text-accent' : 'text-text-primary'}`}>{m.away ? toEnglishName(m.away) : 'TBD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact "a.e.t. 2-1" / "pens 4-3" suffix for knockout cards
function scoreDetail(s: KnockoutScore): string | null {
  if (s.pen_home !== '' && s.pen_away !== '') return `a.e.t. ${s.et_home}-${s.et_away} · pens ${s.pen_home}-${s.pen_away}`;
  if (s.et_home !== '' && s.et_away !== '') return `a.e.t. ${s.et_home}-${s.et_away}`;
  return null;
}

function EmptyState({ icon: Icon, text }: { icon: typeof Target; text: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-14 h-14 text-text-faint mx-auto mb-4" />
      <p className="text-lg text-text-muted">{text}</p>
    </div>
  );
}
