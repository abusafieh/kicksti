import { TEAM_FLAGS } from './constants';

export interface TeamStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface BracketMatch {
  id: string;
  round: string;
  position: number;
  home: string | null;
  away: string | null;
  homeScore: string;
  awayScore: string;
  winner: string | null;
  homeSource: string;
  awaySource: string;
}

interface MatchData {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
}

interface PredScore {
  home: string;
  away: string;
}

export function calculateGroupStandings(
  matches: MatchData[],
  predictions: Record<string, PredScore>,
  group: string
): TeamStanding[] {
  const groupMatches = matches.filter(m => m.group_name === group);
  const teams = new Set<string>();
  groupMatches.forEach(m => { teams.add(m.home_team); teams.add(m.away_team); });

  const standings: Record<string, TeamStanding> = {};
  teams.forEach(t => {
    standings[t] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  });

  groupMatches.forEach(m => {
    const pred = predictions[m.id];
    if (!pred || pred.home === '' || pred.away === '') return;

    const h = parseInt(pred.home);
    const a = parseInt(pred.away);
    if (isNaN(h) || isNaN(a)) return;

    const home = standings[m.home_team];
    const away = standings[m.away_team];
    if (!home || !away) return;

    home.played++;
    away.played++;
    home.gf += h;
    home.ga += a;
    away.gf += a;
    away.ga += h;

    if (h > a) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (h < a) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  });

  Object.values(standings).forEach(s => { s.gd = s.gf - s.ga; });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
}

// ---------------------------------------------------------------------------
// 2026 FIFA World Cup knockout bracket
// Source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
//
// R32 slot notation:
//   "1X"      = Winner of Group X
//   "2X"      = Runner-up of Group X
//   "3ABCDF"  = Best 3rd-placed team from the eligible groups A,B,C,D,F
//               (8 of the 12 third-placed teams advance; exact slot assignment
//                depends on which groups qualify per FIFA's assignment table)
// ---------------------------------------------------------------------------

export const R32_MATCHUPS: { home: string; away: string }[] = [
  { home: '2A',     away: '2B'     },  // pos  0  (M73) Runner-up A vs Runner-up B
  { home: '1E',     away: '3ABCDF' },  // pos  1  (M74) Winner E  vs Best 3rd A/B/C/D/F
  { home: '1F',     away: '2C'     },  // pos  2  (M75) Winner F  vs Runner-up C
  { home: '1C',     away: '2F'     },  // pos  3  (M76) Winner C  vs Runner-up F
  { home: '1I',     away: '3CDFGH' },  // pos  4  (M77) Winner I  vs Best 3rd C/D/F/G/H
  { home: '2E',     away: '2I'     },  // pos  5  (M78) Runner-up E vs Runner-up I
  { home: '1A',     away: '3CEFHI' },  // pos  6  (M79) Winner A  vs Best 3rd C/E/F/H/I
  { home: '1L',     away: '3EHIJK' },  // pos  7  (M80) Winner L  vs Best 3rd E/H/I/J/K
  { home: '1D',     away: '3BEFIJ' },  // pos  8  (M81) Winner D  vs Best 3rd B/E/F/I/J
  { home: '1G',     away: '3AEHIJ' },  // pos  9  (M82) Winner G  vs Best 3rd A/E/H/I/J
  { home: '2K',     away: '2L'     },  // pos 10  (M83) Runner-up K vs Runner-up L
  { home: '1H',     away: '2J'     },  // pos 11  (M84) Winner H  vs Runner-up J
  { home: '1B',     away: '3EFGIJ' },  // pos 12  (M85) Winner B  vs Best 3rd E/F/G/I/J
  { home: '1J',     away: '2H'     },  // pos 13  (M86) Winner J  vs Runner-up H
  { home: '1K',     away: '3DEIJL' },  // pos 14  (M87) Winner K  vs Best 3rd D/E/I/J/L
  { home: '2D',     away: '2G'     },  // pos 15  (M88) Runner-up D vs Runner-up G
];

