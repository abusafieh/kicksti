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

// FIFA 2026 R32 bracket structure:
// 24 teams advance from groups (top 2 from each of 12 groups)
// Plus 8 best 3rd-placed teams, but for simplicity we use top 2 per group = 24,
// then the bracket is 32 teams. Actually the WC 2026 has 48 teams, top 2 + best 3rds = 32 in knockout.
// For this bracket we'll advance top 2 from each group (24) + 8 best 3rd-placed (32 total).
// Simplification: we'll use all 12 group winners and 12 runners-up = 24, plus 8 best thirds = 32.

export const R32_MATCHUPS: { home: string; away: string }[] = [
  // Match 1-8 (top half)
  { home: '1A', away: '3C' },
  { home: '2B', away: '2A' },
  { home: '1C', away: '3D' },
  { home: '2D', away: '1B' },
  { home: '1E', away: '3F' },
  { home: '2F', away: '2E' },
  { home: '1G', away: '3H' },
  { home: '2H', away: '1F' },
  // Match 9-16 (bottom half)
  { home: '1I', away: '3J' },
  { home: '2J', away: '2I' },
  { home: '1K', away: '3L' },
  { home: '2L', away: '1J' },
  { home: '1D', away: '3E' },
  { home: '1H', away: '3G' },
  { home: '1L', away: '3I' },
  { home: '2G', away: '2K' },
];

export function getTeamFromSource(
  source: string,
  groupStandings: Record<string, TeamStanding[]>
): string | null {
  if (!source) return null;
  const pos = parseInt(source[0]);
  const group = source.slice(1);
  const standings = groupStandings[group];
  if (!standings || standings.length < pos) return null;
  // Only return if team has played at least 1 match predicted
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
