import { useEffect, useState, useMemo } from 'react';
import { TableProperties } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TEAM_FLAGS } from '../lib/constants';
import { calculateGroupStandings, type TeamStanding } from '../lib/bracket';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
}

export default function Standings() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-display text-white">STANDINGS</h2>
          <p className="text-sm text-gray-400">Predicted group tables based on your scorelines</p>
        </div>
        {hasAnyPredictions && (
          <div className="bg-navy-700 rounded-lg px-3 py-2 text-center">
            <span className="text-lg font-display text-accent">{totalPredicted}</span>
            <span className="text-[10px] text-gray-400 block">predicted</span>
          </div>
        )}
      </div>

      {!hasAnyPredictions && (
        <div className="card text-center py-10 mb-6">
          <TableProperties className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No predictions yet.</p>
          <p className="text-gray-500 text-sm mt-1">
            Enter match scores in the Predict tab to see your projected standings here.
          </p>
        </div>
      )}

      {/* Legend */}
      {hasAnyPredictions && (
        <div className="flex items-center gap-5 mb-5 px-1">
          <span className="flex items-center gap-1.5 text-xs text-accent">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent/30 border border-accent/50" />
            Advances (Top 2)
          </span>
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-400/50" />
            Possible 3rd place
          </span>
        </div>
      )}

      {/* Group tables */}
      <div className="space-y-5">
        {Object.entries(groupStandings).sort().map(([group, standings]) => (
          <GroupTable key={group} group={group} standings={standings} />
        ))}
      </div>
    </div>
  );
}

function GroupTable({ group, standings }: { group: string; standings: TeamStanding[] }) {
  const hasData = standings.some(s => s.played > 0);

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-navy-700 border-b border-navy-600 flex items-center justify-between">
        <span className="text-sm font-display text-white tracking-wide">GROUP {group}</span>
        {hasData && (
          <span className="text-[10px] text-gray-500">
            {standings.reduce((sum, s) => sum + s.played, 0) / 2} / 6 matches
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="text-gray-500 border-b border-navy-700">
              <th className="text-left pl-4 pr-2 py-2.5 font-medium w-8">#</th>
              <th className="text-left px-2 py-2.5 font-medium">Team</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">P</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">W</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">D</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">L</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">GF</th>
              <th className="text-center px-2 py-2.5 font-medium w-8">GA</th>
              <th className="text-center px-2 py-2.5 font-medium w-9">GD</th>
              <th className="text-center px-2 pr-4 py-2.5 font-medium w-9">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const qualifies = idx < 2 && team.played > 0;
              const thirdMaybe = idx === 2 && team.played > 0;
              return (
                <tr
                  key={team.team}
                  className={`border-t border-navy-700/60 transition-colors ${
                    qualifies
                      ? 'bg-accent/[0.04]'
                      : thirdMaybe
                      ? 'bg-amber-500/[0.04]'
                      : ''
                  }`}
                >
                  <td className="pl-4 pr-2 py-2.5">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                        qualifies
                          ? 'bg-accent/20 text-accent'
                          : thirdMaybe
                          ? 'bg-amber-400/20 text-amber-400'
                          : 'text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className={`font-medium ${qualifies ? 'text-white' : 'text-gray-300'}`}>
                      <span className="mr-1.5">{TEAM_FLAGS[team.team] || ''}</span>
                      {team.team}
                    </span>
                  </td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.played}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.won}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.drawn}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.lost}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.gf}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">{team.ga}</td>
                  <td className="text-center px-2 py-2.5 text-gray-400">
                    <span className={team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </span>
                  </td>
                  <td className="text-center px-2 pr-4 py-2.5">
                    <span className={`font-bold ${qualifies ? 'text-accent' : 'text-white'}`}>
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