// R16 pairings: which two R32 positions feed each R16 position
// [homeR32pos, awayR32pos] → R16 position index
export const R16_PAIRINGS: [number, number][] = [
  [1,  4],   // R16 pos 0  (M89)  Winner M74 vs Winner M77
  [0,  2],   // R16 pos 1  (M90)  Winner M73 vs Winner M75
  [3,  5],   // R16 pos 2  (M91)  Winner M76 vs Winner M78
  [6,  7],   // R16 pos 3  (M92)  Winner M79 vs Winner M80
  [10, 11],  // R16 pos 4  (M93)  Winner M83 vs Winner M84
  [8,  9],   // R16 pos 5  (M94)  Winner M81 vs Winner M82
  [13, 15],  // R16 pos 6  (M95)  Winner M86 vs Winner M88
  [12, 14],  // R16 pos 7  (M96)  Winner M85 vs Winner M87
];

// QF pairings: which two R16 positions feed each QF position
export const QF_PAIRINGS: [number, number][] = [
  [0, 1],   // QF pos 0  (M97)   Winner M89 vs Winner M90
  [4, 5],   // QF pos 1  (M98)   Winner M93 vs Winner M94
  [2, 3],   // QF pos 2  (M99)   Winner M91 vs Winner M92
  [6, 7],   // QF pos 3  (M100)  Winner M95 vs Winner M96
];

// SF pairings: sequential from QF  [0,1] → SF0, [2,3] → SF1
// SF pos 0 (M101): QF0 vs QF1
// SF pos 1 (M102): QF2 vs QF3

// Lookup: R32 position → which R16 position it feeds (derived from R16_PAIRINGS)
export const R32_TO_R16: number[] = (() => {
  const map = new Array<number>(16).fill(-1);
  R16_PAIRINGS.forEach(([a, b], r16pos) => { map[a] = r16pos; map[b] = r16pos; });
  return map;
})();

// Lookup: R16 position → which QF position it feeds (derived from QF_PAIRINGS)
export const R16_TO_QF: number[] = (() => {
  const map = new Array<number>(8).fill(-1);
  QF_PAIRINGS.forEach(([a, b], qfpos) => { map[a] = qfpos; map[b] = qfpos; });
  return map;
})();

// ---------------------------------------------------------------------------
// Best 3rd-place team bracket assignment
// ---------------------------------------------------------------------------

// For each R32 "best 3rd" slot (by position index), which groups are eligible
export const THIRD_ELIGIBLE: Record<number, string[]> = {
  1:  ['A','B','C','D','F'],
  4:  ['C','D','F','G','H'],
  6:  ['C','E','F','H','I'],
  7:  ['E','H','I','J','K'],
  8:  ['B','E','F','I','J'],
  9:  ['A','E','H','I','J'],
  12: ['E','F','G','I','J'],
  14: ['D','E','I','J','L'],
};

// Human-readable label for each 3rd-place slot (what team they'd face)
export const THIRD_SLOT_VS: Record<number, string> = {
  1:  'vs Winner Grp E',
  4:  'vs Winner Grp I',
  6:  'vs Winner Grp A',
  7:  'vs Winner Grp L',
  8:  'vs Winner Grp D',
  9:  'vs Winner Grp G',
  12: 'vs Winner Grp B',
  14: 'vs Winner Grp K',
};

/**
 * Assign the top-8 qualifying 3rd-place groups to bracket slots using
 * Kuhn's bipartite matching algorithm. Greedy slot-by-slot ordering can
 * leave valid groups unassigned; augmenting paths guarantee every group
 * that has an eligible slot gets one.
 *
 * @param qualifyingGroups - group letters in rank order (best first)
 * @returns Map<group, R32 slot position>
 */
