import { Link } from 'react-router-dom';
import { Target, Trophy, BarChart3, Globe, Flag, Users, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border shadow-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display tracking-wider" style={{ color: '#C9A84C' }}>KICKSTI</Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:inline-block text-sm text-text-muted hover:text-text-primary transition-colors font-medium">
              Sign In
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors">
              Play Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 bg-gradient-to-b from-background to-elevated">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
        </div>
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-dim border border-accent-border rounded-full mb-8">
            <span className="text-sm text-accent font-medium">FIFA World Cup 2026</span>
          </div>
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-display tracking-wider mb-4" style={{ color: '#C9A84C' }}>
            KICKSTI
          </h1>
          <p className="text-2xl sm:text-3xl font-display text-accent mb-4">
            Predict to Win
          </p>
          <p className="text-text-muted text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
            The free FIFA World Cup 2026 prediction game. No entry fees. No gambling. Just football.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent-hover transition-all hover:scale-105 shadow-card"
            >
              Play Free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 border border-border text-text-primary rounded-lg font-semibold text-lg hover:border-accent/40 hover:bg-elevated transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-display text-nav text-center mb-16 tracking-wide">
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-background border border-border rounded-2xl p-8 text-center hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center mx-auto mb-5">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-display text-nav mb-3">PREDICT</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Enter your scoreline predictions for all 48 group stage matches before they kick off
              </p>
            </div>
            <div className="bg-background border border-border rounded-2xl p-8 text-center hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-display text-nav mb-3">SCORE POINTS</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Earn up to 8 points per match. Exact scores, correct results, and more
              </p>
            </div>
            <div className="bg-background border border-border rounded-2xl p-8 text-center hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-14 h-14 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-display text-nav mb-3">COMPETE</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Climb the Global, Country, and Team leaderboards. Create private tournaments with friends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-display text-nav text-center mb-16 tracking-wide">
            SCORING SYSTEM
          </h2>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="text-left px-6 py-4 text-sm font-medium text-text-muted">What you predict correctly</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-text-muted">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-6 py-4 text-sm text-text-primary">Correct result (Win/Draw/Loss)</td>
                  <td className="px-6 py-4 text-sm text-accent font-semibold text-right">3 pts</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-6 py-4 text-sm text-text-primary">Exact scoreline</td>
                  <td className="px-6 py-4 text-sm text-accent font-semibold text-right">5 pts</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-6 py-4 text-sm text-text-primary">One team's score correct</td>
                  <td className="px-6 py-4 text-sm text-accent font-semibold text-right">2 pts</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">Maximum per match</td>
                  <td className="px-6 py-4 text-sm text-accent font-bold text-right">8 pts</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-text-muted text-sm text-center mt-6">
            Knockout stage matches offer up to 12 points including extra time and penalty predictions
          </p>
        </div>
      </section>

      {/* Leagues */}
      <section className="py-24 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-display text-nav text-center mb-16 tracking-wide">
            COMPETE YOUR WAY
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-background border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-display text-nav mb-1">GLOBAL LEAGUE</h3>
                <p className="text-sm text-text-muted">Rank against every player worldwide</p>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center shrink-0">
                <Flag className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-display text-nav mb-1">COUNTRY LEAGUE</h3>
                <p className="text-sm text-text-muted">Represent your nation</p>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-display text-nav mb-1">TEAM LEAGUE</h3>
                <p className="text-sm text-text-muted">Compete with fans of your favourite team</p>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-accent/40 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 bg-accent-dim border border-accent-border rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-display text-nav mb-1">PRIVATE TOURNAMENTS</h3>
                <p className="text-sm text-text-muted">Create a group with friends using a 6-character invite code</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 text-center bg-nav">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-display text-white tracking-wide mb-4">
            FREE TO PLAY. FOREVER.
          </h2>
          <p className="text-[rgba(255,255,255,0.65)] text-lg mb-10">
            No entry fees. No payments. No gambling. Ever.
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-4 bg-[#34d399] text-nav rounded-lg font-semibold text-lg hover:bg-[#6ee7b7] transition-all hover:scale-105"
          >
            Start Predicting Free
          </Link>
          <p className="mt-6 text-[rgba(255,255,255,0.45)] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#34d399] hover:underline">Sign in</Link>
          </p>
          <div className="mt-12">
            <p className="text-2xl font-display tracking-wider" style={{ color: '#C9A84C' }}>KICKSTI</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)] mt-1">kicksti.com</p>
            <p className="text-xs text-[rgba(255,255,255,0.35)] mt-1">@kicksti</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 bg-surface">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>KICKSTI &copy; 2026</span>
          <span className="text-accent font-medium">Predict to Win</span>
          <div className="flex gap-4">
            <span>@kicksti on X</span>
            <span>Instagram</span>
            <span>TikTok</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
