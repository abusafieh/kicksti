import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface SharedMatch {
  id: string;
  home_team: string;
  away_team: string;
  group_name: string;
  kickoff_time: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

interface PredictionsContextType {
  matches: SharedMatch[];
  predictions: Record<string, { home: string; away: string }>;
  updatePrediction: (matchId: string, home: string, away: string) => void;
  loading: boolean;
}

const PredictionsContext = createContext<PredictionsContextType | undefined>(undefined);

export function PredictionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<SharedMatch[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });
    if (matchData) setMatches(matchData);

    if (user) {
      const { data: predData } = await supabase
        .from('predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', user.id);
      if (predData) {
        const map: Record<string, { home: string; away: string }> = {};
        predData.forEach(p => {
          map[p.match_id] = {
            home: p.predicted_home_score.toString(),
            away: p.predicted_away_score.toString(),
          };
        });
        setPredictions(map);
      }
    }
    setLoading(false);
  }

  function updatePrediction(matchId: string, home: string, away: string) {
    setPredictions(prev => ({ ...prev, [matchId]: { home, away } }));
  }

  return (
    <PredictionsContext.Provider value={{ matches, predictions, updatePrediction, loading }}>
      {children}
    </PredictionsContext.Provider>
  );
}

export function usePredictions() {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error('usePredictions must be used within PredictionsProvider');
  return ctx;
}