export function assignBestThirds(qualifyingGroups: string[]): Map<string, number> {
  const slots = Object.keys(THIRD_ELIGIBLE).map(Number);
  const slotToGroup = new Map<number, string>();

  function dfs(group: string, visited: Set<number>): boolean {
    for (const pos of slots) {
      if (visited.has(pos)) continue;
      if (!THIRD_ELIGIBLE[pos].includes(group)) continue;
      visited.add(pos);
      const cur = slotToGroup.get(pos);
      if (cur === undefined || dfs(cur, visited)) {
        slotToGroup.set(pos, group);
        return true;
      }
    }
    return false;
  }

  for (const group of qualifyingGroups) {
    dfs(group, new Set<number>());
  }

  const result = new Map<string, number>();
  slotToGroup.forEach((group, pos) => result.set(group, pos));
  return result;
}

// Format a slot source string into human-readable text
export function formatSource(src: string): string {
  const pos = parseInt(src[0]);
  const rest = src.slice(1);
  if (pos === 1) return `Winner Grp ${rest}`;
  if (pos === 2) return `Runner-up Grp ${rest}`;
  if (rest.length === 1) return `3rd Grp ${rest}`;
  return `Best 3rd (${rest.split('').join('/')})`;
}

// Return the best 3rd-placed team from the eligible groups
function getBestThird(
  eligibleGroups: string[],
  groupStandings: Record<string, TeamStanding[]>
): string | null {
  const candidates: TeamStanding[] = [];
  for (const g of eligibleGroups) {
    const s = groupStandings[g];
    if (s && s.length >= 3 && s[2].played > 0) candidates.push(s[2]);
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });
  return candidates[0].team;
}

export function getTeamFromSource(
  source: string,
  groupStandings: Record<string, TeamStanding[]>
): string | null {
  if (!source) return null;
  const pos = parseInt(source[0]);
  const rest = source.slice(1);

  // Multi-group 3rd-place slot e.g. "3ABCDF"
  if (pos === 3 && rest.length > 1) {
    return getBestThird(rest.split(''), groupStandings);
  }

  // Simple slot: "1A", "2B", "3C"
  const standings = groupStandings[rest];
  if (!standings || standings.length < pos) return null;
  if (standings[pos - 1].played === 0) return null;
  return standings[pos - 1].team;
}

export function getWinner(homeScore: string, awayScore: string, home: string | null, away: string | null): string | null {
  if (!home || !away) return null;
  if (homeScore === '' || awayScore === '') return null;
  const h = parseInt(homeScore);
  const a = parseInt(awayScore);
  if (isNaN(h) || isNaN(a)) return null;
  if (h === a) return null;
  return h > a ? home : away;
}

export function getTeamFlag(team: string | null): string {
  if (!team) return '';
  return TEAM_FLAGS[team] || '';
}

// ---------------------------------------------------------------------------
// Knockout scores + bracket assembly (shared by the editable Bracket page and
// the read-only "view another user's predictions" page)
// ---------------------------------------------------------------------------

export interface KnockoutScore {
  ft_home: string;
  ft_away: string;
  et_home: string;
  et_away: string;
  pen_home: string;
  pen_away: string;
}

export function emptyScore(): KnockoutScore {
  return { ft_home: '', ft_away: '', et_home: '', et_away: '', pen_home: '', pen_away: '' };
}

// Determine a knockout match winner from FT → ET → penalties.
export function getKnockoutWinner(score: KnockoutScore, home: string | null, away: string | null): string | null {
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

  return getWinner(score.pen_home, score.pen_away, home, away);
}

export interface BracketSlot { home: string | null; away: string | null; pos: number }
export interface BuiltBracket {
  r32: BracketSlot[];
  r16: BracketSlot[];
  qf:  BracketSlot[];
  sf:  BracketSlot[];
  thirdPlace: { home: string | null; away: string | null; pos: number };
  final: { home: string | null; away: string | null; pos: number };
}

