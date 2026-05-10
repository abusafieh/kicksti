import { useEffect, useState } from 'react';
import { Shield, Plus, Copy, Check, Users, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
}

export default function Leagues() {
  const { user, profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, [user]);

  async function loadTournaments() {
    if (!user) return;
    const { data: memberships } = await supabase
      .from('tournament_members')
      .select('tournament_id')
      .eq('user_id', user.id);

    if (!memberships || memberships.length === 0) {
      setTournaments([]);
      setLoading(false);
      return;
    }

    const tournamentIds = memberships.map(m => m.tournament_id);
    const { data } = await supabase
      .from('private_tournaments')
      .select('*')
      .in('id', tournamentIds);

    if (data) {
      // Get member counts
      const withCounts = await Promise.all(data.map(async t => {
        const { count } = await supabase
          .from('tournament_members')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', t.id);
        return { ...t, member_count: count || 0 };
      }));
      setTournaments(withCounts);
    }
    setLoading(false);
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  async function createTournament() {
    if (!user || !newName.trim()) return;
    setError('');
    setActionLoading(true);

    const inviteCode = generateCode();
    const { data, error: createError } = await supabase
      .from('private_tournaments')
      .insert({
        name: newName.trim(),
        creator_id: user.id,
        invite_code: inviteCode,
      })
      .select()
      .maybeSingle();

    if (createError) {
      setError(createError.message);
      setActionLoading(false);
      return;
    }

    if (data) {
      await supabase.from('tournament_members').insert({
        tournament_id: data.id,
        user_id: user.id,
      });
    }

    setNewName('');
    setShowCreate(false);
    setActionLoading(false);
    loadTournaments();
  }

  async function joinTournament() {
    if (!user || !joinCode.trim()) return;
    setError('');
    setActionLoading(true);

    const { data: tournament } = await supabase
      .from('private_tournaments')
      .select('id')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .maybeSingle();

    if (!tournament) {
      setError('Invalid invite code. Please check and try again.');
      setActionLoading(false);
      return;
    }

    const { error: joinError } = await supabase
      .from('tournament_members')
      .insert({
        tournament_id: tournament.id,
        user_id: user.id,
      });

    if (joinError) {
      if (joinError.code === '23505') {
        setError('You are already a member of this tournament.');
      } else {
        setError(joinError.message);
      }
      setActionLoading(false);
      return;
    }

    setJoinCode('');
    setShowJoin(false);
    setActionLoading(false);
    loadTournaments();
  }

  async function leaveTournament(tournamentId: string) {
    if (!user) return;
    await supabase
      .from('tournament_members')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id);
    loadTournaments();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-display text-white mb-2">MY LEAGUES</h2>
      <p className="text-sm text-gray-400 mb-6">You are automatically in the Global, {profile?.country}, and {profile?.favourite_team} leagues.</p>

      {/* Auto leagues */}
      <div className="space-y-2 mb-8">
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Global League</p>
              <p className="text-xs text-gray-500">All players worldwide</p>
            </div>
          </div>
        </div>
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-lg">
              {profile?.country ? '🌍' : ''}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile?.country || 'Country'} League</p>
              <p className="text-xs text-gray-500">Players from your country</p>
            </div>
          </div>
        </div>
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-lg">
              ⚽
            </div>
            <div>
              <p className="text-sm font-medium text-white">{profile?.favourite_team || 'Team'} Fans League</p>
              <p className="text-xs text-gray-500">Fans of your favourite team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Private tournaments */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display text-white">PRIVATE TOURNAMENTS</h3>
        <div className="flex gap-2">
          <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn-secondary text-xs px-3 py-2">
            Join
          </button>
          <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card mb-4">
          <p className="text-sm font-medium text-white mb-3">Create a new tournament</p>
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Tournament name"
              className="input-field text-sm flex-1"
              maxLength={50}
            />
            <button onClick={createTournament} disabled={actionLoading} className="btn-primary text-sm px-4">
              {actionLoading ? '...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="card mb-4">
          <p className="text-sm font-medium text-white mb-3">Join with invite code</p>
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              className="input-field text-sm flex-1 uppercase tracking-widest"
              maxLength={6}
            />
            <button onClick={joinTournament} disabled={actionLoading} className="btn-primary text-sm px-4">
              {actionLoading ? '...' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 card">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No private tournaments yet.</p>
          <p className="text-gray-500 text-xs mt-1">Create one or join with an invite code.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map(t => (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      <Users className="w-3 h-3 inline mr-1" />{t.member_count} members
                    </span>
                    <button
                      onClick={() => copyCode(t.invite_code)}
                      className="text-xs text-accent hover:underline flex items-center gap-1"
                    >
                      {copied === t.invite_code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {t.invite_code}
                    </button>
                  </div>
                </div>
                {t.creator_id !== user?.id && (
                  <button
                    onClick={() => leaveTournament(t.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="Leave tournament"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
