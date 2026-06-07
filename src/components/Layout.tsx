import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { COUNTRY_FLAGS, TEAM_ISO_CODES } from '../lib/constants';

const navItems = [
  { to: '/predict',     label: 'Predict' },
  { to: '/standings',   label: 'Standings' },
  { to: '/bracket',     label: 'Bracket' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/leagues',     label: 'Leagues' },
  { to: '/profile',     label: 'Profile' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [predCount, setPredCount] = useState(0);
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  useEffect(() => {
    if (user) fetchUserStats();
  }, [user]);

  useEffect(() => {
    if (user) {
      const cached = localStorage.getItem(`kicksti_last_rank_${user.id}`);
      if (cached) setGlobalRank(parseInt(cached));
    }
  }, [user]);

  async function fetchUserStats() {
    if (!user) return;
    const { data } = await supabase
      .from('predictions')
      .select('points_awarded')
      .eq('user_id', user.id);
    if (data) {
      setTotalPoints(data.reduce((sum, p) => sum + (p.points_awarded || 0), 0));
      setPredCount(data.length);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const flag = profile?.country ? (COUNTRY_FLAGS[profile.country] || '') : '';
  const teamName = profile?.team_name || profile?.display_name || '—';

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top Navigation Bar ── */}
      <header className="bg-nav sticky top-0 z-[100] shadow-md">
        <div className="flex items-center h-[60px] px-4 lg:px-6 gap-4">

          {/* Logo */}
          <NavLink to="/predict" className="text-2xl font-display tracking-widest shrink-0 mr-2" style={{ color: '#C9A84C' }}>
            KICKSTI
          </NavLink>

          {/* Nav links — desktop */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 text-[15px] font-medium rounded transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-accent border-b-2 border-accent rounded-none'
                      : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sign out — desktop */}
          <button
            onClick={handleSignOut}
            className="hidden lg:flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition-colors ml-auto shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden ml-auto text-white/80 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* ── Mobile Slide-In Menu ── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-nav flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/10">
              <span className="text-xl font-display tracking-widest" style={{ color: '#C9A84C' }}>KICKSTI</span>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile user panel */}
            <div className="mx-4 mt-4 bg-white/10 rounded-xl p-4">
              <p className="text-base font-bold truncate" style={{ color: '#C9A84C' }}>
                {profile?.team_name || profile?.display_name || '—'}
              </p>
              {profile?.team_name && profile?.display_name && (
                <p className="text-sm font-bold text-white/80 mt-1 flex items-center gap-1.5">
                  <span className="truncate">{profile.display_name}</span>
                  {profile.country && TEAM_ISO_CODES[profile.country] && (
                    <img
                      src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[profile.country]}.png`}
                      width={18}
                      alt={profile.country}
                      className="inline-block rounded shrink-0"
                    />
                  )}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(201,168,76,0.55)' }}>Points</p>
                  <p className="font-bold text-base" style={{ color: '#C9A84C' }}>{totalPoints ?? '—'}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(201,168,76,0.55)' }}>Rank</p>
                  <p className="font-bold text-base" style={{ color: '#C9A84C' }}>{globalRank ? `#${globalRank.toLocaleString()}` : '—'}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 mt-4 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/20 text-accent'
                        : 'text-white/65 hover:text-white hover:bg-white/8'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Left user panel — desktop only */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-surface">

          {/* Stats card */}
          <div className="p-4 border-b border-border">
            <div className="bg-nav rounded-xl p-4">
              <p className="text-lg font-bold truncate" style={{ color: '#C9A84C' }}>
                {profile?.team_name || profile?.display_name || '—'}
              </p>
              {profile?.team_name && profile?.display_name && (
                <p className="text-sm font-bold text-white/80 mt-1 flex items-center gap-1.5">
                  <span className="truncate">{profile.display_name}</span>
                  {profile.country && TEAM_ISO_CODES[profile.country] && (
                    <img
                      src={`https://flagcdn.com/w40/${TEAM_ISO_CODES[profile.country]}.png`}
                      width={18}
                      alt={profile.country}
                      className="inline-block rounded shrink-0"
                    />
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-faint">Total Points</span>
                <span className="text-lg font-bold text-text-primary">{totalPoints ?? '—'}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-faint">Overall Rank</span>
                <span className="text-base font-bold text-text-primary">
                  {globalRank ? `#${globalRank.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-faint">Predicted</span>
                <span className="text-base font-bold text-text-primary">{predCount}</span>
              </div>
            </div>
          </div>

          {/* Favourite team */}
          {profile?.favourite_team && (
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-1">Favourite Team</p>
              <p className="text-sm font-medium text-text-primary">{profile.favourite_team}</p>
            </div>
          )}
        </aside>

        {/* Main scrollable content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
