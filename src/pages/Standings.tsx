import { useMemo, useState } from 'react';
import { TableProperties } from 'lucide-react';
import { TEAM_ISO_CODES, toEnglishName } from '../lib/constants';
import { calculateGroupStandings, assignBestThirds, THIRD_SLOT_VS, type TeamStanding } from '../lib/bracket';
import { usePredictions } from '../contexts/PredictionsContext';


export default function Standings() {
  const { matches, predictions, loading } = usePredictions();
  const [tab, setTab] = useState<'groups' | 'thirds'>('groups');

  const groupStandings = useMemo(() => {
    const groups = [...new Set(matches.map(m => m.group_name))].sort();
    const standings: Record<string, TeamStanding[]> = {};
    groups.forEach(g => {
      standings[g] = calculateGroupStandings(matches, predictions, g);
    });
    return standings;
  }, [matches, predictions]);

  // Ranked list of all 12 third-placed teams + slot assignments
  const bestThirds = useMemo(() => {
    const thirds = Object.entries(groupStandings)
      .filter(([, s]) => s.length >= 3)
      .map(([group, s]) => ({ group, team: s[2] }))
      .sort((a, b) => {
        // Teams with no predictions go to the bottom
        if (a.team.played === 0 && b.team.played === 0) return a.group.localeCompare(b.group);
        if (a.team.played === 0) return 1;
        if (b.team.played === 0) return -1;
        if (b.team.points !== a.team.points) return b.team.points - a.team.points;
        if (b.team.gd    !== a.team.gd)    return b.team.gd    - a.team.gd;
        if (b.team.gf    !== a.team.gf)    return b.team.gf    - a.team.gf;
        return a.group.localeCompare(b.group);
      });

    // Bipartite matching — same algorithm used in Bracket.tsx
    const top8groups = thirds.slice(0, 8).map(t => t.group);
    const groupToSlot = assignBestThirds(top8groups);
    const slotByGroup = new Map<string, string>(); // group → "vs Winner X"
    groupToSlot.forEach((pos, group) => {
      slotByGroup.set(group, THIRD_SLOT_VS[pos]);
    });

    return thirds.map((t, rank) => ({
      ...t,
      rank: rank + 1,
      qualifies: rank < 8 && t.team.played > 0,
      slot: slotByGroup.get(t.group) ?? null,
    }));
  }, [groupStandings]);

  const hasAnyPredictions = Object.keys(predictions).length > 0;
  const totalPredicted = Object.keys(predictions).length;

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
          <h2 className="text-4xl font-display text-text-primary">STANDINGS</h2>
          <p className="text-sm text-text-muted">Predicted group tables based on your scorelines</p>
        </div>
        {hasAnyPredictions && (
          <div className="bg-elevated border border-border rounded-lg px-3 py-2 text-center">
            <span className="text-lg font-display text-accent">{totalPredicted}</span>
            <span className="text-[10px] text-text-muted block">predicted</span>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('groups')}
          className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
            tab === 'groups'
              ? 'bg-accent text-white'
              : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
          }`}
        >
          Group Standings
        </button>
        <button
          onClick={() => setTab('thirds')}
          className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
            tab === 'thirds'
              ? 'bg-accent text-white'
              : 'bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent/40'
          }`}
        >
          Best 3rd Teams
        </button>
      </div>

      {/* ── Group Standings tab ── */}
      {tab === 'groups' && (
        <>
          {!hasAnyPredictions && (
            <div className="card text-center py-10 mb-6">
              <TableProperties className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No predictions yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Enter match scores in the Predict tab to see your projected standings here.
              </p>
            </div>
          )}

          {hasAnyPredictions && (
            <div className="flex items-center gap-6 mb-5 px-1">
              <span className="flex items-center gap-2 text-sm text-accent font-medium">
                <span className="w-3 h-3 rounded-sm bg-accent/30 border border-accent/50" />
                Advances (Top 2)
              </span>
              <span className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                <span className="w-3 h-3 rounded-sm bg-amber-400/30 border border-amber-400/50" />
                Possible 3rd place
              </span>
            </div>
          )}

          <div className="space-y-5">
            {Object.entries(groupStandings).sort().map(([group, standings]) => (
              <GroupTable key={group} group={group} standings={standings} />
            ))}
          </div>
        </>
      )}

      {/* ── Best 3rd Teams tab ── */}
      {tab === 'thirds' && (
        <BestThirdsTable thirds={bestThirds} hasAnyPredictions={hasAnyPredictions} />
      )}
    </div>
  );
}