// Build the full knockout bracket from predicted group standings + knockout
// scores (keyed "R32-0", "R16-3", "QF-1", "SF-0", "F-0", "3rd-0").
export function buildBracket(
  groupStandings: Record<string, TeamStanding[]>,
  knockoutScores: Record<string, KnockoutScore>,
): BuiltBracket {
  // Rank all third-placed teams; the top 8 advance.
  const allThirds = Object.entries(groupStandings)
    .filter(([, s]) => s.length >= 3 && s[2].played > 0)
    .map(([group, s]) => ({ group, team: s[2].team, s: s[2] }))
    .sort((a, b) => {
      if (b.s.points !== a.s.points) return b.s.points - a.s.points;
      if (b.s.gd    !== a.s.gd)    return b.s.gd    - a.s.gd;
      if (b.s.gf    !== a.s.gf)    return b.s.gf    - a.s.gf;
      return a.team.localeCompare(b.team);
    });
  const top8 = allThirds.slice(0, 8);

  // Bipartite matching assigns each qualifying group to exactly one slot.
  const groupToSlot = assignBestThirds(top8.map(t => t.group));
  const thirdByPos = new Map<number, string | null>();
  top8.forEach(({ group, team }) => {
    const pos = groupToSlot.get(group);
    if (pos !== undefined) thirdByPos.set(pos, team);
  });
  Object.keys(THIRD_ELIGIBLE).forEach(p => {
    const pos = parseInt(p);
    if (!thirdByPos.has(pos)) thirdByPos.set(pos, null);
  });

  const r32 = R32_MATCHUPS.map((m, i) => {
    const resolve = (src: string): string | null => {
      const pos = parseInt(src[0]);
      const rest = src.slice(1);
      if (pos === 3 && rest.length > 1) return thirdByPos.get(i) ?? null;
      return getTeamFromSource(src, groupStandings);
    };
    return { home: resolve(m.home), away: resolve(m.away), pos: i };
  });

  const r16 = R16_PAIRINGS.map(([homePos, awayPos], i) => ({
    home: getKnockoutWinner(knockoutScores[`R32-${homePos}`] || emptyScore(), r32[homePos].home, r32[homePos].away),
    away: getKnockoutWinner(knockoutScores[`R32-${awayPos}`] || emptyScore(), r32[awayPos].home, r32[awayPos].away),
    pos: i,
  }));

  const qf = QF_PAIRINGS.map(([homePos, awayPos], i) => ({
    home: getKnockoutWinner(knockoutScores[`R16-${homePos}`] || emptyScore(), r16[homePos].home, r16[homePos].away),
    away: getKnockoutWinner(knockoutScores[`R16-${awayPos}`] || emptyScore(), r16[awayPos].home, r16[awayPos].away),
    pos: i,
  }));

  const sf: BracketSlot[] = [];
  for (let i = 0; i < 4; i += 2) {
    const wA = getKnockoutWinner(knockoutScores[`QF-${i}`] || emptyScore(), qf[i].home, qf[i].away);
    const wB = getKnockoutWinner(knockoutScores[`QF-${i + 1}`] || emptyScore(), qf[i + 1].home, qf[i + 1].away);
    sf.push({ home: wA, away: wB, pos: i / 2 });
  }

  const sfW0 = getKnockoutWinner(knockoutScores['SF-0'] || emptyScore(), sf[0]?.home, sf[0]?.away);
  const sfW1 = getKnockoutWinner(knockoutScores['SF-1'] || emptyScore(), sf[1]?.home, sf[1]?.away);
  const sfL0 = sfW0 && sf[0]?.home && sf[0]?.away ? (sfW0 === sf[0].home ? sf[0].away : sf[0].home) : null;
  const sfL1 = sfW1 && sf[1]?.home && sf[1]?.away ? (sfW1 === sf[1].home ? sf[1].away : sf[1].home) : null;

  return {
    r32, r16, qf, sf,
    thirdPlace: { home: sfL0, away: sfL1, pos: 0 },
    final: { home: sfW0, away: sfW1, pos: 0 },
  };
}
