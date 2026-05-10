import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Trophy, Target, Shield, User, GitBranch, TableProperties } from 'lucide-react';

const desktopNavItems = [
  { to: '/predict', icon: Target, label: 'Predict' },
  { to: '/standings', icon: TableProperties, label: 'Standings' },
  { to: '/bracket', icon: GitBranch, label: 'Bracket' },
  { to: '/leaderboard', icon: Trophy, label: 'Board' },
  { to: '/leagues', icon: Shield, label: 'Leagues' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const mobileNavItems = [
  { to: '/predict', icon: Target, label: 'Predict' },
  { to: '/standings', icon: TableProperties, label: 'Standings' },
  { to: '/bracket', icon: GitBranch, label: 'Bracket' },
  { to: '/leaderboard', icon: Trophy, label: 'Board' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-800 border-r border-navy-600 fixed h-full z-30">
        <div className="p-6">
          <h1 className="text-3xl font-display text-white tracking-wider">KICKSTI</h1>
          <p className="text-xs text-gray-500 mt-1">World Cup 2026</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {desktopNavItems.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-navy-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-600 z-30">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  isActive ? 'text-accent' : 'text-gray-500'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