// ── Group standings table ────────────────────────────────────────────────────

function GroupTable({ group, standings }: { group: string; standings: TeamStanding[] }) {
  const hasData = standings.some(s => s.played > 0);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-3 bg-elevated border-b border-border flex items-center justify-between">
        <span className="text-base font-display text-nav tracking-wide">GROUP {group}</span>
        {hasData && (
          <span className="text-sm text-gray-500">
            {standings.reduce((sum, s) => sum + s.played, 0) / 2} / 6 matches
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-text-muted border-b border-border">
              <th className="text-left pl-4 pr-2 py-3 font-semibold w-10">#</th>
              <th className="text-left px-2 py-3 font-semibold">Team</th>
              <th className="text-center px-2 py-3 font-semibold w-10">P</th>
              <th className="text-center px-2 py-3 font-semibold w-10">W</th>
              <th className="text-center px-2 py-3 font-semibold w-10">D</th>
              <th className="text-center px-2 py-3 font-semibold w-10">L</th>
              <th className="text-center px-2 py-3 font-semibold w-10">GF</th>
              <th className="text-center px-2 py-3 font-semibold w-10">GA</th>
              <th className="text-center px-2 py-3 font-semibold w-10">GD</th>
              <th className="text-center px-2 pr-4 py-3 font-semibold w-12">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const qualifies = idx < 2 && team.played > 0;
              const thirdMaybe = idx === 2 && team.played > 0;
              return (
                <tr
                  key={team.team}
                  className={`border-t border-border transition-colors ${
                    qualifies ? 'bg-accent/[0.04]' : thirdMaybe ? 'bg-amber-500/[0.04]' : ''
                  }`}
                >
                  <td className="pl-4 pr-2 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                      qualifies ? 'bg-accent/20 text-accent' : thirdMaybe ? 'bg-warning-bg text-warning' : 'text-text-faint'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`flex items-center gap-2 font-semibold ${qualifies ? 'text-text-primary' : 'text-text-muted'}`}>
                      {TEAM_ISO_CODES[team.team] && (
                        <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[team.team]}.png`} width={24} alt={team.team} className="rounded-sm shrink-0" />
                      )}
                      {toEnglishName(team.team)}
                    </span>
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.played}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.won}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.drawn}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.lost}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.gf}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.ga}</td>
                  <td className="text-center px-2 py-3 text-text-muted">
                    <span className={team.gd > 0 ? 'text-accent' : team.gd < 0 ? 'text-danger' : ''}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </span>
                  </td>
                  <td className="text-center px-2 pr-4 py-3">
                    <span className={`font-bold text-base ${qualifies ? 'text-accent' : 'text-text-primary'}`}>
                      {team.points}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Best 3rd Teams table ─────────────────────────────────────────────────────

function BestThirdsTable({
  thirds,
  hasAnyPredictions,
}: {
  thirds: { rank: number; group: string; team: TeamStanding; qualifies: boolean; slot: string | null }[];
  hasAnyPredictions: boolean;
}) {
  if (!hasAnyPredictions) {
    return (
      <div className="card text-center py-10">
        <TableProperties className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No predictions yet.</p>
        <p className="text-gray-500 text-sm mt-1">Predict group stage matches to see the best 3rd-place rankings.</p>
      </div>
    );
  }

  const qualifying = thirds.filter(t => t.qualifies);
  const eliminated = thirds.filter(t => !t.qualifies);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-amber-500/[0.07] border border-amber-500/25 rounded-xl px-5 py-3 text-sm text-amber-700">
        <strong>8 of the 12 third-placed teams</strong> advance to the Round of 32.
        They are ranked by points → goal difference → goals scored across all their group matches.
        The bracket slot each team fills depends on which groups the top-8 come from.
      </div>

      {/* Qualifying 8 */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-5 py-3 bg-accent/[0.06] border-b border-accent/20 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent/60" />
          <span className="text-base font-display text-accent tracking-wide">QUALIFYING (TOP 8)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-text-muted border-b border-border">
                <th className="text-left pl-4 pr-2 py-3 font-semibold w-10">#</th>
                <th className="text-left px-2 py-3 font-semibold w-16">Grp</th>
                <th className="text-left px-2 py-3 font-semibold">Team</th>
                <th className="text-center px-2 py-3 font-semibold w-10">P</th>
                <th className="text-center px-2 py-3 font-semibold w-10">W</th>
                <th className="text-center px-2 py-3 font-semibold w-10">D</th>
                <th className="text-center px-2 py-3 font-semibold w-10">L</th>
                <th className="text-center px-2 py-3 font-semibold w-10">GD</th>
                <th className="text-center px-2 py-3 font-semibold w-12">Pts</th>
                <th className="text-left px-2 pr-4 py-3 font-semibold">R32 Opponent</th>
              </tr>
            </thead>
            <tbody>
              {qualifying.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-text-faint italic">
                    Predict more group stage matches to see rankings
                  </td>
                </tr>
              )}
              {qualifying.map(({ rank, group, team, slot }) => (
                <tr key={group} className="border-t border-border bg-accent/[0.03]">
                  <td className="pl-4 pr-2 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold bg-accent/20 text-accent">
                      {rank}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-display text-nav tracking-wide text-sm">{group}</td>
                  <td className="px-2 py-3">
                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                      {TEAM_ISO_CODES[team.team] && (
                        <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[team.team]}.png`} width={24} alt={team.team} className="rounded-sm shrink-0" />
                      )}
                      {toEnglishName(team.team)}
                    </span>
                  </td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.played}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.won}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.drawn}</td>
                  <td className="text-center px-2 py-3 text-text-muted">{team.lost}</td>
                  <td className="text-center px-2 py-3">
                    <span className={team.gd > 0 ? 'text-accent' : team.gd < 0 ? 'text-danger' : 'text-text-muted'}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </span>
                  </td>
                  <td className="text-center px-2 py-3">
                    <span className="font-bold text-base text-accent">{team.points}</span>
                  </td>
                  <td className="px-2 pr-4 py-3 text-sm text-text-muted">
                    {slot ?? <span className="italic text-text-faint">TBD</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Eliminated */}
      {eliminated.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-card opacity-70">
          <div className="px-5 py-3 bg-elevated border-b border-border">
            <span className="text-base font-display text-text-muted tracking-wide">ELIMINATED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  <th className="text-left pl-4 pr-2 py-3 font-semibold w-10">#</th>
                  <th className="text-left px-2 py-3 font-semibold w-16">Grp</th>
                  <th className="text-left px-2 py-3 font-semibold">Team</th>
                  <th className="text-center px-2 py-3 font-semibold w-10">P</th>
                  <th className="text-center px-2 py-3 font-semibold w-10">W</th>
                  <th className="text-center px-2 py-3 font-semibold w-10">D</th>
                  <th className="text-center px-2 py-3 font-semibold w-10">L</th>
                  <th className="text-center px-2 py-3 font-semibold w-10">GD</th>
                  <th className="text-center px-2 pr-4 py-3 font-semibold w-12">Pts</th>
                </tr>
              </thead>
              <tbody>
                {eliminated.map(({ rank, group, team }) => (
                  <tr key={group} className="border-t border-border">
                    <td className="pl-4 pr-2 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-text-faint">{rank}</span>
                    </td>
                    <td className="px-2 py-3 font-display text-text-muted tracking-wide text-sm">{group}</td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-2 text-text-muted">
                        {TEAM_ISO_CODES[team.team] && (
                          <img src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[team.team]}.png`} width={24} alt={team.team} className="rounded-sm shrink-0 opacity-50" />
                        )}
                        {toEnglishName(team.team)}
                      </span>
                    </td>
                    <td className="text-center px-2 py-3 text-text-faint">{team.played}</td>
                    <td className="text-center px-2 py-3 text-text-faint">{team.won}</td>
                    <td className="text-center px-2 py-3 text-text-faint">{team.drawn}</td>
                    <td className="text-center px-2 py-3 text-text-faint">{team.lost}</td>
                    <td className="text-center px-2 py-3 text-text-faint">
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="text-center px-2 pr-4 py-3 font-bold text-text-muted">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
