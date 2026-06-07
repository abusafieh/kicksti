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

  useEffect(() => { loadTournaments(); }, [user]);

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
      .insert({ name: newName.trim(), creator_id: user.id, invite_code: inviteCode })
      .select()
      .maybeSingle();

    if (createError) { setError(createError.message); setActionLoading(false); return; }

    if (data) {
      await supabase.from('tournament_members').insert({ tournament_id: data.id, user_id: user.id });
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
      .insert({ tournament_id: tournament.id, user_id: user.id });

    if (joinError) {
      setError(joinError.code === '23505' ? 'You are already a member of this tournament.' : joinError.message);
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
    await supabase.from('tournament_members').delete().eq('tournament_id', tournamentId).eq('user_id', user.id);
    loadTournaments();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="px-6 py-6">
      <h2 className="text-4xl font-display text-text-primary mb-2">MY LEAGUES</h2>
      <p className="text-base text-text-muted mb-8">
        You are automatically in the Global, {profile?.country}, and {profile?.favourite_team} leagues.
      </p>

      {/* Auto leagues */}
      <div className="space-y-3 mb-10">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-accent" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">Global League</p>
            <p className="text-sm text-text-muted">All players worldwide</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🌍
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{profile?.country || 'Country'} League</p>
            <p className="text-sm text-text-muted">Players from your country</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl shrink-0">
            ⚽
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">{profile?.favourite_team || 'Team'} Fans League</p>
            <p className="text-sm text-text-muted">Fans of your favourite team</p>
          </div>
        </div>
      </div>

      {/* Private tournaments header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-2xl font-display text-text-primary">PRIVATE TOURNAMENTS</h3>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
            className="btn-secondary text-sm px-5 py-2.5"
          >
            Join
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
            className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-5">
          <p className="text-base font-semibold text-text-primary mb-4">Create a new tournament</p>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Tournament name"
              className="input-field text-base flex-1"
              maxLength={50}
            />
            <button onClick={createTournament} disabled={actionLoading} className="btn-primary text-base px-6">
              {actionLoading ? '...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="card p-5 mb-5">
          <p className="text-base font-semibold text-text-primary mb-4">Join with invite code</p>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              className="input-field text-base flex-1 uppercase tracking-widest"
              maxLength={6}
            />
            <button onClick={joinTournament} disabled={actionLoading} className="btn-primary text-base px-6">
              {actionLoading ? '...' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* Tournament list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16 card">
          <Users className="w-14 h-14 text-text-faint mx-auto mb-4" />
          <p className="text-base text-text-muted">No private tournaments yet.</p>
          <p className="text-sm text-text-faint mt-1">Create one or join with an invite code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-text-primary">{t.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-text-muted flex items-center gap-1.5">
                      <Users className="w-4 h-4" />{t.member_count} members
                    </span>
                    <button
                      onClick={() => copyCode(t.invite_code)}
                      className="text-sm text-accent hover:underline flex items-center gap-1.5 font-mono font-bold tracking-widest"
                    >
                      {copied === t.invite_code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {t.invite_code}
                    </button>
                  </div>
                </div>
                {t.creator_id !== user?.id && (
                  <button
                    onClick={() => leaveTournament(t.id)}
                    className="p-2.5 text-text-muted hover:text-red-400 transition-colors"
                    title="Leave tournament"
                  >
                    <LogOut className="w-5 h-5" />
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
