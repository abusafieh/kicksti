import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRIES, QUALIFIED_TEAMS } from '../lib/constants';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [country, setCountry] = useState('');
  const [favouriteTeam, setFavouriteTeam] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    if (!country || !favouriteTeam) {
      setError('Please select your country and favourite team');
      return;
    }
    setLoading(true);

    if (!humanVerified) {
      setError('Please confirm you are human');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, `${firstName.trim()} ${lastName.trim()}`, teamName, country, favouriteTeam);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/predict');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl font-display" style={{ color: '#C9A84C' }}>JOIN KICKSTI</h1>
          <p className="text-gray-400 mt-2">Predict. Compete. Win bragging rights.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-bg border border-danger-border rounded-lg px-4 py-3 text-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="input-field"
              placeholder=""
              required
            />
            <p className="text-xs text-gray-500 mt-1">This is your squad name — shown on leaderboards</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="input-field"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="input-field"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input-field"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Country</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Favourite World Cup Team</label>
            <select
              value={favouriteTeam}
              onChange={e => setFavouriteTeam(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select your team</option>
              {QUALIFIED_TEAMS.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* TODO: Replace with Cloudflare Turnstile CAPTCHA before production launch */}
          {/* Get free key at: https://dash.cloudflare.com/?to=/:account/turnstile */}
          <div className="flex items-center gap-3 p-3 bg-elevated border border-border rounded-lg">
            <input
              type="checkbox"
              id="human-check"
              checked={humanVerified}
              onChange={e => setHumanVerified(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <label htmlFor="human-check" className="text-sm text-text-muted">
              I confirm I am a human and not a bot
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
